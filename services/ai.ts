import { GoogleGenAI } from "@google/genai";

const SYSTEM_PROMPT = "Вы опытный инженер-электронщик в домашней мастерской по ремонту бытовой и автомобильной электроники. Вы специализируетесь на: диагностике неисправностей плат, определении компонентов по маркировке (SMD коды, корпуса), поиске аналогов запчастей, чтении схем. Отвечайте кратко, профессионально и на русском языке. Используйте форматирование Markdown для списков.";

const getGeminiClient = (): GoogleGenAI | null => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

const generateViaOpenRouter = async (prompt: string): Promise<string> => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return "";

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "deepseek/deepseek-r1:free",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!res.ok) throw new Error(`OpenRouter error: ${res.status}`);
  const data = await res.json();
  // DeepSeek R1 может возвращать reasoning в <think> тегах — убираем их
  const raw = data.choices?.[0]?.message?.content || "";
  return raw.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
};

export const generateWorkshopAdvice = async (prompt: string): Promise<string> => {
  // 1. Пробуем Gemini (если есть API_KEY)
  const gemini = getGeminiClient();
  if (gemini) {
    try {
      const response = await gemini.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
        config: { systemInstruction: SYSTEM_PROMPT },
      });
      return response.text || "Не удалось получить ответ от AI.";
    } catch (error) {
      console.error("Gemini Error:", error);
    }
  }

  // 2. Пробуем DeepSeek R1 через OpenRouter (если есть OPENROUTER_API_KEY)
  try {
    const result = await generateViaOpenRouter(prompt);
    if (result) return result;
  } catch (error) {
    console.error("OpenRouter Error:", error);
  }

  // 3. Нет ключей
  return "Для работы AI настройте API_KEY (Gemini) или OPENROUTER_API_KEY (бесплатный DeepSeek R1 на openrouter.ai).";
};
