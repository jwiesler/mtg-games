// @ts-check
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config([
  eslint.configs.recommended,
  tseslint.configs.recommended,
  {
    // Note: there should be no other properties in this object
    ignores: ["**/build/*", ".react-router"],
  },
]);
