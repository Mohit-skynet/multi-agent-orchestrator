"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Bot, FileText, ShieldCheck, Loader2, Download } from "lucide-react";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  
  // State to hold the live updates from the agents
  const [currentStep, setCurrentStep] = useState("");
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [critiqueLog, setCritiqueLog] = useState<string[]>([]);
  // 1. Add these state variables at the top of your Home component:
  const [history, setHistory] = useState<{ id: string; title: string }[]>([]);
  const [userApiKey, setUserApiKey] = useState("");
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [tempApiKey, setTempApiKey] = useState("");

  // 2. Add a function to load the historical thread list from our new API:
  const fetchChatHistory = async () => {
    const res = await fetch("/api/history");
    const data = await res.json();
    if (data.historyList) setHistory(data.historyList);
  };

  // Load history on initial page load
  useEffect(() => {
    fetchChatHistory();
    const storedKey = localStorage.getItem("geminiApiKey");
    if (storedKey) {
      setUserApiKey(storedKey);
    } else {
      setShowApiKeyModal(true);
    }
  }, []);

  const saveApiKey = () => {
    if (!tempApiKey.trim()) return;
    localStorage.setItem("geminiApiKey", tempApiKey.trim());
    setUserApiKey(tempApiKey.trim());
    setShowApiKeyModal(false);
  };

  // 3. Add a function to handle clicking an old chat:
  const loadPastSession = async (threadId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/history/${threadId}`);
      const data = await res.json();
      
      setPrompt(data.input);
      setDraft(data.draft);
      if (data.critique) setCritiqueLog([data.critique]);
      setCurrentStep("Loaded past checkpoint session from Atlas.");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startOrchestrator = async () => {
    if (!prompt) return;
    setLoading(true);
    setDraft("");
    setCritiqueLog([]);
    setCurrentStep("Waking up agents...");

    try {
      // Open a connection to our streaming API
      const response = await fetch("/api/orchestrate", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Gemini-API-Key": userApiKey
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      // Listen to the stream in real-time
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value);
          const lines = chunk.split("\n\n").filter(Boolean);
          
          for (const line of lines) {
            if (line.replace("data: ", "") === "[DONE]") {
               setCurrentStep("Workflow Complete!");
               setActiveNode(null);
               break;
            }

            try {
              const data = JSON.parse(line.replace("data: ", ""));
              setActiveNode(data.node);
              setCurrentStep(data.step);
              
              if (data.draft) setDraft(data.draft);
              if (data.critique) {
                setCritiqueLog((prev) => [...prev, data.critique]);
              }
            } catch {
              // Ignore partial JSON chunks
            }
          }
        }
      }
    } catch (error) {
      console.error(error);
      setCurrentStep("An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    if (!draft) return;
    const blob = new Blob([draft], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "architecture_proposal.md";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-screen bg-gray-50 text-black font-sans overflow-hidden">
      
      {/* Left Side: History Sidebar */}
      <div className="w-64 bg-gray-900 text-white p-4 flex flex-col justify-between border-r border-gray-800">
        <div>
          <h2 className="text-sm font-semibold tracking-wider uppercase text-gray-400 mb-4 px-2">Past Generations</h2>
          <div className="space-y-1 overflow-y-auto max-h-[80vh]">
            {history.map((item) => (
              <button
                key={item.id}
                onClick={() => loadPastSession(item.id)}
                className="w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-800 transition truncate block text-gray-300"
              >
                📁 {item.title}
              </button>
            ))}
            {history.length === 0 && (
              <p className="text-xs text-gray-500 italic px-2">No historical records found yet.</p>
            )}
          </div>
        </div>
        <div className="text-xs text-gray-500 border-t border-gray-800 pt-3 text-center">
          Connected to MongoDB Atlas ✅
        </div>
      </div>

      {/* Right Side: Your Existing Application Container */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-5xl mx-auto space-y-8">
          
          {/* Header */}
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Automated ML Architect</h1>
            <p className="text-gray-500">Multi-Agent Orchestrator powered by LangGraph & Gemini</p>
          </div>

          {/* Input Section */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex gap-4">
            <input 
              type="text" 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., I need an architecture for a real-time fraud detection pipeline using Kafka and PyTorch..."
              className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              disabled={loading}
            />
            <button 
              onClick={startOrchestrator}
              disabled={loading || !prompt}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Bot className="w-5 h-5" />}
              {loading ? "Orchestrating..." : "Generate Architecture"}
            </button>
          </div>

          {/* Status Indicator */}
          {loading && (
            <div className="bg-blue-50 text-blue-800 p-4 rounded-lg flex items-center gap-3 animate-pulse">
              <span className="font-semibold uppercase text-sm tracking-wider">
                 Active Node: {activeNode || "system"}
              </span>
              <span>— {currentStep}</span>
            </div>
          )}

          {/* Main Content Area */}
          <div className="grid grid-cols-3 gap-8">
            
            {/* Left Column: Final Document */}
            <div className="col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-8 min-h-[500px]">
               <div className="flex items-center justify-between mb-6 border-b pb-4">
                 <div className="flex items-center gap-2">
                   <FileText className="w-5 h-5 text-gray-400" />
                   <h2 className="text-xl font-semibold text-gray-800">Architecture Proposal</h2>
                 </div>
                 {draft && (
                   <button 
                     onClick={downloadReport}
                     className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded transition"
                   >
                     <Download className="w-4 h-4" />
                     Download .md
                   </button>
                 )}
               </div>
               {draft ? (
                  <div className="prose max-w-none text-gray-700">
                    <ReactMarkdown>{draft}</ReactMarkdown>
                  </div>
               ) : (
                  <div className="h-full flex items-center justify-center text-gray-400 italic">
                    Document will appear here once drafted...
                  </div>
               )}
            </div>

            {/* Right Column: Internal Agent Logs */}
            <div className="col-span-1 space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-2 mb-4 border-b pb-4">
                  <ShieldCheck className="w-5 h-5 text-gray-400" />
                  <h3 className="font-semibold text-gray-800">Auditor Logs</h3>
                </div>
                
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                  {critiqueLog.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">Waiting for initial draft...</p>
                  ) : (
                    critiqueLog.map((log, idx) => (
                      <div key={idx} className={`p-3 rounded text-sm ${log.includes("APPROVED") ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"}`}>
                        <span className="font-bold block mb-1">Revision {idx + 1}:</span>
                        {log}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* API Key Modal Overlay */}
      {showApiKeyModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Welcome to Automated ML Architect</h2>
            <p className="text-gray-500 mb-6 text-sm">Please provide your Gemini API key to start generating architectures. Your key is stored securely in your browser's local storage and is never saved on our servers.</p>
            <input 
              type="password"
              value={tempApiKey}
              onChange={(e) => setTempApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black mb-4"
            />
            <button 
              onClick={saveApiKey}
              disabled={!tempApiKey.trim()}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition"
            >
              Save API Key
            </button>
          </div>
        </div>
      )}

    </div>
  );
}