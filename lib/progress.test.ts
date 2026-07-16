import assert from "node:assert/strict";
import test from "node:test";
import { calculateProgress } from "./progress";

test("returns an empty snapshot when there are no attempts", () => {
  assert.deepEqual(calculateProgress([]), {
    totalAttempts: 0,
    averageScore: 0,
    currentStreak: 0,
    weakWords: [],
  });
});

test("rounds the average score and counts the current streak", () => {
  const snapshot = calculateProgress([
    { score: 91, verdict: "correct", missedWords: [] },
    { score: 82, verdict: "correct", missedWords: ["through"] },
    { score: 70, verdict: "close", missedWords: [] },
    { score: 99, verdict: "correct", missedWords: [] },
  ]);

  assert.equal(snapshot.averageScore, 86);
  assert.equal(snapshot.currentStreak, 2);
  assert.equal(snapshot.totalAttempts, 4);
});

test("a newest non-correct attempt breaks the streak", () => {
  const snapshot = calculateProgress([
    { score: 72, verdict: "close", missedWords: [] },
    { score: 100, verdict: "correct", missedWords: [] },
  ]);
  assert.equal(snapshot.currentStreak, 0);
});

test("normalizes, combines, and orders weak words", () => {
  const snapshot = calculateProgress([
    { score: 50, verdict: "incorrect", missedWords: ["Through", " world ", "through"] },
    { score: 70, verdict: "close", missedWords: ["World", "answer"] },
  ]);

  assert.deepEqual(snapshot.weakWords, [
    { word: "through", count: 2 },
    { word: "world", count: 2 },
    { word: "answer", count: 1 },
  ]);
});

test("drops stopwords out of weak words since they carry no listening content", () => {
  const snapshot = calculateProgress([
    { score: 40, verdict: "incorrect", missedWords: ["to", "i", "we", "go", "stairs", "okay", "here", "sacrifice"] },
  ]);

  assert.deepEqual(snapshot.weakWords, [
    { word: "sacrifice", count: 1 },
    { word: "stairs", count: 1 },
  ]);
});
