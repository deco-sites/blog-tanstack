// The block map (.deco/index.ts) registers each block under the one name saved content uses: two
// keys bound to one function are two types in Studio's pickers, so an editor sees the block twice.
import assert from "node:assert/strict";
import { it } from "node:test";
import blocks from "../.deco";

it("binds each block function to one key", () => {
  const keyOf = new Map<unknown, string>();
  for (const [key, fn] of Object.entries(blocks)) {
    assert.equal(keyOf.get(fn), undefined, `"${key}" and "${keyOf.get(fn)}" are the same block`);
    keyOf.set(fn, key);
  }
});
