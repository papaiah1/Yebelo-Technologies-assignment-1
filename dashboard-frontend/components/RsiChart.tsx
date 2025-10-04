import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { RsiData } from '../types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface Props {
  data: RsiData[];
}

export const RsiChart: React.FC<Props> = ({ data }) => {
  const chartData = {
    labels: data.map(d => new Date(d.ts).toLocaleTimeString()),
    datasets: [
      {
        label: 'RSI',
        data: data.map(d => d.rsi),
        borderColor: 'red',
        backgroundColor: 'rgba(255,0,0,0.1)',
      },
      {
        label: 'Overbought (70)',
        data: Array(data.length).fill(70),
        borderColor: 'green',
        borderDash: [5, 5],
      },
      {
        label: 'Oversold (30)',
        data: Array(data.length).fill(30),
        borderColor: 'orange',
        borderDash: [5, 5],
      },
    ],
  };

  return <Line data={chartData} />;
};
