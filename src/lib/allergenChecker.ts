import { preferences, UserPreferences } from "./preferences";

/**
 * Check if a food item contains any of the user's allergens
 * @param foodTags - Array of tags/allergens associated with the food
 * @param userAllergies - User's allergies (optional, will fetch if not provided)
 * @returns Array of matching allergens found in the food
 */
const ALLERGEN_ALIASES: Record<string, string[]> = {
  peanut:    ["peanut", "peanuts", "peanut butter", "groundnut"],
  "tree nut": ["tree nut", "tree nuts", "almond", "cashew", "walnut", "pecan", "pistachio", "hazelnut", "macadamia", "brazil nut"],
  dairy:     ["dairy", "milk", "cheese", "cream", "butter", "yogurt", "whey", "casein", "lactose"],
  lactose:   ["lactose", "milk", "cheese", "cream", "butter", "yogurt", "whey", "casein", "dairy"],
  egg:       ["egg", "eggs", "albumin", "mayonnaise", "mayo"],
  gluten:    ["gluten", "wheat", "barley", "rye", "flour", "bread", "pasta"],
  soy:       ["soy", "soya", "soybean", "tofu", "edamame", "miso", "tempeh"],
  fish:      ["fish", "cod", "salmon", "tuna", "tilapia", "halibut", "bass", "flounder", "anchovy"],
  shellfish: ["shellfish", "shrimp", "crab", "lobster", "clam", "oyster", "scallop", "mussel"],
  sesame:    ["sesame", "tahini", "sesame oil", "sesame seed"],
  sulfite:   ["sulfite", "sulfites", "sulphite", "sulphites", "sulfur dioxide"],
};

const findAliases = (allergy: string): string[] => {
  const exact = ALLERGEN_ALIASES[allergy];
  if (exact) return exact;
  // fuzzy: find a key that the allergy starts with or vice versa (handles plurals, e.g. "peanuts" → "peanut")
  const fuzzyKey = Object.keys(ALLERGEN_ALIASES).find(
    (key) => allergy.startsWith(key) || key.startsWith(allergy)
  );
  return fuzzyKey ? ALLERGEN_ALIASES[fuzzyKey] : [allergy];
};
export async function checkAllergens(
  foodTags: string[],
  userAllergies?: string[]
): Promise<string[]> {
  const allergies = userAllergies || (await preferences.fetch()).allergies;
  
  if (!allergies || allergies.length === 0) {
    return [];
  }

  // Normalize tags for comparison (case-insensitive)
  const normalizedFoodTags = foodTags.map(tag => tag.toLowerCase().trim());
  const normalizedAllergies = allergies.map(allergy => allergy.toLowerCase().trim());

  // Find matching allergens
  const matches: string[] = [];

normalizedAllergies.forEach((allergy, index) => {
  const relatedTerms = findAliases(allergy);

  const matched = normalizedFoodTags.some((foodTag) =>
    relatedTerms.some(
      (term) => foodTag.includes(term) || term.includes(foodTag)
    )
  );

  if (matched) {
    const originalAllergy = allergies[index];
    if (originalAllergy && !matches.includes(originalAllergy)) {
      matches.push(originalAllergy);
    }
  }
});
  return matches;
}

/**
 * Check if a food item matches user's dietary preferences
 * @param foodTags - Array of dietary tags associated with the food
 * @param userPreferences - User's dietary preferences (optional, will fetch if not provided)
 * @returns Object with match status and matching preferences
 */
export async function checkDietaryPreferences(
  foodTags: string[],
  userPreferences?: string[]
): Promise<{ matches: string[]; conflicts: string[] }> {
  const dietaryPrefs = userPreferences || (await preferences.fetch()).dietaryPreferences;
  
  if (!dietaryPrefs || dietaryPrefs.length === 0) {
    return { matches: [], conflicts: [] };
  }

  const normalizedFoodTags = foodTags.map(tag => tag.toLowerCase().trim());
  const normalizedPrefs = dietaryPrefs.map(pref => pref.toLowerCase().trim());

  const matches: string[] = [];
  const conflicts: string[] = [];

  // Check for matches (e.g., user is Vegan and food is tagged Vegan)
  normalizedFoodTags.forEach(foodTag => {
    const matchingPref = dietaryPrefs.find(
      pref => pref.toLowerCase().trim() === foodTag
    );
    if (matchingPref && !matches.includes(matchingPref)) {
      matches.push(matchingPref);
    }
  });

  // Check for conflicts (e.g., user is Vegan but food contains Dairy)
  // This is a simplified check - you might want more sophisticated logic
  const conflictKeywords: Record<string, string[]> = {
    "vegan": ["dairy", "eggs", "meat", "fish", "shellfish", "honey"],
    "vegetarian": ["meat", "fish", "shellfish"],
    "halal": ["pork", "alcohol"],
    "kosher": ["pork", "shellfish"],
    "gluten-free": ["gluten", "wheat"],
    "dairy-free": ["dairy", "lactose", "milk", "cheese"],
  };

  dietaryPrefs.forEach(pref => {
    const prefLower = pref.toLowerCase().trim();
    const conflictList = conflictKeywords[prefLower];
    if (conflictList) {
      conflictList.forEach(conflict => {
        if (normalizedFoodTags.some(foodTag => foodTag.includes(conflict))) {
          const originalPref = dietaryPrefs.find(
            p => p.toLowerCase().trim() === prefLower
          );
          if (originalPref && !conflicts.includes(originalPref)) {
            conflicts.push(originalPref);
          }
        }
      });
    }
  });

  return { matches, conflicts };
}

/**
 * Comprehensive check for both allergens and dietary preferences
 * @param foodTags - Array of tags associated with the food
 * @param userPrefs - User preferences (optional, will fetch if not provided)
 * @returns Complete analysis with warnings and matches
 */
export async function analyzeFood(
  foodTags: string[],
  userPrefs?: UserPreferences
): Promise<{
  hasAllergenWarning: boolean;
  allergenMatches: string[];
  hasDietaryConflict: boolean;
  dietaryMatches: string[];
  dietaryConflicts: string[];
  warnings: string[];
}> {
  const prefs = userPrefs || await preferences.fetch();
  
  const allergenMatches = await checkAllergens(foodTags, prefs.allergies);
  const dietary = await checkDietaryPreferences(foodTags, prefs.dietaryPreferences);

  const warnings: string[] = [];

  if (allergenMatches.length > 0) {
    warnings.push(
      `⚠️ Contains allergens: ${allergenMatches.join(", ")}`
    );
  }

  if (dietary.conflicts.length > 0) {
    warnings.push(
      `⚠️ Conflicts with dietary preference: ${dietary.conflicts.join(", ")}`
    );
  }

  return {
    hasAllergenWarning: allergenMatches.length > 0,
    allergenMatches,
    hasDietaryConflict: dietary.conflicts.length > 0,
    dietaryMatches: dietary.matches,
    dietaryConflicts: dietary.conflicts,
    warnings,
  };
}

