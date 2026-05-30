<div align="center">
  <img src="./icons/icon128.png" alt="CyberPanel Git Hotkeys Logo" width="120" height="120" />

# CyberPanel Git Hotkeys

**Chrome extension for faster CyberPanel Git Pull/Push actions with keyboard shortcuts, counters, and notifications.**

![Version](https://img.shields.io/badge/version-1.1.0-2563eb)
![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-0ea5e9)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-22c55e)
![JavaScript](https://img.shields.io/badge/Built%20With-JavaScript-f59e0b)
</div>

## What this is
CyberPanel Git Hotkeys is a lightweight browser extension that adds quick keyboard automation to CyberPanel Git pages. It can trigger Git Pull and Git Push actions, track usage counts, and show extension status in a popup dashboard.

## Why this project exists
Managing Git operations through repetitive clicks in CyberPanel can slow down deployment workflows. This extension is made to reduce friction by turning frequent actions into fast shortcuts and giving clear visibility into usage.

## Advantages
- Faster Git operations on supported CyberPanel pages
- Reduced repetitive clicking and operator fatigue
- Visual counters for Pull/Push usage
- Optional system notifications when a panel is ready
- Easy host allowlist control using `config.json`

## Core features
- Keyboard hotkeys for Git Pull and Git Push
- Automatic click support for CyberPanel action buttons
- Popup dashboard with status chip and live counters
- Browser action badge showing total action count
- Notification toggle and counter reset controls
- Configurable supported sites via `config.json`

## How it works
1. `content.js` loads on pages and checks whether the current host is allowed.
2. If allowed, it binds keyboard listeners and click listeners for CyberPanel Git buttons.
3. When Pull/Push is triggered, it sends messages to `background.js`.
4. `background.js` updates `chrome.storage.local`, badge count, and notifications.
5. `popup.js` reads extension state and displays status, counters, and configured sites.

## Hotkeys and actions
| Action | Current Shortcut (code) | Target CyberPanel Selector | Result |
|---|---|---|---|
| Pull | `Ctrl + Q` | `a[ng-click="gitPull()"]` | Clicks Pull button and increments pull counter |
| Push | `Ctrl + Alt + U` | `a[ng-click="gitPush()"]` | Clicks Push button and increments push counter |

## Configuration
Edit `config.json`:

```json
{
  "sites": [
    "https://your-cyberpanel-host:8090"
  ]
}
```

- Add full URLs or hostnames for supported CyberPanel instances.
- If `sites` is empty, the extension falls back to internal default sites.

## Popup controls
| Control | Purpose |
|---|---|
| Refresh status | Reloads popup state and site list |
| Reset counters | Sets pull/push counts back to zero |
| Notifications toggle | Enables/disables panel-ready system notifications |

## Function reference (all core functions)

### `content.js`
| Function | What it is for | How it works |
|---|---|---|
| `hostFromEntry(entry)` | Normalize config host values | Parses entry as URL (or with `https://` fallback) and returns host |
| `loadConfigHosts()` | Load supported hosts | Reads `config.json`, converts `sites` to hosts, updates allowlist set |
| `isAllowedPage()` | Restrict runtime behavior | Returns true only when `location.host` is in allowlist |
| `matchesShortcut(event, combo)` | Match key combinations | Compares ctrl/alt/shift/key values against shortcut definition |
| `isTypingTarget(el)` | Prevent shortcut conflicts | Skips shortcut handling in input, textarea, select, editable areas |
| `toast(message)` | Show in-page feedback | Creates/reuses floating toast element and auto-hides it |
| `postMessage(message)` | Communicate with background worker | Sends runtime message to `background.js` and ignores errors |
| `clickAction(action)` | Trigger Pull/Push action | Finds selector, clicks element, updates counters, shows toast |
| `handleKeydown(event)` | Keyboard event entry point | Guards allowed page + typing target, then routes pull/push shortcut |
| `attachManualClickCounters()` | Count manual button clicks | Captures trusted click events on pull/push selectors and increments counters |
| `showReadyNotice()` | Notify extension readiness once | Shows one-time toast that hotkeys are active |
| `init()` | Initialize content script behavior | Loads config hosts, binds listeners, sends page-opened signal |

### `background.js`
| Function | What it is for | How it works |
|---|---|---|
| `safeHost(url)` | Safely derive origin-like value | Parses URL and returns `protocol//host`, else empty string |
| `originFromEntry(entry)` | Normalize config origins | Parses config entry as origin, with `https://` fallback |
| `getAllowedOrigins()` | Build allowed origin cache | Reads `config.json` once, caches origins, falls back to defaults |
| `isAllowedCyberPanel(url)` | Validate notification target | Checks sender tab origin against cached allowlist |
| `getState()` | Read extension state | Returns merged defaults + persisted `chrome.storage.local` state |
| `setBadgeFromCounts()` | Keep badge in sync | Reads counters, sets badge color and total count text |

### `popup.js`
| Function | What it is for | How it works |
|---|---|---|
| `hostFromEntry(entry)` | Normalize site entries for UI | Parses entry and returns host for display list |
| `loadConfigSites()` | Load configured sites | Reads `config.json`, returns `sites`, falls back to defaults |
| `renderSites(entries)` | Render active-site cards | Builds host rows with status tags in popup list |
| `setStatus(text, tone)` | Update popup status chip | Writes text and visual tone (`active/loading/warn/danger`) |
| `setNotificationsState(enabled)` | Show notification state text | Writes `On`/`Off` near toggle section |
| `render(state)` | Paint popup counters + toggles | Updates pull/push counts and notification controls |
| `loadState()` | Fetch runtime state | Requests `get-state` from background and updates status/result |
| `loadSites()` | Fetch and show configured sites | Loads site list then calls renderer |
| `refreshAll()` | Refresh popup data in one call | Runs state and site loading concurrently |

## Message protocol summary
| Message type | Sent from | Handled by | Purpose |
|---|---|---|---|
| `page-opened` | `content.js` | `background.js` | Trigger optional "CyberPanel ready" system notification |
| `increment-action` | `content.js` | `background.js` | Increment pull/push counters and update badge |
| `get-state` | `popup.js` | `background.js` | Fetch latest counters and notification setting |
| `set-notifications-enabled` | `popup.js` | `background.js` | Persist notification toggle state |
| `reset-counts` | `popup.js` | `background.js` | Reset both counters and refresh badge |

## Install and use
1. Open Chrome and go to `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked** and select this repository folder.
4. Update `config.json` with your CyberPanel URLs.
5. Open a supported CyberPanel Git page and use the hotkeys.

## SEO keywords
CyberPanel Git hotkeys, CyberPanel Git Pull shortcut, CyberPanel Git Push shortcut, Chrome extension for CyberPanel, CyberPanel deployment workflow automation, CyberPanel productivity extension.
