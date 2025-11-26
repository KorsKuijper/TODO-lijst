import { GoogleGenAI, Type } from "@google/genai";
import { AIParseResult, Priority } from "../types";

const ai = new GoogleGenAI({ apiKey: import.met.env.VITE_GEMINI_API_KEY });

export const parseNaturalLanguageInput = async (
  input: string,
  existingListNames: string[]
): Promise<AIParseResult> => {
  const model = "gemini-2.5-flash";
  
  const systemInstruction = `
    Je bent de 'Ride Leader' assistent voor de 'Gravel Grinder Adventure Log'.
    Zet input om in gestructureerde taken.
    
    Context:
    De gebruiker is een gravelbiker en professional.
    
    Regels:
    1. Haal taken uit de input.
    2. Bepaal een LABEL (kort, bijv. "Klant A", "Onderhoud", "Reis").
    3. Bepaal PRIORITEIT (Low, Medium, High).
    4. Bepaal DEADLINE als ISO string (YYYY-MM-DD) indien genoemd (bijv. "morgen", "volgende week vrijdag"). Anders null.
    5. Suggesteer een Lijst naam (bijv. "Basecamp", "Expedities", "Onderhoud").
    
    Voorbeeld Input: "Check remblokken voor de Ardennen rit volgende week vrijdag en bel Jan over project X"
    Verwachte output:
    - Taak 1: Check remblokken (Label: Onderhoud, Prio: High, Deadline: [datum volgende week vrijdag])
    - Taak 2: Bel Jan (Label: Project X, Prio: Medium, Deadline: [vandaag])
    - Lijst: Basecamp
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: input,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  label: { type: Type.STRING },
                  priority: { 
                    type: Type.STRING, 
                    enum: [Priority.LOW, Priority.MEDIUM, Priority.HIGH] 
                  },
                  deadline: { type: Type.STRING, nullable: true }
                },
                required: ["title", "label", "priority"]
              }
            },
            suggestedListName: { type: Type.STRING }
          },
          required: ["tasks", "suggestedListName"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Geen antwoord van Gemini");
    
    return JSON.parse(text) as AIParseResult;
  } catch (error) {
    console.error("Fout bij aanroepen Gemini:", error);
    return {
      tasks: [{ title: input, label: "Algemeen", priority: Priority.MEDIUM }],
      suggestedListName: "Basecamp"
    };
  }
};