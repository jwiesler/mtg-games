import { prisma } from "./prisma";

export async function createUser(overrides = {}) {
  return prisma.user.create({
    data: {
      name: "Alice",
      ...overrides,
    },
  });
}

export async function createDeck(overrides = {}) {
  return prisma.deck.create({
    data: {
      name: "Deck",
      commander: "Commander",
      description: "Description",
      colors: "esper",
      url: "https://example.com/yawgmoth",
      bracket: 4,
      owner: {
        connect: {
          id: 1,
        },
      },
      ...overrides,
    },
  });
}

export async function createGame(overrides = {}) {
  return prisma.game.create({
    data: {
      when: new Date(),
      duration: 600,
      comment: "",
      plays: {
        create: [
          { place: 1, deckId: 1, playerId: 1 },
          { place: 2, deckId: 2, playerId: 2 },
        ],
      },
      ...overrides,
    },
  });
}

export async function resetDb() {
  // Disable FK constraints
  await prisma.$executeRawUnsafe(`PRAGMA foreign_keys = OFF`);

  const tables = await prisma.$queryRaw<{ name: string }[]>`
    SELECT name FROM sqlite_master
    WHERE type = 'table'
      AND name NOT LIKE 'sqlite_%'
      AND name != '_prisma_migrations'
  `;

  for (const { name } of tables) {
    await prisma.$executeRawUnsafe(`DELETE FROM "${name}"`);
  }

  // Reset autoincrement counters
  await prisma.$executeRawUnsafe(`DELETE FROM sqlite_sequence`);

  // Re-enable FK constraints
  await prisma.$executeRawUnsafe(`PRAGMA foreign_keys = ON`);
}
