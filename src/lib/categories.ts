// Need-based categorization for appeals.
//
// Each appeal is read (title + body) and matched against a taxonomy of needs
// that commonly drive protest. The category with the most keyword hits wins;
// ties go to the higher-priority (earlier) category. Aggregating across all
// appeals tells us the order of what people are worried about most.
//
// This is a fast, offline, deterministic classifier. It can be swapped for an
// LLM-based one later (see `classifyText` — keep the same signature).

import type { Appeal } from "./types";

export type Category = {
  key: string;
  label: string;
  emoji: string;
  description: string;
};

// Listed in priority order — earlier categories win keyword ties.
export const CATEGORIES: Category[] = [
  {
    key: "safety",
    label: "Safety & Police Violence",
    emoji: "🛡️",
    description: "Physical danger, crackdowns, and use of force.",
  },
  {
    key: "missing",
    label: "Missing People",
    emoji: "🔎",
    description: "Disappearances and people whose whereabouts are unknown.",
  },
  {
    key: "legal",
    label: "Detention & Legal",
    emoji: "⚖️",
    description: "Arrests, detentions, courts, and legal support.",
  },
  {
    key: "health",
    label: "Health & Medical",
    emoji: "🏥",
    description: "Injuries, medicine, and access to care.",
  },
  {
    key: "food",
    label: "Food & Water",
    emoji: "🥖",
    description: "Hunger, thirst, and basic supplies.",
  },
  {
    key: "housing",
    label: "Shelter & Housing",
    emoji: "🏠",
    description: "Displacement, eviction, and a safe place to stay.",
  },
  {
    key: "economy",
    label: "Jobs & Economy",
    emoji: "💸",
    description: "Wages, prices, work, and the cost of living.",
  },
  {
    key: "internet",
    label: "Internet & Communications",
    emoji: "📡",
    description: "Network shutdowns and staying connected.",
  },
  {
    key: "speech",
    label: "Freedom of Expression",
    emoji: "🗣️",
    description: "Censorship, press freedom, and being silenced.",
  },
  {
    key: "governance",
    label: "Governance & Rights",
    emoji: "🏛️",
    description: "Elections, corruption, reform, and civil rights.",
  },
  {
    key: "other",
    label: "Other",
    emoji: "📌",
    description: "Appeals that don't fit the categories above.",
  },
];

const CATEGORY_BY_KEY = new Map(CATEGORIES.map((c) => [c.key, c]));

// A pseudo-category for representatives who champion the whole movement rather
// than one specific need. Not part of the appeal taxonomy.
export const GENERAL_CATEGORY: Category = {
  key: "general",
  label: "Overall movement",
  emoji: "🌍",
  description: "Represents the movement as a whole, across all needs.",
};

export function getCategory(key: string): Category {
  if (key === GENERAL_CATEGORY.key) return GENERAL_CATEGORY;
  return CATEGORY_BY_KEY.get(key) ?? CATEGORY_BY_KEY.get("other")!;
}

// Options a candidate can choose to represent: the whole movement, or any of
// the concrete needs (excluding the catch-all "Other").
export function representChoices(): Category[] {
  return [GENERAL_CATEGORY, ...CATEGORIES.filter((c) => c.key !== "other")];
}

// Keyword sets per category. Each entry is matched case-insensitively.
const KEYWORDS: Record<string, string[]> = {
  safety: [
    "police", "\\bcop", "officer", "tear ?gas", "\\bgas\\b", "beat", "baton",
    "brutalit", "violen", "\\bshot\\b", "shoot", "\\bgun", "rubber bullet",
    "live round", "crackdown", "\\battack", "assault", "killed", "\\bdeath",
    "\\briot", "force",
  ],
  missing: [
    "missing", "disappear", "abduct", "whereabouts", "where is", "kidnap",
    "taken away", "vanish",
  ],
  legal: [
    "detain", "arrest", "jail", "prison", "custody", "charge", "\\bcourt",
    "trial", "lawyer", "attorney", "legal", "\\bbail", "prosecut", "sentence",
    "release", "political prisoner",
  ],
  health: [
    "medical", "medicine", "doctor", "hospital", "clinic", "ambulance",
    "injur", "wounded", "treatment", "health", "\\bsick", "disease",
    "first aid", "\\bblood",
  ],
  food: [
    "\\bfood", "water", "hunger", "hungry", "starv", "\\bmeal", "thirst",
    "supplies", "ration", "bread", "drinking water",
  ],
  housing: [
    "housing", "\\bhouse", "homeless", "shelter", "evict", "\\brent",
    "displaced", "refugee", "\\bcamp",
  ],
  economy: [
    "\\bjob", "unemploy", "\\bwage", "salary", "income", "econom", "inflation",
    "\\bprice", "cost of living", "poverty", "\\bpoor", "\\bmoney", "\\bdebt",
    "\\btax", "business",
  ],
  internet: [
    "internet", "network", "\\bsignal", "blackout", "shut ?down", "\\bvpn",
    "wi-?fi", "connection", "communicat", "phone line", "\\bsms", "social media",
  ],
  speech: [
    "censor", "free speech", "freedom of (speech|expression|press)", "\\bpress\\b",
    "journalist", "\\bmedia", "silenced", "propaganda", "expression",
    "speak (out|up)",
  ],
  governance: [
    "election", "\\bvote", "\\bballot", "government", "\\bgovt", "corrupt",
    "resign", "democ", "dictator", "regime", "president", "prime minister",
    "reform", "constitution", "\\brights", "justice", "freedom", "protest",
    "demand",
  ],
};

const RULES: { key: string; patterns: RegExp[] }[] = CATEGORIES.filter(
  (c) => c.key !== "other",
).map((c) => ({
  key: c.key,
  patterns: (KEYWORDS[c.key] ?? []).map((k) => new RegExp(k, "i")),
}));

/** Classify free text into a category key. */
export function classifyText(text: string): string {
  const t = text.toLowerCase();
  let best = "other";
  let bestScore = 0;
  for (const rule of RULES) {
    let score = 0;
    for (const re of rule.patterns) if (re.test(t)) score++;
    if (score > bestScore) {
      bestScore = score;
      best = rule.key;
    }
  }
  return best;
}

export function categorize(appeal: Pick<Appeal, "title" | "body">): string {
  return classifyText(`${appeal.title} ${appeal.body}`);
}

export type Concern = {
  category: Category;
  appeals: Appeal[];
  appealCount: number;
  commentCount: number;
  /** Combined "voices" signal: appeals + comments on those appeals. */
  score: number;
};

// Rank categories by how much worry they carry: number of appeals plus the
// discussion (comments) they attract.
export function rankConcerns(
  appeals: Appeal[],
  commentCounts: Map<string, number>,
): Concern[] {
  const groups = new Map<string, Appeal[]>();
  for (const a of appeals) {
    const key = categorize(a);
    const list = groups.get(key) ?? [];
    list.push(a);
    groups.set(key, list);
  }

  const concerns: Concern[] = [];
  for (const [key, group] of groups) {
    const commentCount = group.reduce(
      (sum, a) => sum + (commentCounts.get(a.id) ?? 0),
      0,
    );
    concerns.push({
      category: getCategory(key),
      appeals: group.sort((a, b) => b.createdAt - a.createdAt),
      appealCount: group.length,
      commentCount,
      score: group.length + commentCount,
    });
  }

  return concerns.sort(
    (a, b) => b.score - a.score || b.appealCount - a.appealCount,
  );
}
