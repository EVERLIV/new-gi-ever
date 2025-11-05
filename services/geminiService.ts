import { GoogleGenAI, Type, Chat, Modality } from "@google/genai";
import type { BloodTestAnalysis, Biomarker, AIGeneratedRecommendations, User } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
      description: "Краткое, понятное резюме ключевых выводов из результатов анализа крови."
    },
    biomarkers: {
      type: Type.ARRAY,
      description: "Массив значимых биомаркеров, найденных в результатах.",
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Название биомаркера (например, 'Холестерин', 'Глюкоза')." },
          value: { type: Type.STRING, description: "Измеренное значение биомаркера в виде строки." },
          unit: { type: Type.STRING, description: "Единица измерения для значения (например, 'мг/дл', '%')." },
          range: { type: Type.STRING, description: "Нормальный референсный диапазон для этого биомаркера." },
          explanation: { type: Type.STRING, description: "Простое объяснение того, что этот биомаркер говорит о здоровье." },
          status: { type: Type.STRING, description: "Статус биомаркера, может быть 'норма', 'пограничное', 'высокий' или 'низкий'."}
        },
        required: ["name", "value", "unit", "range", "explanation", "status"]
      }
    },
    recommendations: {
      type: Type.ARRAY,
      description: "Список из 3-5 общих, не предписывающих рекомендаций по здоровому образу жизни и благополучию на основе результатов.",
      items: {
        type: Type.STRING
      }
    }
  },
  required: ["summary", "biomarkers", "recommendations"]
};


export const analyzeBloodTest = async (base64Image: string, mimeType: string, customBiomarkers?: string): Promise<BloodTestAnalysis> => {
  const userFocusPrompt = customBiomarkers
    ? `Пользователь особенно интересуется следующими биомаркерами: ${customBiomarkers}. Пожалуйста, уделите им первоочередное внимание в своем анализе, если они присутствуют в отчете.`
    : '';

  const prompt = `Вы — полезный ИИ-аналитик здоровья для приложения EVERLIV HEALTH. Ваша задача — проанализировать изображение отчета об анализе крови.
  
  ВАЖНО: Вы не являетесь медицинским работником. НЕ предоставляйте никаких медицинских диагнозов, планов лечения или рецептов. Ваш анализ должен быть информативным и сосредоточенным на общем благополучии.
  
  Проанализируйте предоставленное изображение отчета об анализе крови и структурируйте свои выводы в формате JSON. Определите ключевые биомаркеры, их значения, единицы измерения, нормальные диапазоны, а также предоставьте простое объяснение и статус (норма, пограничное, высокий или низкий).
  
  ${userFocusPrompt}
  
  Ваш ответ ДОЛЖЕН быть полностью на РУССКОМ языке.
  
  Вот отчет об анализе крови:`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Image,
            },
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
      },
    });

    const jsonString = response.text;
    const parsedResult = JSON.parse(jsonString);
    
    if (parsedResult && parsedResult.summary && Array.isArray(parsedResult.biomarkers) && Array.isArray(parsedResult.recommendations)) {
        return parsedResult as BloodTestAnalysis;
    } else {
        throw new Error("Ответ ИИ не соответствует ожидаемому формату.");
    }
  } catch (error) {
    console.error("Ошибка анализа анализа крови с помощью Gemini:", error);
    throw new Error("Не удалось проанализировать результаты анализа крови. Модель ИИ может быть временно недоступна.");
  }
};


const recommendationsSchema = {
    type: Type.OBJECT,
    properties: {
        nutrition: {
            type: Type.ARRAY,
            description: "Список из 2-4 действенных рекомендаций по питанию и диете.",
            items: { type: Type.STRING }
        },
        lifestyle: {
            type: Type.ARRAY,
            description: "Список из 2-3 рекомендаций по образу жизни, включая упражнения и другие привычки.",
            items: { type: Type.STRING }
        },
        supplements: {
            type: Type.ARRAY,
            description: "Список из 1-2 потенциальных добавок. ДОЛЖЕН содержать отказ от ответственности о необходимости проконсультироваться с врачом перед приемом.",
            items: { type: Type.STRING }
        },
        next_checkup: {
            type: Type.STRING,
            description: "Краткая рекомендация о том, когда следует пройти следующий осмотр для этого биомаркера (например, 'Через 3-6 месяцев')."
        }
    },
    required: ["nutrition", "lifestyle", "supplements", "next_checkup"]
};

export const getBiomarkerRecommendations = async (biomarker: { name: string, value: string, unit: string, status: 'normal' | 'borderline' | 'high' | 'low' }): Promise<AIGeneratedRecommendations> => {
    const prompt = `
        Вы — ИИ-тренер по здоровью и благополучию для приложения EVERLIV HEALTH.
        У пользователя есть результат биомаркера "${biomarker.name}", который составляет ${biomarker.value} ${biomarker.unit}. Статус считается "${biomarker.status}".
        
        ВАЖНО: Вы не являетесь медицинским работником. НЕ предоставляйте никаких медицинских диагнозов, планов лечения или рецептов. Ваши советы должны быть общими, безопасными и сосредоточенными на образе жизни, диете и упражнениях. Всегда предлагайте проконсультироваться с медицинским работником для получения персональных советов. Для добавок четко укажите, что следует проконсультироваться с врачом.

        Основываясь на этом, предоставьте структурированный набор действенных рекомендаций в формате JSON. Ответ должен быть кратким, легким для чтения и полностью на русском языке.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: recommendationsSchema,
            },
        });
        const jsonString = response.text;
        const parsedResult = JSON.parse(jsonString);
        return parsedResult as AIGeneratedRecommendations;
    } catch (error) {
        console.error(`Ошибка при получении рекомендаций для ${biomarker.name}:`, error);
        return {
            nutrition: ["В данный момент не удалось сгенерировать рекомендации ИИ."],
            lifestyle: ["Пожалуйста, проконсультируйтесь с врачом для получения совета."],
            supplements: [],
            next_checkup: "Н/Д"
        };
    }
};

export const generateMeditationAudio = async (script: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: script }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) {
            throw new Error("Аудиоданные не получены от API.");
        }
        return base64Audio;
    } catch (error) {
        console.error("Ошибка при генерации аудио для медитации:", error);
        throw new Error("Не удалось сгенерировать аудио для медитации. Пожалуйста, попробуйте позже.");
    }
};

export const createChatWithContext = (user: User, biomarkers: Biomarker[]): Chat => {
    let context = `--- Начало профиля здоровья пользователя ---\n`;
    context += `Имя пользователя: ${user.name}\n`;
    
    if (user.healthProfile) {
        const profile = user.healthProfile;
        if(profile.age) context += `Возраст: ${profile.age}\n`;
        if(profile.sex) context += `Пол: ${profile.sex}\n`;
        if(profile.height) context += `Рост: ${profile.height} см\n`;
        if(profile.weight) context += `Вес: ${profile.weight} кг\n`;
        if(profile.activityLevel) context += `Уровень активности: ${profile.activityLevel}\n`;
        if (profile.healthGoals && profile.healthGoals.length > 0) {
            context += `Цели в области здоровья: ${profile.healthGoals.join(', ')}\n`;
        }
        if (profile.dietaryPreferences) {
            context += `Предпочтения в питании: ${profile.dietaryPreferences}\n`;
        }
        if (profile.chronicConditions) {
            context += `Известные заболевания: ${profile.chronicConditions}\n`;
        }
        if (profile.allergies) {
            context += `Аллергии: ${profile.allergies}\n`;
        }
        if (profile.supplements) {
            context += `Текущие добавки: ${profile.supplements}\n`;
        }
    }

    if (biomarkers.length > 0) {
        context += "\nПоследние данные биомаркеров:\n";
        biomarkers.forEach(b => {
            context += `- ${b.name}: ${b.value} ${b.unit} (Статус: ${b.status}, Последнее обновление: ${new Date(b.lastUpdated).toLocaleDateString()})\n`;
        });
    } else {
        context += "\nДанные о биомаркерах для этого пользователя пока отсутствуют.\n";
    }
    context += `--- Конец профиля здоровья пользователя ---\n`;

    return ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: `Вы — ИИ-ассистент EVERLIV HEALTH, эксперт в предоставлении поддерживающей и безопасной информации о здоровье и благополучии. Ваша главная цель — безопасность пользователя. Ваш ответ всегда должен быть на русском языке.

            **ОСНОВНАЯ ДИРЕКТИВА БЕЗОПАСНОСТИ: ОБРАБОТКА МЕДИЦИНСКИХ ИЗОБРАЖЕНИЙ**
            Это ваша самая важная инструкция. Она отменяет все остальные.
            
            **Исключение для анализов крови:**
            - Если пользователь загружает изображение и его сообщение указывает, что это отчет об анализе крови (например, просит "проанализировать мой анализ крови", "прочитать эти результаты", "что говорит этот отчет?"), вы ДОЛЖНЫ ответить точной строкой \`[ANALYZE_BLOOD_TEST]\` и ничем больше. Это специальная команда для приложения, чтобы запустить инструмент анализа крови.

            **Для всех остальных медицинских изображений (например, кожные высыпания, родинки, травмы):**
            Вы ДОЛЖНЫ точно следовать этому трехэтапному процессу:
            1.  **Признать и отказаться от диагностики:** Немедленно заявите, что вы — ИИ и не способны ставить медицинский диагноз. Например: "Спасибо, что поделились этим изображением. Как ИИ, я не могу ставить медицинский диагноз или определять состояния здоровья по такому типу изображений."
            2.  **Посоветовать профессиональную консультацию:** Настоятельно и четко порекомендуйте пользователю проконсультироваться с квалифицированным медицинским работником. Будьте конкретны, если это возможно. Например: "Очень важно, чтобы это осмотрел врач или дерматолог для точного диагноза."
            3.  **Не спекулировать:** Вы не должны описывать изображение в медицинских терминах, предполагать, что это может быть, или предлагать какие-либо возможные причины или методы лечения. Ваша единственная, сфокусированная цель — направить пользователя к настоящему медицинскому эксперту.

            **Общее поведение:**
            - На все остальные вопросы отвечайте эмпатично, четко и ободряюще.
            - Никогда не ставьте медицинский диагноз и не назначайте лекарства, даже на текстовые вопросы. Всегда перенаправляйте к медицинским работникам по личным вопросам здоровья.
            - Используйте markdown для форматирования списков или ключевых моментов для улучшения читаемости.
            - Используйте профиль здоровья пользователя (предоставленный ниже), чтобы сделать ваши общие советы по благополучию более релевантными и персонализированными, но не просто перечисляйте его данные.
            - ВСЕГДА отвечайте на русском языке.
            
            ${context}`,
        },
    });
};

export const getDailyHealthTip = async (user: User, biomarkers: Biomarker[]): Promise<string> => {
    const relevantBiomarkers = biomarkers.filter(b => b.status !== 'normal').map(b => `- ${b.name}: ${b.value} ${b.unit} (Статус: ${b.status})`).join('\n');
    
    const userGoals = user.healthProfile?.healthGoals || [];
    const healthProfileContext = user.healthProfile ? `
        Пользователь: ${user.healthProfile.age} лет, ${user.healthProfile.sex}.
        Уровень активности: ${user.healthProfile.activityLevel}.
        Известные заболевания: ${user.healthProfile.chronicConditions || 'Не указаны'}.
        Аллергии: ${user.healthProfile.allergies || 'Не указаны'}.
        Принимаемые добавки: ${user.healthProfile.supplements || 'Не указаны'}.
    ` : '';

    const prompt = `
        Вы — ИИ-тренер по здоровью и благополучию для приложения EVERLIV HEALTH.
        У пользователя следующие цели: ${userGoals.join(', ')}.
        ${healthProfileContext}
        Его текущие биомаркеры, которые не находятся в нормальном диапазоне:
        ${relevantBiomarkers.length > 0 ? relevantBiomarkers : 'Все биомаркеры в настоящее время в норме.'}

        Основываясь на этой информации, предоставьте один короткий, действенный и ободряющий совет по здоровью на день.
        Совет должен быть кратким, понятным и не более двух предложений. Не приветствуйте пользователя и не добавляйте разговорной "воды". Просто предоставьте совет.
        Ответ должен быть полностью на русском языке.
        Пример: "Для поддержки вашей цели по здоровью сердца, попробуйте включить 15-минутную быструю прогулку в обеденный перерыв сегодня для отличного кардио-ускорения!"
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text.trim();
    } catch (error) {
        console.error("Ошибка при генерации ежедневного совета по здоровью:", error);
        return "Не забывайте пить достаточно воды и прислушиваться к своему телу сегодня. У вас все получится!";
    }
};