const BASE = '/api';

// ── auth helper ───────────────────────────────────────────────────────────────
const getToken = () => localStorage.getItem('loanxai_token') || '';
const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${getToken()}`,
});

// ── INR ↔ NT$ conversion ──────────────────────────────────────────────────────
// Model was trained on UCI Taiwan credit data (NT$). UI shows Indian Rupees (₹).
// Conversion: 1 NT$ ≈ ₹2.7  →  1 ₹ = 1/2.7 NT$
const NTD_PER_INR = 1 / 2.7;
export const INR_TO_NTD = NTD_PER_INR;
export const NTD_TO_INR = 2.7;

const MONETARY_FIELDS = [
  'LIMIT_BAL',
  'BILL_AMT1', 'BILL_AMT2', 'BILL_AMT3', 'BILL_AMT4', 'BILL_AMT5', 'BILL_AMT6',
  'PAY_AMT1', 'PAY_AMT2', 'PAY_AMT3', 'PAY_AMT4', 'PAY_AMT5', 'PAY_AMT6',
];

export const convertInrToNtd = (data) => {
  const out = { ...data };
  MONETARY_FIELDS.forEach(f => {
    if (out[f] !== undefined && out[f] !== '') {
      out[f] = Math.round(parseFloat(out[f]) * NTD_PER_INR);
    }
  });
  return out;
};

export const fmtINR = (ntdValue) =>
  `₹${Math.round(ntdValue * 2.7).toLocaleString('en-IN')}`;

// ── Auth ──────────────────────────────────────────────────────────────────────
export const registerUser = async (data) => {
  const res = await fetch(`${BASE}/auth/register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
};

export const loginUser = async (data) => {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
};

export const logoutUser = async () => {
  await fetch(`${BASE}/auth/logout`, {
    method: 'POST', headers: authHeaders(),
  });
};

export const getMe = async () => {
  const res = await fetch(`${BASE}/auth/me`, { headers: authHeaders() });
  return res.json();
};

// ── Predict (converts ₹→NT$ automatically) ───────────────────────────────────
export const predictLoan = async (data) => {
  const payload = convertInrToNtd(data); // ₹ → NT$ before model
  const res = await fetch(`${BASE}/predict`, {
    method: 'POST', headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (res.status === 401) throw new Error('UNAUTHORIZED');
  if (res.status === 403) {
    const body = await res.json();
    const err = new Error(body.error || 'Limit reached');
    err.limitReached = body.limit_reached || false;
    err.currentPlan = body.current_plan || 'free';
    err.used = body.used || 0;
    err.limit = body.limit || 0;
    throw err;
  }
  if (!res.ok) throw new Error('Prediction failed');
  return res.json();
};

// ── Feature Importance ────────────────────────────────────────────────────────
export const getFeatureImportance = async () => {
  const res = await fetch(`${BASE}/feature-importance`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch feature importance');
  return res.json();
};

// ── Metrics ───────────────────────────────────────────────────────────────────
export const getMetrics = async () => {
  const res = await fetch(`${BASE}/metrics`);
  return res.json();
};

// ── History ───────────────────────────────────────────────────────────────────
export const getHistory = async (searchName = '') => {
  const url = searchName
    ? `${BASE}/history?name=${encodeURIComponent(searchName)}`
    : `${BASE}/history`;
  const res = await fetch(url, { headers: authHeaders() });
  return res.json();
};

export const deletePrediction = async (id) => {
  const res = await fetch(`${BASE}/history/${id}`, {
    method: 'DELETE', headers: authHeaders(),
  });
  return res.json();
};

// ── PDF Report (Starter+ plan required) ──────────────────────────────────────
export const downloadReport = async (data) => {
  const res = await fetch(`${BASE}/download-report`, {
    method: 'POST', headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (res.status === 401) throw new Error('UNAUTHORIZED');
  if (res.status === 403) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.error || 'PDF reports require Starter plan or higher.');
    err.planRequired = body.plan_required || 'starter';
    err.upgradeUrl = body.upgrade_url || '/pricing';
    throw err;
  }
  if (!res.ok) throw new Error('Report generation failed');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const cd = res.headers.get('Content-Disposition') || '';
  const fn = cd.match(/filename="?([^"]+)"?/)?.[1] || 'LoanXAI_Report.pdf';
  a.download = fn;
  a.click();
  URL.revokeObjectURL(url);
};

// ── CSV Export (Professional+ plan required) ──────────────────────────────────
export const userExportCsv = async () => {
  const res = await fetch(`${BASE}/history/export-csv`, { headers: authHeaders() });
  if (res.status === 403) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.error || 'CSV export requires Professional plan or higher.');
    err.planRequired = body.plan_required || 'professional';
    throw err;
  }
  if (!res.ok) throw new Error('CSV export failed');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `my_predictions_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

// ── Add-on: 500 extra predictions ─────────────────────────────────────────────
export const activatePredictionAddon = async () => {
  const res = await fetch(`${BASE}/subscription/add-predictions`, {
    method: 'POST', headers: authHeaders(),
  });
  return res.json();
};

// ── Admin ──────────────────────────────────────────────────────────────────────
export const getAdminStats = async () => {
  const res = await fetch(`${BASE}/admin/stats`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Admin access denied');
  return res.json();
};

export const getAdminUsers = async () => {
  const res = await fetch(`${BASE}/admin/users`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Admin access denied');
  return res.json();
};

export const getAdminPredictions = async (search = '') => {
  const url = search
    ? `${BASE}/admin/predictions?q=${encodeURIComponent(search)}`
    : `${BASE}/admin/predictions`;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) throw new Error('Admin access denied');
  return res.json();
};