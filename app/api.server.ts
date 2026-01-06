import z from "zod";

import { Prisma } from "./generated/prisma/client";
import prisma from "~/db.server";
import { BadRequest, NotFound } from "~/responses.server";
import { API } from "~/scryfall";

export function parseIdParam(input: string | undefined): number {
  const id = Number(input);
  if (!Number.isInteger(id)) {
    throw NotFound();
  }
  return id;
}

export const DeckSchema = z.object({
  name: z.string(),
  description: z.string(),
  commander: z.string(),
  ownerId: z.coerce.number(),
  bracket: z.coerce.number(),
  colors: z.string(),
  url: z.string(),
});
export type Deck = z.infer<typeof DeckSchema>;

export async function createDeck(data: Deck) {
  return prisma.deck.create({
    data: {
      name: data.name.trim() || data.commander.trim(),
      commander: data.commander.trim(),
      description: data.description.trim(),
      ownerId: data.ownerId,
      bracket: data.bracket,
      colors: data.colors.trim(),
      url: data.url.trim(),
    },
    select: {
      id: true,
      name: true,
    },
  });
}

export async function deleteDeck(id: number) {
  try {
    return await prisma.deck.delete({
      select: { name: true },
      where: { id },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2003") {
        throw BadRequest(
          "A deck that was played can't be deleted. Delete those games first.",
        );
      }
    }
    throw e;
  }
}

export async function updateDeck(id: number, data: Deck) {
  if (data.colors.trim() == "") {
    const card = await API.card(data.commander);
    if (card != null) {
      data.colors = "{" + card.color_identity.join("}{") + "}";
    }
  }
  return prisma.deck.update({
    select: {
      updatedAt: true,
    },
    data: {
      name: data.name.trim() || data.commander.trim(),
      commander: data.commander.trim(),
      description: data.description.trim(),
      ownerId: data.ownerId,
      bracket: data.bracket,
      colors: data.colors.trim(),
      url: data.url.trim(),
    },
    where: { id },
  });
}
