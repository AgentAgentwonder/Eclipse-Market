import { VolumeProfileData, VolumeProfileLevel, CandleData } from '../types/indicators';

export function calculateVolumeProfile(
  candles: CandleData[],
  numLevels: number = 50
): VolumeProfileData {
  if (candles.length === 0) {
    return {
      levels: [],
      poc: 0,
      valueAreaHigh: 0,
      valueAreaLow: 0,
      vwap: 0,
      vwapBandUpper: 0,
      vwapBandLower: 0,
    };
  }

  // Find price range
  let minPrice = Infinity;
  let maxPrice = -Infinity;
  for (const candle of candles) {
    minPrice = Math.min(minPrice, candle.low);
    maxPrice = Math.max(maxPrice, candle.high);
  }

  // Create price levels
  const priceStep = (maxPrice - minPrice) / numLevels;
  const levels: VolumeProfileLevel[] = [];

  for (let i = 0; i < numLevels; i++) {
    const price = minPrice + i * priceStep;
    levels.push({
      price,
      volume: 0,
      buyVolume: 0,
      sellVolume: 0,
      delta: 0,
    });
  }

  // Distribute volume across price levels
  let totalVolume = 0;
  let totalValue = 0;

  for (const candle of candles) {
    const candleRange = candle.high - candle.low;
    if (candleRange === 0) continue;

    // Determine buy/sell volume based on close vs open
    const buyVolume = candle.buyVolume ?? (candle.close >= candle.open ? candle.volume : 0);
    const sellVolume = candle.sellVolume ?? (candle.close < candle.open ? candle.volume : 0);

    // Distribute volume to levels within candle range
    for (const level of levels) {
      if (level.price >= candle.low && level.price <= candle.high) {
        const volumeContribution = candle.volume / numLevels;
        level.volume += volumeContribution;
        level.buyVolume += (buyVolume / numLevels);
        level.sellVolume += (sellVolume / numLevels);
        level.delta = level.buyVolume - level.sellVolume;
      }
    }

    totalVolume += candle.volume;
    totalValue += (candle.high + candle.low + candle.close) / 3 * candle.volume;
  }

  // Find Point of Control (POC) - level with highest volume
  let poc = levels[0].price;
  let maxVol = 0;
  for (const level of levels) {
    if (level.volume > maxVol) {
      maxVol = level.volume;
      poc = level.price;
    }
  }

  // Calculate Value Area (70% of total volume)
  const sortedByVolume = [...levels].sort((a, b) => b.volume - a.volume);
  let volumeAccumulated = 0;
  const valueAreaThreshold = totalVolume * 0.7;
  const valueAreaLevels: VolumeProfileLevel[] = [];

  for (const level of sortedByVolume) {
    if (volumeAccumulated >= valueAreaThreshold) break;
    volumeAccumulated += level.volume;
    valueAreaLevels.push(level);
  }

  const valueAreaPrices = valueAreaLevels.map(l => l.price).sort((a, b) => a - b);
  const valueAreaHigh = valueAreaPrices[valueAreaPrices.length - 1] || maxPrice;
  const valueAreaLow = valueAreaPrices[0] || minPrice;

  // Calculate VWAP
  const vwap = totalVolume > 0 ? totalValue / totalVolume : 0;

  // Calculate VWAP bands (standard deviation)
  let sumSquaredDiff = 0;
  for (const candle of candles) {
    const typicalPrice = (candle.high + candle.low + candle.close) / 3;
    sumSquaredDiff += Math.pow(typicalPrice - vwap, 2) * candle.volume;
  }
  const variance = totalVolume > 0 ? sumSquaredDiff / totalVolume : 0;
  const stdDev = Math.sqrt(variance);

  const vwapBandUpper = vwap + stdDev * 2;
  const vwapBandLower = vwap - stdDev * 2;

  return {
    levels,
    poc,
    valueAreaHigh,
    valueAreaLow,
    vwap,
    vwapBandUpper,
    vwapBandLower,
  };
}

export function calculateOrderFlowColor(
  candle: CandleData,
  volumeProfile: VolumeProfileData
): string {
  const delta = (candle.buyVolume ?? 0) - (candle.sellVolume ?? 0);
  const volumeRatio = candle.volume > 0 ? Math.abs(delta) / candle.volume : 0;

  if (delta > 0) {
    // Buying pressure
    if (volumeRatio > 0.7) return '#10b981'; // Strong buy - green
    if (volumeRatio > 0.4) return '#34d399'; // Moderate buy - light green
    return '#6ee7b7'; // Weak buy - very light green
  } else {
    // Selling pressure
    if (volumeRatio > 0.7) return '#ef4444'; // Strong sell - red
    if (volumeRatio > 0.4) return '#f87171'; // Moderate sell - light red
    return '#fca5a5'; // Weak sell - very light red
  }
}

export function calculateVWAPFromCandles(candles: CandleData[]): number {
  let totalValue = 0;
  let totalVolume = 0;

  for (const candle of candles) {
    const typicalPrice = (candle.high + candle.low + candle.close) / 3;
    totalValue += typicalPrice * candle.volume;
    totalVolume += candle.volume;
  }

  return totalVolume > 0 ? totalValue / totalVolume : 0;
}
