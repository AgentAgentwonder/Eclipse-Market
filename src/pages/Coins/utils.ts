export function formatCurrencyAbbrev(value: number, precision = 2): string {
  const absValue = Math.abs(value);

  if (absValue >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(precision)}B`;
  }

  if (absValue >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(precision)}M`;
  }

  if (absValue >= 1_000) {
    return `${(value / 1_000).toFixed(precision)}K`;
  }

  return value.toFixed(precision);
}

export function formatTimeAgo(
  timestampSeconds: number,
  nowSeconds: number = Date.now() / 1000
): string {
  const diff = Math.max(nowSeconds - timestampSeconds, 0);

  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function deriveSparklineTrend(data: number[]): 'up' | 'down' | 'flat' {
  if (!data.length) return 'flat';
  const first = data[0];
  const last = data[data.length - 1];
  const diff = last - first;
  const threshold = Math.abs(first) * 0.005;

  if (diff > threshold) return 'up';
  if (diff < -threshold) return 'down';
  return 'flat';
}

export function normalizeSparkline(data: number[], targetLength = 24): number[] {
  if (data.length === targetLength) return data;
  if (data.length === 0) return Array.from({ length: targetLength }, () => 0);

  const normalized: number[] = [];
  const step = (data.length - 1) / (targetLength - 1);

  for (let i = 0; i < targetLength; i++) {
    const index = i * step;
    const lower = Math.floor(index);
    const upper = Math.ceil(index);

    if (lower === upper) {
      normalized.push(data[lower]);
    } else {
      const weight = index - lower;
      const interpolated = data[lower] * (1 - weight) + data[upper] * weight;
      normalized.push(Number(interpolated.toFixed(6)));
    }
  }

  return normalized;
}
