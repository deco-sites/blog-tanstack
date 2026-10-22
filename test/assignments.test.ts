// A/B tests and campaigns, decided once by the worker for the visitor (src/edge/assignments.ts): the
// cache key carries the decision and never the visitor, the page renders exactly that decision, and
// the visitor's first-visit cookie is never sent on a preview.
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { type Blocks, createCMS, type Snapshot } from "@decocms/blocks";
import { newVisitor, serializeVisitor } from "@decocms/blocks/experiments";
import { ASSIGNMENTS_HEADER, decideAssignments, forwardedAssignments, withoutAssignments } from "../src/edge/assignments";

const content = {
  revision: "rev-1",
  root: "/test-assignments",
  blocks: {
    experiments: { __resolveType: "split-traffic", hero: 50 },
    Hero: {
      __resolveType: "multivariate",
      variants: [
        { rule: { __resolveType: "experiment", name: "hero" }, value: "new" },
        { rule: { __resolveType: "always" }, value: "old" },
      ],
    },
  },
} as unknown as Snapshot & { root: string };
const cms = createCMS({ blocks: {} as Blocks, content });

const visit = (cookie?: string) =>
  new Request("https://blog.test/post", cookie ? { headers: { cookie: `deco_segment=${cookie}` } } : {});

/** Two returning visitors, one on each side of the `hero` test. */
async function bothSides() {
  const sides = new Map<string, { id: string; cookie: string }>();
  for (let i = 0; i < 200 && sides.size < 2; i++) {
    const visitor = newVisitor();
    const cookie = serializeVisitor(visitor);
    const { key } = await decideAssignments(cms, visit(cookie), null);
    sides.set(key, { id: visitor.id, cookie });
  }
  return sides;
}

describe("decideAssignments", () => {
  it("keys visitors on opposite sides of a test apart, never on the visitor's id", async () => {
    const sides = await bothSides();
    assert.deepEqual([...sides.keys()].sort(), ["", "x=hero"]);
    for (const [key, { id }] of sides) assert.ok(!key.includes(id));
  });

  it("hands the page the decision the key carries: the page decides nothing again", async () => {
    for (const [key, { cookie }] of await bothSides()) {
      const { request } = await decideAssignments(cms, visit(cookie), null);
      // The page has no visitor: the forwarded decision alone picks the variant.
      const [hero] = await cms.client({ ...forwardedAssignments(request) }).resolve("Hero");
      assert.equal(hero, key === "x=hero" ? "new" : "old");
    }
  });

  it("replaces a decision sent from outside", async () => {
    const forged = new Request("https://blog.test/post", {
      headers: { [ASSIGNMENTS_HEADER]: JSON.stringify({ experiments: { hero: true }, campaigns: {} }) },
    });
    const { request, key } = await decideAssignments(cms, forged, null);
    assert.equal(forwardedAssignments(request)?.experiments.hero, key === "x=hero");
    assert.equal(withoutAssignments(forged).headers.has(ASSIGNMENTS_HEADER), false);
  });

  it("sends the visitor's cookie on a first visit only, never on a preview", async () => {
    const first = await decideAssignments(cms, visit(), null);
    assert.match(first.cookie ?? "", /^deco_segment=/);
    const returning = await decideAssignments(cms, visit(serializeVisitor(newVisitor())), null);
    assert.equal(returning.cookie, null);
    const preview = await decideAssignments(cms, visit(), { version: "0123456789abcdef0123456789abcdef01234567" });
    assert.equal(preview.cookie, null);
  });

  it("gives a site without tests or campaigns no key", async () => {
    const plain = createCMS({
      blocks: {} as Blocks,
      content: { revision: "rev-1", root: "/test-no-assignments", blocks: {} } as unknown as Snapshot & {
        root: string;
      },
    });
    assert.equal((await decideAssignments(plain, visit(), null)).key, "");
  });
});
