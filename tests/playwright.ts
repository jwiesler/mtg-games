import { type Page, expect } from "@playwright/test";
import type { Locator } from "playwright-core";

export async function expectVisibleLinkTo(e: Locator, link: string) {
  await expect(e).toBeVisible();
  await expect(e).toHaveAttribute("href", link);
}

export async function fillVisibleTextField(
  page: Page,
  label: string,
  value: string,
) {
  const field = page.getByLabel(label);
  await expect(field).toBeVisible();
  await field.fill(value);
}

export function forwardBrowserLogs(page: Page) {
  page.on("console", log => {
    // Step 2: Forward to Node console with context
    console.log(`[Browser ${log.type()}]`, log.text());
  });
}

export async function selectOption(
  target: Locator,
  page: Page,
  option: string,
) {
  await target.fill(option);
  await page.getByRole("option", { name: option }).click();
  await expect(target).toHaveValue(option);
}
