import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client.js'

export default function Dashboard() {
  const [suggestions, setSuggestions] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.getSuggestions()
      .then(setSuggestions)
      .catch((err) => setError(err.message))
  }, [])

  if (error) {
    return <p className="error-state">No se pudo cargar el panel: {error}</p>
  }

  if (suggestions === null) {
    return <p className="loading-state">Cargando panel...</p>
  }

  const overdue = suggestions.filter((s) => s.status === 'Vencido')
  const upcoming = suggestions.filter((s) => s.status === 'Próximo')

  return (
    <section>
      <div className="section-heading">
        <h2>Panel de mantenimiento</h2>
        <p>Esto se recalcula cada vez que abrís la app, según tus registros.</p>
      </div>

      {suggestions.length === 0 && (
        <div className="empty-state">
          <p>No hay tareas vencidas ni próximas por ahora.</p>
          <p>Si es la primera vez que usás la app, <Link to="/records/new">cargá un registro</Link> para empezar el historial.</p>
        </div>
      )}

      {overdue.length > 0 && (
        <div className="suggestion-group">
          <h3 className="group-label status-vencido">Vencido ({overdue.length})</h3>
          <div className="suggestion-grid">
            {overdue.map((s) => (
              <SuggestionCard key={`${s.category}-${s.title}`} suggestion={s} />
            ))}
          </div>
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="suggestion-group">
          <h3 className="group-label status-proximo">Próximo a vencer ({upcoming.length})</h3>
          <div className="suggestion-grid">
            {upcoming.map((s) => (
              <SuggestionCard key={`${s.category}-${s.title}`} suggestion={s} />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

function SuggestionCard({ suggestion }) {
  const statusClass = suggestion.status === 'Vencido' ? 'status-vencido' : 'status-proximo'
  const daysLabel = suggestion.daysUntilDue < 0
    ? `Vencido hace ${Math.abs(suggestion.daysUntilDue)} días`
    : `Vence en ${suggestion.daysUntilDue} días`

  return (
    <article className={`suggestion-card ${statusClass}`}>
      <span className="suggestion-category">{suggestion.category}</span>
      <h4>{suggestion.title}</h4>
      <p className="suggestion-days">{daysLabel}</p>
      <p className="suggestion-meta">Última vez: {suggestion.lastDone}</p>
    </article>
  )
}
