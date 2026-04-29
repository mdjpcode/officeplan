const API_URL = import.meta.env.VITE_APPS_SCRIPT_URL;

export async function fetchLayout(date) {
  if (!API_URL) return {};
  const res = await fetch(`${API_URL}?date=${encodeURIComponent(date)}`);
  if (!res.ok) throw new Error('Failed to fetch layout');
  return res.json();
}

export async function updateLocation(date, staff, location) {
  if (!API_URL) throw new Error('Missing VITE_APPS_SCRIPT_URL');
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date, staff, location })
  });
  if (!res.ok) throw new Error('Failed to update location');
  return res.json();
}
