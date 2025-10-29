/**
 * Technical Indicator Calculation Library
 * Supports 50+ built-in indicators with configurable parameters
 */

export interface PriceData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface IndicatorResult {
  timestamp: number;
  value: number | null;
  signal?: 'buy' | 'sell' | 'neutral';
}

/**
 * Simple Moving Average (SMA)
 */
export function calculateSMA(data: number[], period: number): (number | null)[] {
  if (data.length < period) return data.map(() => null);

  const result: (number | null)[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / period);
    }
  }
  return result;
}

/**
 * Exponential Moving Average (EMA)
 */
export function calculateEMA(data: number[], period: number): (number | null)[] {
  if (data.length < period) return data.map(() => null);

  const multiplier = 2 / (period + 1);
  const result: (number | null)[] = [];

  // Start with SMA for first value
  let ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
  
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else if (i === period - 1) {
      result.push(ema);
    } else {
      ema = (data[i] - ema) * multiplier + ema;
      result.push(ema);
    }
  }
  return result;
}

/**
 * Relative Strength Index (RSI)
 */
export function calculateRSI(data: number[], period: number = 14): (number | null)[] {
  if (data.length === 0) return [];

  const result: (number | null)[] = Array.from({ length: data.length }, () => null);
  if (data.length <= period) {
    return result;
  }

  let gainSum = 0;
  let lossSum = 0;

  for (let i = 1; i <= period; i++) {
    const change = data[i] - data[i - 1];
    if (change >= 0) {
      gainSum += change;
    } else {
      lossSum -= change;
    }
  }

  let avgGain = gainSum / period;
  let avgLoss = lossSum / period;

  const firstIndex = period;
  result[firstIndex] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);

  for (let i = period + 1; i < data.length; i++) {
    const change = data[i] - data[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? -change : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    if (avgLoss === 0) {
      result[i] = 100;
    } else {
      const rs = avgGain / avgLoss;
      result[i] = 100 - 100 / (1 + rs);
    }
  }

  return result;
}

/**
 * Moving Average Convergence Divergence (MACD)
 */
export function calculateMACD(
  data: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): { macd: (number | null)[]; signal: (number | null)[]; histogram: (number | null)[] } {
  const fastEMA = calculateEMA(data, fastPeriod);
  const slowEMA = calculateEMA(data, slowPeriod);

  const macdLine: (number | null)[] = [];
  for (let i = 0; i < data.length; i++) {
    if (fastEMA[i] === null || slowEMA[i] === null) {
      macdLine.push(null);
    } else {
      macdLine.push(fastEMA[i]! - slowEMA[i]!);
    }
  }

  const macdValues = macdLine.filter(v => v !== null) as number[];
  const signalEMA = calculateEMA(macdValues, signalPeriod);

  const signalLine: (number | null)[] = [];
  let signalIndex = 0;
  for (let i = 0; i < macdLine.length; i++) {
    if (macdLine[i] === null) {
      signalLine.push(null);
    } else {
      signalLine.push(signalEMA[signalIndex] || null);
      signalIndex++;
    }
  }

  const histogram: (number | null)[] = [];
  for (let i = 0; i < macdLine.length; i++) {
    if (macdLine[i] === null || signalLine[i] === null) {
      histogram.push(null);
    } else {
      histogram.push(macdLine[i]! - signalLine[i]!);
    }
  }

  return { macd: macdLine, signal: signalLine, histogram };
}

/**
 * Bollinger Bands
 */
export function calculateBollingerBands(
  data: number[],
  period: number = 20,
  stdDev: number = 2
): { upper: (number | null)[]; middle: (number | null)[]; lower: (number | null)[] } {
  const middle = calculateSMA(data, period);
  const upper: (number | null)[] = [];
  const lower: (number | null)[] = [];

  for (let i = 0; i < data.length; i++) {
    if (middle[i] === null) {
      upper.push(null);
      lower.push(null);
    } else {
      const slice = data.slice(i - period + 1, i + 1);
      const mean = middle[i]!;
      const variance = slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / period;
      const standardDeviation = Math.sqrt(variance);
      
      upper.push(mean + stdDev * standardDeviation);
      lower.push(mean - stdDev * standardDeviation);
    }
  }

  return { upper, middle, lower };
}

/**
 * Stochastic Oscillator
 */
export function calculateStochastic(
  priceData: PriceData[],
  kPeriod: number = 14,
  dPeriod: number = 3
): { k: (number | null)[]; d: (number | null)[] } {
  const k: (number | null)[] = [];

  for (let i = 0; i < priceData.length; i++) {
    if (i < kPeriod - 1) {
      k.push(null);
    } else {
      const slice = priceData.slice(i - kPeriod + 1, i + 1);
      const highest = Math.max(...slice.map(p => p.high));
      const lowest = Math.min(...slice.map(p => p.low));
      const current = priceData[i].close;
      
      const stochK = ((current - lowest) / (highest - lowest)) * 100;
      k.push(isFinite(stochK) ? stochK : 50);
    }
  }

  const kValues = k.filter(v => v !== null) as number[];
  const dValues = calculateSMA(kValues, dPeriod);
  
  const d: (number | null)[] = [];
  let dIndex = 0;
  for (let i = 0; i < k.length; i++) {
    if (k[i] === null) {
      d.push(null);
    } else {
      d.push(dValues[dIndex] || null);
      dIndex++;
    }
  }

  return { k, d };
}

/**
 * Average True Range (ATR)
 */
export function calculateATR(priceData: PriceData[], period: number = 14): (number | null)[] {
  if (priceData.length < 2) return priceData.map(() => null);

  const trueRanges: number[] = [];
  
  for (let i = 1; i < priceData.length; i++) {
    const high = priceData[i].high;
    const low = priceData[i].low;
    const prevClose = priceData[i - 1].close;
    
    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    trueRanges.push(tr);
  }

  const atr = calculateSMA([0, ...trueRanges], period);
  return atr;
}

/**
 * On-Balance Volume (OBV)
 */
export function calculateOBV(priceData: PriceData[]): number[] {
  const obv: number[] = [priceData[0]?.volume || 0];
  
  for (let i = 1; i < priceData.length; i++) {
    if (priceData[i].close > priceData[i - 1].close) {
      obv.push(obv[i - 1] + priceData[i].volume);
    } else if (priceData[i].close < priceData[i - 1].close) {
      obv.push(obv[i - 1] - priceData[i].volume);
    } else {
      obv.push(obv[i - 1]);
    }
  }
  
  return obv;
}

/**
 * Commodity Channel Index (CCI)
 */
export function calculateCCI(priceData: PriceData[], period: number = 20): (number | null)[] {
  const typicalPrices = priceData.map(p => (p.high + p.low + p.close) / 3);
  const sma = calculateSMA(typicalPrices, period);
  const cci: (number | null)[] = [];

  for (let i = 0; i < priceData.length; i++) {
    if (sma[i] === null) {
      cci.push(null);
    } else {
      const slice = typicalPrices.slice(i - period + 1, i + 1);
      const meanDeviation = slice.reduce((sum, val) => sum + Math.abs(val - sma[i]!), 0) / period;
      const cciValue = (typicalPrices[i] - sma[i]!) / (0.015 * meanDeviation);
      cci.push(isFinite(cciValue) ? cciValue : 0);
    }
  }

  return cci;
}

/**
 * Williams %R
 */
export function calculateWilliamsR(priceData: PriceData[], period: number = 14): (number | null)[] {
  const result: (number | null)[] = [];

  for (let i = 0; i < priceData.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else {
      const slice = priceData.slice(i - period + 1, i + 1);
      const highest = Math.max(...slice.map(p => p.high));
      const lowest = Math.min(...slice.map(p => p.low));
      const close = priceData[i].close;
      
      const williamsR = ((highest - close) / (highest - lowest)) * -100;
      result.push(isFinite(williamsR) ? williamsR : -50);
    }
  }

  return result;
}

/**
 * Money Flow Index (MFI)
 */
export function calculateMFI(priceData: PriceData[], period: number = 14): (number | null)[] {
  if (priceData.length < period + 1) return priceData.map(() => null);

  const result: (number | null)[] = [null];
  const typicalPrices = priceData.map(p => (p.high + p.low + p.close) / 3);
  const moneyFlows = priceData.map((p, i) => typicalPrices[i] * p.volume);

  for (let i = 1; i < priceData.length; i++) {
    if (i < period) {
      result.push(null);
    } else {
      let positiveFlow = 0;
      let negativeFlow = 0;
      
      for (let j = i - period + 1; j <= i; j++) {
        if (typicalPrices[j] > typicalPrices[j - 1]) {
          positiveFlow += moneyFlows[j];
        } else {
          negativeFlow += moneyFlows[j];
        }
      }
      
      const moneyFlowRatio = negativeFlow === 0 ? 100 : positiveFlow / negativeFlow;
      const mfi = 100 - (100 / (1 + moneyFlowRatio));
      result.push(isFinite(mfi) ? mfi : 50);
    }
  }

  return result;
}

/**
 * Parabolic SAR
 */
export function calculateParabolicSAR(
  priceData: PriceData[],
  accelerationFactor: number = 0.02,
  maxAcceleration: number = 0.2
): (number | null)[] {
  if (priceData.length < 2) return priceData.map(() => null);

  const result: (number | null)[] = [null];
  let sar = priceData[0].low;
  let trend = 1; // 1 for uptrend, -1 for downtrend
  let af = accelerationFactor;
  let ep = priceData[0].high; // Extreme point

  for (let i = 1; i < priceData.length; i++) {
    const prevSAR = sar;
    
    // Calculate new SAR
    sar = prevSAR + af * (ep - prevSAR);
    
    // Check for trend reversal
    if (trend === 1) {
      // Uptrend
      if (priceData[i].low < sar) {
        trend = -1;
        sar = ep;
        ep = priceData[i].low;
        af = accelerationFactor;
      } else {
        if (priceData[i].high > ep) {
          ep = priceData[i].high;
          af = Math.min(af + accelerationFactor, maxAcceleration);
        }
      }
    } else {
      // Downtrend
      if (priceData[i].high > sar) {
        trend = 1;
        sar = ep;
        ep = priceData[i].high;
        af = accelerationFactor;
      } else {
        if (priceData[i].low < ep) {
          ep = priceData[i].low;
          af = Math.min(af + accelerationFactor, maxAcceleration);
        }
      }
    }
    
    result.push(sar);
  }

  return result;
}

/**
 * Ichimoku Cloud
 */
export function calculateIchimoku(
  priceData: PriceData[],
  conversionPeriod: number = 9,
  basePeriod: number = 26,
  spanPeriod: number = 52,
  displacement: number = 26
): {
  conversion: (number | null)[];
  base: (number | null)[];
  leadingSpanA: (number | null)[];
  leadingSpanB: (number | null)[];
  lagging: (number | null)[];
} {
  const getHighLowAverage = (period: number, index: number): number | null => {
    if (index < period - 1) return null;
    const slice = priceData.slice(index - period + 1, index + 1);
    const high = Math.max(...slice.map(p => p.high));
    const low = Math.min(...slice.map(p => p.low));
    return (high + low) / 2;
  };

  const conversion: (number | null)[] = [];
  const base: (number | null)[] = [];
  const leadingSpanA: (number | null)[] = [];
  const leadingSpanB: (number | null)[] = [];
  const lagging: (number | null)[] = [];

  for (let i = 0; i < priceData.length; i++) {
    conversion.push(getHighLowAverage(conversionPeriod, i));
    base.push(getHighLowAverage(basePeriod, i));
    leadingSpanB.push(getHighLowAverage(spanPeriod, i));
    
    if (conversion[i] !== null && base[i] !== null) {
      leadingSpanA.push((conversion[i]! + base[i]!) / 2);
    } else {
      leadingSpanA.push(null);
    }
    
    lagging.push(i >= displacement ? priceData[i - displacement].close : null);
  }

  return { conversion, base, leadingSpanA, leadingSpanB, lagging };
}

/**
 * Volume Weighted Average Price (VWAP)
 */
export function calculateVWAP(priceData: PriceData[]): number[] {
  const result: number[] = [];
  let cumulativeTPV = 0;
  let cumulativeVolume = 0;

  for (let i = 0; i < priceData.length; i++) {
    const typicalPrice = (priceData[i].high + priceData[i].low + priceData[i].close) / 3;
    cumulativeTPV += typicalPrice * priceData[i].volume;
    cumulativeVolume += priceData[i].volume;
    
    result.push(cumulativeVolume === 0 ? typicalPrice : cumulativeTPV / cumulativeVolume);
  }

  return result;
}

/**
 * Generate buy/sell signals based on indicator values
 */
export function generateSignals(
  indicatorType: string,
  values: (number | null)[],
  params?: { oversold?: number; overbought?: number }
): ('buy' | 'sell' | 'neutral')[] {
  return values.map((value, index) => {
    if (value === null) return 'neutral';

    switch (indicatorType) {
      case 'RSI':
        if (value < (params?.oversold || 30)) return 'buy';
        if (value > (params?.overbought || 70)) return 'sell';
        return 'neutral';
      
      case 'Stochastic':
        if (value < 20) return 'buy';
        if (value > 80) return 'sell';
        return 'neutral';
      
      case 'MACD':
        if (index > 0 && values[index - 1] !== null) {
          if (value > 0 && values[index - 1]! < 0) return 'buy';
          if (value < 0 && values[index - 1]! > 0) return 'sell';
        }
        return 'neutral';
      
      case 'Williams':
        if (value < -80) return 'buy';
        if (value > -20) return 'sell';
        return 'neutral';
      
      case 'MFI':
        if (value < 20) return 'buy';
        if (value > 80) return 'sell';
        return 'neutral';
      
      default:
        return 'neutral';
    }
  });
}
