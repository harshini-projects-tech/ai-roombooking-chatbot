import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

/**
 * Connects the AI SDK to the Lovable AI Gateway.
 * This is the "Watson Assistant" brain of the booking bot: swap the baseURL /
 * headers here if you later point the app at an IBM watsonx.ai deployment.
 */
export function createLovableAiGatewayProvider(apiKey: string) {
  return createOpenAICompatible({
    name: "lovable-gateway",
    baseURL: "https://ai.gateway.lovable.dev/v1",
    headers: { "Lovable-API-Key": apiKey },
  });
}
