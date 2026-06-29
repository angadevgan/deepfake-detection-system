import { useState, useRef, useCallback } from "react";

// ── Design tokens ────────────────────────────────────────────────
// Palette: near-black base, electric cyan accent, threat-red, safe-green
// Type: monospace data labels + clean sans body
// Signature: animated radial confidence meter that "scans" the face

const MOCK_RESULT = null; // set to object to test without backend

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

  /* Scanline overlay */
  body::before {
    content: '';
    position: fixed;
    inset: 0;
    background: repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(0,212,255,0.012) 2px,
      rgba(0,212,255,0.012) 4px
    );
    pointer-events: none;
    z-index: 9999;
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
    font-family: var(--font-display);
    font-size: 14px; font-weight: 700;
    color: var(--cyan); letter-spacing: 0.08em;
    display: flex; align-items: center; gap: 10px;
  }
  .nav-logo-dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: var(--cyan);
    box-shadow: 0 0 12px var(--cyan);
    animation: pulse 2s ease-in-out infinite;
  }
  @keyframes pulse {
    0%,100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.4; transform: scale(0.7); }
  }
  .nav-stats {
    display: flex; gap: 2rem;
  }
  .nav-stat {
    text-align: center;
  }
  .nav-stat-val {
    font-family: var(--font-display);
    font-size: 13px; font-weight: 700;
    color: var(--cyan);
  }
  .nav-stat-label {
    font-size: 10px; color: var(--text-muted);
    text-transform: uppercase; letter-spacing: 0.1em;
  }
  .nav-badge {
    font-family: var(--font-display);
    font-size: 10px; padding: 4px 10px;
    border: 1px solid var(--border-lit);
    border-radius: 20px; color: var(--text-secondary);
    letter-spacing: 0.08em;
  }

  /* ── Hero ── */
  .hero {
    padding: 4rem 2rem 3rem;
    text-align: center;
    position: relative;
    overflow: hidden;
  }
  .hero::before {
    content: '';
    position: absolute; inset: 0;
    background: radial-gradient(ellipse 60% 50% at 50% 0%, rgba(0,212,255,0.06), transparent);
    pointer-events: none;
  }
  .hero-eyebrow {
    font-family: var(--font-display);
    font-size: 11px; letter-spacing: 0.2em;
    color: var(--cyan); text-transform: uppercase;
    margin-bottom: 1rem;
  }
  .hero-title {
    font-size: clamp(2.2rem, 5vw, 3.5rem);
    font-weight: 700; line-height: 1.1;
    margin-bottom: 1rem;
    background: linear-gradient(135deg, #E8EDF2 0%, #7A8A9A 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .hero-title span {
    background: linear-gradient(135deg, var(--cyan), #0088FF);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .hero-sub {
    font-size: 16px; color: var(--text-secondary);
    max-width: 520px; margin: 0 auto 2.5rem;
    line-height: 1.7;
  }
  .hero-metrics {
    display: flex; justify-content: center; gap: 3rem;
    margin-bottom: 3rem;
  }
  .hero-metric {
    text-align: center;
  }
  .hero-metric-val {
    font-family: var(--font-display);
    font-size: 2rem; font-weight: 700;
    color: var(--cyan);
    line-height: 1;
  }
  .hero-metric-label {
    font-size: 11px; color: var(--text-muted);
    text-transform: uppercase; letter-spacing: 0.12em;
    margin-top: 4px;
  }
  .metric-divider {
    width: 1px; background: var(--border);
    align-self: stretch;
  }

  /* ── Main layout ── */
  .main {
    flex: 1;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
    padding: 0 2rem 3rem;
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
  }

  /* ── Upload zone ── */
  .upload-panel {
    grid-column: 1;
    display: flex; flex-direction: column; gap: 1rem;
  }
  .panel-label {
    font-family: var(--font-display);
    font-size: 10px; letter-spacing: 0.15em;
    color: var(--text-muted); text-transform: uppercase;
    display: flex; align-items: center; gap: 8px;
  }
  .panel-label::after {
    content: ''; flex: 1; height: 1px; background: var(--border);
  }

  .dropzone {
    border: 1.5px dashed var(--border-lit);
    border-radius: var(--radius);
    background: var(--bg-card);
    padding: 3rem 2rem;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
    overflow: hidden;
  }
  .dropzone:hover, .dropzone.drag-over {
    border-color: var(--cyan);
    background: var(--bg-elevated);
    box-shadow: 0 0 30px var(--cyan-dim), inset 0 0 30px var(--cyan-dim);
  }
  .dropzone-icon {
    font-size: 2.5rem; margin-bottom: 1rem;
    filter: grayscale(0.5);
  }
  .dropzone-title {
    font-size: 15px; font-weight: 600;
    color: var(--text-primary); margin-bottom: 6px;
  }
  .dropzone-sub {
    font-size: 12px; color: var(--text-muted);
  }
  .dropzone input { display: none; }

  /* Preview */
  .preview-wrap {
    border-radius: var(--radius);
    overflow: hidden;
    background: var(--bg-card);
    border: 1px solid var(--border);
    position: relative;
  }
  .preview-img {
    width: 100%; display: block;
    max-height: 320px; object-fit: cover;
  }
  .preview-overlay {
    position: absolute; inset: 0;
    display: flex; align-items: center; justify-content: center;
    background: rgba(8,11,15,0.7);
  }
  .scan-line {
    position: absolute; left: 0; right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, var(--cyan), transparent);
    box-shadow: 0 0 20px var(--cyan);
    animation: scan 1.8s ease-in-out infinite;
  }
  @keyframes scan {
    0% { top: 0; opacity: 0; }
    10% { opacity: 1; }
    90% { opacity: 1; }
    100% { top: 100%; opacity: 0; }
  }
  .scan-text {
    font-family: var(--font-display);
    font-size: 12px; color: var(--cyan);
    letter-spacing: 0.15em;
    animation: blink 1s step-end infinite;
  }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }

  .analyze-btn {
    width: 100%;
    padding: 14px;
    background: linear-gradient(135deg, #00D4FF, #0088FF);
    border: none; border-radius: var(--radius-sm);
    font-family: var(--font-display);
    font-size: 13px; font-weight: 700;
    letter-spacing: 0.1em; color: #080B0F;
    cursor: pointer;
    transition: all 0.2s;
    text-transform: uppercase;
  }
  .analyze-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 8px 30px var(--cyan-glow);
  }
  .analyze-btn:disabled {
    opacity: 0.4; cursor: not-allowed;
  }

  /* ── Result panel ── */
  .result-panel {
    grid-column: 2;
    display: flex; flex-direction: column; gap: 1rem;
  }

  /* Verdict card */
  .verdict-card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 1.5rem;
    position: relative; overflow: hidden;
    transition: all 0.4s;
  }
  .verdict-card.fake {
    border-color: var(--red);
    box-shadow: 0 0 40px var(--red-dim);
  }
  .verdict-card.fake::before {
    content: ''; position: absolute;
    inset: 0;
    background: linear-gradient(135deg, var(--red-dim), transparent);
    pointer-events: none;
  }
  .verdict-card.real {
    border-color: var(--green);
    box-shadow: 0 0 40px var(--green-dim);
  }
  .verdict-card.real::before {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(135deg, var(--green-dim), transparent);
    pointer-events: none;
  }
  .verdict-card.empty {
    min-height: 200px;
    display: flex; align-items: center; justify-content: center;
  }
  .verdict-empty-text {
    font-family: var(--font-display);
    font-size: 12px; color: var(--text-muted);
    letter-spacing: 0.1em; text-align: center;
  }

  .verdict-header {
    display: flex; align-items: center;
    justify-content: space-between; margin-bottom: 1.5rem;
  }
  .verdict-label {
    font-family: var(--font-display);
    font-size: 10px; letter-spacing: 0.15em;
    color: var(--text-muted); text-transform: uppercase;
  }
  .verdict-badge {
    font-family: var(--font-display);
    font-size: 11px; padding: 4px 12px;
    border-radius: 20px; font-weight: 700;
    letter-spacing: 0.08em;
  }
  .verdict-badge.fake { background: var(--red-dim); color: var(--red); border: 1px solid var(--red); }
  .verdict-badge.real { background: var(--green-dim); color: var(--green); border: 1px solid var(--green); }

  /* Confidence meter — THE signature element */
  .meter-wrap {
    display: flex; align-items: center; gap: 1.5rem;
    margin-bottom: 1.5rem;
  }
  .meter-svg { flex-shrink: 0; }
  .meter-info { flex: 1; }
  .meter-verdict {
    font-size: 2.2rem; font-weight: 700; line-height: 1;
    margin-bottom: 4px;
  }
  .meter-verdict.fake { color: var(--red); }
  .meter-verdict.real { color: var(--green); }
  .meter-conf {
    font-family: var(--font-display);
    font-size: 12px; color: var(--text-secondary);
  }
  .meter-conf span {
    font-size: 20px; font-weight: 700; color: var(--text-primary);
  }

  /* Prob bars */
  .prob-bars { display: flex; flex-direction: column; gap: 10px; }
  .prob-row { display: flex; align-items: center; gap: 10px; }
  .prob-label {
    font-family: var(--font-display);
    font-size: 11px; color: var(--text-secondary);
    width: 40px; letter-spacing: 0.05em;
  }
  .prob-track {
    flex: 1; height: 6px;
    background: var(--border); border-radius: 3px;
    overflow: hidden;
  }
  .prob-fill {
    height: 100%; border-radius: 3px;
    transition: width 0.8s cubic-bezier(0.4,0,0.2,1);
  }
  .prob-fill.fake { background: linear-gradient(90deg, #FF3B5C, #FF6B7A); }
  .prob-fill.real { background: linear-gradient(90deg, #00E676, #69F0AE); }
  .prob-val {
    font-family: var(--font-display);
    font-size: 11px; color: var(--text-secondary);
    width: 44px; text-align: right;
  }

  /* ── Stats row ── */
  .stats-row {
    grid-column: 1 / -1;
    display: grid; grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
  }
  .stat-card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 1.25rem 1.5rem;
    transition: border-color 0.2s;
  }
  .stat-card:hover { border-color: var(--border-lit); }
  .stat-card-label {
    font-family: var(--font-display);
    font-size: 10px; letter-spacing: 0.15em;
    color: var(--text-muted); text-transform: uppercase;
    margin-bottom: 8px;
  }
  .stat-card-val {
    font-family: var(--font-display);
    font-size: 1.6rem; font-weight: 700;
    color: var(--cyan); line-height: 1;
    margin-bottom: 4px;
  }
  .stat-card-sub {
    font-size: 12px; color: var(--text-secondary);
  }

  /* ── How it works ── */
  .how-section {
    grid-column: 1 / -1;
    margin-top: 1rem;
  }
  .how-grid {
    display: grid; grid-template-columns: repeat(3, 1fr);
    gap: 1rem; margin-top: 1rem;
  }
  .how-card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 1.5rem;
    transition: border-color 0.2s, transform 0.2s;
  }
  .how-card:hover {
    border-color: var(--border-lit);
    transform: translateY(-2px);
  }
  .how-icon {
    font-size: 1.8rem; margin-bottom: 0.75rem;
  }
  .how-title {
    font-size: 14px; font-weight: 600;
    color: var(--text-primary); margin-bottom: 6px;
  }
  .how-desc {
    font-size: 12px; color: var(--text-secondary);
    line-height: 1.7;
  }
  .how-tag {
    display: inline-block;
    margin-top: 10px;
    font-family: var(--font-display);
    font-size: 10px; padding: 3px 8px;
    border: 1px solid var(--border-lit);
    border-radius: 4px; color: var(--cyan);
    letter-spacing: 0.08em;
  }

  /* ── Heatmap section ── */
  .heatmap-section {
    grid-column: 1 / -1;
  }
  .heatmap-card {
    background: var(--bg-card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 1.5rem;
    margin-top: 1rem;
  }
  .heatmap-grid {
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 1rem; margin-top: 1rem;
  }
  .heatmap-img-wrap {
    border-radius: var(--radius-sm);
    overflow: hidden;
    border: 1px solid var(--border);
    background: var(--bg-surface);
    aspect-ratio: 1;
    display: flex; align-items: center; justify-content: center;
  }
  .heatmap-img {
    width: 100%; height: 100%; object-fit: cover; display: block;
  }
  .heatmap-placeholder {
    font-family: var(--font-display);
    font-size: 11px; color: var(--text-muted);
    letter-spacing: 0.1em; text-align: center; padding: 1rem;
  }
  .heatmap-label {
    font-family: var(--font-display);
    font-size: 10px; color: var(--text-muted);
    letter-spacing: 0.1em; text-align: center;
    margin-top: 8px; text-transform: uppercase;
  }

  /* ── Footer ── */
  .footer {
    border-top: 1px solid var(--border);
    padding: 1.5rem 2rem;
    display: flex; align-items: center; justify-content: space-between;
    background: var(--bg-surface);
  }
  .footer-left {
    font-family: var(--font-display);
    font-size: 11px; color: var(--text-muted);
    letter-spacing: 0.08em;
  }
  .footer-right {
    display: flex; gap: 1.5rem;
  }
  .footer-tag {
    font-family: var(--font-display);
    font-size: 10px; color: var(--text-muted);
    letter-spacing: 0.1em;
  }
  .footer-tag span { color: var(--cyan); }

  /* Responsive */
  @media (max-width: 768px) {
    .main { grid-template-columns: 1fr; padding: 0 1rem 2rem; }
    .result-panel { grid-column: 1; }
    .stats-row { grid-template-columns: repeat(2,1fr); grid-column: 1; }
    .how-grid { grid-template-columns: 1fr; }
    .heatmap-section { grid-column: 1; }
    .how-section { grid-column: 1; }
    .hero-metrics { gap: 1.5rem; }
    .nav-stats { display: none; }
  }
`;

// Animated radial confidence meter SVG
function ConfidenceMeter({ percentage, isReal }) {
  const r = 42;
  const circ = 2 * Math.PI * r;
  const dash = (percentage / 100) * circ;
  const color = isReal ? "#00E676" : "#FF3B5C";

  return (
    <svg width="110" height="110" viewBox="0 0 110 110" className="meter-svg">
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      {/* Track */}
      <circle cx="55" cy="55" r={r} fill="none" stroke="#1E2A35" strokeWidth="8" />
      {/* Progress */}
      <circle
        cx="55" cy="55" r={r}
        fill="none" stroke={color} strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        strokeDashoffset={circ * 0.25}
        filter="url(#glow)"
        style={{ transition: "stroke-dasharray 1s cubic-bezier(0.4,0,0.2,1)" }}
      />
      {/* Center text */}
      <text x="55" y="50" textAnchor="middle"
        fontFamily="Space Mono" fontSize="16" fontWeight="700" fill={color}>
        {Math.round(percentage)}%
      </text>
      <text x="55" y="66" textAnchor="middle"
        fontFamily="Space Grotesk" fontSize="9" fill="#7A8A9A" letterSpacing="1">
        CONFIDENCE
      </text>
    </svg>
  );
}

export default function App() {
  const [file, setFile]       = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError]     = useState(null);
  const inputRef = useRef();

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

    // ── MOCK for demo — remove when backend is connected ──────

    // ── REAL backend call — uncomment when FastAPI is running ──
    const form = new FormData();
    form.append("file", file);
     try {
       const res = await fetch("http://localhost:8000/predict", { method:"POST", body: form });
       const data = await res.json();
       setResult(data);
     } catch(e) {
       setError("Could not connect to backend. Make sure FastAPI is running.");
     } finally { setLoading(false); }
  };

  const isReal   = result?.verdict === "REAL";
  const confPct  = result ? (isReal ? result.real_prob : result.fake_prob) : 0;

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
            <div className="nav-stat">
              <div className="nav-stat-val">98.49%</div>
              <div className="nav-stat-label">Accuracy</div>
            </div>
            <div className="nav-stat">
              <div className="nav-stat-val">0.9990</div>
              <div className="nav-stat-label">AUC-ROC</div>
            </div>
            <div className="nav-stat">
              <div className="nav-stat-val">140K</div>
              <div className="nav-stat-label">Trained On</div>
            </div>
          </div>
          <div className="nav-badge">v1.0 // EfficientNet-B4</div>
        </nav>

        {/* ── Hero ── */}
        <section className="hero">
          <div className="hero-eyebrow">// AI-Powered Forensic Analysis</div>
          <h1 className="hero-title">
            Is that face <span>real</span>?
          </h1>
          <p className="hero-sub">
            Upload any image to detect GAN-generated deepfakes using dual-branch
            spatial and frequency domain analysis.
          </p>
          <div className="hero-metrics">
            <div className="hero-metric">
              <div className="hero-metric-val">98.49%</div>
              <div className="hero-metric-label">Test Accuracy</div>
            </div>
            <div className="metric-divider" />
            <div className="hero-metric">
              <div className="hero-metric-val">0.9990</div>
              <div className="hero-metric-label">AUC-ROC Score</div>
            </div>
            <div className="metric-divider" />
            <div className="hero-metric">
              <div className="hero-metric-val">12</div>
              <div className="hero-metric-label">Epochs Trained</div>
            </div>
            <div className="metric-divider" />
            <div className="hero-metric">
              <div className="hero-metric-val">140K</div>
              <div className="hero-metric-label">Training Images</div>
            </div>
          </div>
        </section>

        {/* ── Main ── */}
        <main className="main">

          {/* Upload panel */}
          <div className="upload-panel">
            <div className="panel-label">INPUT // UPLOAD FACE IMAGE</div>

            {!preview ? (
              <div
                className={`dropzone ${dragOver ? "drag-over" : ""}`}
                onClick={() => inputRef.current.click()}
                onDrop={onDrop}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
              >
                <input ref={inputRef} type="file" accept="image/*"
                  onChange={(e) => handleFile(e.target.files[0])} />
                <div className="dropzone-icon">🔬</div>
                <div className="dropzone-title">Drop image here or click to upload</div>
                <div className="dropzone-sub">JPG, PNG, WEBP supported · Max 10MB</div>
              </div>
            ) : (
              <div className="preview-wrap"
                onClick={() => { if (!loading) inputRef.current.click(); }}>
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

            <button className="analyze-btn"
              onClick={analyze}
              disabled={!file || loading}>
              {loading ? "SCANNING IMAGE..." : "ANALYZE IMAGE"}
            </button>

            {error && (
              <div style={{padding:"10px 14px", background:"var(--red-dim)",
                border:"1px solid var(--red)", borderRadius:"var(--radius-sm)",
                fontSize:"12px", color:"var(--red)", fontFamily:"var(--font-display)"}}>
                {error}
              </div>
            )}
          </div>

          {/* Result panel */}
          <div className="result-panel">
            <div className="panel-label">OUTPUT // ANALYSIS RESULT</div>

            <div className={`verdict-card ${result ? (isReal ? "real" : "fake") : "empty"}`}>
              {!result ? (
                <div className="verdict-empty-text">
                  AWAITING INPUT<br />
                  <span style={{fontSize:"10px", opacity:0.5}}>
                    Upload an image to begin analysis
                  </span>
                </div>
              ) : (
                <>
                  <div className="verdict-header">
                    <span className="verdict-label">FORENSIC VERDICT</span>
                    <span className={`verdict-badge ${isReal ? "real" : "fake"}`}>
                      {result.verdict} DETECTED
                    </span>
                  </div>

                  <div className="meter-wrap">
                    <ConfidenceMeter percentage={confPct} isReal={isReal} />
                    <div className="meter-info">
                      <div className={`meter-verdict ${isReal ? "real" : "fake"}`}>
                        {isReal ? "Authentic" : "Synthetic"}
                      </div>
                      <div className="meter-conf">
                        <span>{confPct}%</span> confidence
                      </div>
                    </div>
                  </div>

                  <div className="prob-bars">
                    <div className="prob-row">
                      <span className="prob-label">FAKE</span>
                      <div className="prob-track">
                        <div className="prob-fill fake"
                          style={{width:`${result.fake_prob}%`}} />
                      </div>
                      <span className="prob-val">{result.fake_prob}%</span>
                    </div>
                    <div className="prob-row">
                      <span className="prob-label">REAL</span>
                      <div className="prob-track">
                        <div className="prob-fill real"
                          style={{width:`${result.real_prob}%`}} />
                      </div>
                      <span className="prob-val">{result.real_prob}%</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Heatmap */}
            <div className="panel-label" style={{marginTop:"0.5rem"}}>GRAD-CAM // ATTENTION MAP</div>
            <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.75rem"}}>
              <div>
                <div className="heatmap-img-wrap">
                  {preview
                    ? <img src={preview} alt="original" className="heatmap-img" />
                    : <div className="heatmap-placeholder">ORIGINAL</div>}
                </div>
                <div className="heatmap-label">Original</div>
              </div>
              <div>
                <div className="heatmap-img-wrap">
                  {result?.heatmap_b64
                    ? <img src={`data:image/jpeg;base64,${result.heatmap_b64}`}
                        alt="heatmap" className="heatmap-img" />
                    : <div className="heatmap-placeholder">
                        {result
                          ? "Connect backend\nfor heatmap"
                          : "HEATMAP"}
                      </div>}
                </div>
                <div className="heatmap-label">Attention Heatmap</div>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="stats-row">
            {[
              { label:"Model Architecture", val:"Dual-Branch", sub:"EfficientNet-B4 + FFT CNN" },
              { label:"Test Accuracy",       val:"98.49%",     sub:"On 20,000 test images" },
              { label:"AUC-ROC Score",       val:"0.9990",     sub:"Near-perfect discrimination" },
              { label:"Training Dataset",    val:"140K",       sub:"50K real · 50K fake faces" },
            ].map((s,i) => (
              <div className="stat-card" key={i}>
                <div className="stat-card-label">{s.label}</div>
                <div className="stat-card-val">{s.val}</div>
                <div className="stat-card-sub">{s.sub}</div>
              </div>
            ))}
          </div>

          {/* How it works */}
          <div className="how-section">
            <div className="panel-label">METHODOLOGY // HOW IT WORKS</div>
            <div className="how-grid">
              {[
                {
                  icon: "🧠",
                  title: "Spatial Analysis (RGB Branch)",
                  desc: "EfficientNet-B4 pretrained on ImageNet extracts deep spatial features — texture inconsistencies, unnatural skin tones, and blending artifacts left by GAN face-swapping algorithms.",
                  tag: "EfficientNet-B4"
                },
                {
                  icon: "📡",
                  title: "Frequency Analysis (FFT Branch)",
                  desc: "A parallel CNN processes FFT frequency maps of the face. GANs leave characteristic high-frequency patterns invisible to the human eye but detectable in the frequency domain.",
                  tag: "Fast Fourier Transform"
                },
                {
                  icon: "🔀",
                  title: "Dual-Branch Fusion",
                  desc: "Features from both branches are concatenated and passed through a fusion classifier with dropout regularization, combining complementary signals for a final real/fake prediction.",
                  tag: "Feature Fusion"
                },
              ].map((h,i) => (
                <div className="how-card" key={i}>
                  <div className="how-icon">{h.icon}</div>
                  <div className="how-title">{h.title}</div>
                  <div className="how-desc">{h.desc}</div>
                  <div className="how-tag">{h.tag}</div>
                </div>
              ))}
            </div>
          </div>

        </main>

        {/* ── Footer ── */}
        <footer className="footer">
          <div className="footer-left">
            DEEPGUARD // FINAL YEAR PROJECT // CSE
          </div>
          <div className="footer-right">
            <div className="footer-tag">Model: <span>EfficientNet-B4</span></div>
            <div className="footer-tag">Framework: <span>PyTorch</span></div>
            <div className="footer-tag">Dataset: <span>140K Real & Fake Faces</span></div>
          </div>
        </footer>

      </div>
    </>
  );
}
