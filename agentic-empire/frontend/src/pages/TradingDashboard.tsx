/**
 * Trading Dashboard - Real-time portfolio and trade management
 */
import React, { useState, useEffect } from 'react';

interface Position {
  symbol: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  pnl: number;
}

interface TradeSignal {
  agent: string;
  symbol: string;
  action: string;
  confidence: number;
  reasoning: string;
}

export const TradingDashboard: React.FC = () => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [signals, setSignals] = useState<TradeSignal[]>([]);
  const [portfolioValue, setPortfolioValue] = useState(100000);
  const [totalPnL, setTotalPnL] = useState(0);

  useEffect(() => {
    // Fetch portfolio data
    const fetchData = async () => {
      // In production: fetch from API
      setPositions([
        { symbol: 'AAPL', quantity: 100, avgPrice: 150, currentPrice: 155, pnl: 500 },
        { symbol: 'BTC', quantity: 0.5, avgPrice: 45000, currentPrice: 47000, pnl: 1000 },
      ]);
    };
    fetchData();
  }, []);

  return (
    <div className="trading-dashboard">
      <h1>AI Trading Empire Dashboard</h1>
      
      <div className="portfolio-summary">
        <div className="metric">
          <h3>Portfolio Value</h3>
          <p>${portfolioValue.toLocaleString()}</p>
        </div>
        <div className="metric">
          <h3>Total P&L</h3>
          <p className={totalPnL >= 0 ? 'positive' : 'negative'}>
            ${totalPnL.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="positions">
        <h2>Active Positions</h2>
        <table>
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Quantity</th>
              <th>Avg Price</th>
              <th>Current Price</th>
              <th>P&L</th>
            </tr>
          </thead>
          <tbody>
            {positions.map(pos => (
              <tr key={pos.symbol}>
                <td>{pos.symbol}</td>
                <td>{pos.quantity}</td>
                <td>${pos.avgPrice}</td>
                <td>${pos.currentPrice}</td>
                <td className={pos.pnl >= 0 ? 'positive' : 'negative'}>
                  ${pos.pnl}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="signals">
        <h2>Agent Signals</h2>
        {signals.map((signal, idx) => (
          <div key={idx} className="signal-card">
            <span className="agent-name">{signal.agent}</span>
            <span className={`action ${signal.action.toLowerCase()}`}>{signal.action}</span>
            <span className="symbol">{signal.symbol}</span>
            <span className="confidence">{(signal.confidence * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};
