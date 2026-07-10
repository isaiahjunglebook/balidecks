import { test } from "node:test";
import assert from "node:assert/strict";
import {
  classifyNight,
  estimatePrice,
  inclusiveDays,
  listDates,
  nightRateCents,
  primePremiumCents,
  PRICING,
} from "./pricing.ts";

// Calendar facts used below (verifiable):
//   2026-07-01 = Wednesday  → Jul 10 Fri, Jul 11 Sat (high season)
//   2026-02-01 = Sunday     → Feb 9 Mon, Feb 13 Fri, Feb 14 Sat (low season)
//   2026-03-01 = Sunday
//   2026-12-31 = Thursday

test("inclusive day count and date listing", () => {
  assert.equal(inclusiveDays("2026-06-01", "2026-06-01"), 1);
  assert.equal(inclusiveDays("2026-06-01", "2026-06-07"), 7);
  assert.equal(inclusiveDays("2026-06-01", "2026-06-30"), 30);
  assert.deepEqual(listDates("2026-02-27", "2026-03-02"), [
    "2026-02-27",
    "2026-02-28",
    "2026-03-01",
    "2026-03-02",
  ]);
});

test("night classification follows the framework", () => {
  assert.equal(classifyNight("2026-07-10"), "prime"); // high-season Friday
  assert.equal(classifyNight("2026-07-11"), "prime"); // high-season Saturday
  assert.equal(classifyNight("2026-07-13"), "standard"); // high-season Monday
  assert.equal(classifyNight("2026-02-13"), "standard"); // shoulder Friday
  assert.equal(classifyNight("2026-02-10"), "offpeak"); // low-season Tuesday
  assert.equal(classifyNight("2026-12-31"), "prime"); // NYE (Thursday)
  assert.equal(classifyNight("2027-01-01"), "prime"); // New Year's Day
});

test("nightly rates: base × multiplier", () => {
  assert.equal(nightRateCents("standard"), 250_00);
  assert.equal(nightRateCents("prime"), 437_50);
  assert.equal(nightRateCents("offpeak"), 200_00);
  assert.equal(primePremiumCents(), 187_50);
});

test("single nights price by their tier", () => {
  assert.equal(estimatePrice("2026-07-10", "2026-07-10").priceCents, 437_50);
  assert.equal(estimatePrice("2026-07-13", "2026-07-13").priceCents, 250_00);
  assert.equal(estimatePrice("2026-02-10", "2026-02-10").priceCents, 200_00);
});

test("short stays sum per-night rates", () => {
  // Fri + Sat + Sun in July: prime, prime, standard
  const est = estimatePrice("2026-07-10", "2026-07-12");
  assert.equal(est.priceCents, 437_50 * 2 + 250_00);
  assert.equal(est.primeNights, 2);
});

test("7 low-season nights bill as one week", () => {
  // Mon Feb 9 – Sun Feb 15: no prime nights → flat weekly rate
  const est = estimatePrice("2026-02-09", "2026-02-15");
  assert.equal(est.priceCents, PRICING.weeklyCents);
  assert.deepEqual(
    est.breakdown.map((l) => l.unit),
    ["week"],
  );
});

test("guardrail: prime nights inside a week add the premium", () => {
  // Mon Jul 6 – Sun Jul 12: weekly + 2 prime premiums (Fri 10, Sat 11)
  const est = estimatePrice("2026-07-06", "2026-07-12");
  assert.equal(est.priceCents, PRICING.weeklyCents + 2 * 187_50);
  assert.equal(est.primeNights, 2);
});

test("week + remainder nights", () => {
  // 8 low-season nights: 1 week + 1 off-peak Monday
  const est = estimatePrice("2026-02-09", "2026-02-16");
  assert.equal(est.priceCents, PRICING.weeklyCents + 200_00);
});

test("29 low-season nights round up to one month", () => {
  const est = estimatePrice("2026-02-01", "2026-03-01");
  assert.equal(est.days, 29);
  assert.equal(est.priceCents, PRICING.monthlyCents);
});

test("30 low-season nights bill as one month", () => {
  const est = estimatePrice("2026-02-01", "2026-03-02");
  assert.equal(est.days, 30);
  assert.equal(est.priceCents, PRICING.monthlyCents);
});

test("month + remainder nights", () => {
  // 35 nights: 1 month (Feb 1 – Mar 2) + Mar 3–7 (3 off-peak + Fri/Sat standard)
  const est = estimatePrice("2026-02-01", "2026-03-07");
  assert.equal(est.days, 35);
  assert.equal(
    est.priceCents,
    PRICING.monthlyCents + 2 * 250_00 + 3 * 200_00,
  );
});

test("guardrail: a July month adds premiums for its 8 prime nights", () => {
  // Jul 1–30 contains Fri/Sat pairs on 3,4 / 10,11 / 17,18 / 24,25
  const est = estimatePrice("2026-07-01", "2026-07-30");
  assert.equal(est.days, 30);
  assert.equal(est.primeNights, 8);
  assert.equal(est.priceCents, PRICING.monthlyCents + 8 * 187_50);
});

test("deposit always attached", () => {
  assert.equal(
    estimatePrice("2026-07-10", "2026-07-12").depositCents,
    PRICING.depositCents,
  );
});
