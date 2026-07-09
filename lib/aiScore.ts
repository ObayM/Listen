import { generateObject } from "ai";
import { z } from "zod";

const MODEL = process.env.SCORING_MODEL ?? "anthropic/claude-haiku-4.5";

export const aiScoreSchema = z.object({
  score: z.number().min(0).max(100),
  verdict: z.enum(["correct", "close", "incorrect"]),
  feedback: z.string(),
  mishearings: z.array(
    z.object({
      heard: z.string(),
      actual: z.string(),
      tip: z.string(),
    }),
  ),
});

export type AiScore = z.infer<typeof aiScoreSchema>;

const SYSTEM = `you are a chill listening coach for upper-intermediate english learners.
the learner listened to a short audio clip and typed what they heard (dictation).
you get the reference transcript (from the video's official captions) and the learner's typed answer.

judge whether the learner actually HEARD the audio correctly, not whether they matched the text char for char.
rules:
- contractions and reductions count as correct. "i'm gonna" == "i am going to", "could've" == "could have". if the learner wrote the reduced form and the caption has the full form (or the reverse), that is a correct hearing, not a mistake.
- official captions are sometimes lightly cleaned up or paraphrased. do not punish the learner when their answer matches the likely audio even if it differs slightly from the caption wording.
- minor spelling slips and missing punctuation are fine.
- real mistakes are: wrong words that change meaning, missed words, words that show they misheard a sound.

score 0-100 on how well they heard it. verdict: correct (>=90), close (60-89), incorrect (<60).
feedback: one or two short casual sentences, encouraging, plain language, no emojis.
mishearings: only genuine ones, each with what they heard, the actual word, and a quick tip about the sound. empty array if none.`;

export async function aiScore(reference: string, typed: string): Promise<AiScore> {
  const { object } = await generateObject({
    model: MODEL,
    schema: aiScoreSchema,
    system: SYSTEM,
    prompt: `reference: "${reference}"\nlearner typed: "${typed}"`,
  });
  return object;
}
