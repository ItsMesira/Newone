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
  Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { Card, CardHeader, CardTitle } from './ui/Card'
import { calculateEnergyCurve } from '@/lib/calculations'
import { getHours, addHours, getMinutes } from 'date-fns'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler
)

interface EnergyChartProps {
  wakeTime: Date;
  sleepDebt: number;
  currentTime: Date;
}

export function EnergyChart({ wakeTime, sleepDebt, currentTime }: EnergyChartProps) {
  const chartData = useMemo(() => {
    const labels = []
    const dataPoints = []
    
    // We want to draw a full 24h curve starting from the wake time
    for (let i = 0; i <= 24; i++) {
      const timePoint = addHours(wakeTime, i)
      const currentHours = getHours(timePoint)
      labels.push(`${currentHours}:00`)
      const score = calculateEnergyCurve(timePoint, wakeTime, sleepDebt)
      dataPoints.push(score)
    }

    // Insert current time point precisely 
    // Usually we just draw the line and overlay the current time as a plugin or vertical line
    
    return {
      labels,
      datasets: [
        {
          label: 'Energy Level',
          data: dataPoints,
          borderColor: '#8b5cf6', // primary color
          backgroundColor: 'rgba(139, 92, 246, 0.2)', // primary with opacity
          tension: 0.4, // smooth cosine interpolation naturally enhanced by chart.js tension
          fill: true,
          pointRadius: 0, // hide points
          pointHoverRadius: 4,
          borderWidth: 3,
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
          display: false,
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.4)',
          maxTicksLimit: 8,
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
        backgroundColor: 'rgba(24, 24, 27, 0.9)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: 10,
        displayColors: false,
      }
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
  }

  return (
    <Card className="h-full flex flex-col pt-6 pb-2 px-2">
      <CardHeader className="px-4 pb-0 mb-2">
        <CardTitle>Daily Energy Curve</CardTitle>
      </CardHeader>
      <div className="flex-1 min-h-[200px] w-full mt-4">
        <Line data={chartData} options={options} />
      </div>
    </Card>
  )
}
