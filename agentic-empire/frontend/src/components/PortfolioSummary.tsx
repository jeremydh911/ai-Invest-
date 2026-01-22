/**
 * Portfolio Summary Component
 * Displays current positions and P&L
 */
import React from 'react';

interface PortfolioSummaryProps {
  positions: Array<{
    symbol: string;
    quantity: number;
    avgPrice: number;
    currentPrice: number;
    pnl: number;
  }>;
  totalValue: number;
}

export const PortfolioSummary: React.FC<PortfolioSummaryProps> = ({ positions, totalValue }) => {
  const totalPnL = positions.reduce((sum, pos) => sum + pos.pnl, 0);
  const pnlPercent = (totalPnL / totalValue) * 100;

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4">Portfolio Summary</h2>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span>Total Value:</span>
          <span className="font-bold">${totalValue.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span>Total P&L:</span>
          <span className={totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}>
            ${totalPnL.toFixed(2)} ({pnlPercent.toFixed(2)}%)
          </span>
        </div>
      </div>
      <div className="mt-4">
        <h3 className="font-semibold mb-2">Positions</h3>
        {positions.map((pos) => (
          <div key={pos.symbol} className="flex justify-between py-2 border-t border-gray-700">
            <span>{pos.symbol}</span>
            <span>{pos.quantity} @ ${pos.currentPrice}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
