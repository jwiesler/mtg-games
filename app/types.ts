import z from "zod";

export const DeckSchema = z.object({
  name: z.string(),
  description: z.string(),
  commander: z.string(),
  ownerId: z.coerce.number(),
});
export type Deck = z.infer<typeof DeckSchema>;
