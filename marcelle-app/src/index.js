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

// ---------------------------------------------------------------------------
// Label set — "Non-alcoholic" is an explicit class so false negatives
// surface as a KNN prediction rather than a gap in the label vocabulary.
// ---------------------------------------------------------------------------
const ALCOHOL_LABELS = [
  'Whisky',
  'Red Wine',
  'White Wine',
  'Beer',
  'Sake',
  'Vodka',
  'Rum',
  'Champagne',
  'Gin',
  'Tequila',
  'Non-alcoholic',
];

// Keywords to detect alcohol-related ImageNet labels for false negative detection.
// MobileNet uses ImageNet class names like "wine bottle", "beer glass", etc.
const IMAGENET_ALCOHOL_KEYWORDS = [
  'wine', 'beer', 'whiskey', 'cocktail', 'sake', 'vodka', 'rum',
  'champagne', 'gin', 'tequila', 'liquor', 'malt', 'lager', 'stout',
];

const HIGH_CONF = 0.85;
const MED_CONF = 0.60;

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
  '<hr><strong>🤖 Pretrained Model (MobileNet / ImageNet)</strong>' +
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
// MobileNet loading status
// ---------------------------------------------------------------------------
featureExtractor.$loading.subscribe((loading) => {
  if (loading) {
    trainStatus.$value.set('<em>Loading AI model (first run takes a moment)...</em>');
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
// Helper: build tier message HTML from label + confidence
// ---------------------------------------------------------------------------
function buildTierMessage(topLabel, topConf, isFalseNeg) {
  if (isFalseNeg) {
    return `<p style="color:#c0392b;font-weight:bold">
      ⚠ NON-ALCOHOLIC predicted (${Math.round(topConf * 100)}% confidence).
      Always verify by checking the physical label.
    </p>`;
  }
  if (topConf >= HIGH_CONF) {
    return `<p style="color:#27ae60;font-weight:bold">
      ✔ High confidence: <em>${topLabel}</em> (${Math.round(topConf * 100)}%)
    </p>`;
  }
  if (topConf >= MED_CONF) {
    return `<p style="color:#e67e22;font-weight:bold">
      ⚠ Moderate confidence: <em>${topLabel}</em> (${Math.round(topConf * 100)}%).
      Review the chart and confirm the result looks correct.
    </p>`;
  }
  return `<p style="color:#c0392b;font-weight:bold">
    ✘ Low confidence (${Math.round(topConf * 100)}%).
    The model is uncertain — check the physical label before relying on this result.
  </p>`;
}

const SAFETY_NOTICE = `
  <div style="border:2px solid #c0392b;padding:12px;border-radius:6px;margin-top:8px">
    <strong>Safety Notice</strong><br>
    The AI suggests this beverage may <strong>not contain alcohol</strong>, but predictions can be wrong.
    Always check the label — especially if you are under 18 or need to avoid alcohol.<br><br>
    Look for <strong>ABV</strong> (alcohol by volume) on the bottle.
    Any value <strong>above 0.5% ABV</strong> means the drink contains alcohol.
  </div>`;

// ---------------------------------------------------------------------------
// Pretrained model stream — uses mobileNet.predict() directly (ImageNet labels)
// No training required. Works immediately on any beverage photo.
// ---------------------------------------------------------------------------
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
    return featureExtractor.predict(latestPredImage);
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
  pretrainedWarning.$value.set(isFalseNeg ? SAFETY_NOTICE : '');
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
  warningPanel.$value.set(isFalseNeg ? SAFETY_NOTICE : '');
});

// Track the most recent prediction from either model for the Accept button
let latestPrediction = null;

// ---------------------------------------------------------------------------
// LLM enrichment stub
// Replace enrichBeverage() body when Claude API is available.
// Signature is frozen — no callers need to change.
// ---------------------------------------------------------------------------
function enrichBeverage(label, confidence, source) {
  const sourceLabel = source === 'pretrained'
    ? 'Pretrained MobileNet (ImageNet)'
    : 'Custom KNN Model';
  // STUB: replace this block when ANTHROPIC_API_KEY is available.
  return `
    <div style="padding:12px;background:#f8f9fa;border-radius:6px">
      <strong>Classification:</strong> ${label}<br>
      <strong>Confidence:</strong> ${Math.round(confidence * 100)}%<br>
      <strong>Model used:</strong> ${sourceLabel}<br><br>
      <em>LLM enrichment not yet connected. When configured, this will show:</em>
      <ul>
        <li>Beverage category and subcategory</li>
        <li>Typical alcohol content (ABV / proof)</li>
        <li>Cultural background and origin</li>
        <li>Suggested food pairings</li>
        <li>Safe consumption notes</li>
      </ul>
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
    'Results from both models are shown below. ' +
    'Compare confidence scores and read the messages before deciding.'
  )
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
const retryBtn = button('Try Another Photo');
const flagBtn = button("I'm Not Sure");

acceptBtn.$click.subscribe(() => {
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
    resultPanel.$value.set(enrichBeverage(label, topConf, source));
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
  .description('Do you accept this prediction?')
  .use([acceptBtn, retryBtn, flagBtn])
  .use(resultPanel);

app.show();
