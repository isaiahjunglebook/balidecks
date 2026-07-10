import { test } from "node:test";
import assert from "node:assert/strict";
import {
  estimatePrice,
  inclusiveDays,
  priceForDays,
  PRICING,
} from "./pricing.ts";

test("inclusive day count", () => {
  assert.equal(inclusiveDays("2026-06-01", "2026-06-01"), 1);
  assert.equal(inclusiveDays("2026-06-01", "2026-06-07"), 7);
  assert.equal(inclusiveDays("2026-06-01", "2026-06-30"), 30);
  assert.equal(inclusiveDays("2026-02-27", "2026-03-02"), 4); // month boundary
});

test("flat package tier prices", () => {
  assert.equal(priceForDays(1).priceCents, 350_00);
  assert.equal(priceForDays(3).priceCents, 1_050_00);
  assert.equal(priceForDays(6).priceCents, 2_100_00);
  assert.equal(priceForDays(7).priceCents, 1_500_00); // 1 week
  assert.equal(priceForDays(8).priceCents, 1_850_00); // week + 1 night
  assert.equal(priceForDays(10).priceCents, 2_550_00); // week + 3 nights
  assert.equal(priceForDays(13).priceCents, 3_000_00); // 2 weeks beat week + 6 nights
  assert.equal(priceForDays(14).priceCents, 3_000_00); // 2 weeks
  assert.equal(priceForDays(29).priceCents, 4_000_00); // rounds up to 1 month
  assert.equal(priceForDays(30).priceCents, 4_000_00); // 1 month
  assert.equal(priceForDays(35).priceCents, 5_750_00); // month + 5 nights
  assert.equal(priceForDays(60).priceCents, 8_000_00); // 2 months
});

test("price is flat — independent of season and weekday", () => {
  // High-season July weekend vs low-season February midweek: same price.
  assert.equal(
    estimatePrice("2026-07-10", "2026-07-12").priceCents, // Fri–Sun, high season
    estimatePrice("2026-02-10", "2026-02-12").priceCents, // Tue–Thu, low season
  );
  assert.equal(estimatePrice("2026-12-31", "2026-12-31").priceCents, 350_00); // NYE
});

test("estimatePrice matches priceForDays via range", () => {
  assert.equal(
    estimatePrice("2026-06-01", "2026-06-07").priceCents,
    priceForDays(7).priceCents,
  );
});

test("deposit always attached", () => {
  assert.equal(priceForDays(5).depositCents, PRICING.depositCents);
  assert.equal(PRICING.depositCents, 2_500_00);
});
