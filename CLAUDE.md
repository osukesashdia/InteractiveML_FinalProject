# InteractiveML — Alcohol Recognition & Recommendation System

## Project Overview

This project is an interactive machine learning application that helps users identify and learn about alcoholic beverages through image classification. Rather than a black-box pipeline, the system is designed around **user agency**: the user is guided through a multi-step identification process where they can inspect, question, and act on model predictions — not just receive them.

A user photographs an unfamiliar bottle or drink. The system does not simply return a single answer. Instead, it walks the user through the classification result, communicates the model's confidence, makes uncertainty visible, and lets the user confirm, reject, or refine the prediction before any information is presented as fact.

The core pipeline combines:
1. An **image classification model** — identifies the alcohol type or product from a photo, along with a confidence score
2. A **false negative / false positive visualization layer** — surfaces model uncertainty in a way non-expert users can understand and act on
3. A **large language model (LLM)** — only invoked after the user has reviewed and accepted the classification result, generating enriched context (category, alcohol content/proof, background, food pairings) personalized to the user's taste profile
4. An **active learning correction loop** — if the prediction is wrong, the user selects the correct label on the Decision page; the correction is saved to the training set and the KNN model retrains immediately
5. A **taste profile** — user-set preferences (strength, sweetness, flavor) persisted in localStorage and injected into the Gemini prompt to personalize descriptions and food pairings

### Safety Concern: False Negatives
A critical risk in this system is a **false negative on alcohol content** — the model classifying an alcoholic beverage as non-alcoholic. If an underage user (under 18) is using the app and receives an incorrect "no alcohol" prediction, the consequences could be serious. The design must treat this as a high-priority failure mode:
- The system should communicate uncertainty clearly before the user acts on a prediction
- Low-confidence predictions must be flagged visually and never presented as definitive
- When the model is uncertain, the user should be prompted to seek additional verification rather than rely solely on the AI output

## Application Domain

- **Domain:** Consumer-facing AI / Interactive Machine Learning
- **Context of use:** In-store or on-the-go, when a user encounters an unfamiliar alcoholic beverage
- **Image classification role:** Detect and classify the beverage type (e.g., whisky, sake, craft beer, wine) from a photo, serving as the structured input to downstream LLM reasoning

## Users & Stakeholders

### Primary Users
Non-native language speakers — international students, travelers, and immigrants — who cannot reliably read local alcohol labels, categories, or descriptions. The system removes the language barrier by relying on visual input rather than text comprehension.

### Secondary Stakeholders
- **Retailers / alcohol shops** — benefit from customers who can independently understand products, reducing friction at point of sale
- **Educators / researchers** — interested in cross-cultural accessibility applications of interactive ML systems

## Workflow

The workflow is multi-step and user-driven. The user has agency at each decision point rather than passively receiving a final answer.

```
Step 0 — Welcome page: user sets Taste Profile
         (Strength · Sweetness · Flavor — saved to localStorage)
       │
       ▼
Step 1 — User captures photo
       │
       ▼
Step 2 — Image Classification Model
         outputs: predicted label + confidence score
       │
       ▼
Step 3 — Uncertainty Visualization
         Show confidence level, top-N candidate labels,
         false positive / false negative risk indicators
         in plain, non-expert language
       │
       ▼
Step 4 — User Decision Point
         ┌─────────────────────────────────┐
         │ Accept prediction               │──► Step 5
         │ Reject / retake photo           │──► Step 1
         │ Flag as uncertain               │──► show safety warning
         └─────────────────────────────────┘
         │
         ▼
         Active Learning Panel (always visible on Decision page)
         User selects correct label → saved to trainingSet
         KNN retrains immediately (human-in-the-loop feedback)
       │
       ▼
Step 5 — LLM Enrichment (only after user accepts)
         generates: category, ABV/proof, background, food pairings
         personalized using the user's Taste Profile
       │
       ▼
Step 6 — User receives output
         accessible, image-forward, language-agnostic presentation
         "Personalized for: Mild · Sweet · Fruity" tag visible
```

Key principle: the LLM enrichment step is **gated** — it only runs after the user has reviewed and accepted the classification. The system never silently passes a low-confidence or uncertain prediction downstream.

## Technical Direction

- **Frontend:** JavaScript — [Marcelle](https://marcelle.dev) v0.6.5 (`marcelle-app/`)
- **Run:** `cd marcelle-app && npm install && npm run dev`
- **ML runtime:** TensorFlow.js (browser-side, no server required for classification)
- **Feature extraction:** MobileNet v2 via `mobileNet({ version: 2, alpha: 1 })` — extracts feature vectors from 224×224 images
- **Classifier:** KNN (`k=3`) trained interactively by the user on labeled MobileNet features
- **Training persistence:** `dataStore('localStorage')` — labeled examples survive page refresh
- **Uncertainty visualization:** `confidencePlot` (built-in Marcelle) + `text()` components for tier messages and false-negative safety panel
- **LLM integration:** live via Gemini API in `enrichBeverage(label, confidence, source)` — model cascade tries `gemini-2.0-flash` → `gemini-2.0-flash-lite` → … (rate-limit fallback). Key set in `marcelle-app/.env` as `VITE_GEMINI_API_KEY`. Signature is frozen.
- **Taste Profile:** three `select()` components on the Welcome page (Strength · Sweetness · Flavor), auto-saved to `localStorage` under key `beverage-taste-profile`. Read inside `enrichBeverage()` and injected as a natural-language preamble into the Gemini prompt. Output shows a "Personalized for:" tag.
- **Active learning correction loop:** on the Decision page (Step 5), user picks the correct label via `correctionLabelSelect` and clicks **Save Correction & Retrain**. Calls `featureExtractor.process(latestPredImage)` → `trainingSet.create(...)` → `classifier.train(trainingSet)`. Correction persisted in localStorage alongside regular training examples.
- **UI:** Marcelle `wizard()` — 6-page flow (welcome + taste profile → label examples → train → identify → review → decide)
- **Python code** (`core/`, `ui/`, `app.py`) — kept for reference, not part of the active frontend

## Uncertainty & Safety Design

This is a core design concern, not an afterthought.

- **False negative (alcohol misclassified as non-alcohol):** highest severity — must trigger a visible warning regardless of confidence level
- **False positive (non-alcohol misclassified as alcohol):** lower severity but still shown to the user
- Confidence thresholds:
  - High confidence (>85%): show result with confidence indicator, allow user to proceed
  - Medium confidence (60–85%): show top-3 candidates, ask user to confirm
  - Low confidence (<60%): show explicit uncertainty warning, recommend physical label check, do not invoke LLM
- Visualizations must be interpretable by non-experts — use plain language, icons, and color coding rather than raw probability numbers

## Development Notes

- **Entry point:** `marcelle-app/src/index.js` — all app logic in one file (Marcelle reactive streams + wizard)
- The user decision point is not optional — do not skip or auto-accept predictions
- To add a new beverage label: add to `ALCOHOL_LABELS` array in `index.js`; the correction loop and enrichment prompt pick it up automatically
- `enrichBeverage(label, confidence, source)` signature is frozen — do not change the call signature
- The interpretability layer (confidence tiers + false-negative panel) is the core contribution; do not remove it to simplify the UI
- Marcelle components are reactive streams — use `.subscribe()` and `.set()` rather than polling `.value` directly
- **Taste profile storage key:** `'beverage-taste-profile'` in `localStorage` — fields: `strength`, `sweetness`, `flavor`
- **Correction loop:** `latestPredImage` and `latestPredThumbnail` are captured from `predInput.$images` / `predInput.$thumbnails` and used by the correction handler. Both must be non-null for a correction to save.
- **Gemini model cascade:** defined in `GEMINI_MODELS` array — add or reorder models there to change fallback priority. 429/503/404 responses cause automatic fallback to the next model.
