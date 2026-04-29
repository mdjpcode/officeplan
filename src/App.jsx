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

const ALL_LOCATIONS = [...ROOMS, ...VIRTUAL_LOCATIONS];

export default function App() {
  const [selectedDate, setSelectedDate] = useState(toDateInputValue());
  const [layout, setLayout] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const normalizedLayout = useMemo(() => {
    const base = Object.fromEntries(ALL_LOCATIONS.map((l) => [l.name, []]));
    Object.entries(layout || {}).forEach(([location, people]) => {
      base[location] = Array.isArray(people) ? people : [];
    });
    return base;
  }, [layout]);

  const assigned = useMemo(
    () => new Set(Object.values(normalizedLayout).flat()),
    [normalizedLayout]
  );
  const unassignedStaff = STAFF.filter((name) => !assigned.has(name));

  useEffect(() => {
    let ignore = false;
    async function load() {
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
    load();
    return () => {
      ignore = true;
    };
  }, [selectedDate]);

  async function onAssign(person, location) {
    setError('');
    try {
      const data = await updateLocation(selectedDate, person, location);
      setLayout(data.layout || {});
    } catch (err) {
      setError(err.message);
    }
  }

  function handleDateChange(e) {
    const next = e.target.value;
    if (!isWeekday(next)) return;
    setSelectedDate(next);
  }

  return (
    <main className="container">
      <h1>Office Seating & Location Tracker</h1>
      <p className="helper">Working days only (Mon–Fri). Data starts on {START_DATE}.</p>

      <label className="date-row">
        Select date:
        <input
          type="date"
          value={selectedDate}
          min={START_DATE}
          onChange={handleDateChange}
        />
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
              <p>
                {loc.capacity == null
                  ? `${people.length} assigned`
                  : `${people.length}/${loc.capacity} seats filled`}
              </p>

              <div className="assign-row">
                <select
                  defaultValue=""
                  disabled={full || unassignedStaff.length === 0}
                  onChange={(e) => {
                    if (e.target.value) {
                      onAssign(e.target.value, loc.name);
                      e.target.value = '';
                    }
                  }}
                >
                  <option value="">Add Person</option>
                  {unassignedStaff.map((person) => (
                    <option key={person} value={person}>{person}</option>
                  ))}
                </select>
              </div>

              {people.length > 0 ? (
                <ul>
                  {people.map((person) => (
                    <li key={person}>
                      {person}
                      <button type="button" onClick={() => onAssign(person, 'Unassigned')}>
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted">No one assigned.</p>
              )}
            </article>
          );
        })}
      </section>
    </main>
  );
}
