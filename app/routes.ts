import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("/decks/:id", "routes/deck.tsx"),
  route("/decks", "routes/decks.tsx"),
] satisfies RouteConfig;
