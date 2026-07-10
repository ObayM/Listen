import { test } from "node:test";
import assert from "node:assert/strict";
import { normalize, scoreLocal } from "./scoring";

test("exact match is clean", () => {
  const r = scoreLocal("I was going to tell you", "I was going to tell you");
  assert.equal(r.clean, true);
  assert.equal(r.accuracy, 1);
});

test("contraction vs expansion is clean", () => {
  assert.equal(scoreLocal("I'm going to tell you", "I am going to tell you").clean, true);
  assert.equal(scoreLocal("do not do that", "don't do that").clean, true);
});

test("gonna reduction matches going to", () => {
  assert.equal(scoreLocal("I am going to head out", "I'm gonna head out").clean, true);
});

test("could've vs could have is clean", () => {
  assert.equal(scoreLocal("I could have told you", "I could've told you").clean, true);
});

test("british vs american spelling is clean", () => {
  assert.equal(scoreLocal("the colour of the theatre", "the color of the theater").clean, true);
  assert.equal(scoreLocal("we organise it", "we organize it").clean, true);
});

test("punctuation and case ignored", () => {
  assert.equal(scoreLocal("Well, it is here!", "well it is here").clean, true);
});

test("apostrophe-less contraction is not clean", () => {
  assert.equal(scoreLocal("that's it", "thats it").clean, false);
});

test("number words match digits", () => {
  assert.equal(scoreLocal("I have five apples", "I have 5 apples").clean, true);
});

test("wrong word is not clean and is flagged as sub", () => {
  const r = scoreLocal("the cat sat down", "the dog sat down");
  assert.equal(r.clean, false);
  const sub = r.diff.find((t) => t.type === "sub");
  assert.equal(sub?.ref, "cat");
  assert.equal(sub?.hyp, "dog");
});

test("missing word flagged", () => {
  const r = scoreLocal("the big red car", "the red car");
  assert.equal(r.clean, false);
  assert.ok(r.diff.some((t) => t.type === "missing" && t.ref === "big"));
});

test("extra word flagged", () => {
  const r = scoreLocal("the red car", "the big red car");
  assert.equal(r.clean, false);
  assert.ok(r.diff.some((t) => t.type === "extra" && t.hyp === "big"));
});

test("accuracy drops with more errors", () => {
  const r = scoreLocal("one two three four", "one two nope nope");
  assert.equal(r.clean, false);
  assert.ok(r.accuracy < 0.6);
});

test("normalize handles empty", () => {
  assert.deepEqual(normalize("  !!!  "), []);
});
