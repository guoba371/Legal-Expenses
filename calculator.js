(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
    return;
  }
  root.LegalExpenseCalculator = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  function cumulative(amount, bands, base = 0, previous = 0) {
    if (amount <= 0) return 0;
    let total = base;
    for (const band of bands) {
      const upper = band.upTo;
      const taxable = Math.max(0, Math.min(amount, upper) - previous);
      total += taxable * band.rate;
      if (amount <= upper) return total;
      previous = upper;
    }
    return total;
  }

  function proportionalAttorneyFee(amount) {
    if (amount <= 50_000) return 0;
    const bands = [
      { upTo: 100_000, rate: 0.08 },
      { upTo: 500_000, rate: 0.05 },
      { upTo: 1_000_000, rate: 0.04 },
      { upTo: 5_000_000, rate: 0.03 },
      { upTo: 10_000_000, rate: 0.02 },
      { upTo: 50_000_000, rate: 0.01 },
      { upTo: Infinity, rate: 0.005 }
    ];
    let total = 0;
    let previous = 50_000;
    for (const band of bands) {
      const taxable = Math.max(0, Math.min(amount, band.upTo) - previous);
      total += taxable * band.rate;
      if (amount <= band.upTo) break;
      previous = band.upTo;
    }
    return total;
  }

  function attorneyEstimate(amount) {
    const proportional = proportionalAttorneyFee(amount);
    return {
      low: 1000 + proportional * 0.8,
      mid: 4500 + proportional,
      high: 8000 + proportional * 1.2
    };
  }

  function courtAcceptanceFee(amount) {
    if (amount <= 0) return 0;
    if (amount <= 10_000) return 50;
    return cumulative(amount, [
      { upTo: 100_000, rate: 0.025 },
      { upTo: 200_000, rate: 0.02 },
      { upTo: 500_000, rate: 0.015 },
      { upTo: 1_000_000, rate: 0.01 },
      { upTo: 2_000_000, rate: 0.009 },
      { upTo: 5_000_000, rate: 0.008 },
      { upTo: 10_000_000, rate: 0.007 },
      { upTo: 20_000_000, rate: 0.006 },
      { upTo: Infinity, rate: 0.005 }
    ], 50, 10_000);
  }

  function courtPreservationFee(amount) {
    if (amount <= 0) return 0;
    if (amount <= 1000) return 30;
    const fee = cumulative(amount, [
      { upTo: 100_000, rate: 0.01 },
      { upTo: Infinity, rate: 0.005 }
    ], 30, 1000);
    return Math.min(fee, 5000);
  }

  function insuranceEstimate(amount, midRate) {
    return {
      low: amount * 0.001,
      mid: amount * midRate,
      high: amount * 0.005
    };
  }

  const SHENZHEN_AVERAGE_MONTHLY_WAGE_2024 = 177057 / 12;
  const SHENZHEN_DISPOSABLE_INCOME_2025 = 84945;
  const SHENZHEN_CONSUMPTION_EXPENSE_2025 = 53548;

  const WORK_INJURY_DISABILITY_MONTHS = {
    1: 27,
    2: 25,
    3: 23,
    4: 21,
    5: 18,
    6: 16,
    7: 13,
    8: 11,
    9: 9,
    10: 7
  };

  const WORK_INJURY_MEDICAL_MONTHS = {
    5: 10,
    6: 8,
    7: 6,
    8: 4,
    9: 2,
    10: 1
  };

  const WORK_INJURY_EMPLOYMENT_MONTHS = {
    5: 50,
    6: 40,
    7: 25,
    8: 15,
    9: 8,
    10: 4
  };

  const WORK_INJURY_MONTHLY_ALLOWANCE_RATES = {
    1: 0.9,
    2: 0.85,
    3: 0.8,
    4: 0.75,
    5: 0.7,
    6: 0.6
  };

  function toMoney(value) {
    return Math.round((Number(value) || 0) * 100) / 100;
  }

  function clampWorkInjuryWage(monthlyWage) {
    const wage = Math.max(0, Number(monthlyWage) || 0);
    const min = SHENZHEN_AVERAGE_MONTHLY_WAGE_2024 * 0.6;
    const max = SHENZHEN_AVERAGE_MONTHLY_WAGE_2024 * 3;
    return toMoney(Math.min(Math.max(wage, min), max));
  }

  function line(key, label, amount, note) {
    return { key, label, amount: toMoney(amount), note };
  }

  function workInjuryEstimate(input) {
    const grade = Number(input.grade);
    const wageBase = clampWorkInjuryWage(input.monthlyWage);
    const lines = [
      line("medicalExpense", "医疗费等已发生费用", input.medicalExpense || 0, "按票据或社保核定金额录入"),
      line("paidLeaveWage", "停工留薪期工资", (Number(input.monthlyWage) || 0) * (Number(input.paidLeaveMonths) || 0), "按原工资福利待遇估算"),
      line("hospitalMeal", "住院伙食补助费", (Number(input.hospitalDays) || 0) * (Number(input.mealDailyRate) || 0), "日标准可按实际口径调整"),
      line("nursingFee", "护理费", (Number(input.nursingDays) || 0) * (Number(input.nursingDailyRate) || 0), "按护理天数和日标准估算"),
      line("oneTimeDisabilitySubsidy", "一次性伤残补助金", wageBase * (WORK_INJURY_DISABILITY_MONTHS[grade] || 0), "按本人工资和伤残等级月数计算")
    ];

    if (input.terminateEmployment && WORK_INJURY_MEDICAL_MONTHS[grade]) {
      lines.push(
        line("oneTimeMedicalSubsidy", "一次性工伤医疗补助金", wageBase * WORK_INJURY_MEDICAL_MONTHS[grade], "五级至十级解除或终止劳动关系时估算"),
        line("oneTimeEmploymentSubsidy", "一次性伤残就业补助金", wageBase * WORK_INJURY_EMPLOYMENT_MONTHS[grade], "五级至十级解除或终止劳动关系时估算")
      );
    }

    const monthlyAllowanceRate = WORK_INJURY_MONTHLY_ALLOWANCE_RATES[grade] || 0;
    const monthlyAllowance = monthlyAllowanceRate ? toMoney(wageBase * monthlyAllowanceRate) : 0;
    const oneTimeTotal = toMoney(lines.reduce((sum, item) => sum + item.amount, 0));

    return {
      grade,
      wageBase,
      averageMonthlyWage: toMoney(SHENZHEN_AVERAGE_MONTHLY_WAGE_2024),
      monthlyAllowance,
      monthlyAllowanceRate,
      lines,
      oneTimeTotal
    };
  }

  function compensationYears(age) {
    const years = Number(age) || 0;
    if (years <= 60) return 20;
    if (years >= 75) return 5;
    return 20 - (years - 60);
  }

  function disabilityCoefficient(grade) {
    const numericGrade = Number(grade);
    if (numericGrade < 1 || numericGrade > 10) return 0;
    return toMoney((11 - numericGrade) / 10);
  }

  function trafficAccidentEstimate(input) {
    const injuryType = input.injuryType || "disability";
    const years = compensationYears(input.age);
    const coefficient = injuryType === "death" ? 1 : disabilityCoefficient(input.disabilityGrade);
    const liabilityRate = Math.max(0, Math.min(100, Number(input.liabilityPercent) || 0)) / 100;
    const dependentObligors = Math.max(1, Number(input.dependentObligors) || 1);
    const dependentYears = Math.max(0, Number(input.dependentYears) || 0);

    const lines = [
      line("medicalExpense", "医疗费", input.medicalExpense || 0, "按票据金额录入"),
      line("lostWages", "误工费", ((Number(input.monthlyIncome) || 0) / 30) * (Number(input.lostWorkDays) || 0), "按月收入折算日收入"),
      line("nursingFee", "护理费", (Number(input.nursingDays) || 0) * (Number(input.nursingDailyRate) || 0), "按护理天数和日标准估算"),
      line("hospitalMeal", "住院伙食补助费", (Number(input.hospitalDays) || 0) * (Number(input.mealDailyRate) || 0), "日标准可按实际口径调整"),
      line("nutritionFee", "营养费", (Number(input.nutritionDays) || 0) * (Number(input.nutritionDailyRate) || 0), "按医嘱天数和日标准估算"),
      line("transportExpense", "交通费", input.transportExpense || 0, "按实际必要支出录入"),
      line("propertyDamage", "财产损失", input.propertyDamage || 0, "车辆、物品等损失"),
      line("mentalDistress", "精神损害抚慰金", input.mentalDistress || 0, "按协商或裁判口径录入")
    ];

    if (injuryType === "death") {
      lines.push(
        line("deathCompensation", "死亡赔偿金", SHENZHEN_DISPOSABLE_INCOME_2025 * years, "按深圳居民人均可支配收入和赔偿年限估算"),
        line("funeralExpense", "丧葬费", SHENZHEN_AVERAGE_MONTHLY_WAGE_2024 * 6, "按深圳在岗职工月平均工资六个月估算")
      );
    } else if (injuryType === "disability") {
      lines.push(
        line("disabilityCompensation", "残疾赔偿金", SHENZHEN_DISPOSABLE_INCOME_2025 * years * coefficient, "单一伤残等级估算，多等级伤残需人工调整")
      );
    }

    if (dependentYears > 0) {
      lines.push(
        line("dependentLivingExpense", "被扶养人生活费", SHENZHEN_CONSUMPTION_EXPENSE_2025 * dependentYears * coefficient / dependentObligors, "按深圳居民人均消费支出估算")
      );
    }

    const grossTotal = toMoney(lines.reduce((sum, item) => sum + item.amount, 0));
    const payableTotal = toMoney(grossTotal * liabilityRate);

    return {
      injuryType,
      compensationYears: years,
      disabilityCoefficient: coefficient,
      liabilityRate,
      incomeStandard: SHENZHEN_DISPOSABLE_INCOME_2025,
      consumptionStandard: SHENZHEN_CONSUMPTION_EXPENSE_2025,
      lines,
      grossTotal,
      payableTotal
    };
  }

  function escapeExcelCell(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function buildExcelWorkbook(sections) {
    const tables = sections.map((section) => {
      const rows = section.rows.map((row) => (
        "<tr>" + row.map((cell) => "<td>" + escapeExcelCell(cell) + "</td>").join("") + "</tr>"
      )).join("");
      return "<h2>" + escapeExcelCell(section.title) + "</h2><table>" + rows + "</table>";
    }).join("");

    return [
      '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">',
      "<head>",
      '<meta charset="UTF-8">',
      "<style>",
      "body{font-family:Arial,'Microsoft YaHei',sans-serif;}table{border-collapse:collapse;margin-bottom:24px;}td{border:1px solid #999;padding:6px 10px;}h2{margin:18px 0 8px;}",
      "</style>",
      "</head>",
      "<body>",
      tables,
      "</body></html>"
    ].join("");
  }

  return {
    attorneyEstimate,
    courtAcceptanceFee,
    courtPreservationFee,
    insuranceEstimate,
    workInjuryEstimate,
    trafficAccidentEstimate,
    buildExcelWorkbook
  };
});
