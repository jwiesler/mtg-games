/// <reference types="vite-plugin-svgr/client" />
import * as React from "react";
import { CacheProvider } from "@emotion/react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Toolbar from "@mui/material/Toolbar";
import {
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
} from "react-router";

import type { Route } from "./+types/root";
import createEmotionCache from "./createCache";
import MtgLogo from "./mtg.svg?react";
import AppTheme from "./theme";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <AppBar position="static" color="primary" elevation={2}>
          <Toolbar>
            <Container
              maxWidth="lg"
              sx={{
                display: "flex",
                justifyContent: "center",
              }}
            >
              <Link
                to="/"
                style={{
                  color: "inherit",
                  textDecoration: "none",
                }}
              >
                <MtgLogo
                  fill="white"
                  height="1.5em"
                  width="8em"
                  fontSize="2em"
                  display="block"
                />
              </Link>
            </Container>
          </Toolbar>
        </AppBar>
        <Container maxWidth="lg" sx={{ mt: 4 }}>
          {children}
        </Container>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

const cache = createEmotionCache({ key: "mui", prepend: true });

export default function App() {
  if (typeof window !== "undefined") {
    return (
      <CacheProvider value={cache}>
        <AppTheme>
          <Outlet />
        </AppTheme>
      </CacheProvider>
    );
  }
  return (
    <AppTheme>
      <Outlet />
    </AppTheme>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <Box component="main" sx={{ pt: 8, p: 2, maxWidth: "lg", mx: "auto" }}>
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <Box component="pre" sx={{ width: "100%", p: 2, overflowX: "auto" }}>
          <code>{stack}</code>
        </Box>
      )}
    </Box>
  );
}
