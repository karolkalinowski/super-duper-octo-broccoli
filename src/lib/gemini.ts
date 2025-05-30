// lib/gemini.ts
import type { Project, StoryNode } from "@/types";

interface GeminiSuggestion {
  title: string;
  description: string;
}

interface GeminiResponse {
  suggestions: GeminiSuggestion[];
}

// Konfiguracja limitów
const CONFIG = {
  MAX_PROMPT_TOKENS: 50000, // Maksymalnie 50k tokenów w prompcie
  MAX_TITLE_LENGTH: 80, // Maksymalna długość tytułu
  RELEVANCE_DEPTH: 2, // Głębokość wyszukiwania powiązanych węzłów
  DEV_MODE:
    process.env.NODE_ENV === "development" ||
    process.env.GEMINI_DEV_MODE === "true", // Dev mode z konsoli
};

// Funkcja do skracania tekstu z zachowaniem sensu
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;

  // Znajdź ostatnią spację przed limitem
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");

  if (lastSpace > maxLength * 0.8) {
    return truncated.substring(0, lastSpace) + "...";
  }

  return truncated + "...";
}

// Funkcja do obliczania relevance score węzła względem aktualnego
function calculateRelevance(
  node: StoryNode,
  currentNode: StoryNode,
  allNodes: StoryNode[]
): number {
  let score = 0;

  // Bezpośrednie połączenia mają najwyższy priorytet
  if (
    node.causes.includes(currentNode.id) ||
    currentNode.causes.includes(node.id)
  ) {
    score += 10;
  }

  // Wspólne tagi
  const commonTags = node.tags.filter((tag) => currentNode.tags.includes(tag));
  score += commonTags.length * 2;

  // Bliskość w kolejności (numeracja węzłów)
  const orderDistance = Math.abs(node.order - currentNode.order);
  if (orderDistance <= 3) {
    score += 5 - orderDistance;
  }

  // Pośrednie połączenia (węzły, które mają wspólne przyczyny/skutki)
  const nodeEffects = allNodes.filter((n) => n.causes.includes(node.id));
  const currentEffects = allNodes.filter((n) =>
    n.causes.includes(currentNode.id)
  );
  const commonEffects = nodeEffects.filter((effect) =>
    currentEffects.some((currentEffect) => currentEffect.id === effect.id)
  );
  score += commonEffects.length;

  return score;
}

// Funkcja do dynamicznego wybierania węzłów na podstawie limitu tokenów
function selectNodesWithinTokenLimit(
  currentNode: StoryNode,
  allNodes: StoryNode[],
  maxTokens: number
): StoryNode[] {
  // Zawsze dołącz bezpośrednie przyczyny i skutki (mandatory)
  const directCauses = currentNode.causes
    .map((causeId) => allNodes.find((n) => n.id === causeId))
    .filter(Boolean) as StoryNode[];

  const directEffects = allNodes.filter((n) =>
    n.causes.includes(currentNode.id)
  );
  const mandatoryNodes = [...directCauses, ...directEffects];

  // Oblicz tokeny dla obowiązkowych węzłów
  let currentTokens = mandatoryNodes.reduce(
    (sum, node) => sum + estimateNodeTokens(node),
    0
  );

  if (CONFIG.DEV_MODE) {
    console.log(
      `[DEV] Mandatory nodes: ${mandatoryNodes.length}, tokens: ${currentTokens}`
    );
  }

  // Jeśli obowiązkowe węzły przekraczają limit, zostaw tylko najważniejsze
  if (currentTokens > maxTokens) {
    console.warn("Mandatory nodes exceed token limit, truncating...");
    const sortedMandatory = mandatoryNodes
      .map((node) => ({
        node,
        tokens: estimateNodeTokens(node),
        relevance: calculateRelevance(node, currentNode, allNodes),
      }))
      .sort((a, b) => b.relevance - a.relevance);

    const result: StoryNode[] = [];
    let tokens = 0;

    for (const item of sortedMandatory) {
      if (tokens + item.tokens <= maxTokens) {
        result.push(item.node);
        tokens += item.tokens;
      } else {
        break;
      }
    }

    if (CONFIG.DEV_MODE) {
      console.log(
        `[DEV] Truncated to ${result.length} mandatory nodes, ${tokens} tokens`
      );
    }

    return result;
  }

  // Dodaj pozostałe węzły w kolejności relevance
  const otherNodes = allNodes
    .filter(
      (node) =>
        node.id !== currentNode.id &&
        !mandatoryNodes.some((mandatory) => mandatory.id === node.id)
    )
    .map((node) => ({
      node,
      tokens: estimateNodeTokens(node),
      relevance: calculateRelevance(node, currentNode, allNodes),
    }))
    .sort((a, b) => b.relevance - a.relevance);

  const selectedNodes = [...mandatoryNodes];

  for (const item of otherNodes) {
    if (currentTokens + item.tokens <= maxTokens) {
      selectedNodes.push(item.node);
      currentTokens += item.tokens;
    } else {
      break;
    }
  }

  if (CONFIG.DEV_MODE) {
    console.log(
      `[DEV] Selected ${selectedNodes.length}/${allNodes.length} nodes, estimated tokens: ${currentTokens}`
    );
  }

  return selectedNodes;
}

// Funkcja do szacowania tokenów dla pojedynczego węzła
function estimateNodeTokens(node: StoryNode): number {
  const titleTokens = Math.ceil(node.title.length / 4);
  const descTokens = Math.ceil(node.description.length / 4);
  const tagsTokens = Math.ceil(node.tags.join(" ").length / 4);

  // Dodaj koszt formatowania i struktury
  return titleTokens + descTokens + tagsTokens + 10;
}

// Funkcja do tworzenia zwięzłego kontekstu projektu
function createCompactProjectContext(
  project: Project,
  currentNode: StoryNode,
  relevantNodes: StoryNode[]
): string {
  let context = `PROJEKT: "${project.name}" (${project.nodes.length} węzłów)\n\n`;

  // Podsumowanie struktury projektu
  const totalNodes = project.nodes.length;
  const avgConnections =
    project.nodes.reduce((sum, node) => sum + node.causes.length, 0) /
    totalNodes;
  context += `Struktura: ${totalNodes} węzłów, średnio ${avgConnections.toFixed(
    1
  )} połączeń/węzeł\n\n`;

  // Kluczowe węzły w kontekście - bez przycinania opisów
  context += `KLUCZOWE WĘZŁY (${relevantNodes.length}/${totalNodes}):\n`;
  relevantNodes.forEach((node, index) => {
    const shortTitle = truncateText(node.title, CONFIG.MAX_TITLE_LENGTH);
    const tags =
      node.tags.length > 0 ? ` [${node.tags.slice(0, 3).join(", ")}]` : "";

    // Pełny opis bez przycinania
    context += `${index + 1}. "${shortTitle}": ${node.description}${tags}\n`;
  });

  return context;
}

// Zoptymalizowana funkcja do przygotowania kontekstu węzła
function prepareOptimizedNodeContext(
  node: StoryNode,
  allNodes: StoryNode[],
  relevantNodes: StoryNode[]
): string {
  let context = `\nAKTUALNY WĘZEŁ:\n`;
  context += `Tytuł: "${node.title}"\n`;
  context += `Opis: "${node.description}"\n`; // Pełny opis bez przycinania
  context += `Pozycja: ${node.order + 1}/${allNodes.length}\n`;

  if (node.tags.length > 0) {
    context += `Tagi: ${node.tags.join(", ")}\n`;
  }

  // Przyczyny
  const causeNodes = node.causes
    .map((causeId) => relevantNodes.find((n) => n.id === causeId))
    .filter(Boolean) as StoryNode[];

  if (causeNodes.length > 0) {
    context += `\nBezpośrednie przyczyny:\n`;
    causeNodes.forEach((cause) => {
      // Pełny opis przyczyn
      context += `- "${cause.title}": ${cause.description}\n`;
    });
  }

  // Skutki
  const effectNodes = relevantNodes.filter((n) => n.causes.includes(node.id));
  if (effectNodes.length > 0) {
    context += `\nBezpośrednie skutki:\n`;
    effectNodes.forEach((effect) => {
      // Pełny opis skutków
      context += `- "${effect.title}": ${effect.description}\n`;
    });
  }

  return context;
}

// Funkcja do szacowania długości prompta (w przybliżeniu)
function estimatePromptLength(prompt: string): number {
  // Przybliżone szacowanie: 1 token ≈ 4 znaki dla języka polskiego
  return Math.ceil(prompt.length / 4);
}

// Main function with optional devMode parameter
export async function generateNodeSuggestions(
  apiKey: string,
  project: Project,
  currentNode: StoryNode,
  devMode: boolean = false
): Promise<GeminiSuggestion[]> {
  // Override CONFIG.DEV_MODE jeśli przekazano parametr
  const isDevMode = devMode || CONFIG.DEV_MODE;

  // Wybierz węzły na podstawie limitu tokenów
  const relevantNodes = selectNodesWithinTokenLimit(
    currentNode,
    project.nodes,
    CONFIG.MAX_PROMPT_TOKENS * 0.7 // 70% limitu na kontekst węzłów
  );

  // Stwórz kontekst
  const projectContext = createCompactProjectContext(
    project,
    currentNode,
    relevantNodes
  );
  const nodeContext = prepareOptimizedNodeContext(
    currentNode,
    project.nodes,
    relevantNodes
  );

  const prompt = `Jesteś doświadczonym scenarzystą. Pomóż rozwinąć węzeł fabularny.

${projectContext}

${nodeContext}

ZADANIE:
Stwórz 3 różne propozycje rozwoju tego węzła:
1. Każda musi być spójna z przyczynami i skutkami
2. Różne podejścia i tony narracyjne
3. Intrygujące i rozwijające napięcie
4. Tytuł: max 50 znaków, chwytliwy
5. Opis: 50-150 słów, konkretny i obrazowy

Odpowiedz TYLKO JSON:
{
  "suggestions": [
    {"title": "Tytuł 1", "description": "Opis 1"},
    {"title": "Tytuł 2", "description": "Opis 2"},
    {"title": "Tytuł 3", "description": "Opis 3"}
  ]
}`;

  // Dev mode - wyświetl prompt w konsoli
  if (isDevMode) {
    console.log("\n" + "=".repeat(80));
    console.log("🔍 [GEMINI DEV MODE] - WYSYŁANY PROMPT:");
    console.log("=".repeat(80));
    console.log(prompt);
    console.log("=".repeat(80));
    console.log(
      `📊 Długość prompta: ${prompt.length} znaków (≈${estimatePromptLength(
        prompt
      )} tokenów)`
    );
    console.log(
      `📦 Wybrano węzłów: ${relevantNodes.length}/${project.nodes.length}`
    );
    console.log("=".repeat(80) + "\n");
  }

  // Sprawdź szacowaną długość prompta
  const estimatedTokens = estimatePromptLength(prompt);

  if (estimatedTokens > CONFIG.MAX_PROMPT_TOKENS) {
    console.warn(
      `⚠️  Prompt przekracza limit! ${estimatedTokens}/${CONFIG.MAX_PROMPT_TOKENS} tokenów`
    );
  }

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

      if (isDevMode) {
        console.error("🔥 [GEMINI DEV MODE] - API ERROR:", errorData);
      }

      // Specjalne obsłużenie błędu za długiego prompta
      if (
        response.status === 400 &&
        errorData.error?.message?.includes("exceed")
      ) {
        throw new Error(
          "Projekt jest zbyt rozbudowany. Spróbuj skupić się na mniejszej części historii."
        );
      }

      throw new Error(
        `Gemini API error: ${response.status} - ${
          errorData.error?.message || "Unknown error"
        }`
      );
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (isDevMode) {
      console.log("✅ [GEMINI DEV MODE] - RAW RESPONSE:");
      console.log(generatedText);
      console.log("=".repeat(50));
    }

    if (!generatedText) {
      throw new Error("No content received from Gemini API");
    }

    // Parsowanie odpowiedzi JSON
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Invalid JSON response from Gemini API");
    }

    const parsedResponse: GeminiResponse = JSON.parse(jsonMatch[0]);

    if (isDevMode) {
      console.log("🎯 [GEMINI DEV MODE] - PARSED SUGGESTIONS:");
      console.log(JSON.stringify(parsedResponse, null, 2));
      console.log("=".repeat(50) + "\n");
    }

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

    return validSuggestions.slice(0, 3);
  } catch (error) {
    if (isDevMode) {
      console.error("💥 [GEMINI DEV MODE] - CATCH ERROR:", error);
    }

    console.error("Error generating suggestions:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to generate suggestions");
  }
}

// Helper do włączenia dev mode bez zmian w konfiguracji
export async function generateNodeSuggestionsWithDev(
  apiKey: string,
  project: Project,
  currentNode: StoryNode
): Promise<GeminiSuggestion[]> {
  return generateNodeSuggestions(apiKey, project, currentNode, true);
}

// Opcjonalna funkcja pomocnicza do analizy projektu
export function analyzeProjectComplexity(project: Project): {
  totalNodes: number;
  avgConnections: number;
  maxDepth: number;
  estimatedTokens: number;
  recommendedOptimization: string;
} {
  const totalNodes = project.nodes.length;
  const totalConnections = project.nodes.reduce(
    (sum, node) => sum + node.causes.length,
    0
  );
  const avgConnections = totalConnections / totalNodes;

  // Szacowanie maksymalnej głębokości
  const maxDepth = Math.max(...project.nodes.map((node) => node.order)) + 1;

  // Szacowanie tokenów dla pełnego kontekstu
  const fullContextLength = project.nodes.reduce(
    (sum, node) =>
      sum +
      node.title.length +
      node.description.length +
      node.tags.join("").length,
    0
  );
  const estimatedTokens = Math.ceil(fullContextLength / 4);

  let recommendedOptimization = "none";
  if (totalNodes > 50) recommendedOptimization = "high";
  else if (totalNodes > 20) recommendedOptimization = "medium";
  else if (totalNodes > 10) recommendedOptimization = "low";

  return {
    totalNodes,
    avgConnections,
    maxDepth,
    estimatedTokens,
    recommendedOptimization,
  };
}
