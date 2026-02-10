const tickerData = [
  { name: "NIFTY SENT", price: 22475.85, move: 0.86 },
  { name: "Amartya EQUITY", price: 348.21, move: -0.42 },
  { name: "RUPEE INDEX", price: 83.14, move: 0.11 },
  { name: "CAMPUS ALPHA", price: 129.72, move: 1.24 },
  { name: "VOL MATRIX", price: 18.06, move: -0.67 },
  { name: "RISK PREM", price: 4.32, move: 0.29 }
];

const liveTickerData = [
  { symbol: "NIFTY 50", price: 22475.85, move: 0.86 },
  { symbol: "SENSEX", price: 74108.24, move: 0.44 },
  { symbol: "BANK NIFTY", price: 48256.62, move: -0.22 },
  { symbol: "USDINR", price: 83.14, move: 0.11 },
  { symbol: "10Y GSEC", price: 7.09, move: -0.03 },
  { symbol: "BRENT", price: 82.77, move: 0.35 },
  { symbol: "GOLD", price: 2064.5, move: -0.17 },
  { symbol: "AMARTYA EQ", price: 348.21, move: -0.42 }
];

const LIVE_TICKER_DURATION_SECONDS = 42;
const LIVE_TICKER_UPDATE_MS = 2600;
const LIVE_TICKER_START_KEY = "amartya_live_ticker_start_v1";
const LIVE_TICKER_STATE_KEY = "amartya_live_ticker_state_v1";

const ticker = document.getElementById("ticker");
const clock = document.getElementById("clock");
const router = document.querySelector("[data-router]");
const routeLinks = router ? Array.from(router.querySelectorAll(".page-link")) : [];
const routeContextName = document.getElementById("route-context-name");
const routeContextDesc = document.getElementById("route-context-desc");
const routeContextStatus = document.getElementById("route-context-status");
const routeContextKey = document.getElementById("route-context-key");
const routeBreadcrumb = document.getElementById("route-breadcrumb");

const routeShortcutMap = {
  "1": "home",
  "2": "events",
  "3": "contact"
};

let activeRouteId = null;

function readSessionValue(key) {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeSessionValue(key, value) {
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // Ignore storage errors (private mode / quota).
  }
}

function ensureLiveTickerStartTime() {
  const now = Date.now();
  const saved = Number(readSessionValue(LIVE_TICKER_START_KEY));
  if (Number.isFinite(saved) && saved > 0) return saved;

  writeSessionValue(LIVE_TICKER_START_KEY, String(now));
  return now;
}

function restoreLiveTickerState() {
  const raw = readSessionValue(LIVE_TICKER_STATE_KEY);
  if (!raw) return;

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return;
  }

  if (!Array.isArray(parsed)) return;

  const map = Object.fromEntries(
    parsed
      .filter((item) => item && typeof item.symbol === "string")
      .map((item) => [item.symbol, item])
  );

  liveTickerData.forEach((item) => {
    const saved = map[item.symbol];
    if (!saved) return;

    const nextPrice = Number(saved.price);
    const nextMove = Number(saved.move);
    if (Number.isFinite(nextPrice)) item.price = Math.max(0.5, nextPrice);
    if (Number.isFinite(nextMove)) item.move = nextMove;
  });
}

function persistLiveTickerState() {
  const payload = liveTickerData.map((item) => ({
    symbol: item.symbol,
    price: Number(item.price.toFixed(4)),
    move: Number(item.move.toFixed(4))
  }));
  writeSessionValue(LIVE_TICKER_STATE_KEY, JSON.stringify(payload));
}

function setupLiveTicker() {
  if (document.getElementById("global-live-ticker")) return;

  const strip = document.createElement("section");
  strip.className = "global-ticker";
  strip.id = "global-live-ticker";
  strip.innerHTML = `
    <span class="global-ticker-label">LIVE TICKER</span>
    <div class="global-ticker-viewport">
      <div class="global-ticker-track" id="global-ticker-track"></div>
    </div>
  `;

  document.body.appendChild(strip);
  renderLiveTickerTrack();
  applyLiveTickerPhase();
}

function formatLivePrice(value) {
  return value >= 1000 ? value.toFixed(2) : value.toFixed(2);
}

function buildLiveTickerItem(item) {
  const moveClass = item.move >= 0 ? "up" : "down";
  const sign = item.move >= 0 ? "+" : "-";

  return `
    <article class="global-ticker-item" data-symbol="${item.symbol}">
      <span class="global-ticker-symbol">${item.symbol}</span>
      <span class="global-ticker-price">${formatLivePrice(item.price)}</span>
      <span class="global-ticker-move ${moveClass}">${sign}${Math.abs(item.move).toFixed(2)}%</span>
    </article>
  `;
}

function renderLiveTickerTrack() {
  const track = document.getElementById("global-ticker-track");
  if (!track) return;

  const sequence = liveTickerData.map(buildLiveTickerItem).join("");
  track.innerHTML = `
    <div class="global-ticker-group">${sequence}</div>
    <div class="global-ticker-group" aria-hidden="true">${sequence}</div>
  `;
}

function applyLiveTickerPhase() {
  const track = document.getElementById("global-ticker-track");
  if (!track) return;

  const startTime = ensureLiveTickerStartTime();
  const elapsedSeconds = (Date.now() - startTime) / 1000;
  const phaseSeconds =
    ((elapsedSeconds % LIVE_TICKER_DURATION_SECONDS) + LIVE_TICKER_DURATION_SECONDS) %
    LIVE_TICKER_DURATION_SECONDS;

  track.style.animationDuration = `${LIVE_TICKER_DURATION_SECONDS}s`;
  track.style.animationDelay = `-${phaseSeconds.toFixed(3)}s`;
}

function randomizeLiveTicker() {
  liveTickerData.forEach((item) => {
    const drift = (Math.random() - 0.5) * 0.9;
    item.move = drift;
    item.price += (Math.random() - 0.5) * (item.price * 0.0022);
    if (item.price < 0.5) item.price = 0.5;
  });

  const itemNodes = document.querySelectorAll(".global-ticker-item");
  if (!itemNodes.length) return;

  const dataBySymbol = Object.fromEntries(liveTickerData.map((item) => [item.symbol, item]));
  itemNodes.forEach((node) => {
    const item = dataBySymbol[node.dataset.symbol];
    if (!item) return;

    const priceNode = node.querySelector(".global-ticker-price");
    const moveNode = node.querySelector(".global-ticker-move");
    if (!priceNode || !moveNode) return;

    const moveClass = item.move >= 0 ? "up" : "down";
    const sign = item.move >= 0 ? "+" : "-";

    priceNode.textContent = formatLivePrice(item.price);
    moveNode.className = `global-ticker-move ${moveClass}`;
    moveNode.textContent = `${sign}${Math.abs(item.move).toFixed(2)}%`;
  });

  persistLiveTickerState();
}

function renderTicker() {
  if (!ticker) return;
  ticker.innerHTML = "";

  tickerData.forEach((item) => {
    const moveClass = item.move >= 0 ? "up" : "down";
    const arrow = item.move >= 0 ? "▲" : "▼";

    const card = document.createElement("div");
    card.className = "ticker-item";
    card.innerHTML = `
      <div class="name">${item.name}</div>
      <div class="price">${item.price.toFixed(2)}</div>
      <div class="move ${moveClass}">${arrow} ${Math.abs(item.move).toFixed(2)}%</div>
    `;

    ticker.appendChild(card);
  });
}

function randomizeTicker() {
  if (!ticker) return;
  tickerData.forEach((item) => {
    const drift = (Math.random() - 0.5) * 1.6;
    item.move = drift;
    item.price += (Math.random() - 0.5) * (item.price * 0.005);
  });
  renderTicker();
}

function updateClock() {
  if (!clock) return;

  const now = new Date();
  const time = now.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });
  const date = now.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });

  clock.textContent = `${date} | ${time} IST`;
}

function isTypingTarget(target) {
  if (!target) return false;

  const tagName = target.tagName;
  return (
    tagName === "INPUT" ||
    tagName === "TEXTAREA" ||
    tagName === "SELECT" ||
    target.isContentEditable
  );
}

function updateRouteContext(link) {
  if (!link || !routeContextName || !routeContextDesc || !routeContextStatus || !routeContextKey) return;

  const routeName = link.querySelector(".route-name") ? link.querySelector(".route-name").textContent.trim() : link.dataset.route;
  const routeDesc = link.dataset.desc || "";
  const routeKey = link.dataset.key || "-";
  const routeState = link.classList.contains("active") ? "ACTIVE" : (link.dataset.state || "LIVE");

  routeContextName.textContent = routeName;
  routeContextDesc.textContent = routeDesc;
  routeContextStatus.textContent = routeState;
  routeContextStatus.dataset.state = routeState;
  routeContextKey.textContent = `[${routeKey}]`;
}

function syncRouteBadges() {
  if (!routeLinks.length) return;

  routeLinks.forEach((link) => {
    const badge = link.querySelector(".route-badge");
    if (!badge) return;
    badge.textContent = link.classList.contains("active") ? "ACTIVE" : (link.dataset.state || "LIVE");
  });
}

function setBreadcrumb(link) {
  if (!link || !routeBreadcrumb) return;

  const crumb = link.dataset.breadcrumb || (link.dataset.route || "HOME").toUpperCase();
  routeBreadcrumb.textContent = `Amartya // ${crumb}`;
}

function setActiveRoute(routeId) {
  if (!routeLinks.length) return;

  const nextActive = routeLinks.find((link) => link.dataset.route === routeId);
  if (!nextActive) return;

  routeLinks.forEach((link) => {
    link.classList.remove("active");
    link.removeAttribute("aria-current");
  });

  nextActive.classList.add("active");
  nextActive.setAttribute("aria-current", "page");
  activeRouteId = routeId;

  syncRouteBadges();
  updateRouteContext(nextActive);
  setBreadcrumb(nextActive);
}

function restoreActiveRouteContext() {
  if (!activeRouteId) return;

  const activeLink = routeLinks.find((link) => link.dataset.route === activeRouteId);
  if (activeLink) {
    updateRouteContext(activeLink);
  }
}

function navigateToRoute(routeId) {
  const target = routeLinks.find((link) => link.dataset.route === routeId);
  if (!target) return;

  const href = target.getAttribute("href") || "";
  if (!href) return;

  if (href.startsWith("#")) {
    const destination = document.querySelector(href);
    if (destination) {
      destination.scrollIntoView({ behavior: "smooth", block: "start" });
      if (window.history && window.history.replaceState) {
        window.history.replaceState(null, "", href);
      }
      setActiveRoute(routeId);
    }
    return;
  }

  const normalizedHref = href.replace(/\/$/, "");
  const normalizedPath = window.location.pathname.replace(/\/$/, "");

  if (
    (normalizedHref.endsWith("index.html") && normalizedPath.endsWith("index.html")) ||
    (normalizedHref === "index.html" && normalizedPath === "")
  ) {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setActiveRoute("home");
    return;
  }

  window.location.href = href;
}

function setupRouter() {
  if (!router || !routeLinks.length) return;

  const initiallyActive = routeLinks.find((link) => link.classList.contains("active")) || routeLinks[0];
  if (initiallyActive) {
    setActiveRoute(initiallyActive.dataset.route);
  }

  routeLinks.forEach((link) => {
    link.addEventListener("mouseenter", () => updateRouteContext(link));
    link.addEventListener("focus", () => updateRouteContext(link));
  });

  router.addEventListener("mouseleave", restoreActiveRouteContext);
  router.addEventListener("focusout", () => {
    window.requestAnimationFrame(() => {
      if (!router.contains(document.activeElement)) {
        restoreActiveRouteContext();
      }
    });
  });
}

document.addEventListener("keydown", (event) => {
  if (isTypingTarget(event.target)) return;

  const key = event.key.toLowerCase();

  if (key === "g") {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  if (key === "m") {
    event.preventDefault();
    randomizeTicker();
    randomizeLiveTicker();
    return;
  }

  const routeTarget = routeShortcutMap[key];
  if (routeTarget) {
    event.preventDefault();
    navigateToRoute(routeTarget);
  }
});

restoreLiveTickerState();
ensureLiveTickerStartTime();
persistLiveTickerState();
setupLiveTicker();
renderTicker();
updateClock();
setupRouter();

if (clock) {
  setInterval(updateClock, 1000);
}

if (ticker) {
  setInterval(randomizeTicker, 4500);
}

setInterval(randomizeLiveTicker, LIVE_TICKER_UPDATE_MS);
