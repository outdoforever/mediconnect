import React, { useEffect, useState, useMemo } from 'react';
import { api } from './services/api';

// ==========================================
// 1. DASHBOARD
// ==========================================
export function Dashboard({ user, setUser }) {
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (isAdmin) {
      api('/stats')
        .then(setStats)
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      api('/appointments/mine')
        .then(setAppointments)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isAdmin]);

  const upcomingAppointments = useMemo(() => {
    if (isAdmin) return [];
    return appointments.filter(
      (a) => a.status === 'Booked' || a.status === 'Confirmed'
    );
  }, [appointments, isAdmin]);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Welcome, {user.name}</h1>
        <p className="muted">Find a doctor and book your appointment in a few clicks.</p>
      </div>

      <div className="card profile-card">
        <h3>User Profile</h3>
        <div className="profile-grid">
          <div>
            <span className="profile-label">Full Name</span>
            <div className="profile-value">{user.name}</div>
          </div>
          <div>
            <span className="profile-label">Email Address</span>
            <div className="profile-value">{user.email}</div>
          </div>
          <div>
            <span className="profile-label">Phone Number</span>
            <div className="profile-value">{user.phone || 'Not provided'}</div>
          </div>
          <div>
            <span className="profile-label">Role</span>
            <div className="profile-value capitalize">{user.role}</div>
          </div>
          {user.age ? (
            <div>
              <span className="profile-label">Age</span>
              <div className="profile-value">{user.age} yrs</div>
            </div>
          ) : null}
        </div>
      </div>

      {!isAdmin ? (
        <div className="section-block">
          <h2>Upcoming Appointments</h2>
          {loading ? (
            <p className="muted">Loading appointments…</p>
          ) : upcomingAppointments.length === 0 ? (
            <div className="card empty-state">
              <p className="muted">You have no upcoming appointments.</p>
              <a href="/doctors" className="btn primary small-btn">Find a Doctor</a>
            </div>
          ) : (
            <div className="grid-2">
              {upcomingAppointments.map((appt) => (
                <div key={appt._id} className="card item-card">
                  <div className="card-top-row">
                    <h3>{appt.doctor?.name || 'Doctor'}</h3>
                    <span className={`status-badge status-${appt.status}`}>
                      {appt.status}
                    </span>
                  </div>
                  <p className="muted small">
                    {appt.doctor?.specialization} · {appt.doctor?.hospital}
                  </p>
                  <div className="appt-datetime">
                    <span>📅 {appt.date} at {appt.timeSlot}</span>
                  </div>
                  {appt.reason && (
                    <p className="appt-reason"><strong>Reason:</strong> {appt.reason}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="section-block">
          <h2>Administrative Overview</h2>
          {loading ? (
            <p className="muted">Loading system metrics…</p>
          ) : stats ? (
            <div className="stats-row">
              <div className="card stat-card">
                <div className="stat-number">{stats.patients}</div>
                <div className="stat-label">Registered Patients</div>
              </div>
              <div className="card stat-card">
                <div className="stat-number">{stats.doctors}</div>
                <div className="stat-label">Doctors Available</div>
              </div>
              <div className="card stat-card">
                <div className="stat-number">{stats.appointments}</div>
                <div className="stat-label">Total Appointments</div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

// ==========================================
// 2. DOCTORS (Patient Only)
// ==========================================
export function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [selectedSpec, setSelectedSpec] = useState('');
  const [loading, setLoading] = useState(true);

  // Booking form state
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [bookDate, setBookDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [freeSlots, setFreeSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [reason, setReason] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [bookingMsg, setBookingMsg] = useState(null);

  // Fetch doctors (all or filtered)
  const fetchDoctors = async (spec = '') => {
    setLoading(true);
    try {
      const endpoint = spec ? `/doctors?specialization=${encodeURIComponent(spec)}` : '/doctors';
      const data = await api(endpoint);
      setDoctors(data);

      // Collect unique specializations if not yet loaded
      if (specializations.length === 0 && !spec) {
        const specs = Array.from(new Set(data.map((d) => d.specialization))).filter(Boolean);
        setSpecializations(specs);
      }
    } catch (err) {
      console.error('Error fetching doctors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors(selectedSpec);
  }, [selectedSpec]);

  // Fetch free slots when selectedDoctor or bookDate changes
  const fetchSlots = async (docId, date) => {
    if (!docId || !date) return;
    setSlotsLoading(true);
    try {
      const slots = await api(`/doctors/${docId}/slots?date=${date}`);
      setFreeSlots(slots);
      setSelectedSlot(slots.length > 0 ? slots[0] : '');
    } catch (err) {
      console.error('Error fetching free slots:', err);
      setFreeSlots([]);
      setSelectedSlot('');
    } finally {
      setSlotsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDoctor) {
      fetchSlots(selectedDoctor._id, bookDate);
    }
  }, [selectedDoctor, bookDate]);

  const handleStartBooking = (doc) => {
    setSelectedDoctor(doc);
    setBookingMsg(null);
    setReason('');
    const today = new Date().toISOString().split('T')[0];
    setBookDate(today);
  };

  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    if (!selectedDoctor || !bookDate || !selectedSlot) {
      setBookingMsg({ type: 'err', text: 'Please select a date and an available time slot.' });
      return;
    }
    setBookingLoading(true);
    setBookingMsg(null);
    try {
      await api('/appointments', 'POST', {
        doctorId: selectedDoctor._id,
        date: bookDate,
        timeSlot: selectedSlot,
        reason
      });
      setBookingMsg({
        type: 'success',
        text: `Appointment booked with ${selectedDoctor.name} for ${bookDate} at ${selectedSlot}!`
      });
      setReason('');
      // Refresh available slots for this date
      fetchSlots(selectedDoctor._id, bookDate);
    } catch (err) {
      setBookingMsg({ type: 'err', text: err.message || 'Failed to book appointment' });
    } finally {
      setBookingLoading(false);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Find Doctors</h1>
        <p className="muted">Browse medical specialists, check available slots, and book a consultation.</p>
      </div>

      {/* Specialization Filter */}
      <div className="filter-bar">
        <label htmlFor="spec-select" className="filter-label">Filter by Specialization:</label>
        <select
          id="spec-select"
          className="select-input"
          value={selectedSpec}
          onChange={(e) => setSelectedSpec(e.target.value)}
        >
          <option value="">All specializations</option>
          {specializations.map((spec) => (
            <option key={spec} value={spec}>{spec}</option>
          ))}
        </select>
      </div>

      {/* Doctor Grid */}
      {loading ? (
        <p className="muted">Loading doctors…</p>
      ) : doctors.length === 0 ? (
        <p className="muted">No doctors found for this specialization.</p>
      ) : (
        <div className="grid-2">
          {doctors.map((doc) => (
            <div key={doc._id} className="card item-card doctor-card">
              <div className="card-top-row">
                <span className="tag-specialization">{doc.specialization}</span>
              </div>
              <h3 className="doc-name">{doc.name}</h3>
              <p className="doc-meta muted">
                {doc.hospital} · {doc.experience} yrs experience · ₹{doc.fee}
              </p>

              <div className="slots-preview">
                <span className="slots-label small muted">Daily Schedule:</span>
                <div className="slots-chips-row">
                  {doc.timeSlots?.map((slot) => (
                    <span key={slot} className="slot-chip">{slot}</span>
                  ))}
                </div>
              </div>

              <button
                className="primary small-btn book-btn"
                onClick={() => handleStartBooking(doc)}
              >
                Book appointment
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Booking Drawer / Card */}
      {selectedDoctor && (
        <div className="card booking-card" id="booking-section">
          <div className="booking-header">
            <h3>Book with {selectedDoctor.name}</h3>
            <button className="ghost small-btn close-btn" onClick={() => setSelectedDoctor(null)}>✕ Close</button>
          </div>
          <p className="muted small">
            {selectedDoctor.specialization} · {selectedDoctor.hospital} · Consultation Fee: ₹{selectedDoctor.fee}
          </p>

          <form onSubmit={handleConfirmBooking} className="booking-form">
            <div className="form-row">
              <div className="form-group">
                <label>Appointment Date</label>
                <input
                  type="date"
                  min={todayStr}
                  value={bookDate}
                  onChange={(e) => setBookDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  Available Time Slot {slotsLoading && <span className="small muted">(loading…)</span>}
                </label>
                {freeSlots.length === 0 && !slotsLoading ? (
                  <p className="err small">No slots available for this date.</p>
                ) : (
                  <select
                    value={selectedSlot}
                    onChange={(e) => setSelectedSlot(e.target.value)}
                    disabled={freeSlots.length === 0 || slotsLoading}
                    required
                  >
                    {freeSlots.map((slot) => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div className="form-group">
              <label>Reason for Visit</label>
              <input
                type="text"
                placeholder="e.g. Chest pain check-up, regular consultation..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

            {bookingMsg && (
              <p className={bookingMsg.type === 'err' ? 'err' : 'success-msg'}>
                {bookingMsg.text}
              </p>
            )}

            <button
              type="submit"
              className="primary"
              disabled={bookingLoading || freeSlots.length === 0}
            >
              {bookingLoading ? 'Booking…' : 'Confirm booking'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 3. MY APPOINTMENTS (Patient Only)
// ==========================================
export function MyAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [msg, setMsg] = useState('');

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const data = await api('/appointments/mine');
      setAppointments(data);
    } catch (err) {
      console.error('Error fetching appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    setCancellingId(id);
    setMsg('');
    try {
      await api(`/appointments/${id}/cancel`, 'PUT');
      setMsg('Appointment cancelled successfully.');
      loadAppointments();
    } catch (err) {
      setMsg(err.message || 'Failed to cancel appointment');
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>My Appointments</h1>
        <p className="muted">Track upcoming and past consultations, or cancel active bookings.</p>
      </div>

      {msg && <p className="success-msg">{msg}</p>}

      {loading ? (
        <p className="muted">Loading your appointments…</p>
      ) : appointments.length === 0 ? (
        <div className="card empty-state">
          <p className="muted">No appointments found.</p>
          <a href="/doctors" className="btn primary small-btn">Book an Appointment</a>
        </div>
      ) : (
        <div className="grid-2">
          {appointments.map((appt) => {
            const canCancel = appt.status === 'Booked' || appt.status === 'Confirmed';
            return (
              <div key={appt._id} className="card item-card appt-card">
                <div className="card-top-row">
                  <h3 className="doc-name">{appt.doctor?.name || 'Doctor'}</h3>
                  <span className={`status-badge status-${appt.status}`}>
                    {appt.status}
                  </span>
                </div>
                <p className="muted small">
                  {appt.doctor?.specialization} · {appt.doctor?.hospital}
                </p>
                <div className="appt-datetime">
                  <span>📅 {appt.date} at {appt.timeSlot}</span>
                </div>
                <p className="appt-reason">
                  <strong>Reason:</strong> {appt.reason || 'General Consultation'}
                </p>

                {canCancel && (
                  <div className="card-actions">
                    <button
                      className="btn-cancel"
                      onClick={() => handleCancel(appt._id)}
                      disabled={cancellingId === appt._id}
                    >
                      {cancellingId === appt._id ? 'Cancelling…' : 'Cancel appointment'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ==========================================
// 4. MANAGE (Admin Only)
// ==========================================
export function Manage() {
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [msg, setMsg] = useState('');

  // Doctor creation state (Admin extension)
  const [showAddDoctor, setShowAddDoctor] = useState(false);
  const [docForm, setDocForm] = useState({
    name: '',
    specialization: '',
    hospital: '',
    experience: '',
    fee: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [appts, docs] = await Promise.all([
        api('/appointments'),
        api('/doctors')
      ]);
      setAppointments(appts);
      setDoctors(docs);
    } catch (err) {
      console.error('Error loading manage data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    setUpdatingId(id);
    setMsg('');
    try {
      await api(`/appointments/${id}/status`, 'PUT', { status: newStatus });
      setMsg(`Appointment status updated to ${newStatus}.`);
      setAppointments((prev) =>
        prev.map((a) => (a._id === id ? { ...a, status: newStatus } : a))
      );
    } catch (err) {
      setMsg(err.message || 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAddDoctor = async (e) => {
    e.preventDefault();
    try {
      await api('/doctors', 'POST', {
        ...docForm,
        experience: Number(docForm.experience) || 0,
        fee: Number(docForm.fee) || 0
      });
      setDocForm({ name: '', specialization: '', hospital: '', experience: '', fee: '' });
      setShowAddDoctor(false);
      setMsg('Doctor added successfully!');
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to add doctor');
    }
  };

  const handleDeleteDoctor = async (docId, docName) => {
    if (!window.confirm(`Delete ${docName}? This also removes their active appointments.`)) return;
    try {
      await api(`/doctors/${docId}`, 'DELETE');
      setMsg(`Doctor ${docName} deleted.`);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to delete doctor');
    }
  };

  return (
    <div className="page-container">
      <div className="page-header flex-between">
        <div>
          <h1>Manage Appointments</h1>
          <p className="muted">Review patient bookings, update consultation statuses, and administer doctors.</p>
        </div>
        <button
          className="primary small-btn"
          onClick={() => setShowAddDoctor(!showAddDoctor)}
        >
          {showAddDoctor ? 'Close Form' : '+ Add New Doctor'}
        </button>
      </div>

      {msg && <p className="success-msg">{msg}</p>}

      {/* Add Doctor Drawer (Admin Extension) */}
      {showAddDoctor && (
        <div className="card form-card">
          <h3>Add New Doctor</h3>
          <form onSubmit={handleAddDoctor} className="compact-form">
            <div className="form-row">
              <input
                placeholder="Doctor Name (e.g. Dr. Jane Doe)"
                value={docForm.name}
                onChange={(e) => setDocForm({ ...docForm, name: e.target.value })}
                required
              />
              <input
                placeholder="Specialization (e.g. Neurology)"
                value={docForm.specialization}
                onChange={(e) => setDocForm({ ...docForm, specialization: e.target.value })}
                required
              />
            </div>
            <div className="form-row">
              <input
                placeholder="Hospital / Clinic"
                value={docForm.hospital}
                onChange={(e) => setDocForm({ ...docForm, hospital: e.target.value })}
              />
              <input
                type="number"
                placeholder="Experience in years"
                value={docForm.experience}
                onChange={(e) => setDocForm({ ...docForm, experience: e.target.value })}
              />
              <input
                type="number"
                placeholder="Consultation Fee (₹)"
                value={docForm.fee}
                onChange={(e) => setDocForm({ ...docForm, fee: e.target.value })}
              />
            </div>
            <button type="submit" className="primary small-btn">Save Doctor</button>
          </form>
        </div>
      )}

      {/* Appointments Table */}
      <div className="card table-card">
        <h3>All Appointments ({appointments.length})</h3>
        {loading ? (
          <p className="muted">Loading appointments…</p>
        ) : appointments.length === 0 ? (
          <p className="muted">No appointments recorded yet.</p>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Reason</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appt) => (
                  <tr key={appt._id}>
                    <td>
                      <div className="cell-primary">{appt.patient?.name || 'Unknown Patient'}</div>
                      <div className="muted small">{appt.patient?.email}</div>
                    </td>
                    <td>
                      <div className="cell-primary">{appt.doctor?.name || 'Unknown Doctor'}</div>
                      <div className="muted small">{appt.doctor?.specialization}</div>
                    </td>
                    <td>{appt.date}</td>
                    <td>{appt.timeSlot}</td>
                    <td>
                      <span className="small">{appt.reason || '—'}</span>
                    </td>
                    <td>
                      <select
                        className={`status-select status-${appt.status}`}
                        value={appt.status}
                        disabled={updatingId === appt._id}
                        onChange={(e) => handleStatusChange(appt._id, e.target.value)}
                      >
                        <option value="Booked">Booked</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Doctor Directory Management */}
      <div className="card table-card" style={{ marginTop: '24px' }}>
        <h3>Doctor Directory ({doctors.length})</h3>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Doctor Name</th>
                <th>Specialization</th>
                <th>Hospital</th>
                <th>Experience</th>
                <th>Fee</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {doctors.map((doc) => (
                <tr key={doc._id}>
                  <td className="cell-primary">{doc.name}</td>
                  <td><span className="tag-specialization">{doc.specialization}</span></td>
                  <td>{doc.hospital || '—'}</td>
                  <td>{doc.experience} yrs</td>
                  <td>₹{doc.fee}</td>
                  <td>
                    <button
                      className="btn-danger small-btn"
                      onClick={() => handleDeleteDoctor(doc._id, doc.name)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 5. ANALYTICS (Admin Only)
// ==========================================
export function Analytics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/stats')
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const statusCounts = useMemo(() => {
    const map = {
      Booked: 0,
      Confirmed: 0,
      Completed: 0,
      Cancelled: 0
    };
    if (stats?.byStatus) {
      stats.byStatus.forEach((item) => {
        if (map[item._id] !== undefined) {
          map[item._id] = item.count;
        }
      });
    }
    return map;
  }, [stats]);

  const maxCount = useMemo(() => {
    const counts = Object.values(statusCounts);
    return Math.max(...counts, 1);
  }, [statusCounts]);

  const totalAppts = stats?.appointments || 0;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Analytics & Insights</h1>
        <p className="muted">Overview of platform adoption, appointment distribution, and consultation status breakdown.</p>
      </div>

      {loading ? (
        <p className="muted">Loading analytics data…</p>
      ) : stats ? (
        <>
          <div className="stats-row">
            <div className="card stat-card">
              <div className="stat-number">{stats.patients}</div>
              <div className="stat-label">Registered Patients</div>
            </div>
            <div className="card stat-card">
              <div className="stat-number">{stats.doctors}</div>
              <div className="stat-label">Registered Doctors</div>
            </div>
            <div className="card stat-card">
              <div className="stat-number">{stats.appointments}</div>
              <div className="stat-label">Total Bookings</div>
            </div>
          </div>

          <div className="card chart-card">
            <h3>Appointments by Status</h3>
            <p className="muted small">Distribution across booking lifecycle</p>

            <div className="progress-bars-container">
              {Object.entries(statusCounts).map(([status, count]) => {
                const percent = Math.round((count / maxCount) * 100);
                const sharePercent = totalAppts > 0 ? Math.round((count / totalAppts) * 100) : 0;
                return (
                  <div key={status} className="status-bar-row">
                    <div className="bar-label">
                      <span className={`status-badge status-${status}`}>{status}</span>
                    </div>
                    <div className="bar-track">
                      <div
                        className={`bar-fill fill-${status}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <div className="bar-val">
                      <strong>{count}</strong>
                      <span className="muted small"> ({sharePercent}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
