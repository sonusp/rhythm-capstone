/**
 * @file cycleEngine.js
 * @description Core cycle calculation engine for Google Rhythm.
 * Pure JavaScript — zero external dependencies.
 */

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Parse a YYYY-MM-DD string into a midnight-UTC Date, or null on failure.
 * @param {string} dateStr
 * @returns {Date|null}
 */
const parseDate = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const parts = dateStr.split('-');
  if (parts.length !== 3) return null;
  const [y, m, d] = parts.map(Number);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (isNaN(dt.getTime())) return null;
  return dt;
};

/**
 * Return the number of whole days between two Date objects (a - b).
 * @param {Date} a
 * @param {Date} b
 * @returns {number}
 */
const daysBetween = (a, b) => Math.floor((a.getTime() - b.getTime()) / 86_400_000);

/**
 * Add `n` days to a Date and return a new Date.
 * @param {Date} date
 * @param {number} n
 * @returns {Date}
 */
const addDays = (date, n) => new Date(date.getTime() + n * 86_400_000);

// ---------------------------------------------------------------------------
// 1. calculateCurrentCycleDay
// ---------------------------------------------------------------------------

/**
 * Calculate what cycle day it is today based on the last period start date.
 * Day 1 = the period start date itself.
 *
 * @param {string} lastPeriodDate - YYYY-MM-DD
 * @returns {number} Current cycle day (≥ 1)
 */
export const calculateCurrentCycleDay = (lastPeriodDate) => {
  const start = parseDate(lastPeriodDate);
  if (!start) return 1;

  const today = new Date();
  const todayUTC = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  const diff = daysBetween(todayUTC, start);

  // Future date → treat as day 1
  if (diff < 0) return 1;

  return diff + 1; // day 1 = start date
};

// ---------------------------------------------------------------------------
// 2. calculateCyclePhase
// ---------------------------------------------------------------------------

/**
 * Determine the current menstrual phase based on cycle day and user context.
 *
 * Phase boundaries are proportional to cycleLength:
 *  - Menstrual  : days 1 … round(cycleLength × 0.18)
 *  - Follicular : round(cycleLength × 0.18)+1 … round(cycleLength × 0.43)
 *  - Ovulation  : round(cycleLength × 0.5) ± 2 days
 *  - Luteal     : remainder up to cycleLength
 *
 * @param {number} day - Current cycle day
 * @param {number} [cycleLength=28]
 * @param {string[]} [conditions=[]] - Diagnosed conditions array
 * @param {'cycle'|'pregnancy'|'perimenopause'} [lifecycleMode='cycle']
 * @returns {'MENSTRUAL'|'FOLLICULAR'|'OVULATION'|'LUTEAL'|'PCOS'|'LATE'|'PREGNANCY'|'PERIMENOPAUSE'}
 */
export const calculateCyclePhase = (day, cycleLength = 28, conditions = [], lifecycleMode = 'cycle') => {
  if (lifecycleMode === 'pregnancy') return 'PREGNANCY';
  if (lifecycleMode === 'perimenopause') return 'PERIMENOPAUSE';

  const safeDay = Math.max(1, Math.round(day));
  const safeLength = Math.max(21, Math.round(cycleLength));

  if (safeDay > safeLength) {
    return Array.isArray(conditions) && conditions.includes('PCOS') ? 'PCOS' : 'LATE';
  }

  const menstrualEnd = Math.round(safeLength * 0.18);          // ~day 5 for 28-day cycle
  const follicularEnd = Math.round(safeLength * 0.43);         // ~day 12
  const ovulationCenter = Math.round(safeLength * 0.5);        // ~day 14
  const ovulationStart = ovulationCenter - 2;
  const ovulationEnd = ovulationCenter + 2;

  if (safeDay >= 1 && safeDay <= menstrualEnd) return 'MENSTRUAL';
  if (safeDay <= follicularEnd) return 'FOLLICULAR';
  if (safeDay >= ovulationStart && safeDay <= ovulationEnd) return 'OVULATION';
  return 'LUTEAL';
};

// ---------------------------------------------------------------------------
// 3. calculatePhaseDates
// ---------------------------------------------------------------------------

/**
 * Calculate start/end dates of all cycle phases and the predicted next period.
 *
 * @param {string} lastPeriodDate - YYYY-MM-DD
 * @param {number} [cycleLength=28]
 * @returns {{
 *   menstrual:  { start: Date, end: Date },
 *   follicular: { start: Date, end: Date },
 *   ovulation:  { start: Date, end: Date },
 *   luteal:     { start: Date, end: Date },
 *   nextPeriod: Date
 * }|null}
 */
export const calculatePhaseDates = (lastPeriodDate, cycleLength = 28) => {
  const start = parseDate(lastPeriodDate);
  if (!start) return null;

  const safeLength = Math.max(21, Math.round(cycleLength));

  const menstrualEnd   = Math.round(safeLength * 0.18);
  const follicularEnd  = Math.round(safeLength * 0.43);
  const ovulationCenter = Math.round(safeLength * 0.5);
  const ovulationStart  = ovulationCenter - 2;
  const ovulationEnd    = ovulationCenter + 2;

  return {
    menstrual: {
      start: addDays(start, 0),
      end:   addDays(start, menstrualEnd - 1),
    },
    follicular: {
      start: addDays(start, menstrualEnd),
      end:   addDays(start, follicularEnd - 1),
    },
    ovulation: {
      start: addDays(start, ovulationStart - 1),
      end:   addDays(start, ovulationEnd - 1),
    },
    luteal: {
      start: addDays(start, ovulationEnd),
      end:   addDays(start, safeLength - 1),
    },
    nextPeriod: addDays(start, safeLength),
  };
};

// ---------------------------------------------------------------------------
// 4. predictNextPeriod
// ---------------------------------------------------------------------------

/**
 * Predict the start date of the next menstrual period.
 *
 * @param {string} lastPeriodDate - YYYY-MM-DD
 * @param {number} [cycleLength=28]
 * @returns {Date|null}
 */
export const predictNextPeriod = (lastPeriodDate, cycleLength = 28) => {
  const start = parseDate(lastPeriodDate);
  if (!start) return null;
  return addDays(start, Math.max(21, Math.round(cycleLength)));
};

// ---------------------------------------------------------------------------
// 5. getDaysUntilNextPeriod
// ---------------------------------------------------------------------------

/**
 * Get the number of days remaining until the next predicted period.
 * Returns a negative number if the period is late.
 *
 * @param {string} lastPeriodDate - YYYY-MM-DD
 * @param {number} [cycleLength=28]
 * @returns {number|null}
 */
export const getDaysUntilNextPeriod = (lastPeriodDate, cycleLength = 28) => {
  const next = predictNextPeriod(lastPeriodDate, cycleLength);
  if (!next) return null;

  const today = new Date();
  const todayUTC = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  return daysBetween(next, todayUTC);
};

// ---------------------------------------------------------------------------
// 6. calculateWeekOfPregnancy
// ---------------------------------------------------------------------------

/**
 * Calculate how many weeks pregnant based on conception date.
 * Pregnancy is counted from conception (not LMP).
 *
 * @param {string} conceptionDate - YYYY-MM-DD
 * @returns {number|null} Week number 1–42, or null if invalid/no date
 */
export const calculateWeekOfPregnancy = (conceptionDate) => {
  const conception = parseDate(conceptionDate);
  if (!conception) return null;

  const today = new Date();
  const todayUTC = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  const days = daysBetween(todayUTC, conception);

  if (days < 0) return null; // Future conception date

  const week = Math.floor(days / 7) + 1;
  return Math.min(42, Math.max(1, week));
};

// ---------------------------------------------------------------------------
// 7. calculateTrimester
// ---------------------------------------------------------------------------

/**
 * Determine the trimester based on pregnancy week number.
 *
 * @param {number} weekNumber
 * @returns {1|2|3}
 */
export const calculateTrimester = (weekNumber) => {
  if (!weekNumber || weekNumber < 1) return 1;
  if (weekNumber <= 12) return 1;
  if (weekNumber <= 26) return 2;
  return 3;
};

// ---------------------------------------------------------------------------
// 8. isPeriodLate
// ---------------------------------------------------------------------------

/**
 * Determine whether the current period is late.
 * Always returns false for PCOS users (irregular cycles expected).
 *
 * @param {string} lastPeriodDate - YYYY-MM-DD
 * @param {number} [cycleLength=28]
 * @param {boolean} [hasPCOS=false]
 * @returns {boolean}
 */
export const isPeriodLate = (lastPeriodDate, cycleLength = 28, hasPCOS = false) => {
  if (hasPCOS) return false;
  const currentDay = calculateCurrentCycleDay(lastPeriodDate);
  return currentDay > Math.max(21, Math.round(cycleLength));
};

// ---------------------------------------------------------------------------
// 9. getCycleSyncedAdvice
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} CycleSyncedAdvice
 * @property {string[]} nutrition
 * @property {string[]} fitness
 * @property {string[]} skincare
 * @property {string}   mentalHealth
 * @property {string}   hydration
 */

/**
 * Return phase-specific, personalised wellness advice.
 * Respects diet preference and diagnosed conditions.
 *
 * @param {'MENSTRUAL'|'FOLLICULAR'|'OVULATION'|'LUTEAL'|'PCOS'|'LATE'|'PREGNANCY'|'PERIMENOPAUSE'} phase
 * @param {'non-vegetarian'|'vegetarian'|'vegan'} [dietPreference='non-vegetarian']
 * @param {string[]} [conditions=[]]
 * @returns {CycleSyncedAdvice}
 */
export const getCycleSyncedAdvice = (phase, dietPreference = 'non-vegetarian', conditions = []) => {
  const isVegOrVegan = dietPreference === 'vegetarian' || dietPreference === 'vegan';
  const isVegan = dietPreference === 'vegan';
  const hasPCOS = Array.isArray(conditions) && conditions.includes('PCOS');
  const hasEndo = Array.isArray(conditions) && conditions.includes('Endometriosis');
  const hasPMDD = Array.isArray(conditions) && conditions.includes('PMDD');
  const hasFibroids = Array.isArray(conditions) && conditions.includes('Uterine Fibroids');

  /** Build base advice tables per phase */
  const adviceMap = {
    MENSTRUAL: {
      nutrition: [
        hasFibroids || hasEndo ? 'Lentils & spinach for iron replenishment' : (isVegOrVegan ? 'Lentils, tofu & spinach for iron' : 'Lean beef or chicken for iron & zinc'),
        isVegan ? 'Fortified plant milk for calcium' : (isVegOrVegan ? 'Dairy or fortified alternatives for calcium' : 'Salmon or sardines rich in omega-3'),
        'Dark chocolate (70%+) for magnesium & mood',
        hasEndo ? 'Turmeric & ginger — potent anti-inflammatory duo' : 'Warm soups & stews to ease cramping',
        hasPCOS ? 'Oats & barley — low-glycemic base for stable energy' : 'Complex carbs: sweet potato & quinoa',
      ],
      fitness: [
        'Gentle yoga \u2014 child\'s pose & pigeon pose for pelvic relief',
        'Low-intensity walking (20–30 min)',
        'Restorative stretching & foam rolling',
        'Avoid high-intensity interval training today',
      ],
      skincare: [
        'Double-cleanse to clear excess sebum buildup',
        'Hydrating sheet mask — aloe vera or hyaluronic acid',
        'Spot treat breakouts with salicylic acid (2%)',
        'Skip harsh exfoliants; skin is more sensitive now',
      ],
      mentalHealth: hasEndo
        ? 'Your pain is real — practice self-compassion and heat therapy. Reach out to your support circle.'
        : 'Rest is productive. Honour your body\'s need to slow down. Journaling and gentle breathing exercises help.',
      hydration: 'Aim for 2.5 L of warm fluids. Herbal teas (ginger, raspberry leaf) reduce cramping.',
    },

    FOLLICULAR: {
      nutrition: [
        hasPCOS ? 'Berries & leafy greens — antioxidants for insulin sensitivity' : 'Fermented foods (kefir, kimchi) for gut health',
        isVegan ? 'Tempeh & edamame — phytoestrogens to support rising oestrogen' : (isVegOrVegan ? 'Eggs & legumes for protein' : 'Eggs, legumes & lean poultry'),
        'Cruciferous veggies (broccoli, Brussels sprouts) to metabolise oestrogen',
        hasEndo ? 'Anti-inflammatory: walnuts, flax seeds & olive oil' : 'Flax seeds for lignans & fibre',
        hasPCOS ? 'Cinnamon on oats — helps regulate blood sugar' : 'Whole grains for sustained energy',
      ],
      fitness: [
        'Strength training — your body is primed for muscle gains now',
        'HIIT sessions (20–40 min) — energy is rising',
        'Running, cycling or dancing — embrace the surge',
        'Try a new workout class; motivation peaks in this phase',
      ],
      skincare: [
        'Vitamin C serum in the morning for glow & radiance',
        'Light, gel-based moisturiser as oil production balances',
        'SPF 30+ — oestrogen rise can increase UV sensitivity',
        'Incorporate a gentle exfoliant (AHA/PHA) twice a week',
      ],
      mentalHealth: 'Energy and clarity are rising — use this window for creative projects, social plans and goal setting. Your confidence is building.',
      hydration: 'Maintain 2.0–2.5 L daily. Add electrolytes if exercising intensely.',
    },

    OVULATION: {
      nutrition: [
        isVegan ? 'Pumpkin seeds & hemp seeds for zinc & omega-3' : (isVegOrVegan ? 'Pumpkin seeds, almonds & Greek yoghurt' : 'Shellfish or pumpkin seeds for zinc'),
        hasEndo ? 'Anti-inflammatory: turmeric latte & chia pudding' : 'Antioxidant-rich foods: colourful berries & pomegranate',
        hasPCOS ? 'Protein-forward meals to prevent LH surge spikes' : 'Light, nutrient-dense meals — appetite is naturally lower',
        isVegan ? 'Spirulina smoothie for B12 & protein' : 'Lean protein at every meal to sustain peak energy',
        'Hydrating foods: cucumber, watermelon & celery',
      ],
      fitness: [
        'Peak performance window — push your personal records',
        'High-intensity cardio, heavy lifting or sport',
        'Group fitness classes — social energy is high',
        'Use this phase to benchmark fitness metrics',
      ],
      skincare: [
        'Skin is naturally glowing — keep routine minimal',
        'Lightweight moisturiser + SPF',
        'Facial mist throughout the day for hydration',
        'Avoid heavy actives — save them for post-ovulation',
      ],
      mentalHealth: hasPMDD
        ? 'Enjoy this window of clarity before the luteal dip. Build positive emotional reserves now.'
        : 'You\'re at peak communication and confidence. Ideal time for important conversations, presentations and social gatherings.',
      hydration: 'Increase to 2.5–3 L. Cervical mucus changes increase fluid needs.',
    },

    LUTEAL: {
      nutrition: [
        hasPMDD ? 'Magnesium-rich foods: dark leafy greens, pumpkin seeds & dark chocolate' : 'Complex carbs to stabilise serotonin: oats, brown rice & sweet potato',
        isVegan ? 'Chickpeas & hemp seeds for B6 to support mood' : (isVegOrVegan ? 'Dairy or fortified foods for calcium & B6' : 'Turkey & tuna for tryptophan & B6'),
        hasPCOS ? 'Avoid sugar spikes: pair carbs with protein & healthy fat' : 'Reduce refined sugar to prevent mood swings',
        hasEndo ? 'Anti-inflammatory omega-3s: walnuts, flax & chia seeds' : 'Fibre-rich foods to support progesterone metabolism',
        'Dark chocolate (2 squares) for magnesium & endorphin boost',
      ],
      fitness: [
        'Moderate-intensity cardio — brisk walks, yoga flow',
        'Pilates for core strength with lower strain',
        'Reduce lifting volume; recovery takes longer now',
        hasPMDD ? 'Daily 30-min walk outdoors significantly reduces PMDD symptoms' : 'Listen to your body — rest days are equally valuable',
      ],
      skincare: [
        'Use salicylic acid or niacinamide to pre-empt breakouts',
        'Rich, barrier-supporting moisturiser — skin gets drier',
        'Avoid new active ingredients; skin is more reactive',
        'Gentle lymphatic facial massage to reduce puffiness',
      ],
      mentalHealth: hasPMDD
        ? 'PMDD support: limit caffeine & alcohol, track your triggers, and have a check-in with a trusted person. You\'re not alone.'
        : 'Honour the natural inward pull. Boundaries are healthy now. Prioritise sleep, journaling and activities that restore you.',
      hydration: 'Aim for 2.5 L. Reduce caffeine to minimise bloating and breast tenderness.',
    },

    PCOS: {
      nutrition: [
        'Low-glycemic diet: avoid refined sugar and white flour',
        isVegan ? 'Lentils, chickpeas & edamame as protein anchors' : (isVegOrVegan ? 'Greek yoghurt, eggs & legumes' : 'Lean protein at every meal: eggs, chicken, fish'),
        'Cinnamon, berberine-rich foods & inositol-rich foods',
        'Anti-inflammatory fats: avocado, olive oil & walnuts',
        'Spearmint tea — supports androgen balance',
      ],
      fitness: [
        'Strength training 3× per week for insulin sensitivity',
        'Low-to-moderate cardio (walking, cycling, swimming)',
        'Avoid over-exercising — cortisol worsens PCOS',
        'Consistency matters more than intensity',
      ],
      skincare: [
        'Use non-comedogenic, oil-free products',
        'Niacinamide serum to manage acne & hyperpigmentation',
        'Gentle chemical exfoliation (AHA) 2× weekly',
        'SPF daily — post-inflammatory marks fade faster with protection',
      ],
      mentalHealth: 'PCOS is not your fault. Focus on lifestyle consistency over perfection. Tracking symptoms helps you understand your unique pattern.',
      hydration: 'Aim for 2.5–3 L. Spearmint tea counts toward daily intake.',
    },

    LATE: {
      nutrition: [
        'Nourishing, balanced meals to support your body while you wait',
        isVegan ? 'Plenty of folate: leafy greens, beans & fortified cereals' : 'Folate-rich foods in case of early pregnancy',
        'Avoid alcohol until pregnancy is ruled out',
        'Ginger tea to ease potential nausea',
      ],
      fitness: [
        'Gentle movement only — yoga or walking',
        'Avoid intense exercise until you know what\'s happening',
        'Rest and listen to your body closely',
      ],
      skincare: [
        'Gentle, fragrance-free routine',
        'Prioritise hydration and barrier support',
      ],
      mentalHealth: 'Uncertainty is stressful. Consider taking a pregnancy test to bring clarity. Talk to someone you trust or your healthcare provider.',
      hydration: 'Stay well-hydrated — 2.0–2.5 L daily.',
    },

    PREGNANCY: {
      nutrition: [
        'Folate: 400–600 mcg daily via dark leafy greens & fortified foods',
        isVegan ? 'B12 supplement is essential — check with your provider' : (isVegOrVegan ? 'Dairy & eggs for calcium & B12' : 'Oily fish (salmon 2×/week) for DHA'),
        'Iron-rich foods paired with vitamin C for absorption',
        'Small, frequent meals to ease nausea',
        'Avoid: raw fish, deli meat, unpasteurised cheese & excess caffeine',
      ],
      fitness: [
        'Low-impact cardio: swimming, prenatal yoga, walking',
        'Pelvic floor exercises daily (Kegels)',
        'Avoid contact sports and lying flat on back after week 20',
        'Listen to your midwife or OB for trimester-specific guidance',
      ],
      skincare: [
        'Avoid retinoids, salicylic acid (high dose) & hydroquinone',
        'Use pregnancy-safe SPF: zinc oxide or titanium dioxide',
        'Moisturise bump with shea butter or rosehip oil',
        'Gentle cleanser — hormones may shift your skin type',
      ],
      mentalHealth: 'Prenatal anxiety is common. Seek a prenatal therapist if needed. Partner support and community are powerful tools.',
      hydration: 'Aim for 3 L daily. Dehydration can trigger Braxton Hicks contractions.',
    },

    PERIMENOPAUSE: {
      nutrition: [
        'Calcium & Vitamin D: fortified foods, dairy or supplements',
        isVegan ? 'Tofu & edamame for phytoestrogens & protein' : (isVegOrVegan ? 'Greek yoghurt & cheese for calcium' : 'Oily fish & lean meat for protein & omega-3'),
        'Phytoestrogens: soy, flax seeds & chickpeas',
        'Reduce alcohol — worsens hot flushes & sleep disruption',
        'Antioxidant-rich diet: berries, green tea & dark chocolate',
      ],
      fitness: [
        'Weight-bearing exercise for bone density (walking, dance, lifting)',
        'Resistance training 2–3× per week',
        'Yoga & Pilates for flexibility and stress management',
        'Pelvic floor work to manage changes in bladder control',
      ],
      skincare: [
        'Rich, lipid-heavy moisturiser — skin loses collagen rapidly',
        'Retinol (start low, build slowly) for collagen support',
        'SPF 50 — skin becomes thinner and more UV sensitive',
        'Hyaluronic acid serum for deep hydration',
      ],
      mentalHealth: 'Brain fog and mood shifts are physiological, not a personal failing. Support groups, therapy and HRT conversations with your doctor are all valid options.',
      hydration: 'Aim for 2.5 L. Hot flushes increase fluid loss; keep water accessible throughout the day.',
    },
  };

  // Fallback for unknown phases
  const advice = adviceMap[phase] || adviceMap['LUTEAL'];
  return {
    nutrition:    advice.nutrition    || [],
    fitness:      advice.fitness      || [],
    skincare:     advice.skincare     || [],
    mentalHealth: advice.mentalHealth || '',
    hydration:    advice.hydration    || '',
  };
};

// ---------------------------------------------------------------------------
// 10. getPhaseColor
// ---------------------------------------------------------------------------

/**
 * Return the brand colour associated with a cycle phase.
 *
 * @param {string} phase
 * @returns {string} Hex colour string
 */
export const getPhaseColor = (phase) => {
  const colors = {
    MENSTRUAL:    '#ef4444',
    FOLLICULAR:   '#22c55e',
    OVULATION:    '#f59e0b',
    LUTEAL:       '#8b5cf6',
    PCOS:         '#ec4899',
    LATE:         '#f97316',
    PREGNANCY:    '#06b6d4',
    PERIMENOPAUSE:'#64748b',
  };
  return colors[phase] || '#4285f4';
};

// ---------------------------------------------------------------------------
// 11. getPhaseLabel
// ---------------------------------------------------------------------------

/**
 * Return a human-readable label for a cycle phase.
 *
 * @param {string} phase
 * @returns {string}
 */
export const getPhaseLabel = (phase) => {
  const labels = {
    MENSTRUAL:    'Menstrual Phase',
    FOLLICULAR:   'Follicular Phase',
    OVULATION:    'Ovulation Phase',
    LUTEAL:       'Luteal Phase',
    PCOS:         'PCOS Irregular Phase',
    LATE:         'Late / Delayed Period',
    PREGNANCY:    'Pregnancy',
    PERIMENOPAUSE:'Perimenopause',
  };
  return labels[phase] || 'Cycle Phase';
};

// ---------------------------------------------------------------------------
// 12. formatCycleDay
// ---------------------------------------------------------------------------

/**
 * Format a cycle day number as a human-readable string.
 *
 * @param {number} day
 * @returns {string} e.g. 'Day 1', 'Day 14'
 */
export const formatCycleDay = (day) => {
  if (day == null || isNaN(day)) return 'Day 1';
  return `Day ${Math.max(1, Math.round(day))}`;
};

// ---------------------------------------------------------------------------
// 13. getPregnancyMilestone
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} PregnancyMilestone
 * @property {string} babySize   - Colloquial size comparison
 * @property {string} development - Key developmental highlight
 */

/**
 * Return baby size and developmental milestone for a given pregnancy week.
 *
 * @param {number} weekNumber - 1–40
 * @returns {PregnancyMilestone}
 */
export const getPregnancyMilestone = (weekNumber) => {
  const milestones = {
    1:  { babySize: 'A poppy seed',          development: 'Fertilisation may be occurring. The blastocyst is beginning to form.' },
    2:  { babySize: 'A sesame seed',          development: 'Implantation into the uterine wall is taking place.' },
    3:  { babySize: 'A mustard seed',         development: 'The neural tube, heart and digestive system are beginning to form.' },
    4:  { babySize: 'A lentil',               development: 'The embryonic disc is dividing into three germ layers — the building blocks of all organs.' },
    5:  { babySize: 'An apple seed',          development: 'The heart begins to beat and the spinal cord starts forming.' },
    6:  { babySize: 'A sweet pea',            development: 'Facial features are starting — tiny buds for nose, eyes and ears appear.' },
    7:  { babySize: 'A blueberry',            development: 'The brain is growing rapidly; arm and leg buds are distinct.' },
    8:  { babySize: 'A raspberry',            development: 'Fingers and toes are beginning to form; eyelids are developing.' },
    9:  { babySize: 'A grape',                development: 'All essential organs are present; the embryo officially becomes a foetus.' },
    10: { babySize: 'A strawberry',           development: 'Bones are beginning to harden; baby can now make small movements.' },
    11: { babySize: 'A lime',                 development: 'Fingernails and hair follicles are forming; genitals are beginning to differentiate.' },
    12: { babySize: 'A plum',                 development: 'Reflexes are developing; risk of miscarriage drops significantly.' },
    13: { babySize: 'A peach',                development: 'Second trimester begins; vocal cords are forming.' },
    14: { babySize: 'A lemon',                development: 'Baby can squint, frown and grimace. Kidneys are producing urine.' },
    15: { babySize: 'An apple',               development: 'Skeleton is shifting from cartilage to bone. Baby can sense light.' },
    16: { babySize: 'An avocado',             development: 'Baby\'s ears are functional; they can hear your voice for the first time.' },
    17: { babySize: 'A pear',                 development: 'Fat is accumulating under the skin for warmth and insulation.' },
    18: { babySize: 'A bell pepper',          development: 'You may feel the first flutters of movement (quickening).' },
    19: { babySize: 'A heirloom tomato',      development: 'Vernix caseosa (a protective coating) covers the skin.' },
    20: { babySize: 'A banana',               development: 'Halfway milestone! Baby is swallowing amniotic fluid and practising digestion.' },
    21: { babySize: 'A carrot',               development: 'Eyebrows and eyelids are fully developed. Baby has a sleep-wake cycle.' },
    22: { babySize: 'A papaya',               development: 'Lips, eyes and eyebrows are distinct. The inner ear is fully formed.' },
    23: { babySize: 'A large mango',          development: 'Baby can recognise your voice. Lung development accelerates.' },
    24: { babySize: 'An ear of corn',         development: 'Viability milestone — baby could survive with medical support if born now.' },
    25: { babySize: 'A rutabaga',             development: 'Capillaries form under the skin, giving it a pink hue.' },
    26: { babySize: 'A scallion',             development: 'Eyes open for the first time; baby responds to sound with movement.' },
    27: { babySize: 'A head of cauliflower',  development: 'Third trimester begins. Brain tissue is growing rapidly.' },
    28: { babySize: 'An eggplant',            development: 'Baby can blink and has REM sleep cycles, meaning they may be dreaming.' },
    29: { babySize: 'A butternut squash',     development: 'Baby is gaining weight rapidly; kicks become strong and regular.' },
    30: { babySize: 'A large cabbage',        development: 'Brain wrinkles (gyri and sulci) are forming to accommodate growth.' },
    31: { babySize: 'A coconut',              development: 'All five senses are functional. Baby practises breathing movements.' },
    32: { babySize: 'A squash',               development: 'Toenails are fully grown; baby may turn head-down (vertex position).' },
    33: { babySize: 'A pineapple',            development: 'Bones are fully developed though still soft; immune system is building.' },
    34: { babySize: 'A butternut squash',     development: 'Central nervous system is maturing rapidly; lungs are nearly complete.' },
    35: { babySize: 'A honeydew melon',       development: 'Baby is gaining 200–250 g per week. Most organs are fully mature.' },
    36: { babySize: 'A head of romaine',      development: 'Baby is considered "late preterm"; survival rates are very high.' },
    37: { babySize: 'A winter melon',         development: 'Baby is full-term! They are practising suckling and grasping.' },
    38: { babySize: 'A small pumpkin',        development: 'Baby is shedding vernix and lanugo. Ready for the world.' },
    39: { babySize: 'A mini watermelon',      development: 'Lungs are producing surfactant — fully ready for air breathing.' },
    40: { babySize: 'A small pumpkin',        development: 'Due date week! Baby is fully developed and awaiting their arrival.' },
  };

  const week = Math.min(40, Math.max(1, Math.round(weekNumber || 1)));
  return milestones[week] || { babySize: 'Growing strong', development: 'Your baby is developing beautifully.' };
};
