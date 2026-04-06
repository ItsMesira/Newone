"use client"

import { useMemo } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { Card } from './ui/Card'
import { calculateEnergyCurve } from '@/lib/calculations'
import { getHours, addHours } from 'date-fns'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip
)

interface EnergyChartProps {
  wakeTime: Date;
  sleepDebt: number;
}

export function EnergyChart({ wakeTime, sleepDebt }: EnergyChartProps) {
  const chartData = useMemo(() => {
    const labels = []
    const dataPoints = []
    
    for (let i = 0; i <= 24; i++) {
      const timePoint = addHours(wakeTime, i)
      const currentHours = getHours(timePoint)
      labels.push(`${currentHours}:00`)
      const score = calculateEnergyCurve(timePoint, wakeTime, sleepDebt)
      dataPoints.push(score)
    }
    
    return {
      labels,
      datasets: [
        {
          label: 'Energy Level',
          data: dataPoints,
          borderColor: '#a3e635', // Match --primary
          backgroundColor: 'transparent',
          tension: 0.4, 
          fill: false,
          pointRadius: 4,
          pointBackgroundColor: '#f97316', // Orange dots for data points mimicking the masonry dot charts
          pointBorderColor: '#1e1e1e',
          pointBorderWidth: 2,
          pointHoverRadius: 6,
          borderWidth: 2,
        }
      ]
    }
  }, [wakeTime, sleepDebt])

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1200,
      easing: 'easeOutQuart' as const,
    },
    scales: {
      y: {
        display: false,
        min: 0,
        max: 100,
      },
      x: {
        grid: {
          display: true,
          color: 'rgba(255, 255, 255, 0.03)',
          drawBorder: false,
        },
        ticks: {
          color: '#71717a',
          maxTicksLimit: 6,
          font: {
            family: 'sans-serif',
            weight: 600,
            size: 11
          }
        },
        border: {
          display: false
        }
      }
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: '#1e1e1e', // Dark surface
        titleColor: '#fff',
        titleFont: { family: 'var(--font-display)', size: 14 },
        bodyColor: '#a3e635',
        borderColor: 'rgba(255,255,255,0.05)',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        cornerRadius: 8,
      }
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
  }

  return (
    <Card className="h-full flex flex-col p-6 min-h-[260px]">
      <div className="flex justify-between items-start mb-6">
        <h3 className="font-display font-bold text-zinc-200 tracking-widest text-lg uppercase">ENERGY CURVE</h3>
        <span className="text-zinc-500 tracking-widest leading-none font-bold text-xl cursor-pointer">...</span>
      </div>
      <div className="flex-1 w-full min-h-[160px]">
        <Line data={chartData} options={options} />
      </div>
      
      <div className="mt-4 flex gap-6 text-xs font-semibold text-zinc-400">
        <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-primary"></span> Curve</div>
        <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-warning"></span> Nodes</div>
      </div>
    </Card>
  )
}
