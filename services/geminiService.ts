import { GoogleGenAI, Type } from "@google/genai";
import { AIParseResult, Priority } from "../types";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

export const parseNaturalLanguageInput = async (
  input: string,
  existingListNames: string[],
  existingCategoryNames: string[]
): Promise<AIParseResult> => {
  const model = "gemini-2.5-flash";
  
  const systemInstruction = `
    Je bent de 'Ride Leader' assistent voor een gravelbike en avonturen app.
    Je doel is om invoer van fietsers om te zetten in gestructureerde plannen.
    
    Context:
    De gebruiker is een gravelbiker die houdt van natuur, avontuur, bikepacking en techniek.
    
    Regels:
    1. Analyseer de input en haal er concrete taken uit.
    2. Bepaal een categorie.
       - Kies uit bestaande: ${existingCategoryNames.join(', ')}.
       - Of maak nieuwe, korte categorieën (bijv. "Onderhoud", "Route", "Voeding", "Campings").
    3. Bepaal prioriteit. 'Hoog' is vaak voor mechanische mankementen of dingen die nodig zijn voor de rit van morgen.
    4. Suggesteer een lijstnaam.
       - Kies uit bestaande: ${existingListNames.join(', ')}.
       - Of verzin iets avontuurlijks (bijv. "Weekend Rit", "Bikepacking Trip", "Winter Training").
       - Gebruik "Basecamp" als het algemeen is.
    
    Voorbeeld Input: "Ik moet tubeless sealant kopen, de route naar de Veluwe plotten en regenjas wassen"
    Verwachte output logica:
    - Taak 1: Tubeless sealant kopen (Categorie: Onderhoud, Prioriteit: Hoog)
    - Taak 2: Route Veluwe plotten (Categorie: Route, Prioriteit: Gemiddeld)
    - Taak 3: Regenjas wassen (Categorie: Kleding, Prioriteit: Laag)
    - Lijst: Veluwe Adventure (of Basecamp)
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
                  title: { type: Type.STRING, description: "De actie" },
                  categoryName: { type: Type.STRING, description: "De categorie" },
                  priority: { 
                    type: Type.STRING, 
                    enum: [Priority.LOW, Priority.MEDIUM, Priority.HIGH],
                    description: "Urgentie van de taak" 
                  }
                },
                required: ["title", "categoryName", "priority"]
              }
            },
            suggestedListName: { 
              type: Type.STRING, 
              description: "De naam van de lijst." 
            }
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
    // Fallback
    return {
      tasks: [{ title: input, categoryName: "Algemeen", priority: Priority.MEDIUM }],
      suggestedListName: "Basecamp"
    };
  }
};