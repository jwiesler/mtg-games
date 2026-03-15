import { cache } from "react";
import z from "zod";

const ImagesSchema = z.object({
  border_crop: z.string(),
});

const FaceSchema = {
  image_uris: ImagesSchema,
  mana_cost: z.string(),
};

const BaseSchema = z.object({
  name: z.string(),
  scryfall_uri: z.string(),
  color_identity: z.array(z.string()),
});

const NormalCard = BaseSchema.extend(FaceSchema);
const FacedCard = BaseSchema.extend({
  card_faces: z.array(z.object(FaceSchema)),
});

const CardSchema = z.union([NormalCard, FacedCard]);

function trimSuffix(s: string, suffix: string): string {
  if (s.endsWith(suffix)) {
    return s.slice(0, s.length - suffix.length);
  }
  return s;
}

export const API = {
  card: cache(
    async (name: string): Promise<z.infer<typeof NormalCard> | null> => {
      const url = new URL("https://api.scryfall.com/cards/named");
      url.searchParams.append("exact", name);
      const r = await fetch(url);
      if (!r.ok) {
        return null;
      }
      const parsed = CardSchema.safeParse(await r.json());
      if (!parsed.success) {
        console.error(
          "Scryfall returned unexpected card schema for",
          url.toString(),
          parsed.error,
        );
        return null;
      }
      const card = parsed.data;
      card.scryfall_uri = trimSuffix(card.scryfall_uri, "?utm_source=api");
      const face = "card_faces" in card ? card.card_faces[0] : card;
      return {
        ...face,
        name: card.name,
        scryfall_uri: card.scryfall_uri,
        color_identity: card.color_identity,
      };
    },
  ),
};
