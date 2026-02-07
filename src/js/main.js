const tickerData = [
  { name: "NIFTY SENT", price: 22475.85, move: 0.86 },
  { name: "AFS EQUITY", price: 348.21, move: -0.42 },
  { name: "RUPEE INDEX", price: 83.14, move: 0.11 },
  { name: "CAMPUS ALPHA", price: 129.72, move: 1.24 },
  { name: "VOL MATRIX", price: 18.06, move: -0.67 },
  { name: "RISK PREM", price: 4.32, move: 0.29 }
];

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
  "3": "resources",
  "4": "contact"
};

let activeRouteId = null;

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
  routeBreadcrumb.textContent = `AFS // ${crumb}`;
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
    return;
  }

  const routeTarget = routeShortcutMap[key];
  if (routeTarget) {
    event.preventDefault();
    navigateToRoute(routeTarget);
  }
});

renderTicker();
updateClock();
setupRouter();

if (clock) {
  setInterval(updateClock, 1000);
}

if (ticker) {
  setInterval(randomizeTicker, 4500);
}
