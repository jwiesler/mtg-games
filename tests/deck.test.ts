import { expect, test } from "@playwright/test";

import { createDeck, createUser, resetDb } from "./db/factories";
import { expectVisibleLinkTo, fillVisibleTextField } from "./playwright";

test.beforeEach(async () => {
  await resetDb();
});

test("show deck", async ({ page }) => {
  await createUser({ name: "Alice" });
  await createDeck({
    name: "#NAME",
    commander: "#COMMANDER",
    colors: "#COLORS",
    bracket: 4,
    description: "#DESCRIPTION",
    url: "#URL",
    owner: {
      connect: {
        id: 1,
      },
    },
  });
  await page.goto(`/decks/1`);

  await expect(page.getByText("Alice")).toBeVisible();
  await expect(page.getByText("#NAME")).toBeVisible();
  await expect(page.getByText("#COMMANDER")).toBeVisible();
  await expect(page.getByText("#COLORS")).toBeVisible();
  await expect(page.getByText("4")).toBeVisible();
  await expect(page.getByText("#DESCRIPTION")).toBeVisible();
  await expect(page.getByText("#URL")).toBeVisible();
});

test("edit deck", async ({ page }) => {
  await createUser({ name: "Alice" });
  await createDeck({ name: "Yawgmoth" });

  await page.goto(`/decks/1`);

  const editButton = page.getByRole("button", { name: "Bearbeiten" });
  await expect(editButton).toBeVisible();
  await editButton.click();

  await fillVisibleTextField(page, "Name", "12345678");

  const submit = page.getByRole("button", { name: "submit" });
  await expect(submit).toBeVisible();
  await submit.click();

  await expect(submit).not.toBeVisible();
  await expect(page.getByText("Deck gespeichert")).toBeVisible();

  await expect(page.getByText("12345678")).toBeVisible();
});

test.describe("delete tests", () => {
  test.beforeEach(async ({ page }) => {
    await createUser({ name: "Alice" });
    await createDeck({ name: "Yawgmoth" });
    await createDeck({ name: "Sefris" });

    await page.goto(`/decks/1`);

    const editButton = page.getByRole("button", { name: "Bearbeiten" });
    await expect(editButton).toBeVisible();
    await editButton.click();

    const deleteButton = page.getByRole("button", { name: "delete" });
    await expect(deleteButton).toBeVisible();
    await deleteButton.click();

    await expect(
      page.getByText("Möchtest du dieses Deck wirklich löschen?"),
    ).toBeVisible();
  });

  test("ok clicked", async ({ page }) => {
    const okButton = page.getByRole("button", { name: "Ok" });
    await okButton.click();

    await expect(page).toHaveURL("/decks");

    await expectVisibleLinkTo(
      page.getByRole("link", { name: "Sefris" }),
      "/decks/2",
    );
    await expect(page.locator("tr", { hasText: "Yawgmoth" })).not.toBeVisible();
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
    await expect(page).toHaveURL("/decks/1");

    await page.goto("/decks");
    await expectVisibleLinkTo(
      page.getByRole("link", { name: "Yawgmoth" }),
      "/decks/1",
    );
    await expectVisibleLinkTo(
      page.getByRole("link", { name: "Sefris" }),
      "/decks/2",
    );
  });
});

// Deck with plays
