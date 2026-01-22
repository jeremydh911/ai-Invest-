/**
 * Order Ticket Component
 * UI for placing market and limit orders
 */
import React, { useState } from 'react';

export const OrderTicket: React.FC = () => {
  const [symbol, setSymbol] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [limitPrice, setLimitPrice] = useState(0);

  const handleSubmitOrder = async () => {
    const order = { symbol, quantity, orderType, limitPrice };
    console.log('Submitting order:', order);
    
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order)
      });
      
      if (response.ok) {
        alert('Order submitted successfully!');
        setSymbol('');
        setQuantity(0);
      }
    } catch (error) {
      alert('Error submitting order');
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4">Order Ticket</h2>
      <div className="space-y-4">
        <input
          type="text"
          placeholder="Symbol"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          className="w-full bg-gray-700 px-4 py-2 rounded"
        />
        <input
          type="number"
          placeholder="Quantity"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          className="w-full bg-gray-700 px-4 py-2 rounded"
        />
        <button
          onClick={handleSubmitOrder}
          className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-bold"
        >
          Place Order
        </button>
      </div>
    </div>
  );
};
