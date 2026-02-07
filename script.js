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

document.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() === "r") {
    randomizeTicker();
  }

  if (event.key.toLowerCase() === "g") {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
});

renderTicker();
updateClock();
setInterval(updateClock, 1000);
if (ticker) {
  setInterval(randomizeTicker, 4500);
}
