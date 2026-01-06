import { GoogleGenAI, Type } from "@google/genai";
import { BodyMetrics } from "../types";

const apiKey = process.env.API_KEY || '';

// Define the response schema for structured output
const schema = {
  type: Type.OBJECT,
  properties: {
    weight: { type: Type.NUMBER, description: "Total body weight in kg" },
    skeletalMuscle: { type: Type.NUMBER, description: "Skeletal muscle mass in kg" },
    fatMass: { type: Type.NUMBER, description: "Body fat mass in kg" },
    bmi: { type: Type.NUMBER, description: "Body Mass Index" },
    bodyFatPercent: { type: Type.NUMBER, description: "Percentage of body fat" },
    visceralFat: { type: Type.NUMBER, description: "Visceral fat level or grade" },
    basalMetabolism: { type: Type.NUMBER, description: "Basal metabolic rate in kcal" },
    healthScore: { type: Type.NUMBER, description: "Health score or InBody score" },
    dateStr: { type: Type.STRING, description: "Date of measurement found on receipt in YYYY-MM-DD format, or approximate if partial." }
  },
  required: ["weight", "skeletalMuscle", "fatMass"],
};

export const extractMetricsFromImage = async (base64Image: string): Promise<Partial<BodyMetrics>> => {
  if (!apiKey) {
    throw new Error("API Key is missing. Please check your configuration.");
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg', // Assuming JPEG for simplicity from canvas/input
              data: base64Image.split(',')[1], // Remove data url prefix
            }
          },
          {
            text: `Analyze this body composition receipt. Extract the numerical values for Weight, Skeletal Muscle, Fat Mass, BMI, Percentage Body Fat, Visceral Fat Grade, Basal Metabolism, and Health Score. 
            Also extract the date and time of the measurement if visible.
            Return the data as a JSON object matching the schema.`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No data returned from AI");
    
    const data = JSON.parse(jsonText);

    // Parse date if valid, else default to now
    let dateObj = new Date();
    if (data.dateStr) {
        const parsed = Date.parse(data.dateStr);
        if (!isNaN(parsed)) {
            dateObj = new Date(parsed);
        }
    }

    return {
      weight: data.weight,
      skeletalMuscle: data.skeletalMuscle,
      fatMass: data.fatMass,
      bmi: data.bmi,
      bodyFatPercent: data.bodyFatPercent,
      visceralFat: data.visceralFat,
      basalMetabolism: data.basalMetabolism,
      healthScore: data.healthScore,
      date: dateObj.toISOString(),
    };

  } catch (error) {
    console.error("Gemini Extraction Error:", error);
    throw error;
  }
};