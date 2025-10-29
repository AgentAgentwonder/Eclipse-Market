export interface TokenTransaction {
  source: string;
  target: string;
  amount: number;
  timestamp: number;
  tokenAddress: string;
  transactionHash: string;
}

export interface TokenFlowNode {
  id: string;
  address: string;
  label?: string;
  balance: number;
  kind: 'source' | 'destination' | 'intermediate';
  clusterId?: string;
  risk: 'low' | 'medium' | 'high';
}

export interface TokenFlowEdge {
  id: string;
  source: string;
  target: string;
  amount: number;
  timestamp: number;
  tokenAddress: string;
  transactionHash: string;
}

export interface TokenFlowGraph {
  nodes: TokenFlowNode[];
  edges: TokenFlowEdge[];
  tokenAddress: string;
  timeRange: {
    start: number;
    end: number;
  };
}

export interface WalletCluster {
  id: string;
  wallets: string[];
  totalVolume: number;
  transactionCount: number;
  firstSeen: number;
  lastSeen: number;
  performance: ClusterPerformance;
  risk: 'low' | 'medium' | 'high';
  suspicious: boolean;
  suspicionReasons: string[];
}

export interface ClusterPerformance {
  totalPnL: number;
  winRate: number;
  averageHoldTime: number;
  topTokens: {
    address: string;
    symbol: string;
    volume: number;
  }[];
  distributionPattern: 'accumulation' | 'distribution' | 'neutral';
}

export interface CircularFlow {
  id: string;
  wallets: string[];
  amount: number;
  tokenAddress: string;
  cycles: number;
  confidence: number;
  detectedAt: number;
}

export interface WashTradingPattern {
  id: string;
  wallets: string[];
  tokenAddress: string;
  volume: number;
  transactionCount: number;
  confidence: number;
  detectedAt: number;
  pattern: 'ping_pong' | 'circular' | 'layered';
}

export interface TokenFlowAlert {
  id: string;
  type: 'circular_flow' | 'wash_trading' | 'new_cluster_member' | 'distribution_change' | 'suspicious_pattern';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  clusterId?: string;
  wallets: string[];
  tokenAddress?: string;
  metadata: Record<string, any>;
  timestamp: number;
  acknowledged: boolean;
}

export interface ClusterSubscription {
  id: string;
  clusterId: string;
  alerts: {
    newMembers: boolean;
    suspiciousFlows: boolean;
    performanceChanges: boolean;
    distributionChanges: boolean;
  };
  notificationChannels: ('ui' | 'email' | 'webhook')[];
}

export interface SankeyData {
  nodes: {
    id: string;
    name: string;
  }[];
  links: {
    source: number;
    target: number;
    value: number;
  }[];
}

export interface FlowSnapshot {
  id: string;
  timestamp: number;
  graph: TokenFlowGraph;
  clusters: WalletCluster[];
  alerts: TokenFlowAlert[];
}

export interface TimelineFrame {
  timestamp: number;
  flows: TokenFlowEdge[];
  activeNodes: string[];
}

export type FlowExportFormat = 'json' | 'csv' | 'png' | 'svg';

export interface FlowAnalysis {
  graph: TokenFlowGraph;
  clusters: WalletCluster[];
  alerts: TokenFlowAlert[];
  sankey: SankeyData;
  timeline: TimelineFrame[];
  washTrading: WashTradingPattern[];
  circularFlows: CircularFlow[];
}

export interface FlowExportData {
  format: FlowExportFormat;
  data: {
    graph?: TokenFlowGraph;
    clusters?: WalletCluster[];
    alerts?: TokenFlowAlert[];
    snapshot?: string; // base64 for images
  };
  metadata: {
    exportedAt: number;
    timeRange: {
      start: number;
      end: number;
    };
    filters?: Record<string, any>;
  };
}
