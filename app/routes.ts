import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("/deck/:id", "routes/deck.tsx"),
] satisfies RouteConfig;
