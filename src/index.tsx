import React from "react";
import { createRoot } from "react-dom/client";
import App from "~/components/App/App";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "react-query";
import { ReactQueryDevtools } from "react-query/devtools";
import { theme } from "~/theme";
import axios from "axios";
import toast, { ErrorIcon, Toaster } from "react-hot-toast";
import { Box, Slide, Stack, Typography } from "@mui/material";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: false, staleTime: Infinity },
  },
});

if (import.meta.env.DEV) {
  const { worker } = await import("./mocks/browser");
  worker.start({ onUnhandledRequest: "bypass" });
}

const customErrorToast = (heading: string, message: string) => {
  return toast.custom((t) => (
    <Slide direction="left" in={t.visible}>
      <Box
        sx={{
          padding: "8px 12px",
          minWidth: 225,
          color: "#363636",
          backgroundColor: "#ffffff",
          borderRadius: "10px",
          boxShadow:
            "0 3px 10px rgba(0, 0, 0, 0.1), 0 3px 3px rgba(0, 0, 0, 0.05)",
        }}
      >
        <Stack direction="row" alignItems="center" gap={2}>
          <ErrorIcon />
          <Stack>
            <Typography color="#ff4b4b" fontWeight="bold">
              {heading}
            </Typography>
            <Typography>{message}</Typography>
          </Stack>
        </Stack>
      </Box>
    </Slide>
  ));
};

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    switch (error.response.status) {
      case 401:
        customErrorToast(
          "401 Unauthorized",
          "Incorrect authentication credentials"
        );
        break;
      case 403:
        customErrorToast("403 Forbidden", "Access is denied");
        break;
    }
    return error;
  }
);

const container = document.getElementById("app");
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <App />
          <Toaster
            position="top-right"
            containerStyle={{ top: 80, right: 15 }}
          />
        </ThemeProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);
