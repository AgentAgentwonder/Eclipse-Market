import { CustomIndicator, IndicatorNode, IndicatorValue, CandleData } from '../types/indicators';

export class IndicatorEngine {
  private cache = new Map<string, IndicatorValue[]>();

  evaluateIndicator(
    indicator: CustomIndicator,
    candles: CandleData[]
  ): IndicatorValue[] {
    const cacheKey = `${indicator.id}-${candles.length}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const result = this.evaluateNode(indicator.outputNodeId, indicator, candles);
    this.cache.set(cacheKey, result);
    return result;
  }

  private evaluateNode(
    nodeId: string,
    indicator: CustomIndicator,
    candles: CandleData[]
  ): IndicatorValue[] {
    const node = indicator.nodes.find(n => n.id === nodeId);
    if (!node) {
      throw new Error(`Node ${nodeId} not found`);
    }

    switch (node.type) {
      case 'constant':
        return candles.map(c => ({
          timestamp: c.timestamp,
          value: Number(node.value ?? 0),
        }));

      case 'indicator':
        return this.evaluateBuiltInIndicator(node, candles);

      case 'operator':
        return this.evaluateOperator(node, indicator, candles);

      case 'condition':
        return this.evaluateCondition(node, indicator, candles);

      default:
        throw new Error(`Unknown node type: ${node.type}`);
    }
  }

  private evaluateBuiltInIndicator(
    node: IndicatorNode,
    candles: CandleData[]
  ): IndicatorValue[] {
    const { indicator, params = {} } = node;

    switch (indicator) {
      case 'sma':
        return this.calculateSMA(candles, params.period ?? 20);
      case 'ema':
        return this.calculateEMA(candles, params.period ?? 20);
      case 'rsi':
        return this.calculateRSI(candles, params.period ?? 14);
      case 'volume':
        return candles.map(c => ({ timestamp: c.timestamp, value: c.volume }));
      default:
        throw new Error(`Unknown indicator: ${indicator}`);
    }
  }

  private evaluateOperator(
    node: IndicatorNode,
    indicator: CustomIndicator,
    candles: CandleData[]
  ): IndicatorValue[] {
    if (!node.inputs || node.inputs.length < 2) {
      throw new Error('Operator node requires at least 2 inputs');
    }

    const left = this.evaluateNode(node.inputs[0], indicator, candles);
    const right = this.evaluateNode(node.inputs[1], indicator, candles);

    return left.map((leftVal, i) => {
      const rightVal = right[i]?.value ?? 0;
      let result = 0;

      switch (node.operator) {
        case '+':
          result = leftVal.value + rightVal;
          break;
        case '-':
          result = leftVal.value - rightVal;
          break;
        case '*':
          result = leftVal.value * rightVal;
          break;
        case '/':
          result = rightVal !== 0 ? leftVal.value / rightVal : 0;
          break;
        default:
          result = leftVal.value;
      }

      return {
        timestamp: leftVal.timestamp,
        value: result,
      };
    });
  }

  private evaluateCondition(
    node: IndicatorNode,
    indicator: CustomIndicator,
    candles: CandleData[]
  ): IndicatorValue[] {
    if (!node.inputs || node.inputs.length < 2) {
      throw new Error('Condition node requires at least 2 inputs');
    }

    const left = this.evaluateNode(node.inputs[0], indicator, candles);
    const right = this.evaluateNode(node.inputs[1], indicator, candles);

    return left.map((leftVal, i) => {
      const rightVal = right[i]?.value ?? 0;
      let result = 0;

      switch (node.operator) {
        case '>':
          result = leftVal.value > rightVal ? 1 : 0;
          break;
        case '<':
          result = leftVal.value < rightVal ? 1 : 0;
          break;
        case '==':
          result = Math.abs(leftVal.value - rightVal) < 0.0001 ? 1 : 0;
          break;
        case '&&':
          result = leftVal.value !== 0 && rightVal !== 0 ? 1 : 0;
          break;
        case '||':
          result = leftVal.value !== 0 || rightVal !== 0 ? 1 : 0;
          break;
        default:
          result = 0;
      }

      return {
        timestamp: leftVal.timestamp,
        value: result,
      };
    });
  }

  private calculateSMA(candles: CandleData[], period: number): IndicatorValue[] {
    const result: IndicatorValue[] = [];

    for (let i = 0; i < candles.length; i++) {
      if (i < period - 1) {
        result.push({ timestamp: candles[i].timestamp, value: 0 });
        continue;
      }

      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += candles[i - j].close;
      }

      result.push({
        timestamp: candles[i].timestamp,
        value: sum / period,
      });
    }

    return result;
  }

  private calculateEMA(candles: CandleData[], period: number): IndicatorValue[] {
    const result: IndicatorValue[] = [];
    const multiplier = 2 / (period + 1);

    // Start with SMA for first value
    let ema = 0;
    for (let i = 0; i < Math.min(period, candles.length); i++) {
      ema += candles[i].close;
    }
    ema = ema / Math.min(period, candles.length);

    for (let i = 0; i < candles.length; i++) {
      if (i < period - 1) {
        result.push({ timestamp: candles[i].timestamp, value: 0 });
        continue;
      }

      ema = (candles[i].close - ema) * multiplier + ema;
      result.push({ timestamp: candles[i].timestamp, value: ema });
    }

    return result;
  }

  private calculateRSI(candles: CandleData[], period: number): IndicatorValue[] {
    const result: IndicatorValue[] = [];
    const changes: number[] = [];

    for (let i = 1; i < candles.length; i++) {
      changes.push(candles[i].close - candles[i - 1].close);
    }

    for (let i = 0; i < candles.length; i++) {
      if (i < period) {
        result.push({ timestamp: candles[i].timestamp, value: 50 });
        continue;
      }

      let gains = 0;
      let losses = 0;

      for (let j = 0; j < period; j++) {
        const change = changes[i - period + j];
        if (change > 0) {
          gains += change;
        } else {
          losses -= change;
        }
      }

      const avgGain = gains / period;
      const avgLoss = losses / period;
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      const rsi = 100 - 100 / (1 + rs);

      result.push({ timestamp: candles[i].timestamp, value: rsi });
    }

    return result;
  }

  clearCache() {
    this.cache.clear();
  }
}

export function runSimpleBacktest(
  indicator: CustomIndicator,
  candles: CandleData[],
  threshold: number = 0
) {
  const values = indicatorEngine.evaluateIndicator(indicator, candles);
  const signals = [] as Array<{ timestamp: number; type: 'buy' | 'sell'; price: number; value: number }>;

  for (let i = 1; i < values.length; i++) {
    const prev = values[i - 1].value;
    const current = values[i].value;

    if (prev <= threshold && current > threshold) {
      signals.push({
        timestamp: values[i].timestamp,
        type: 'buy',
        price: candles[i].close,
        value: current,
      });
    }

    if (prev >= threshold && current < threshold) {
      signals.push({
        timestamp: values[i].timestamp,
        type: 'sell',
        price: candles[i].close,
        value: current,
      });
    }
  }

  const performance = {
    totalTrades: signals.length,
    profitableTrades: 0,
    totalReturn: 0,
    maxDrawdown: 0,
    sharpeRatio: 0,
  };

  // Simple performance calculation assuming alternating buy/sell
  let position: 'none' | 'long' = 'none';
  let entryPrice = 0;
  let cumulativeReturn = 0;
  let peak = 0;
  let trough = 0;

  for (const signal of signals) {
    if (signal.type === 'buy' && position === 'none') {
      position = 'long';
      entryPrice = signal.price;
      peak = signal.price;
      trough = signal.price;
    } else if (signal.type === 'sell' && position === 'long') {
      const tradeReturn = (signal.price - entryPrice) / entryPrice;
      cumulativeReturn += tradeReturn;
      if (tradeReturn > 0) performance.profitableTrades += 1;
      position = 'none';

      peak = Math.max(peak, signal.price);
      trough = Math.min(trough, signal.price);
      const drawdown = peak > 0 ? (peak - trough) / peak : 0;
      performance.maxDrawdown = Math.max(performance.maxDrawdown, drawdown);
    }
  }

  performance.totalReturn = cumulativeReturn;
  performance.sharpeRatio = signals.length > 0 ? cumulativeReturn / Math.sqrt(signals.length) : 0;

  return {
    indicator,
    signals,
    performance,
  };
}

export const indicatorEngine = new IndicatorEngine();
