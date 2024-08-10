import axios, { AxiosError } from "axios";
import React from "react";
import { useQuery, useQueryClient, useMutation } from "react-query";
import API_PATHS from "~/constants/apiPaths";
import { Cart, CartItem } from "~/models/Cart";
import { Product } from "~/models/Product";

export function useCart() {
  return useQuery<CartItem[], AxiosError>("cart", async () => {
    const resp = await axios.get<Cart>(`${API_PATHS.bff}/cart`, {
      headers: {
        Authorization: `Basic ${localStorage.getItem("authorization_token")}`,
      },
    });
    if (!resp.data) {
      throw new Error("Unable to fetch cart");
    }
    const items = await Promise.all(
      resp.data.items.map(async ({ productId, ...rest }) => {
        // prettier-ignore
        const res = await axios.get<Product>(`${API_PATHS.bff}/product/${productId}`);
        return { product: res.data, ...rest };
      })
    );
    return items.filter((item) => item.product);
  });
}

export function useCartData() {
  const queryClient = useQueryClient();
  return queryClient.getQueryData<CartItem[]>("cart");
}

export function useInvalidateCart() {
  const queryClient = useQueryClient();
  return React.useCallback(
    () => queryClient.invalidateQueries("cart", { exact: true }),
    []
  );
}

export function useUpsertCart() {
  return useMutation(({ product, count }: CartItem) => {
    const updateItems = { items: [{ productId: product.id, count }] };
    return axios.put<CartItem[]>(`${API_PATHS.bff}/cart`, updateItems, {
      headers: {
        Authorization: `Basic ${localStorage.getItem("authorization_token")}`,
      },
    });
  });
}
