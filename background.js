const DEFAULTS = {
  pullCount: 0,
  pushCount: 0,
  notificationsEnabled: true
};



const HOTKEYS = {
  pull: 'Ctrl + Alt + P',
  push: 'Ctrl + Alt + U'
};

function safeHost(url) {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.host}`;
  } catch {
    return '';
  }
}

function originFromEntry(entry) {
  if (typeof entry !== 'string') return '';
  const trimmed = entry.trim();
  if (!trimmed) return '';
  try {
    return new URL(trimmed).origin;
  } catch {
    try {
      return new URL(`https://${trimmed}`).origin;
    } catch {
      return '';
    }
  }
}

let allowedOriginsCache = null;

async function getAllowedOrigins() {
  if (allowedOriginsCache) return allowedOriginsCache;
  try {
    const res = await fetch(chrome.runtime.getURL('config.json'));
    const data = await res.json();
    const list = Array.isArray(data?.sites) ? data.sites : [];
    const origins = list.map(originFromEntry).filter(Boolean);
    allowedOriginsCache = origins.length
      ? origins
      : DEFAULT_SITES.map(originFromEntry).filter(Boolean);
  } catch {
    allowedOriginsCache = DEFAULT_SITES.map(originFromEntry).filter(Boolean);
  }
  return allowedOriginsCache;
}

async function isAllowedCyberPanel(url) {
  const origin = safeHost(url);
  if (!origin) return false;
  const allowedOrigins = await getAllowedOrigins();
  return allowedOrigins.includes(origin);
}

async function getState() {
  const state = await chrome.storage.local.get(DEFAULTS);
  return { ...DEFAULTS, ...state };
}

async function setBadgeFromCounts() {
  const { pullCount, pushCount } = await getState();
  const total = pullCount + pushCount;
  await chrome.action.setBadgeBackgroundColor({ color: '#2563eb' });
  await chrome.action.setBadgeText({ text: total > 0 ? String(total) : '' });
}

chrome.runtime.onInstalled.addListener(async () => {
  const state = await getState();
  await chrome.storage.local.set(state);
  await setBadgeFromCounts();
});

chrome.runtime.onStartup.addListener(setBadgeFromCounts);

chrome.tabs.onRemoved.addListener(async () => {
  await setBadgeFromCounts();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    if (!message || typeof message.type !== 'string') return sendResponse({ ok: false });

    if (message.type === 'page-opened') {
      const state = await getState();
      if (state.notificationsEnabled && sender?.tab?.url && await isAllowedCyberPanel(sender.tab.url)) {
        const tabUrl = safeHost(sender.tab.url);
        await chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon128.png',
          title: 'CyberPanel ready',
          message: `Hotkeys loaded for Pull and Push on ${tabUrl}.`
        });
      }
      return sendResponse({ ok: true });
    }

    if (message.type === 'increment-action') {
      const action = message.action === 'push' ? 'pushCount' : 'pullCount';
      const state = await getState();
      state[action] += 1;
      await chrome.storage.local.set({ [action]: state[action] });
      await setBadgeFromCounts();
      return sendResponse({ ok: true, state });
    }

    if (message.type === 'get-state') {
      return sendResponse({ ok: true, state: await getState() });
    }

    if (message.type === 'set-notifications-enabled') {
      await chrome.storage.local.set({ notificationsEnabled: !!message.enabled });
      return sendResponse({ ok: true });
    }

    if (message.type === 'reset-counts') {
      await chrome.storage.local.set({ pullCount: 0, pushCount: 0 });
      await setBadgeFromCounts();
      return sendResponse({ ok: true });
    }

    sendResponse({ ok: false });
  })();
  return true;
});
