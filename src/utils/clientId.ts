const CLIENT_ID_KEY = "healthlens_client_id_v1";

function generateClientId(): string {
  return `client_${Math.random().toString(36).slice(2)}_${Date.now()}`;
}

export function getClientId(): string {
  const existing = localStorage.getItem(CLIENT_ID_KEY);
  if (existing) return existing;

  const created = generateClientId();
  localStorage.setItem(CLIENT_ID_KEY, created);
  return created;
}