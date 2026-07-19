import assert from "node:assert/strict";
import test from "node:test";
import { decodeCookieFile, throwIfYtDlpFailed } from "./captionFetch";

test("accepts a successful yt-dlp result", () => {
  assert.doesNotThrow(() => {
    throwIfYtDlpFailed({ code: 0, stdout: "", stderr: "" });
  });
});

test("surfaces yt-dlp stderr instead of treating a failure as missing captions", () => {
  assert.throws(
    () => {
      throwIfYtDlpFailed({
        code: 1,
        stdout: "",
        stderr: "ERROR: Sign in to confirm you're not a bot",
      });
    },
    /yt-dlp exited with code 1: ERROR: Sign in to confirm you're not a bot/,
  );
});

test("falls back to stdout when yt-dlp has no stderr", () => {
  assert.throws(
    () => {
      throwIfYtDlpFailed({ code: 2, stdout: "extractor failed", stderr: "" });
    },
    /yt-dlp exited with code 2: extractor failed/,
  );
});

test("decodes a Netscape cookie file from a deployment secret", () => {
  const contents = "# Netscape HTTP Cookie File\n.youtube.com\tTRUE\t/\tTRUE\t0\tname\tvalue\n";
  assert.equal(decodeCookieFile(Buffer.from(contents).toString("base64")), contents);
});

test("rejects a deployment secret that is not a Netscape cookie file", () => {
  assert.throws(
    () => decodeCookieFile(Buffer.from("not cookies").toString("base64")),
    /not a Netscape-format cookie file/,
  );
});
