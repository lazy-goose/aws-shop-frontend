import React from "react";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import axios, { AxiosError, AxiosResponse } from "axios";
import { getReasonPhrase } from "http-status-codes";

type CSVFileImportProps = {
  url: string;
  title: string;
};

export default function CSVFileImport({ url, title }: CSVFileImportProps) {
  const [file, setFile] = React.useState<File>();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setFile(file);
    }
  };

  const removeFile = () => {
    setFile(undefined);
  };

  const uploadFile = async (file: File, authz = true) => {
    const logRequest = (response: AxiosResponse | AxiosError) => {
      if (response instanceof AxiosError) {
        console.error(response.message);
        console.log(response);
        return { isError: true };
      }
      const message = response.statusText || getReasonPhrase(response.status);
      console.log(message);
      console.log(response);
      return { isError: false };
    };

    console.log("1. Trying to get presigned url from:", url);
    const getResponse = await axios.get(url, {
      params: {
        name: encodeURIComponent(file.name),
      },
      headers: {
        Authorization: `Basic ${localStorage.getItem("authorization_token")}`,
      },
    });
    const { isError: isGetError } = logRequest(getResponse);
    if (isGetError) {
      return;
    }

    const presignedUrl = getResponse.data;
    if (!presignedUrl) {
      // prettier-ignore
      console.error("Unable to get presigned url. Expected string but got:", presignedUrl);
      return;
    }
    if (file.type !== "text/csv") {
      console.error("The uploaded file must be of type 'text/csv'");
      return;
    }
    console.log(`2. Uploading file '${file.name}' to:`, presignedUrl);
    const putResponse = await axios.put(getResponse.data, file, {
      headers: {
        "Content-Type": file.type,
      },
    });
    const { isError: isPutError } = logRequest(putResponse);
    if (isPutError) {
      return;
    }
    setFile(undefined);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      {!file ? (
        <input type="file" onChange={onFileChange} />
      ) : (
        <div>
          <button onClick={() => removeFile()}>Remove file</button>
          <button onClick={() => uploadFile(file)}>Upload file</button>
        </div>
      )}
    </Box>
  );
}
