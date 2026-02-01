import { GoogleGenAI } from "@google/genai";

// Используем ключ напрямую, чтобы избежать ошибок process is not defined в браузере
const API_KEY = "AIzaSyCK3qZTuCSoLrgXdL8oV_qEsyV2pzDdBPI";

const getClient = (): GoogleGenAI | null => {
  if (!API_KEY) {
    console.error("API_KEY is missing");
    return null;
  }
  return new GoogleGenAI({ apiKey: API_KEY });
};

export const generateWorkshopAdvice = async (prompt: string): Promise<string> => {
  const ai = getClient();
  if (!ai) return "Ошибка: API ключ не найден.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash', // Используем актуальную быструю модель
      contents: prompt,
      config: {
        systemInstruction: "Вы опытный инженер-электронщик в домашней мастерской. Вы помогаете с поиском аналогов запчастей, диагностикой неисправностей и организацией рабочего процесса. Отвечай кратко, профессионально и на русском языке. Используй форматирование Markdown для списков.",
      }
    });

    return response.text || "Не удалось получить ответ от AI.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Произошла ошибка при обращении к AI помощнику. Проверьте консоль.";
  }
};