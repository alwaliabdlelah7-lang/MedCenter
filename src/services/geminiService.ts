import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

let aiClient: GoogleGenAI | null = null;

if (apiKey) {
  aiClient = new GoogleGenAI({ apiKey });
}

export const geminiService = {
  async analyzeMedicalRecord(record: string): Promise<string> {
    if (!aiClient) {
      throw new Error("Gemini API key is not configured.");
    }

    try {
      const response = await aiClient.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: `قم بتحليل السجل الطبي التالي باللغة العربية وقدم ملخصاً طبياً، تشخيصات محتملة، وتوصيات للفحوصات اللازمة:
        
        ${record}` }] }],
      });

      return response.text || "لم يتمكن الذكاء الاصطناعي من توليد رد.";
    } catch (error) {
      console.error("Gemini Analysis Error:", error);
      throw error;
    }
  },

  async suggestDiagnosis(symptoms: string[]): Promise<string> {
    if (!aiClient) {
      throw new Error("Gemini API key is not configured.");
    }

    try {
      const response = await aiClient.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: `بناءً على الأعراض التالية، ما هي التشخيصات المحتملة؟ (هذا رد استرشادي فقط وليس تشخيصاً نهائياً):
        
        ${symptoms.join(", ")}` }] }],
      });

      return response.text || "لا توجد اقتراحات حالياً.";
    } catch (error) {
      console.error("Gemini Diagnosis Suggestion Error:", error);
      throw error;
    }
  }
};
