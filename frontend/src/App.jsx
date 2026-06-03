import { useState } from "react";

// URL du backend - change cette valeur une fois deploye
const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:3001";

const STEPS = [
  { id: 1, label: "Sourcing web", color: "#7F77DD", light: "#EEEDFE" },
  { id: 2, label: "Extraction contacts", color: "#1D9E75", light: "#E1F5EE" },
  { id: 3, label: "Strategie d'attaque", color: "#D85A30", light: "#FAECE7" },
  { id: 4, label: "Copywriting", color: "#378ADD", light: "#E6F1FB" },
];

async function callBackend(step, serviceDesc, sourcingQuery, context) {
  const res = await fetch(API_BASE + "/api/agent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ step, serviceDesc, sourcingQuery, context })
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data;
}

function CopyBtn({ text }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 1500); }}
      style={{ fontSize: 10, padding: "2px 7px", borderRadius: 4, border: "1px solid #ddd", background: ok ? "#EAF3DE" : "#fff", color: ok ? "#3B6D11" : "#999", cursor: "pointer", marginLeft: 6 }}
    >
      {ok ? "OK" : "Copier"}
    </button>
  );
}

function Field({ label, value, color, isArray, copyable }) {
  if (!value && value !== 0) return null;
  const display = Array.isArray(value) ? null : String(value);
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 10, fontWeight: 600, color, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 3, display: "flex", alignItems: "center" }}>
        {label}{copyable && display && <CopyBtn text={display} />}
      </div>
      {isArray ? (
        <ul style={{ margin: 0, paddingLeft: 16 }}>
          {(Array.isArray(value) ? value : []).map((v, i) => <li key={i} style={{ fontSize: 13, color: "#333", marginBottom: 2 }}>{v}</li>)}
        </ul>
      ) : (
        <div style={{ fontSize: 13, color: "#333", lineHeight: 1.55, background: copyable ? "#f8f8f8" : "transparent", padding: copyable ? "8px 10px" : 0, borderRadius: 6, whiteSpace: "pre-wrap" }}>
          {display}
        </div>
      )}
    </div>
  );
}

function ProspectCard({ prospect, step }) {
  const [open, setOpen] = useState(false);
  const s = STEPS[step - 1];

  const body = () => {
    if (step === 1) return (
      <div>
        <Field label="Secteur" value={prospect.secteur} color={s.color} />
        <Field label="Adresse" value={prospect.adresse} color={s.color} />
        <Field label="Telephone" value={prospect.telephone} color={s.color} />
        <Field label="Site web" value={prospect.site_web} color={s.color} />
        <Field label="Email trouve" value={prospect.email} color={s.color} />
        <Field label="Description" value={prospect.description} color={s.color} />
        {prospect.source_url && <a href={prospect.source_url} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: s.color }}>Voir la source</a>}
      </div>
    );
    if (step === 2) return (
      <div>
        <Field label="Telephone" value={prospect.telephone} color={s.color} />
        <Field label="Site web" value={prospect.site_web} color={s.color} />
        <Field label="Email probable" value={prospect.email_probable} color={s.color} />
        <Field label="LinkedIn" value={prospect.linkedin_entreprise} color={s.color} />
        <Field label="Decideur probable" value={prospect.decision_maker} color={s.color} />
        <Field label={"Score " + prospect.score_qualification + "/10"} value={prospect.raison_score} color={s.color} />
      </div>
    );
    if (step === 3) return (
      <div>
        <Field label="Angle d'attaque" value={prospect.angle_attaque} color={s.color} />
        <Field label="Accroche personnalisee" value={prospect.accroche_personnalisee} color={s.color} copyable />
        <Field label="Levier principal" value={prospect.levier_principal} color={s.color} />
        <Field label="Douleurs" value={prospect.douleurs_probables} color={s.color} isArray />
        <Field label="Objections" value={prospect.objections_anticipees} color={s.color} isArray />
        <Field label="Timing ideal" value={prospect.timing_ideal} color={s.color} />
      </div>
    );
    if (step === 4) return (
      <div>
        <Field label={"Email - Objet : " + (prospect.email_cold?.objet || "")} value={prospect.email_cold?.corps} color={s.color} copyable />
        <Field label="Script telephonique" value={prospect.script_tel} color={s.color} copyable />
        <Field label="Message Google Business" value={prospect.message_google} color={s.color} copyable />
        <Field label="Relance J+5" value={prospect.relance_j5} color={s.color} copyable />
      </div>
    );
  };

  return (
    <div style={{ background: "#fff", border: "1px solid #e8e8e8", borderRadius: 10, marginBottom: 8, overflow: "hidden" }}>
      <div onClick={() => setOpen(!open)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 14px", cursor: "pointer", background: open ? s.light : "#fff", transition: "background 0.2s" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: "50%", background: s.light, border: "1.5px solid " + s.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: s.color }}>
            {(prospect.entreprise || "?")[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: "#1a1a1a" }}>{prospect.entreprise}</div>
            <div style={{ fontSize: 11, color: "#aaa" }}>{prospect.secteur || prospect.decision_maker || ""}</div>
          </div>
        </div>
        <span style={{ color: s.color, fontSize: 18, display: "inline-block", transform: open ? "rotate(90deg)" : "none", transition: "transform 0.2s" }}>{">"}</span>
      </div>
      {open && <div style={{ padding: "12px 16px", borderTop: "1px solid " + s.color + "20" }}>{body()}</div>}
    </div>
  );
}

const EXAMPLES = [
  "Source moi 5 restaurants gastronomiques a Reims susceptibles d'etre interesses",
  "Trouve 6 hotels 3-4 etoiles a Reims pour ma prospection",
  "Cherche 5 agences immobilieres a Reims centre-ville",
  "Identifie 5 salles de sport a Reims",
];

export default function App() {
  const [serviceDesc, setServiceDesc] = useState("");
  const [sourcingQuery, setSourcingQuery] = useState("");
  const [currentStep, setCurrentStep] = useState(0);
  const [stepStatus, setStepStatus] = useState({});
  const [results, setResults] = useState({});
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const run = async () => {
    if (!serviceDesc.trim() || !sourcingQuery.trim()) { setError("Remplis les deux champs."); return; }
    setError(""); setRunning(true); setDone(false); setResults({}); setStepStatus({});
    let context = null;
    for (let step = 1; step <= 4; step++) {
      setCurrentStep(step);
      setStepStatus(p => ({ ...p, [step]: "running" }));
      try {
        const data = await callBackend(step, serviceDesc, sourcingQuery, context);
        context = data;
        setResults(p => ({ ...p, [step]: data }));
        setStepStatus(p => ({ ...p, [step]: "done" }));
      } catch (e) {
        setError("Erreur agent " + step + " : " + e.message);
        setStepStatus(p => ({ ...p, [step]: "error" }));
        setRunning(false);
        return;
      }
    }
    setRunning(false); setCurrentStep(0); setDone(true);
  };

  const reset = () => { setRunning(false); setCurrentStep(0); setResults({}); setStepStatus({}); setDone(false); setError(""); };

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", maxWidth: 720, margin: "0 auto", padding: "24px 16px" }}>
      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 21, fontWeight: 600, color: "#111", margin: "0 0 4px" }}>Pipeline IA de prospection</h1>
        <p style={{ fontSize: 13, color: "#777", margin: 0 }}>L'agent 1 source tes prospects sur le web. Les agents 2, 3, 4 qualifient, strategisent et redigent.</p>
      </div>

      <div style={{ display: "flex", gap: 5, marginBottom: 22 }}>
        {STEPS.map(s => {
          const st = stepStatus[s.id];
          const active = currentStep === s.id;
          return (
            <div key={s.id} style={{ flex: 1 }}>
              <div style={{ height: 4, borderRadius: 2, marginBottom: 5, background: st === "done" ? s.color : active ? s.color + "55" : "#eee", transition: "background 0.3s" }} />
              <div style={{ fontSize: 10, fontWeight: 500, color: st === "done" ? s.color : active ? s.color : "#ccc" }}>
                {s.label} {active ? "..." : st === "done" ? "OK" : ""}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: "grid", gap: 14, marginBottom: 12 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#444", display: "block", marginBottom: 5 }}>Ton service / offre</label>
          <textarea value={serviceDesc} onChange={e => setServiceDesc(e.target.value)}
            placeholder="Ex : agence marketing et communication, creation de sites web, gestion reseaux sociaux..."
            style={{ width: "100%", minHeight: 60, padding: "10px 12px", fontSize: 13, border: "1px solid #ddd", borderRadius: 8, resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" }} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#444", display: "block", marginBottom: 5 }}>
            Demande de sourcing <span style={{ fontWeight: 400, color: "#999" }}>(l'agent 1 cherchera sur le web)</span>
          </label>
          <textarea value={sourcingQuery} onChange={e => setSourcingQuery(e.target.value)}
            placeholder="Ex : Source moi 8 restaurants a Reims susceptibles d'etre interesses par mon offre"
            style={{ width: "100%", minHeight: 60, padding: "10px 12px", fontSize: 13, border: "1.5px solid #7F77DD", borderRadius: 8, resize: "vertical", fontFamily: "inherit", boxSizing: "border-box", background: "#FDFCFF" }} />
          <div style={{ marginTop: 7, display: "flex", flexWrap: "wrap", gap: 5 }}>
            {EXAMPLES.map((ex, i) => (
              <button key={i} onClick={() => setSourcingQuery(ex)}
                style={{ fontSize: 11, padding: "3px 9px", borderRadius: 20, border: "1px solid #C8C5F0", background: "#EEEDFE", color: "#534AB7", cursor: "pointer" }}>
                {ex.slice(0, 40)}...
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && <div style={{ background: "#FFF0EE", border: "1px solid #F09595", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#A32D2D", marginBottom: 12 }}>{error}</div>}

      <div style={{ display: "flex", gap: 10, marginBottom: 28 }}>
        <button onClick={run} disabled={running}
          style={{ flex: 1, padding: "13px 0", borderRadius: 8, border: "none", background: running ? "#bbb" : "#7F77DD", color: "#fff", fontSize: 14, fontWeight: 600, cursor: running ? "not-allowed" : "pointer" }}>
          {running ? ("Agent " + currentStep + "/4 - " + STEPS[currentStep - 1].label + "...") : "Lancer le pipeline"}
        </button>
        {(running || done) && (
          <button onClick={reset} style={{ padding: "13px 18px", borderRadius: 8, border: "1px solid #ddd", background: "#fff", color: "#555", fontSize: 14, cursor: "pointer" }}>Reset</button>
        )}
      </div>

      {STEPS.map(s => {
        const data = results[s.id];
        if (!data || !data.prospects || !data.prospects.length) return null;
        return (
          <div key={s.id} style={{ marginBottom: 26 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <div style={{ background: s.light, color: s.color, border: "1px solid " + s.color + "50", borderRadius: 20, padding: "3px 12px", fontSize: 12, fontWeight: 600 }}>
                Agent {s.id} - {s.label}
              </div>
              <span style={{ fontSize: 12, color: "#bbb" }}>{data.prospects.length} prospect(s)</span>
            </div>
            {data.prospects.map((p, i) => <ProspectCard key={i} prospect={p} step={s.id} />)}
          </div>
        );
      })}

      {done && (
        <div style={{ background: "#EAF3DE", border: "1px solid #97C459", borderRadius: 10, padding: "14px 18px", fontSize: 13, color: "#3B6D11", fontWeight: 500, textAlign: "center" }}>
          Pipeline termine ! Clique sur chaque fiche pour voir les messages prets a envoyer.
        </div>
      )}
    </div>
  );
}
