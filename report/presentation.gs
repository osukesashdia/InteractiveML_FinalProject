/**
 * @OnlyCurrentDoc
 * このスクリプトは、Google風デザインテンプレートに基づきGoogleスライドを自動生成します。
 * Version: 12.0 (Universal Google Design - Final)
 * Author: Googleスライド自動生成マスター
 * Prompt Design: まじん式プロンプト
 * Description: 指定されたslideData配列を元に、Google風デザインに準拠したスライドを生成します。
 */

// --- 1. 実行設定 ---
const SETTINGS = {
  SHOULD_CLEAR_ALL_SLIDES: true,
  TARGET_PRESENTATION_ID: null
};

// --- 2. マスターデザイン設定 (Google Design Ver.) ---
const CONFIG = {
  BASE_PX: { W: 960, H: 540 },

  POS_PX: {
    titleSlide: {
      logo:       { left: 55,  top: 105,  width: 135 },
      title:      { left: 50,  top: 230, width: 800, height: 90 },
      date:       { left: 50,  top: 340, width: 250, height: 40 },
    },

    contentSlide: {
      headerLogo:     { right: 20, top: 20, width: 75 },
      title:          { left: 25, top: 60,  width: 830, height: 65 },
      titleUnderline: { left: 25, top: 128, width: 260, height: 4 },
      subhead:        { left: 25, top: 140, width: 830, height: 30 },
      body:           { left: 25, top: 172, width: 910, height: 303 },
      twoColLeft:     { left: 25,  top: 172, width: 440, height: 303 },
      twoColRight:    { left: 495, top: 172, width: 440, height: 303 }
    },
    compareSlide: {
      headerLogo:     { right: 20, top: 20, width: 75 },
      title:          { left: 25, top: 60,  width: 830, height: 65 },
      titleUnderline: { left: 25, top: 128, width: 260, height: 4 },
      subhead:        { left: 25, top: 140, width: 830, height: 30 },
      leftBox:        { left: 25,  top: 172, width: 430, height: 303 },
      rightBox:       { left: 505, top: 172, width: 430, height: 303 }
    },
    processSlide: {
      headerLogo:     { right: 20, top: 20, width: 75 },
      title:          { left: 25, top: 60,  width: 830, height: 65 },
      titleUnderline: { left: 25, top: 128, width: 260, height: 4 },
      subhead:        { left: 25, top: 140, width: 830, height: 30 },
      area:           { left: 25, top: 172, width: 910, height: 303 }
    },
    timelineSlide: {
      headerLogo:     { right: 20, top: 20, width: 75 },
      title:          { left: 25, top: 60,  width: 830, height: 65 },
      titleUnderline: { left: 25, top: 128, width: 260, height: 4 },
      subhead:        { left: 25, top: 140, width: 830, height: 30 },
      area:           { left: 25, top: 172, width: 910, height: 303 }
    },
    diagramSlide: {
      headerLogo:     { right: 20, top: 20, width: 75 },
      title:          { left: 25, top: 60,  width: 830, height: 65 },
      titleUnderline: { left: 25, top: 128, width: 260, height: 4 },
      subhead:        { left: 25, top: 140, width: 830, height: 30 },
      lanesArea:      { left: 25, top: 172, width: 910, height: 303 }
    },
    cardsSlide: {
      headerLogo:     { right: 20, top: 20, width: 75 },
      title:          { left: 25, top: 60,  width: 830, height: 65 },
      titleUnderline: { left: 25, top: 128, width: 260, height: 4 },
      subhead:        { left: 25, top: 140, width: 830, height: 30 },
      gridArea:       { left: 25, top: 172, width: 910, height: 303 }
    },
    tableSlide: {
      headerLogo:     { right: 20, top: 20, width: 75 },
      title:          { left: 25, top: 60,  width: 830, height: 65 },
      titleUnderline: { left: 25, top: 128, width: 260, height: 4 },
      subhead:        { left: 25, top: 140, width: 830, height: 30 },
      area:           { left: 25, top: 172, width: 910, height: 303 }
    },
    progressSlide: {
      headerLogo:     { right: 20, top: 20, width: 75 },
      title:          { left: 25, top: 60,  width: 830, height: 65 },
      titleUnderline: { left: 25, top: 128, width: 260, height: 4 },
      subhead:        { left: 25, top: 140, width: 830, height: 30 },
      area:           { left: 25, top: 172, width: 910, height: 303 }
    },

    sectionSlide: {
      title:      { left: 55, top: 230, width: 840, height: 80 },
      ghostNum:   { left: 35, top: 120, width: 300, height: 200 }
    },

    footer: {
      leftText:  { left: 15, top: 505, width: 250, height: 20 },
      rightPage: { right: 15, top: 505, width: 50,  height: 20 }
    },
    bottomBar: { left: 0, top: 534, width: 960, height: 6 }
  },

  FONTS: {
    family: 'Arial',
    sizes: {
      title: 45,
      date: 16,
      sectionTitle: 38,
      contentTitle: 28,
      subhead: 18,
      body: 14,
      footer: 9,
      chip: 11,
      laneTitle: 13,
      small: 10,
      processStep: 14,
      axis: 12,
      ghostNum: 180
    }
  },
  COLORS: {
    primary_blue: '#4285F4',
    google_red: '#EA4335',
    google_yellow: '#FBBC04',
    google_green: '#34A853',
    text_primary: '#333333',
    background_white: '#FFFFFF',
    background_gray: '#f8f9fa',
    faint_gray: '#e8eaed',
    lane_title_bg: '#f5f5f3',
    lane_border: '#dadce0',
    card_bg: '#ffffff',
    card_border: '#dadce0',
    neutral_gray: '#9e9e9e',
    ghost_gray: '#efefed'
  },
  DIAGRAM: {
    laneGap_px: 24, lanePad_px: 10, laneTitle_h_px: 30,
    cardGap_px: 12, cardMin_h_px: 48, cardMax_h_px: 70,
    arrow_h_px: 10, arrowGap_px: 8
  },

  LOGOS: {
    header:  'https://upload.wikimedia.org/wikipedia/commons/8/89/HD_transparent_picture.png',
    closing: 'https://upload.wikimedia.org/wikipedia/commons/8/89/HD_transparent_picture.png'
  },

  FOOTER_TEXT: 'Interactive Machine Learning'
};

// --- 3. スライドデータ ---
const slideData = [
  {
    type: 'title',
    title: 'BottleWise\nAlcohol Recognition with Interactive ML',
    date: '2026.02.25',
    notes: 'Hello everyone. Today I will present BottleWise, a browser-based interactive ML system that helps non-native speakers identify alcoholic beverages from photos — with confidence transparency, uncertainty-aware warnings, and a human-in-the-loop correction loop.'
  },
  {
    type: 'content',
    title: 'Agenda',
    points: [
      '1. Introduction — problem and motivation',
      '2. Scenario and Users',
      '3. System Design — workflow and UI',
      '4. Implementation — models and data',
      '5. Evaluation Plan'
    ],
    notes: 'Here is today\'s agenda. Five sections, ending with a proposed human-centered evaluation method.'
  },
  {
    type: 'section',
    title: '1. Introduction',
    notes: 'Let\'s start with the problem we are solving.'
  },
  {
    type: 'content',
    title: 'The Problem',
    subhead: 'Non-native speakers cannot read local alcohol labels',
    points: [
      'Travelers, students, and immigrants encounter unfamiliar bottles daily',
      'Standard ML: single answer, no explanation, no way to verify',
      'AI errors can have [[real safety consequences]]',
      'Our approach: keep the user in control at every decision point'
    ],
    notes: 'When you cannot read a label, a black-box AI answer does not help if you have no way to judge its reliability. Our system gives users visibility into the model\'s confidence before they act on it.'
  },
  {
    type: 'content',
    title: 'Critical Risk: False Negatives',
    subhead: 'Alcohol misclassified as non-alcoholic — the highest-severity error',
    points: [
      '**False Negative**: AI says "no alcohol" — the drink is actually alcoholic',
      'Especially dangerous for underage users (under 18)',
      'A confident wrong answer is more dangerous than an uncertain one',
      '[[BottleWise]] always surfaces this risk before the user acts'
    ],
    notes: 'A false negative on alcohol content is the most dangerous failure in this domain. Any Non-alcoholic prediction triggers a visible red alert with step-by-step manual verification instructions, regardless of confidence level.'
  },
  {
    type: 'section',
    title: '2. Scenario & Users',
    notes: 'Now let\'s look at who uses this system and in what context.'
  },
  {
    type: 'cards',
    title: 'Who Uses BottleWise?',
    subhead: 'Users who can photograph a label — but cannot read it',
    columns: 3,
    items: [
      { title: 'International Students', desc: 'Studying abroad, unfamiliar with local categories and brands' },
      { title: 'Travelers & Tourists', desc: 'Quick in-store identification at shops and restaurants' },
      { title: 'Immigrants', desc: 'Long-term residents navigating an unfamiliar alcohol market' }
    ],
    notes: 'Our primary users share one key characteristic: they can photograph a bottle but cannot read its label. The interaction requires no language input — just a photo.'
  },
  {
    type: 'compare',
    title: 'Why Not a Standard Pipeline?',
    leftTitle: 'Typical ML App',
    rightTitle: 'BottleWise',
    leftItems: [
      'One prediction, no confidence shown',
      'LLM called immediately',
      'User cannot verify or correct',
      'False negatives pass silently'
    ],
    rightItems: [
      'Confidence meter with plain labels',
      'LLM gated behind user acceptance',
      'Correction loop retrains KNN live',
      'False-negative alert always visible'
    ],
    notes: 'The key difference is the uncertainty gate. BottleWise never invokes the LLM before the user has reviewed and accepted the prediction. Every prediction comes with a confidence signal the user can act on.'
  },
  {
    type: 'section',
    title: '3. System Design',
    notes: 'Let\'s walk through the system design — the six-step wizard and key UI components.'
  },
  {
    type: 'process',
    title: 'Six-Step Wizard',
    subhead: 'User drives every step — no auto-advance, no silent decisions',
    steps: [
      'Set Taste Profile — Strength, Sweetness, Flavor (auto-saved to localStorage)',
      'Label training images — upload photos and assign alcohol categories',
      'Train the KNN model in-browser — no data leaves the device',
      'Upload a beverage photo — choose Quick Identify or Custom KNN',
      'Review confidence + false-negative alerts before deciding',
      'Accept, Flag as Uncertain, or Retake — then view LLM-enriched details'
    ],
    notes: 'The wizard enforces a review step between prediction and enrichment. The LLM is only called after the user explicitly clicks Accept. Retake Photo resets the flow without losing training data.'
  },
  {
    type: 'cards',
    title: 'Uncertainty Visualization',
    subhead: 'Three independent signals — all visible before the user decides',
    columns: 3,
    items: [
      { title: 'Confidence Meter', desc: 'Color bar: Red below 60% · Orange 60-85% · Green above 85%' },
      { title: 'FP / FN Explainer', desc: 'Static table defining error types in plain, non-expert language' },
      { title: 'Alert Panels', desc: 'Red panel for false-negative risk · Orange for low confidence' }
    ],
    notes: 'The Review page is the core design contribution. It uses color and plain language instead of raw probability numbers. The FP/FN table is always visible to help users build a mental model of AI errors over time.'
  },
  {
    type: 'process',
    title: 'Active Learning Correction Loop',
    subhead: 'Wrong prediction? Teach the model — closes the human-in-the-loop cycle',
    steps: [
      'User selects the correct label from a 26-class vocabulary',
      'MobileNet v2 re-extracts a feature vector from the prediction image',
      'Labeled example appended to localStorage training set',
      'KNN retrains immediately — model improves within the same session'
    ],
    notes: 'The correction panel is always visible on the Decision page. Every wrong prediction becomes a new training example. The KNN retrains in under one second, entirely in the browser.'
  },
  {
    type: 'section',
    title: '4. Implementation',
    notes: 'Now let\'s look at the technical details — models, dataset, and current status.'
  },
  {
    type: 'table',
    title: 'Technical Stack',
    headers: ['Component', 'Technology', 'Notes'],
    rows: [
      ['Feature extraction', 'MobileNet v2 (TF.js)', '1280-dim vectors · 224x224 images'],
      ['Classifier', 'KNN k=3 (Marcelle)', 'User-trained on labeled feature vectors'],
      ['Pretrained path', 'MobileNet top-20 ImageNet', 'Works with zero prior training'],
      ['LLM enrichment', 'Gemini API (cascade)', 'Personalized by taste profile'],
      ['Persistence', 'localStorage (Marcelle)', 'Training data survives page refresh'],
      ['UI framework', 'Marcelle v0.6.5 + Vite', '100% in-browser — no server needed']
    ],
    notes: 'The entire application runs in the browser with no server and no data upload. MobileNet v2 is cached in IndexedDB after the first load. The Gemini model cascade automatically falls back if rate-limited.'
  },
  {
    type: 'progress',
    title: 'Implementation Status',
    subhead: 'All planned features fully implemented',
    items: [
      { label: 'KNN training loop', percent: 100 },
      { label: 'Pretrained MobileNet path', percent: 100 },
      { label: 'Confidence meter + tier messages', percent: 100 },
      { label: 'FP/FN explainer + alert panels', percent: 100 },
      { label: 'User decision gate (Accept / Flag / Retake)', percent: 100 },
      { label: 'Active learning correction loop', percent: 100 },
      { label: 'Taste profile + Gemini enrichment', percent: 100 }
    ],
    notes: 'All seven planned features are fully implemented and working end-to-end. The system has been tested from taste profile setup through KNN correction and Gemini enrichment.'
  },
  {
    type: 'section',
    title: '5. Evaluation Plan',
    notes: 'Finally, let\'s discuss how we would measure the effectiveness of our interactive design choices.'
  },
  {
    type: 'compare',
    title: 'Study Design',
    subhead: 'Between-subjects lab study — 12 to 16 non-native speaker participants',
    leftTitle: 'Condition A — BottleWise',
    rightTitle: 'Condition B — Baseline',
    leftItems: [
      'Full uncertainty visualization shown',
      'Accept / Flag / Retake controls active',
      'Correction loop available',
      'Confidence meter visible'
    ],
    rightItems: [
      'Confidence scores hidden',
      'Must accept every prediction',
      'No correction available',
      'LLM fires without user review'
    ],
    notes: 'Both groups complete the same 10-beverage task, including a seeded false-negative case — an alcoholic drink the model predicts as Non-alcoholic. We measure whether Condition A users detect it more reliably than Condition B.'
  },
  {
    type: 'content',
    title: 'Key Evaluation Measures',
    subhead: 'Primary: did users detect the seeded false negative?',
    points: [
      '**False-negative catch rate** — % who flagged the mislabeled alcoholic drink',
      '**Decision accuracy** — % of beverages correctly identified as alcoholic / non-alcoholic',
      '**Appropriate trust** — Likert: "The AI is honest about when it is unsure"',
      '**Correction engagement** — submissions per session and post-correction accuracy delta',
      '**Interviews** — thematic coding: uncertainty comprehension, trust, perceived agency'
    ],
    notes: 'The research question is: does exposing uncertainty in plain language improve users\' ability to detect high-risk misclassifications without reducing trust in correct predictions? The false-negative catch rate is our primary answer.'
  },
  {
    type: 'closing',
    notes: 'Thank you. BottleWise demonstrates that transparency, user agency, and human-in-the-loop correction can be applied in a practical, fully browser-based consumer application. I am happy to take any questions.'
  }
];

// --- 4. メイン実行関数 ---
let __SECTION_COUNTER = 0;

function generatePresentation() {
  let presentation;
  try {
    presentation = SETTINGS.TARGET_PRESENTATION_ID
      ? SlidesApp.openById(SETTINGS.TARGET_PRESENTATION_ID)
      : SlidesApp.getActivePresentation();
    if (!presentation) throw new Error('対象のプレゼンテーションが見つかりません。');

    if (SETTINGS.SHOULD_CLEAR_ALL_SLIDES) {
      const slides = presentation.getSlides();
      for (let i = slides.length - 1; i >= 0; i--) slides[i].remove();
    }

    __SECTION_COUNTER = 0;

    const layout = createLayoutManager(presentation.getPageWidth(), presentation.getPageHeight());

    let pageCounter = 0;
    for (const data of slideData) {
      const generator = slideGenerators[data.type];
      if (data.type !== 'title' && data.type !== 'closing') pageCounter++;
      if (generator) {
        const slide = presentation.appendSlide(SlidesApp.PredefinedLayout.BLANK);
        generator(slide, data, layout, pageCounter);

        if (data.notes) {
          try {
            const notesShape = slide.getNotesPage().getSpeakerNotesShape();
            if (notesShape) {
              notesShape.getText().setText(data.notes);
            }
          } catch (e) {
            Logger.log(`スピーカーノートの設定に失敗しました: ${e.message}`);
          }
        }
      }
    }
  } catch (e) {
    Logger.log(`処理が中断されました: ${e.message}\nStack: ${e.stack}`);
  }
}

// --- 5. スライド生成ディスパッチャ ---
const slideGenerators = {
  title:    createTitleSlide,
  section:  createSectionSlide,
  content:  createContentSlide,
  compare:  createCompareSlide,
  process:  createProcessSlide,
  timeline: createTimelineSlide,
  diagram:  createDiagramSlide,
  cards:    createCardsSlide,
  table:    createTableSlide,
  progress: createProgressSlide,
  closing:  createClosingSlide
};

// --- 6. スライド生成関数群 ---
function createTitleSlide(slide, data, layout) {
  slide.getBackground().setSolidFill(CONFIG.COLORS.background_white);

  const logoRect = layout.getRect('titleSlide.logo');
  const logo = slide.insertImage(CONFIG.LOGOS.header);
  const aspect = logo.getHeight() / logo.getWidth();
  logo.setLeft(logoRect.left).setTop(logoRect.top).setWidth(logoRect.width).setHeight(logoRect.width * aspect);

  const titleRect = layout.getRect('titleSlide.title');
  const titleShape = slide.insertShape(SlidesApp.ShapeType.TEXT_BOX, titleRect.left, titleRect.top, titleRect.width, titleRect.height);
  setStyledText(titleShape, data.title, { size: CONFIG.FONTS.sizes.title, bold: true });

  const dateRect = layout.getRect('titleSlide.date');
  const dateShape = slide.insertShape(SlidesApp.ShapeType.TEXT_BOX, dateRect.left, dateRect.top, dateRect.width, dateRect.height);
  dateShape.getText().setText(data.date || '');
  applyTextStyle(dateShape.getText(), { size: CONFIG.FONTS.sizes.date });

  drawBottomBar(slide, layout);
}

function createSectionSlide(slide, data, layout, pageNum) {
  slide.getBackground().setSolidFill(CONFIG.COLORS.background_gray);

  __SECTION_COUNTER++;
  const parsedNum = (() => {
    if (Number.isFinite(data.sectionNo)) return Number(data.sectionNo);
    const m = String(data.title || '').match(/^\s*(\d+)[.\．]/);
    return m ? Number(m[1]) : __SECTION_COUNTER;
  })();
  const num = String(parsedNum).padStart(2, '0');

  const ghostRect = layout.getRect('sectionSlide.ghostNum');
  const ghost = slide.insertShape(SlidesApp.ShapeType.TEXT_BOX, ghostRect.left, ghostRect.top, ghostRect.width, ghostRect.height);
  ghost.getText().setText(num);
  applyTextStyle(ghost.getText(), { size: CONFIG.FONTS.sizes.ghostNum, color: CONFIG.COLORS.ghost_gray, bold: true });
  try { ghost.setContentAlignment(SlidesApp.ContentAlignment.MIDDLE); } catch(e) {}

  const titleRect = layout.getRect('sectionSlide.title');
  const titleShape = slide.insertShape(SlidesApp.ShapeType.TEXT_BOX, titleRect.left, titleRect.top, titleRect.width, titleRect.height);
  titleShape.setContentAlignment(SlidesApp.ContentAlignment.MIDDLE);
  setStyledText(titleShape, data.title, { size: CONFIG.FONTS.sizes.sectionTitle, bold: true, align: SlidesApp.ParagraphAlignment.CENTER });

  addGoogleFooter(slide, layout, pageNum);
}

function createContentSlide(slide, data, layout, pageNum) {
  slide.getBackground().setSolidFill(CONFIG.COLORS.background_white);
  drawStandardTitleHeader(slide, layout, 'contentSlide', data.title);
  const dy = drawSubheadIfAny(slide, layout, 'contentSlide', data.subhead);

  const isAgenda = isAgendaTitle(data.title || '');
  let points = Array.isArray(data.points) ? data.points.slice(0) : [];
  if (isAgenda && (!points || points.length === 0)) {
    points = buildAgendaFromSlideData();
    if (points.length === 0) points = ['Introduction', 'Design', 'Next Steps'];
  }

  const hasImages = Array.isArray(data.images) && data.images.length > 0;
  const isTwo = !!(data.twoColumn || data.columns);

  if ((isTwo && (data.columns || points)) || (!isTwo && points && points.length > 0)) {
    if (isTwo) {
      let L = [], R = [];
      if (Array.isArray(data.columns) && data.columns.length === 2) {
        L = data.columns[0] || []; R = data.columns[1] || [];
      } else {
        const mid = Math.ceil(points.length / 2);
        L = points.slice(0, mid); R = points.slice(mid);
      }
      const leftRect  = offsetRect(layout.getRect('contentSlide.twoColLeft'),  0, dy);
      const rightRect = offsetRect(layout.getRect('contentSlide.twoColRight'), 0, dy);
      const leftShape  = slide.insertShape(SlidesApp.ShapeType.TEXT_BOX, leftRect.left,  leftRect.top,  leftRect.width,  leftRect.height);
      const rightShape = slide.insertShape(SlidesApp.ShapeType.TEXT_BOX, rightRect.left, rightRect.top, rightRect.width, rightRect.height);
      setBulletsWithInlineStyles(leftShape,  L);
      setBulletsWithInlineStyles(rightShape, R);
    } else {
      const bodyRect  = offsetRect(layout.getRect('contentSlide.body'), 0, dy);
      const bodyShape = slide.insertShape(SlidesApp.ShapeType.TEXT_BOX, bodyRect.left, bodyRect.top, bodyRect.width, bodyRect.height);
      setBulletsWithInlineStyles(bodyShape, points);
    }
  }

  if (hasImages) {
    const area = offsetRect(layout.getRect('contentSlide.body'), 0, dy);
    renderImagesInArea(slide, layout, area, normalizeImages(data.images));
  }

  drawBottomBarAndFooter(slide, layout, pageNum);
}

function createCompareSlide(slide, data, layout, pageNum) {
  slide.getBackground().setSolidFill(CONFIG.COLORS.background_white);
  drawStandardTitleHeader(slide, layout, 'compareSlide', data.title);
  const dy = drawSubheadIfAny(slide, layout, 'compareSlide', data.subhead);

  const leftBox  = offsetRect(layout.getRect('compareSlide.leftBox'),  0, dy);
  const rightBox = offsetRect(layout.getRect('compareSlide.rightBox'), 0, dy);
  drawCompareBox(slide, leftBox,  data.leftTitle  || 'Option A', data.leftItems  || []);
  drawCompareBox(slide, rightBox, data.rightTitle || 'Option B', data.rightItems || []);

  drawBottomBarAndFooter(slide, layout, pageNum);
}
function drawCompareBox(slide, rect, title, items) {
  const box = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, rect.left, rect.top, rect.width, rect.height);
  box.getFill().setSolidFill(CONFIG.COLORS.lane_title_bg);
  box.getBorder().getLineFill().setSolidFill(CONFIG.COLORS.lane_border);
  box.getBorder().setWeight(1);

  const th = 0.75 * 40;
  const titleBar = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, rect.left, rect.top, rect.width, th);
  titleBar.getFill().setSolidFill(CONFIG.COLORS.primary_blue);
  titleBar.getBorder().setTransparent();
  setStyledText(titleBar, title, { size: CONFIG.FONTS.sizes.laneTitle, bold: true, color: CONFIG.COLORS.background_white, align: SlidesApp.ParagraphAlignment.CENTER });

  const pad = 0.75 * 12;
  const textRect = { left: rect.left + pad, top: rect.top + th + pad, width: rect.width - pad * 2, height: rect.height - th - pad * 2 };
  const body = slide.insertShape(SlidesApp.ShapeType.TEXT_BOX, textRect.left, textRect.top, textRect.width, textRect.height);
  setBulletsWithInlineStyles(body, items);
}

function createProcessSlide(slide, data, layout, pageNum) {
  slide.getBackground().setSolidFill(CONFIG.COLORS.background_white);
  drawStandardTitleHeader(slide, layout, 'processSlide', data.title);
  const dy = drawSubheadIfAny(slide, layout, 'processSlide', data.subhead);

  const area  = offsetRect(layout.getRect('processSlide.area'), 0, dy);
  const steps = Array.isArray(data.steps) ? data.steps : [];
  const n     = Math.max(1, steps.length);
  const gapY  = (area.height - layout.pxToPt(40)) / Math.max(1, n - 1);
  const cx    = area.left + layout.pxToPt(44);
  const top0  = area.top  + layout.pxToPt(10);

  const line = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, cx - layout.pxToPt(1), top0 + layout.pxToPt(6), layout.pxToPt(2), gapY * (n - 1));
  line.getFill().setSolidFill(CONFIG.COLORS.faint_gray);
  line.getBorder().setTransparent();

  for (let i = 0; i < n; i++) {
    const cy = top0 + gapY * i;
    const sz = layout.pxToPt(28);
    const numBox = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, cx - sz/2, cy - sz/2, sz, sz);
    numBox.getFill().setSolidFill(CONFIG.COLORS.background_white);
    numBox.getBorder().getLineFill().setSolidFill(CONFIG.COLORS.primary_blue);
    numBox.getBorder().setWeight(1);
    const num = numBox.getText(); num.setText(String(i + 1));
    applyTextStyle(num, { size: 12, bold: true, color: CONFIG.COLORS.primary_blue, align: SlidesApp.ParagraphAlignment.CENTER });

    const txt = slide.insertShape(SlidesApp.ShapeType.TEXT_BOX, cx + layout.pxToPt(28), cy - layout.pxToPt(16), area.width - layout.pxToPt(70), layout.pxToPt(32));
    setStyledText(txt, steps[i] || '', { size: CONFIG.FONTS.sizes.processStep });
    try { txt.setContentAlignment(SlidesApp.ContentAlignment.MIDDLE); } catch(e){}
  }

  drawBottomBarAndFooter(slide, layout, pageNum);
}

function createTimelineSlide(slide, data, layout, pageNum) {
  slide.getBackground().setSolidFill(CONFIG.COLORS.background_white);
  drawStandardTitleHeader(slide, layout, 'timelineSlide', data.title);
  const dy = drawSubheadIfAny(slide, layout, 'timelineSlide', data.subhead);

  const area       = offsetRect(layout.getRect('timelineSlide.area'), 0, dy);
  const milestones = Array.isArray(data.milestones) ? data.milestones : [];
  if (milestones.length === 0) { drawBottomBarAndFooter(slide, layout, pageNum); return; }

  const inner  = layout.pxToPt(60);
  const baseY  = area.top + area.height * 0.55;
  const leftX  = area.left + inner;
  const rightX = area.left + area.width - inner;

  const line = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, leftX, baseY - layout.pxToPt(1), rightX - leftX, layout.pxToPt(2));
  line.getFill().setSolidFill(CONFIG.COLORS.faint_gray);
  line.getBorder().setTransparent();

  const dotR = layout.pxToPt(8);
  const gap  = (rightX - leftX) / Math.max(1, (milestones.length - 1));

  milestones.forEach((m, i) => {
    const x   = leftX + gap * i - dotR / 2;
    const dot = slide.insertShape(SlidesApp.ShapeType.ELLIPSE, x, baseY - dotR / 2, dotR, dotR);
    const state = (m.state || 'todo').toLowerCase();
    if (state === 'done')      { dot.getFill().setSolidFill(CONFIG.COLORS.google_green); dot.getBorder().setTransparent(); }
    else if (state === 'next') { dot.getFill().setSolidFill(CONFIG.COLORS.background_white); dot.getBorder().getLineFill().setSolidFill(CONFIG.COLORS.google_yellow); dot.getBorder().setWeight(2); }
    else                       { dot.getFill().setSolidFill(CONFIG.COLORS.background_white); dot.getBorder().getLineFill().setSolidFill(CONFIG.COLORS.neutral_gray);  dot.getBorder().setWeight(1); }

    const t = slide.insertShape(SlidesApp.ShapeType.TEXT_BOX, x - layout.pxToPt(40), baseY - layout.pxToPt(40), layout.pxToPt(90), layout.pxToPt(20));
    t.getText().setText(String(m.label || ''));
    applyTextStyle(t.getText(), { size: CONFIG.FONTS.sizes.small, bold: true, align: SlidesApp.ParagraphAlignment.CENTER });

    const d = slide.insertShape(SlidesApp.ShapeType.TEXT_BOX, x - layout.pxToPt(40), baseY + layout.pxToPt(8), layout.pxToPt(90), layout.pxToPt(18));
    d.getText().setText(String(m.date || ''));
    applyTextStyle(d.getText(), { size: CONFIG.FONTS.sizes.small, color: CONFIG.COLORS.neutral_gray, align: SlidesApp.ParagraphAlignment.CENTER });
  });

  drawBottomBarAndFooter(slide, layout, pageNum);
}

function createDiagramSlide(slide, data, layout, pageNum) {
  slide.getBackground().setSolidFill(CONFIG.COLORS.background_white);
  drawStandardTitleHeader(slide, layout, 'diagramSlide', data.title);
  const dy = drawSubheadIfAny(slide, layout, 'diagramSlide', data.subhead);

  const lanes  = Array.isArray(data.lanes) ? data.lanes : [];
  const area0  = layout.getRect('diagramSlide.lanesArea');
  const area   = offsetRect(area0, 0, dy);

  const px = (p) => layout.pxToPt(p);
  const laneGap   = px(CONFIG.DIAGRAM.laneGap_px);
  const lanePad   = px(CONFIG.DIAGRAM.lanePad_px);
  const laneTitleH = px(CONFIG.DIAGRAM.laneTitle_h_px);
  const cardGap   = px(CONFIG.DIAGRAM.cardGap_px);
  const cardMinH  = px(CONFIG.DIAGRAM.cardMin_h_px);
  const cardMaxH  = px(CONFIG.DIAGRAM.cardMax_h_px);
  const arrowH    = px(CONFIG.DIAGRAM.arrow_h_px);
  const arrowGap  = px(CONFIG.DIAGRAM.arrowGap_px);

  const n     = Math.max(1, lanes.length);
  const laneW = (area.width - laneGap * (n - 1)) / n;

  const cardBoxes = [];

  for (let j = 0; j < n; j++) {
    const lane = lanes[j] || { title: '', items: [] };
    const left = area.left + j * (laneW + laneGap);
    const top  = area.top;

    const lt = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, left, top, laneW, laneTitleH);
    lt.getFill().setSolidFill(CONFIG.COLORS.lane_title_bg);
    lt.getBorder().getLineFill().setSolidFill(CONFIG.COLORS.lane_border);
    lt.getBorder().setWeight(1);
    lt.getText().setText(lane.title || '');
    applyTextStyle(lt.getText(), { size: CONFIG.FONTS.sizes.laneTitle, bold: true, align: SlidesApp.ParagraphAlignment.CENTER });

    const items   = Array.isArray(lane.items) ? lane.items : [];
    const availH  = area.height - laneTitleH - lanePad * 2;
    const rows    = Math.max(1, items.length);
    const idealH  = (availH - cardGap * (rows - 1)) / rows;
    const cardH   = Math.max(cardMinH, Math.min(cardMaxH, idealH));
    const totalH  = cardH * rows + cardGap * (rows - 1);
    const firstTop = top + laneTitleH + lanePad + Math.max(0, (availH - totalH) / 2);

    cardBoxes[j] = [];
    for (let i = 0; i < rows; i++) {
      const cardTop   = firstTop + i * (cardH + cardGap);
      const cardLeft  = left + lanePad;
      const cardWidth = laneW - lanePad * 2;

      const card = slide.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, cardLeft, cardTop, cardWidth, cardH);
      card.getFill().setSolidFill(CONFIG.COLORS.card_bg);
      card.getBorder().getLineFill().setSolidFill(CONFIG.COLORS.card_border);
      card.getBorder().setWeight(1);
      setStyledText(card, items[i] || '', { size: CONFIG.FONTS.sizes.body });

      try { card.setContentAlignment(SlidesApp.ContentAlignment.MIDDLE); } catch(e){}
      cardBoxes[j][i] = { left: cardLeft, top: cardTop, width: cardWidth, height: cardH };
    }
  }

  const maxRows = Math.max(...cardBoxes.map(a => a.length));
  for (let j = 0; j < n - 1; j++) {
    const L = cardBoxes[j], R = cardBoxes[j + 1];
    for (let i = 0; i < maxRows; i++) {
      const a = L[i], b = R[i];
      if (a && b) drawArrowBetweenRects(slide, a, b, arrowH, arrowGap);
    }
  }

  drawBottomBarAndFooter(slide, layout, pageNum);
}

function createCardsSlide(slide, data, layout, pageNum) {
  slide.getBackground().setSolidFill(CONFIG.COLORS.background_white);
  drawStandardTitleHeader(slide, layout, 'cardsSlide', data.title);
  const dy = drawSubheadIfAny(slide, layout, 'cardsSlide', data.subhead);

  const area  = offsetRect(layout.getRect('cardsSlide.gridArea'), 0, dy);
  const items = Array.isArray(data.items) ? data.items : [];
  const cols  = Math.min(3, Math.max(2, Number(data.columns) || (items.length <= 4 ? 2 : 3)));
  const gap   = layout.pxToPt(16);
  const rows  = Math.ceil(items.length / cols);
  const cardW = (area.width  - gap * (cols - 1)) / cols;
  const cardH = Math.max(layout.pxToPt(92), (area.height - gap * (rows - 1)) / rows);

  for (let idx = 0; idx < items.length; idx++) {
    const r = Math.floor(idx / cols), c = idx % cols;
    const left = area.left + c * (cardW + gap);
    const top  = area.top  + r * (cardH + gap);

    const card = slide.insertShape(SlidesApp.ShapeType.ROUND_RECTANGLE, left, top, cardW, cardH);
    card.getFill().setSolidFill(CONFIG.COLORS.card_bg);
    card.getBorder().getLineFill().setSolidFill(CONFIG.COLORS.card_border);
    card.getBorder().setWeight(1);

    const obj = items[idx];
    if (typeof obj === 'string') {
      setStyledText(card, obj, { size: CONFIG.FONTS.sizes.body });
    } else {
      const title   = String(obj.title || '');
      const desc    = String(obj.desc  || '');
      const combined = `${title}${desc ? '\n' + desc : ''}`;
      setStyledText(card, combined, { size: CONFIG.FONTS.sizes.body });
      if (title.length > 0) {
        try { card.getText().getRange(0, title.length).getTextStyle().setBold(true); } catch(e){}
      }
    }
    try { card.setContentAlignment(SlidesApp.ContentAlignment.MIDDLE); } catch(e) {}
  }

  drawBottomBarAndFooter(slide, layout, pageNum);
}

function createTableSlide(slide, data, layout, pageNum) {
  slide.getBackground().setSolidFill(CONFIG.COLORS.background_white);
  drawStandardTitleHeader(slide, layout, 'tableSlide', data.title);
  const dy = drawSubheadIfAny(slide, layout, 'tableSlide', data.subhead);

  const area    = offsetRect(layout.getRect('tableSlide.area'), 0, dy);
  const headers = Array.isArray(data.headers) ? data.headers : [];
  const rows    = Array.isArray(data.rows)    ? data.rows    : [];

  try {
    if (headers.length > 0) {
      const table = slide.insertTable(rows.length + 1, headers.length);
      table.setLeft(area.left).setTop(area.top).setWidth(area.width);
      for (let c = 0; c < headers.length; c++) {
        const cell = table.getCell(0, c);
        setStyledText(cell, String(headers[c] || ''), { bold: true, align: SlidesApp.ParagraphAlignment.CENTER });
      }
      for (let r = 0; r < rows.length; r++) {
        const row = rows[r] || [];
        for (let c = 0; c < headers.length; c++) {
          const cell = table.getCell(r + 1, c);
          setStyledText(cell, String(row[c] || ''), { align: SlidesApp.ParagraphAlignment.CENTER });
        }
      }
    } else {
      throw new Error('headers is empty');
    }
  } catch (e) {
    const cols   = Math.max(1, headers.length || 3);
    const rcount = rows.length + 1;
    const gap    = layout.pxToPt(1);
    const cellW  = (area.width  - gap * (cols   - 1)) / cols;
    const cellH  = (area.height - gap * (rcount - 1)) / rcount;
    const drawCell = (r, c, text, bold) => {
      const left = area.left + c * (cellW + gap);
      const top  = area.top  + r * (cellH + gap);
      const cell = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, left, top, cellW, cellH);
      cell.getFill().setSolidFill(CONFIG.COLORS.background_white);
      cell.getBorder().getLineFill().setSolidFill(CONFIG.COLORS.card_border);
      cell.getBorder().setWeight(1);
      setStyledText(cell, String(text || ''), { bold: !!bold, align: SlidesApp.ParagraphAlignment.CENTER });
      try { cell.setContentAlignment(SlidesApp.ContentAlignment.MIDDLE); } catch(e){}
    };
    (headers.length ? headers : ['Item','Value 1','Value 2']).forEach((h, c) => drawCell(0, c, h, true));
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r] || [];
      for (let c = 0; c < (headers.length || 3); c++) drawCell(r + 1, c, row[c], false);
    }
  }

  drawBottomBarAndFooter(slide, layout, pageNum);
}

function createProgressSlide(slide, data, layout, pageNum) {
  slide.getBackground().setSolidFill(CONFIG.COLORS.background_white);
  drawStandardTitleHeader(slide, layout, 'progressSlide', data.title);
  const dy = drawSubheadIfAny(slide, layout, 'progressSlide', data.subhead);

  const area  = offsetRect(layout.getRect('progressSlide.area'), 0, dy);
  const items = Array.isArray(data.items) ? data.items : [];
  const n     = Math.max(1, items.length);
  const rowH  = area.height / n;

  for (let i = 0; i < n; i++) {
    const y     = area.top + i * rowH + layout.pxToPt(6);
    const label = slide.insertShape(SlidesApp.ShapeType.TEXT_BOX, area.left, y, layout.pxToPt(150), layout.pxToPt(18));
    setStyledText(label, String(items[i].label || ''), { size: CONFIG.FONTS.sizes.body });

    const barLeft = area.left + layout.pxToPt(160);
    const barW    = area.width - layout.pxToPt(210);
    const barBG   = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, barLeft, y, barW, layout.pxToPt(14));
    barBG.getFill().setSolidFill(CONFIG.COLORS.faint_gray); barBG.getBorder().setTransparent();

    const p     = Math.max(0, Math.min(100, Number(items[i].percent || 0)));
    const barFG = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, barLeft, y, barW * (p/100), layout.pxToPt(14));
    barFG.getFill().setSolidFill(CONFIG.COLORS.google_green); barFG.getBorder().setTransparent();

    const pct = slide.insertShape(SlidesApp.ShapeType.TEXT_BOX, barLeft + barW + layout.pxToPt(6), y - layout.pxToPt(1), layout.pxToPt(40), layout.pxToPt(16));
    pct.getText().setText(String(p) + '%');
    applyTextStyle(pct.getText(), { size: CONFIG.FONTS.sizes.small, color: CONFIG.COLORS.neutral_gray });
  }

  drawBottomBarAndFooter(slide, layout, pageNum);
}

function createClosingSlide(slide, data, layout) {
  slide.getBackground().setSolidFill(CONFIG.COLORS.background_white);
  const image   = slide.insertImage(CONFIG.LOGOS.closing);
  const imgW_pt = layout.pxToPt(450) * layout.scaleX;
  const aspect  = image.getHeight() / image.getWidth();
  image.setWidth(imgW_pt).setHeight(imgW_pt * aspect);
  image.setLeft((layout.pageW_pt - imgW_pt) / 2).setTop((layout.pageH_pt - (imgW_pt * aspect)) / 2);

  const thanksShape = slide.insertShape(SlidesApp.ShapeType.TEXT_BOX,
    layout.pxToPt(200) * layout.scaleX,
    layout.pxToPt(200) * layout.scaleY,
    layout.pxToPt(560) * layout.scaleX,
    layout.pxToPt(140) * layout.scaleY);
  setStyledText(thanksShape, 'Thank You', { size: 52, bold: true, color: CONFIG.COLORS.primary_blue, align: SlidesApp.ParagraphAlignment.CENTER });
  try { thanksShape.setContentAlignment(SlidesApp.ContentAlignment.MIDDLE); } catch(e){}

  drawBottomBar(slide, layout);
}

// --- 7. ユーティリティ関数群 ---
function createLayoutManager(pageW_pt, pageH_pt) {
  const pxToPt   = (px) => px * 0.75;
  const baseW_pt = pxToPt(CONFIG.BASE_PX.W);
  const baseH_pt = pxToPt(CONFIG.BASE_PX.H);
  const scaleX   = pageW_pt / baseW_pt;
  const scaleY   = pageH_pt / baseH_pt;

  const getPositionFromPath = (path) => path.split('.').reduce((obj, key) => obj[key], CONFIG.POS_PX);
  return {
    scaleX, scaleY, pageW_pt, pageH_pt, pxToPt,
    getRect: (spec) => {
      const pos = typeof spec === 'string' ? getPositionFromPath(spec) : spec;
      let left_px = pos.left;
      if (pos.right !== undefined && pos.left === undefined) {
        left_px = CONFIG.BASE_PX.W - pos.right - pos.width;
      }
      return {
        left:   left_px  !== undefined ? pxToPt(left_px)    * scaleX : undefined,
        top:    pos.top  !== undefined ? pxToPt(pos.top)    * scaleY : undefined,
        width:  pos.width  !== undefined ? pxToPt(pos.width)  * scaleX : undefined,
        height: pos.height !== undefined ? pxToPt(pos.height) * scaleY : undefined,
      };
    }
  };
}

function offsetRect(rect, dx, dy) {
  return { left: rect.left + (dx || 0), top: rect.top + (dy || 0), width: rect.width, height: rect.height };
}

function drawStandardTitleHeader(slide, layout, key, title) {
  const logoRect = layout.getRect(`${key}.headerLogo`);
  const logo     = slide.insertImage(CONFIG.LOGOS.header);
  const asp      = logo.getHeight() / logo.getWidth();
  logo.setLeft(logoRect.left).setTop(logoRect.top).setWidth(logoRect.width).setHeight(logoRect.width * asp);

  const titleRect  = layout.getRect(`${key}.title`);
  const titleShape = slide.insertShape(SlidesApp.ShapeType.TEXT_BOX, titleRect.left, titleRect.top, titleRect.width, titleRect.height);
  setStyledText(titleShape, title || '', { size: CONFIG.FONTS.sizes.contentTitle, bold: true });

  const uRect = layout.getRect(`${key}.titleUnderline`);
  const u     = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, uRect.left, uRect.top, uRect.width, uRect.height);
  u.getFill().setSolidFill(CONFIG.COLORS.primary_blue);
  u.getBorder().setTransparent();
}

function drawSubheadIfAny(slide, layout, key, subhead) {
  if (!subhead) return 0;
  const rect  = layout.getRect(`${key}.subhead`);
  const box   = slide.insertShape(SlidesApp.ShapeType.TEXT_BOX, rect.left, rect.top, rect.width, rect.height);
  setStyledText(box, subhead, { size: CONFIG.FONTS.sizes.subhead, color: CONFIG.COLORS.text_primary });
  return layout.pxToPt(36);
}

function drawBottomBar(slide, layout) {
  const barRect = layout.getRect('bottomBar');
  const bar     = slide.insertShape(SlidesApp.ShapeType.RECTANGLE, barRect.left, barRect.top, barRect.width, barRect.height);
  bar.getFill().setSolidFill(CONFIG.COLORS.primary_blue);
  bar.getBorder().setTransparent();
}

function drawBottomBarAndFooter(slide, layout, pageNum) {
  drawBottomBar(slide, layout);
  addGoogleFooter(slide, layout, pageNum);
}

function addGoogleFooter(slide, layout, pageNum) {
  const leftRect  = layout.getRect('footer.leftText');
  const leftShape = slide.insertShape(SlidesApp.ShapeType.TEXT_BOX, leftRect.left, leftRect.top, leftRect.width, leftRect.height);
  leftShape.getText().setText(CONFIG.FOOTER_TEXT);
  applyTextStyle(leftShape.getText(), { size: CONFIG.FONTS.sizes.footer, color: CONFIG.COLORS.text_primary });

  if (pageNum > 0) {
    const rightRect  = layout.getRect('footer.rightPage');
    const rightShape = slide.insertShape(SlidesApp.ShapeType.TEXT_BOX, rightRect.left, rightRect.top, rightRect.width, rightRect.height);
    rightShape.getText().setText(String(pageNum));
    applyTextStyle(rightShape.getText(), { size: CONFIG.FONTS.sizes.footer, color: CONFIG.COLORS.primary_blue, align: SlidesApp.ParagraphAlignment.END });
  }
}

function applyTextStyle(textRange, opt) {
  const style = textRange.getTextStyle();
  style.setFontFamily(CONFIG.FONTS.family);
  style.setForegroundColor(opt.color || CONFIG.COLORS.text_primary);
  style.setFontSize(opt.size || CONFIG.FONTS.sizes.body);
  style.setBold(opt.bold || false);
  if (opt.align) {
    try { textRange.getParagraphs().forEach(p => p.getRange().getParagraphStyle().setParagraphAlignment(opt.align)); } catch (e) {}
  }
}

function setStyledText(shapeOrCell, rawText, baseOpt) {
  const parsed = parseInlineStyles(rawText || '');
  const tr     = shapeOrCell.getText();
  tr.setText(parsed.output);
  applyTextStyle(tr, baseOpt || {});
  applyStyleRanges(tr, parsed.ranges);
}

function setBulletsWithInlineStyles(shape, points) {
  const joiner = '\n\n';
  let combined = '';
  const ranges = [];

  (points || []).forEach((pt, idx) => {
    const parsed = parseInlineStyles(String(pt || ''));
    const bullet = '• ' + parsed.output;
    if (idx > 0) combined += joiner;
    const start = combined.length;
    combined += bullet;

    parsed.ranges.forEach(r => {
      ranges.push({ start: start + 2 + r.start, end: start + 2 + r.end, bold: r.bold, color: r.color });
    });
  });

  const tr = shape.getText();
  tr.setText(combined || '• —');
  applyTextStyle(tr, { size: CONFIG.FONTS.sizes.body });

  try {
    tr.getParagraphs().forEach(p => {
      const ps = p.getRange().getParagraphStyle();
      ps.setLineSpacing(100);
      ps.setSpaceBelow(6);
    });
  } catch (e) {}

  applyStyleRanges(tr, ranges);
}

function parseInlineStyles(s) {
  const ranges = [];
  let out = '';
  for (let i = 0; i < s.length; ) {
    if (s[i] === '[' && s[i+1] === '[') {
      const close = s.indexOf(']]', i + 2);
      if (close !== -1) {
        const content = s.substring(i + 2, close);
        const start   = out.length;
        out += content;
        const end = out.length;
        ranges.push({ start, end, bold: true, color: CONFIG.COLORS.primary_blue });
        i = close + 2; continue;
      }
    }
    if (s[i] === '*' && s[i+1] === '*') {
      const close = s.indexOf('**', i + 2);
      if (close !== -1) {
        const content = s.substring(i + 2, close);
        const start   = out.length;
        out += content;
        const end = out.length;
        ranges.push({ start, end, bold: true });
        i = close + 2; continue;
      }
    }
    out += s[i]; i++;
  }
  return { output: out, ranges };
}

function applyStyleRanges(textRange, ranges) {
  ranges.forEach(r => {
    try {
      const sub = textRange.getRange(r.start, r.end);
      if (!sub) return;
      const st = sub.getTextStyle();
      if (r.bold)  st.setBold(true);
      if (r.color) st.setForegroundColor(r.color);
    } catch (e) {}
  });
}

function normalizeImages(arr) {
  return (arr || []).map(v => {
    if (typeof v === 'string')            return { url: v };
    if (v && typeof v.url === 'string')   return { url: v.url, caption: v.caption || '' };
    return null;
  }).filter(Boolean).slice(0, 6);
}

function renderImagesInArea(slide, layout, area, images) {
  if (!images || images.length === 0) return;
  const n = Math.min(6, images.length);
  let cols = 1, rows = 1;
  if (n === 1)      { cols = 1; rows = 1; }
  else if (n === 2) { cols = 2; rows = 1; }
  else if (n <= 4)  { cols = 2; rows = 2; }
  else              { cols = 3; rows = 2; }

  const gap   = layout.pxToPt(10);
  const cellW = (area.width  - gap * (cols - 1)) / cols;
  const cellH = (area.height - gap * (rows - 1)) / rows;

  for (let i = 0; i < n; i++) {
    const r    = Math.floor(i / cols), c = i % cols;
    const left = area.left + c * (cellW + gap);
    const top  = area.top  + r * (cellH + gap);
    try {
      const img   = slide.insertImage(images[i].url);
      const scale = Math.min(cellW / img.getWidth(), cellH / img.getHeight());
      const w = img.getWidth()  * scale;
      const h = img.getHeight() * scale;
      img.setWidth(w).setHeight(h);
      img.setLeft(left + (cellW - w) / 2).setTop(top + (cellH - h) / 2);
    } catch(e) {}
  }
}

function isAgendaTitle(title) {
  const t = String(title || '').toLowerCase();
  return /(agenda|アジェンダ|目次|本日お伝えすること)/.test(t);
}
function buildAgendaFromSlideData() {
  const pts = [];
  for (const d of slideData) {
    if (d && d.type === 'section' && typeof d.title === 'string' && d.title.trim()) pts.push(d.title.trim());
  }
  if (pts.length > 0) return pts.slice(0, 5);
  const alt = [];
  for (const d of slideData) {
    if (d && d.type === 'content' && typeof d.title === 'string' && d.title.trim()) alt.push(d.title.trim());
  }
  return alt.slice(0, 5);
}

function drawArrowBetweenRects(slide, a, b, arrowH, arrowGap) {
  const fromX  = a.left + a.width;
  const toX    = b.left;
  const width  = Math.max(0, toX - fromX - arrowGap * 2);
  if (width < 8) return;
  const yMid   = ((a.top + a.height/2) + (b.top + b.height/2)) / 2;
  const top    = yMid - arrowH / 2;
  const left   = fromX + arrowGap;
  const arr    = slide.insertShape(SlidesApp.ShapeType.RIGHT_ARROW, left, top, width, arrowH);
  arr.getFill().setSolidFill(CONFIG.COLORS.primary_blue);
  arr.getBorder().setTransparent();
}
