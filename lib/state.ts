import { Annotation } from "@langchain/langgraph";

/**
 * This is the shared memory of our Multi-Agent system.
 * Every agent will have access to this object.
 */
export const AgentState = Annotation.Root({
  // The original goal from the human
  input: Annotation<string>(),

  // Pre-check result indicating if the input is relevant to Software Engineering
  isRelevant: Annotation<boolean>({
    reducer: (x, y) => y, // Standard overwrite behavior
    default: () => true, // default to true so existing behavior is preserved if skipped
  }),
  
  // Data gathered from the internet by the Researcher
  researchData: Annotation<string>({
    reducer: (x, y) => x + "\n" + y, // This "appends" new research to old research
  }),
  
  // The current technical document draft
  draft: Annotation<string>(),
  
  // The feedback/critique from the Auditor
  critique: Annotation<string>(),
  
  // A safety counter to stop the AI if it gets stuck in a loop
  revisionCount: Annotation<number>({
    reducer: (x, y) => x + y,
    default: () => 0,
  }),

  // Tracks which agent is currently talking for the UI
  currentStep: Annotation<string>(),
});