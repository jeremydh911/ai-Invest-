/**
 * Banking & Finance Trading Center Service
 * 
 * COMPLIANCE NOTICE:
 * This service is designed with financial compliance in mind.
 * Users must comply with SEC, FINRA, and local trading regulations.
 * This tool is for research and educational purposes.
 * 
 * Features:
 * - User-defined trading parameters and algorithms
 * - Real-time market monitoring and analysis
 * - Machine learning-based trading agents
 * - Triple-check safeguards for all trades
 * - Regulatory compliance framework
 * - Performance metrics and analytics
 */

const axios = require('axios');
const crypto = require('crypto');

// Encryption key for storing sensitive data (should use environment variable)
const ENCRYPTION_KEY = process.env.BANKING_ENCRYPTION_KEY || 'default-key-change-in-production';

/**
 * Encrypt sensitive banking credentials
 */
function encryptCredential(credential) {
  const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY);
  let encrypted = cipher.update(credential, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

/**
 * Decrypt banking credentials
 */
function decryptCredential(encrypted) {
  const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * Trading Parameters Schema
 * User-configurable parameters that define the trading algorithm
 */
const DEFAULT_TRADING_PARAMETERS = {
  // Risk Management
  maxDailyLoss: 1000,                    // Max daily loss in dollars
  maxPortfolioRisk: 2,                   // Max % of portfolio at risk per trade
  maxPositionSize: 5,                    // Max position size as % of portfolio
  
  // Buy Signals
  rsiThresholdBuy: 30,                   // RSI below this triggers buy signal
  macdBuy: true,                         // Use MACD for buy confirmation
  volumeConfirmation: true,              // Require volume confirmation
  
  // Sell Signals
  rsiThresholdSell: 70,                  // RSI above this triggers sell signal
  stopLossPercent: 5,                    // Stop loss at X% below entry
  takeProfitPercent: 15,                 // Take profit at X% above entry
  trailingStop: true,                    // Use trailing stop
  
  // Trading Frequency
  minHoldingPeriodMinutes: 30,           // Min minutes to hold position
  maxPositionsOpen: 5,                   // Max concurrent positions
  
  // Market Conditions
  avoidPreMarket: true,                  // Don't trade before 9:30 AM EST
  avoidAfterMarket: true,                // Don't trade after 4:00 PM EST
  avoidHighVolatility: false,            // Disable trading on VIX > 30
  
  // Compliance
  minAccountSize: 25000,                 // PDT minimum
  enableDayTradingMode: false,           // Requires $25k minimum
  paperTradingMode: true,                // Start with paper trading
};

/**
 * Trading Agent with Machine Learning
 */
class TradingAgent {
  constructor(userId, tradingParams = DEFAULT_TRADING_PARAMETERS) {
    this.userId = userId;
    this.parameters = { ...DEFAULT_TRADING_PARAMETERS, ...tradingParams };
    this.portfolio = {
      cash: 100000,
      positions: [],
      trades: [],
      performance: {
        totalTrades: 0,
        winRate: 0,
        avgWin: 0,
        avgLoss: 0,
        profitFactor: 1,
        sharpeRatio: 0,
        maxDrawdown: 0
      }
    };
    this.mlModel = {
      weights: this.initializeMLWeights(),
      learningRate: 0.01,
      iterations: 0,
      accuracy: 0
    };
    this.lastCheck = null;
    this.marketData = {};
  }

  /**
   * Initialize ML model weights
   */
  initializeMLWeights() {
    return {
      rsi: 0.25,
      macd: 0.25,
      volume: 0.15,
      momentum: 0.15,
      volatility: 0.10,
      trend: 0.10
    };
  }

  /**
   * Analyze market data and generate trading signal
   */
  async analyzeMarket(symbol, priceData) {
    try {
      const signals = {
        rsiSignal: this.calculateRSISignal(priceData),
        macdSignal: this.calculateMACDSignal(priceData),
        volumeSignal: this.calculateVolumeSignal(priceData),
        momentumSignal: this.calculateMomentumSignal(priceData),
        trendSignal: this.calculateTrendSignal(priceData),
        volatilitySignal: this.calculateVolatilitySignal(priceData)
      };

      // ML-weighted decision
      const mlScore = this.calculateMLScore(signals);
      
      return {
        symbol,
        timestamp: new Date(),
        signals,
        mlScore,
        recommendation: mlScore > 0.6 ? 'BUY' : (mlScore < -0.6 ? 'SELL' : 'HOLD'),
        confidence: Math.abs(mlScore)
      };
    } catch (error) {
      console.error(`[TradingAgent] Market analysis failed for ${symbol}:`, error.message);
      return null;
    }
  }

  /**
   * Calculate RSI (Relative Strength Index)
   */
  calculateRSISignal(priceData) {
    if (priceData.length < 14) return 0;
    
    let gains = 0, losses = 0;
    for (let i = 1; i < 14; i++) {
      const change = priceData[i] - priceData[i - 1];
      if (change > 0) gains += change;
      else losses += Math.abs(change);
    }
    
    const rs = gains / (losses || 1);
    const rsi = 100 - (100 / (1 + rs));
    
    // Normalize to -1 to 1 scale
    if (rsi < this.parameters.rsiThresholdBuy) return 0.8;  // Strong buy
    if (rsi < 40) return 0.4;                               // Weak buy
    if (rsi > this.parameters.rsiThresholdSell) return -0.8; // Strong sell
    if (rsi > 60) return -0.4;                              // Weak sell
    return 0;                                               // Neutral
  }

  /**
   * Calculate MACD (Moving Average Convergence Divergence)
   */
  calculateMACDSignal(priceData) {
    if (priceData.length < 26) return 0;
    
    const ema12 = this.calculateEMA(priceData, 12);
    const ema26 = this.calculateEMA(priceData, 26);
    const macdLine = ema12 - ema26;
    const signalLine = this.calculateEMA([macdLine], 9);
    
    const histogram = macdLine - signalLine;
    
    // Crossover signals
    if (histogram > 0 && macdLine > signalLine) return 0.7;  // Buy
    if (histogram < 0 && macdLine < signalLine) return -0.7; // Sell
    return 0;
  }

  /**
   * Calculate EMA (Exponential Moving Average)
   */
  calculateEMA(data, period) {
    if (data.length === 0) return 0;
    const k = 2 / (period + 1);
    let ema = data[0];
    for (let i = 1; i < data.length; i++) {
      ema = data[i] * k + ema * (1 - k);
    }
    return ema;
  }

  /**
   * Calculate Volume Signal
   */
  calculateVolumeSignal(priceData, volumeData = []) {
    if (!this.parameters.volumeConfirmation) return 0;
    
    if (volumeData.length < 20) return 0;
    
    const avgVolume = volumeData.slice(-20).reduce((a, b) => a + b) / 20;
    const currentVolume = volumeData[volumeData.length - 1];
    
    if (currentVolume > avgVolume * 1.5) return 0.6;  // High volume
    if (currentVolume < avgVolume * 0.5) return -0.3; // Low volume
    return 0;
  }

  /**
   * Calculate Momentum Signal
   */
  calculateMomentumSignal(priceData) {
    if (priceData.length < 10) return 0;
    
    const momentum = ((priceData[priceData.length - 1] - priceData[priceData.length - 10]) / priceData[priceData.length - 10]) * 100;
    
    if (momentum > 5) return 0.6;   // Positive momentum
    if (momentum < -5) return -0.6; // Negative momentum
    return 0;
  }

  /**
   * Calculate Trend Signal
   */
  calculateTrendSignal(priceData) {
    if (priceData.length < 50) return 0;
    
    const sma50 = priceData.slice(-50).reduce((a, b) => a + b) / 50;
    const sma200 = priceData.slice(-200).reduce((a, b) => a + b) / 200;
    const currentPrice = priceData[priceData.length - 1];
    
    if (currentPrice > sma50 && sma50 > sma200) return 0.7;  // Uptrend
    if (currentPrice < sma50 && sma50 < sma200) return -0.7; // Downtrend
    return 0;
  }

  /**
   * Calculate Volatility Signal
   */
  calculateVolatilitySignal(priceData) {
    if (priceData.length < 20) return 0;
    
    const returns = [];
    for (let i = 1; i < priceData.length; i++) {
      returns.push((priceData[i] - priceData[i - 1]) / priceData[i - 1]);
    }
    
    const mean = returns.reduce((a, b) => a + b) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance);
    
    // Volatility adjustment
    if (volatility > 0.05) return -0.3; // High volatility - reduce confidence
    if (volatility < 0.01) return 0.2;  // Low volatility - increase confidence
    return 0;
  }

  /**
   * Calculate ML Score (weighted combination of all signals)
   */
  calculateMLScore(signals) {
    const weights = this.mlModel.weights;
    
    const score = 
      signals.rsiSignal * weights.rsi +
      signals.macdSignal * weights.macd +
      signals.volumeSignal * weights.volume +
      signals.momentumSignal * weights.momentum +
      signals.volatilitySignal * weights.volatility +
      signals.trendSignal * weights.trend;
    
    return Math.max(-1, Math.min(1, score)); // Clamp between -1 and 1
  }

  /**
   * Learn from trade outcomes (ML training)
   */
  learnFromTrade(trade) {
    const profit = trade.exitPrice - trade.entryPrice;
    const profitPercent = (profit / trade.entryPrice) * 100;
    
    if (profitPercent > 0) {
      // Increase weights that contributed to winning trades
      this.mlModel.weights.rsi += this.mlModel.learningRate * 0.01;
      this.mlModel.weights.trend += this.mlModel.learningRate * 0.01;
    } else {
      // Decrease weights that contributed to losing trades
      this.mlModel.weights.volume -= this.mlModel.learningRate * 0.005;
      this.mlModel.weights.volatility -= this.mlModel.learningRate * 0.005;
    }
    
    // Normalize weights to sum to 1
    const sum = Object.values(this.mlModel.weights).reduce((a, b) => a + b);
    Object.keys(this.mlModel.weights).forEach(key => {
      this.mlModel.weights[key] /= sum;
    });
    
    this.mlModel.iterations++;
    this.updatePerformanceMetrics();
  }

  /**
   * Update portfolio performance metrics
   */
  updatePerformanceMetrics() {
    const trades = this.portfolio.trades;
    if (trades.length === 0) return;
    
    const winningTrades = trades.filter(t => t.profit > 0);
    const losingTrades = trades.filter(t => t.profit < 0);
    
    this.portfolio.performance.totalTrades = trades.length;
    this.portfolio.performance.winRate = (winningTrades.length / trades.length) * 100;
    
    const totalWins = winningTrades.reduce((sum, t) => sum + t.profit, 0);
    const totalLosses = Math.abs(losingTrades.reduce((sum, t) => sum + t.profit, 0));
    
    this.portfolio.performance.avgWin = winningTrades.length > 0 ? totalWins / winningTrades.length : 0;
    this.portfolio.performance.avgLoss = losingTrades.length > 0 ? totalLosses / losingTrades.length : 0;
    this.portfolio.performance.profitFactor = totalLosses > 0 ? totalWins / totalLosses : 0;
    
    // Calculate Sharpe Ratio (simplified)
    const returns = trades.map(t => (t.profit / t.entryPrice) * 100);
    const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const stdDev = Math.sqrt(returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length);
    this.portfolio.performance.sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0; // Annualized
  }
}

/**
 * Triple-Check Safeguard System
 */
class SafeguardChecker {
  constructor(parameters) {
    this.parameters = parameters;
  }

  /**
   * Triple-check before executing trade
   * 1. Portfolio safeguards
   * 2. Market conditions
   * 3. Risk management
   */
  async checkBeforeExecute(portfolio, trade, marketData) {
    const checks = {
      portfolioCheck: this.checkPortfolioSafeguards(portfolio),
      marketCheck: this.checkMarketConditions(trade, marketData),
      riskCheck: this.checkRiskManagement(portfolio, trade)
    };

    const allPassed = checks.portfolioCheck.passed && 
                      checks.marketCheck.passed && 
                      checks.riskCheck.passed;

    return {
      approved: allPassed,
      checks,
      timestamp: new Date(),
      reason: !allPassed ? this.getFailureReason(checks) : 'All checks passed'
    };
  }

  /**
   * Check 1: Portfolio Safeguards
   */
  checkPortfolioSafeguards(portfolio) {
    const dailyLoss = portfolio.trades
      .filter(t => this.isToday(t.date))
      .reduce((sum, t) => sum + (t.profit || 0), 0);

    const reasons = [];
    let passed = true;

    if (dailyLoss < -this.parameters.maxDailyLoss) {
      reasons.push(`Daily loss limit exceeded: ${dailyLoss.toFixed(2)}`);
      passed = false;
    }

    if (portfolio.positions.length >= this.parameters.maxPositionsOpen) {
      reasons.push(`Max positions open: ${portfolio.positions.length}`);
      passed = false;
    }

    return { passed, reasons };
  }

  /**
   * Check 2: Market Conditions
   */
  checkMarketConditions(trade, marketData) {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const timeInMinutes = hour * 60 + minute;

    const reasons = [];
    let passed = true;

    // Market hours check (US EST)
    const marketOpen = 9 * 60 + 30;  // 9:30 AM
    const marketClose = 16 * 60;     // 4:00 PM

    if (this.parameters.avoidPreMarket && timeInMinutes < marketOpen) {
      reasons.push('Pre-market hours - trading disabled');
      passed = false;
    }

    if (this.parameters.avoidAfterMarket && timeInMinutes > marketClose) {
      reasons.push('After-market hours - trading disabled');
      passed = false;
    }

    // Volatility check
    if (this.parameters.avoidHighVolatility && marketData.vix && marketData.vix > 30) {
      reasons.push(`High volatility detected: VIX ${marketData.vix.toFixed(2)}`);
      passed = false;
    }

    return { passed, reasons };
  }

  /**
   * Check 3: Risk Management
   */
  checkRiskManagement(portfolio, trade) {
    const portfolioValue = portfolio.cash + (portfolio.positions.reduce((sum, p) => sum + p.value, 0) || 0);
    const positionRisk = (trade.size * trade.price * (this.parameters.stopLossPercent / 100)) / portfolioValue;

    const reasons = [];
    let passed = true;

    if (positionRisk > (this.parameters.maxPortfolioRisk / 100)) {
      reasons.push(`Position risk exceeds limit: ${(positionRisk * 100).toFixed(2)}%`);
      passed = false;
    }

    if ((trade.size * trade.price) > (portfolioValue * (this.parameters.maxPositionSize / 100))) {
      reasons.push(`Position size exceeds limit: ${((trade.size * trade.price) / portfolioValue * 100).toFixed(2)}%`);
      passed = false;
    }

    if (portfolio.cash < (trade.size * trade.price)) {
      reasons.push(`Insufficient cash: ${portfolio.cash.toFixed(2)}`);
      passed = false;
    }

    return { passed, reasons };
  }

  /**
   * Get detailed failure reason
   */
  getFailureReason(checks) {
    const allReasons = [
      ...checks.portfolioCheck.reasons,
      ...checks.marketCheck.reasons,
      ...checks.riskCheck.reasons
    ];
    return allReasons.join(' | ');
  }

  /**
   * Check if date is today
   */
  isToday(date) {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }
}

/**
 * Banking Integration for credential management
 */
class BankingIntegration {
  constructor() {
    this.accounts = {}; // userId -> encrypted credentials
  }

  /**
   * Store encrypted banking credentials
   */
  storeBankingCredentials(userId, credentials) {
    try {
      const encrypted = {
        username: encryptCredential(credentials.username),
        password: encryptCredential(credentials.password),
        apiKey: credentials.apiKey ? encryptCredential(credentials.apiKey) : null,
        bankName: credentials.bankName,
        accountType: credentials.accountType,
        storedAt: new Date(),
        // Note: Real implementation should use vault/HSM
      };

      this.accounts[userId] = encrypted;
      
      console.log(`[Banking] Credentials stored for user ${userId}`);
      return { success: true, message: 'Credentials securely stored' };
    } catch (error) {
      console.error('[Banking] Credential storage failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Retrieve decrypted credentials (only for authenticated API calls)
   */
  getBankingCredentials(userId) {
    try {
      const encrypted = this.accounts[userId];
      if (!encrypted) return null;

      return {
        username: decryptCredential(encrypted.username),
        password: decryptCredential(encrypted.password),
        apiKey: encrypted.apiKey ? decryptCredential(encrypted.apiKey) : null,
        bankName: encrypted.bankName,
        accountType: encrypted.accountType
      };
    } catch (error) {
      console.error('[Banking] Credential retrieval failed:', error.message);
      return null;
    }
  }

  /**
   * Validate banking credentials
   */
  async validateCredentials(userId, credentials) {
    // In production, call actual bank API to validate
    return {
      valid: true,
      accountNumber: '****1234',
      accountType: credentials.accountType,
      balance: 50000 // Simulated
    };
  }
}

/**
 * Compliance Framework
 */
class ComplianceFramework {
  /**
   * Check compliance with trading regulations
   */
  static checkCompliance(parameters, portfolio) {
    const issues = [];
    const warnings = [];

    // PDT (Pattern Day Trading) Check
    if (!parameters.paperTradingMode && parameters.enableDayTradingMode) {
      if (portfolio.cash < 25000) {
        issues.push('PDT: Account requires $25,000 minimum for day trading');
      }
    }

    // Frequency Check
    const tradesLast4Weeks = portfolio.trades.filter(t => {
      const daysSince = (new Date() - t.date) / (1000 * 60 * 60 * 24);
      return daysSince <= 28;
    }).length;

    if (tradesLast4Weeks > 4 && !parameters.enableDayTradingMode) {
      warnings.push(`PDT Warning: ${tradesLast4Weeks} trades in 4 weeks may trigger PDT rule`);
    }

    // Margin Requirements
    if (parameters.maxPortfolioRisk > 10) {
      warnings.push('High leverage detected - ensure compliance with Reg T requirements');
    }

    return {
      compliant: issues.length === 0,
      issues,
      warnings,
      timestamp: new Date()
    };
  }

  /**
   * Get regulatory requirements
   */
  static getRegulatoryRequirements() {
    return {
      SEC: {
        description: 'Securities and Exchange Commission',
        requirements: [
          'Registration required for professional advisors',
          'Form 4 filing for insider trades',
          'Regulation SHO for short selling',
          'MiFID II for European trading'
        ]
      },
      FINRA: {
        description: 'Financial Industry Regulatory Authority',
        requirements: [
          'Series 7 or equivalent for advisors',
          'Pattern Day Trader (PDT) rules - $25k minimum',
          'Best execution obligation',
          'No market manipulation'
        ]
      },
      IRS: {
        description: 'Internal Revenue Service',
        requirements: [
          'Section 1256 contracts reporting',
          'Wash sale rules',
          'Net unrealized appreciation (NUA) reporting',
          'Form 8949 for capital gains/losses'
        ]
      },
      StateLevel: {
        description: 'State-specific regulations',
        requirements: [
          'Blue sky laws compliance',
          'State investment advisor licensing',
          'Suitability and best interest rules'
        ]
      }
    };
  }
}

/**
 * Trading Recommendation Engine
 */
class RecommendationEngine {
  /**
   * Generate trading recommendations
   */
  static generateRecommendation(analysis, parameters) {
    const signals = {
      signal: analysis.recommendation,
      confidence: (analysis.confidence * 100).toFixed(2),
      strength: this.getSignalStrength(analysis),
      baseAction: analysis.recommendation
    };

    // Check against user parameters
    if (analysis.recommendation === 'BUY') {
      return {
        action: 'BUY',
        confidence: signals.confidence,
        strength: signals.strength,
        suggestedQuantity: this.calculateSuggestedQuantity(parameters),
        stopLoss: `${parameters.stopLossPercent}%`,
        takeProfit: `${parameters.takeProfitPercent}%`,
        description: `Strong buy signal detected. Confidence: ${signals.confidence}%`
      };
    } else if (analysis.recommendation === 'SELL') {
      return {
        action: 'SELL',
        confidence: signals.confidence,
        strength: signals.strength,
        description: `Strong sell signal detected. Consider closing position.`
      };
    }

    return {
      action: 'HOLD',
      confidence: signals.confidence,
      description: 'No strong signal - Hold current positions'
    };
  }

  /**
   * Get signal strength name
   */
  static getSignalStrength(analysis) {
    const conf = analysis.confidence;
    if (conf > 0.8) return 'Very Strong';
    if (conf > 0.6) return 'Strong';
    if (conf > 0.4) return 'Moderate';
    return 'Weak';
  }

  /**
   * Calculate suggested quantity
   */
  static calculateSuggestedQuantity(parameters) {
    return Math.floor(100 * (parameters.maxPositionSize / 100)); // Simplified
  }
}

// Export classes and functions
module.exports = {
  TradingAgent,
  SafeguardChecker,
  BankingIntegration,
  ComplianceFramework,
  RecommendationEngine,
  encryptCredential,
  decryptCredential,
  DEFAULT_TRADING_PARAMETERS
};
