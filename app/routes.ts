import { type RouteConfig, route } from "@react-router/dev/routes";

let baseName = process.env.BASE_NAME ?? "";
if (!baseName.startsWith("/")) {
  baseName = "/" + baseName;
}
console.log("Using base name", baseName);
export default [
  route(`${baseName}`, "routes/home.tsx"),
  route(`${baseName}/deck/:id`, "routes/deck.tsx"),
] satisfies RouteConfig;
