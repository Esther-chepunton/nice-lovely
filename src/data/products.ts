export type ProductBullet = { text: string };

export type Ingredient = { name: string; detail: string };

export type Product = {
  id: string;
  name: string;
  backgroundColor: string;
  bottleImage: string;
  bottleOffsetX: number;
  bottleOffsetY: number;
  descriptionLeft: number;
  descriptionTop: number;
  intro: string;
  bullets: ProductBullet[];
  sizes: string[];
  purpose: string;
  accentColor: string;
  ingredients: Ingredient[];
  whoShouldUse: string;
};

export type CatalogProduct = Pick<
  Product,
  | "id"
  | "name"
  | "sizes"
  | "purpose"
  | "accentColor"
  | "ingredients"
  | "whoShouldUse"
>;

const figma = (filename: string) => `/figma/${filename}`;

export const heroProducts: Product[] = [
  {
    id: "lemon-extract",
    name: "Lemon Extract Lotion",
    backgroundColor: "#f6d94a",
    bottleImage: figma("bottle-lemon.png"),
    bottleOffsetX: 256.4,
    bottleOffsetY: 29.4,
    descriptionLeft: 228,
    descriptionTop: 326,
    intro:
      "Lemon extract is highly prized for its skin-brightening, refreshing, and clarifying properties. Here is a detailed breakdown of how it benefits your skin:",
    bullets: [
      {
        text: "Fades Dark Spots: Contains natural citric acid that gently exfoliates to clear acne scars, blemishes, and hyperpigmentation.",
      },
      {
        text: "Brightens Dull Skin: Packed with Vitamin C to restore radiance and bring back a healthy, natural glow.",
      },
      {
        text: "Evens Skin Tone: Actively targets sun damage, tan lines, and uneven patches across the body.",
      },
      {
        text: "Controls Excess Oil: Functions as a natural astringent to minimize pores and manage greasy or oily skin zones.",
      },
    ],
    sizes: ["360ml", "600ml"],
    purpose:
      "Light, refreshing hydration with a citrus brightening feel; non-greasy",
    accentColor: "#5C6B2E",
    ingredients: [{ name: "Lemon extract", detail: "non-greasy" }],
    whoShouldUse:
      "People with normal/oily-leaning skin who want a fresh scent and light finish, especially in warm climates",
  },
  {
    id: "cocoa-butter",
    name: "Cocoa Butter Lotion",
    backgroundColor: "#8a5a3b",
    bottleImage: figma("bottle-cocoa.png"),
    bottleOffsetX: 153.4,
    bottleOffsetY: 112.4,
    descriptionLeft: 121,
    descriptionTop: 338,
    intro:
      "This variant is engineered for extra dry skin types requiring deep structural repair.",
    bullets: [
      {
        text: "Deep Moisture Lock: Creates a rich, protective barrier that seals in hydration to heal flaking skin.",
      },
      {
        text: "Improves Skin Elasticity: The rich fatty acids soften scar tissue and visibly reduce stretch marks over time.",
      },
      {
        text: "Environmental Shield: Rich in Vitamin E to fight off cell damage caused by sun and wind exposure.",
      },
    ],
    sizes: ["200ml", "400ml", "600ml", "850ml"],
    purpose:
      "Deep, rich moisturizing for very dry skin; leaves a soft, slightly heavier finish",
    accentColor: "#6B4226",
    ingredients: [
      { name: "Cocoa butter", detail: "often paired with shea butter" },
    ],
    whoShouldUse:
      'People with dry to very dry skin, especially in cold/dry weather; those who like a thicker, more "buttery" lotion',
  },
  {
    id: "glycerine",
    name: "Glycerine Lotion",
    backgroundColor: "#d37dd4",
    bottleImage: figma("bottle-glycerine.png"),
    bottleOffsetX: -115.6,
    bottleOffsetY: 110.4,
    descriptionLeft: 65,
    descriptionTop: 309,
    intro:
      "This formula specializes in instant, long-lasting relief for chronically parched or rough body zones.",
    bullets: [
      {
        text: "Humectant Action: Pure glycerine acts like a moisture magnet, pulling hydration deep into skin cells.",
      },
      {
        text: "Intense Softening: Infused with almond oil to restore lipids, leaving skin feeling immediately supple.",
      },
      { text: "48-Hour Comfort" },
    ],
    sizes: ["600ml", "850ml"],
    purpose: "Draws and locks in moisture; good for very dry, flaky skin",
    accentColor: "#5C3D7A",
    ingredients: [{ name: "Glycerine", detail: "humectant" }],
    whoShouldUse:
      "Dry-skin sufferers, especially in low-humidity conditions; those prone to ashy/flaky skin",
  },
  {
    id: "aloe-vera",
    name: "Aloe Vera Herbal Lotion",
    backgroundColor: "#67b86a",
    bottleImage: figma("bottle-aloe.png"),
    bottleOffsetX: -115.6,
    bottleOffsetY: 110.4,
    descriptionLeft: 41,
    descriptionTop: 362,
    intro:
      "This variant is formulated to soothe, cool, and rehydrate reactive or heat-stressed skin.",
    bullets: [
      {
        text: "Calms Inflammation: Naturally reduces redness and irritation caused by shaving, friction, or environmental heat.",
      },
      {
        text: "Lightweight Hydration: Delivers oil-free moisture that absorbs in seconds, making it ideal for hot weather.",
      },
      {
        text: "Skin Refreshing: Heals minor sun damage and windburn by supplying vital plant carbohydrates.",
      },
    ],
    sizes: ["200ml", "600ml", "850ml"],
    purpose: "Soothing, calming hydration",
    accentColor: "#2D5A3D",
    ingredients: [
      { name: "Aloe vera", detail: "Soothing, calming hydration" },
    ],
    whoShouldUse:
      "Sensitive or irritation-prone skin; anyone wanting a gentler, calming everyday lotion",
  },
  {
    id: "body-milk",
    name: "Body Milk Lotion",
    backgroundColor: "#4b3ffb",
    bottleImage: figma("bottle-milk.png"),
    bottleOffsetX: -117.6,
    bottleOffsetY: 81.4,
    descriptionLeft: 93,
    descriptionTop: 309,
    intro:
      "This protein-rich variant focuses on skin rejuvenation and texture smoothing.",
    bullets: [
      {
        text: "Texture Refinement: Rejuvenating milk cream gently works to soften rough texture on elbows, knees, and feet.",
      },
      {
        text: "Protein Nourishment: Enriched with Hydrolyzed Wheat Protein to strengthen the skin's natural moisture barrier.",
      },
      {
        text: "Restorative Protection: Locks in moisture to keep the body looking refreshed and glowing all day long.",
      },
    ],
    sizes: ["400ml", "600ml", "850ml"],
    purpose: "Fast-absorbing, lightweight daily hydration",
    accentColor: "#1E3A5F",
    ingredients: [{ name: "Milk proteins", detail: "light emollients" }],
    whoShouldUse:
      "Everyday users who want a light, non-greasy lotion for normal to slightly dry skin",
  },
  {
    id: "carrot",
    name: "Carrot Lotion",
    backgroundColor: "#f07405",
    bottleImage: figma("bottle-carrot.png"),
    bottleOffsetX: -115.6,
    bottleOffsetY: 110.4,
    descriptionLeft: 79,
    descriptionTop: 309,
    intro:
      "This option targets dullness and signs of fatigue to promote an overall healthy skin tone.",
    bullets: [
      {
        text: "Vibrant Radiance: Carrot oil contains high amounts of beta-carotene to revitalize lackluster skin tones.",
      },
      {
        text: "Cell Renewal: Accelerates surface skin cell turnover to reveal fresher, younger-looking layers beneath.",
      },
      {
        text: "Anti-Fatigue Glow: Clears away uneven patches to give arms and legs a healthy, uniform appearance.",
      },
    ],
    sizes: ["360ml"],
    purpose: "Moisturizing with an even-tone/brightening marketing angle",
    accentColor: "#C05621",
    ingredients: [
      {
        name: "Carrot extract",
        detail: "even-tone/brightening marketing angle",
      },
    ],
    whoShouldUse:
      "Users wanting a nourishing daily lotion with a glow-focused positioning",
  },
];

/** Not rendered in the hero — kept for future catalog expansion. */
export const catalogOnlyProducts: CatalogProduct[] = [
  {
    id: "lanolin",
    name: "Lanolin Lotion",
    sizes: ["360ml"],
    purpose: "Very emollient, occlusive moisture barrier",
    accentColor: "#5C4033",
    ingredients: [{ name: "Lanolin", detail: "occlusive moisture barrier" }],
    whoShouldUse:
      "Extremely dry or cracked skin (e.g. hands, heels, elbows)",
  },
  {
    id: "coconut-glow",
    name: "Coconut Glow Lotion",
    sizes: ["400ml"],
    purpose: 'Nourishing hydration with a tropical scent and "glow" finish',
    accentColor: "#1A6BB5",
    ingredients: [
      {
        name: "Coconut oil",
        detail: 'tropical scent and "glow" finish',
      },
    ],
    whoShouldUse:
      "Users who like coconut-scented lotions and want a dewy finish",
  },
];

/** Campaign layer: the one-word "shade", short nav label and a legible ink per background. */
export type CampaignMeta = {
  short: string;
  shade: string;
  keyword: string;
  ink: string;
};

export const campaign: Record<string, CampaignMeta> = {
  "lemon-extract": { short: "Lemon", shade: "Brighten", keyword: "Lemon", ink: "#3a3207" },
  "cocoa-butter": { short: "Cocoa", shade: "Repair", keyword: "Cocoa", ink: "#fff4e8" },
  glycerine: { short: "Glycerine", shade: "Quench", keyword: "Glycerine", ink: "#3b0f3c" },
  "aloe-vera": { short: "Aloe", shade: "Soothe", keyword: "Aloe", ink: "#0f3218" },
  "body-milk": { short: "Milk", shade: "Smooth", keyword: "Milk", ink: "#ffffff" },
  carrot: { short: "Carrot", shade: "Glow", keyword: "Carrot", ink: "#3a1500" },
};

export const COVER_THEME = { bg: "#f6efe4", ink: "#3b1d4a" } as const;

/** "Fades Dark Spots: Contains…" → { title, detail } */
export function splitBenefit(text: string): { title: string; detail: string } {
  const at = text.indexOf(":");
  if (at === -1) return { title: text, detail: "" };
  return { title: text.slice(0, at).trim(), detail: text.slice(at + 1).trim() };
}
