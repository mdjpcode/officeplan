const API_URL = import.meta.env.VITE_APPS_SCRIPT_URL;

export async function fetchLayout(date) {
  if (!API_URL) return { layout: {} };
  const res = await fetch(`${API_URL}?date=${encodeURIComponent(date)}`);
  if (!res.ok) throw new Error(`Failed to fetch layout (${res.status})`);
  return res.json();
}

export async function updateLocation(date, staff, location) {
  if (!API_URL) throw new Error('Missing VITE_APPS_SCRIPT_URL');

  // Send as form data to avoid CORS preflight issues with Apps Script web apps.
  const body = new URLSearchParams({
    payload: JSON.stringify({ date, staff, location })
  }).toString();

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
    body
  });

  if (!res.ok) throw new Error(`Failed to update location (${res.status})`);
  return res.json();
}
