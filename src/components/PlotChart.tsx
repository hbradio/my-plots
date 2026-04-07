import { useEffect, useRef } from 'react'
import { Chart, registerables } from 'chart.js'
import 'chartjs-adapter-date-fns'

Chart.register(...registerables)

interface PlotChartProps {
  points: { date: string; value: number }[]
  yAxisLabel: string
  yMin?: number | null
  yMax?: number | null
  refStartDate?: string | null
  refStartValue?: number | null
  refEndDate?: string | null
  refEndValue?: number | null
}

export default function PlotChart({
  points,
  yAxisLabel,
  yMin,
  yMax,
  refStartDate,
  refStartValue,
  refEndDate,
  refEndValue,
}: PlotChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<Chart | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    if (chartRef.current) {
      chartRef.current.destroy()
    }

    const datasets: any[] = [
      {
        label: 'Data Points',
        data: points.map((p) => ({ x: p.date, y: p.value })),
        showLine: false,
        pointRadius: 6,
        pointBackgroundColor: '#2d89ef',
        pointBorderColor: '#2b5797',
        pointBorderWidth: 2,
      },
    ]

    if (refStartDate && refEndDate && refStartValue != null && refEndValue != null) {
      datasets.push({
        label: 'Reference Line',
        data: [
          { x: refStartDate, y: refStartValue },
          { x: refEndDate, y: refEndValue },
        ],
        showLine: true,
        borderColor: '#b91d47',
        borderWidth: 2,
        borderDash: [6, 4],
        pointRadius: 4,
        pointBackgroundColor: '#b91d47',
        pointBorderColor: '#b91d47',
      })
    }

    const fontFamily = "'Segoe UI Variable', 'Segoe UI', system-ui, sans-serif"

    chartRef.current = new Chart(canvasRef.current, {
      type: 'scatter',
      data: { datasets },
      options: {
        responsive: true,
        plugins: {
          legend: {
            labels: {
              font: { family: fontFamily, weight: 'bold', size: 13 },
              color: '#777',
            },
          },
        },
        scales: {
          x: {
            type: 'time',
            time: { unit: 'day', tooltipFormat: 'yyyy-MM-dd' },
            title: { display: true, text: 'Date', font: { family: fontFamily, weight: 'bold', size: 14 }, color: '#777' },
            ticks: { font: { family: fontFamily, weight: 'bold', size: 12 }, color: '#999' },
            grid: { color: '#eee' },
          },
          y: {
            title: { display: true, text: yAxisLabel || 'Value', font: { family: fontFamily, weight: 'bold', size: 14 }, color: '#777' },
            ticks: { font: { family: fontFamily, weight: 'bold', size: 12 }, color: '#999' },
            grid: { color: '#eee' },
            ...(yMin != null ? { min: yMin } : {}),
            ...(yMax != null ? { max: yMax } : {}),
          },
        },
      },
    })

    return () => {
      chartRef.current?.destroy()
      chartRef.current = null
    }
  }, [points, yAxisLabel, yMin, yMax, refStartDate, refStartValue, refEndDate, refEndValue])

  return <canvas ref={canvasRef} />
}
