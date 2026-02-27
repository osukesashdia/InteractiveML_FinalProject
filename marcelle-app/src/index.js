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
const loadDatasetBtn = button('Load Kaggle Dataset');
const datasetStatus = text('');
const trainingBrowser = datasetBrowser(trainingSet);
const trainProgress = trainingPlot(classifier);
const trainStatus = text(
  `<div style="padding:10px 14px;background:#f8f9fa;border-radius:10px;border:1px solid #e0e0e0;font-size:0.9em;color:#666">
    <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#667eea;margin-right:4px;vertical-align:middle"></span>
    Upload an image, select a label, then click <strong>Save Example</strong>.
  </div>`
);
const trainStepStatus = text(
  `<div style="padding:12px 16px;background:linear-gradient(135deg,#e8f5e9,#f1f8e9);border-radius:10px;border:1px solid #c8e6c9;font-size:0.9em;color:#555">
    <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#27ae60;margin-right:4px;vertical-align:middle"></span>
    Click <strong>Train Model</strong> when you have added enough examples (at least 1 per label you want to recognise).
  </div>`
);

// ---------------------------------------------------------------------------
// Prediction UI components
// ---------------------------------------------------------------------------
const predInput = imageUpload({ width: 224, height: 224 });
const pretrainedBtn = button('Quick Identify (Pretrained)');
const knnIdentifyBtn = button('Identify with KNN');
const predStatus = text(
  `<div style="padding:12px;background:#f8f9fa;border-radius:10px;border:1px solid #e0e0e0;text-align:center;color:#666">
    <span style="display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;font-weight:700;font-size:14px">MOD</span><br>
    <span style="font-size:0.9em;margin-top:6px;display:inline-block">Upload a beverage photo, then choose an identification method below.</span>
  </div>`
);

// ---------------------------------------------------------------------------
// Review: pretrained model result components
// ---------------------------------------------------------------------------
const pretrainedSectionLabel = text(
  `<div style="margin-top:8px;padding:12px 16px;background:linear-gradient(135deg,#667eea22,#764ba222);border-radius:10px;border-left:4px solid #667eea">
    <span style="display:inline-block;width:10px;height:10px;border-radius:3px;background:#667eea;vertical-align:middle;margin-right:4px"></span><strong style="color:#4a5ea8">Pretrained Model</strong>
    <span style="display:block;font-size:0.82em;color:#666;margin-top:2px">MobileNet / ImageNet — instant prediction, no training needed.</span>
  </div>`
);
const pretrainedTierMsg = text('<div style="padding:8px 12px;color:#888;font-style:italic;font-size:0.88em">Run "Quick Identify" on Step 3 to see results here.</div>');
const pretrainedWarning = text('');

// ---------------------------------------------------------------------------
// Review: KNN result components
// ---------------------------------------------------------------------------
const knnSectionLabel = text(
  `<div style="margin-top:16px;padding:12px 16px;background:linear-gradient(135deg,#27ae6022,#2ecc7122);border-radius:10px;border-left:4px solid #27ae60">
    <span style="display:inline-block;width:10px;height:10px;border-radius:3px;background:#27ae60;vertical-align:middle;margin-right:4px"></span><strong style="color:#1e8449">Your Custom KNN Model</strong>
    <span style="display:block;font-size:0.82em;color:#666;margin-top:2px">Trained on your labeled examples — uses your custom beverage labels.</span>
  </div>`
);
const tierMessage = text('<div style="padding:8px 12px;color:#888;font-style:italic;font-size:0.88em">Run "Identify with KNN" on Step 3 to see results here.</div>');
const warningPanel = text('');

// ---------------------------------------------------------------------------
// Decision result panel
// ---------------------------------------------------------------------------
const resultPanel = text('');

// Always-visible explainer on the Review page: what FP and FN mean for non-experts
const fpFnExplainer = text(`
  <div style="background:linear-gradient(135deg,#f0f4ff,#e8eef8);border:1px solid #b0c4de;padding:18px 20px;border-radius:12px;margin-bottom:8px;box-shadow:0 1px 4px rgba(0,0,0,0.04)">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
      <span style="display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:50%;background:#4a6fa5;color:#fff;font-weight:700;font-size:12px">i</span>
      <strong style="font-size:1.02em;color:#2c3e50">Understanding AI Errors</strong>
    </div>
    <table style="width:100%;border-collapse:separate;border-spacing:0;margin-top:4px;font-size:0.84em;border-radius:8px;overflow:hidden;border:1px solid #d0d8e8">
      <tr style="background:#dfe6f0">
        <th style="text-align:left;padding:8px 12px;font-weight:600">Error Type</th>
        <th style="text-align:left;padding:8px 12px;font-weight:600">AI Says</th>
        <th style="text-align:left;padding:8px 12px;font-weight:600">Reality</th>
        <th style="text-align:left;padding:8px 12px;font-weight:600">Risk Level</th>
      </tr>
      <tr style="background:#fff">
        <td style="padding:10px 12px;border-bottom:1px solid #e8ecf0"><span style="display:inline-block;padding:1px 6px;border-radius:4px;background:#fff3e0;color:#e67e22;font-size:0.82em;font-weight:700;margin-right:4px">FP</span> False Positive</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e8ecf0">Has alcohol</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e8ecf0">No alcohol</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e8ecf0"><span style="background:#fff3e0;color:#e67e22;padding:2px 8px;border-radius:10px;font-weight:600;font-size:0.88em">Medium</span></td>
      </tr>
      <tr style="background:#fff8f8">
        <td style="padding:10px 12px"><strong><span style="display:inline-block;padding:1px 6px;border-radius:4px;background:#fde8e8;color:#c0392b;font-size:0.82em;font-weight:700;margin-right:4px">FN</span> False Negative</strong></td>
        <td style="padding:10px 12px">No alcohol</td>
        <td style="padding:10px 12px">Has alcohol</td>
        <td style="padding:10px 12px"><span style="background:#fde8e8;color:#c0392b;padding:2px 8px;border-radius:10px;font-weight:700;font-size:0.88em">HIGH</span></td>
      </tr>
    </table>
    <p style="margin:12px 0 0;font-size:0.82em;color:#555;line-height:1.5">
      The confidence score shows how certain the model is.
      Lower confidence = higher chance of error. <strong>You decide what to do next.</strong>
    </p>
  </div>`);

// Summary shown at the top of Step 5 — updated dynamically from the latest prediction
const decisionSummary = text(
  `<div style="padding:16px;background:#f8f9fa;border-radius:12px;border:1px dashed #ccc;text-align:center;color:#888">
    <span style="display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#e67e22,#f39c12);color:#fff;font-weight:700;font-size:16px">?</span><br>
    <span style="font-size:0.9em;margin-top:6px;display:inline-block">No prediction yet — go back to <strong>Step 3</strong> to identify a beverage first.</span>
  </div>`
);

// ---------------------------------------------------------------------------
// Reactive image tracking
// ---------------------------------------------------------------------------
let latestTrainingImage = null;
let latestTrainingThumbnail = null;
let latestPredImage = null;
let latestPredThumbnail = null;

trainingInput.$images.subscribe((img) => {
  latestTrainingImage = img;
  trainStatus.$value.set(
    `<span style="color:#27ae60"><span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#27ae60;margin-right:4px;vertical-align:middle"></span>Image ready.</span> ` +
    `Select a label and click <strong>Save Example</strong>.`
  );
});

trainingInput.$thumbnails.subscribe((thumb) => {
  latestTrainingThumbnail = thumb;
});

predInput.$images.subscribe((img) => {
  latestPredImage = img;
  predStatus.$value.set(
    `<span style="color:#27ae60"><span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#27ae60;margin-right:4px;vertical-align:middle"></span>Image ready.</span> ` +
    `Choose an identify method below.`
  );
});

predInput.$thumbnails.subscribe((thumb) => {
  latestPredThumbnail = thumb;
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
// ImageNet → ALCOHOL_LABELS mapping for dataset auto-labeling.
// MobileNet classifies bottles using ImageNet vocabulary; this maps to our labels.
// ---------------------------------------------------------------------------
const IMAGENET_TO_ALCOHOL_LABEL = {
  'wine bottle': 'Red Wine',
  'wine rack': 'Red Wine',
  'red wine': 'Red Wine',
  'beer bottle': 'Lager',
  'beer glass': 'Lager',
  'malt liquor': 'Stout',
  'whiskey jug': 'Bourbon',
  'cocktail shaker': 'Liqueur',
  'champagne': 'Champagne',
  'sake': 'Sake',
  'vodka': 'Vodka',
  'gin': 'Gin',
  'rum': 'Rum',
  'tequila': 'Tequila',
  'cognac': 'Brandy / Cognac',
  'brandy': 'Brandy / Cognac',
  'absinthe': 'Absinthe',
  'cider': 'Cider',
  'stout': 'Stout',
  'lager': 'Lager',
  'champagne glass': 'Champagne',
};

// Generic bottle / container ImageNet labels that MobileNet often returns for
// alcohol bottles but that are NOT alcohol-specific. These are ignored when
// scanning predictions — we skip past them to find a more descriptive class.
const IMAGENET_GENERIC_BOTTLE_LABELS = [
  'pop bottle', 'soda bottle', 'water bottle', 'water jug', 'bottle',
  'plastic bottle', 'pill bottle', 'vase', 'pitcher', 'jug',
  'carton', 'packet', 'envelope', 'crate', 'grocery store',
  'shopping basket', 'shelf', 'menu', 'web site', 'book jacket',
  'beverage', 'drink',
];

/**
 * Guess an ALCOHOL_LABELS entry from a list of MobileNet top-K predictions.
 * Scans all predictions (not just #1) and skips generic container labels
 * like "pop bottle" that say nothing about the beverage type.
 *
 * Every image in the Kaggle dataset IS an alcohol bottle, so we never
 * return "Non-alcoholic".
 */
function guessAlcoholLabelFromPredictions(predictions) {
  // First pass: find the highest-confidence prediction that maps to a
  // specific alcohol type (skip generic bottles).
  for (const pred of predictions) {
    const lower = pred.className.toLowerCase();
    // Skip generic container labels
    if (IMAGENET_GENERIC_BOTTLE_LABELS.some((g) => lower.includes(g))) continue;
    // Check against our explicit map
    for (const [key, label] of Object.entries(IMAGENET_TO_ALCOHOL_LABEL)) {
      if (lower.includes(key)) return label;
    }
    // Check against alcohol keywords
    if (IMAGENET_ALCOHOL_KEYWORDS.some((kw) => lower.includes(kw))) return 'Liqueur';
  }

  // Second pass: even generic bottles might have alcohol keywords
  for (const pred of predictions) {
    const lower = pred.className.toLowerCase();
    for (const [key, label] of Object.entries(IMAGENET_TO_ALCOHOL_LABEL)) {
      if (lower.includes(key) && label !== 'Non-alcoholic') return label;
    }
    if (IMAGENET_ALCOHOL_KEYWORDS.some((kw) => lower.includes(kw))) return 'Liqueur';
  }

  // All images in this dataset are alcohol bottles — use a safe generic label
  return 'Liqueur';
}

/**
 * Load an image from a URL, crop it to a bounding box, and return an ImageData
 * at 224×224 suitable for MobileNet input.
 */
function loadAndCropImage(url, bbox) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 224;
      canvas.height = 224;
      const ctx = canvas.getContext('2d');
      const sx = Math.max(0, Math.floor(bbox.xmin));
      const sy = Math.max(0, Math.floor(bbox.ymin));
      const sw = Math.min(img.width - sx, Math.ceil(bbox.xmax - bbox.xmin));
      const sh = Math.min(img.height - sy, Math.ceil(bbox.ymax - bbox.ymin));
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, 224, 224);
      resolve(canvas);
    };
    img.onerror = () => reject(new Error(`Failed to load ${url}`));
    img.src = url;
  });
}

/**
 * Create a small thumbnail data-URL from a canvas for the dataset browser.
 */
function canvasToThumbnail(canvas) {
  const thumb = document.createElement('canvas');
  thumb.width = 64;
  thumb.height = 64;
  thumb.getContext('2d').drawImage(canvas, 0, 0, 64, 64);
  return thumb.toDataURL('image/jpeg', 0.6);
}

// ---------------------------------------------------------------------------
// Kaggle dataset loader — loads archive images, crops to bounding box,
// auto-labels via pretrained MobileNet, and stores in the training set.
// ---------------------------------------------------------------------------
loadDatasetBtn.$click.subscribe(async () => {
  if (featureExtractor.$loading.value) {
    datasetStatus.$value.set(
      '<span style="color:#e67e22"><span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#e67e22;margin-right:4px;vertical-align:middle"></span>Please wait — the AI model is still loading.</span>'
    );
    return;
  }

  datasetStatus.$value.set('<em>Fetching dataset manifest...</em>');

  let manifest;
  try {
    const res = await fetch('/archive/manifest.json');
    manifest = await res.json();
  } catch (err) {
    datasetStatus.$value.set(
      `<span style="color:#c0392b"><span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#c0392b;margin-right:4px;vertical-align:middle"></span>Could not load manifest: ${err.message}</span>`
    );
    return;
  }

  const total = manifest.length;
  let loaded = 0;
  let failed = 0;
  const labelCounts = {};

  // Wait for rawMobileNet if it hasn't loaded yet
  if (!rawMobileNet) {
    datasetStatus.$value.set('<em>Waiting for pretrained model to finish loading...</em>');
    await new Promise((resolve) => {
      const iv = setInterval(() => {
        if (rawMobileNet) { clearInterval(iv); resolve(); }
      }, 500);
    });
  }

  datasetStatus.$value.set(`<em>Loading ${total} images from Kaggle dataset...</em>`);

  // Process in small batches to avoid freezing the UI
  const BATCH = 5;
  for (let i = 0; i < total; i += BATCH) {
    const batch = manifest.slice(i, i + BATCH);
    const promises = batch.map(async (entry) => {
      try {
        const url = `/archive/${entry.file}`;
        const canvas = await loadAndCropImage(url, entry.bbox);

        // Auto-label using pretrained MobileNet — scan top-10 for best match
        const predictions = await rawMobileNet.classify(canvas, 10);
        const label = guessAlcoholLabelFromPredictions(predictions);

        // Extract features for KNN
        const feats = await featureExtractor.process(canvas);
        const thumbnail = canvasToThumbnail(canvas);

        await trainingSet.create({ x: feats, y: label, thumbnail });
        loaded++;
        labelCounts[label] = (labelCounts[label] || 0) + 1;
      } catch {
        failed++;
      }
    });
    await Promise.all(promises);

    // Update progress
    datasetStatus.$value.set(
      `<div style="padding:12px 16px;background:#f5f7fa;border-radius:10px;border:1px solid #e0e0e0">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <span style="font-size:0.88em;font-weight:600;color:#555">Processing images…</span>
          <span style="font-size:0.85em;color:#888">${loaded + failed}/${total}</span>
        </div>
        <div style="height:8px;background:#e0e0e0;border-radius:6px;overflow:hidden">
          <div style="height:100%;width:${Math.round(((loaded + failed) / total) * 100)}%;background:linear-gradient(90deg,#667eea,#764ba2);border-radius:6px;transition:width 0.3s"></div>
        </div>
        <div style="margin-top:4px;font-size:0.78em;color:#888">${loaded} loaded${failed > 0 ? `, ${failed} failed` : ''}</div>
      </div>`
    );
  }

  // Build a summary of labels assigned
  const labelSummary = Object.entries(labelCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([lbl, cnt]) => `<strong>${lbl}</strong>: ${cnt}`)
    .join(' · ');

  datasetStatus.$value.set(
    `<div style="padding:14px 18px;background:linear-gradient(135deg,#f0fff4,#e8f5e9);border:1px solid #a5d6a7;border-radius:12px;margin-top:8px;box-shadow:0 1px 4px rgba(0,0,0,0.04)">` +
    `<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">` +
    `<span style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;background:#27ae60;color:#fff;font-size:12px;font-weight:700">✓</span>` +
    `<strong style="color:#2e7d32">Loaded ${loaded} images from Kaggle dataset</strong>` +
    (failed > 0 ? ` <span style="color:#e67e22;font-size:0.88em">(${failed} failed)</span>` : '') +
    `</div>` +
    `<div style="font-size:0.84em;color:#555;line-height:1.6">` +
    `<strong>Auto-labeled distribution:</strong><br>${labelSummary}<br>` +
    `<span style="color:#888;font-style:italic">Review labels in the list below, then proceed to Train.</span></div></div>`
  );
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
      '<span style="color:#e67e22"><span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#e67e22;margin-right:4px;vertical-align:middle"></span>No image selected. Please upload an image first.</span>'
    );
    return;
  }
  trainStatus.$value.set('<em>Saving example...</em>');
  const feats = await featureExtractor.process(latestTrainingImage);
  const label = labelSelect.$value.value;
  await trainingSet.create({ x: feats, y: label, thumbnail: latestTrainingThumbnail });
  const count = trainingSet.$count.value;
  trainStatus.$value.set(
    `<span style="color:#27ae60"><span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#27ae60;margin-right:4px;vertical-align:middle"></span>Saved as <strong>${label}</strong>. ` +
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
      '<span style="color:#e67e22"><span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#e67e22;margin-right:4px;vertical-align:middle"></span>No examples saved yet. ' +
      'Go back to Step 1 and add labeled images before training.</span>'
    );
    return;
  }
  trainStepStatus.$value.set('<em>Training...</em>');
  await classifier.train(trainingSet);
  trainStepStatus.$value.set(
    `<span style="color:#27ae60"><span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#27ae60;margin-right:4px;vertical-align:middle"></span>Model trained on ${count} example${count !== 1 ? 's' : ''}. ` +
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
    <div style="margin:10px 0 6px">
      <div style="display:flex;justify-content:space-between;font-size:0.72em;color:#aaa;margin-bottom:3px;font-weight:500">
        <span>0%</span><span style="margin-left:auto;margin-right:6px">60%</span><span>85%</span><span style="margin-left:auto">100%</span>
      </div>
      <div style="position:relative;height:20px;background:#eee;border-radius:10px;overflow:hidden;box-shadow:inset 0 1px 3px rgba(0,0,0,0.08)">
        <div style="position:absolute;left:0;top:0;height:100%;width:${barWidth}%;background:linear-gradient(90deg,${zoneColor},${zoneColor}dd);border-radius:10px;transition:width 0.5s ease"></div>
        <div style="position:absolute;left:60%;top:0;width:1.5px;height:100%;background:rgba(0,0,0,0.15)"></div>
        <div style="position:absolute;left:85%;top:0;width:1.5px;height:100%;background:rgba(0,0,0,0.15)"></div>
      </div>
      <p style="margin:6px 0 2px;color:${zoneColor};font-weight:700;font-size:0.9em;letter-spacing:0.02em">
        ${pct}% — ${zoneLabel}
      </p>
      <p style="margin:0;font-size:0.82em;color:#666;line-height:1.4">${zoneAdvice}</p>
    </div>`;
}

// ---------------------------------------------------------------------------
// Tier message — prediction label + confidence meter
// ---------------------------------------------------------------------------
function buildTierMessage(topLabel, topConf, isFalseNeg) {
  const displayLabel = isFalseNeg ? '<em>Non-alcoholic</em>' : `<em>${topLabel}</em>`;
  const flagColor = isFalseNeg ? '#c0392b' : '#333';
  return `
    <div style="margin:8px 0">
      <p style="margin:0 0 6px;color:${flagColor};font-weight:700;font-size:1em">
        <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${flagColor};margin-right:5px;vertical-align:middle"></span> Predicted: ${displayLabel}
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
      <div style="border:3px solid #c0392b;padding:18px 20px;border-radius:12px;margin-top:12px;background:linear-gradient(135deg,#fff8f8,#fef0f0);box-shadow:0 2px 8px rgba(192,57,43,0.1)">
        <p style="margin:0 0 10px;color:#c0392b;font-weight:700;font-size:1.05em;display:flex;align-items:center;gap:6px">
          <span style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;background:#c0392b;color:#fff;font-size:11px;font-weight:700">!</span> FALSE NEGATIVE RISK
        </p>
        <p style="margin:0 0 12px;font-size:0.88em;line-height:1.5;color:#444">
          The AI predicts <strong>no alcohol</strong> — but it may be wrong.
          A <strong>false negative</strong> means the model missed alcohol that is actually present.
          This is the <strong>highest-risk error</strong>, especially for users under 18.
        </p>
        <div style="background:#ffeaea;padding:14px 16px;border-radius:10px;font-size:0.88em;line-height:1.6">
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
      <div style="border:2px solid #e67e22;padding:16px 20px;border-radius:12px;margin-top:12px;background:linear-gradient(135deg,#fffbf0,#fff8e8);box-shadow:0 2px 8px rgba(230,126,34,0.08)">
        <p style="margin:0 0 6px;color:#e67e22;font-weight:700"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#e67e22;margin-right:5px;vertical-align:middle"></span>Low Confidence — Verify Before Acting</p>
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
  'wine bottle': 'Wine',
  'wine rack': 'Wine',
  'red wine': 'Red Wine',
  'beer bottle': 'Beer',
  'beer glass': 'Beer',
  'malt liquor': 'Beer / Malt',
  'whiskey jug': 'Whisky / Bourbon',
  'cocktail shaker': 'Cocktail / Liqueur',
  'champagne': 'Champagne / Sparkling',
  'sake': 'Sake',
  'vodka': 'Vodka',
  'gin': 'Gin',
  'rum': 'Rum',
  'tequila': 'Tequila',
  'cognac': 'Brandy / Cognac',
  'brandy': 'Brandy / Cognac',
  'absinthe': 'Absinthe',
  'cider': 'Cider',
  'stout': 'Stout',
  'lager': 'Lager',
  'champagne glass': 'Champagne / Sparkling',
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
        '<span style="color:#e67e22"><span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#e67e22;margin-right:4px;vertical-align:middle"></span>No image selected. Please upload a photo first.</span>'
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
        '<span style="color:#e67e22"><span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#e67e22;margin-right:4px;vertical-align:middle"></span>No image selected. Please upload a photo first.</span>'
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

  // Read taste profile saved on the Welcome page and personalise the prompt.
  let tasteCtx = '';
  let tasteTag = '';
  try {
    const profile = JSON.parse(localStorage.getItem('beverage-taste-profile') || '{}');
    if (profile.strength) {
      tasteCtx =
        `The user prefers ${profile.strength.toLowerCase()}, ` +
        `${(profile.sweetness || '').toLowerCase()}, ` +
        `and ${(profile.flavor || '').toLowerCase()} drinks. ` +
        `Tailor the Description and Food Pairings to reflect these preferences.\n\n`;
      tasteTag =
        `<div style="font-size:0.78em;color:#888;margin-bottom:6px">` +
        `Personalized for: ${profile.strength} · ${profile.sweetness} · ${profile.flavor}` +
        `</div>`;
    }
  } catch { /* profile unreadable — proceed without personalization */ }

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    return `
      <div style="padding:12px;background:#f8f9fa;border-radius:6px">
        <strong>Classification:</strong> ${label}<br>
        <strong>Confidence:</strong> ${Math.round(confidence * 100)}%<br>
        <strong>Model used:</strong> ${sourceLabel}<br><br>
        <em><span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#e67e22;margin-right:4px;vertical-align:middle"></span>Gemini API key not configured.
        Copy <code>.env.example</code> to <code>.env</code>, add your key,
        then <strong>restart the dev server</strong>.</em>
      </div>`;
  }

  const prompt =
    `You are an expert on alcoholic beverages. A user photographed a beverage ` +
    `identified as "${label}" (${Math.round(confidence * 100)}% confidence).\n\n` +
    tasteCtx +
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
    <div style="padding:16px 20px;background:#ffffff;border-radius:12px;border:1px solid #e0e0e0;box-shadow:0 2px 10px rgba(0,0,0,0.06)">
      ${tasteTag}
      <div style="display:flex;flex-wrap:wrap;gap:12px;margin-bottom:10px">
        <div style="flex:1;min-width:140px;padding:10px 14px;background:#f5f7fa;border-radius:8px">
          <span style="font-size:0.75em;color:#999;text-transform:uppercase;font-weight:600">Classification</span><br>
          <strong style="font-size:1.05em;color:#2c3e50">${label}</strong>
        </div>
        <div style="flex:1;min-width:100px;padding:10px 14px;background:#f5f7fa;border-radius:8px">
          <span style="font-size:0.75em;color:#999;text-transform:uppercase;font-weight:600">Confidence</span><br>
          <strong style="font-size:1.05em;color:#2c3e50">${Math.round(confidence * 100)}%</strong>
        </div>
      </div>
      <div style="font-size:0.78em;color:#888;margin-bottom:10px">Model: ${sourceLabel} + Gemini (${usedModel})</div>
      <hr style="border:none;border-top:1px solid #eee;margin:8px 0 12px">
      <div style="line-height:1.65;font-size:0.92em">${generatedText}</div>
    </div>`;
}

// ---------------------------------------------------------------------------
// Active learning correction loop (Step 5 — Decision page)
// If the user thinks the prediction is wrong they select the real label and
// submit. The image features are saved into the training set and the KNN is
// retrained immediately — closing the human-in-the-loop feedback cycle.
// ---------------------------------------------------------------------------
const correctionHeader = text(`
  <div style="margin-top:24px;padding:16px 20px;background:linear-gradient(135deg,#f0f7ff,#e8f0fe);border:1px solid #b0d0f0;border-radius:12px;box-shadow:0 1px 4px rgba(0,0,0,0.03)">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
      <span style="display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:50%;background:#3498db;color:#fff;font-weight:700;font-size:12px">✓</span>
      <strong style="color:#2c3e50">Was the prediction wrong? Teach the AI.</strong>
    </div>
    <span style="font-size:0.85em;color:#555;line-height:1.5">
      Select the correct label below and click <em>Save Correction &amp; Retrain</em>.
      The KNN model will retrain immediately — your feedback makes it smarter.
    </span>
  </div>`);

const correctionLabelSelect = select(ALCOHOL_LABELS, ALCOHOL_LABELS[0]);
const submitCorrectionBtn = button('Save Correction & Retrain');
const correctionStatus = text('');

submitCorrectionBtn.$click.subscribe(async () => {
  if (!latestPredImage) {
    correctionStatus.$value.set(
      '<span style="color:#e67e22"><span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#e67e22;margin-right:4px;vertical-align:middle"></span>No prediction image available. Identify a beverage first (Step 3).</span>'
    );
    return;
  }
  const correctLabel = correctionLabelSelect.$value.value;
  correctionStatus.$value.set('<em>Saving correction and retraining…</em>');
  try {
    const feats = await featureExtractor.process(latestPredImage);
    await trainingSet.create({ x: feats, y: correctLabel, thumbnail: latestPredThumbnail });
    await classifier.train(trainingSet);
    const count = trainingSet.$count.value;
    correctionStatus.$value.set(`
      <div style="padding:14px 18px;background:linear-gradient(135deg,#f0fff4,#e8f5e9);border:1px solid #a5d6a7;border-radius:12px;margin-top:8px;box-shadow:0 1px 4px rgba(0,0,0,0.04)">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
          <span style="display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;background:#27ae60;color:#fff;font-size:11px;font-weight:700">✓</span>
          <strong style="color:#2e7d32">Saved as ${correctLabel}</strong>
        </div>
        <span style="font-size:0.85em;color:#555">
          KNN retrained on ${count} example${count !== 1 ? 's' : ''}.
          The model will be more accurate next time.
        </span>
      </div>`);
  } catch (err) {
    correctionStatus.$value.set(
      `<span style="color:#c0392b"><span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#c0392b;margin-right:4px;vertical-align:middle"></span>Could not save correction: ${err.message}</span>`
    );
  }
});

// ---------------------------------------------------------------------------
// Taste Profile — persisted in localStorage, injected into Gemini enrichment.
// Three binary dimensions kept intentionally simple so the onboarding is fast.
// ---------------------------------------------------------------------------
const TASTE_PROFILE_KEY = 'beverage-taste-profile';

const _savedProfile = (() => {
  try { return JSON.parse(localStorage.getItem(TASTE_PROFILE_KEY) || '{}'); }
  catch { return {}; }
})();

const strengthSelect = select(['Mild', 'Strong'], _savedProfile.strength || 'Mild');
const sweetnessSelect = select(['Sweet', 'Dry'], _savedProfile.sweetness || 'Sweet');
const flavorSelect = select(['Fruity', 'Earthy / Smoky'], _savedProfile.flavor || 'Fruity');

const tasteProfileHeader = text(`
  <div style="margin-top:16px;padding:18px 20px;background:linear-gradient(135deg,#fff8f0,#fff3e0);border:1px solid #f0c080;border-radius:12px;box-shadow:0 1px 4px rgba(0,0,0,0.03)">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
      <span style="display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#e67e22,#f39c12);color:#fff;font-weight:700;font-size:13px">T</span>
      <strong style="font-size:1.05em;color:#2c3e50">Your Taste Preferences</strong>
    </div>
    <span style="font-size:0.85em;color:#666;line-height:1.5">
      These personalise beverage descriptions and food pairings from the AI.<br>
      Choose one option for each: <strong>Strength</strong> · <strong>Sweetness</strong> · <strong>Flavor</strong>
    </span>
  </div>`);

// Auto-save all three dimensions whenever any one changes.
[strengthSelect, sweetnessSelect, flavorSelect].forEach((sel) => {
  sel.$value.subscribe(() => {
    localStorage.setItem(TASTE_PROFILE_KEY, JSON.stringify({
      strength: strengthSelect.$value.value,
      sweetness: sweetnessSelect.$value.value,
      flavor: flavorSelect.$value.value,
    }));
  });
});

// ---------------------------------------------------------------------------
// Wizard layout — 6 pages
// ---------------------------------------------------------------------------
const app = wizard();

// Page 1: Welcome + Taste Profile onboarding
app
  .page()
  .title('Beverage Identifier')
  .description(
    'Identify unfamiliar alcoholic beverages from photos — no language skills needed.\n\n' +
    'Two AI models are available:\n' +
    '• Quick Identify — pretrained model, works instantly without setup\n' +
    '• Custom KNN — trained on your labeled examples for higher accuracy\n\n' +
    'Set your taste preferences below to personalise results, then follow the steps.'
  )
  .use(tasteProfileHeader)
  .use([strengthSelect, sweetnessSelect, flavorSelect]);

// Page 2: Label training examples (for KNN)
app
  .page()
  .title('Step 1 — Label Examples')
  .description(
    'Upload beverage photos and assign labels to teach the KNN model. ' +
    'Add at least 3 photos per label for better accuracy.\n\n' +
    'You can also bulk-load the Kaggle Alcohol dataset below to get started quickly. ' +
    'Skip this step entirely if you only want to use Quick Identify.'
  )
  .use(trainingInput)
  .use(trainStatus)
  .use([labelSelect, saveBtn])
  .use(text(`<div style="margin:16px 0 8px;padding:14px 18px;background:linear-gradient(135deg,#e3f2fd,#e8eaf6);border-radius:10px;border:1px solid #bbdefb">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
      <span style="display:inline-block;width:10px;height:10px;border-radius:3px;background:#1565c0;vertical-align:middle"></span>
      <strong style="color:#1565c0">Quick Start — Kaggle Alcohol Dataset</strong>
    </div>
    <span style="font-size:0.84em;color:#555">Load 140 pre-labeled bottle images to bootstrap your model instantly.</span>
  </div>`))
  .use(loadDatasetBtn)
  .use(datasetStatus)
  .use(text('<div style="margin-top:16px;padding:0 0 4px;border-bottom:2px solid #e0e0e0"><strong style="color:#2c3e50">Your Labeled Examples</strong></div>'))
  .use(trainingBrowser);

// Page 3: Train the model
app
  .page()
  .title('Step 2 — Train the Model')
  .description(
    'Click "Train Model" to teach the KNN using your labeled examples. ' +
    'Training runs entirely in your browser — no data leaves your device.\n\n' +
    'Skip this step if you only want to use Quick Identify (pretrained).'
  )
  .use(trainStepStatus)
  .use(trainBtn)
  .use(trainProgress);

// Page 4: Upload a beverage + choose model
app
  .page()
  .title('Step 3 — Identify a Beverage')
  .description(
    'Upload or capture a photo of the beverage you want to identify, then choose a model.\n\n' +
    'Quick Identify works immediately. KNN requires training first (Step 2).'
  )
  .use(predInput)
  .use(predStatus)
  .use([pretrainedBtn, knnIdentifyBtn]);

// Page 5: Review results from both models
app
  .page()
  .title('Step 4 — Review Results')
  .description(
    'Compare predictions from both models side by side. ' +
    'The confidence meter shows how certain the AI is — you always have the final say.'
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
const acceptBtn = button('Accept — Show Details');
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
      '<p style="color:#c0392b;padding:14px;background:#fff0f0;border-radius:10px;border:1px solid #f0c0c0">' +
      '<strong><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#c0392b;margin-right:5px;vertical-align:middle"></span>Detailed information is unavailable</strong><br>' +
      '<span style="font-size:0.9em">The model is not confident enough or the beverage appears non-alcoholic. ' +
      'Please verify using the physical label.</span></p>'
    );
  } else {
    resultPanel.$value.set('<div style="text-align:center;padding:20px;color:#666"><span style="display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;font-weight:700;font-size:14px">...</span><br><em style="margin-top:6px;display:inline-block">Looking up beverage information…</em></div>');
    try {
      const html = await enrichBeverage(label, topConf, source);
      resultPanel.$value.set(html);
    } catch (err) {
      resultPanel.$value.set(
        `<p style="color:#c0392b"><span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#c0392b;margin-right:4px;vertical-align:middle"></span>Could not load beverage details: ${err.message}.<br>` +
        `Check your API key and internet connection.</p>`
      );
    }
  }
});

retryBtn.$click.subscribe(() => {
  resultPanel.$value.set('');
  correctionStatus.$value.set('');
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
    '<div style="border:2px solid #e67e22;padding:16px 20px;border-radius:12px;background:linear-gradient(135deg,#fffbf0,#fff8e8)">' +
    '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">' +
    '<span style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;background:#e67e22;color:#fff;font-size:11px;font-weight:700">!</span>' +
    '<strong style="color:#e67e22">Result flagged as uncertain</strong></div>' +
    '<span style="font-size:0.9em;color:#555">We recommend checking the physical label for accurate alcohol content information.</span>' +
    '</div>'
  );
});

app
  .page()
  .title('Step 5 — Your Decision')
  .description(
    'You are in control — the AI result is a suggestion, not a fact.\n\n' +
    'Accept if you trust the prediction — beverage details will be shown.\n' +
    'Flag as Uncertain if you are unsure — we recommend checking the label.\n' +
    'Retake Photo to start over with a new or clearer image.'
  )
  .use(decisionSummary)
  .use([acceptBtn, retryBtn, flagBtn])
  .use(resultPanel)
  .use(correctionHeader)
  .use(correctionLabelSelect)
  .use(submitCorrectionBtn)
  .use(correctionStatus);

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
    <div style="padding:16px 20px;background:#ffffff;border-radius:12px;border:1px solid #dee2e6;margin-bottom:14px;box-shadow:0 2px 8px rgba(0,0,0,0.04)">
      <div style="display:flex;flex-wrap:wrap;gap:12px;margin-bottom:8px">
        <div style="flex:1;min-width:140px;padding:10px 14px;background:#f5f7fa;border-radius:8px">
          <span style="font-size:0.72em;color:#999;text-transform:uppercase;font-weight:600">Model</span><br>
          <strong style="font-size:0.92em;color:#2c3e50">${sourceLabel}</strong>
        </div>
        <div style="flex:1;min-width:140px;padding:10px 14px;background:#f5f7fa;border-radius:8px">
          <span style="font-size:0.72em;color:#999;text-transform:uppercase;font-weight:600">Prediction</span><br>
          <strong style="font-size:0.92em;color:#2c3e50">${isFalseNeg ? 'Non-alcoholic' : label}</strong>
        </div>
      </div>
      ${buildConfidenceMeter(topConf)}
      ${buildFalseNegAlert(isFalseNeg, topConf, label)}
      <p style="margin:12px 0 0;font-size:0.82em;color:#888;font-style:italic;line-height:1.5">
        This prediction is a starting point, not a conclusion.
        You are responsible for the final decision.
      </p>
    </div>`);
}

// Rebuild the summary and clear stale correction status when arriving on the Decision page
app.$current.subscribe((idx) => {
  if (idx === 5) {
    updateDecisionSummary();
    correctionStatus.$value.set('');
  }
});

app.show();
