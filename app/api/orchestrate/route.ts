import { NextResponse } from "next/server";
import { orchestratorGraph } from "@/lib/graph/orchestrator";

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // 1. Create the initial state
    const initialState = {
      input: prompt,
      researchData: "",
      draft: "",
      critique: "",
      revisionCount: 0,
      currentStep: "Initializing Orchestrator...",
    };

    // 2. Set up Server-Sent Events (Streaming)
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const config = {
            configurable: {
              thread_id:`session-${Date.now()}-${Math.floor(Math.random() * 1000)}` 
            }
          };

          // Pass the config object as the second argument to your graph streaming execution
          for await (const chunk of await orchestratorGraph.stream(initialState, config)) {
            const nodeName = Object.keys(chunk)[0] as keyof typeof chunk;
            const stateUpdate = chunk[nodeName] as any;
            
            const data = JSON.stringify({
              node: nodeName,
              step: stateUpdate.currentStep,
              draft: stateUpdate.draft || null,
              critique: stateUpdate.critique || null,
            });

            controller.enqueue(encoder.encode(`data: ${data}\n\n`));     
          }
          // Signal the end of the stream
          controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
          controller.close();
        } catch (err: unknown) {
          controller.error(err);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });

  } catch (error: unknown) {
    console.error("API Route Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}