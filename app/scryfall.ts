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

export const API = {
  card: cache(async (name: string) => {
    const url = new URL("https://api.scryfall.com/cards/named");
    url.searchParams.append("exact", name);
    const r = await fetch(url);
    if (r.ok) {
      return (await r.json()) as Card;
    }
    return null;
  }),
};
