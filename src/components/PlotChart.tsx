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
        pointRadius: 5,
        pointBackgroundColor: '#2563eb',
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
        borderColor: '#dc2626',
        borderDash: [5, 5],
        pointRadius: 3,
        pointBackgroundColor: '#dc2626',
      })
    }

    chartRef.current = new Chart(canvasRef.current, {
      type: 'scatter',
      data: { datasets },
      options: {
        responsive: true,
        scales: {
          x: {
            type: 'time',
            time: { unit: 'day', tooltipFormat: 'yyyy-MM-dd' },
            title: { display: true, text: 'Date' },
          },
          y: {
            title: { display: true, text: yAxisLabel || 'Value' },
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
