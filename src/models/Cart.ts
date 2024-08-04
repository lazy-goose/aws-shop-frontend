import { Product } from "~/models/Product";

export type CartItem = {
  product: Product;
  count: number;
};

export type CartItemWithProductRef = {
  productId: string;
  count: number;
};

export type Cart = {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  status: "OPEN" | "ORDERED";
  items: CartItemWithProductRef[];
};
