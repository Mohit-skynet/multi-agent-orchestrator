import { NextResponse } from "next/server";
import { orchestratorGraph } from "@/lib/graph/orchestrator";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ threadId: string }> | { threadId: string } }
) {
  try {
    // In Next.js 15+, params is a Promise that must be awaited
    const resolvedParams = await params;
    const { threadId } = resolvedParams;

    // Fetch the latest state checkpoint from the compiled LangGraph using the config
    const state = await orchestratorGraph.getState({
      configurable: { thread_id: threadId },
    });

    if (!state || !state.values) {
      return NextResponse.json({ error: "Session state not found" }, { status: 404 });
    }

    // Return the preserved values directly from MongoDB checkpoint history
    return NextResponse.json({
      input: state.values.input || "",
      draft: state.values.draft || "",
      critique: state.values.critique || "",
    });
  } catch (error: any) {
    console.error("Error loading checkpoint thread:", error);
    return NextResponse.json({ error: "Failed to load thread" }, { status: 500 });
  }
}
