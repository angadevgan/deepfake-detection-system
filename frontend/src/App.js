import { useState, useRef, useCallback, useEffect } from "react";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg-void:     #080B0F;
    --bg-surface:  #0D1117;
    --bg-elevated: #131920;
    --bg-card:     #161D26;
    --border:      #1E2A35;
    --border-lit:  #243140;
    --cyan:        #00D4FF;
    --cyan-dim:    #00D4FF22;
    --cyan-glow:   #00D4FF44;
    --red:         #FF3B5C;
    --red-dim:     #FF3B5C22;
    --green:       #00E676;
    --green-dim:   #00E67622;
    --amber:       #FFB300;
    --amber-dim:   #FFB30022;
    --text-primary:   #E8EDF2;
    --text-secondary: #7A8A9A;
    --text-muted:     #3D4F5F;
    --font-display: 'Space Mono', monospace;
    --font-body:    'Space Grotesk', sans-serif;
    --radius:       12px;
    --radius-sm:    8px;
  }

  body {
    font-family: var(--font-body);
    background: var(--bg-void);
    color: var(--text-primary);
    min-height: 100vh;
    overflow-x: hidden;
  }

  body::before {
    content: '';
    position: fixed; inset: 0;
    background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,212,255,0.012) 2px, rgba(0,212,255,0.012) 4px);
    pointer-events: none; z-index: 9999;
  }

  .app { min-height: 100vh; display: flex; flex-direction: column; }

  /* ── Nav ── */
  .nav {
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 2rem; height: 64px;
    border-bottom: 1px solid var(--border);
    background: var(--bg-surface);
    position: sticky; top: 0; z-index: 100;
  }
  .nav-logo {
    font-family: var(--font-display); font-size: 14px; font-weight: 700;
    color: var(--cyan); letter-spacing: 0.08em;
    display: flex; align-items: center; gap: 10px;
  }
  .nav-logo-dot {
    width: 8px; height: 8px; border-radius: 50%; background: var(--cyan);
    box-shadow: 0 0 12px var(--cyan); animation: pulse 2s ease-in-out infinite;
  }
  @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.7)} }
  .nav-stats { display: flex; gap: 2rem; }
  .nav-stat { text-align: center; }
  .nav-stat-val { font-family: var(--font-display); font-size: 13px; font-weight: 700; color: var(--cyan); }
  .nav-stat-label { font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em; }
  .nav-badge { font-family: var(--font-display); font-size: 10px; padding: 4px 10px; border: 1px solid var(--border-lit); border-radius: 20px; color: var(--text-secondary); letter-spacing: 0.08em; }

  /* ── Tab bar ── */
  .tabbar {
    display: flex; gap: 0.5rem; padding: 1.5rem 2rem 0;
    max-width: 1200px; margin: 0 auto; width: 100%;
    border-bottom: 1px solid var(--border);
  }
  .tab {
    font-family: var(--font-display); font-size: 12px; letter-spacing: 0.08em;
    padding: 10px 18px; background: transparent; border: none;
    color: var(--text-muted); cursor: pointer;
    border-bottom: 2px solid transparent;
    transition: all 0.15s; text-transform: uppercase;
  }
  .tab:hover { color: var(--text-secondary); }
  .tab.active { color: var(--cyan); border-bottom-color: var(--cyan); }

  /* ── Hero (only on image tab) ── */
  .hero { padding: 3rem 2rem 2rem; text-align: center; position: relative; overflow: hidden; }
  .hero::before { content: ''; position: absolute; inset: 0; background: radial-gradient(ellipse 60% 50% at 50% 0%, rgba(0,212,255,0.06), transparent); pointer-events: none; }
  .hero-eyebrow { font-family: var(--font-display); font-size: 11px; letter-spacing: 0.2em; color: var(--cyan); text-transform: uppercase; margin-bottom: 1rem; }
  .hero-title { font-size: clamp(2rem, 4.5vw, 3rem); font-weight: 700; line-height: 1.1; margin-bottom: 1rem; background: linear-gradient(135deg, #E8EDF2 0%, #7A8A9A 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
  .hero-title span { background: linear-gradient(135deg, var(--cyan), #0088FF); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
  .hero-sub { font-size: 15px; color: var(--text-secondary); max-width: 520px; margin: 0 auto; line-height: 1.7; }

  /* ── Main layout ── */
  .main { flex: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; padding: 1.5rem 2rem 3rem; max-width: 1200px; margin: 0 auto; width: 100%; }
  .main.single { grid-template-columns: 1fr; }

  .panel-label { font-family: var(--font-display); font-size: 10px; letter-spacing: 0.15em; color: var(--text-muted); text-transform: uppercase; display: flex; align-items: center; gap: 8px; margin-bottom: 0.75rem; }
  .panel-label::after { content: ''; flex: 1; height: 1px; background: var(--border); }

  /* ── Upload zone ── */
  .upload-panel { display: flex; flex-direction: column; gap: 1rem; }

  .dropzone {
    border: 1.5px dashed var(--border-lit); border-radius: var(--radius);
    background: var(--bg-card); padding: 3rem 2rem; text-align: center;
    cursor: pointer; transition: all 0.2s; position: relative; overflow: hidden;
  }
  .dropzone:hover, .dropzone.drag-over { border-color: var(--cyan); background: var(--bg-elevated); box-shadow: 0 0 30px var(--cyan-dim), inset 0 0 30px var(--cyan-dim); }
  .dropzone-icon { font-size: 2.5rem; margin-bottom: 1rem; filter: grayscale(0.5); }
  .dropzone-title { font-size: 15px; font-weight: 600; color: var(--text-primary); margin-bottom: 6px; }
  .dropzone-sub { font-size: 12px; color: var(--text-muted); }
  .dropzone input { display: none; }

  .preview-wrap { border-radius: var(--radius); overflow: hidden; background: var(--bg-card); border: 1px solid var(--border); position: relative; }
  .preview-img { width: 100%; display: block; max-height: 320px; object-fit: cover; }
  .preview-overlay { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(8,11,15,0.7); }
  .scan-line { position: absolute; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, transparent, var(--cyan), transparent); box-shadow: 0 0 20px var(--cyan); animation: scan 1.8s ease-in-out infinite; }
  @keyframes scan { 0%{top:0;opacity:0} 10%{opacity:1} 90%{opacity:1} 100%{top:100%;opacity:0} }
  .scan-text { font-family: var(--font-display); font-size: 12px; color: var(--cyan); letter-spacing: 0.15em; animation: blink 1s step-end infinite; }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }

  .analyze-btn {
    width: 100%; padding: 14px; background: linear-gradient(135deg, #00D4FF, #0088FF);
    border: none; border-radius: var(--radius-sm); font-family: var(--font-display);
    font-size: 13px; font-weight: 700; letter-spacing: 0.1em; color: #080B0F;
    cursor: pointer; transition: all 0.2s; text-transform: uppercase;
  }
  .analyze-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 30px var(--cyan-glow); }
  .analyze-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  /* ── Result panel ── */
  .result-panel { display: flex; flex-direction: column; gap: 1rem; }

  .verdict-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); padding: 1.5rem; position: relative; overflow: hidden; transition: all 0.4s; }
  .verdict-card.fake { border-color: var(--red); box-shadow: 0 0 40px var(--red-dim); }
  .verdict-card.fake::before { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, var(--red-dim), transparent); pointer-events: none; }
  .verdict-card.real { border-color: var(--green); box-shadow: 0 0 40px var(--green-dim); }
  .verdict-card.real::before { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, var(--green-dim), transparent); pointer-events: none; }
  .verdict-card.uncertain { border-color: var(--amber); box-shadow: 0 0 40px var(--amber-dim); }
  .verdict-card.uncertain::before { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, var(--amber-dim), transparent); pointer-events: none; }
  .verdict-card.empty { min-height: 200px; display: flex; align-items: center; justify-content: center; }
  .verdict-empty-text { font-family: var(--font-display); font-size: 12px; color: var(--text-muted); letter-spacing: 0.1em; text-align: center; }

  .verdict-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 8px; }
  .verdict-label { font-family: var(--font-display); font-size: 10px; letter-spacing: 0.15em; color: var(--text-muted); text-transform: uppercase; }
  .verdict-badge { font-family: var(--font-display); font-size: 11px; padding: 4px 12px; border-radius: 20px; font-weight: 700; letter-spacing: 0.08em; }
  .verdict-badge.fake { background: var(--red-dim); color: var(--red); border: 1px solid var(--red); }
  .verdict-badge.real { background: var(--green-dim); color: var(--green); border: 1px solid var(--green); }
  .verdict-badge.uncertain { background: var(--amber-dim); color: var(--amber); border: 1px solid var(--amber); }

  .face-badge {
    font-family: var(--font-display); font-size: 10px; padding: 3px 10px;
    border-radius: 4px; letter-spacing: 0.06em;
    background: var(--cyan-dim); color: var(--cyan); border: 1px solid var(--border-lit);
  }
  .face-badge.no-face { background: var(--red-dim); color: var(--red); }

  .meter-wrap { display: flex; align-items: center; gap: 1.5rem; margin-bottom: 1.5rem; }
  .meter-svg { flex-shrink: 0; }
  .meter-info { flex: 1; }
  .meter-verdict { font-size: 2.2rem; font-weight: 700; line-height: 1; margin-bottom: 4px; }
  .meter-verdict.fake { color: var(--red); }
  .meter-verdict.real { color: var(--green); }
  .meter-verdict.uncertain { color: var(--amber); }
  .meter-conf { font-family: var(--font-display); font-size: 12px; color: var(--text-secondary); }
  .meter-conf span { font-size: 20px; font-weight: 700; color: var(--text-primary); }
  .meter-note { font-size: 11px; color: var(--text-muted); margin-top: 6px; line-height: 1.5; }

  .prob-bars { display: flex; flex-direction: column; gap: 10px; }
  .prob-row { display: flex; align-items: center; gap: 10px; }
  .prob-label { font-family: var(--font-display); font-size: 11px; color: var(--text-secondary); width: 40px; letter-spacing: 0.05em; }
  .prob-track { flex: 1; height: 6px; background: var(--border); border-radius: 3px; overflow: hidden; }
  .prob-fill { height: 100%; border-radius: 3px; transition: width 0.8s cubic-bezier(0.4,0,0.2,1); }
  .prob-fill.fake { background: linear-gradient(90deg, #FF3B5C, #FF6B7A); }
  .prob-fill.real { background: linear-gradient(90deg, #00E676, #69F0AE); }
  .prob-val { font-family: var(--font-display); font-size: 11px; color: var(--text-secondary); width: 44px; text-align: right; }

  /* ── Stats row ── */
  .stats-row { grid-column: 1 / -1; display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
  .stat-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); padding: 1.25rem 1.5rem; transition: border-color 0.2s; }
  .stat-card:hover { border-color: var(--border-lit); }
  .stat-card-label { font-family: var(--font-display); font-size: 10px; letter-spacing: 0.15em; color: var(--text-muted); text-transform: uppercase; margin-bottom: 8px; }
  .stat-card-val { font-family: var(--font-display); font-size: 1.6rem; font-weight: 700; color: var(--cyan); line-height: 1; margin-bottom: 4px; }
  .stat-card-sub { font-size: 12px; color: var(--text-secondary); }

  /* Heatmap */
  .heatmap-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.75rem; }
  .heatmap-img-wrap { border-radius: var(--radius-sm); overflow: hidden; border: 1px solid var(--border); background: var(--bg-surface); aspect-ratio: 1; display: flex; align-items: center; justify-content: center; }
  .heatmap-img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .heatmap-placeholder { font-family: var(--font-display); font-size: 10px; color: var(--text-muted); letter-spacing: 0.1em; text-align: center; padding: 1rem; white-space: pre-line; }
  .heatmap-label { font-family: var(--font-display); font-size: 10px; color: var(--text-muted); letter-spacing: 0.1em; text-align: center; margin-top: 8px; text-transform: uppercase; }

  /* ── Video tab ── */
  .video-stats { display: grid; grid-template-columns: repeat(4,1fr); gap: 0.75rem; margin-bottom: 1rem; }
  .vstat { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 1rem; text-align: center; }
  .vstat-val { font-family: var(--font-display); font-size: 1.4rem; font-weight: 700; color: var(--cyan); }
  .vstat-label { font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.1em; margin-top: 4px; }

  .chart-wrap { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); padding: 1.5rem; }
  .chart-svg { width: 100%; height: auto; display: block; }

  .frame-list { display: flex; flex-direction: column; gap: 6px; margin-top: 1rem; max-height: 300px; overflow-y: auto; }
  .frame-row { display: flex; align-items: center; gap: 10px; padding: 8px 12px; background: var(--bg-elevated); border-radius: 6px; font-family: var(--font-display); font-size: 11px; }
  .frame-row .ft { color: var(--text-muted); width: 60px; }
  .frame-row .fp { flex: 1; height: 4px; background: var(--border); border-radius: 2px; overflow: hidden; }
  .frame-row .fp-fill { height: 100%; }
  .frame-row .fv { width: 50px; text-align: right; }
  .frame-row .fb { width: 80px; text-align: right; font-weight: 700; }
  .fb.fake { color: var(--red); } .fb.real { color: var(--green); } .fb.uncertain { color: var(--amber); }

  /* ── Batch tab ── */
  .batch-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1rem; margin-top: 1rem; }
  .batch-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-sm); overflow: hidden; }
  .batch-img { width: 100%; height: 140px; object-fit: cover; display: block; }
  .batch-info { padding: 10px 12px; }
  .batch-name { font-size: 11px; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 6px; }
  .batch-verdict { font-family: var(--font-display); font-size: 13px; font-weight: 700; }
  .batch-verdict.fake { color: var(--red); } .batch-verdict.real { color: var(--green); } .batch-verdict.uncertain { color: var(--amber); }
  .batch-conf { font-size: 11px; color: var(--text-muted); margin-top: 2px; }

  /* ── History tab ── */
  .history-table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
  .history-table th { font-family: var(--font-display); font-size: 10px; letter-spacing: 0.1em; color: var(--text-muted); text-transform: uppercase; text-align: left; padding: 10px 14px; border-bottom: 1px solid var(--border); }
  .history-table td { padding: 10px 14px; font-size: 13px; border-bottom: 1px solid var(--border); color: var(--text-secondary); }
  .history-table tr:hover td { background: var(--bg-elevated); }
  .hverdict { font-family: var(--font-display); font-weight: 700; font-size: 11px; padding: 3px 10px; border-radius: 12px; }
  .hverdict.fake { background: var(--red-dim); color: var(--red); }
  .hverdict.real { background: var(--green-dim); color: var(--green); }
  .hverdict.uncertain { background: var(--amber-dim); color: var(--amber); }
  .clear-btn {
    font-family: var(--font-display); font-size: 11px; padding: 8px 16px;
    background: var(--red-dim); border: 1px solid var(--red); color: var(--red);
    border-radius: var(--radius-sm); cursor: pointer; letter-spacing: 0.08em;
  }
  .clear-btn:hover { background: var(--red); color: #080B0F; }
  .history-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
  .empty-state { text-align: center; padding: 3rem; color: var(--text-muted); font-family: var(--font-display); font-size: 12px; letter-spacing: 0.1em; }

  /* ── Footer ── */
  .footer { border-top: 1px solid var(--border); padding: 1.5rem 2rem; display: flex; align-items: center; justify-content: space-between; background: var(--bg-surface); flex-wrap: wrap; gap: 10px; }
  .footer-left { font-family: var(--font-display); font-size: 11px; color: var(--text-muted); letter-spacing: 0.08em; }
  .footer-right { display: flex; gap: 1.5rem; flex-wrap: wrap; }
  .footer-tag { font-family: var(--font-display); font-size: 10px; color: var(--text-muted); letter-spacing: 0.1em; }
  .footer-tag span { color: var(--cyan); }

  .error-box {
    padding: 10px 14px; background: var(--red-dim); border: 1px solid var(--red);
    border-radius: var(--radius-sm); font-size: 12px; color: var(--red);
    font-family: var(--font-display);
  }

  @media (max-width: 768px) {
    .main { grid-template-columns: 1fr; padding: 1.5rem 1rem 2rem; }
    .stats-row, .video-stats { grid-template-columns: repeat(2,1fr); }
    .nav-stats { display: none; }
    .heatmap-grid { grid-template-columns: 1fr 1fr; }
    .tabbar { padding: 1rem 1rem 0; overflow-x: auto; }
  }
`;

const API_BASE = "http://localhost:8000";

// ── Confidence meter ──────────────────────────────────────────
function ConfidenceMeter({ percentage, verdict }) {
  const r = 42;
  const circ = 2 * Math.PI * r;
  const dash = (percentage / 100) * circ;
  const color = verdict === "REAL" ? "#00E676" : verdict === "UNCERTAIN" ? "#FFB300" : "#FF3B5C";

  return (
    <svg width="110" height="110" viewBox="0 0 110 110" className="meter-svg">
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <circle cx="55" cy="55" r={r} fill="none" stroke="#1E2A35" strokeWidth="8" />
      <circle cx="55" cy="55" r={r} fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`} strokeDashoffset={circ * 0.25} filter="url(#glow)"
        style={{ transition: "stroke-dasharray 1s cubic-bezier(0.4,0,0.2,1)" }} />
      <text x="55" y="50" textAnchor="middle" fontFamily="Space Mono" fontSize="16" fontWeight="700" fill={color}>
        {Math.round(percentage)}%
      </text>
      <text x="55" y="66" textAnchor="middle" fontFamily="Space Grotesk" fontSize="9" fill="#7A8A9A" letterSpacing="1">
        CONFIDENCE
      </text>
    </svg>
  );
}

// ── Line chart for video frame probabilities ─────────────────
function FrameChart({ frames }) {
  const w = 800, h = 220, pad = 30;
  const maxX = frames.length - 1;

  const points = frames.map((f, i) => {
    const x = pad + (i / maxX) * (w - pad * 2);
    const y = h - pad - (f.fake_prob / 100) * (h - pad * 2);
    return `${x},${y}`;
  }).join(" ");

  const thresholdY = h - pad - (50 / 100) * (h - pad * 2);

  return (
    <svg className="chart-svg" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="xMidYMid meet">
      {/* Grid lines */}
      {[0, 25, 50, 75, 100].map(v => {
        const y = h - pad - (v / 100) * (h - pad * 2);
        return (
          <g key={v}>
            <line x1={pad} y1={y} x2={w - pad} y2={y} stroke="#1E2A35" strokeWidth="1" />
            <text x={pad - 8} y={y + 4} textAnchor="end" fontFamily="Space Mono" fontSize="10" fill="#3D4F5F">{v}</text>
          </g>
        );
      })}
      {/* Threshold line at 50% */}
      <line x1={pad} y1={thresholdY} x2={w - pad} y2={thresholdY} stroke="#FFB300" strokeWidth="1" strokeDasharray="4 4" opacity="0.5" />

      {/* Area fill */}
      <polygon
        points={`${pad},${h-pad} ${points} ${w-pad},${h-pad}`}
        fill="#00D4FF" opacity="0.08"
      />
      {/* Line */}
      <polyline points={points} fill="none" stroke="#00D4FF" strokeWidth="2" strokeLinejoin="round" />
      {/* Points */}
      {frames.map((f, i) => {
        const x = pad + (i / maxX) * (w - pad * 2);
        const y = h - pad - (f.fake_prob / 100) * (h - pad * 2);
        const color = f.verdict === "REAL" ? "#00E676" : f.verdict === "UNCERTAIN" ? "#FFB300" : "#FF3B5C";
        return <circle key={i} cx={x} cy={y} r="3" fill={color} />;
      })}
      <text x={w/2} y={h-4} textAnchor="middle" fontFamily="Space Mono" fontSize="10" fill="#3D4F5F">
        FRAME INDEX →
      </text>
    </svg>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState("image");

  // ── Image tab state ──
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef();

  // ── Video tab state ──
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [videoResult, setVideoResult] = useState(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState(null);
  const videoInputRef = useRef();

  // ── Batch tab state ──
  const [batchFiles, setBatchFiles] = useState([]);
  const [batchResults, setBatchResults] = useState(null);
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchError, setBatchError] = useState(null);
  const batchInputRef = useRef();

  // ── History tab state ──
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const handleFile = useCallback((f) => {
    if (!f || !f.type.startsWith("image/")) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
    setError(null);
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  const analyze = async () => {
    if (!file) return;
    setLoading(true); setError(null);
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch(`${API_BASE}/predict`, { method: "POST", body: form });
      if (!res.ok) throw new Error("Server error");
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setError("Could not connect to backend. Make sure FastAPI is running on port 8000.");
    } finally {
      setLoading(false);
    }
  };

  // ── Video analysis ──
  const handleVideoFile = (f) => {
    if (!f || !f.type.startsWith("video/")) return;
    setVideoFile(f);
    setVideoPreview(URL.createObjectURL(f));
    setVideoResult(null);
    setVideoError(null);
  };

  const analyzeVideo = async () => {
    if (!videoFile) return;
    setVideoLoading(true); setVideoError(null);
    const form = new FormData();
    form.append("file", videoFile);
    try {
      const res = await fetch(`${API_BASE}/predict-video?max_frames=20`, { method: "POST", body: form });
      if (!res.ok) throw new Error("Server error");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setVideoResult(data);
    } catch (e) {
      setVideoError(e.message === "Server error" || e.message?.includes("fetch")
        ? "Could not connect to backend. Make sure FastAPI is running on port 8000."
        : e.message);
    } finally {
      setVideoLoading(false);
    }
  };

  // ── Batch analysis ──
  const handleBatchFiles = (files) => {
    const arr = Array.from(files).filter(f => f.type.startsWith("image/"));
    setBatchFiles(arr);
    setBatchResults(null);
    setBatchError(null);
  };

  const analyzeBatch = async () => {
    if (batchFiles.length === 0) return;
    setBatchLoading(true); setBatchError(null);
    const form = new FormData();
    batchFiles.forEach(f => form.append("files", f));
    try {
      const res = await fetch(`${API_BASE}/predict-batch`, { method: "POST", body: form });
      if (!res.ok) throw new Error("Server error");
      const data = await res.json();
      // attach local previews
      const withPreviews = data.results.map((r, i) => ({
        ...r,
        preview: URL.createObjectURL(batchFiles[i])
      }));
      setBatchResults(withPreviews);
    } catch (e) {
      setBatchError("Could not connect to backend. Make sure FastAPI is running on port 8000.");
    } finally {
      setBatchLoading(false);
    }
  };

  // ── History ──
  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch(`${API_BASE}/history?limit=100`);
      const data = await res.json();
      setHistory(data.history || []);
    } catch (e) {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const clearHistory = async () => {
    try {
      await fetch(`${API_BASE}/history`, { method: "DELETE" });
      setHistory([]);
    } catch (e) {}
  };

  useEffect(() => {
    if (activeTab === "history") loadHistory();
  }, [activeTab]);

  const verdictClass = (v) => v === "REAL" ? "real" : v === "UNCERTAIN" ? "uncertain" : "fake";
  const confPct = result ? (result.verdict === "REAL" ? result.real_prob : result.verdict === "UNCERTAIN" ? Math.max(result.fake_prob, result.real_prob) : result.fake_prob) : 0;

  return (
    <>
      <style>{styles}</style>
      <div className="app">

        {/* ── Nav ── */}
        <nav className="nav">
          <div className="nav-logo">
            <div className="nav-logo-dot" />
            DEEPGUARD // DETECTION SYSTEM
          </div>
          <div className="nav-stats">
            <div className="nav-stat"><div className="nav-stat-val">98.26%</div><div className="nav-stat-label">Accuracy</div></div>
            <div className="nav-stat"><div className="nav-stat-val">0.9984</div><div className="nav-stat-label">AUC-ROC</div></div>
            <div className="nav-stat"><div className="nav-stat-val">240K</div><div className="nav-stat-label">Trained On</div></div>
          </div>
          <div className="nav-badge">v2.0 // Fine-tuned on Celeb-DF</div>
        </nav>

        {/* ── Tab bar ── */}
        <div className="tabbar">
          {[
            { id: "image", label: "Image Scan" },
            { id: "video", label: "Video Scan" },
            { id: "batch", label: "Batch Upload" },
            { id: "history", label: "History" },
          ].map(t => (
            <button key={t.id} className={`tab ${activeTab === t.id ? "active" : ""}`}
              onClick={() => setActiveTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ════════════ IMAGE TAB ════════════ */}
        {activeTab === "image" && (
          <>
            <section className="hero">
              <div className="hero-eyebrow">// AI-Powered Forensic Analysis</div>
              <h1 className="hero-title">Is that face <span>real</span>?</h1>
              <p className="hero-sub">
                Upload an image — our system auto-detects the face, then analyzes
                spatial and frequency domain features to determine authenticity.
              </p>
            </section>

            <main className="main">
              <div className="upload-panel">
                <div className="panel-label">INPUT // UPLOAD IMAGE</div>
                {!preview ? (
                  <div className={`dropzone ${dragOver ? "drag-over" : ""}`}
                    onClick={() => inputRef.current.click()}
                    onDrop={onDrop}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}>
                    <input ref={inputRef} type="file" accept="image/*"
                      onChange={(e) => handleFile(e.target.files[0])} />
                    <div className="dropzone-icon">🔬</div>
                    <div className="dropzone-title">Drop image here or click to upload</div>
                    <div className="dropzone-sub">JPG, PNG, WEBP supported · Full photos OK — face auto-detected</div>
                  </div>
                ) : (
                  <div className="preview-wrap" onClick={() => { if (!loading) inputRef.current.click(); }}>
                    <input ref={inputRef} type="file" accept="image/*"
                      onChange={(e) => handleFile(e.target.files[0])} style={{display:"none"}} />
                    <img src={preview} alt="preview" className="preview-img" />
                    {loading && (
                      <div className="preview-overlay">
                        <div className="scan-line" />
                        <span className="scan-text">ANALYZING...</span>
                      </div>
                    )}
                  </div>
                )}
                <button className="analyze-btn" onClick={analyze} disabled={!file || loading}>
                  {loading ? "SCANNING IMAGE..." : "ANALYZE IMAGE"}
                </button>
                {error && <div className="error-box">{error}</div>}
              </div>

              <div className="result-panel">
                <div className="panel-label">OUTPUT // ANALYSIS RESULT</div>
                <div className={`verdict-card ${result ? verdictClass(result.verdict) : "empty"}`}>
                  {!result ? (
                    <div className="verdict-empty-text">
                      AWAITING INPUT<br />
                      <span style={{fontSize:"10px", opacity:0.5}}>Upload an image to begin analysis</span>
                    </div>
                  ) : (
                    <>
                      <div className="verdict-header">
                        <span className="verdict-label">FORENSIC VERDICT</span>
                        <div style={{display:"flex", gap:"8px", alignItems:"center"}}>
                          <span className={`face-badge ${result.face_detected ? "" : "no-face"}`}>
                            {result.face_detected ? "✓ Face Detected" : "⚠ No Face Found"}
                          </span>
                          <span className={`verdict-badge ${verdictClass(result.verdict)}`}>
                            {result.verdict}
                          </span>
                        </div>
                      </div>

                      <div className="meter-wrap">
                        <ConfidenceMeter percentage={confPct} verdict={result.verdict} />
                        <div className="meter-info">
                          <div className={`meter-verdict ${verdictClass(result.verdict)}`}>
                            {result.verdict === "REAL" ? "Authentic" : result.verdict === "UNCERTAIN" ? "Borderline" : "Synthetic"}
                          </div>
                          <div className="meter-conf"><span>{confPct}%</span> confidence</div>
                          {result.verdict === "UNCERTAIN" && (
                            <div className="meter-note">
                              Model confidence is too close to call (45-55% range).
                              This image has ambiguous features — treat with caution.
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="prob-bars">
                        <div className="prob-row">
                          <span className="prob-label">FAKE</span>
                          <div className="prob-track"><div className="prob-fill fake" style={{width:`${result.fake_prob}%`}} /></div>
                          <span className="prob-val">{result.fake_prob}%</span>
                        </div>
                        <div className="prob-row">
                          <span className="prob-label">REAL</span>
                          <div className="prob-track"><div className="prob-fill real" style={{width:`${result.real_prob}%`}} /></div>
                          <span className="prob-val">{result.real_prob}%</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="panel-label" style={{marginTop:"0.5rem"}}>GRAD-CAM // ATTENTION MAP</div>
                <div className="heatmap-grid">
                  <div>
                    <div className="heatmap-img-wrap">
                      {preview ? <img src={preview} alt="original" className="heatmap-img" /> : <div className="heatmap-placeholder">ORIGINAL</div>}
                    </div>
                    <div className="heatmap-label">Original</div>
                  </div>
                  <div>
                    <div className="heatmap-img-wrap">
                      {result?.face_b64
                        ? <img src={`data:image/jpeg;base64,${result.face_b64}`} alt="face" className="heatmap-img" />
                        : <div className="heatmap-placeholder">DETECTED{"\n"}FACE</div>}
                    </div>
                    <div className="heatmap-label">Cropped Face</div>
                  </div>
                  <div>
                    <div className="heatmap-img-wrap">
                      {result?.heatmap_b64
                        ? <img src={`data:image/jpeg;base64,${result.heatmap_b64}`} alt="heatmap" className="heatmap-img" />
                        : <div className="heatmap-placeholder">HEATMAP</div>}
                    </div>
                    <div className="heatmap-label">Grad-CAM</div>
                  </div>
                </div>
              </div>

              <div className="stats-row">
                {[
                  { label:"Model Architecture", val:"Dual-Branch", sub:"EfficientNet-B4 + FFT CNN" },
                  { label:"Test Accuracy",       val:"98.26%",     sub:"On 20,000 test images" },
                  { label:"AUC-ROC Score",       val:"0.9984",     sub:"Near-perfect discrimination" },
                  { label:"Training Dataset",    val:"240K",       sub:"50K real · 50K fake faces" },
                ].map((s,i) => (
                  <div className="stat-card" key={i}>
                    <div className="stat-card-label">{s.label}</div>
                    <div className="stat-card-val">{s.val}</div>
                    <div className="stat-card-sub">{s.sub}</div>
                  </div>
                ))}
              </div>
            </main>
          </>
        )}

        {/* ════════════ VIDEO TAB ════════════ */}
        {activeTab === "video" && (
          <main className="main single">
            <div className="upload-panel">
              <div className="panel-label">INPUT // UPLOAD VIDEO</div>
              {!videoPreview ? (
                <div className="dropzone" onClick={() => videoInputRef.current.click()}>
                  <input ref={videoInputRef} type="file" accept="video/*"
                    onChange={(e) => handleVideoFile(e.target.files[0])} />
                  <div className="dropzone-icon">🎬</div>
                  <div className="dropzone-title">Click to upload a video</div>
                  <div className="dropzone-sub">MP4, MOV, AVI · Frames sampled automatically</div>
                </div>
              ) : (
                <div className="preview-wrap">
                  <video src={videoPreview} controls style={{width:"100%", maxHeight:"400px", display:"block"}} />
                </div>
              )}
              <button className="analyze-btn" onClick={analyzeVideo} disabled={!videoFile || videoLoading}>
                {videoLoading ? "ANALYZING FRAMES... (this may take a minute)" : "ANALYZE VIDEO"}
              </button>
              {videoError && <div className="error-box">{videoError}</div>}
            </div>

            {videoResult && (
              <div className="result-panel" style={{marginTop:"1rem"}}>
                <div className="panel-label">OUTPUT // FRAME-BY-FRAME ANALYSIS</div>

                <div className={`verdict-card ${verdictClass(videoResult.overall_verdict)}`}>
                  <div className="verdict-header">
                    <span className="verdict-label">OVERALL VERDICT</span>
                    <span className={`verdict-badge ${verdictClass(videoResult.overall_verdict)}`}>
                      {videoResult.overall_verdict}
                    </span>
                  </div>
                  <div className="video-stats">
                    <div className="vstat"><div className="vstat-val">{videoResult.avg_fake_prob}%</div><div className="vstat-label">Avg Fake Prob</div></div>
                    <div className="vstat"><div className="vstat-val">{videoResult.max_fake_prob}%</div><div className="vstat-label">Peak Fake Prob</div></div>
                    <div className="vstat"><div className="vstat-val">{videoResult.fake_frame_count}/{videoResult.total_frames_analyzed}</div><div className="vstat-label">Frames Flagged Fake</div></div>
                    <div className="vstat"><div className="vstat-val">{videoResult.total_frames_analyzed}</div><div className="vstat-label">Frames Analyzed</div></div>
                  </div>
                </div>

                <div className="panel-label" style={{marginTop:"1rem"}}>FAKE PROBABILITY OVER TIME</div>
                <div className="chart-wrap">
                  <FrameChart frames={videoResult.frames} />
                  <div className="frame-list">
                    {videoResult.frames.map((f, i) => (
                      <div className="frame-row" key={i}>
                        <span className="ft">#{f.frame_index} ({f.timestamp_sec}s)</span>
                        <div className="fp">
                          <div className={`fp-fill ${verdictClass(f.verdict)}`}
                            style={{width:`${f.fake_prob}%`, background: f.verdict==="REAL"?"#00E676":f.verdict==="UNCERTAIN"?"#FFB300":"#FF3B5C"}} />
                        </div>
                        <span className="fv">{f.fake_prob}%</span>
                        <span className={`fb ${verdictClass(f.verdict)}`}>{f.verdict}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </main>
        )}

        {/* ════════════ BATCH TAB ════════════ */}
        {activeTab === "batch" && (
          <main className="main single">
            <div className="upload-panel">
              <div className="panel-label">INPUT // UPLOAD MULTIPLE IMAGES</div>
              <div className="dropzone" onClick={() => batchInputRef.current.click()}>
                <input ref={batchInputRef} type="file" accept="image/*" multiple
                  onChange={(e) => handleBatchFiles(e.target.files)} />
                <div className="dropzone-icon">🗂️</div>
                <div className="dropzone-title">
                  {batchFiles.length > 0 ? `${batchFiles.length} images selected` : "Click to select multiple images"}
                </div>
                <div className="dropzone-sub">Hold Ctrl/Cmd to select multiple files</div>
              </div>
              <button className="analyze-btn" onClick={analyzeBatch} disabled={batchFiles.length === 0 || batchLoading}>
                {batchLoading ? `ANALYZING ${batchFiles.length} IMAGES...` : `ANALYZE ${batchFiles.length || ""} IMAGES`}
              </button>
              {batchError && <div className="error-box">{batchError}</div>}
            </div>

            {batchResults && (
              <div className="result-panel" style={{marginTop:"1.5rem"}}>
                <div className="panel-label">OUTPUT // BATCH RESULTS ({batchResults.length} images)</div>
                <div className="batch-grid">
                  {batchResults.map((r, i) => (
                    <div className="batch-card" key={i}>
                      <img src={r.preview} alt={r.filename} className="batch-img" />
                      <div className="batch-info">
                        <div className="batch-name">{r.filename}</div>
                        <div className={`batch-verdict ${verdictClass(r.verdict)}`}>{r.verdict}</div>
                        <div className="batch-conf">
                          Fake: {r.fake_prob}% · Real: {r.real_prob}%
                          {!r.face_detected && " · ⚠ No face"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </main>
        )}

        {/* ════════════ HISTORY TAB ════════════ */}
        {activeTab === "history" && (
          <main className="main single">
            <div className="history-header">
              <div className="panel-label" style={{marginBottom:0, flex:1}}>PREDICTION HISTORY ({history.length})</div>
              <button className="clear-btn" onClick={clearHistory}>CLEAR ALL</button>
            </div>

            {historyLoading ? (
              <div className="empty-state">LOADING...</div>
            ) : history.length === 0 ? (
              <div className="empty-state">
                NO PREDICTIONS YET<br />
                <span style={{fontSize:"10px", opacity:0.6}}>Analyze an image or video to see history here</span>
              </div>
            ) : (
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Filename</th>
                    <th>Verdict</th>
                    <th>Fake %</th>
                    <th>Real %</th>
                    <th>Face Found</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h) => (
                    <tr key={h.id}>
                      <td>{h.filename}</td>
                      <td><span className={`hverdict ${verdictClass(h.verdict)}`}>{h.verdict}</span></td>
                      <td>{h.fake_prob}%</td>
                      <td>{h.real_prob}%</td>
                      <td>{h.face_detected ? "✓" : "✗"}</td>
                      <td>{new Date(h.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </main>
        )}

        {/* ── Footer ── */}
        <footer className="footer">
          <div className="footer-left">DEEPGUARD // FINAL YEAR PROJECT // CSE</div>
          <div className="footer-right">
            <div className="footer-tag">Model: <span>EfficientNet-B4 + FFT</span></div>
            <div className="footer-tag">Framework: <span>PyTorch / FastAPI</span></div>
            <div className="footer-tag">DB: <span>SQLite</span></div>
          </div>
        </footer>

      </div>
    </>
  );
}
