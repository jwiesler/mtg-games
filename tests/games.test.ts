import { expect, test } from "@playwright/test";
import type { Locator, Page } from "playwright-core";

import { createDeck, createGame, createUser, resetDb } from "./db/factories";
import { selectOption } from "./playwright";
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

async function fillEdit(
  page: Page,
  dialog: Locator,
  game: {
    plays: [string, string][];
  },
) {
  const players = await dialog.getByLabel("Spieler").all();
  const decks = await dialog.getByLabel("Deck").all();
  expect(players.length).toEqual(decks.length);
  expect(decks.length).toBeGreaterThan(game.plays.length);
  for (let i = decks.length; i < game.plays.length; ++i) {
    const addButton = dialog
      .getByRole("button", { name: "Mitspieler hinzufügen" })
      .last();
    await addButton.click();
  }
  for (let i = game.plays.length; i < decks.length; ++i) {
    const deleteButton = dialog
      .getByRole("button", { name: "Mitspieler löschen" })
      .last();
    await deleteButton.click();
  }
  for (let i = 0; i < game.plays.length; i++) {
    await selectOption(players[i], page, game.plays[i][0]);
    await selectOption(decks[i], page, game.plays[i][1]);
  }
}

async function expectGameResult(
  locator: Locator,
  placings: [string, string][],
  comment?: string,
) {
  await expect(locator).toBeVisible();
  for (let i = 0; i < placings.length; i++) {
    const place = locator.locator("tr", { hasText: String(i + 1) });
    await expect(place).toContainText(placings[i][0]);
    await expect(place).toContainText(placings[i][1]);
  }

  if (comment !== undefined) {
    await expect(locator.getByText(comment)).toBeVisible();
  }
}

async function expectGameResults(
  page: Page,
  results: {
    placings: [string, string][];
    comment?: string;
  }[],
) {
  for (let i = 0; i < results.length; ++i) {
    const current = results[i];
    let nth = 0;
    for (let j = 0; j < i; ++j) {
      if (results[j].placings.length == current.placings.length) {
        nth++;
      }
    }
    const row = page
      .locator("tr", { hasText: String(current.placings.length) })
      .nth(nth);
    await expect(row).toBeVisible();
    const expand = row.getByRole("button", { name: "expand row" });
    await expand.click();
    const resultRow = page.locator("tr", { hasText: "Ergebnis" });

    await expectGameResult(resultRow, current.placings, current.comment);
    await expand.click();
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

test("create game", async ({ page }) => {
  await createGame();
  await page.goto(`/games`);

  const createButton = page.getByRole("button", { name: "anlegen" });
  await expect(createButton).toBeVisible();
  await createButton.click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  const deleteButton = dialog.getByRole("button", { name: "delete" });
  await expect(deleteButton).not.toBeVisible();

  await fillEdit(page, dialog, {
    plays: [
      ["Alice", "Sefris"],
      ["Bob", "Yawgmoth"],
    ],
  });

  const submit = page.getByRole("button", { name: "submit" });
  await expect(submit).toBeVisible();
  await submit.click();

  await expect(submit).not.toBeVisible();
  await expect(page.getByText("Spiel angelegt")).toBeVisible();
  await expectGameResults(page, [
    {
      placings: [
        ["Alice", "Yawgmoth"],
        ["Bob", "Sefris"],
      ],
    },
    {
      placings: [
        ["Alice", "Sefris"],
        ["Bob", "Yawgmoth"],
      ],
    },
  ]);
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

  // Switch placings
  const downButton = page.getByRole("button", { name: "down" });
  await expect(downButton).toBeVisible();
  downButton.click();
  const firstPlayer = page.getByLabel("Spieler").first();
  await expect(firstPlayer).toHaveValue("Bob");

  const submit = page.getByRole("button", { name: "submit" });
  await expect(submit).toBeVisible();
  await submit.click();

  await expect(submit).not.toBeVisible();
  await expect(page.getByText("Spiel bearbeitet")).toBeVisible();
  // Wait for refresh which will make the edit button invisible by collapsing the row
  await expect(editButton).not.toBeVisible();

  const row = page.locator("tr", { hasText: "2" });
  await expect(row).toBeVisible();
  const expand = row.getByRole("button", { name: "expand row" });
  await expand.click();
  const resultRow = page.locator("tr", { hasText: "Ergebnis" });

  await expectGameResult(
    resultRow,
    [
      ["Bob", "Sefris"],
      ["Alice", "Yawgmoth"],
    ],
    "Test",
  );
});

test.describe("delete tests", () => {
  test.beforeEach(async ({ page }) => {
    await createGame();
    await createGame({
      plays: {
        create: [
          { place: 1, deckId: 2, playerId: 2 },
          { place: 2, deckId: 1, playerId: 1 },
        ],
      },
    });

    await page.goto(`/games`);

    const row = page.locator("tr", { hasText: "2" }).first();
    const expandButton = row.getByRole("button", { name: "expand row" });
    await expect(expandButton).toBeVisible();
    await expandButton.click();

    const editButton = page.getByRole("button", { name: "Bearbeiten" });
    await expect(editButton).toBeVisible();
    await editButton.click();

    const deleteButton = page.getByRole("button", { name: "delete" });
    await expect(deleteButton).toBeVisible();
    await deleteButton.click();

    await expect(
      page.getByText("Möchtest du dieses Spiel wirklich löschen?"),
    ).toBeVisible();
  });

  test("ok clicked", async ({ page }) => {
    const okButton = page.getByRole("button", { name: "Ok" });
    await okButton.click();

    await expect(okButton).not.toBeVisible();
    const deleteButton = page.getByRole("button", { name: "delete" });
    await expect(deleteButton).not.toBeVisible();
    await expect(page.getByText("Spiel gelöscht")).toBeVisible();

    await expectGameResults(page, [
      {
        placings: [
          ["Alice", "Yawgmoth"],
          ["Bob", "Sefris"],
        ],
      },
    ]);
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

    const expandButton = page
      .getByRole("button", { name: "expand row" })
      .first();
    await expect(expandButton).toBeVisible();
    await expandButton.click();

    await expectGameResults(page, [
      {
        placings: [
          ["Bob", "Sefris"],
          ["Alice", "Yawgmoth"],
        ],
      },
      {
        placings: [
          ["Alice", "Yawgmoth"],
          ["Bob", "Sefris"],
        ],
      },
    ]);
  });
});
