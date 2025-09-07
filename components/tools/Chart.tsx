import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title } from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title
);

interface ChartProps {
  data: {
    chartType: 'pie' | 'bar' | 'line';
    title: string;
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor?: string | string[];
      borderColor?: string | string[];
    }[];
  };
}

const generateColors = (numColors: number) => {
    const colors = [
        '#6366f1', '#38bdf8', '#10b981', '#f59e0b', '#f43f5e',
        '#8b5cf6', '#14b8a6', '#ec4899', '#f97316', '#a855f7'
    ];
    const result = [];
    for (let i = 0; i < numColors; i++) {
        result.push(colors[i % colors.length]);
    }
    return result;
};

export const Chart: React.FC<ChartProps> = ({ data }) => {
    if (!data || !data.chartType || !data.labels || !data.datasets) {
        return <div className="p-4 text-slate-400">Invalid chart data provided.</div>;
    }
    
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top' as const,
                labels: {
                    color: '#cbd5e1' // text-slate-300
                }
            },
            title: {
                display: true,
                text: data.title,
                color: '#ffffff', // text-white
                font: {
                    size: 16,
                }
            },
        },
        scales: (data.chartType === 'bar' || data.chartType === 'line') ? {
            x: {
                ticks: { color: '#94a3b8' }, // text-slate-400
                grid: { color: '#334155' }  // border-slate-700
            },
            y: {
                ticks: { color: '#94a3b8' }, // text-slate-400
                grid: { color: '#334155' } // border-slate-700
            }
        } : undefined
    };

    const chartData = {
        labels: data.labels,
        datasets: data.datasets.map(ds => {
            const numDataPoints = ds.data.length;
            const backgroundColors = ds.backgroundColor || generateColors(numDataPoints);
            const borderColors = ds.borderColor || (data.chartType === 'line' ? backgroundColors : '#334155');

            return {
                ...ds,
                backgroundColor: backgroundColors,
                borderColor: borderColors,
                borderWidth: data.chartType === 'line' ? 2 : 1,
            };
        })
    };

    return (
        <div className="p-4 w-full h-full flex items-center justify-center overflow-auto bg-slate-900 rounded-b-xl">
            {data.chartType === 'pie' && <Pie data={chartData} options={chartOptions} />}
            {data.chartType === 'bar' && <Bar data={chartData} options={chartOptions} />}
            {data.chartType === 'line' && <Line data={chartData} options={chartOptions} />}
        </div>
    );
};