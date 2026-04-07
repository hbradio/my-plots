import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApi } from '../lib/api'

interface PlotSummary {
  id: string
  name: string
  y_axis_label: string
  created_at: string
}

export default function Home() {
  const { fetchWithAuth } = useApi()
  const navigate = useNavigate()
  const [plots, setPlots] = useState<PlotSummary[]>([])
  const [loading, setLoading] = useState(true)

  const loadPlots = async () => {
    try {
      const data = await fetchWithAuth('/api/plots')
      setPlots(data)
    } catch (err) {
      console.error('Failed to load plots:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPlots()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreate = async () => {
    const name = prompt('Plot name:')
    if (!name) return
    const yLabel = prompt('Y-axis label:', '') || ''
    try {
      const plot = await fetchWithAuth('/api/plots', {
        method: 'POST',
        body: JSON.stringify({ name, y_axis_label: yLabel }),
      })
      navigate(`/plot/${plot.id}`)
    } catch (err) {
      alert('Failed to create plot: ' + err)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete plot "${name}"? This cannot be undone.`)) return
    try {
      await fetchWithAuth(`/api/plots?id=${id}`, { method: 'DELETE' })
      setPlots((prev) => prev.filter((p) => p.id !== id))
    } catch (err) {
      alert('Failed to delete: ' + err)
    }
  }

  if (loading) return <p>Loading...</p>

  return (
    <div>
      <div className="home-header">
        <h1>My Plots</h1>
        <button onClick={handleCreate}>+ New Plot</button>
      </div>
      {plots.length === 0 ? (
        <div className="empty-state">No plots yet. Create one to get started.</div>
      ) : (
        <ul className="plot-list">
          {plots.map((p) => (
            <li key={p.id}>
              <div className="plot-info">
                <Link to={`/plot/${p.id}`} className="plot-name">{p.name}</Link>
                {p.y_axis_label && <span className="plot-label">{p.y_axis_label}</span>}
              </div>
              <button className="danger" onClick={() => handleDelete(p.id, p.name)}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
