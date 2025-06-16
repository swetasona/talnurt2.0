import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  defaults,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

// Set chart defaults to match our design
defaults.font.family = '"Inter", "Segoe UI", "Roboto", sans-serif';
defaults.color = '#6B7280';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const DashboardCharts: React.FC = () => {
  // Bar chart data
  const barData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Placements',
        data: [3, 5, 4, 8, 2, 6],
        backgroundColor: '#0056b3',
        borderRadius: 4,
        barPercentage: 0.6,
        categoryPercentage: 0.5,
      },
      {
        label: 'Revenue ($K)',
        data: [12, 19, 16, 28, 8, 24],
        backgroundColor: '#f59e0b',
        borderRadius: 4,
        barPercentage: 0.6,
        categoryPercentage: 0.5,
      },
    ],
  };

  // Pie chart data
  const pieData = {
    labels: ['Technology', 'Finance', 'Healthcare', 'Retail', 'Manufacturing'],
    datasets: [
      {
        data: [35, 25, 20, 15, 5],
        backgroundColor: [
          '#0056b3',
          '#f59e0b',
          '#10b981',
          '#6366f1',
          '#ef4444',
        ],
        borderWidth: 0,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        align: 'start' as const,
        labels: {
          boxWidth: 15,
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 15,
        },
      },
      title: {
        display: true,
        text: 'Monthly Performance',
        align: 'start' as const,
        padding: {
          bottom: 20,
        },
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
      tooltip: {
        backgroundColor: 'white',
        titleColor: '#111827',
        bodyColor: '#6B7280',
        borderColor: '#E5E7EB',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        callbacks: {
          labelPointStyle: (context: any) => {
            return {
              pointStyle: 'circle' as const,
              rotation: 0,
            };
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: true,
          drawBorder: false,
          color: '#E5E7EB',
        },
        ticks: {
          padding: 8,
        },
      },
      y: {
        grid: {
          display: true,
          drawBorder: false,
          color: '#E5E7EB',
        },
        ticks: {
          padding: 8,
        },
      },
    },
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          boxWidth: 15,
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 15,
        },
      },
      title: {
        display: true,
        text: 'Placements by Industry',
        align: 'start' as const,
        padding: {
          bottom: 20,
        },
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
      tooltip: {
        backgroundColor: 'white',
        titleColor: '#111827',
        bodyColor: '#6B7280',
        borderColor: '#E5E7EB',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
      },
    },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="h-80">
          <Bar options={barOptions} data={barData} />
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="h-80">
          <Pie options={pieOptions} data={pieData} />
        </div>
      </div>
    </div>
  );
};

export default DashboardCharts; 