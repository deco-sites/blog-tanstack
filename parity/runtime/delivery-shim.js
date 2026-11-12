// Parity builds only (parity/vite.config.ts prepends this to src/worker-entry.ts): points the CMS
// SDK at the local delivery CDN (parity/delivery.mjs) instead of delivery.decocms.com. The SDK reads
// this test-only override from globalThis. Inert when the build had no PARITY_DELIVERY_ORIGIN.
const origin = __PARITY_DELIVERY_ORIGIN__;
if (origin) globalThis[Symbol.for("decocms.blocks.test.deliveryOrigin")] = origin;
