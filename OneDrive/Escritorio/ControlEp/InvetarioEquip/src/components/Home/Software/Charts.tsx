import React from "react";
import { Pie, Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface ChartProps {
  data: { name: string; value: number }[];
  colors?: string[];
  label?: string;
}

export const PieChart: React.FC<ChartProps> = ({ data, colors = [] }) => {
  const chartData = {
    labels: data.map(item => item.name),
    datasets: [
      {
        data: data.map(item => item.value),
        backgroundColor: colors,
        borderWidth: 1,
      },
    ],
  };

  const options = {
    plugins: {
      legend: {
        position: 'right' as const,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
    maintainAspectRatio: false
  };

  return <Pie data={chartData} options={options} />;
};

export const BarChart: React.FC<ChartProps & { label?: string }> = ({ data, colors = [], label = 'Valor' }) => {
  const chartData = {
    labels: data.map(item => item.name),
    datasets: [
      {
        label,
        data: data.map(item => item.value),
        backgroundColor: colors,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  return <Bar data={chartData} options={options} />;
};

export const LineChart: React.FC<{ data: { name: string; value: number; active?: number; expired?: number }[] }> = ({ data }) => {
  const chartData = {
    labels: data.map(item => item.name),
    datasets: [
      {
        label: 'Total Licencias',
        data: data.map(item => item.value),
        borderColor: '#3b82f6',
        backgroundColor: '#3b82f6',
        tension: 0.1,
      },
      {
        label: 'Activas',
        data: data.map(item => item.active),
        borderColor: '#10b981',
        backgroundColor: '#10b981',
        tension: 0.1,
      },
      {
        label: 'Caducadas',
        data: data.map(item => item.expired),
        borderColor: '#ef4444',
        backgroundColor: '#ef4444',
        tension: 0.1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  return <Line data={chartData} options={options} />;
};