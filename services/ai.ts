import { GoogleGenAI } from "@google/genai";

const getClient = (): GoogleGenAI | null => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API_KEY is missing in environment variables. Check .env or cloud provider settings.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateWorkshopAdvice = async (prompt: string): Promise<string> => {
  const ai = getClient();
  if (!ai) return "Для работы AI функций необходимо настроить API ключ (API_KEY).";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        systemInstruction: "Вы опытный инженер-электронщик в домашней мастерской. Вы помогаете с поиском аналогов запчастей, диагностикой неисправностей и организацией рабочего процесса. Отвечай кратко, профессионально и на русском языке. Используй форматирование Markdown для списков.",
      }
    });

    return response.text || "Не удалось получить ответ от AI.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Произошла ошибка при обращении к AI помощнику. Возможно, неверный ключ или закончилась квота.";
  }
};