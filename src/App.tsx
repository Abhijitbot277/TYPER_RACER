import { useEffect, useMemo, useState } from "react";

type Car = { id: number; name: string; color: string; price: number; speed: number };
type Save = { coins: number; xp: number; wins: number; selected: number; owned: number[]; upgrades: Record<number, number> };

const CARS: Car[] = [
  { id: 0, name: "Starter GT", color: "#22d3ee", price: 0, speed: 1 },
  { id: 1, name: "Street V8", color: "#a78bfa", price: 180, speed: 1.06 },
  { id: 2, name: "Neon RS", color: "#84cc16", price: 360, speed: 1.12 },
  { id: 3, name: "Apex X", color: "#fb7185", price: 650, speed: 1.19 },
  { id: 4, name: "Hyper R", color: "#f59e0b", price: 1000, speed: 1.27 },
];

const TEXTS = [
  "Speed is nothing without control. Type cleanly, stay focused, and push your limits.",
  "Every keystroke moves the car forward. Accuracy keeps your run alive and your engine fast.",
  "The road rewards rhythm. Keep your hands relaxed, watch the next word, and never panic.",
  "Fast drivers do not chase every mistake. They recover quickly and keep moving toward the finish.",
  "Precision beats frantic typing. Build a steady pace, protect your accuracy, and finish strong.",
];

const defaultSave: Save = { coins: 0, xp: 0, wins: 0, selected: 0, owned: [0], upgrades: {} };

function loadSave(): Save {
  try { return { ...defaultSave, ...JSON.parse(localStorage.getItem("typer-racer-save") || "{}") }; }
  catch { return defaultSave; }
}

function CarVisual({ car, small = false }: { car: Car; small?: boolean }) {
  return <div className={small ? "car car-small" : "car"} style={{ "--car": car.color } as React.CSSProperties}>
    <div className="car-glow" /><div className="car-roof" /><div className="car-body"><span>{car.id === 4 ? "R" : "GT"}</span></div>
    <i className="wheel wheel-a" /><i className="wheel wheel-b" />
  </div>;
}

export default function App() {
  const [save, setSave] = useState<Save>(loadSave);
  const [screen, setScreen] = useState<"race" | "garage" | "stats">("race");
  const [raceText, setRaceText] = useState(TEXTS[0]);
  const [typed, setTyped] = useState("");
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [opponents, setOpponents] = useState([0.08, 0.05, 0.11, 0.07]);
  const [result, setResult] = useState<number | null>(null);
  const [toast, setToast] = useState("");

  const car = CARS.find(c => c.id === save.selected) || CARS[0];
  const upgrade = save.upgrades[car.id] || 0;
  const accuracy = typed.length ? Math.max(0, [...typed].filter((c, i) => c === raceText[i]).length / typed.length) : 1;
  const correct = [...typed].filter((c, i) => c === raceText[i]).length;
  const progress = Math.min(1, correct / raceText.length);
  const wpm = elapsed > 0 ? Math.round((correct / 5) / (elapsed / 60)) : 0;
  const level = Math.floor(save.xp / 250) + 1;

  const saveIt = (next: Save) => { setSave(next); localStorage.setItem("typer-racer-save", JSON.stringify(next)); };

  const startRace = () => {
    setRaceText(TEXTS[Math.floor(Math.random() * TEXTS.length)]);
    setTyped(""); setElapsed(0); setOpponents([0.08, 0.05, 0.11, 0.07]); setResult(null); setFinished(false); setRunning(true);
  };

  useEffect(() => {
    if (!running || finished) return;
    const timer = window.setInterval(() => {
      setElapsed(e => e + 1);
      setOpponents(v => v.map((p, i) => Math.min(0.99, p + (0.006 + i * 0.0015) * (0.95 + Math.random() * 0.35))));
    }, 1000);
    return () => clearInterval(timer);
  }, [running, finished]);

  useEffect(() => {
    if (!running || finished) return;
    if (progress >= 1) {
      const sorted = [...opponents, 1].sort((a, b) => b - a);
      const place = sorted.indexOf(1) + 1;
      const reward = Math.max(35, 130 - (place - 1) * 20) + upgrade * 8;
      setResult(place); setFinished(true); setRunning(false);
      saveIt({ ...save, coins: save.coins + reward, xp: save.xp + reward, wins: save.wins + (place === 1 ? 1 : 0) });
      setToast(place === 1 ? "WIN! +" + reward + " coins" : "FINISH #" + place + "  +" + reward + " coins");
      window.setTimeout(() => setToast(""), 2200);
    }
  }, [progress, running, finished]);

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!running) return;
    if (e.key === "Backspace") { e.preventDefault(); setTyped(t => t.slice(0, -1)); return; }
    if (e.key.length === 1) { setTyped(t => t.length < raceText.length ? t + e.key : t); }
  };

  const buyCar = (target: Car) => {
    if (save.owned.includes(target.id)) { saveIt({ ...save, selected: target.id }); return; }
    if (save.coins < target.price) { setToast("Not enough coins"); window.setTimeout(() => setToast(""), 1600); return; }
    saveIt({ ...save, coins: save.coins - target.price, owned: [...save.owned, target.id], selected: target.id });
  };

  const upgradeCar = () => {
    const cost = 120 + upgrade * 90;
    if (save.coins < cost) { setToast("Not enough coins"); window.setTimeout(() => setToast(""), 1600); return; }
    saveIt({ ...save, coins: save.coins - cost, upgrades: { ...save.upgrades, [car.id]: upgrade + 1 } });
  };

  const highlighted = useMemo(() => [...raceText].map((ch, i) => {
    const state = i < typed.length ? (typed[i] === ch ? "ok" : "bad") : i === typed.length ? "current" : "";
    return <span key={i} className={state}>{ch}</span>;
  }), [raceText, typed]);

  return <div className="game-shell">
    <header className="topbar">
      <div className="brand"><span className="brand-mark">⌁</span><div><b>TYPER<span>RACER</span></b><small>OFFLINE EDITION</small></div></div>
      <nav>
        <button className={screen === "race" ? "active" : ""} onClick={() => setScreen("race")}>RACE</button>
        <button className={screen === "garage" ? "active" : ""} onClick={() => setScreen("garage")}>GARAGE</button>
        <button className={screen === "stats" ? "active" : ""} onClick={() => setScreen("stats")}>STATS</button>
      </nav>
      <div className="wallet">◈ {save.coins.toLocaleString()} <span>LVL {level}</span></div>
    </header>

    <main>
      {screen === "race" && <section className="race-screen">
        <div className="hero-row">
          <div><p className="eyebrow">SOLO CIRCUIT · OFFLINE</p><h1>TYPE. <em>RACE.</em> WIN.</h1><p className="sub">Your keyboard is the accelerator. Accuracy is your traction.</p></div>
          <div className="race-actions"><button className="primary" onClick={startRace}>{running ? "RESTART RACE" : "START RACE"} <span>→</span></button><div className="mini-stats"><b>{wpm} <small>WPM</small></b><b>{Math.round(accuracy * 100)}% <small>ACC</small></b><b>{elapsed}s <small>TIME</small></b></div></div>
        </div>
        <div className="track">
          <div className="track-grid" />
          {opponents.map((p, i) => <div className="lane" key={i}><div className="lane-label">AI {i + 1}</div><div className="racer" style={{ left: (p * 88) + "%" }}><CarVisual car={CARS[(i + 1) % CARS.length]} small /></div></div>)}
          <div className="lane player-lane"><div className="lane-label you">YOU</div><div className="racer" style={{ left: (progress * 88) + "%" }}><CarVisual car={car} small /></div></div>
          <div className="finish">FINISH</div>
        </div>
        <div className="typing-panel">
          <div className="typing-meta"><span>RACE TEXT</span><b>{correct}/{raceText.length}</b></div>
          <div className="text-display">{highlighted}</div>
          <textarea aria-label="Type the race text" autoFocus value="" onChange={() => {}} onKeyDown={handleKey} placeholder={running ? "Type here — keyboard controls the car" : "Press START RACE, then type here"} readOnly={!running} />
          {!running && !finished && <div className="overlay-hint">START A RACE TO BEGIN</div>}
          {finished && <div className="result-card"><span>FINISHED</span><strong>#{result}</strong><button onClick={startRace}>RACE AGAIN</button></div>}
        </div>
      </section>}

      {screen === "garage" && <section className="garage-screen">
        <div className="section-heading"><div><p className="eyebrow">YOUR COLLECTION</p><h2>THE GARAGE</h2></div><p>Upgrade your machine and make every keystroke count.</p></div>
        <div className="garage-grid">{CARS.map(c => {
          const owned = save.owned.includes(c.id);
          const lv = save.upgrades[c.id] || 0;
          return <article className={save.selected === c.id ? "car-card selected" : "car-card"} key={c.id}>
            <div className="car-stage"><CarVisual car={c} /></div>
            <div className="car-info"><div><h3>{c.name}</h3><span>TOP SPEED ×{(c.speed + lv * .03).toFixed(2)}</span></div><strong>{owned ? "LVL " + (lv + 1) : "◈ " + c.price}</strong></div>
            <button onClick={() => buyCar(c)}>{owned ? (save.selected === c.id ? "SELECTED" : "SELECT") : "BUY CAR"}</button>
            {owned && save.selected === c.id && <button className="secondary" onClick={upgradeCar}>UPGRADE · ◈ {120 + lv * 90}</button>}
          </article>;
        })}</div>
      </section>}

      {screen === "stats" && <section className="stats-screen">
        <div className="section-heading"><div><p className="eyebrow">LOCAL PROFILE</p><h2>RACE STATS</h2></div><p>Everything is stored on this device. No account. No server.</p></div>
        <div className="stat-grid"><div><span>LEVEL</span><strong>{level}</strong><small>{save.xp} XP</small></div><div><span>WINS</span><strong>{save.wins}</strong><small>races won</small></div><div><span>COINS</span><strong>{save.coins}</strong><small>spend in garage</small></div><div><span>OWNED</span><strong>{save.owned.length}/{CARS.length}</strong><small>cars unlocked</small></div></div>
        <div className="offline-note"><span>●</span><div><b>100% OFFLINE PROGRESSION</b><p>Your coins, cars, upgrades and XP use localStorage. The game works without an internet connection after the page is loaded.</p></div></div>
      </section>}
    </main>

    {toast && <div className="toast">{toast}</div>}
    <footer><span>TYPERRACER // OFFLINE EDITION</span><span>NO LOGIN · NO SERVER · YOUR DATA STAYS LOCAL</span></footer>
  </div>;
}
