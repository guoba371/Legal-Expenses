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

  return {
    attorneyEstimate,
    courtAcceptanceFee,
    courtPreservationFee,
    insuranceEstimate
  };
});
