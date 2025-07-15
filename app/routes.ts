import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("/decks/:id", "routes/deck.tsx"),
  route("/decks", "routes/decks.tsx"),
  route("/players", "routes/players.tsx"),
  route("/games", "routes/games.tsx"),
  route("/stats", "routes/stats.tsx"),
] satisfies RouteConfig;
