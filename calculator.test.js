const test = require("node:test");
const assert = require("node:assert/strict");

const {
  attorneyEstimate,
  courtAcceptanceFee,
  courtPreservationFee,
  insuranceEstimate,
  workInjuryEstimate,
  trafficAccidentEstimate,
  buildExcelWorkbook
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

test("estimates Shenzhen work injury disability compensation with itemized lines", () => {
  const result = workInjuryEstimate({
    monthlyWage: 12_000,
    grade: 10,
    terminateEmployment: true,
    medicalExpense: 8_000,
    paidLeaveMonths: 3,
    hospitalDays: 10,
    nursingDays: 10,
    nursingDailyRate: 200,
    mealDailyRate: 100
  });

  assert.equal(result.wageBase, 12_000);
  assert.deepEqual(result.lines.map((line) => [line.key, line.amount]), [
    ["medicalExpense", 8_000],
    ["paidLeaveWage", 36_000],
    ["hospitalMeal", 1_000],
    ["nursingFee", 2_000],
    ["oneTimeDisabilitySubsidy", 84_000],
    ["oneTimeMedicalSubsidy", 12_000],
    ["oneTimeEmploymentSubsidy", 48_000]
  ]);
  assert.equal(result.oneTimeTotal, 191_000);
});

test("estimates Shenzhen traffic accident disability compensation after liability split", () => {
  const result = trafficAccidentEstimate({
    injuryType: "disability",
    age: 35,
    disabilityGrade: 10,
    liabilityPercent: 70,
    medicalExpense: 20_000,
    monthlyIncome: 15_000,
    lostWorkDays: 60,
    nursingDays: 30,
    nursingDailyRate: 200,
    hospitalDays: 15,
    mealDailyRate: 100,
    nutritionDays: 30,
    nutritionDailyRate: 50,
    transportExpense: 1_000,
    propertyDamage: 3_000,
    mentalDistress: 10_000,
    dependentYears: 0,
    dependentObligors: 1
  });

  assert.equal(result.compensationYears, 20);
  assert.equal(result.disabilityCoefficient, 0.1);
  assert.equal(result.lines.find((line) => line.key === "disabilityCompensation").amount, 169_890);
  assert.equal(result.grossTotal, 242_890);
  assert.equal(result.payableTotal, 170_023);
});

test("builds an Excel workbook html document with escaped table cells", () => {
  const workbook = buildExcelWorkbook([
    {
      title: "起诉费用",
      rows: [
        ["项目", "金额", "说明"],
        ["中位口径合计", 70300, "律师费 < 法院费 & 保险费"]
      ]
    }
  ]);

  assert.match(workbook, /<html[^>]*xmlns:o="urn:schemas-microsoft-com:office:office"/);
  assert.match(workbook, /<h2>起诉费用<\/h2>/);
  assert.match(workbook, /<td>70300<\/td>/);
  assert.match(workbook, /律师费 &lt; 法院费 &amp; 保险费/);
});
