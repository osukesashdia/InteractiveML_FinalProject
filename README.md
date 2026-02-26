# InteractiveML — Alcohol Beverage Recognition

An interactive machine learning app that identifies alcoholic beverages from photos.
Built with [Marcelle](https://marcelle.dev), TensorFlow.js, and Gemini.

---

## Prerequisites

- [Node.js](https://nodejs.org) v18 or later
- npm (bundled with Node)
- A Gemini API key (free) — only needed for beverage descriptions

---

## Setup

```bash
# 1. Enter the app directory
cd marcelle-app

# 2. Install dependencies
npm install
```

### Gemini API key (optional but recommended)

The app works without a key — classification runs entirely in the browser.
A key is only required for the LLM enrichment step (category, ABV, food pairings).

Get a free key at <https://aistudio.google.com/app/apikey>, then open `marcelle-app/.env` and set:

```
VITE_GEMINI_API_KEY=your_key_here
```

---

## Run

```bash
# From inside marcelle-app/
npm run dev
```

Open the URL printed in the terminal (default: `http://localhost:5173`).

---

## How to Use

The app is a 5-step wizard. Use the **Next / Back** buttons to move between steps.

### Step 1 — Label Examples *(optional, for KNN)*
Upload photos of beverages and assign a label to each.
Add at least 3 photos per label for reliable results.
Examples are saved in your browser (`localStorage`) and survive a page refresh.
Skip this step if you only want the pretrained Quick Identify.

### Step 2 — Train the KNN Model *(optional)*
Click **Train Model** to build a custom classifier from your labeled examples.
Training runs in the browser — no data leaves your device.

### Step 3 — Identify a Beverage
Upload a photo of the beverage you want to identify, then choose a method:

| Button | Model | Requires training? |
|---|---|---|
| Quick Identify (Pretrained) | MobileNet / ImageNet | No |
| Identify with KNN | Your custom KNN | Yes |

### Step 4 — Review Results
Both model results are shown with a **confidence meter** and plain-language warnings:

- **Green (>85%)** — high confidence, model is reliable
- **Orange (60–85%)** — moderate confidence, compare both results
- **Red (<60%)** — low confidence, check the physical label

A **False Negative Risk** alert appears if the model predicts "Non-alcoholic" — the highest-risk error type.

### Step 5 — Your Decision
You control what happens next:

| Action | Result |
|---|---|
| **Accept** | Calls Gemini to generate category, ABV, origin, and food pairings |
| **Retake Photo** | Resets and goes back to Step 3 |
| **Flag as Uncertain** | Records uncertainty — no details shown |

#### Active Learning — Teach the AI
If the prediction was wrong, use the **"Was the prediction wrong? Teach the AI."** panel at the bottom of Step 5:

1. Select the correct label from the dropdown
2. Click **Save Correction & Retrain**

The image is added to your training set and the KNN model retrains immediately.
Corrections persist across page refreshes.

---

## Project Structure

```
InteractiveML/
├── marcelle-app/
│   ├── src/
│   │   └── index.js       # All app logic — ML pipeline, UI, reactive streams
│   ├── index.html
│   ├── package.json
│   └── .env               # VITE_GEMINI_API_KEY goes here
├── report/
│   ├── report.tex          # Course report source (LaTeX)
│   ├── sample.bib          # Bibliography entries
│   ├── media/              # Figures/screenshots used in the report
│   └── report.pdf          # Compiled report output
└── README.md
```

---

## Report (LaTeX)

The project report is in `report/report.tex` and uses BibTeX via `report/sample.bib`.

### Compile the report

```bash
cd report
latexmk -pdf -interaction=nonstopmode report.tex
```

The compiled file is written to `report/report.pdf`.

To clean LaTeX build artifacts:

```bash
cd report
latexmk -c
```

---

## Build for production

```bash
# From inside marcelle-app/
npm run build    # outputs to marcelle-app/dist/
npm run preview  # serves the production build locally
```
