import { GoogleGenAI } from "@google/genai";

const GEMINI_API_KEY = typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : undefined;

let ai: GoogleGenAI | null = null;

function getAI(): GoogleGenAI {
  if (!ai) {
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured.");
    }
    ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  }
  return ai;
}

export const geminiService = {
  isAvailable: () => !!GEMINI_API_KEY,

  askGemini: async (prompt: string, context?: string): Promise<string> => {
    try {
      const client = getAI();
      const fullPrompt = context
        ? `Context: ${context}\n\nUser Question: ${prompt}\n\nProvide a concise and helpful response as a medical assistant.`
        : prompt;

      const response = await client.models.generateContent({
        model: "gemini-2.0-flash",
        contents: fullPrompt,
        config: {
          systemInstruction:
            "You are an AI Medical Assistant for Al-Wali Hospital. Help staff with queries, summaries, and data analysis. Always be professional and concise."
        }
      });

      return response.text ?? "لم يتم إرجاع أي نص من الذكاء الاصطناعي.";
    } catch (error) {
      console.error("Gemini API Error:", error);
      return "عذراً، حدث خطأ أثناء الاتصال بالذكاء الاصطناعي.";
    }
  },

  suggestDiagnosis: async (symptoms: string[]): Promise<string> => {
    try {
      const client = getAI();
      const prompt = `Based on the following symptoms: ${symptoms.join(", ")}, suggest possible diagnoses and recommended first steps. Provide the response in Arabic.`;

      const response = await client.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
        config: {
          systemInstruction:
            "You are a professional medical diagnostic assistant. Provide structured Arabic responses with headers. Disclaimer: Always state this is for guidance only."
        }
      });

      return response.text ?? "لم يتم إرجاع أي نص.";
    } catch (error) {
      console.error("Gemini Diagnosis Error:", error);
      throw new Error("حدث خطأ أثناء الحصول على تشخيص ذكي.");
    }
  }
};

export const askGemini = geminiService.askGemini;
