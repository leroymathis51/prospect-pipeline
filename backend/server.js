const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
require("dotenv").config();

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "2mb" }));

const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";
const API_KEY = process.env.ANTHROPIC_API_KEY;

// Prompts systeme pour chaque agent
const SYSTEMS = {
  1: "Tu es un agent de sourcing commercial B2B. Utilise la recherche web pour trouver des prospects reels.\n\nProcess : fais 2-3 recherches, collecte les infos, puis retourne UNIQUEMENT ce JSON sans markdown :\n{\"prospects\": [{\"entreprise\": \"nom\", \"secteur\": \"secteur\", \"adresse\": \"adresse ou null\", \"telephone\": \"tel ou null\", \"site_web\": \"url ou null\", \"email\": \"email ou null\", \"description\": \"description courte\", \"source_url\": \"url source\"}]}\n\nJSON complet et ferme obligatoire. Rien apres le JSON.",
  2: "Tu es un agent expert en enrichissement de donnees de contact B2B.\nRetourne UNIQUEMENT un JSON valide sans markdown ni backticks :\n{\"prospects\": [{\"entreprise\": \"...\", \"secteur\": \"...\", \"telephone\": \"reprends si connu sinon null\", \"site_web\": \"reprends si connu sinon null\", \"email_probable\": \"deduis le format le plus probable ex: contact@nom.fr\", \"linkedin_entreprise\": \"URL page LinkedIn probable\", \"score_qualification\": \"entier de 1 a 10\", \"raison_score\": \"justification en une phrase\", \"decision_maker\": \"titre du decideur probable\"}]}",
  3: "Tu es un stratege commercial B2B senior.\nRetourne UNIQUEMENT un JSON valide sans markdown ni backticks :\n{\"prospects\": [{\"entreprise\": \"...\", \"secteur\": \"...\", \"douleurs_probables\": [\"douleur 1\", \"douleur 2\", \"douleur 3\"], \"angle_attaque\": \"angle principal en 2-3 phrases percutantes\", \"accroche_personnalisee\": \"phrase d accroche ultra-personnalisee\", \"objections_anticipees\": [\"objection 1\", \"objection 2\"], \"levier_principal\": \"levier emotionnel ou rationnel le plus fort\", \"timing_ideal\": \"moment ideal pour contacter\"}]}",
  4: "Tu es un expert en copywriting B2B et cold outreach. Redige des messages qui sonnent humains, pas IA.\nRetourne UNIQUEMENT un JSON valide sans markdown ni backticks :\n{\"prospects\": [{\"entreprise\": \"...\", \"email_cold\": {\"objet\": \"objet percutant moins de 55 caracteres\", \"corps\": \"email 120-180 mots ton direct et humain CTA simple\"}, \"script_tel\": \"accroche telephonique en 2-3 phrases naturelles\", \"message_google\": \"message court via Google Business 60 mots max\", \"relance_j5\": \"relance J+5 angle different 70 mots max\"}]}"
};

// Route principale : proxy vers l'API Anthropic
app.post("/api/agent", async (req, res) => {
  const { step, serviceDesc, sourcingQuery, context } = req.body;

  if (!API_KEY) {
    return res.status(500).json({ error: "Cle API Anthropic manquante. Verifie le fichier .env" });
  }
  if (!step || !serviceDesc) {
    return res.status(400).json({ error: "Parametres manquants : step et serviceDesc requis" });
  }

  // Construction du message utilisateur selon l'etape
  let userContent;
  if (step === 1) {
    userContent = "Service a vendre : " + serviceDesc + "\n\nDemande : " + sourcingQuery + "\n\nFais tes recherches web puis retourne le JSON avec les prospects trouves.";
  } else {
    userContent = "Service a vendre : " + serviceDesc + "\n\nDonnees :\n" + JSON.stringify(context, null, 2);
  }

  // Body de la requete Anthropic
  const body = {
    model: "claude-sonnet-4-20250514",
    max_tokens: 4000,
    system: SYSTEMS[step],
    messages: [{ role: "user", content: userContent }]
  };

  // Agent 1 seulement : activer le web search
  if (step === 1) {
    body.tools = [{ type: "web_search_20250305", name: "web_search" }];
  }

  try {
    const response = await fetch(ANTHROPIC_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (data.error) {
      return res.status(500).json({ error: data.error.message });
    }

    // Extraire le JSON de la reponse
    const text = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("");
    const clean = text.replace(/```json|```/g, "").trim();
    const match = clean.match(/\{[\s\S]*\}/);

    if (!match) {
      return res.status(500).json({ error: "L'agent " + step + " n'a pas retourne de JSON valide" });
    }

    const parsed = JSON.parse(match[0]);
    res.json(parsed);

  } catch (err) {
    res.status(500).json({ error: "Erreur serveur : " + err.message });
  }
});

// Route de sante
app.get("/health", (req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log("Serveur demarre sur le port " + PORT);
});
