import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { TavilySearch } from "@langchain/tavily";
import { AgentState } from "../state";

import { RunnableConfig } from "@langchain/core/runnables";

export async function researcherNode(state: typeof AgentState.State, config?: RunnableConfig) {
  console.log("--- 🕵️‍♂️ RESEARCHER AGENT ACTIVATED ---");

  // 1. Initialize the Search Tool
  const searchTool = new TavilySearch({
      maxResults: 3, // Keep it focused on the top 3 most relevant results
      tavilyApiKey: process.env.TAVILY_API_KEY,
  });

  // 2. Fetch live data from the web based on the user's input
  const searchQuery = `Latest architecture, MLOps, and best practices for: ${state.input}`;
  const rawSearchResults = await searchTool.invoke({ query: searchQuery });

  // 3. Initialize Gemini to act as the "Synthesizer"
  const apiKey = config?.configurable?.geminiApiKey || process.env.GOOGLE_GENAI_API_KEY;
  const llm = new ChatGoogleGenerativeAI({
      model: "gemini-2.5-flash", // Flash is perfect for fast summarization
      apiKey: apiKey,
      temperature: 0.2, // Low temperature for factual, grounded responses
  });

    // 4. Prompt Gemini to organize the raw web data
    const prompt = `
    You are an AI Data Synthesizer for a Senior ML Architect.
    
    User's Project Goal: ${state.input}
    
    Raw Search Results from the Web:
    ${rawSearchResults}
    
    Task: Extract the key technical recommendations, required infrastructure, and modern best practices from the search results. 
    Format this as a clean, concise bulleted list that another agent can easily read to draft a formal architecture document.
  `;

    const response = await llm.invoke(prompt);

    // 5. Update the LangGraph State
    return {
        researchData: response.content as string,
        currentStep: "Researcher gathered and synthesized web data.",
    };
}