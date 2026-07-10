import { test } from "node:test";
import assert from "node:assert/strict";
import { estimatePrice, inclusiveDays, priceForDays } from "./pricing.ts";

test("inclusive day count", () => {
  assert.equal(inclusiveDays("2026-06-01", "2026-06-01"), 1);
  assert.equal(inclusiveDays("2026-06-01", "2026-06-07"), 7);
  assert.equal(inclusiveDays("2026-06-01", "2026-06-30"), 30);
});

test("package tier prices", () => {
  assert.equal(priceForDays(1).priceCents, 100_00); // 1 day
  assert.equal(priceForDays(3).priceCents, 300_00); // 3 days
  assert.equal(priceForDays(6).priceCents, 600_00); // 6 days
  assert.equal(priceForDays(7).priceCents, 1_000_00); // 1 week
  assert.equal(priceForDays(10).priceCents, 2_000_00); // 2 weeks
  assert.equal(priceForDays(14).priceCents, 2_000_00); // 2 weeks
  assert.equal(priceForDays(29).priceCents, 3_000_00); // capped at 1 month
  assert.equal(priceForDays(30).priceCents, 3_000_00); // 1 month
  assert.equal(priceForDays(31).priceCents, 3_100_00); // 1 month + 1 day
  assert.equal(priceForDays(45).priceCents, 6_000_00); // 2 months
  assert.equal(priceForDays(60).priceCents, 6_000_00); // 2 months
});

test("estimatePrice matches priceForDays via range", () => {
  assert.equal(
    estimatePrice("2026-06-01", "2026-06-07").priceCents,
    priceForDays(7).priceCents,
  );
});

test("deposit always attached", () => {
  assert.equal(priceForDays(5).depositCents, 1_500_00);
});
