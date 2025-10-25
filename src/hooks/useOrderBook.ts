import { useEffect, useState } from 'react';

type Order = {
  price: number;
  amount: number;
};

export function useOrderBook() {
  const [bids, setBids] = useState<Order[]>([]);
  const [asks, setAsks] = useState<Order[]>([]);

  useEffect(() => {
    // TODO: Connect to real WebSocket feed
    
    // Mock data for now
    setBids([
      { price: 100.25, amount: 1.5 },
      { price: 100.10, amount: 2.3 },
      { price: 100.00, amount: 5.7 },
    ]);
    
    setAsks([
      { price: 100.50, amount: 1.2 },
      { price: 100.75, amount: 3.4 },
      { price: 101.00, amount: 2.1 },
    ]);
  }, []);

  return { bids, asks };
}
