import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { AgentState } from "../state";

import { RunnableConfig } from "@langchain/core/runnables";

export async function drafterNode(state: typeof AgentState.State, config?: RunnableConfig) {
  console.log("--- 📝 DRAFTER AGENT ACTIVATED ---");

  const apiKey = config?.configurable?.geminiApiKey || process.env.GOOGLE_GENAI_API_KEY;

  const llm = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash", // Flash has a much higher free tier limit
    apiKey: apiKey,
    temperature: 0.7,
  });

  const prompt = `
    You are a Senior Solutions Architect. Based on the following research, draft a detailed Technical Architecture Proposal.
    
    User Request: ${state.input}
    Research Data: ${state.researchData}
    Previous Critique (if any): ${state.critique}
    
    The document must include:
    1. System Overview
    2. Recommended Tech Stack
    3. Data Flow Diagram (described in text)
    4. Infrastructure Requirements
    
    If there was a previous critique, make sure to address every point specifically.
  `;

  const response = await llm.invoke(prompt);

  return {
    draft: response.content as string,
    currentStep: "Drafter has generated a technical proposal.",
  };
}