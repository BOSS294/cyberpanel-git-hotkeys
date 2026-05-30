const els = {
  statusChip: document.getElementById('statusChip'),
  statusText: document.getElementById('statusText'),
  siteList: document.getElementById('siteList'),
  pullCount: document.getElementById('pullCount'),
  pushCount: document.getElementById('pushCount'),
  notificationsToggle: document.getElementById('notificationsToggle'),
  notificationsState: document.getElementById('notificationsState'),
  refreshBtn: document.getElementById('refreshBtn'),
  resetBtn: document.getElementById('resetBtn')
};


function hostFromEntry(entry) {
  if (typeof entry !== 'string') return '';
  const trimmed = entry.trim();
  if (!trimmed) return '';
  try {
    return new URL(trimmed).host;
  } catch {
    try {
      return new URL(`https://${trimmed}`).host;
    } catch {
      return '';
    }
  }
}

async function loadConfigSites() {
  try {
    const res = await fetch(chrome.runtime.getURL('config.json'));
    const data = await res.json();
    if (Array.isArray(data?.sites) && data.sites.length) return data.sites;
  } catch {
    // Ignore and fall back to defaults.
  }
  return DEFAULT_SITES;
}

function renderSites(entries) {
  if (!els.siteList) return;
  els.siteList.innerHTML = '';
  const hosts = entries.map(hostFromEntry).filter(Boolean);
  if (!hosts.length) {
    const empty = document.createElement('div');
    empty.className = 'site-empty';
    empty.textContent = 'No sites configured. Update config.json.';
    els.siteList.appendChild(empty);
    return;
  }

  hosts.forEach((host) => {
    const item = document.createElement('div');
    item.className = 'site-item';

    const dot = document.createElement('span');
    dot.className = 'site-dot';
    dot.setAttribute('aria-hidden', 'true');

    const hostText = document.createElement('span');
    hostText.className = 'site-host';
    hostText.textContent = host;

    const tag = document.createElement('span');
    tag.className = 'site-tag';
    tag.textContent = 'Enabled';

    item.append(dot, hostText, tag);
    els.siteList.appendChild(item);
  });
}

function setStatus(text, tone = 'active') {
  if (els.statusText) {
    els.statusText.textContent = text;
  } else {
    els.statusChip.textContent = text;
  }
  els.statusChip.dataset.state = tone;
}

function setNotificationsState(enabled) {
  if (els.notificationsState) {
    els.notificationsState.textContent = enabled ? 'On' : 'Off';
  }
}

function render(state) {
  els.pullCount.textContent = String(state.pullCount ?? 0);
  els.pushCount.textContent = String(state.pushCount ?? 0);
  els.notificationsToggle.checked = !!state.notificationsEnabled;
  setNotificationsState(!!state.notificationsEnabled);
  setStatus('Ready', 'active');
}

async function loadState() {
  setStatus('Syncing', 'loading');
  const res = await chrome.runtime.sendMessage({ type: 'get-state' });
  if (res?.ok) render(res.state);
  else setStatus('Unavailable', 'warn');
}

async function loadSites() {
  const sites = await loadConfigSites();
  renderSites(sites);
}

async function refreshAll() {
  await Promise.all([loadState(), loadSites()]);
}

els.notificationsToggle.addEventListener('change', async () => {
  const enabled = els.notificationsToggle.checked;
  await chrome.runtime.sendMessage({ type: 'set-notifications-enabled', enabled });
  setNotificationsState(enabled);
  setStatus('Ready', 'active');
});

els.refreshBtn.addEventListener('click', refreshAll);

els.resetBtn.addEventListener('click', async () => {
  setStatus('Resetting', 'loading');
  await chrome.runtime.sendMessage({ type: 'reset-counts' });
  await loadState();
});

refreshAll().catch(() => setStatus('Error', 'danger'));
