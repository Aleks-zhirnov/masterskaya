import { GoogleGenAI } from "@google/genai";

const SYSTEM_PROMPT = "Вы опытный инженер-электронщик в домашней мастерской по ремонту бытовой и автомобильной электроники. Вы специализируетесь на: диагностике неисправностей плат, определении компонентов по маркировке (SMD коды, корпуса), поиске аналогов запчастей, чтении схем. Отвечайте кратко, профессионально и на русском языке. Используйте форматирование Markdown для списков.";

// --- Ключи: localStorage → env fallback ---

export const getOpenRouterKey = (): string => {
  try { return localStorage.getItem('workshop_openrouter_key') || ''; } catch { return ''; }
};

export const setOpenRouterKey = (key: string) => {
  try { localStorage.setItem('workshop_openrouter_key', key); } catch { }
};

const getGeminiClient = (): GoogleGenAI | null => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

const generateViaOpenRouter = async (prompt: string): Promise<string> => {
  const apiKey = getOpenRouterKey() || process.env.OPENROUTER_API_KEY || '';
  if (!apiKey) return "";

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      "HTTP-Referer": window.location.origin,
      "X-Title": "Workshop AI Assistant",
    },
    body: JSON.stringify({
      model: "mistralai/mistral-small-3.1-24b-instruct:free",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
    }),
  });

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
      429: '⏳ Слишком много запросов. Подождите минуту и попробуйте снова.',
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
  return raw.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
};

export const generateWorkshopAdvice = async (prompt: string): Promise<string> => {
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

  const hasKey = !!getOpenRouterKey();

  try {
    const result = await generateViaOpenRouter(prompt);
    if (result) return result;
    if (!hasKey) return "🔑 Для работы AI введите ключ OpenRouter в настройках выше (бесплатно на openrouter.ai).";
    return "AI вернул пустой ответ. Попробуйте переформулировать вопрос.";
  } catch (error: any) {
    console.error("OpenRouter Error:", error);
    if (error?.message) return error.message;
    return hasKey
      ? "⚠️ Ошибка при обращении к OpenRouter. Проверьте интернет-соединение."
      : "🔑 Для работы AI введите ключ OpenRouter в настройках выше (бесплатно на openrouter.ai).";
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

  const apiKey = getOpenRouterKey() || process.env.OPENROUTER_API_KEY || '';
  if (!apiKey) throw new Error('🔑 Для работы AI введите ключ OpenRouter в настройках AI чата.');

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
      "HTTP-Referer": window.location.origin,
      "X-Title": "Workshop AI Assistant",
    },
    body: JSON.stringify({
      model: "mistralai/mistral-small-3.1-24b-instruct:free",
      messages: [
        { role: "system", content: BEAUTIFY_PROMPT },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!res.ok) {
    let errorDetail = '';
    try {
      const errBody = await res.json();
      errorDetail = errBody?.error?.message || '';
    } catch { }
    throw new Error(`Ошибка AI (${res.status}): ${errorDetail || 'попробуйте позже'}`);
  }

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content || "";
  const cleaned = raw.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

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
