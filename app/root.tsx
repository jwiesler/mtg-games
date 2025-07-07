import * as React from "react";
import {
  isRouteErrorResponse,
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import { CacheProvider } from "@emotion/react";
import Box from "@mui/material/Box";
import AppTheme from "./theme";
import createEmotionCache from "./createCache";

import type { Route } from "./+types/root";
import { AppBar, Container, Toolbar } from "@mui/material";

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
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Link
                to="/"
                title="Remix"
                style={{
                  color: "inherit",
                  fontSize: "2em",
                  textDecoration: "none",
                }}
              >
                Magic
              </Link>
              {/* <Box
              component="nav"
              aria-label="Main navigation"
              className="remix-app__header-nav"
            >
              <Box
                component="ul"
                sx={{
                  listStyle: "none",
                  m: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                }}
              >
                
              </Box>
            </Box> */}
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

const cache = createEmotionCache();

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
