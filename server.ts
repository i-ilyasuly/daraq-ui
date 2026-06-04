import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize the Gemini client server-side
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// API route to proxy chat messages to avoid client-side CORS issues
app.post("/api/chat", async (req, res) => {
  try {
    const { message, thinking } = req.body;
    
    // Retrieve target backend URL from environment variables
    const targetUrl = process.env.VITE_API_BASE_URL || "https://daraq-825651888803.europe-west3.run.app";
    
    console.log(`[Proxy] Routing chat query to remote backend API: ${targetUrl}/api/chat`);
    
    let data;
    try {
      // Server-side call translates bypassing CORS constraints
      const backendResponse = await fetch(`${targetUrl}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, healthiest) Chrome/122.0.0.0 Safari/537.36",
        },
        body: JSON.stringify({ message, thinking }),
      });

      if (!backendResponse.ok) {
        throw new Error(`Target API returned error state: ${backendResponse.status}`);
      }

      data = await backendResponse.json();
    } catch (proxyError: any) {
      console.warn("[Proxy] External backend failed or was blocked (likely due to Vite 6 allowedHosts or 403). Falling back to direct Gemini...", proxyError.message || proxyError);
      
      // Fallback: Use direct Gemini 3.5 Flash server-side integration
      const systemInstruction = 
        "Сіз Ханафи мәзһабы бойынша мұсылмандарға арналған көмекші және тақуалық сұрақтар бойынша кеңесшісіз (Daraq Hanafi Fiqh Assistant). " +
        "Сұрақтарға тек Ханафи фиқһының классикалық мәтіндері мен сенімді еңбектеріне сүйене отырып жауап беріңіз. " +
        "Жауаптарыңыз нақты, сыпайы және қазақ тілінде болуы тиіс. " +
        "Егер сұрақ шариғатқа немесе фиқһқа қатысы жоқ болмаса, сыпайы түрде негізгі тақырыпқа қайта бағыттаңыз. " +
        "Жауапты жақсы пішімделген Markdown форматында көрсетіңіз.";

      const prompt = `Пайдаланушы сұрағы: ${message}\nОйлау режимі (Thinking): ${thinking ? "Қосулы" : "Өшірулі"}`;

      const geminiResponse = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      const responseText = geminiResponse.text || "Кешіріңіз, сұрағыңызға жауап дайындау барысында қателік орын алды.";
      data = {
        response: responseText,
        source: "local-gemini"
      };
    }

    return res.json(data);
  } catch (error: any) {
    console.error("[Proxy] Connection handler threw an exception:", error);
    return res.status(500).json({ 
      error: "Proxy connection error", 
      details: error?.message || String(error) 
    });
  }
});

async function startServer() {
  // Integrate Vite dev server middleware if in development mode
  if (process.env.NODE_ENV !== "production") {
    console.log("[Server] Mounting Vite middleware in development dynamic mode...");
    const vite = await createViteServer({
      server: { middlewareMode: true, allowedHosts: true as const },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("[Server] Serving production pre-built assets from distribution bundle...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Full-stack proxy hub online and listening at http://localhost:${PORT}`);
  });
}

startServer();
