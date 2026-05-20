import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { AgentState } from "../state";

import { RunnableConfig } from "@langchain/core/runnables";

export async function gatekeeperNode(state: typeof AgentState.State, config?: RunnableConfig) {
  console.log("--- 🚪 GATEKEEPER AGENT ACTIVATED ---");

  const apiKey = config?.configurable?.geminiApiKey || process.env.GOOGLE_GENAI_API_KEY;

  const llm = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash", // Fast model for quick yes/no check
    apiKey: apiKey,
    temperature: 0, // Strict, factual checking
  });

  const prompt = `
    You are a Gatekeeper for an Automated ML Architecture system.
    Your sole job is to determine if the user's input is related to Software Engineering, Machine Learning, Cloud Architecture, Data Pipelines, or IT Infrastructure.
    
    User Input: "${state.input}"
    
    If the input is related to these topics, reply exactly with: "Yes"
    If the input is an irrelevant request (e.g. asking for a recipe, general chat, unrelated topics), reply exactly with: "No"
    
    Reply with nothing else but "Yes" or "No".
  `;

  const response = await llm.invoke(prompt);
  const content = (response.content as string).trim().toLowerCase();
  const isRelevant = content === "yes";

  return {
    isRelevant,
    currentStep: isRelevant ? "Gatekeeper approved prompt." : "Gatekeeper rejected prompt as irrelevant.",
  };
}
