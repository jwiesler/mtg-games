import { type Page, expect, test } from "@playwright/test";

import { createDeck, createUser, resetDb } from "./db/factories";
import { expectVisibleLinkTo, fillVisibleTextField } from "./playwright";

test.beforeEach(async () => {
  await resetDb();
});

const EXAMPLE_DECK = {
  name: "Sefris",
  commander: "Commander",
  colors: "Esper",
  bracket: "4",
  description: "Sefris ventures into the dungeon",
  url: "https://example.com/sefris",
  owner: "Alice",
};

async function fillEdit(
  page: Page,
  deck: {
    name: string;
    commander: string;
    colors: string;
    bracket: string;
    description: string;
    url: string;
    owner: string;
  },
) {
  await fillVisibleTextField(page, "Name", deck.name);
  await fillVisibleTextField(page, "Commander", deck.commander);
  await fillVisibleTextField(page, "Farben", deck.colors);
  await fillVisibleTextField(page, "Bracket", deck.bracket);
  await fillVisibleTextField(page, "Beschreibung", deck.description);
  await fillVisibleTextField(page, "Link", deck.url);
  const owner = page.getByLabel("Besitzer");
  await expect(owner).toBeVisible();
  await owner.fill(deck.owner);
  await page.getByRole("option", { name: deck.owner }).click();
  await expect(owner).toHaveValue(deck.owner);
}

test("shows decks", async ({ page }) => {
  await createUser({ name: "Alice" });

  await createDeck({ name: "Sefris" });
  await createDeck({ name: "Yawgmoth" });
  await page.goto(`/decks`);

  await expectVisibleLinkTo(
    page.getByRole("link", { name: "Sefris" }),
    "/decks/1",
  );
  await expectVisibleLinkTo(
    page.getByRole("link", { name: "Yawgmoth" }),
    "/decks/2",
  );
});

test("create deck", async ({ page }) => {
  await createUser({ name: "Alice" });
  await createDeck({ name: "Yawgmoth" });
  await page.goto(`/decks`);

  const createButton = page.getByRole("button", { name: "anlegen" });
  await expect(createButton).toBeVisible();
  await createButton.click();

  const deleteButton = page.getByRole("button", { name: "delete" });
  await expect(deleteButton).not.toBeVisible();

  await fillEdit(page, EXAMPLE_DECK);

  const submit = page.getByRole("button", { name: "submit" });
  await expect(submit).toBeVisible();
  await submit.click();

  await expect(submit).not.toBeVisible();
  await expect(page.getByText("Deck 'Sefris' angelegt")).toBeVisible();

  await expectVisibleLinkTo(
    page.getByRole("link", { name: "Yawgmoth" }),
    "/decks/1",
  );
  await expectVisibleLinkTo(
    page.getByRole("link", { name: "Sefris" }),
    "/decks/2",
  );
});
