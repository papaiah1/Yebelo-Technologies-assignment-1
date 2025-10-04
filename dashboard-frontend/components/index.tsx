import { useState, useEffect } from 'react';
import axios from 'axios';
import { TokenSelector } from '../components/TokenSelector';
import { PriceChart } from '../components/PriceChart';
import { RsiChart } from '../components/RsiChart';
import { TradeData, RsiData } from '../types';

const TOKENS = ['BTC', 'ETH', 'XRP', 'ADA', 'SOL'];

export default function Home() {
  const [selectedToken, setSelectedToken] = useState(TOKENS[0]);
  const [priceData, setPriceData] = useState<TradeData[]>([]);
  const [rsiData, setRsiData] = useState<RsiData[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const priceRes = await axios.get(`http://localhost:4000/price?symbol=${selectedToken}`);
        setPriceData(priceRes.data);
        const rsiRes = await axios.get(`http://localhost:4000/rsi?symbol=${selectedToken}`);
        setRsiData(rsiRes.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [selectedToken]);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Token Dashboard</h1>
      <TokenSelector tokens={TOKENS} selected={selectedToken} onChange={setSelectedToken} />

      <h2>Price: {priceData.length ? priceData[priceData.length - 1].price : 'Loading...'}</h2>
      <PriceChart data={priceData} />

      <h2>RSI: {rsiData.length ? rsiData[rsiData.length - 1].rsi : 'Loading...'}</h2>
      <RsiChart data={rsiData} />
    </div>
  );
}
