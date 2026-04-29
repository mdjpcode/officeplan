import { useEffect, useMemo, useState } from 'react';
import { fetchLayout, updateLocation } from './api';
import { ROOMS, STAFF, START_DATE, VIRTUAL_LOCATIONS } from './config';
import './styles.css';

function toDateInputValue(date = new Date()) {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 10);
}

function isWeekday(value) {
  const d = new Date(`${value}T00:00:00`);
  const day = d.getDay();
  return day >= 1 && day <= 5;
}

function monthWeekdays(dateStr) {
  const d = new Date(`${dateStr}T00:00:00`);
  const year = d.getFullYear();
  const month = d.getMonth();
  const out = [];
  const cur = new Date(year, month, 1);
  while (cur.getMonth() === month) {
    const day = cur.getDay();
    if (day >= 1 && day <= 5) out.push(toDateInputValue(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

const ALL_LOCATIONS = [...ROOMS, ...VIRTUAL_LOCATIONS];

export default function App() {
  const [selectedDate, setSelectedDate] = useState(toDateInputValue());
  const [layout, setLayout] = useState({});
  const [monthLayouts, setMonthLayouts] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const normalizedLayout = useMemo(() => {
    const base = Object.fromEntries(ALL_LOCATIONS.map((l) => [l.name, []]));
    Object.entries(layout || {}).forEach(([location, people]) => {
      base[location] = Array.isArray(people) ? people : [];
    });
    return base;
  }, [layout]);

  const assigned = useMemo(() => new Set(Object.values(normalizedLayout).flat()), [normalizedLayout]);
  const unassignedStaff = STAFF.filter((name) => !assigned.has(name));

  useEffect(() => {
    let ignore = false;
    async function loadDay() {
      if (!isWeekday(selectedDate)) return;
      setLoading(true);
      setError('');
      try {
        const data = await fetchLayout(selectedDate);
        if (!ignore) setLayout(data.layout || {});
      } catch (err) {
        if (!ignore) setError(err.message);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    loadDay();
    return () => { ignore = true; };
  }, [selectedDate]);

  useEffect(() => {
    let ignore = false;
    async function loadMonth() {
      const days = monthWeekdays(selectedDate);
      const results = await Promise.all(
        days.map(async (date) => {
          try {
            const data = await fetchLayout(date);
            return [date, data.layout || {}];
          } catch {
            return [date, {}];
          }
        })
      );
      if (!ignore) setMonthLayouts(Object.fromEntries(results));
    }
    loadMonth();
    return () => { ignore = true; };
  }, [selectedDate]);

  async function onAssign(person, location) {
    setError('');
    try {
      const data = await updateLocation(selectedDate, person, location);
      setLayout(data.layout || {});
      setMonthLayouts((prev) => ({ ...prev, [selectedDate]: data.layout || {} }));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="container">
      <h1>Office Seating & Location Tracker</h1>
      <label className="date-row">
        Select date:
        <input type="date" value={selectedDate} min={START_DATE} onChange={(e) => isWeekday(e.target.value) && setSelectedDate(e.target.value)} />
      </label>
      {loading && <p>Loading…</p>}
      {error && <p className="error">{error}</p>}

      <section className="dashboard">
        {ALL_LOCATIONS.map((loc) => {
          const people = normalizedLayout[loc.name] || [];
          const full = typeof loc.capacity === 'number' && people.length >= loc.capacity;
          return (
            <article key={loc.name} className="card">
              <h2>{loc.name}</h2>
              <p>{loc.capacity == null ? `${people.length} assigned` : `${people.length}/${loc.capacity} seats filled`}</p>
              <select defaultValue="" disabled={full || unassignedStaff.length === 0} onChange={(e) => e.target.value && (onAssign(e.target.value, loc.name), (e.target.value = ''))}>
                <option value="">Add Person</option>
                {unassignedStaff.map((person) => <option key={person} value={person}>{person}</option>)}
              </select>
              <ul>
                {people.map((person) => <li key={person}>{person} <button type="button" onClick={() => onAssign(person, 'Unassigned')}>Remove</button></li>)}
              </ul>
            </article>
          );
        })}
      </section>

      <section className="calendar-view">
        <h2>Month Calendar View (weekday snapshots)</h2>
        <div className="calendar-grid">
          {monthWeekdays(selectedDate).map((date) => (
            <article key={date} className={`calendar-card ${date === selectedDate ? 'active' : ''}`}>
              <h3>{date}</h3>
              {ALL_LOCATIONS.map((loc) => {
                const people = (monthLayouts[date]?.[loc.name]) || [];
                return <p key={loc.name}><strong>{loc.name}:</strong> {people.length ? people.join(', ') : '—'}</p>;
              })}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
