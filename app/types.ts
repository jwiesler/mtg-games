import z from "zod";

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
