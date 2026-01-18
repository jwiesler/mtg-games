import { type Page, expect } from "@playwright/test";
import type { Locator } from "playwright-core";

export async function expectVisibleLinkTo(e: Locator, link: string) {
  await expect(e).toBeVisible();
  await expect(e).toHaveAttribute("href", link);
}

export async function forwardBrowserLogs(page: Page) {
  page.on("console", log => {
    // Step 2: Forward to Node console with context
    console.log(`[Browser ${log.type()}]`, log.text());
  });
}
