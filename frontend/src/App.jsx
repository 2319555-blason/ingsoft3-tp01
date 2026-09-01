import { Routes, Route, NavLink } from 'react-router-dom'
import Dashboard from './pages/Dashboard.jsx'
import RecordsList from './pages/RecordsList.jsx'
import RecordForm from './pages/RecordForm.jsx'
import './App.css'

export default function App() {
  return (
    <div className="app-shell">
      <header className="titleblock">
        <div className="titleblock-mark">HMT</div>
        <div className="titleblock-info">
          <h1>Home Maintenance Tracker</h1>
          <p>Registro y seguimiento del mantenimiento del hogar</p>
        </div>
        <nav className="titleblock-nav">
          <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>
            Panel
          </NavLink>
          <NavLink to="/records" className={({ isActive }) => isActive ? 'active' : ''}>
            Registros
          </NavLink>
        </nav>
      </header>

      <main className="content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/records" element={<RecordsList />} />
          <Route path="/records/new" element={<RecordForm />} />
          <Route path="/records/:id/edit" element={<RecordForm />} />
        </Routes>
      </main>
    </div>
  )
}
