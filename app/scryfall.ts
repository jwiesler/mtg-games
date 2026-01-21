import { cache } from "react";

interface Card {
  name: string;
  scryfall_uri: string;
  image_uris: {
    border_crop: string;
  };
  mana_cost: string;
  color_identity: string[];
}

function trimSuffix(s: string, suffix: string): string {
  if (s.endsWith(suffix)) {
    return s.slice(0, s.length - suffix.length);
  }
  return s;
}

export const API = {
  card: cache(async (name: string) => {
    const url = new URL("https://api.scryfall.com/cards/named");
    url.searchParams.append("exact", name);
    const r = await fetch(url);
    if (r.ok) {
      const card = (await r.json()) as Card;
      card.scryfall_uri = trimSuffix(card.scryfall_uri, "?utm_source=api");
      return card;
    }
    return null;
  }),
};
