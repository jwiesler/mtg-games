import {  expect, test } from "@playwright/test";
import type { Locator } from "playwright-core";

import { createDeck, createGame, createUser, resetDb } from "./db/factories";
import { FORMAT } from "~/format";

test.beforeEach(async () => {
  await resetDb();
  await createUser({ name: "Alice" });
  await createUser({ name: "Bob" });
  await createDeck({
    name: "Yawgmoth",
    owner: {
      connect: {
        id: 1,
      },
    },
  });
  await createDeck({
    name: "Sefris",
    owner: {
      connect: {
        id: 2,
      },
    },
  });
});
//
// async function fillEdit(
//   page: Page,
//   game: {
//     plays: [string, string][];
//   },
// ) {
//   const deleteButtons = await page.getByRole("button", { name: "Delete" });
//   const players = await page.getByLabel("Spieler").all();
//   const decks = await page.getByLabel("Deck").all();
//   expect(players.length).toEqual(decks.length);
//   expect(decks.length).toBeGreaterThan(game.plays.length);
//   while (decks.length > game.plays.length) {
//
//   }
//   for (let i = 0; i < game.plays.length; i++) {
//     await selectOption(players[i], page, game.plays[i][0]);
//     await selectOption(decks[i], page, game.plays[i][1]);
//   }
// }

async function expectGameResult(
  locator: Locator,
  placings: [string, string][],
  comment?: string,
) {
  await expect(locator).toBeVisible();
  for (let i = 0; i < placings.length; i++) {
    const firstPlace = locator.locator("tr", { hasText: String(i + 1) });
    await expect(firstPlace).toContainText(placings[i][0]);
    await expect(firstPlace).toContainText(placings[i][1]);
  }

  if (comment !== undefined) {
    await expect(locator.getByText(comment)).toBeVisible();
  }
}

test("shows games", async ({ page }) => {
  const game = await createGame();
  await page.goto(`/games`);
  const date = FORMAT.format(game.when);
  const row = page.locator("tr", { hasText: date });
  await expect(row).toBeVisible();
  const expand = row.getByRole("button", { name: "expand row" });
  await expand.click();
  const resultRow = page.locator("tr", { hasText: "Ergebnis" });
  await expectGameResult(resultRow, [
    ["Alice", "Yawgmoth"],
    ["Bob", "Sefris"],
  ]);
});

// test("create game", async ({ page }) => {
//   const game = await createGame();
//   await page.goto(`/games`);
//
//   const createButton = page.getByRole("button", { name: "anlegen" });
//   await expect(createButton).toBeVisible();
//   await createButton.click();
//
//   const deleteButton = page.getByRole("button", { name: "delete" });
//   await expect(deleteButton).not.toBeVisible();
//
//   await fillEdit(page, {
//     plays: [
//       ["Alice", "Yawgmoth"],
//       ["Bob", "Sefris"],
//     ],
//   });
//
//   const submit = page.getByRole("button", { name: "submit" });
//   await expect(submit).toBeVisible();
//   await submit.click();
//
//   await expect(submit).not.toBeVisible();
//   await expect(page.getByText("Spiel angelegt")).toBeVisible();
//
//   const row = page.locator("tr");
//   await expect(row).toBeVisible();
//   const expand = row.getByRole("button", { name: "expand row" });
//   await expand.click();
//   const resultRow = page.locator("tr", { hasText: "Ergebnis" });
//
//   await expectGameResult(resultRow,  [["Alice", "Yawgmoth"], ["Bob", "Sefris"]]);
// });

test("edit game", async ({ page }) => {
  await createGame();
  await page.goto(`/games`);

  const expandButton = page.getByRole("button", { name: "expand row" });
  await expect(expandButton).toBeVisible();
  await expandButton.click();

  const editButton = page.getByRole("button", { name: "Bearbeiten" });
  await expect(editButton).toBeVisible();
  await editButton.click();

  const deleteButton = page.getByRole("button", { name: "delete" });
  await expect(deleteButton).toBeVisible();

  const comment = page.getByLabel("Kommentar");
  await comment.fill("Test");
  await expect(comment).toHaveValue("Test");

  const submit = page.getByRole("button", { name: "submit" });
  await expect(submit).toBeVisible();
  await submit.click();

  await expect(submit).not.toBeVisible();
  await expect(page.getByText("Spiel bearbeitet")).toBeVisible();

  const row = page.locator("tr", { hasText: "2" });
  await expect(row).toBeVisible();
  const expand = row.getByRole("button", { name: "expand row" });
  await expand.click();
  const resultRow = page.locator("tr", { hasText: "Ergebnis" });

  await expectGameResult(
    resultRow,
    [
      ["Alice", "Yawgmoth"],
      ["Bob", "Sefris"],
    ],
    "Test",
  );
});

test("edit game", async ({ page }) => {
  await createGame();
  await page.goto(`/games`);

  const expandButton = page.getByRole("button", { name: "expand row" });
  await expect(expandButton).toBeVisible();
  await expandButton.click();

  const editButton = page.getByRole("button", { name: "Bearbeiten" });
  await expect(editButton).toBeVisible();
  await editButton.click();

  const deleteButton = page.getByRole("button", { name: "delete" });
  await expect(deleteButton).toBeVisible();

  const comment = page.getByLabel("Kommentar");
  await comment.fill("Test");
  await expect(comment).toHaveValue("Test");

  const submit = page.getByRole("button", { name: "submit" });
  await expect(submit).toBeVisible();
  await submit.click();

  await expect(submit).not.toBeVisible();
  await expect(page.getByText("Spiel bearbeitet")).toBeVisible();

  const row = page.locator("tr", { hasText: "2" });
  await expect(row).toBeVisible();
  const expand = row.getByRole("button", { name: "expand row" });
  await expand.click();
  const resultRow = page.locator("tr", { hasText: "Ergebnis" });

  await expectGameResult(
    resultRow,
    [
      ["Alice", "Yawgmoth"],
      ["Bob", "Sefris"],
    ],
    "Test",
  );
});
