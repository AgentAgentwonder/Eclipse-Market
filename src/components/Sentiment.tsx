import { SentimentDashboard } from './sentiment/SentimentDashboard';

interface SentimentProps {
  tokenAddress?: string;
}

export function Sentiment({ tokenAddress = 'So11111111111111111111111111111111111111112' }: SentimentProps) {
  return <SentimentDashboard tokenAddress={tokenAddress} />;
}
