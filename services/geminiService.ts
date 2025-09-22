import { GoogleGenAI, Type, Chat } from "@google/genai";
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
      description: "A concise, easy-to-understand summary of the key findings from the blood test results."
    },
    biomarkers: {
      type: Type.ARRAY,
      description: "An array of significant biomarkers found in the results.",
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "The name of the biomarker (e.g., 'Cholesterol', 'Glucose')." },
          value: { type: Type.STRING, description: "The measured value of the biomarker as a string." },
          unit: { type: Type.STRING, description: "The unit for the measured value (e.g., 'mg/dL', '%')." },
          range: { type: Type.STRING, description: "The normal reference range for this biomarker." },
          explanation: { type: Type.STRING, description: "A simple explanation of what this biomarker indicates about health." },
          status: { type: Type.STRING, description: "Status of the biomarker, can be 'normal', 'borderline', 'high', or 'low'."}
        },
        required: ["name", "value", "unit", "range", "explanation", "status"]
      }
    },
    recommendations: {
      type: Type.ARRAY,
      description: "A list of 3-5 general, non-prescriptive wellness and lifestyle recommendations based on the results.",
      items: {
        type: Type.STRING
      }
    }
  },
  required: ["summary", "biomarkers", "recommendations"]
};


export const analyzeBloodTest = async (base64Image: string, mimeType: string, customBiomarkers?: string): Promise<BloodTestAnalysis> => {
  const userFocusPrompt = customBiomarkers
    ? `The user is particularly interested in the following biomarkers: ${customBiomarkers}. Please prioritize these in your analysis if they are present in the report.`
    : '';

  const prompt = `You are a helpful AI health analyst for the EVERLIV HEALTH app. Your task is to analyze an image of a blood test report. 
  
  IMPORTANT: You are not a medical professional. Do NOT provide any medical diagnosis, treatment plans, or prescriptions. Your analysis should be informative and focused on general wellness.
  
  Analyze the provided blood test report image and structure your findings into a JSON format. Identify key biomarkers, their values, units, normal ranges, and provide a simple explanation and status (normal, borderline, high, or low).
  
  ${userFocusPrompt}
  
  Here is the blood test report:`;

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
    
    // Basic validation to ensure the parsed object matches the expected structure
    if (parsedResult && parsedResult.summary && Array.isArray(parsedResult.biomarkers) && Array.isArray(parsedResult.recommendations)) {
        return parsedResult as BloodTestAnalysis;
    } else {
        throw new Error("AI response did not match the expected format.");
    }
  } catch (error) {
    console.error("Error analyzing blood test with Gemini:", error);
    throw new Error("Failed to analyze blood test results. The AI model may be temporarily unavailable.");
  }
};


const recommendationsSchema = {
    type: Type.OBJECT,
    properties: {
        nutrition: {
            type: Type.ARRAY,
            description: "A list of 2-4 actionable nutrition and dietary recommendations.",
            items: { type: Type.STRING }
        },
        lifestyle: {
            type: Type.ARRAY,
            description: "A list of 2-3 lifestyle recommendations, including exercise and other habits.",
            items: { type: Type.STRING }
        },
        supplements: {
            type: Type.ARRAY,
            description: "A list of 1-2 potential supplements. MUST include a disclaimer to consult a doctor before taking any.",
            items: { type: Type.STRING }
        },
        next_checkup: {
            type: Type.STRING,
            description: "A brief recommendation on when to get the next check-up for this biomarker (e.g., 'In 3-6 months')."
        }
    },
    required: ["nutrition", "lifestyle", "supplements", "next_checkup"]
};

export const getBiomarkerRecommendations = async (biomarker: { name: string, value: string, unit: string, status: 'normal' | 'borderline' | 'high' | 'low' }): Promise<AIGeneratedRecommendations> => {
    const prompt = `
        You are an AI health and wellness coach for the EVERLIV HEALTH app.
        A user has a biomarker result for "${biomarker.name}" which is ${biomarker.value} ${biomarker.unit}. The status is considered "${biomarker.status}".
        
        IMPORTANT: You are not a medical professional. Do NOT provide any medical diagnosis, treatment plans, or prescriptions. Your advice must be general, safe, and focus on lifestyle, diet, and exercise. Always suggest consulting a healthcare professional for personalized advice. For supplements, explicitly state that a doctor should be consulted.

        Based on this, provide a structured set of actionable recommendations in JSON format. The response should be concise and easy to read.
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
        console.error(`Error getting recommendations for ${biomarker.name}:`, error);
        // Fallback to a default error structure
        return {
            nutrition: ["Could not generate AI recommendations at this time."],
            lifestyle: ["Please consult with a healthcare provider for advice."],
            supplements: [],
            next_checkup: "N/A"
        };
    }
};

/**
 * Creates a new chat session with contextual user data.
 * @param user The user's profile information.
 * @param biomarkers A list of the user's biomarkers.
 * @returns A new Chat instance.
 */
export const createChatWithContext = (user: User, biomarkers: Biomarker[]): Chat => {
    let context = `--- Start of User Health Profile ---\n`;
    context += `User Name: ${user.name}\n`;
    
    if (user.healthProfile) {
        const profile = user.healthProfile;
        if(profile.age) context += `Age: ${profile.age}\n`;
        if(profile.sex) context += `Sex: ${profile.sex}\n`;
        if(profile.height) context += `Height: ${profile.height} cm\n`;
        if(profile.weight) context += `Weight: ${profile.weight} kg\n`;
        if(profile.activityLevel) context += `Activity Level: ${profile.activityLevel}\n`;
        if (profile.healthGoals && profile.healthGoals.length > 0) {
            context += `Health Goals: ${profile.healthGoals.join(', ')}\n`;
        }
        if (profile.dietaryPreferences) {
            context += `Dietary Preferences: ${profile.dietaryPreferences}\n`;
        }
        if (profile.chronicConditions) {
            context += `Known Conditions: ${profile.chronicConditions}\n`;
        }
        if (profile.allergies) {
            context += `Allergies: ${profile.allergies}\n`;
        }
        if (profile.supplements) {
            context += `Current Supplements: ${profile.supplements}\n`;
        }
    }


    if (biomarkers.length > 0) {
        context += "\nRecent Biomarker Data:\n";
        biomarkers.forEach(b => {
            context += `- ${b.name}: ${b.value} ${b.unit} (Status: ${b.status}, Last Updated: ${new Date(b.lastUpdated).toLocaleDateString()})\n`;
        });
    } else {
        context += "\nNo biomarker data available for this user yet.\n";
    }
    context += `--- End of User Health Profile ---\n`;

    return ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: `You are EVERLIV HEALTH's AI Assistant, an expert in providing supportive and safe health and wellness information. Your primary goal is user safety.

            **CORE SAFETY DIRECTIVE: HANDLING MEDICAL IMAGES**
            This is your most important instruction. It overrides everything else.
            
            **Exception for Blood Tests:**
            - If a user uploads an image and their message indicates it is a blood test report (e.g., asks to "analyze my blood test", "read these results", "what does this report say?"), you MUST respond with the exact string \`[ANALYZE_BLOOD_TEST]\` and nothing else. This is a special command for the application to trigger its blood test analysis tool.

            **For all other medical-related images (e.g., skin rashes, moles, injuries):**
            You MUST follow this three-step process exactly:
            1.  **Acknowledge and Refuse Diagnosis:** Immediately state that you are an AI and are not capable of providing a medical diagnosis. For example: "Thank you for sharing this image. As an AI, I cannot provide a medical diagnosis or identify health conditions from this type of image."
            2.  **Advise Professional Consultation:** Strongly and clearly recommend that the user consult a qualified healthcare professional. Be specific if possible. For example: "It's very important to have this looked at by a doctor or a dermatologist for an accurate diagnosis."
            3.  **Do Not Speculate:** You must NOT describe the image in medical terms, guess at what it might be, or offer any potential causes or treatments. Your single, focused goal is to direct the user to a real medical expert.

            **General Conduct:**
            - For all other questions, be empathetic, clear, and encouraging.
            - Never provide a medical diagnosis or prescribe medication, even for text-based questions. Always defer to healthcare professionals for personal health concerns.
            - Use markdown for formatting lists or key points to improve readability.
            - Utilize the user's health profile (provided below) to make your general wellness advice more relevant and personalized, but do not simply list their data back to them.
            
            ${context}`,
        },
    });
};

export const getDailyHealthTip = async (user: User, biomarkers: Biomarker[]): Promise<string> => {
    const relevantBiomarkers = biomarkers.filter(b => b.status !== 'normal').map(b => `- ${b.name}: ${b.value} ${b.unit} (Status: ${b.status})`).join('\n');
    
    const userGoals = user.healthProfile?.healthGoals || [];
    const healthProfileContext = user.healthProfile ? `
        The user is a ${user.healthProfile.age}-year-old ${user.healthProfile.sex}.
        Their activity level is ${user.healthProfile.activityLevel}.
        They have the following known conditions: ${user.healthProfile.chronicConditions || 'None reported'}.
        They have the following allergies: ${user.healthProfile.allergies || 'None reported'}.
        They are currently taking the following supplements: ${user.healthProfile.supplements || 'None reported'}.
    ` : '';

    const prompt = `
        You are an AI health and wellness coach for the EVERLIV HEALTH app.
        A user has the following goals: ${userGoals.join(', ')}.
        ${healthProfileContext}
        Their current biomarkers that are not in the normal range are:
        ${relevantBiomarkers.length > 0 ? relevantBiomarkers : 'All biomarkers are currently in the normal range.'}

        Based on this information, provide a single, short, actionable, and encouraging health tip for their day.
        The tip should be concise, easy to understand, and no more than two sentences. Do not greet the user or add any conversational fluff. Just provide the tip.
        Example: "To support your heart health goal, try incorporating a 15-minute brisk walk into your lunch break today for a great cardio boost!"
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error generating daily health tip:", error);
        // Provide a generic but useful fallback tip
        return "Remember to stay hydrated and listen to your body today. You've got this!";
    }
};