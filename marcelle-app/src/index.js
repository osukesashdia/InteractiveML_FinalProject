import {
  imageUpload,
  mobileNet,
  knnClassifier,
  dataset,
  dataStore,
  datasetBrowser,
  select,
  button,
  text,
  confidencePlot,
  trainingPlot,
  wizard,
} from '@marcellejs/core';
import '@marcellejs/core/dist/marcelle.css';
import { load as loadMobileNet } from '@tensorflow-models/mobilenet';

// ---------------------------------------------------------------------------
// Label set — "Non-alcoholic" is an explicit class so false negatives
// surface as a KNN prediction rather than a gap in the label vocabulary.
// ---------------------------------------------------------------------------
const ALCOHOL_LABELS = [
  // Whiskies
  'Scotch Whisky',
  'Bourbon',
  'Irish Whiskey',
  'Japanese Whisky',
  // Wines
  'Red Wine',
  'White Wine',
  'Rosé Wine',
  'Champagne',
  'Prosecco',
  'Port Wine',
  // Beers
  'Lager',
  'Craft Beer / IPA',
  'Stout',
  // Spirits
  'Vodka',
  'Gin',
  'Tequila',
  'Mezcal',
  'Rum',
  'Brandy / Cognac',
  'Absinthe',
  // Asian spirits
  'Sake',
  'Soju',
  'Baijiu',
  // Other
  'Liqueur',
  'Cider',
  'Non-alcoholic',
];

// Keywords to detect alcohol-related ImageNet labels for false negative detection.
// MobileNet uses ImageNet class names like "wine bottle", "beer glass", etc.
const IMAGENET_ALCOHOL_KEYWORDS = [
  'wine', 'beer', 'whiskey', 'whisky', 'cocktail', 'sake', 'vodka', 'rum',
  'champagne', 'gin', 'tequila', 'mezcal', 'liquor', 'malt', 'lager', 'stout',
  'brandy', 'cognac', 'cider', 'soju', 'bourbon', 'prosecco', 'port', 'absinthe',
];

const HIGH_CONF = 0.85;
const MED_CONF = 0.60;
const PRETRAINED_TOP_K = 20; // candidates fetched from ImageNet before filtering

// Raw TF.js MobileNet instance — loaded after featureExtractor finishes,
// so we can call classify(image, PRETRAINED_TOP_K) instead of the hardcoded top-5.
let rawMobileNet = null;

// ---------------------------------------------------------------------------
// Core ML components
// ---------------------------------------------------------------------------
const featureExtractor = mobileNet({ version: 2, alpha: 1 });
const classifier = knnClassifier({ k: 3 });

// Training dataset — persisted in localStorage so examples survive a page refresh
const store = dataStore('localStorage');
const trainingSet = dataset('alcohol-training', store);

// ---------------------------------------------------------------------------
// Training UI components
// ---------------------------------------------------------------------------
const trainingInput = imageUpload({ width: 224, height: 224 });
const labelSelect = select(ALCOHOL_LABELS, 'Whisky');
const saveBtn = button('Save Example');
const trainBtn = button('Train Model');
const trainingBrowser = datasetBrowser(trainingSet);
const trainProgress = trainingPlot(classifier);
const trainStatus = text('<em>Upload an image, select a label, then click Save Example.</em>');
const trainStepStatus = text(
  '<em>Click "Train Model" when you have added enough examples (at least 1 per label).</em>'
);

// ---------------------------------------------------------------------------
// Prediction UI components
// ---------------------------------------------------------------------------
const predInput = imageUpload({ width: 224, height: 224 });
const pretrainedBtn = button('Quick Identify (Pretrained)');
const knnIdentifyBtn = button('Identify with KNN');
const predStatus = text(
  '<em>Upload a beverage photo, then click one of the identify buttons below.</em>'
);

// ---------------------------------------------------------------------------
// Review: pretrained model result components
// ---------------------------------------------------------------------------
const pretrainedSectionLabel = text(
  '<hr><strong>Pretrained Model (MobileNet / ImageNet)</strong>' +
  '<br><small>Instant prediction — no training needed. Uses ImageNet labels.</small>'
);
const pretrainedTierMsg = text('<em>Run "Quick Identify" to see pretrained results.</em>');
const pretrainedWarning = text('');

// ---------------------------------------------------------------------------
// Review: KNN result components
// ---------------------------------------------------------------------------
const knnSectionLabel = text(
  '<hr><strong>🎓 Your Custom KNN Model</strong>' +
  '<br><small>Trained on your labeled examples. Uses your custom labels.</small>'
);
const tierMessage = text('<em>Run "Identify with KNN" to see custom results.</em>');
const warningPanel = text('');

// ---------------------------------------------------------------------------
// Decision result panel
// ---------------------------------------------------------------------------
const resultPanel = text('');

// Always-visible explainer on the Review page: what FP and FN mean for non-experts
const fpFnExplainer = text(`
  <div style="background:#f0f4ff;border:1px solid #b0c4de;padding:14px;border-radius:8px;margin-bottom:4px">
    <strong>Understanding AI errors — what can go wrong?</strong>
    <table style="width:100%;border-collapse:collapse;margin-top:8px;font-size:0.84em">
      <tr style="background:#e8f0fe">
        <th style="text-align:left;padding:5px 8px">Error type</th>
        <th style="text-align:left;padding:5px 8px">AI says</th>
        <th style="text-align:left;padding:5px 8px">Reality</th>
        <th style="text-align:left;padding:5px 8px">Risk</th>
      </tr>
      <tr>
        <td style="padding:6px 8px;border-bottom:1px solid #ddd">False Positive</td>
        <td style="padding:6px 8px;border-bottom:1px solid #ddd">Has alcohol</td>
        <td style="padding:6px 8px;border-bottom:1px solid #ddd">No alcohol</td>
        <td style="padding:6px 8px;border-bottom:1px solid #ddd;color:#e67e22">Medium</td>
      </tr>
      <tr>
        <td style="padding:6px 8px"><strong>False Negative</strong></td>
        <td style="padding:6px 8px">No alcohol</td>
        <td style="padding:6px 8px">Has alcohol</td>
        <td style="padding:6px 8px;color:#c0392b"><strong>HIGH — if under 18</strong></td>
      </tr>
    </table>
    <p style="margin:8px 0 0;font-size:0.8em;color:#555">
      The confidence score shows how certain the model is.
      Lower confidence = higher chance of error. <strong>You decide what to do next.</strong>
    </p>
  </div>`);

// Summary shown at the top of Step 5 — updated dynamically from the latest prediction
const decisionSummary = text(
  '<em>No prediction yet — go back to Step 3 to identify a beverage first.</em>'
);

// ---------------------------------------------------------------------------
// Reactive image tracking
// ---------------------------------------------------------------------------
let latestTrainingImage = null;
let latestTrainingThumbnail = null;
let latestPredImage = null;

trainingInput.$images.subscribe((img) => {
  latestTrainingImage = img;
  trainStatus.$value.set(
    `<span style="color:#27ae60">✔ Image ready.</span> ` +
    `Select a label and click <strong>Save Example</strong>.`
  );
});

trainingInput.$thumbnails.subscribe((thumb) => {
  latestTrainingThumbnail = thumb;
});

predInput.$images.subscribe((img) => {
  latestPredImage = img;
  predStatus.$value.set(
    `<span style="color:#27ae60">✔ Image ready.</span> ` +
    `Choose an identify method below.`
  );
});

// ---------------------------------------------------------------------------
// MobileNet loading status + rawMobileNet setup
// After Marcelle's model loads (and saves to IndexedDB), load our own instance
// so we can call classify(image, PRETRAINED_TOP_K) instead of the hardcoded top-5.
// ---------------------------------------------------------------------------
featureExtractor.$loading.subscribe(async (loading) => {
  if (loading) {
    trainStatus.$value.set('<em>Loading AI model (first run takes a moment)...</em>');
    return;
  }
  if (rawMobileNet) return;
  try {
    // Reuse the model Marcelle already cached in IndexedDB — no extra download.
    rawMobileNet = await loadMobileNet({
      version: 2, alpha: 1,
      modelUrl: 'indexeddb://mobilenet-v2-1',
    });
  } catch {
    // IndexedDB miss on very first load — fall back to CDN.
    rawMobileNet = await loadMobileNet({ version: 2, alpha: 1 });
  }
});

// ---------------------------------------------------------------------------
// Step 2: Save labeled training examples
// ---------------------------------------------------------------------------
saveBtn.$click.subscribe(async () => {
  if (featureExtractor.$loading.value) {
    trainStatus.$value.set('<em>Please wait — the AI model is still loading.</em>');
    return;
  }
  if (!latestTrainingImage) {
    trainStatus.$value.set(
      '<span style="color:#e67e22">⚠ No image selected. Please upload an image first.</span>'
    );
    return;
  }
  trainStatus.$value.set('<em>Saving example...</em>');
  const feats = await featureExtractor.process(latestTrainingImage);
  const label = labelSelect.$value.value;
  await trainingSet.create({ x: feats, y: label, thumbnail: latestTrainingThumbnail });
  const count = trainingSet.$count.value;
  trainStatus.$value.set(
    `<span style="color:#27ae60">✔ Saved as <strong>${label}</strong>. ` +
    `${count} example${count !== 1 ? 's' : ''} total.</span> ` +
    `Upload another image to add more.`
  );
});

// ---------------------------------------------------------------------------
// Step 3: Train KNN
// ---------------------------------------------------------------------------
trainBtn.$click.subscribe(async () => {
  const count = trainingSet.$count.value ?? 0;
  if (count === 0) {
    trainStepStatus.$value.set(
      '<span style="color:#e67e22">⚠ No examples saved yet. ' +
      'Go back to Step 1 and add labeled images before training.</span>'
    );
    return;
  }
  trainStepStatus.$value.set('<em>Training...</em>');
  await classifier.train(trainingSet);
  trainStepStatus.$value.set(
    `<span style="color:#27ae60">✔ Model trained on ${count} example${count !== 1 ? 's' : ''}. ` +
    `Move to Step 3 to identify a beverage.</span>`
  );
});

// ---------------------------------------------------------------------------
// Visual confidence meter — three-zone bar (Low / Medium / High)
// ---------------------------------------------------------------------------
function buildConfidenceMeter(conf) {
  const pct = Math.round(conf * 100);
  const barWidth = Math.max(2, pct);
  let zoneColor, zoneLabel, zoneAdvice;
  if (conf >= HIGH_CONF) {
    zoneColor = '#27ae60';
    zoneLabel = 'HIGH CONFIDENCE';
    zoneAdvice = 'The model is confident in this prediction.';
  } else if (conf >= MED_CONF) {
    zoneColor = '#e67e22';
    zoneLabel = 'MODERATE CONFIDENCE';
    zoneAdvice = 'The model is uncertain — compare both results and check the physical label.';
  } else {
    zoneColor = '#c0392b';
    zoneLabel = 'LOW CONFIDENCE';
    zoneAdvice = 'The model is guessing. Do not rely on this result — check the physical label.';
  }
  return `
    <div style="margin:8px 0 4px">
      <div style="display:flex;justify-content:space-between;font-size:0.73em;color:#999;margin-bottom:2px">
        <span>0%</span><span style="margin-left:auto;margin-right:6px">60%</span><span>85%</span><span style="margin-left:auto">100%</span>
      </div>
      <div style="position:relative;height:16px;background:#e0e0e0;border-radius:4px;overflow:hidden">
        <div style="position:absolute;left:0;top:0;height:100%;width:${barWidth}%;background:${zoneColor};border-radius:4px"></div>
        <div style="position:absolute;left:60%;top:0;width:2px;height:100%;background:rgba(0,0,0,0.2)"></div>
        <div style="position:absolute;left:85%;top:0;width:2px;height:100%;background:rgba(0,0,0,0.2)"></div>
      </div>
      <p style="margin:4px 0 1px;color:${zoneColor};font-weight:bold;font-size:0.88em">
        ${pct}% — ${zoneLabel}
      </p>
      <p style="margin:0;font-size:0.82em;color:#555">${zoneAdvice}</p>
    </div>`;
}

// ---------------------------------------------------------------------------
// Tier message — prediction label + confidence meter
// ---------------------------------------------------------------------------
function buildTierMessage(topLabel, topConf, isFalseNeg) {
  const displayLabel = isFalseNeg ? '<em>Non-alcoholic</em>' : `<em>${topLabel}</em>`;
  const flagColor = isFalseNeg ? '#c0392b' : '#333';
  return `
    <div style="margin:6px 0">
      <p style="margin:0 0 4px;color:${flagColor};font-weight:bold">
        ${isFalseNeg ? '⚠' : '→'} Predicted: ${displayLabel}
      </p>
      ${buildConfidenceMeter(topConf)}
    </div>`;
}

// ---------------------------------------------------------------------------
// False negative / low-confidence alert — severity scales with error type.
// Call with isFalseNeg=true for Non-alcoholic predictions (highest risk).
// ---------------------------------------------------------------------------
function buildFalseNegAlert(isFalseNeg, topConf, topLabel) {
  if (isFalseNeg) {
    return `
      <div style="border:3px solid #c0392b;padding:14px;border-radius:8px;margin-top:10px;background:#fff8f8">
        <p style="margin:0 0 8px;color:#c0392b;font-weight:bold;font-size:1em">
          🚨 FALSE NEGATIVE RISK
        </p>
        <p style="margin:0 0 8px;font-size:0.88em">
          The AI predicts <strong>no alcohol</strong> — but it may be wrong.
          A <strong>false negative</strong> means the model missed alcohol that is actually present.
          This is the highest-risk error type, especially if you are under 18.
        </p>
        <div style="background:#ffeaea;padding:10px;border-radius:6px;font-size:0.88em">
          <strong>What to do:</strong><br>
          1. Find the label on the bottle or can.<br>
          2. Look for <strong>ABV</strong> or <em>Alcohol by Volume</em>.<br>
          3. Any value <strong>above 0.5%</strong> means it contains alcohol.<br>
          4. If you cannot read the label, ask a store assistant.
        </div>
      </div>`;
  }
  if (topConf < MED_CONF) {
    return `
      <div style="border:2px solid #e67e22;padding:12px;border-radius:8px;margin-top:10px;background:#fffbf0">
        <p style="margin:0 0 6px;color:#e67e22;font-weight:bold">⚠ Low confidence — verify before acting</p>
        <p style="margin:0;font-size:0.85em">
          The model is not confident in the prediction <em>${topLabel}</em>.
          Check the physical label before relying on this result.
        </p>
      </div>`;
  }
  return '';
}

// ---------------------------------------------------------------------------
// Pretrained model stream — uses mobileNet.predict() directly (ImageNet labels)
// No training required. Works immediately on any beverage photo.
// ---------------------------------------------------------------------------

// Maps raw ImageNet alcohol labels → cleaner category names shown in the chart.
// Entries that map to the same category are merged (probabilities summed).
const IMAGENET_LABEL_MAP = {
  'wine bottle':      'Wine',
  'wine rack':        'Wine',
  'red wine':         'Red Wine',
  'beer bottle':      'Beer',
  'beer glass':       'Beer',
  'malt liquor':      'Beer / Malt',
  'whiskey jug':      'Whisky / Bourbon',
  'cocktail shaker':  'Cocktail / Liqueur',
  'champagne':        'Champagne / Sparkling',
  'sake':             'Sake',
  'vodka':            'Vodka',
  'gin':              'Gin',
  'rum':              'Rum',
  'tequila':          'Tequila',
  'cognac':           'Brandy / Cognac',
  'brandy':           'Brandy / Cognac',
  'absinthe':         'Absinthe',
  'cider':            'Cider',
  'stout':            'Stout',
  'lager':            'Lager',
  'champagne glass':  'Champagne / Sparkling',
};

function remapImageNetLabel(raw) {
  const lower = raw.toLowerCase();
  for (const [key, mapped] of Object.entries(IMAGENET_LABEL_MAP)) {
    if (lower.includes(key)) return mapped;
  }
  return raw; // keep original if no mapping found
}

// Filter top-K ImageNet results to alcohol-specific labels, remap to clean names,
// and merge entries that share the same mapped category.
// Everything non-alcohol is collapsed into a single "Other / Non-beverage" bar.
function buildAlcoholFocusedPrediction(results) {
  const isAlcohol = (name) =>
    IMAGENET_ALCOHOL_KEYWORDS.some((kw) => name.toLowerCase().includes(kw));

  const confidences = {};
  let otherConf = 0;

  for (const r of results) {
    if (isAlcohol(r.className)) {
      const label = remapImageNetLabel(r.className);
      confidences[label] = (confidences[label] ?? 0) + r.probability;
    } else {
      otherConf += r.probability;
    }
  }
  if (otherConf > 0.001) confidences['Other / Non-beverage'] = otherConf;

  // Top label: highest-confidence alcohol category
  const alcoholEntries = Object.entries(confidences).filter(([k]) => k !== 'Other / Non-beverage');
  const topLabel = alcoholEntries.length > 0
    ? alcoholEntries.sort((a, b) => b[1] - a[1])[0][0]
    : results[0].className;

  return { label: topLabel, confidences };
}

const $pretrainedPredictions = pretrainedBtn.$click
  .filter(() => {
    if (!latestPredImage) {
      predStatus.$value.set(
        '<span style="color:#e67e22">⚠ No image selected. Please upload a photo first.</span>'
      );
      return false;
    }
    return true;
  })
  .map(() => {
    predStatus.$value.set('<em>Running pretrained model...</em>');
    if (rawMobileNet) {
      return rawMobileNet
        .classify(latestPredImage, PRETRAINED_TOP_K)
        .then(buildAlcoholFocusedPrediction);
    }
    return featureExtractor.predict(latestPredImage); // fallback: top-5 if rawMobileNet not ready
  })
  .awaitPromises();

const pretrainedPlot = confidencePlot($pretrainedPredictions);

$pretrainedPredictions.subscribe((pred) => {
  predStatus.$value.set('');
  latestPrediction = { ...pred, source: 'pretrained' };

  const topLabel = pred.label;
  const topConf = pred.confidences[topLabel] ?? 0;
  // False negative for pretrained: none of the top labels contain alcohol keywords
  const anyAlcohol = Object.keys(pred.confidences).some((lbl) =>
    IMAGENET_ALCOHOL_KEYWORDS.some((kw) => lbl.toLowerCase().includes(kw))
  );
  const isFalseNeg = !anyAlcohol;

  pretrainedTierMsg.$value.set(buildTierMessage(topLabel, topConf, isFalseNeg));
  pretrainedWarning.$value.set(buildFalseNegAlert(isFalseNeg, topConf, topLabel));
});

// ---------------------------------------------------------------------------
// KNN model stream — uses featureExtractor.process() + classifier.predict()
// Requires training examples first.
// ---------------------------------------------------------------------------
const $knnPredictions = knnIdentifyBtn.$click
  .filter(() => {
    if (!latestPredImage) {
      predStatus.$value.set(
        '<span style="color:#e67e22">⚠ No image selected. Please upload a photo first.</span>'
      );
      return false;
    }
    return true;
  })
  .map(() => {
    predStatus.$value.set('<em>Running KNN model...</em>');
    return featureExtractor.process(latestPredImage);
  })
  .awaitPromises()
  .map((feats) => classifier.predict(feats))
  .awaitPromises();

const knnPlot = confidencePlot($knnPredictions);

$knnPredictions.subscribe((pred) => {
  predStatus.$value.set('');
  latestPrediction = { ...pred, source: 'knn' };

  const topLabel = pred.label;
  const topConf = pred.confidences[topLabel] ?? 0;
  const isFalseNeg = topLabel === 'Non-alcoholic';

  tierMessage.$value.set(buildTierMessage(topLabel, topConf, isFalseNeg));
  warningPanel.$value.set(buildFalseNegAlert(isFalseNeg, topConf, topLabel));
});

// Track the most recent prediction from either model for the Accept button
let latestPrediction = null;

// ---------------------------------------------------------------------------
// Gemini free-tier model cascade — tried in order, auto-skipped on rate limit.
// Add or reorder models here to change the fallback priority.
// ---------------------------------------------------------------------------
const GEMINI_MODELS = [
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-2.5-flash-lite-preview-09-2025',
  'gemini-2.5-flash-lite',
  "gemini-2.5-flash",
  "gemini-2.5-pro",
  "gemini-3-flash-preview",
  "gemini-3-pro-preview"
];

async function callGemini(prompt, apiKey) {
  const BASE = 'https://generativelanguage.googleapis.com/v1beta/models/';
  let lastError = null;
  for (const model of GEMINI_MODELS) {
    const response = await fetch(`${BASE}${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4 },
      }),
    });

    // Skip to next model if rate-limited, overloaded, or model not found
    if (response.status === 429 || response.status === 503 || response.status === 404) {
      lastError = `${model} unavailable (${response.status})`;
      continue;
    }

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body?.error?.message ?? `Gemini API error ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    return { text, model };
  }
  throw new Error(
    `All Gemini models unavailable. Last: ${lastError}. Please try again in a moment.`
  );
}

// ---------------------------------------------------------------------------
// LLM enrichment — Gemini API
// Signature is frozen: enrichBeverage(label, confidence, source)
// Set VITE_GEMINI_API_KEY in your .env to activate (see .env.example).
// Restart the dev server after adding the key so Vite picks it up.
// ---------------------------------------------------------------------------
async function enrichBeverage(label, confidence, source) {
  const sourceLabel = source === 'pretrained'
    ? 'Pretrained MobileNet (ImageNet)'
    : 'Custom KNN Model';

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    return `
      <div style="padding:12px;background:#f8f9fa;border-radius:6px">
        <strong>Classification:</strong> ${label}<br>
        <strong>Confidence:</strong> ${Math.round(confidence * 100)}%<br>
        <strong>Model used:</strong> ${sourceLabel}<br><br>
        <em>⚠ Gemini API key not configured.
        Copy <code>.env.example</code> to <code>.env</code>, add your key,
        then <strong>restart the dev server</strong>.</em>
      </div>`;
  }

  const prompt =
    `You are an expert on alcoholic beverages. A user photographed a beverage ` +
    `identified as "${label}" (${Math.round(confidence * 100)}% confidence).\n\n` +
    `Provide concise, accessible information in plain HTML (no markdown, no code fences). ` +
    `Use this exact format:\n\n` +
    `<strong>Category:</strong> [main category and subcategory]<br>\n` +
    `<strong>Origin:</strong> [country or region of origin]<br>\n` +
    `<strong>Typical ABV:</strong> [alcohol by volume range, e.g. "40–43%"]<br>\n` +
    `<strong>Description:</strong> [2–3 sentences about character and flavour]<br>\n` +
    `<strong>Food Pairings:</strong> [2–3 food suggestions]<br>\n` +
    `<strong>Safe Consumption:</strong> [one responsible drinking note]\n\n` +
    `Do not add any text before or after the HTML.`;

  const { text: generatedText, model: usedModel } = await callGemini(prompt, apiKey);

  return `
    <div style="padding:12px;background:#f8f9fa;border-radius:6px">
      <strong>Classification:</strong> ${label}<br>
      <strong>Confidence:</strong> ${Math.round(confidence * 100)}%<br>
      <strong>Model used:</strong> ${sourceLabel} + Gemini (${usedModel})
      <hr style="margin:8px 0">
      ${generatedText}
    </div>`;
}

// ---------------------------------------------------------------------------
// Wizard layout — 6 pages
// ---------------------------------------------------------------------------
const app = wizard();

// Page 1: Welcome
app
  .page()
  .title('Beverage Identifier')
  .description(
    'This app helps you identify unfamiliar alcoholic beverages from photos. ' +
    'No language skills needed — just upload images.\n\n' +
    'Two AI models are available:\n' +
    '• Quick Identify uses a pretrained model — works immediately, no setup.\n' +
    '• Custom KNN uses your own labeled examples — more accurate for specific beverages.\n\n' +
    'Follow the steps to get started.'
  );

// Page 2: Label training examples (for KNN)
app
  .page()
  .title('Step 1 — Label Examples (for KNN)')
  .description(
    'To use the Custom KNN model, upload photos of beverages and label each one. ' +
    'Add at least 3 photos per label for better accuracy. ' +
    'Skip this step if you only want to use Quick Identify.'
  )
  .use(trainingInput)
  .use(trainStatus)
  .use([labelSelect, saveBtn])
  .use(text('<strong>Your labeled examples:</strong>'))
  .use(trainingBrowser);

// Page 3: Train the model
app
  .page()
  .title('Step 2 — Train the KNN Model')
  .description(
    'Click "Train Model" to teach the AI using your labeled examples. ' +
    'Training happens in your browser — no data is sent anywhere. ' +
    'Skip this step if you only want to use Quick Identify.'
  )
  .use(trainStepStatus)
  .use(trainBtn)
  .use(trainProgress);

// Page 4: Upload a beverage + choose model
app
  .page()
  .title('Step 3 — Identify a Beverage')
  .description(
    'Upload a photo of the beverage you want to identify, then choose a model.'
  )
  .use(predInput)
  .use(predStatus)
  .use([pretrainedBtn, knnIdentifyBtn]);

// Page 5: Review results from both models
app
  .page()
  .title('Step 4 — Review Results')
  .description(
    'Before you decide, review the results carefully. ' +
    'The confidence meter shows how certain the AI is — you have the final say.'
  )
  .use(fpFnExplainer)
  .use(pretrainedSectionLabel)
  .use(pretrainedPlot)
  .use(pretrainedTierMsg)
  .use(pretrainedWarning)
  .use(knnSectionLabel)
  .use(knnPlot)
  .use(tierMessage)
  .use(warningPanel);

// Page 6: Decision + result
const acceptBtn = button('I Accept — Show Beverage Details');
const retryBtn = button('Retake Photo');
const flagBtn = button('Flag as Uncertain');

acceptBtn.$click.subscribe(async () => {
  if (!latestPrediction) return;
  const { label, confidences, source } = latestPrediction;
  const topConf = confidences[label] ?? 0;
  const isFalseNeg = source === 'knn'
    ? label === 'Non-alcoholic'
    : !Object.keys(confidences).some((lbl) =>
      IMAGENET_ALCOHOL_KEYWORDS.some((kw) => lbl.toLowerCase().includes(kw))
    );
  const isBlocked = isFalseNeg || topConf < MED_CONF;

  if (isBlocked) {
    resultPanel.$value.set(
      '<p style="color:#c0392b"><strong>Detailed information is unavailable</strong> — ' +
      'the model is not confident enough or the beverage appears non-alcoholic. ' +
      'Please verify using the physical label.</p>'
    );
  } else {
    resultPanel.$value.set('<em>🔍 Looking up beverage information...</em>');
    try {
      const html = await enrichBeverage(label, topConf, source);
      resultPanel.$value.set(html);
    } catch (err) {
      resultPanel.$value.set(
        `<p style="color:#c0392b">⚠ Could not load beverage details: ${err.message}.<br>` +
        `Check your API key and internet connection.</p>`
      );
    }
  }
});

retryBtn.$click.subscribe(() => {
  resultPanel.$value.set('');
  tierMessage.$value.set('<em>Run "Identify with KNN" to see custom results.</em>');
  warningPanel.$value.set('');
  pretrainedTierMsg.$value.set('<em>Run "Quick Identify" to see pretrained results.</em>');
  pretrainedWarning.$value.set('');
  predStatus.$value.set(
    '<em>Upload a beverage photo, then click one of the identify buttons below.</em>'
  );
  app.$current.set(3); // 0-indexed: page 4 = index 3
});

flagBtn.$click.subscribe(() => {
  resultPanel.$value.set(
    '<div style="border:2px solid #e67e22;padding:12px;border-radius:6px">' +
    '<strong>Result flagged as uncertain.</strong><br>' +
    'We recommend checking the physical label for accurate alcohol content information.' +
    '</div>'
  );
});

app
  .page()
  .title('Step 5 — Your Decision')
  .description(
    'You are in control — the AI result is a suggestion, not a fact.\n\n' +
    '• Accept if you are confident the prediction is correct.\n' +
    '• Flag as Uncertain if you are unsure — no details will be shown.\n' +
    '• Retake Photo to start over with a clearer image.'
  )
  .use(decisionSummary)
  .use([acceptBtn, retryBtn, flagBtn])
  .use(resultPanel);

// ---------------------------------------------------------------------------
// Decision summary — rebuilt each time the user navigates to Step 5
// ---------------------------------------------------------------------------
function updateDecisionSummary() {
  if (!latestPrediction) return;
  const { label, confidences, source } = latestPrediction;
  const topConf = confidences[label] ?? 0;
  const isFalseNeg = source === 'knn'
    ? label === 'Non-alcoholic'
    : !Object.keys(confidences).some((lbl) =>
      IMAGENET_ALCOHOL_KEYWORDS.some((kw) => lbl.toLowerCase().includes(kw))
    );
  const sourceLabel = source === 'pretrained'
    ? 'Pretrained MobileNet (ImageNet)'
    : 'Custom KNN Model';
  decisionSummary.$value.set(`
    <div style="padding:12px;background:#f8f9fa;border-radius:8px;border:1px solid #dee2e6;margin-bottom:12px">
      <p style="margin:0 0 2px"><strong>Model:</strong> ${sourceLabel}</p>
      <p style="margin:0 0 8px"><strong>Prediction:</strong> ${isFalseNeg ? '<em>Non-alcoholic</em>' : `<em>${label}</em>`}</p>
      ${buildConfidenceMeter(topConf)}
      ${buildFalseNegAlert(isFalseNeg, topConf, label)}
      <p style="margin:10px 0 0;font-size:0.82em;color:#666;font-style:italic">
        This prediction is a starting point, not a conclusion.
        You are responsible for the final decision.
      </p>
    </div>`);
}

// Rebuild the summary whenever the user arrives on the Decision page (index 5)
app.$current.subscribe((idx) => {
  if (idx === 5) updateDecisionSummary();
});

app.show();
