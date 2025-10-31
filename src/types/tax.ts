export interface TaxJurisdiction {
  code: string;
  name: string;
  shortTermRate: number;
  longTermRate: number;
  holdingPeriodDays: number;
  washSalePeriodDays: number;
  capitalLossLimit: number | null;
  taxYearStart: string;
  requiresReportingThreshold: number | null;
  supportsLikeKindExchange: boolean;
  cryptoSpecificRules: Record<string, any>;
}

export interface TaxProjection {
  taxYear: number;
  jurisdiction: string;
  totalShortTermGains: number;
  totalLongTermGains: number;
  totalShortTermLosses: number;
  totalLongTermLosses: number;
  netShortTerm: number;
  netLongTerm: number;
  totalTaxOwed: number;
  effectiveTaxRate: number;
  potentialSavingsFromHarvesting: number;
  unrealizedGains: number;
  unrealizedLosses: number;
  carryforwardLosses: number;
  generatedAt: string;
}

export interface WashSaleWarning {
  asset: string;
  mintAddress: string;
  saleDate: string;
  saleAmount: number;
  lossAmount: number;
  disallowedLoss: number;
  repurchaseDate: string;
  repurchaseAmount: number;
  washSalePeriodStart: string;
  washSalePeriodEnd: string;
  severity: 'high' | 'medium' | 'low';
  recommendation: string;
}

export interface HarvestingRecommendation {
  id: string;
  asset: string;
  mintAddress: string;
  lotId: string;
  currentPrice: number;
  costBasis: number;
  unrealizedLoss: number;
  amount: number;
  holdingPeriodDays: number;
  taxSavings: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  reason: string;
  washSaleRisk: boolean;
  alternativeAssets: string[];
  expiresAt: string | null;
}

export interface TaxAlert {
  id: string;
  alertType: 'WASH_SALE' | 'LARGE_GAIN' | 'LARGE_LOSS' | 'HARVESTING_OPPORTUNITY' | 'YEAR_END_DEADLINE' | 'TAX_RATE_CHANGE' | 'JURISDICTION_CHANGE' | 'MISSING_COST_BASIS';
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  message: string;
  asset: string | null;
  actionRequired: boolean;
  actionDeadline: string | null;
  recommendations: string[];
  createdAt: string;
  dismissed: boolean;
}

export interface TaxSettings {
  jurisdiction: TaxJurisdiction;
  taxYear: number;
  defaultCostBasisMethod: string;
  enableWashSaleDetection: boolean;
  enableTaxLossHarvesting: boolean;
  harvestingThresholdUsd: number;
  yearEndReminderDays: number;
  customTaxRates: {
    shortTermRate: number | null;
    longTermRate: number | null;
    stateTaxRate: number | null;
  } | null;
}

export interface TaxCenterSummary {
  projection: TaxProjection;
  washSaleWarnings: WashSaleWarning[];
  harvestingRecommendations: HarvestingRecommendation[];
  alerts: TaxAlert[];
  availableJurisdictions: TaxJurisdiction[];
  settings: TaxSettings;
}

export interface TaxExportFormat {
  format: string;
  version: string;
  generatedAt: string;
  jurisdiction: string;
  taxYear: number;
  data: string;
  filename: string;
}
