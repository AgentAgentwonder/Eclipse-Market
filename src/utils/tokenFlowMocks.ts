import { TokenTransaction } from '../types/tokenFlow';

interface MockConfig {
  tokenAddress: string;
  startTimestamp: number;
  intervals?: number;
}

const SOURCE_WALLETS = ['0xSRC001', '0xSRC002', '0xSRC003'];
const INTERMEDIATE_WALLETS = ['0xHUB100', '0xHUB101', '0xHUB102'];
const DESTINATION_WALLETS = ['0xDST900', '0xDST901', '0xDST902'];
const WASH_WALLETS = ['0xWASH01', '0xWASH02', '0xWASH03'];
const LAYERED_PATH = ['0xLYR01', '0xLYR02', '0xLYR03', '0xLYR04'];

export function createMockTransactions(config: MockConfig): TokenTransaction[] {
  const { tokenAddress, startTimestamp, intervals = 300 } = config;
  const transactions: TokenTransaction[] = [];

  let currentTimestamp = startTimestamp;
  let txCounter = 0;

  const pushTx = (source: string, target: string, amount: number) => {
    transactions.push({
      source,
      target,
      amount,
      timestamp: currentTimestamp,
      tokenAddress,
      transactionHash: `0xTX${(++txCounter).toString().padStart(6, '0')}`,
    });
    currentTimestamp += intervals;
  };

  // Core flow: sources -> intermediates
  SOURCE_WALLETS.forEach((source, idx) => {
    const target = INTERMEDIATE_WALLETS[idx % INTERMEDIATE_WALLETS.length];
    pushTx(source, target, 5_000 + idx * 1_250);
  });

  // Intermediate redistribution
  INTERMEDIATE_WALLETS.forEach((hub, idx) => {
    const destination = DESTINATION_WALLETS[idx % DESTINATION_WALLETS.length];
    pushTx(hub, destination, 4_800 + idx * 800);
  });

  // Create a circular flow for suspicion
  pushTx('0xCYCLE01', '0xCYCLE02', 12_000);
  pushTx('0xCYCLE02', '0xCYCLE03', 12_500);
  pushTx('0xCYCLE03', '0xCYCLE01', 12_400);

  // Additional transactions among cycle wallets to strengthen pattern
  pushTx('0xCYCLE01', '0xCYCLE03', 6_000);
  pushTx('0xCYCLE02', '0xCYCLE01', 6_200);

  // Wash trading ping-pong
  pushTx(WASH_WALLETS[0], WASH_WALLETS[1], 8_000);
  pushTx(WASH_WALLETS[1], WASH_WALLETS[0], 8_100);
  pushTx(WASH_WALLETS[0], WASH_WALLETS[1], 7_900);
  pushTx(WASH_WALLETS[1], WASH_WALLETS[0], 7_950);
  pushTx(WASH_WALLETS[0], WASH_WALLETS[2], 4_200);
  pushTx(WASH_WALLETS[2], WASH_WALLETS[0], 4_150);

  // Layered pattern
  for (let i = 0; i < LAYERED_PATH.length - 1; i += 1) {
    pushTx(LAYERED_PATH[i], LAYERED_PATH[i + 1], 9_500 - i * 600);
  }

  // Connect layered path back to a destination
  pushTx(LAYERED_PATH[LAYERED_PATH.length - 1], '0xDST903', 7_200);

  // Add some new wallet inflows for alerts
  pushTx('0xNEW001', INTERMEDIATE_WALLETS[0], 3_500);
  pushTx('0xNEW002', INTERMEDIATE_WALLETS[1], 3_750);

  return transactions;
}
