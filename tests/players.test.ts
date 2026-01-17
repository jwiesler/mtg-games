import { test } from "@playwright/test";

import { createUser, resetDb } from "./db/factories";
import { expectVisibleLinkTo } from "./playwright";

test.beforeEach(async () => {
  await resetDb();
});

test("shows users", async ({ page }) => {
  await createUser({ name: "Alice" });
  await createUser({ name: "Bob" });

  await page.goto(`/players`);

  await expectVisibleLinkTo(
    page.getByRole("link", { name: "Alice" }),
    "/players/1",
  );
  await expectVisibleLinkTo(
    page.getByRole("link", { name: "Bob" }),
    "/players/2",
  );
});
