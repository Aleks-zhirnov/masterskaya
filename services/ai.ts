import { GoogleGenAI } from "@google/genai";

const SYSTEM_PROMPT = "Вы опытный инженер-электронщик в домашней мастерской по ремонту бытовой и автомобильной электроники. Вы специализируетесь на: диагностике неисправностей плат, определении компонентов по маркировке (SMD коды, корпуса), поиске аналогов запчастей, чтении схем. Отвечайте кратко, профессионально и на русском языке. Используйте форматирование Markdown для списков.";

// --- Динамический список бесплатных моделей OpenRouter ---
// Модели OpenRouter часто меняются, поэтому мы скачиваем актуальные модели прямо перед запросом.
let cachedFreeModels: string[] = [];

const getAvailableFreeModels = async (): Promise<string[]> => {
  if (cachedFreeModels.length > 0) return cachedFreeModels;
  try {
    const res = await fetch("https://openrouter.ai/api/v1/models");
    const data = await res.json();
    const models = data.data
      .map((m: any) => m.id)
      .filter((id: string) => id.endsWith(":free"));

    // Перемешиваем массив, чтобы запросы шли к разным моделям (защита от 429 ошибки)
    cachedFreeModels = models.sort(() => 0.5 - Math.random());
    return cachedFreeModels;
  } catch (e) {
    // Резервный список, 100% рабочих на текущий момент
    return [
      "stepfun/step-3.5-flash:free",
      "qwen/qwen3-next-80b-a3b-instruct:free",
      "nvidia/nemotron-nano-9b-v2:free",
      "z-ai/glm-4.5-air:free",
      "liquid/lfm-2.5-1.2b-instruct:free",
      "cognitivecomputations/dolphin-mistral-24b-venice-edition:free"
    ];
  }
};

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
    let errorMsg = error.message || 'Проверьте правильность ключа.';

    // Делаем красивый вывод ошибки для заблокированных ключей
    if (errorMsg.includes('limit: 0') || errorMsg.includes('RESOURCE_EXHAUSTED') || errorMsg.includes('429 Quota Exceeded')) {
      errorMsg = 'Google заблокировал бесплатный доступ к Gemini из вашего текущего региона (РФ). Без VPN не работает. Пожалуйста, используйте API ключ от OpenRouter (он работает без VPN).';
    } else if (errorMsg.includes('leaked')) {
      errorMsg = 'Этот API ключ заблокирован Google (так как он попал в открытый доступ в интернет). Пожалуйста, удалите его и создайте новый ключ.';
    } else if (errorMsg.includes('API_KEY_INVALID') || errorMsg.includes('key not valid')) {
      errorMsg = 'Неверный API ключ. Проверьте, что скопировали его без пробелов на aistudio.google.com';
    } else if (errorMsg.includes('403')) {
      errorMsg = 'Доступ запрещён. Проверьте правильность API ключа.';
    }

    throw new Error(`❌ Ошибка Google Gemini: ${errorMsg}`);
  }
};

// --- Вспомогательная функция для OpenRouter ---
const callOpenRouter = async (
  systemPrompt: string,
  userPrompt: string,
  apiKey: string
): Promise<string> => {
  const freeModels = await getAvailableFreeModels();
  // Берём первые 5 случайных бесплатных моделей, чтобы попробовать
  const modelsToTry = freeModels.slice(0, 5);

  for (const model of modelsToTry) {
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
            allow_fallbacks: true, // Даем право OpenRouter самому искать
          },
        }),
      });

      // Сразу переходим к следующей модели, если лимит или не найдено
      if (res.status === 429 || res.status === 404) {
        console.warn(`[AI] Model ${model} skipped (${res.status}), trying next...`);
        continue;
      }

      if (!res.ok) {
        let errorDetail = '';
        try {
          const errBody = await res.json();
          errorDetail = errBody?.error?.message || JSON.stringify(errBody);
        } catch { errorDetail = await res.text().catch(() => ''); }

        // Если проблема с ключом (401-403), нет смысла пробовать другие модели
        if (res.status === 401 || res.status === 402 || res.status === 403) {
          const statusMessages: Record<number, string> = {
            401: '❌ Неверный API ключ. Проверьте ключ в настройках или получите новый на openrouter.ai',
            402: '❌ Закончился баланс на OpenRouter. Пополните счёт или используйте бесплатную модель.',
            403: '❌ Доступ запрещён. Проверьте права API ключа на openrouter.ai',
          };
          throw new Error(statusMessages[res.status] || `❌ Ошибка ${res.status}`);
        }

        console.warn(`[AI] Error ${res.status} on ${model}, trying next...`);
        continue;
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

  throw new Error('⏳ Все 5 выбранных бесплатных моделей сейчас перегружены. Немного подождите и отправьте запрос снова.');
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
