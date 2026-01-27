import { GoogleGenAI } from "@google/genai";

const getClient = (): GoogleGenAI | null => {
  if (!process.env.API_KEY) {
    console.error("API_KEY is missing");
    return null;
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const generateWorkshopAdvice = async (prompt: string): Promise<string> => {
  const ai = getClient();
  if (!ai) return "Ошибка: API ключ не найден.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "Вы опытный инженер-электронщик в домашней мастерской. Вы помогаете с поиском аналогов запчастей, диагностикой неисправностей и организацией рабочего процесса. Отвечай кратко, профессионально и на русском языке.",
      }
    });

    return response.text || "Не удалось получить ответ от AI.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Произошла ошибка при обращении к AI помощнику.";
  }
};