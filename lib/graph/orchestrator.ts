import { StateGraph, END, START } from "@langchain/langgraph";
import { MongoDBSaver } from "@langchain/langgraph-checkpoint-mongodb";
import { MongoClient } from "mongodb";
import { AgentState } from "../state";
import { researcherNode } from "../agents/researcher";
import { drafterNode } from "../agents/drafter";
import { auditorNode } from "../agents/auditor";
import { gatekeeperNode } from "../agents/gatekeeper";
import { errorNode } from "../agents/errorNode";

// 1. Build the routing condition logic (Keep your existing shouldContinue function here)
function shouldContinue(state: typeof AgentState.State) {
  const { critique, revisionCount } = state;
  if (critique.includes("APPROVED") || revisionCount > 3) return END;
  return "drafter";
}

function routeFromGatekeeper(state: typeof AgentState.State) {
  if (state.isRelevant) {
    return "researcher";
  }
  return "errorNode";
}

// 2. Define the Graph Workflow Nodes and Edges
const workflow = new StateGraph(AgentState)
  .addNode("gatekeeper", gatekeeperNode)
  .addNode("errorNode", errorNode)
  .addNode("researcher", researcherNode)
  .addNode("drafter", drafterNode)
  .addNode("auditor", auditorNode)
  .addEdge(START, "gatekeeper")
  .addConditionalEdges("gatekeeper", routeFromGatekeeper)
  .addEdge("errorNode", END)
  .addEdge("researcher", "drafter")
  .addEdge("drafter", "auditor")
  .addConditionalEdges("auditor", shouldContinue);

// 3. Instantiate MongoDB Persistence Saver
// We initialize a standalone MongoClient pointing to our URI specifically for managing state checkpoints
const mongoClient = new MongoClient(process.env.MONGODB_URI || "");
const checkpointer = new MongoDBSaver({ 
  client: mongoClient as any,
  dbName: "orchestrator_db" // Directs checkpoints to your new dedicated database folder
});

// 4. Compile the graph WITH the checkpointer injected
export const orchestratorGraph = workflow.compile({ checkpointer });