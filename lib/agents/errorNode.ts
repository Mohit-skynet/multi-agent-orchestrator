import { AgentState } from "../state";

export async function errorNode(state: typeof AgentState.State) {
  console.log("--- ❌ ERROR NODE ACTIVATED ---");

  const errorMessage = "Error: I am an Automated ML Architect. I can only design software systems, not provide recipes or general chat.";

  return {
    draft: errorMessage,
    critique: "REJECTED_BY_GATEKEEPER",
    currentStep: "Workflow halted: Irrelevant prompt detected.",
  };
}
