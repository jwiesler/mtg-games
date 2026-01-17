import { expect } from "@playwright/test";
import type { Locator } from "playwright-core";

export async function expectVisibleLinkTo(e: Locator, link: string) {
  await expect(e).toBeVisible();
  await expect(e).toHaveAttribute("href", link);
}
