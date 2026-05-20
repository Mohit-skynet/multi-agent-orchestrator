# Goal: Add a Gatekeeper Pre-check to the Orchestrator

The objective is to implement a fast initial check to determine whether the user's input is related to Software Engineering or IT Infrastructure. If the input is irrelevant (e.g., a recipe request or general chat), the system should bypass the expensive Researcher-Drafter-Auditor loop and return a predefined error message.

## Proposed Changes

We will introduce two new nodes to the LangGraph and add a conditional routing step right after the start.

### 1. Update State (`lib/state.ts`)
- **[MODIFY]** [state.ts](file:///home/mohit/Work_Space/multi-agent-orchestrator/lib/state.ts): Add an `isRelevant: Annotation<boolean>()` state property to help route the graph after the gatekeeper evaluates the prompt.

### 2. Create Gatekeeper Agent (`lib/agents/gatekeeper.ts`)
- **[NEW]** [gatekeeper.ts](file:///home/mohit/Work_Space/multi-agent-orchestrator/lib/agents/gatekeeper.ts): An agent that uses `gemini-2.5-flash` (for high speed) to evaluate the user's `input`. It prompts the LLM to reply strictly with "Yes" or "No" based on whether the query relates to Software Engineering or IT infrastructure. It updates the `isRelevant` state.

### 3. Create Error Node (`lib/agents/errorNode.ts`)
- **[NEW]** [errorNode.ts](file:///home/mohit/Work_Space/multi-agent-orchestrator/lib/agents/errorNode.ts): A simple dummy agent (doesn't need to call the LLM) that handles irrelevant prompts. It updates the state's `draft` and `currentStep` with the specific message: `"Error: I am an Automated ML Architect. I can only design software systems, not provide recipes or general chat."`

### 4. Update Orchestrator Graph (`lib/graph/orchestrator.ts`)
- **[MODIFY]** [orchestrator.ts](file:///home/mohit/Work_Space/multi-agent-orchestrator/lib/graph/orchestrator.ts): 
  - Add `gatekeeper` and `errorNode` to the graph.
  - Route `START` -> `gatekeeper`.
  - Add a conditional edge from `gatekeeper`:
    - If `state.isRelevant` is true -> route to `researcher`.
    - If `state.isRelevant` is false -> route to `errorNode`.
  - Ensure `errorNode` routes to `END`.

## Verification Plan

1. **Manual Verification**: 
   - I will submit an irrelevant prompt (e.g., "How do I bake a cake?") using the browser or testing the app and verify it routes to the Error Node and returns the exact error string immediately.
2. **Review UI Updates**: Ensure the Next.js UI successfully renders the error message via the streaming API.
