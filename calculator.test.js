const test = require("node:test");
const assert = require("node:assert/strict");

const {
  attorneyEstimate,
  courtAcceptanceFee,
  courtPreservationFee,
  insuranceEstimate
} = require("./calculator.js");

test("estimates the default 1,000,000 yuan Shenzhen litigation costs", () => {
  const attorney = attorneyEstimate(1_000_000);
  const insurance = insuranceEstimate(1_000_000, 0.003);

  assert.deepEqual(attorney, {
    low: 36_200,
    mid: 48_500,
    high: 60_800
  });
  assert.equal(courtAcceptanceFee(1_000_000), 13_800);
  assert.equal(courtPreservationFee(1_000_000), 5_000);
  assert.equal(insurance.mid, 3_000);
});

test("handles lower statutory thresholds", () => {
  assert.equal(courtAcceptanceFee(10_000), 50);
  assert.equal(courtPreservationFee(1_000), 30);
  assert.equal(courtPreservationFee(100_000), 1_020);
});
