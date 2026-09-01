import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/client.js'
import { CATEGORIES, DEFAULT_INTERVALS } from '../constants.js'

const emptyForm = {
  category: CATEGORIES[0],
  title: '',
  notes: '',
  dateCompleted: new Date().toISOString().slice(0, 10),
  recommendedIntervalMonths: DEFAULT_INTERVALS[CATEGORIES[0]]
}

export default function RecordForm() {
  const { id } = useParams()
  const isEditing = Boolean(id)
  const navigate = useNavigate()

  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(isEditing)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isEditing) return
    api.getRecord(id)
      .then((r) => setForm({
        category: r.category,
        title: r.title,
        notes: r.notes ?? '',
        dateCompleted: r.dateCompleted,
        recommendedIntervalMonths: r.recommendedIntervalMonths
      }))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id, isEditing])

  function handleCategoryChange(category) {
    setForm((f) => ({
      ...f,
      category,
      // solo autocompleta el intervalo si el usuario no lo tocó todavía
      recommendedIntervalMonths: DEFAULT_INTERVALS[category] ?? f.recommendedIntervalMonths
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const payload = {
        category: form.category,
        title: form.title,
        notes: form.notes || null,
        dateCompleted: form.dateCompleted,
        recommendedIntervalMonths: Number(form.recommendedIntervalMonths)
      }
      if (isEditing) {
        await api.updateRecord(id, payload)
      } else {
        await api.createRecord(payload)
      }
      navigate('/records')
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  if (loading) return <p className="loading-state">Cargando...</p>

  return (
    <section className="form-section">
      <div className="section-heading">
        <h2>{isEditing ? 'Editar registro' : 'Nuevo registro'}</h2>
        <p>Cargá una tarea de mantenimiento que ya realizaste.</p>
      </div>

      {error && <p className="error-state">{error}</p>}

      <form onSubmit={handleSubmit} className="record-form">
        <label>
          Categoría
          <select
            value={form.category}
            onChange={(e) => handleCategoryChange(e.target.value)}
          >
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>

        <label>
          Tarea
          <input
            type="text"
            required
            placeholder="Ej: Revisión de cañerías"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
        </label>

        <label>
          Fecha realizada
          <input
            type="date"
            required
            value={form.dateCompleted}
            onChange={(e) => setForm((f) => ({ ...f, dateCompleted: e.target.value }))}
          />
        </label>

        <label>
          Repetir cada (meses)
          <input
            type="number"
            min="1"
            required
            value={form.recommendedIntervalMonths}
            onChange={(e) => setForm((f) => ({ ...f, recommendedIntervalMonths: e.target.value }))}
          />
        </label>

        <label>
          Notas (opcional)
          <textarea
            rows="3"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />
        </label>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
          <button type="button" className="btn" onClick={() => navigate('/records')}>
            Cancelar
          </button>
        </div>
      </form>
    </section>
  )
}
