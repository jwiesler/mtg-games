import { expect, test } from "@playwright/test";

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

test("create user", async ({ page }) => {
  await createUser({ name: "Bob" });

  await page.goto(`/players`);

  const createButton = page.getByRole("button", { name: "anlegen" });
  await expect(createButton).toBeVisible();
  await createButton.click();

  const deleteButton = page.getByRole("button", { name: "delete" });
  await expect(deleteButton).not.toBeVisible();
  const input = page.getByLabel("Name");
  await expect(input).toBeVisible();
  await input.fill("Alice");

  await expect(input).toHaveValue("Alice");
  const submit = page.getByRole("button", { name: "submit" });
  await expect(submit).toBeVisible();
  await submit.click();

  await expect(submit).not.toBeVisible();
  await expect(page.getByText("Spieler 'Alice' angelegt")).toBeVisible();

  await expectVisibleLinkTo(
    page.getByRole("link", { name: "Bob" }),
    "/players/1",
  );
  await expectVisibleLinkTo(
    page.getByRole("link", { name: "Alice" }),
    "/players/2",
  );
});

test("edit user", async ({ page }) => {
  await createUser({ name: "Alice" });
  await createUser({ name: "Bob" });

  await page.goto(`/players`);

  const row = page.locator("tr", { hasText: "Bob" });
  const editButton = row.getByRole("button", { name: "edit" });
  await expect(editButton).toBeVisible();
  await editButton.click();

  const input = page.getByLabel("Name");
  await expect(input).toHaveValue("Bob");
  await expect(input).toBeVisible();
  await input.fill("Mallory");

  await expect(input).toHaveValue("Mallory");
  const submit = page.getByRole("button", { name: "submit" });
  await expect(submit).toBeVisible();
  await submit.click();

  await expect(submit).not.toBeVisible();
  await expect(page.getByText("Spieler 'Mallory' gespeichert")).toBeVisible();

  await expectVisibleLinkTo(
    page.getByRole("link", { name: "Alice" }),
    "/players/1",
  );
  await expectVisibleLinkTo(
    page.getByRole("link", { name: "Mallory" }),
    "/players/2",
  );
});

test.describe("delete tests", () => {
  test.beforeEach(async ({ page }) => {
    await createUser({ name: "Alice" });
    await createUser({ name: "Bob" });

    await page.goto(`/players`);

    const row = page.locator("tr", { hasText: "Bob" });
    const editButton = row.getByRole("button", { name: "edit" });
    await expect(editButton).toBeVisible();
    await editButton.click();

    const deleteButton = page.getByRole("button", { name: "delete" });
    await expect(deleteButton).toBeVisible();
    await deleteButton.click();

    await expect(
      page.getByText("Möchtest du diesen Spieler wirklich löschen?"),
    ).toBeVisible();
  });

  test("ok clicked", async ({ page }) => {
    const okButton = page.getByRole("button", { name: "Ok" });
    await okButton.click();

    await expect(okButton).not.toBeVisible();
    const deleteButton = page.getByRole("button", { name: "delete" });
    await expect(deleteButton).not.toBeVisible();
    await expect(page.getByText("Spieler 'Bob' gelöscht")).toBeVisible();

    await expectVisibleLinkTo(
      page.getByRole("link", { name: "Alice" }),
      "/players/1",
    );
    await expect(page.locator("tr", { hasText: "Bob" })).not.toBeVisible();
  });

  test("aborted clicked", async ({ page }) => {
    const abortButton = page.getByRole("button", { name: "Abbrechen" });
    await abortButton.click();

    await expect(abortButton).not.toBeVisible();
    const deleteButton = page.getByRole("button", { name: "delete" });
    await expect(deleteButton).toBeVisible();
    const closeButton = page.getByRole("button", { name: "close" });
    await expect(closeButton).toBeVisible();
    await closeButton.click();

    await expectVisibleLinkTo(
      page.getByRole("link", { name: "Alice" }),
      "/players/1",
    );
    await expectVisibleLinkTo(
      page.getByRole("link", { name: "Bob" }),
      "/players/2",
    );
  });
});
