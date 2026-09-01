import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client.js'

export default function RecordsList() {
  const [records, setRecords] = useState(null)
  const [error, setError] = useState(null)

  function load() {
    api.getRecords()
      .then(setRecords)
      .catch((err) => setError(err.message))
  }

  useEffect(load, [])

  async function handleDelete(id) {
    if (!confirm('¿Borrar este registro? No se puede deshacer.')) return
    try {
      await api.deleteRecord(id)
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  if (error) return <p className="error-state">{error}</p>
  if (records === null) return <p className="loading-state">Cargando registros...</p>

  return (
    <section>
      <div className="section-heading with-action">
        <div>
          <h2>Registros de mantenimiento</h2>
          <p>Historial completo de tareas realizadas.</p>
        </div>
        <Link to="/records/new" className="btn btn-primary">+ Nuevo registro</Link>
      </div>

      {records.length === 0 ? (
        <div className="empty-state">
          <p>Todavía no cargaste ningún registro.</p>
        </div>
      ) : (
        <table className="records-table">
          <thead>
            <tr>
              <th>Categoría</th>
              <th>Tarea</th>
              <th>Fecha realizada</th>
              <th>Intervalo</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id}>
                <td>{r.category}</td>
                <td>{r.title}</td>
                <td>{r.dateCompleted}</td>
                <td>{r.recommendedIntervalMonths} meses</td>
                <td className="row-actions">
                  <Link to={`/records/${r.id}/edit`}>Editar</Link>
                  <button onClick={() => handleDelete(r.id)} className="link-danger">Borrar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
