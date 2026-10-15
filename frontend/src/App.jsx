import React, { useEffect, useState } from 'react';
import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { api } from './services/api';
import Login from './pages/Login';
import { Dashboard, Doctors, MyAppointments, Manage, Analytics } from './pages.jsx';
import './App.css';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!localStorage.getItem('token'));

  useEffect(() => {
    if (!localStorage.getItem('token')) return;
    api('/me').then(setUser).catch(() => localStorage.removeItem('token')).finally(() => setLoading(false));
  }, []);

  const logout = () => { localStorage.removeItem('token'); setUser(null); };

  if (loading) return <p className="muted center">Loading…</p>;
  if (!user) return <Login onLogin={setUser} />;

  const admin = user.role === 'admin';
  return (
    <div className="shell">
      <aside>
        <h2>MediConnect</h2>
        <p className="muted small">{user.name} · {admin ? 'Administrator' : 'Patient'}</p>
        <nav>
          <NavLink to="/"> Dashboard</NavLink>
          {!admin && <NavLink to="/doctors"> Find Doctors</NavLink>}
          {!admin && <NavLink to="/appointments"> My Appointments</NavLink>}
          {admin && <NavLink to="/manage"> Manage Appointments</NavLink>}
          {admin && <NavLink to="/analytics"> Analytics</NavLink>}
        </nav>
        <button className="ghost" onClick={logout}>Log out</button>
      </aside>
      <main>
        <Routes>
          <Route path="/" element={<Dashboard user={user} setUser={setUser} />} />
          <Route path="/doctors" element={<Doctors />} />
          <Route path="/appointments" element={<MyAppointments />} />
          <Route path="/manage" element={<Manage />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}
