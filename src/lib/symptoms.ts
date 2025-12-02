import AsyncStorage from "@react-native-async-storage/async-storage";

const SYMPTOMS_KEY = "user_symptoms";

export interface Symptom {
  id: string;
  name: string;
  severity: "mild" | "moderate" | "severe";
  timestamp: string;
  notes?: string;
}

export interface DaySymptoms {
  date: string; // YYYY-MM-DD
  symptoms: Symptom[];
}

// Common symptoms list
export const COMMON_SYMPTOMS = [
  "Headache",
  "Nausea",
  "Bloating",
  "Fatigue",
  "Stomach Pain",
  "Diarrhea",
  "Constipation",
  "Heartburn",
  "Rash",
  "Itching",
  "Dizziness",
  "Brain Fog",
];

export const symptoms = {
  // Get today's symptoms from local storage
  async getTodaySymptoms(): Promise<Symptom[]> {
    try {
      const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
      const data = await AsyncStorage.getItem(`${SYMPTOMS_KEY}_${today}`);
      if (data) {
        const daySymptoms: DaySymptoms = JSON.parse(data);
        return daySymptoms.symptoms || [];
      }
      return [];
    } catch (e) {
      console.error("Failed to load today's symptoms:", e);
      return [];
    }
  },

  // Save today's symptoms
  async saveTodaySymptoms(symptomsList: Symptom[]): Promise<void> {
    try {
      const today = new Date().toISOString().split("T")[0];
      const daySymptoms: DaySymptoms = {
        date: today,
        symptoms: symptomsList,
      };
      await AsyncStorage.setItem(`${SYMPTOMS_KEY}_${today}`, JSON.stringify(daySymptoms));
    } catch (e) {
      console.error("Failed to save symptoms:", e);
    }
  },

  // Add a symptom
  async addSymptom(name: string, severity: "mild" | "moderate" | "severe", notes?: string): Promise<Symptom> {
    const todaySymptoms = await this.getTodaySymptoms();
    const newSymptom: Symptom = {
      id: Date.now().toString(),
      name,
      severity,
      timestamp: new Date().toISOString(),
      notes,
    };
    const updated = [...todaySymptoms, newSymptom];
    await this.saveTodaySymptoms(updated);
    return newSymptom;
  },

  // Remove a symptom
  async removeSymptom(symptomId: string): Promise<void> {
    const todaySymptoms = await this.getTodaySymptoms();
    const updated = todaySymptoms.filter(s => s.id !== symptomId);
    await this.saveTodaySymptoms(updated);
  },
};

