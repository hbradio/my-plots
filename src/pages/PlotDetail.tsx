import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useApi } from '../lib/api'
import PlotChart from '../components/PlotChart'

interface Point {
  id: string
  plot_id: string
  date: string
  value: number
}

interface Plot {
  id: string
  name: string
  y_axis_label: string
  y_min: number | null
  y_max: number | null
  ref_start_date: string | null
  ref_start_value: number | null
  ref_end_date: string | null
  ref_end_value: number | null
  points: Point[]
}

export default function PlotDetail() {
  const { id } = useParams<{ id: string }>()
  const { fetchWithAuth } = useApi()
  const [plot, setPlot] = useState<Plot | null>(null)
  const [loading, setLoading] = useState(true)
  const [newDate, setNewDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [newValue, setNewValue] = useState('')

  const [settingsName, setSettingsName] = useState('')
  const [settingsYLabel, setSettingsYLabel] = useState('')
  const [settingsYMin, setSettingsYMin] = useState('')
  const [settingsYMax, setSettingsYMax] = useState('')
  const [settingsRefStartDate, setSettingsRefStartDate] = useState('')
  const [settingsRefStartValue, setSettingsRefStartValue] = useState('')
  const [settingsRefEndDate, setSettingsRefEndDate] = useState('')
  const [settingsRefEndValue, setSettingsRefEndValue] = useState('')

  const loadPlot = async () => {
    try {
      const data = await fetchWithAuth(`/api/plots?id=${id}`)
      setPlot(data)
      setSettingsName(data.name)
      setSettingsYLabel(data.y_axis_label)
      setSettingsYMin(data.y_min != null ? String(data.y_min) : '')
      setSettingsYMax(data.y_max != null ? String(data.y_max) : '')
      setSettingsRefStartDate(data.ref_start_date || '')
      setSettingsRefStartValue(data.ref_start_value != null ? String(data.ref_start_value) : '')
      setSettingsRefEndDate(data.ref_end_date || '')
      setSettingsRefEndValue(data.ref_end_value != null ? String(data.ref_end_value) : '')
    } catch (err) {
      console.error('Failed to load plot:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPlot()
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddPoint = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newDate || newValue === '') return
    try {
      await fetchWithAuth('/api/points', {
        method: 'POST',
        body: JSON.stringify({ plot_id: id, date: newDate, value: Number(newValue) }),
      })
      setNewDate('')
      setNewValue('')
      loadPlot()
    } catch (err) {
      alert('Failed to add point: ' + err)
    }
  }

  const handleDeletePoint = async (pointId: string) => {
    try {
      await fetchWithAuth(`/api/points?id=${pointId}`, { method: 'DELETE' })
      loadPlot()
    } catch (err) {
      alert('Failed to delete point: ' + err)
    }
  }

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    const update: any = { id }
    update.name = settingsName
    update.y_axis_label = settingsYLabel

    if (settingsYMin === '') {
      update.clear_y_min = true
    } else {
      update.y_min = Number(settingsYMin)
    }
    if (settingsYMax === '') {
      update.clear_y_max = true
    } else {
      update.y_max = Number(settingsYMax)
    }

    const hasRef = settingsRefStartDate && settingsRefStartValue !== '' && settingsRefEndDate && settingsRefEndValue !== ''
    if (!hasRef) {
      update.clear_ref = true
    } else {
      update.ref_start_date = settingsRefStartDate
      update.ref_start_value = Number(settingsRefStartValue)
      update.ref_end_date = settingsRefEndDate
      update.ref_end_value = Number(settingsRefEndValue)
    }

    try {
      await fetchWithAuth('/api/plots', {
        method: 'PATCH',
        body: JSON.stringify(update),
      })
      loadPlot()
    } catch (err) {
      alert('Failed to save settings: ' + err)
    }
  }

  if (loading) return <p>Loading...</p>
  if (!plot) return <p>Plot not found.</p>

  const points = plot.points || []

  return (
    <div className="plot-detail">
      <Link to="/" className="back-link">&larr; Back to plots</Link>
      <h1>{plot.name}</h1>

      <div className="chart-card">
        <PlotChart
          points={points}
          yAxisLabel={plot.y_axis_label}
          yMin={plot.y_min}
          yMax={plot.y_max}
          refStartDate={plot.ref_start_date}
          refStartValue={plot.ref_start_value}
          refEndDate={plot.ref_end_date}
          refEndValue={plot.ref_end_value}
        />
      </div>

      <h2>Add Point</h2>
      <form onSubmit={handleAddPoint} className="add-point-form">
        <div className="field">
          <label>Date</label>
          <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} required />
        </div>
        <div className="field">
          <label>Value</label>
          <input
            type="number"
            step="any"
            placeholder="0"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            required
          />
        </div>
        <button type="submit">Add</button>
      </form>

      {points.length > 0 && (
        <div className="points-card">
          <table>
            <thead>
              <tr><th>Date</th><th>Value</th><th></th></tr>
            </thead>
            <tbody>
              {points.map((p) => (
                <tr key={p.id}>
                  <td>{p.date}</td>
                  <td>{p.value}</td>
                  <td><button className="danger" onClick={() => handleDeletePoint(p.id)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <details>
        <summary>Settings</summary>
        <div className="settings-body">
          <form onSubmit={handleSaveSettings}>
            <div className="settings-grid">
              <div>
                <label>Name</label>
                <input value={settingsName} onChange={(e) => setSettingsName(e.target.value)} style={{ width: '100%' }} />
              </div>
              <div>
                <label>Y-axis label</label>
                <input value={settingsYLabel} onChange={(e) => setSettingsYLabel(e.target.value)} style={{ width: '100%' }} />
              </div>
              <div>
                <label>Y-axis min</label>
                <input type="number" step="any" value={settingsYMin} onChange={(e) => setSettingsYMin(e.target.value)} placeholder="Auto" style={{ width: '100%' }} />
              </div>
              <div>
                <label>Y-axis max</label>
                <input type="number" step="any" value={settingsYMax} onChange={(e) => setSettingsYMax(e.target.value)} placeholder="Auto" style={{ width: '100%' }} />
              </div>
            </div>
            <fieldset>
              <legend>Reference Line</legend>
              <div className="settings-grid">
                <div>
                  <label>Start date</label>
                  <input type="date" value={settingsRefStartDate} onChange={(e) => setSettingsRefStartDate(e.target.value)} style={{ width: '100%' }} />
                </div>
                <div>
                  <label>Start value</label>
                  <input type="number" step="any" value={settingsRefStartValue} onChange={(e) => setSettingsRefStartValue(e.target.value)} style={{ width: '100%' }} />
                </div>
                <div>
                  <label>End date</label>
                  <input type="date" value={settingsRefEndDate} onChange={(e) => setSettingsRefEndDate(e.target.value)} style={{ width: '100%' }} />
                </div>
                <div>
                  <label>End value</label>
                  <input type="number" step="any" value={settingsRefEndValue} onChange={(e) => setSettingsRefEndValue(e.target.value)} style={{ width: '100%' }} />
                </div>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>Clear all 4 fields to remove the reference line.</p>
            </fieldset>
            <div style={{ marginTop: 16 }}>
              <button type="submit">Save Settings</button>
            </div>
          </form>
        </div>
      </details>
    </div>
  )
}
