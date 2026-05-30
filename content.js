(() => {
  if (window.__cyberpanelGitHotkeysInstalled) return;
  window.__cyberpanelGitHotkeysInstalled = true;

  const HOTKEYS = {
    pull: { ctrlKey: true, altKey: false, shiftKey: false, key: 'q' },
    push: { ctrlKey: true, altKey: true, shiftKey: false, key: 'u' }
  };


  let allowedHosts = new Set(
    DEFAULT_SITES.map((entry) => {
      try {
        return new URL(entry).host;
      } catch {
        return '';
      }
    }).filter(Boolean)
  );

  const SELECTORS = {
    pull: 'a[ng-click="gitPull()"]',
    push: 'a[ng-click="gitPush()"]'
  };

  const state = {
    notified: false,
    readyShown: false
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

  async function loadConfigHosts() {
    try {
      const res = await fetch(chrome.runtime.getURL('config.json'));
      const data = await res.json();
      const list = Array.isArray(data?.sites) ? data.sites : [];
      const hosts = list.map(hostFromEntry).filter(Boolean);
      if (hosts.length) allowedHosts = new Set(hosts);
    } catch {
      // Ignore and keep defaults.
    }
  }

  function isAllowedPage() {
    return allowedHosts.has(location.host);
  }

  function matchesShortcut(event, combo) {
    return !!event.ctrlKey === combo.ctrlKey &&
      !!event.altKey === combo.altKey &&
      !!event.shiftKey === combo.shiftKey &&
      event.key.toLowerCase() === combo.key;
  }

  function isTypingTarget(el) {
    if (!el) return false;
    const tag = el.tagName ? el.tagName.toLowerCase() : '';
    return el.isContentEditable || ['input', 'textarea', 'select'].includes(tag);
  }

  function toast(message) {
    let box = document.getElementById('cyberpanel-git-hotkeys-toast');
    if (!box) {
      box = document.createElement('div');
      box.id = 'cyberpanel-git-hotkeys-toast';
      box.style.cssText = [
        'position:fixed',
        'z-index:2147483647',
        'right:18px',
        'bottom:18px',
        'padding:10px 14px',
        'border-radius:12px',
        'background:rgba(15,23,42,.96)',
        'color:#fff',
        'font:13px/1.4 system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif',
        'box-shadow:0 10px 30px rgba(0,0,0,.25)',
        'backdrop-filter:blur(8px)',
        'opacity:0',
        'transform:translateY(8px)',
        'transition:opacity .18s ease, transform .18s ease',
        'pointer-events:none'
      ].join(';');
      document.documentElement.appendChild(box);
    }
    box.textContent = message;
    box.style.opacity = '1';
    box.style.transform = 'translateY(0)';
    clearTimeout(box.__hideTimer);
    box.__hideTimer = setTimeout(() => {
      box.style.opacity = '0';
      box.style.transform = 'translateY(8px)';
    }, 1600);
  }

  function postMessage(message) {
    chrome.runtime.sendMessage(message).catch(() => {});
  }

  function clickAction(action) {
    const selector = SELECTORS[action];
    const btn = document.querySelector(selector);
    if (!btn) {
      toast(`CyberPanel ${action} button not found`);
      return;
    }
    btn.click();
    postMessage({ type: 'increment-action', action });
    toast(`${action.charAt(0).toUpperCase() + action.slice(1)} triggered`);
  }

  function handleKeydown(event) {
    if (!isAllowedPage()) return;
    if (isTypingTarget(event.target)) return;

    if (matchesShortcut(event, HOTKEYS.pull)) {
      event.preventDefault();
      event.stopPropagation();
      clickAction('pull');
      return;
    }

    if (matchesShortcut(event, HOTKEYS.push)) {
      event.preventDefault();
      event.stopPropagation();
      clickAction('push');
    }
  }

  function attachManualClickCounters() {
    document.addEventListener('click', (event) => {
      const target = event.target?.closest?.(`${SELECTORS.pull}, ${SELECTORS.push}`);
      if (!target || !event.isTrusted) return;
      const action = target.matches(SELECTORS.pull) ? 'pull' : 'push';
      postMessage({ type: 'increment-action', action });
    }, true);
  }

  function showReadyNotice() {
    if (state.readyShown) return;
    state.readyShown = true;
    toast('CyberPanel hotkeys ready: Pull Ctrl+Alt+P, Push Ctrl+Alt+U');
  }

  async function init() {
    await loadConfigHosts();
    if (!isAllowedPage()) return;

    document.addEventListener('keydown', handleKeydown, true);
    attachManualClickCounters();
    showReadyNotice();

    if (!state.notified) {
      state.notified = true;
      postMessage({ type: 'page-opened', url: location.href });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      init().catch(() => {});
    }, { once: true });
  } else {
    init().catch(() => {});
  }
})();
