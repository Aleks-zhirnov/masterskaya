import { GoogleGenAI } from "@google/genai";

const SYSTEM_PROMPT = "Вы опытный инженер-электронщик в домашней мастерской по ремонту бытовой и автомобильной электроники. Вы специализируетесь на: диагностике неисправностей плат, определении компонентов по маркировке (SMD коды, корпуса), поиске аналогов запчастей, чтении схем. Отвечайте кратко, профессионально и на русском языке. Используйте форматирование Markdown для списков.";

// --- Список бесплатных моделей OpenRouter (fallback по порядку) ---
const FREE_MODELS = [
  "mistralai/mistral-small-3.1-24b-instruct:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "nvidia/llama-3.1-nemotron-nano-8b-v1:free",
  "google/gemma-3-27b-it:free",
];

// Для сохранения совместимости с App.tsx оставляем старые названия функций
export const getOpenRouterKey = (): string => {
  try { return localStorage.getItem('workshop_openrouter_key') || ''; } catch { return ''; }
};

export const setOpenRouterKey = (key: string) => {
  try { localStorage.setItem('workshop_openrouter_key', key.trim()); } catch { }
};

// --- Вспомогательная функция для Google Gemini ---
const callGemini = async (systemPrompt: string, userPrompt: string, apiKey: string): Promise<string> => {
  try {
    const gemini = new GoogleGenAI({ apiKey });
    const response = await gemini.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: userPrompt,
      config: { systemInstruction: systemPrompt },
    });
    return response.text || "";
  } catch (error: any) {
    console.error("Gemini Error:", error);
    throw new Error(`❌ Ошибка Google Gemini: ${error.message || 'Проверьте правильность API ключа.'}`);
  }
};

// --- Вспомогательная функция для OpenRouter ---
const callOpenRouter = async (
  systemPrompt: string,
  userPrompt: string,
  apiKey: string
): Promise<string> => {
  for (const model of FREE_MODELS) {
    try {
      console.log(`[AI] Trying OpenRouter model: ${model}`);

      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": window.location.origin,
          "X-Title": "Workshop AI Assistant",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          provider: {
            allow_fallbacks: true,
          },
        }),
      });

      if (res.status === 429) {
        console.warn(`[AI] Rate limited on ${model}, trying next...`);
        // Ждём 2 секунды
        await new Promise(r => setTimeout(r, 2000));
        continue;
      }

      if (res.status === 404) {
        console.warn(`[AI] Model ${model} not found, trying next...`);
        continue;
      }

      if (!res.ok) {
        let errorDetail = '';
        try {
          const errBody = await res.json();
          errorDetail = errBody?.error?.message || JSON.stringify(errBody);
        } catch { errorDetail = await res.text().catch(() => ''); }

        const statusMessages: Record<number, string> = {
          401: '❌ Неверный API ключ. Проверьте ключ в настройках или получите новый на openrouter.ai',
          402: '❌ Закончился баланс на OpenRouter. Пополните счёт или используйте бесплатную модель.',
          403: '❌ Доступ запрещён. Проверьте права API ключа на openrouter.ai',
          408: '⏱ Таймаут запроса. Попробуйте ещё раз.',
          500: '🔧 Ошибка сервера OpenRouter. Попробуйте позже.',
          502: '🔧 Сервер OpenRouter временно недоступен. Попробуйте позже.',
          503: '🔧 Модель перегружена. Попробуйте через пару минут.',
        };

        const userMessage = statusMessages[res.status] || `❌ Ошибка OpenRouter (${res.status})`;
        console.error("OpenRouter API Error:", res.status, errorDetail);
        throw new Error(`${userMessage}${errorDetail ? `\n\nДетали: ${errorDetail}` : ''}`);
      }

      const data = await res.json();
      const raw = data.choices?.[0]?.message?.content || "";
      const cleaned = raw.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

      if (cleaned) {
        console.log(`[AI] Success with OpenRouter model: ${model}`);
        return cleaned;
      }

      console.warn(`[AI] Empty response from ${model}, trying next...`);
      continue;

    } catch (error: any) {
      if (error?.message?.startsWith('❌')) throw error;
      console.warn(`[AI] Error with ${model}:`, error.message);
      continue;
    }
  }

  throw new Error('⏳ Все бесплатные модели OpenRouter перегружены. Пожалуйста, используйте API ключ от Google Gemini (он абсолютно бесплатный и без таких лимитов).');
};

const dispatchAI = async (systemPrompt: string, userPrompt: string): Promise<string> => {
  const apiKey = getOpenRouterKey();
  if (!apiKey) {
    throw new Error("🔑 Введите API ключ (Google Gemini или OpenRouter) в настройках.");
  }

  // Если ключ начинается с sk-or- это OpenRouter. Иначе считаем что это Google Gemini.
  if (apiKey.startsWith('sk-or-')) {
    return await callOpenRouter(systemPrompt, userPrompt, apiKey);
  } else {
    return await callGemini(systemPrompt, userPrompt, apiKey);
  }
};

export const generateWorkshopAdvice = async (prompt: string): Promise<string> => {
  const apiKey = getOpenRouterKey();
  if (!apiKey) {
    return "🔑 Для работы AI введите ключ Google Gemini или OpenRouter в настройках выше. Рекомендуется Google Gemini, так как он не имеет жестких лимитов!";
  }

  try {
    const result = await dispatchAI(SYSTEM_PROMPT, prompt);
    if (result) return result;
    return "AI вернул пустой ответ. Попробуйте переформулировать вопрос.";
  } catch (error: any) {
    console.error("AI Dispatch Error:", error);
    return error?.message || "⚠️ Ошибка при обращении к нейросети. Проверьте интернет-соединение.";
  }
};

// --- AI-улучшение текста описания устройства ---

const BEAUTIFY_PROMPT = `Ты — помощник мастера по ремонту электроники. Тебе дают сырой текст описания поломки устройства, написанный мастером наспех. 

Твоя задача — ПЕРЕПИСАТЬ текст, сделав его:
1. Грамотным (исправить орфографию, пунктуацию)
2. Структурированным и читабельным
3. Кратким, но информативным (убрать воду, оставить суть)

СТРОГИЕ ПРАВИЛА:
- НЕ добавляй информацию, которой нет в оригинале
- НЕ пиши диагноз и решение, если мастер их не указал
- НЕ добавляй вступлений и заключений
- Верни ТОЛЬКО улучшенный текст, без кавычек, без пояснений
- Если текст уже хороший — верни его как есть
- Пиши на русском языке`;

export const beautifyDeviceText = async (
  deviceModel: string,
  issueDescription: string,
  notes?: string
): Promise<{ issueDescription: string; notes?: string }> => {
  const parts: string[] = [];

  parts.push(`Устройство: ${deviceModel}`);
  parts.push(`\n--- ОПИСАНИЕ ПОЛОМКИ (переписать) ---\n${issueDescription}`);

  if (notes && notes.trim()) {
    parts.push(`\n--- ЗАМЕТКИ МАСТЕРА (переписать) ---\n${notes}`);
  }

  parts.push(`\n--- ФОРМАТ ОТВЕТА ---`);
  if (notes && notes.trim()) {
    parts.push(`Верни ответ СТРОГО в формате:\nПОЛОМКА: <улучшенный текст поломки>\nЗАМЕТКИ: <улучшенные заметки>`);
  } else {
    parts.push(`Верни ТОЛЬКО улучшенный текст поломки, без префиксов и пояснений.`);
  }

  const prompt = parts.join('\n');

  const apiKey = getOpenRouterKey();
  if (!apiKey) throw new Error('🔑 Введите API ключ в настройках AI чата.');

  const cleaned = await dispatchAI(BEAUTIFY_PROMPT, prompt);

  if (!cleaned) throw new Error('AI вернул пустой ответ. Попробуйте ещё раз.');

  // Парсим ответ
  if (notes && notes.trim()) {
    const issueMatch = cleaned.match(/ПОЛОМКА:\s*([\s\S]*?)(?=\nЗАМЕТКИ:|$)/i);
    const notesMatch = cleaned.match(/ЗАМЕТКИ:\s*([\s\S]*?)$/i);

    return {
      issueDescription: issueMatch?.[1]?.trim() || cleaned,
      notes: notesMatch?.[1]?.trim() || notes,
    };
  }

  return { issueDescription: cleaned };
};
