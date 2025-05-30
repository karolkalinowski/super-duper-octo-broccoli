// lib/gemini.ts
import type { Project, StoryNode } from "@/types";

interface GeminiSuggestion {
  title: string;
  description: string;
}

interface GeminiResponse {
  suggestions: GeminiSuggestion[];
}

// Funkcja do czyszczenia danych projektu przed wysłaniem do API
function cleanProjectData(project: Project): any {
  return {
    id: project.id,
    name: project.name,
    nodes: project.nodes.map((node) => ({
      id: node.id,
      title: node.title,
      description: node.description,
      causes: node.causes,
      tags: node.tags,
      order: node.order,
    })),
  };
}

// Funkcja do przygotowania kontekstu węzła
function prepareNodeContext(node: StoryNode, allNodes: StoryNode[]): string {
  const causeNodes = node.causes
    .map((causeId) => allNodes.find((n) => n.id === causeId))
    .filter(Boolean) as StoryNode[];

  const effectNodes = allNodes.filter((n) => n.causes.includes(node.id));

  let context = "";

  if (node.title || node.description) {
    context += `Aktualny węzeł:\n`;
    if (node.title) context += `Tytuł: "${node.title}"\n`;
    if (node.description) context += `Opis: "${node.description}"\n`;
    context += "\n";
  }

  if (causeNodes.length > 0) {
    context += `Przyczyny tego węzła:\n`;
    causeNodes.forEach((cause) => {
      context += `- "${cause.title}": ${cause.description}\n`;
    });
    context += "\n";
  }

  if (effectNodes.length > 0) {
    context += `Skutki tego węzła:\n`;
    effectNodes.forEach((effect) => {
      context += `- "${effect.title}": ${effect.description}\n`;
    });
    context += "\n";
  }

  if (node.tags.length > 0) {
    context += `Tagi: ${node.tags.join(", ")}\n\n`;
  }

  return context;
}

export async function generateNodeSuggestions(
  apiKey: string,
  project: Project,
  currentNode: StoryNode
): Promise<GeminiSuggestion[]> {
  const cleanProject = cleanProjectData(project);
  const nodeContext = prepareNodeContext(currentNode, project.nodes);

  const prompt = `Jesteś doświadczonym scenarzystą i pisarzem. Pomóż mi rozwinąć fabułę mojej historii.

KONTEKST PROJEKTU:
Nazwa: "${project.name}"
Opis: Historia składa się z ${
    project.nodes.length
  } węzłów fabularnych połączonych relacjami przyczynowo-skutkowymi.

WSZYSTKIE WĘZŁY W PROJEKCIE:
${project.nodes
  .map(
    (node) =>
      `${node.order + 1}. "${node.title}": ${node.description} ${
        node.tags.length > 0 ? `[${node.tags.join(", ")}]` : ""
      }`
  )
  .join("\n")}

AKTUALNY WĘZEŁ DO ROZWINIĘCIA:
${nodeContext}

ZASADY TWORZENIA PROPOZYCJI:
1. Każda propozycja musi być logicznie spójna z przyczynami i skutkami
2. Propozycje powinny być intrygujące i rozwijać napięcie dramatyczne
3. Uwzględnij relacje przyczynowo-skutkowe między węzłami
4. Jeśli węzeł ma już tytuł/opis, wykorzystaj je jako punkt wyjścia
5. Propozycje powinny różnić się od siebie pod względem podejścia i tonu
6. Każda propozycja powinna mieć zwięzły, chwytliwy tytuł (max 50 znaków)
7. Opis powinien być konkretny i obrazowy (50-150 słów)

Przygotuj dokładnie 3 różne propozycje dla tego węzła. Odpowiedz TYLKO w formacie JSON:

{
  "suggestions": [
    {
      "title": "Tytuł propozycji 1",
      "description": "Opis propozycji 1"
    },
    {
      "title": "Tytuł propozycji 2", 
      "description": "Opis propozycji 2"
    },
    {
      "title": "Tytuł propozycji 3",
      "description": "Opis propozycji 3"
    }
  ]
}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.8,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Gemini API error: ${response.status} - ${
          errorData.error?.message || "Unknown error"
        }`
      );
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      throw new Error("No content received from Gemini API");
    }

    // Parsowanie odpowiedzi JSON
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Invalid JSON response from Gemini API");
    }

    const parsedResponse: GeminiResponse = JSON.parse(jsonMatch[0]);

    if (
      !parsedResponse.suggestions ||
      !Array.isArray(parsedResponse.suggestions)
    ) {
      throw new Error("Invalid response format from Gemini API");
    }

    // Walidacja propozycji
    const validSuggestions = parsedResponse.suggestions.filter(
      (suggestion) =>
        suggestion.title &&
        suggestion.description &&
        typeof suggestion.title === "string" &&
        typeof suggestion.description === "string"
    );

    if (validSuggestions.length === 0) {
      throw new Error("No valid suggestions received from Gemini API");
    }

    return validSuggestions.slice(0, 3); // Upewniamy się, że mamy maksymalnie 3 propozycje
  } catch (error) {
    console.error("Error generating suggestions:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to generate suggestions");
  }
}
