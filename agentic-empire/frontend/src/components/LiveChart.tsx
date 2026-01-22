/**
 * Live Chart Component
 * Real-time price chart with technical indicators
 */
import React, { useEffect, useRef } from 'react';

interface LiveChartProps {
  symbol: string;
  data: Array<{ time: string; price: number; volume: number }>;
}

export const LiveChart: React.FC<LiveChartProps> = ({ symbol, data }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !data.length) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw simple line chart
    const prices = data.map(d => d.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;
    
    ctx.strokeStyle = '#3B82F6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    data.forEach((point, i) => {
      const x = (i / (data.length - 1)) * canvas.width;
      const y = canvas.height - ((point.price - minPrice) / priceRange) * canvas.height;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    
    ctx.stroke();
  }, [data]);

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4">{symbol} Live Chart</h2>
      <canvas ref={canvasRef} width={600} height={300} className="w-full" />
    </div>
  );
};
