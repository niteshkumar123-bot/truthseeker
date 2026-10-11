import { FormEvent, type ReactNode, useEffect, useMemo, useState } from "react";
import {
  Activity, ArrowDownRight, ArrowRight, BadgeCheck, BookOpen, Check, ChevronDown,
  CircleAlert, Copy, ExternalLink, FileSearch, FlaskConical, History,
  Link2, LoaderCircle, Search, ShieldCheck, Sparkles, ThumbsDown, ThumbsUp, X,
} from "lucide-react";
import { investigate } from "./api";
import type { ResearchReport, ResearchSource, Verdict } from "./types";

const examples = [
  "Does vitamin C prevent the common cold?",
  "Are electric vehicles better for the environment?",
  "Can humans see the Great Wall of China from space?",
];

type HistoryItem = { query: string; verdict: Verdict; timestamp: number };
const HISTORY_KEY = "truthseeker.history.v1";

function loadHistory(): HistoryItem[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    return Array.isArray(value) ? value.slice(0, 8) as HistoryItem[] : [];
  } catch { return []; }
}

function getDomain(url: string) {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; }
}

function sourceFor(report: ResearchReport, id: string): ResearchSource | undefined {
  return report.sources.find((source) => source.id === id);
}

function verdictClass(verdict: Verdict) {
  return verdict.toLowerCase().replace(/ /g, "-");
}

function App() {
  const [query, setQuery] = useState("");
  const [report, setReport] = useState<ResearchReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>(loadHistory);
  const [copied, setCopied] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 8))); } catch { /* Storage may be unavailable. */ }
  }, [history]);

  const reportText = useMemo(() => {
    if (!report) return "";
    const evidence = (label: string, items: ResearchReport["supportingEvidence"]) =>
      `${label}\n${items.length ? items.map((item) => {
        const source = sourceFor(report, item.sourceId);
        return `- ${item.explanation}${source ? ` [${source.id}] ${source.url}` : ""}`;
      }).join("\n") : "- None identified."}`;
    return [
      `TruthSeeker Research Report`,
      `Claim: ${report.claim}`,
      `Verdict: ${report.verdict}`,
      `Confidence estimate: ${report.confidence}/100 (not a calibrated probability)`,
      `Summary: ${report.summary}`,
      evidence("Supporting evidence", report.supportingEvidence),
      evidence("Contradicting evidence", report.contradictingEvidence),
      `Limitations:\n${report.limitations.map((item) => `- ${item}`).join("\n") || "- None reported."}`,
      `Sources:\n${report.sources.map((source) => `[${source.id}] ${source.title} — ${source.url}`).join("\n") || "- No sources."}`,
    ].join("\n\n");
  }, [report]);

  async function handleSubmit(event?: FormEvent, submittedQuery = query) {
    event?.preventDefault();
    const cleaned = submittedQuery.trim();
    if (cleaned.length < 8) {
      setError("Enter a claim or question with at least 8 characters.");
      return;
    }
    setQuery(cleaned);
    setError("");
    setReport(null);
    setLoading(true);
    try {
      const result = await investigate(cleaned);
      setReport(result);
      setHistory((old) => [{ query: cleaned, verdict: result.verdict, timestamp: Date.now() }, ...old.filter((item) => item.query !== cleaned)].slice(0, 8));
      window.setTimeout(() => document.getElementById("report")?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function copyText(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      window.setTimeout(() => setCopied(""), 1800);
    } catch {
      setError("Clipboard access was blocked by your browser.");
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" aria-label="TruthSeeker home" onClick={() => { setReport(null); setError(""); }}>
          <span className="brand-mark"><ShieldCheck size={21} /></span>
          <span>truth<span className="brand-light">seeker</span><small>RESEARCH STUDIO</small></span>
        </a>
        <nav className="topnav" aria-label="Main navigation">
          <a href="#how-it-works">How it works</a>
          <a href="#methodology">Methodology</a>
          <button className="history-toggle" onClick={() => setShowHistory((value) => !value)}><History size={16} /> History <ChevronDown size={14} /></button>
        </nav>
      </header>

      {showHistory && (
        <aside className="history-popover" aria-label="Recent research">
          <div className="history-head"><strong>Recent research</strong><button aria-label="Close history" onClick={() => setShowHistory(false)}><X size={16}/></button></div>
          {history.length === 0 ? <p className="muted small">Your recent searches will appear here.</p> : history.map((item) => (
            <button className="history-item" key={`${item.timestamp}-${item.query}`} onClick={() => { setShowHistory(false); void handleSubmit(undefined, item.query); }}>
              <span>{item.query}</span><small>{item.verdict} · {new Date(item.timestamp).toLocaleDateString()}</small>
            </button>
          ))}
          {history.length > 0 && <button className="clear-history" onClick={() => setHistory([])}>Clear history</button>}
        </aside>
      )}

      <main>
        <section className="hero">
          <div className="eyebrow"><span className="pulse-dot" /> AI-POWERED RESEARCH & VERIFICATION</div>
          <h1>Look closer.<br/><span>Know what holds up.</span></h1>
          <p className="hero-copy">Investigate claims with web research and AI-assisted evidence analysis. Every report connects its conclusions to sources you can inspect.</p>

          <form className="search-card" onSubmit={(event) => void handleSubmit(event)}>
            <label htmlFor="claim-input">What would you like to investigate?</label>
            <div className="search-field">
              <Search size={20} aria-hidden="true" />
              <textarea
                id="claim-input"
                rows={2}
                maxLength={1000}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Enter a claim or question to investigate..."
                aria-describedby="query-help"
              />
              {query && <button type="button" className="clear-input" aria-label="Clear query" onClick={() => setQuery("")}><X size={17}/></button>}
            </div>
            <div className="search-footer">
              <span id="query-help" className="input-hint">{query.length}/1000 characters · Be specific for better results</span>
              <button className="primary-button" type="submit" disabled={loading || query.trim().length < 8}>
                {loading ? <><LoaderCircle className="spin" size={17}/> Investigating</> : <>Investigate claim <ArrowRight size={17}/></>}
              </button>
            </div>
          </form>

          <div className="examples">
            <span>TRY AN EXAMPLE</span>
            {examples.map((example) => <button key={example} onClick={() => { setQuery(example); void handleSubmit(undefined, example); }} disabled={loading}>{example}<ArrowDownRight size={13}/></button>)}
          </div>
          {error && <div className="error-banner" role="alert"><CircleAlert size={18}/><span>{error}</span><button onClick={() => setError("")} aria-label="Dismiss error"><X size={16}/></button></div>}
        </section>

        {loading && (
          <section className="loading-panel" aria-live="polite">
            <div className="loader-orbit"><LoaderCircle className="spin" size={28}/></div>
            <div><h2>Building your evidence brief</h2><p>Searching the web, reviewing retrieved sources, and synthesizing findings.</p></div>
            <div className="loading-steps"><span className="step-active"><Search size={15}/> Retrieve sources</span><span><Sparkles size={15}/> Analyze evidence</span><span><BadgeCheck size={15}/> Validate citations</span></div>
          </section>
        )}

        {report && !loading && <section id="report" className="report-section">
          <div className="report-heading">
            <div><div className="eyebrow"><FileSearch size={14}/> RESEARCH REPORT</div><h2>Evidence brief</h2><p className="report-claim">“{report.claim}”</p></div>
            <button className="secondary-button" onClick={() => void copyText(reportText, "report")}><Copy size={16}/>{copied === "report" ? "Copied report" : "Copy report"}</button>
          </div>

          <div className="verdict-card">
            <div className={`verdict-icon ${verdictClass(report.verdict)}`}>
              {report.verdict === "Supported" ? <ThumbsUp size={22}/> : report.verdict === "Contradicted" ? <ThumbsDown size={22}/> : report.verdict === "Partially Supported" ? <Activity size={22}/> : <FlaskConical size={22}/>}
            </div>
            <div className="verdict-main"><span className="section-label">ASSESSMENT</span><h3>{report.verdict}</h3><p>{report.summary}</p></div>
            <div className="confidence"><span>AI confidence estimate</span><strong>{report.confidence}<small>/100</small></strong><div className="confidence-track"><span style={{ width: `${report.confidence}%` }}/></div><small>Not a calibrated probability</small></div>
          </div>

          <div className="evidence-grid">
            <EvidencePanel title="What supports it" icon={<ThumbsUp size={17}/>} tone="positive" items={report.supportingEvidence} report={report}/>
            <EvidencePanel title="What challenges it" icon={<ThumbsDown size={17}/>} tone="negative" items={report.contradictingEvidence} report={report}/>
          </div>

          <section className="sources-panel">
            <div className="panel-heading"><div><span className="section-label">RETRIEVED REFERENCES</span><h3>Sources to inspect <span className="count-pill">{report.sources.length}</span></h3></div><span className="source-note"><Link2 size={14}/> Original URLs</span></div>
            {report.sources.length === 0 ? <p className="muted">No usable sources were returned for this query.</p> : <div className="source-list">
              {report.sources.map((source) => <article className="source-card" key={source.id}>
                <div className="source-id">{source.id}</div><div className="source-content">
                  <div className="source-domain">{getDomain(source.url)}{source.publishedDate ? <span> · {source.publishedDate}</span> : null}</div>
                  <a className="source-title" href={source.url} target="_blank" rel="noopener noreferrer">{source.title || source.url}<ExternalLink size={14}/></a>
                  <p>{source.snippet || "No snippet was provided by the search provider."}</p>
                </div>
                <button className="icon-button" aria-label={`Copy citation for ${source.title}`} onClick={() => void copyText(`[${source.id}] ${source.title} — ${source.url}`, source.id)}>{copied === source.id ? <Check size={16}/> : <Copy size={16}/>}</button>
              </article>)}
            </div>}
          </section>

          <section className="limitations-panel"><div className="limitations-icon"><CircleAlert size={18}/></div><div><h3>Limitations & context</h3><ul>{(report.limitations.length ? report.limitations : ["AI analysis may miss context. Open the original sources and independently assess their quality."]).map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ul></div></section>
          <p className="disclaimer"><ShieldCheck size={15}/> AI-assisted research, not a final authority. Verify important claims against primary sources and qualified experts.</p>
        </section>}

        {!report && !loading && <section className="feature-strip" id="how-it-works">
          <div className="feature-intro"><span className="section-label">A CLEARER WAY TO RESEARCH</span><h2>From claim to context.</h2><p>Follow the evidence trail instead of taking an answer at face value.</p></div>
          <div className="feature-card"><span className="feature-number">01</span><div className="feature-icon"><Search size={19}/></div><h3>Retrieve</h3><p>Search the web for relevant references and evidence snippets.</p></div>
          <div className="feature-card"><span className="feature-number">02</span><div className="feature-icon"><Sparkles size={19}/></div><h3>Assess</h3><p>Compare supporting and contradicting information with AI.</p></div>
          <div className="feature-card"><span className="feature-number">03</span><div className="feature-icon"><BookOpen size={19}/></div><h3>Inspect</h3><p>Open the original sources and judge the evidence yourself.</p></div>
        </section>}

        <section className="methodology" id="methodology"><div className="method-icon"><FlaskConical size={20}/></div><div><h3>Evidence first. Certainty second.</h3><p>TruthSeeker uses retrieval-augmented generation: web results provide the evidence context for AI analysis. Search ranking is not a trust score, and an AI verdict is not proof. Conflicting or insufficient evidence should remain visible.</p></div></section>
      </main>
      <footer><a className="footer-brand" href="#"><ShieldCheck size={17}/> TruthSeeker</a><span>Research thoughtfully. Verify independently.</span><span className="footer-status"><span/> Gemini + Tavily workflow</span></footer>
    </div>
  );
}

function EvidencePanel({ title, icon, tone, items, report }: {
  title: string; icon: ReactNode; tone: "positive" | "negative";
  items: ResearchReport["supportingEvidence"]; report: ResearchReport;
}) {
  return <section className={`evidence-panel ${tone}`}><div className="panel-heading"><h3>{icon}{title}</h3><span className="count-pill">{items.length}</span></div>
    {items.length === 0 ? <p className="empty-evidence">No clear {tone === "positive" ? "supporting" : "contradicting"} evidence was identified in the retrieved sources.</p> :
      <div className="evidence-items">{items.map((item, index) => {
        const source = sourceFor(report, item.sourceId);
        return <article className="evidence-item" key={`${item.sourceId}-${index}`}><p>{item.explanation}</p>{source && <a href={source.url} target="_blank" rel="noopener noreferrer" className="evidence-source"><span>{source.id}</span>{source.title}<ExternalLink size={12}/></a>}</article>;
      })}</div>}
  </section>;
}

export default App;