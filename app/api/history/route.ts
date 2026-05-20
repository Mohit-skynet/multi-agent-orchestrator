import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("orchestrator_db");
    
    // LangGraph's MongoDBSaver stores checkpoints in a collection named 'checkpoints'
    // We fetch the unique thread IDs to populate our sidebar history list
    const threads = await db.collection("checkpoints").distinct("thread_id");

    // Format the data cleanly for our frontend sidebar
    const historyList = threads.map((id) => ({
      id,
      title: id.replace(/-/g, " ").toUpperCase(), // Human-friendly naming
    }));

    return NextResponse.json({ historyList });
  } catch (error: any) {
    console.error("Failed to fetch agent history:", error);
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}