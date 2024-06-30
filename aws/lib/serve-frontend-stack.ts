import {
  CfnOutput,
  Duration,
  RemovalPolicy,
  Stack,
  StackProps,
} from "aws-cdk-lib";
import { Construct } from "constructs";
import * as iam from "aws-cdk-lib/aws-iam";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as cloudFront from "aws-cdk-lib/aws-cloudfront";
import * as cloudFrontOrigins from "aws-cdk-lib/aws-cloudfront-origins";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";

export class ServeFrontendStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const siteBucket = new s3.Bucket(this, "SiteBucket", {
      versioned: false,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    new CfnOutput(this, "Bucket", { value: siteBucket.bucketName });

    const cloudFrontOAI = new cloudFront.OriginAccessIdentity(
      this,
      "CloudFrontOAI",
      { comment: "Origin Access Identity (OAI) for SiteBucket" }
    );

    const distribution = new cloudFront.Distribution(this, "SiteDistribution", {
      defaultRootObject: "index.html",
      errorResponses: [404, 403].map((httpStatus) => ({
        httpStatus,
        ttl: Duration.seconds(0),
        responseHttpStatus: 200,
        responsePagePath: "/index.html",
      })),
      defaultBehavior: {
        origin: new cloudFrontOrigins.S3Origin(siteBucket, {
          originAccessIdentity: cloudFrontOAI,
        }),
        viewerProtocolPolicy: cloudFront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
    });

    new CfnOutput(this, "DistributionId", {
      value: distribution.distributionId,
    });

    // siteBucket.grantRead(cloudFrontOAI);

    siteBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ["s3:GetObject"],
        resources: [siteBucket.arnForObjects("*")],
        principals: [
          new iam.CanonicalUserPrincipal(
            cloudFrontOAI.cloudFrontOriginAccessIdentityS3CanonicalUserId
          ),
        ],
      })
    );

    new s3deploy.BucketDeployment(this, "SiteDeployWithInvalidation", {
      sources: [s3deploy.Source.asset("../dist")],
      destinationBucket: siteBucket,
      distribution,
      distributionPaths: ["/*"],
    });

    new CfnOutput(this, "DistributionDomainName", {
      value: distribution.domainName,
    });
  }
}
