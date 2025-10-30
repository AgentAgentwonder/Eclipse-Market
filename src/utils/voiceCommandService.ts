import { invoke } from '@tauri-apps/api/tauri';
import {
  VoiceIntent,
  VoiceIntentType,
  VoiceTradingAction,
  VoicePortfolioQuery,
  VoiceAlertAction,
  VoiceMarketQuery,
  VoiceConfirmationData,
  VoiceCommandResult,
  VoiceError,
} from '../types/voice';

const LOCALE_PATTERNS: Record<string, Record<VoiceIntentType, RegExp[]>> = {
  'en-US': {
    trade_buy: [
      /buy\s+(\d+(?:\.\d+)?)\s+(\w+)/i,
      /purchase\s+(\d+(?:\.\d+)?)\s+(\w+)/i,
      /long\s+(\d+(?:\.\d+)?)\s+(\w+)/i,
    ],
    trade_sell: [
      /sell\s+(\d+(?:\.\d+)?)\s+(\w+)/i,
      /exit\s+(\d+(?:\.\d+)?)\s+(\w+)/i,
      /short\s+(\d+(?:\.\d+)?)\s+(\w+)/i,
    ],
    trade_cancel: [
      /cancel\s+(?:order\s+)?(\w+)/i,
      /abort\s+(?:order\s+)?(\w+)/i,
      /stop\s+(?:order\s+)?(\w+)/i,
    ],
    portfolio_query: [
      /(?:what's|what is|show)\s+my\s+(balance|position|profit|portfolio)/i,
      /how\s+much\s+(\w+)\s+do\s+I\s+have/i,
      /portfolio\s+summary/i,
    ],
    price_query: [
      /(?:what's|what is)\s+the\s+price\s+of\s+(\w+)/i,
      /price\s+(?:of\s+)?(\w+)/i,
      /how\s+much\s+is\s+(\w+)/i,
    ],
    alert_create: [
      /alert\s+(?:me\s+)?(?:when|if)\s+(\w+)\s+(goes\s+)?(?:above|below|reaches)\s+(\d+(?:\.\d+)?)/i,
      /notify\s+(?:me\s+)?(?:when|if)\s+(\w+)\s+(is\s+)?(?:above|below|at)\s+(\d+(?:\.\d+)?)/i,
    ],
    alert_list: [
      /(?:list|show)\s+(?:my\s+)?alerts/i,
      /what\s+alerts\s+do\s+I\s+have/i,
    ],
    market_summary: [
      /market\s+summary/i,
      /(?:what's|what is)\s+happening\s+in\s+the\s+market/i,
      /market\s+overview/i,
    ],
    assistant_query: [
      /(?:hey|hi|hello)\s+(?:assistant|jarvis|computer)/i,
      /help\s+(?:me\s+)?(?:with\s+)?(.+)/i,
    ],
    navigation: [
      /(?:go\s+to|open|show)\s+(.+)/i,
      /navigate\s+to\s+(.+)/i,
    ],
    settings_change: [
      /(?:set|change|update)\s+(.+)\s+to\s+(.+)/i,
      /(?:enable|disable)\s+(.+)/i,
    ],
  },
};

export class VoiceCommandService {
  private locale: string = 'en-US';

  setLocale(locale: string) {
    this.locale = locale;
  }

  parseIntent(text: string): VoiceIntent | null {
    const patterns = LOCALE_PATTERNS[this.locale] || LOCALE_PATTERNS['en-US'];
    
    for (const [intentType, regexList] of Object.entries(patterns)) {
      for (const regex of regexList) {
        const match = text.match(regex);
        if (match) {
          const parameters = this.extractParameters(intentType as VoiceIntentType, match);
          return {
            type: intentType as VoiceIntentType,
            confidence: 0.85,
            parameters,
            rawText: text,
            timestamp: Date.now(),
          };
        }
      }
    }

    return null;
  }

  private extractParameters(intentType: VoiceIntentType, match: RegExpMatchArray): Record<string, any> {
    switch (intentType) {
      case 'trade_buy':
      case 'trade_sell':
        return {
          amount: parseFloat(match[1] || '0'),
          symbol: (match[2] || '').toUpperCase(),
          type: intentType === 'trade_buy' ? 'buy' : 'sell',
        };

      case 'trade_cancel':
        return {
          orderId: match[1] || '',
        };

      case 'portfolio_query':
        return {
          queryType: match[1]?.toLowerCase() || 'summary',
          symbol: match[2]?.toUpperCase(),
        };

      case 'price_query':
        return {
          symbol: (match[1] || '').toUpperCase(),
        };

      case 'alert_create':
        return {
          symbol: (match[1] || '').toUpperCase(),
          condition: match[0].toLowerCase().includes('above') ? 'above' : 'below',
          price: parseFloat(match[3] || '0'),
        };

      case 'navigation':
        return {
          destination: match[1]?.toLowerCase() || '',
        };

      case 'settings_change':
        return {
          setting: match[1]?.toLowerCase() || '',
          value: match[2] || '',
        };

      default:
        return {};
    }
  }

  async executeCommand(intent: VoiceIntent): Promise<VoiceCommandResult> {
    try {
      switch (intent.type) {
        case 'trade_buy':
        case 'trade_sell':
          return await this.executeTrade(intent);
        
        case 'trade_cancel':
          return await this.cancelTrade(intent);
        
        case 'portfolio_query':
          return await this.queryPortfolio(intent);
        
        case 'price_query':
          return await this.queryPrice(intent);
        
        case 'alert_create':
          return await this.createAlert(intent);
        
        case 'alert_list':
          return await this.listAlerts(intent);
        
        case 'market_summary':
          return await this.getMarketSummary(intent);
        
        default:
          return {
            success: false,
            message: `Unknown command type: ${intent.type}`,
          };
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Command execution failed',
      };
    }
  }

  private async executeTrade(intent: VoiceIntent): Promise<VoiceCommandResult> {
    const { symbol, amount, type } = intent.parameters;
    
    try {
      const result = await invoke('execute_voice_trade', {
        symbol,
        amount,
        side: type,
      });

      return {
        success: true,
        message: `Successfully ${type === 'buy' ? 'bought' : 'sold'} ${amount} ${symbol}`,
        data: result,
      };
    } catch (error: any) {
      throw new Error(`Trade execution failed: ${error.message}`);
    }
  }

  private async cancelTrade(intent: VoiceIntent): Promise<VoiceCommandResult> {
    const { orderId } = intent.parameters;
    
    try {
      await invoke('cancel_order', { orderId });
      
      return {
        success: true,
        message: `Order ${orderId} cancelled successfully`,
      };
    } catch (error: any) {
      throw new Error(`Failed to cancel order: ${error.message}`);
    }
  }

  private async queryPortfolio(intent: VoiceIntent): Promise<VoiceCommandResult> {
    const { queryType, symbol } = intent.parameters;
    
    try {
      const data = await invoke('get_portfolio_data', { queryType, symbol });
      
      let message = '';
      if (queryType === 'balance') {
        message = `Your current balance is ${(data as any).balance}`;
      } else if (queryType === 'position' && symbol) {
        message = `You have ${(data as any).amount} ${symbol}`;
      } else {
        message = 'Portfolio data retrieved';
      }

      return {
        success: true,
        message,
        data,
      };
    } catch (error: any) {
      throw new Error(`Portfolio query failed: ${error.message}`);
    }
  }

  private async queryPrice(intent: VoiceIntent): Promise<VoiceCommandResult> {
    const { symbol } = intent.parameters;
    
    try {
      const price = await invoke('get_current_price', { symbol });
      
      return {
        success: true,
        message: `The current price of ${symbol} is ${price}`,
        data: { symbol, price },
      };
    } catch (error: any) {
      throw new Error(`Price query failed: ${error.message}`);
    }
  }

  private async createAlert(intent: VoiceIntent): Promise<VoiceCommandResult> {
    const { symbol, condition, price } = intent.parameters;
    
    try {
      const alertId = await invoke('create_price_alert', {
        symbol,
        condition,
        price,
      });
      
      return {
        success: true,
        message: `Alert created: notify when ${symbol} goes ${condition} ${price}`,
        data: { alertId },
      };
    } catch (error: any) {
      throw new Error(`Failed to create alert: ${error.message}`);
    }
  }

  private async listAlerts(intent: VoiceIntent): Promise<VoiceCommandResult> {
    try {
      const alerts = await invoke('list_alerts');
      const count = (alerts as any[]).length;
      
      return {
        success: true,
        message: `You have ${count} active alert${count !== 1 ? 's' : ''}`,
        data: alerts,
      };
    } catch (error: any) {
      throw new Error(`Failed to list alerts: ${error.message}`);
    }
  }

  private async getMarketSummary(intent: VoiceIntent): Promise<VoiceCommandResult> {
    try {
      const summary = await invoke('get_market_summary');
      
      return {
        success: true,
        message: 'Market summary retrieved',
        data: summary,
      };
    } catch (error: any) {
      throw new Error(`Failed to get market summary: ${error.message}`);
    }
  }

  generateConfirmationData(intent: VoiceIntent, marketData?: any): VoiceConfirmationData {
    const { type, parameters } = intent;

    switch (type) {
      case 'trade_buy':
      case 'trade_sell': {
        const { symbol, amount, type: side } = parameters;
        const estimatedCost = marketData?.price ? amount * marketData.price : 0;
        const priceImpact = marketData?.priceImpact || 0;
        const slippage = marketData?.slippage || 0.5;

        const riskWarnings = [];
        if (priceImpact > 2) {
          riskWarnings.push('High price impact detected');
        }
        if (estimatedCost > 10000) {
          riskWarnings.push('Large transaction amount');
        }
        if (slippage > 1) {
          riskWarnings.push('High slippage tolerance');
        }

        return {
          title: `Confirm ${side === 'buy' ? 'Buy' : 'Sell'} Order`,
          description: `${side === 'buy' ? 'Buy' : 'Sell'} ${amount} ${symbol}`,
          riskWarnings,
          estimatedCost: estimatedCost > 0 ? {
            amount: estimatedCost,
            currency: 'USD',
          } : undefined,
          estimatedGas: {
            amount: 0.005,
            currency: 'SOL',
          },
          priceImpact,
          slippage,
          summary: `You are about to ${side} ${amount} ${symbol} for approximately $${estimatedCost.toFixed(2)}`,
          audioSummary: `Confirm ${side} order for ${amount} ${symbol}. Estimated cost: ${estimatedCost.toFixed(2)} dollars. Say yes to confirm or no to cancel.`,
        };
      }

      case 'alert_create': {
        const { symbol, condition, price } = parameters;
        return {
          title: 'Confirm Alert Creation',
          description: `Alert when ${symbol} goes ${condition} ${price}`,
          riskWarnings: [],
          summary: `Create alert for ${symbol} ${condition} ${price}`,
          audioSummary: `Creating alert for ${symbol} ${condition} ${price}. Say yes to confirm.`,
        };
      }

      default:
        return {
          title: 'Confirm Action',
          description: intent.rawText,
          riskWarnings: [],
          summary: intent.rawText,
          audioSummary: `Confirm: ${intent.rawText}. Say yes to confirm.`,
        };
    }
  }

  calculateRiskScore(intent: VoiceIntent, marketData?: any): number {
    const { type, parameters } = intent;

    let riskScore = 0;

    if (type === 'trade_buy' || type === 'trade_sell') {
      const amount = parameters.amount || 0;
      const price = marketData?.price || 0;
      const totalValue = amount * price;

      if (totalValue > 50000) riskScore += 40;
      else if (totalValue > 10000) riskScore += 25;
      else if (totalValue > 1000) riskScore += 10;
      else riskScore += 5;

      const priceImpact = marketData?.priceImpact || 0;
      if (priceImpact > 5) riskScore += 30;
      else if (priceImpact > 2) riskScore += 15;
      else if (priceImpact > 1) riskScore += 5;

      const volatility = marketData?.volatility || 0;
      if (volatility > 10) riskScore += 20;
      else if (volatility > 5) riskScore += 10;

      if (type === 'trade_sell' && marketData?.position?.unrealizedPnL < 0) {
        riskScore += 10;
      }
    }

    return Math.min(riskScore, 100);
  }

  formatErrorMessage(error: VoiceError, locale: string = 'en-US'): string {
    const errorMessages: Record<string, Record<string, string>> = {
      'en-US': {
        INSUFFICIENT_BALANCE: 'You don\'t have enough balance for this trade',
        INVALID_SYMBOL: 'Token symbol not recognized',
        MARKET_CLOSED: 'Market is currently closed',
        ORDER_NOT_FOUND: 'Order not found',
        MFA_REQUIRED: 'Multi-factor authentication required',
        MFA_FAILED: 'Authentication failed. Please try again',
        NETWORK_ERROR: 'Network connection error. Please try again',
        RATE_LIMIT: 'Too many requests. Please wait a moment',
      },
    };

    const messages = errorMessages[locale] || errorMessages['en-US'];
    return messages[error.code] || error.message;
  }
}

export const voiceCommandService = new VoiceCommandService();
