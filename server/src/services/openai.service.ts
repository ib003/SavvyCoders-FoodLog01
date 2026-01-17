import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function chatWithAI(message: string) {
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are a helpful food and nutrition assistant." },
      { role: "user", content: message },
    ],
  });

  return response.choices[0].message.content;
}

export async function analyzeSymptoms(payload: {
  foods: string[];
  symptoms: string[];
  allergies?: string[];
  notes?: string;
}) {
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content:
          "You are a cautious nutrition helper. You do NOT diagnose. You suggest possible food triggers and practical next steps. Output ONLY valid JSON.",
      },
      {
        role: "user",
        content: `
Analyze possible food triggers.

Foods eaten:
${payload.foods.map((f) => `- ${f}`).join("\n")}

Symptoms:
${payload.symptoms.map((s) => `- ${s}`).join("\n")}

Known allergies/intolerances:
${(payload.allergies?.length ? payload.allergies : ["(none provided)"])
          .map((a) => `- ${a}`)
          .join("\n")}

Extra notes:
${payload.notes ?? "(none)"}

Return JSON with this exact shape:
{
  "likely_triggers": [
    { "trigger": string, "reason": string, "confidence": "low"|"medium"|"high" }
  ],
  "quick_actions_today": [string],
  "what_to_log_next_time": [string],
  "red_flags_seek_care_if": [string],
  "disclaimer": string
}
`.trim(),
      },
    ],
  });

  const text = response.choices[0].message.content ?? "{}";

  try {
    return JSON.parse(text);
  } catch {
    return { error: "invalid_json_from_model", raw: text };
  }
}