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
  refInterpolation?: string | null
  xAxisUnit?: string | null
}

function interpolateRefLine(
  startDate: string,
  startValue: number,
  endDate: string,
  endValue: number,
  mode: string,
): { x: string; y: number }[] {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const totalMs = end.getTime() - start.getTime()
  if (totalMs <= 0) return [{ x: startDate, y: startValue }, { x: endDate, y: endValue }]

  const points: { x: string; y: number }[] = []
  const current = new Date(start)

  while (current <= end) {
    const elapsed = current.getTime() - start.getTime()
    const t = elapsed / totalMs
    const y = startValue + t * (endValue - startValue)
    points.push({ x: current.toISOString().slice(0, 10), y: Math.round(y * 1000) / 1000 })

    if (mode === 'day') {
      current.setDate(current.getDate() + 1)
    } else {
      current.setMonth(current.getMonth() + 1)
    }
  }

  // Ensure the end point is always included
  const lastDate = points[points.length - 1]?.x
  if (lastDate !== endDate) {
    points.push({ x: endDate, y: endValue })
  }

  return points
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
  refInterpolation,
  xAxisUnit,
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
      const hasInterpolation = refInterpolation === 'day' || refInterpolation === 'month'

      if (hasInterpolation) {
        const interpPoints = interpolateRefLine(refStartDate, refStartValue, refEndDate, refEndValue, refInterpolation!)
        datasets.push({
          label: 'Reference Line',
          data: interpPoints,
          showLine: true,
          borderColor: '#b91d47',
          borderWidth: 2,
          borderDash: [6, 4],
          pointRadius: 4,
          pointBackgroundColor: '#b91d47',
          pointBorderColor: '#b91d47',
        })
      } else {
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
            time: { ...(xAxisUnit === 'day' || xAxisUnit === 'month' ? { unit: xAxisUnit } : {}), tooltipFormat: 'yyyy-MM-dd' },
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
  }, [points, yAxisLabel, yMin, yMax, refStartDate, refStartValue, refEndDate, refEndValue, refInterpolation, xAxisUnit])

  return <canvas ref={canvasRef} />
}
