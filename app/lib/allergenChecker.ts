import { preferences, UserPreferences } from "./preferences";

/**
 * Check if a food item contains any of the user's allergens
 * @param foodTags - Array of tags/allergens associated with the food
 * @param userAllergies - User's allergies (optional, will fetch if not provided)
 * @returns Array of matching allergens found in the food
 */
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
  normalizedFoodTags.forEach((foodTag, index) => {
    if (normalizedAllergies.includes(foodTag)) {
      // Return the original case version from allergies array
      const originalAllergy = allergies.find(
        a => a.toLowerCase().trim() === foodTag
      );
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
        if (normalizedFoodTags.includes(conflict)) {
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

