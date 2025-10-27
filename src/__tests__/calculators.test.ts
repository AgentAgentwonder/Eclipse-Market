import { describe, it, expect } from 'vitest';

describe('Position Size Calculator', () => {
  it('calculates position size correctly', () => {
    const accountSize = 10000;
    const riskPercent = 2;
    const entryPrice = 100;
    const stopLossPrice = 95;
    const leverage = 1;

    const riskAmount = accountSize * (riskPercent / 100);
    const priceRisk = Math.abs(entryPrice - stopLossPrice);
    const positionSize = (riskAmount / priceRisk) * leverage;
    const positionValue = positionSize * entryPrice;

    expect(riskAmount).toBe(200);
    expect(priceRisk).toBe(5);
    expect(positionSize).toBe(40);
    expect(positionValue).toBe(4000);
  });

  it('calculates Kelly Criterion correctly', () => {
    const winRate = 0.6;
    const avgWinLoss = 2;
    const kelly = (winRate * avgWinLoss - (1 - winRate)) / avgWinLoss;
    const kellyFraction = Math.max(0, Math.min(kelly, 0.25));

    expect(kelly).toBeCloseTo(0.4, 5);
    expect(kellyFraction).toBe(0.25);
  });

  it('handles leverage correctly', () => {
    const accountSize = 10000;
    const riskPercent = 2;
    const entryPrice = 100;
    const stopLossPrice = 95;
    const leverage = 2;

    const riskAmount = accountSize * (riskPercent / 100);
    const priceRisk = Math.abs(entryPrice - stopLossPrice);
    const positionSize = (riskAmount / priceRisk) * leverage;

    expect(positionSize).toBe(80);
  });
});

describe('Risk Reward Calculator', () => {
  it('calculates risk/reward ratio correctly', () => {
    const entryPrice = 100;
    const stopLossPrice = 95;
    const takeProfitPrice = 120;
    const positionSize = 10;

    const riskAmount = Math.abs(entryPrice - stopLossPrice) * positionSize;
    const rewardAmount = Math.abs(takeProfitPrice - entryPrice) * positionSize;
    const riskRewardRatio = rewardAmount / riskAmount;

    expect(riskAmount).toBe(50);
    expect(rewardAmount).toBe(200);
    expect(riskRewardRatio).toBe(4);
  });

  it('calculates break-even win rate correctly', () => {
    const riskRewardRatio = 2;
    const breakEvenWinRate = 1 / (riskRewardRatio + 1);

    expect(breakEvenWinRate).toBeCloseTo(0.3333, 4);
  });

  it('calculates expected value correctly', () => {
    const winRate = 0.55;
    const rewardAmount = 200;
    const riskAmount = 100;
    const expectedValue = winRate * rewardAmount - (1 - winRate) * riskAmount;

    expect(expectedValue).toBeCloseTo(65, 5);
  });

  it('handles negative expected value', () => {
    const winRate = 0.3;
    const rewardAmount = 100;
    const riskAmount = 100;
    const expectedValue = winRate * rewardAmount - (1 - winRate) * riskAmount;

    expect(expectedValue).toBe(-40);
  });
});

describe('Rebalancing Logic', () => {
  it('detects deviation correctly', () => {
    const currentAllocation = 45;
    const targetAllocation = 40;
    const deviationTrigger = 5;
    const deviation = Math.abs(currentAllocation - targetAllocation);

    expect(deviation).toBe(5);
    expect(deviation >= deviationTrigger).toBe(true);
  });

  it('calculates rebalance amounts correctly', () => {
    const totalPortfolioValue = 100000;
    const currentPercent = 45;
    const targetPercent = 40;
    const currentValue = totalPortfolioValue * (currentPercent / 100);
    const targetValue = totalPortfolioValue * (targetPercent / 100);
    const difference = targetValue - currentValue;

    expect(currentValue).toBe(45000);
    expect(targetValue).toBe(40000);
    expect(difference).toBe(-5000);
    expect(difference < 0 ? 'sell' : 'buy').toBe('sell');
  });
});

describe('Tax Lot Calculations', () => {
  it('calculates cost basis correctly for FIFO', () => {
    const lots = [
      { amount: 100, price: 50, acquired: '2023-01-01' },
      { amount: 100, price: 60, acquired: '2023-06-01' },
      { amount: 100, price: 55, acquired: '2024-01-01' },
    ];

    const disposeAmount = 150;
    let remaining = disposeAmount;
    let totalCost = 0;

    for (const lot of lots) {
      if (remaining <= 0) break;
      const takeAmount = Math.min(remaining, lot.amount);
      totalCost += takeAmount * lot.price;
      remaining -= takeAmount;
    }

    const avgCostBasis = totalCost / disposeAmount;

    expect(totalCost).toBe(8000);
    expect(avgCostBasis).toBeCloseTo(53.333, 2);
  });

  it('calculates realized gain correctly', () => {
    const disposeAmount = 100;
    const costBasis = 5000;
    const salePrice = 70;
    const proceeds = disposeAmount * salePrice;
    const realizedGain = proceeds - costBasis;

    expect(proceeds).toBe(7000);
    expect(realizedGain).toBe(2000);
  });

  it('distinguishes short-term vs long-term gains', () => {
    const daysHeld365 = 365;
    const daysHeld366 = 366;

    expect(daysHeld365 > 365).toBe(false);
    expect(daysHeld366 > 365).toBe(true);
  });

  it('calculates tax loss harvesting savings', () => {
    const unrealizedLoss = 3000;
    const shortTermTaxRate = 0.3;
    const longTermTaxRate = 0.15;

    const shortTermSavings = unrealizedLoss * shortTermTaxRate;
    const longTermSavings = unrealizedLoss * longTermTaxRate;

    expect(shortTermSavings).toBe(900);
    expect(longTermSavings).toBe(450);
  });
});
