import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { AgentState } from "../state";
import { RunnableConfig } from "@langchain/core/runnables";

export async function auditorNode(state: typeof AgentState.State, config?: RunnableConfig) {
  console.log("--- ⚖️ AUDITOR AGENT ACTIVATED ---");

  const apiKey = config?.configurable?.geminiApiKey || process.env.GOOGLE_GENAI_API_KEY;

  const llm = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash", //we should use pro here because it is more accurate and efficient
    apiKey: apiKey,
    temperature: 0, // Very important: The Auditor must be objective and strict
  });

  const prompt = `
    You are a Senior Technical Auditor. Your job is to review the Technical Architecture Draft created by the Drafter.
    
    User Requirements: ${state.input}
    Research Data: ${state.researchData}
    Current Draft: ${state.draft}
    
    Review the draft for:
    1. Accuracy: Does it actually use the technology found in the research?
    2. Completeness: Is it missing security, scalability, or cost considerations?
    3. Feasibility: Can this actually be built?
    
    If the draft is excellent, respond with exactly: "APPROVED".
    If the draft needs changes, provide a detailed critique listing exactly what needs to be added or fixed.
  `;

  const response = await llm.invoke(prompt);
  const content = response.content as string;

  return {
    critique: content,
    currentStep: content.includes("APPROVED") 
      ? "Auditor approved the architecture." 
      : "Auditor requested changes to the draft.",
    // Increment the revision count only when we critique
    revisionCount: content.includes("APPROVED") ? 0 : 1, 
  };
}