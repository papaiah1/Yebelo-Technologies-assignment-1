import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { TradeData } from '../types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface Props {
  data: TradeData[];
}

export const PriceChart: React.FC<Props> = ({ data }) => {
  const chartData = {
    labels: data.map(d => new Date(d.ts).toLocaleTimeString()),
    datasets: [
      {
        label: 'Price',
        data: data.map(d => d.price),
        borderColor: 'blue',
        backgroundColor: 'rgba(0,0,255,0.1)',
      },
    ],
  };

  return <Line data={chartData} />;
};
