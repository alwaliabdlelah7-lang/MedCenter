import { GoogleGenAI } from "@google/genai";

// Initialize the API with our environment variable
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const geminiService = {
  askGemini: async (prompt: string, context?: string) => {
    try {
      const fullPrompt = context 
        ? `Context: ${context}\n\nUser Question: ${prompt}\n\nProvide a concise and helpful response as a medical assistant.`
        : prompt;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: fullPrompt,
        config: {
          systemInstruction: "You are an AI Medical Assistant for Al-Wali Hospital. Help staff with queries, summaries, and data analysis. Always be professional and concise."
        }
      });

      return response.text;
    } catch (error) {
      console.error("Gemini API Error:", error);
      return "عذراً، حدث خطأ أثناء الاتصال بالذكاء الاصطناعي.";
    }
  },

  suggestDiagnosis: async (symptoms: string[]) => {
    try {
      const prompt = `Based on the following symptoms: ${symptoms.join(', ')}, suggest possible diagnoses and recommended first steps. Provide the response in Arabic.`;
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          systemInstruction: "You are a professional medical diagnostic assistant. Provide structured Arabic responses with headers. Disclaimer: Always state this is for guidance only."
        }
      });

      return response.text;
    } catch (error) {
      console.error("Gemini Diagnosis Error:", error);
      throw new Error("حدث خطأ أثناء الحصول على تشخيص ذكي.");
    }
  }
};

export const askGemini = geminiService.askGemini;
