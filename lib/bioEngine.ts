export type Sex = "male" | "female";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "athlete";
export type Goal = "performance" | "composition" | "longevity" | "health";
export type DietaryStyle = "omnivore" | "vegetarian" | "vegan" | "keto" | "paleo";
export type Allergy = "dairy" | "gluten" | "eggs" | "nuts" | "soy" | "shellfish";

export interface UserProfile {
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goal: Goal;
  dietaryStyle: DietaryStyle;
  allergies: Allergy[];
  name?: string;
}

export interface CircadianPhase {
  id:      string;
  name:    string;
  desc:    string;
  action:  string;
  color:   string;
  startH:  number;
  endH:    number; // >24 means next-day (e.g. 29 = 5am next day)
}

// 24-hour cycle anchored at 5am
export const CIRCADIAN_PHASES: CircadianPhase[] = [
  { id: "dawn",     name: "DAWN PRIME",     desc: "Cortisol rising naturally. Avoid caffeine — let your body peak on its own.", action: "SUNLIGHT · HYDRATE · MOVE",      color: "#ff8c42", startH: 5,    endH: 7.5  },
  { id: "focus",    name: "PEAK FOCUS",     desc: "Cortisol at peak. Optimal for deep work, learning, and decisions.",          action: "DEEP WORK · ZERO DISTRACTIONS", color: "#00d4ff", startH: 7.5,  endH: 12   },
  { id: "midday",   name: "MIDDAY FUEL",    desc: "Fuel the machine. Eat your biggest high-protein meal now.",                  action: "PROTEIN MEAL · RECHARGE",       color: "#00ff88", startH: 12,   endH: 14   },
  { id: "dip",      name: "AFTERNOON DIP",  desc: "Energy trough. Core temperature drops briefly — 20-min nap is ideal.",       action: "REST · LOW INTENSITY WORK",     color: "#667788", startH: 14,   endH: 15.5 },
  { id: "training", name: "TRAINING PRIME", desc: "Peak core temp and reaction time. Maximum strength and speed available.",    action: "TRAIN NOW · PUSH LIMITS",       color: "#ff3366", startH: 15.5, endH: 18   },
  { id: "evening",  name: "EVENING WIND",   desc: "Recovery mode begins. Last meal, dim lights, no more caffeine.",             action: "WIND DOWN · LAST MEAL",         color: "#9966ff", startH: 18,   endH: 21   },
  { id: "sleep",    name: "SLEEP WINDOW",   desc: "Melatonin rising. Every minute of quality sleep compounds recovery.",        action: "SLEEP NOW · DO NOT SCROLL",     color: "#4455aa", startH: 21,   endH: 29   },
];

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light:     1.375,
  moderate:  1.55,
  active:    1.725,
  athlete:   1.9,
};

// Mifflin-St Jeor
export function calcBMR(p: UserProfile): number {
  const base = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age;
  return p.sex === "male" ? base + 5 : base - 161;
}

export function calcTDEE(p: UserProfile): number {
  return Math.round(calcBMR(p) * ACTIVITY_MULTIPLIERS[p.activityLevel]);
}

export function calcHydrationTargetL(p: UserProfile): number {
  const base = p.weightKg * 0.033;
  const activityBonus = ["active", "athlete"].includes(p.activityLevel) ? 0.5 : 0;
  return Math.round((base + activityBonus) * 10) / 10;
}

export function calcSleepTargetH(p: UserProfile): number {
  if (p.age < 26) return 9;
  if (p.age < 36) return 8.5;
  if (p.age < 51) return 8;
  if (p.age < 65) return 7.5;
  return 7;
}

export function calcRecoveryWindowH(p: UserProfile): number {
  if (p.age < 25) return 36;
  if (p.age < 35) return 42;
  if (p.age < 45) return 48;
  if (p.age < 55) return 56;
  return 64;
}

export function calcProteinTargetG(p: UserProfile): number {
  const multipliers: Record<Goal, number> = {
    performance: 2.2, composition: 2.0, longevity: 1.6, health: 1.4,
  };
  return Math.round(p.weightKg * multipliers[p.goal]);
}

export function getScoreWeights(goal: Goal): Record<string, number> {
  switch (goal) {
    case "performance":
      return { sleep: 0.22, recovery: 0.20, nutrition: 0.16, movement: 0.16, hydration: 0.10, energy: 0.08, focus: 0.05, stress: 0.03 };
    case "composition":
      return { sleep: 0.18, recovery: 0.15, nutrition: 0.22, movement: 0.18, hydration: 0.10, energy: 0.08, focus: 0.05, stress: 0.04 };
    case "longevity":
      return { sleep: 0.20, recovery: 0.15, nutrition: 0.15, movement: 0.15, hydration: 0.12, energy: 0.08, focus: 0.07, stress: 0.08 };
    default:
      return { sleep: 0.20, recovery: 0.15, nutrition: 0.15, movement: 0.15, hydration: 0.10, energy: 0.10, focus: 0.08, stress: 0.07 };
  }
}

export function calcMealCalories(size: string, profile: UserProfile): number {
  const tdee = calcTDEE(profile);
  const perMeal = tdee / 3;
  if (size === "Small")  return Math.round(perMeal * 0.6);
  if (size === "Large")  return Math.round(perMeal * 1.4);
  return Math.round(perMeal);
}

export function calcProjectedRecovery(currentRecovery: number, sleepHours: number, profile: UserProfile): number {
  const target = calcSleepTargetH(profile);
  const sleepRatio = Math.min(sleepHours / target, 1.1);
  const ageDecayFactor = profile.age > 40 ? 0.9 : 1.0;
  const projected = currentRecovery * 0.6 + sleepRatio * 40 * ageDecayFactor;
  return Math.min(100, Math.max(10, Math.round(projected)));
}

// ─── Meal Timing ────────────────────────────────────────────────────────────

export interface EatingWindow {
  openH:  number;   // hour to open eating window (e.g. 8.0 = 08:00)
  closeH: number;   // hour to close eating window
  windowH: number;  // eating window duration
  note: string;
}

export function calcEatingWindow(p: UserProfile, wakeHour = 7): EatingWindow {
  // Eating window aligned to circadian rhythm + goal
  const firstMealOffset = wakeHour < 6 ? 2 : 1; // wait 1-2h after wake
  const openH = wakeHour + firstMealOffset;

  let windowH: number;
  let note: string;

  switch (p.goal) {
    case "composition":
      windowH = 8; // 16:8 intermittent fasting
      note = "16:8 fasting — best insulin sensitivity for fat loss";
      break;
    case "performance":
      windowH = 10; // wider window to hit caloric targets
      note = "10h window — maximize nutrient intake for output";
      break;
    case "longevity":
      windowH = 10;
      note = "Align eating with daylight — circadian longevity protocol";
      break;
    default:
      windowH = 12;
      note = "12h window — flexible, balanced approach";
  }

  return { openH, closeH: openH + windowH, windowH, note };
}

export interface MealTiming {
  time: string;
  label: string;
  priority: string;
  color: string;
}

export function getMealTimings(p: UserProfile, wakeHour = 7): MealTiming[] {
  const win = calcEatingWindow(p, wakeHour);
  const timings: MealTiming[] = [];

  const fmt = (h: number) => {
    const hh = Math.floor(h) % 24;
    const mm = Math.round((h % 1) * 60);
    return `${String(hh).padStart(2,"0")}:${String(mm).padStart(2,"0")}`;
  };

  timings.push({
    time: fmt(win.openH),
    label: "BREAK FAST",
    priority: p.dietaryStyle === "keto"
      ? "Protein + fat — no carbs. Eggs, avocado, bacon."
      : "Protein + fat. Eggs, meat, Greek yogurt, avocado.",
    color: "#ff8c42",
  });

  // Mid-morning snack for high activity / performance
  if (["active", "athlete"].includes(p.activityLevel) && p.goal === "performance") {
    timings.push({
      time: fmt(win.openH + 2.5),
      label: "FUEL LOAD",
      priority: "Complex carbs + protein. Oats, banana, protein shake.",
      color: "#00d4ff",
    });
  }

  // Main meal — noon/midday (best insulin sensitivity)
  const lunchH = Math.max(12, win.openH + 3);
  timings.push({
    time: fmt(lunchH),
    label: "LARGEST MEAL",
    priority: "Peak insulin sensitivity. Hit your protein target now.",
    color: "#00ff88",
  });

  // Pre-workout (training prime starts ~15:30)
  timings.push({
    time: fmt(14),
    label: "PRE-WORKOUT",
    priority: "Complex carbs + protein 90 min before training window.",
    color: "#ffaa00",
  });

  // Post-workout
  timings.push({
    time: fmt(18),
    label: "POST-WORKOUT",
    priority: "Fast protein + carbs within 45 min. Maximise anabolic window.",
    color: "#00ff88",
  });

  // Last meal
  timings.push({
    time: fmt(win.closeH),
    label: "LAST MEAL",
    priority: "Light protein + low carb. 3h before sleep for optimal recovery.",
    color: "#9966ff",
  });

  return timings;
}

// ─── Allergy Compensation ────────────────────────────────────────────────────

export interface AllergyComp {
  allergy:  Allergy;
  label:    string;
  riskNutrients: Array<{
    name:    string;
    sources: string[];
    why:     string;
  }>;
}

export const ALLERGY_COMPENSATIONS: AllergyComp[] = [
  {
    allergy: "dairy",
    label: "DAIRY-FREE",
    riskNutrients: [
      { name: "Calcium",    sources: ["Sardines", "Broccoli", "Kale", "Chia seeds", "Fortified oat milk"], why: "Bone density and muscle contraction" },
      { name: "Vitamin B12",sources: ["Red meat", "Eggs", "Salmon", "Fortified nutritional yeast"], why: "Energy metabolism and nerve function" },
      { name: "Protein",    sources: ["Chicken", "Salmon", "Lentils", "Eggs", "Hemp seeds"], why: "Replace casein and whey protein" },
    ],
  },
  {
    allergy: "gluten",
    label: "GLUTEN-FREE",
    riskNutrients: [
      { name: "Fiber",      sources: ["Lentils", "Quinoa", "Sweet potato", "Buckwheat", "Chia seeds"], why: "Gut health and satiety" },
      { name: "Iron",       sources: ["Red meat", "Lentils", "Spinach + Vit C", "Pumpkin seeds"], why: "Oxygen transport and energy" },
      { name: "B Vitamins", sources: ["Brown rice", "GF oats", "Eggs", "Nutritional yeast"], why: "Gluten foods are often B-vitamin fortified" },
    ],
  },
  {
    allergy: "eggs",
    label: "EGG-FREE",
    riskNutrients: [
      { name: "Choline",    sources: ["Beef liver", "Salmon", "Chicken", "Cauliflower", "Soybeans"], why: "Brain function and fat metabolism" },
      { name: "Leucine",    sources: ["Chicken breast", "Salmon", "Lentils", "Greek yogurt"], why: "Primary muscle protein synthesis trigger" },
      { name: "Selenium",   sources: ["Brazil nuts (1-2/day)", "Tuna", "Sardines", "Beef"], why: "Thyroid function and antioxidant" },
    ],
  },
  {
    allergy: "nuts",
    label: "NUT-FREE",
    riskNutrients: [
      { name: "Vitamin E",  sources: ["Avocado", "Sunflower seeds", "Olive oil", "Bell peppers", "Salmon"], why: "Antioxidant and cell membrane health" },
      { name: "Magnesium",  sources: ["Pumpkin seeds", "Dark chocolate (70%+)", "Spinach", "Black beans"], why: "Muscle relaxation, sleep, stress" },
      { name: "Healthy Fats",sources: ["Avocado", "Olive oil", "Coconut", "Fatty fish (salmon, sardines)"], why: "Hormone production and inflammation control" },
    ],
  },
  {
    allergy: "soy",
    label: "SOY-FREE",
    riskNutrients: [
      { name: "Plant Protein",sources: ["Lentils", "Chickpeas", "Quinoa", "Hemp seeds", "Black beans"], why: "Complete amino acid profiles without soy" },
      { name: "Note",          sources: ["Check labels: soy hides in sauces, protein bars, deli meats"], why: "Soy lecithin is often tolerated — check with doctor" },
    ],
  },
  {
    allergy: "shellfish",
    label: "SHELLFISH-FREE",
    riskNutrients: [
      { name: "Zinc",      sources: ["Red meat", "Pumpkin seeds", "Chickpeas", "Lentils", "Beef liver"], why: "Testosterone, immunity, wound healing" },
      { name: "Iodine",    sources: ["Seaweed (nori)", "Iodized salt", "Cod", "Dairy (if ok)"], why: "Thyroid function — often missed without shellfish" },
      { name: "Omega-3",   sources: ["Salmon", "Mackerel", "Sardines", "Anchovy", "Algae oil"], why: "Shellfish contains EPA/DHA — replace with fatty fish" },
    ],
  },
];

// For vegetarian/vegan, return additional critical nutrients to watch
export function getDietaryStyleWarnings(style: DietaryStyle): Array<{ nutrient: string; sources: string[]; supplement?: string }> {
  if (style === "omnivore" || style === "paleo" || style === "keto") return [];

  const warnings = [
    { nutrient: "Vitamin B12", sources: ["Eggs", "Dairy", "Fortified foods"], supplement: "B12 sublingual — critical for vegans" },
    { nutrient: "Iron (haem)", sources: ["Lentils + Vit C", "Spinach", "Pumpkin seeds", "Fortified cereals"], supplement: "Iron supplement if bloodwork shows deficiency" },
    { nutrient: "Zinc",        sources: ["Pumpkin seeds", "Chickpeas", "Cashews", "Oats"], supplement: "Zinc citrate 15-25mg if plant-only diet" },
    { nutrient: "Creatine",    sources: ["Supplementation only — no plant sources"], supplement: "Creatine monohydrate 5g/day — major performance benefit" },
  ];

  if (style === "vegan") {
    warnings.push(
      { nutrient: "Vitamin D3",  sources: ["Sunlight 20min/day", "Fortified plant milk"], supplement: "D3 (from lichen) 2000-5000 IU — vegans are almost always deficient" },
      { nutrient: "Omega-3 DHA/EPA", sources: ["No plant foods contain EPA/DHA in usable form"], supplement: "Algae oil 500-1000mg — fish get it from algae anyway" },
      { nutrient: "Calcium",     sources: ["Kale", "Broccoli", "Chia seeds", "Fortified oat milk"], supplement: "Calcium citrate 500mg if not hitting 1000mg/day" },
    );
  }

  return warnings;
}

// Best protein sources for a given profile (allergies + dietary style filtered)
export function getProteinSources(p: UserProfile): Array<{ name: string; per100g: number; note?: string }> {
  const all = [
    { name: "Chicken breast",   per100g: 31, tags: ["omnivore","paleo","keto"],                       allergens: [] as Allergy[] },
    { name: "Salmon",           per100g: 25, tags: ["omnivore","paleo","keto","pescatarian"],          allergens: [] as Allergy[] },
    { name: "Beef (lean)",      per100g: 26, tags: ["omnivore","paleo","keto"],                       allergens: [] as Allergy[] },
    { name: "Eggs",             per100g: 13, tags: ["omnivore","vegetarian","keto","paleo"],           allergens: ["eggs"] as Allergy[] },
    { name: "Greek yogurt",     per100g: 17, tags: ["omnivore","vegetarian"],                         allergens: ["dairy"] as Allergy[] },
    { name: "Cottage cheese",   per100g: 11, tags: ["omnivore","vegetarian"],                         allergens: ["dairy"] as Allergy[] },
    { name: "Tuna",             per100g: 30, tags: ["omnivore","paleo","keto","pescatarian"],         allergens: [] as Allergy[] },
    { name: "Sardines",         per100g: 25, tags: ["omnivore","paleo","keto","pescatarian"],         allergens: [] as Allergy[] },
    { name: "Lentils",          per100g: 9,  tags: ["omnivore","vegetarian","vegan","paleo"],         allergens: [] as Allergy[] },
    { name: "Chickpeas",        per100g: 9,  tags: ["omnivore","vegetarian","vegan"],                 allergens: [] as Allergy[] },
    { name: "Tofu (firm)",      per100g: 17, tags: ["omnivore","vegetarian","vegan"],                 allergens: ["soy"] as Allergy[] },
    { name: "Tempeh",           per100g: 19, tags: ["omnivore","vegetarian","vegan"],                 allergens: ["soy"] as Allergy[] },
    { name: "Quinoa",           per100g: 4,  tags: ["omnivore","vegetarian","vegan","paleo"],         allergens: [] as Allergy[], note: "Complete protein — all amino acids" },
    { name: "Hemp seeds",       per100g: 31, tags: ["omnivore","vegetarian","vegan","keto"],          allergens: [] as Allergy[], note: "Complete protein + omega-3" },
    { name: "Pumpkin seeds",    per100g: 19, tags: ["omnivore","vegetarian","vegan","keto"],          allergens: [] as Allergy[] },
    { name: "Black beans",      per100g: 8,  tags: ["omnivore","vegetarian","vegan"],                 allergens: [] as Allergy[] },
    { name: "Edamame",          per100g: 11, tags: ["omnivore","vegetarian","vegan"],                 allergens: ["soy"] as Allergy[] },
    { name: "Beef liver",       per100g: 26, tags: ["omnivore","paleo","keto"],                       allergens: [] as Allergy[], note: "Most nutrient-dense food" },
  ];

  const styleFilter: Record<DietaryStyle, string[]> = {
    omnivore:    ["omnivore","vegetarian","vegan","pescatarian","paleo","keto"],
    vegetarian:  ["vegetarian","vegan"],
    vegan:       ["vegan"],
    keto:        ["keto","omnivore"],
    paleo:       ["paleo","omnivore"],
  };
  const style = p.dietaryStyle ?? "omnivore";
  const allowedTags = styleFilter[style] ?? styleFilter.omnivore;
  const userAllergies = p.allergies ?? [];

  return all
    .filter(s =>
      s.tags.some(t => allowedTags.includes(t)) &&
      !s.allergens.some(a => userAllergies.includes(a))
    )
    .sort((a, b) => b.per100g - a.per100g)
    .slice(0, 6);
}

// ─── Circadian ──────────────────────────────────────────────────────────────

export function getCurrentPhase(): CircadianPhase {
  const now = new Date();
  const rawH = now.getHours() + now.getMinutes() / 60;
  // Extend pre-5am into the sleep phase (0–5 → 24–29)
  const h = rawH < 5 ? rawH + 24 : rawH;
  return (
    CIRCADIAN_PHASES.find(p => h >= p.startH && h < p.endH) ??
    CIRCADIAN_PHASES[CIRCADIAN_PHASES.length - 1]
  );
}

export function minsToNextPhase(): number {
  const now = new Date();
  const rawH = now.getHours() + now.getMinutes() / 60;
  const phase = getCurrentPhase();
  let endH = phase.endH > 24 ? phase.endH - 24 : phase.endH;
  let diffH = endH - rawH;
  if (diffH <= 0) diffH += 24;
  return Math.round(diffH * 60);
}

// ─── Caffeine decay ─────────────────────────────────────────────────────────
// Half-life of caffeine ≈ 5.5h

export function calcCaffeineDecay(level: number, loggedAtMs: number | null): number {
  if (!loggedAtMs || level === 0) return level;
  const elapsedH = (Date.now() - loggedAtMs) / 3_600_000;
  const effective = level * Math.pow(0.5, elapsedH / 5.5);
  if (effective < 0.25) return 0;
  if (effective < 0.85) return 1;
  if (effective < 1.75) return 2;
  return 3;
}

export function caffeineClearanceMins(level: number, loggedAtMs: number | null): number | null {
  if (!loggedAtMs || level === 0) return null;
  const elapsedH = (Date.now() - loggedAtMs) / 3_600_000;
  // Solve: level * 0.5^(t/5.5) = 0.25 → t = 5.5 * log2(level/0.25)
  const totalH = level <= 0.25 ? 0 : 5.5 * Math.log(level / 0.25) / Math.LN2;
  const remainH = totalH - elapsedH;
  if (remainH <= 0) return 0;
  return Math.round(remainH * 60);
}
