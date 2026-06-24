import express from "express";
import path from "path";
import dotenv from "dotenv";
import fs from "fs";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { INITIAL_REVIEWS, INITIAL_LISTS } from "./src/data/initialData";
import { initializeApp, getApp } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";

dotenv.config();

// Initialize Firebase Admin SDK
const configPath = path.join(process.cwd(), "firebase-applet-config.json");
let db: Firestore | null = null;

if (fs.existsSync(configPath)) {
  try {
    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    initializeApp({
      projectId: config.projectId,
    });
    // Initialize getFirestore with the default app and custom database ID
    db = getFirestore(getApp(), config.firestoreDatabaseId);
    console.log("Firestore successfully initialized with database ID:", config.firestoreDatabaseId);
  } catch (err) {
    console.error("Failed to initialize Firebase Admin SDK:", err);
  }
}

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Lazy-initialize Gemini client to prevent startup failures and allow direct fallback if missing
let aiClient: any = null;
function getAiClient() {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key) {
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
  }
  return aiClient;
}

const REVIEWS_FILE_PATH = path.join(process.cwd(), "reviews_store.json");
const LISTS_FILE_PATH = path.join(process.cwd(), "lists_store.json");
const AFFILIATES_FILE_PATH = path.join(process.cwd(), "affiliates_store.json");

const INITIAL_AFFILIATES = [
  {
    id: "1",
    name: "Zatu Games",
    url: "https://www.board-game.co.uk",
    discountCode: "ITS_YOUR_TURN_5",
    receivesMoney: true,
  },
  {
    id: "2",
    name: "Amazon Affiliate",
    url: "https://www.amazon.co.uk",
    discountCode: "Applied via URL",
    receivesMoney: true,
  },
  {
    id: "3",
    name: "Rules of Play",
    url: "https://rulesofplay.co.uk",
    discountCode: "PLAY10",
    receivesMoney: false,
  },
  {
    id: "4",
    name: "Kienda Board Games",
    url: "https://kienda.co.uk",
    discountCode: "YOURTURN",
    receivesMoney: true,
  },
  {
    id: "5",
    name: "Element Games",
    url: "https://elementgames.co.uk",
    discountCode: "ITY5",
    receivesMoney: true,
  },
];

// Helper to load/save reviews from Firestore with local fallback
async function getReviews(): Promise<any[]> {
  if (db) {
    try {
      const snapshot = await db.collection("reviews").get();
      if (!snapshot.empty) {
        const list: any[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data());
        });
        // Sort descending by ID to match the original order
        return list.sort((a, b) => b.id - a.id);
      } else {
        // Firestore is empty, seed it with local store content if available, else curated defaults
        let initial = INITIAL_REVIEWS;
        try {
          if (fs.existsSync(REVIEWS_FILE_PATH)) {
            const raw = fs.readFileSync(REVIEWS_FILE_PATH, "utf-8");
            initial = JSON.parse(raw);
          }
        } catch (e) {
          console.error("Failed to read local reviews store for seeding:", e);
        }
        await saveReviews(initial);
        return initial;
      }
    } catch (err) {
      console.error("Failed to fetch reviews from Firestore, falling back to local files:", err);
    }
  }
  // Fallback to local files
  try {
    if (fs.existsSync(REVIEWS_FILE_PATH)) {
      const raw = fs.readFileSync(REVIEWS_FILE_PATH, "utf-8");
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error("Failed to read reviews store:", e);
  }
  return INITIAL_REVIEWS;
}

async function saveReviews(reviews: any[]) {
  // Always update local files as a backup/fallback
  try {
    fs.writeFileSync(REVIEWS_FILE_PATH, JSON.stringify(reviews, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to write reviews store:", e);
  }

  if (db) {
    try {
      const snapshot = await db.collection("reviews").get();
      const currentIds = new Set(reviews.map((r) => String(r.id)));
      const batch = db.batch();

      // Write active reviews
      for (const r of reviews) {
        const docRef = db.collection("reviews").doc(String(r.id));
        batch.set(docRef, r);
      }

      // Delete removed reviews from Firestore
      snapshot.forEach((doc) => {
        if (!currentIds.has(doc.id)) {
          batch.delete(doc.ref);
        }
      });

      await batch.commit();
    } catch (err) {
      console.error("Failed to save reviews to Firestore:", err);
    }
  }
}

// Helper to load/save lists from Firestore with local fallback
async function getLists(): Promise<any[]> {
  if (db) {
    try {
      const snapshot = await db.collection("lists").get();
      if (!snapshot.empty) {
        const list: any[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data());
        });
        return list;
      } else {
        // Firestore is empty, seed it with local store content if available, else curated defaults
        let initial = INITIAL_LISTS;
        try {
          if (fs.existsSync(LISTS_FILE_PATH)) {
            const raw = fs.readFileSync(LISTS_FILE_PATH, "utf-8");
            initial = JSON.parse(raw);
          }
        } catch (e) {
          console.error("Failed to read local lists store for seeding:", e);
        }
        await saveLists(initial);
        return initial;
      }
    } catch (err) {
      console.error("Failed to fetch lists from Firestore, falling back to local files:", err);
    }
  }
  // Fallback to local files
  try {
    if (fs.existsSync(LISTS_FILE_PATH)) {
      const raw = fs.readFileSync(LISTS_FILE_PATH, "utf-8");
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error("Failed to read lists store:", e);
  }
  return INITIAL_LISTS;
}

async function saveLists(lists: any[]) {
  // Always update local files as a backup/fallback
  try {
    fs.writeFileSync(LISTS_FILE_PATH, JSON.stringify(lists, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to write lists store:", e);
  }

  if (db) {
    try {
      const snapshot = await db.collection("lists").get();
      const currentIds = new Set(lists.map((l) => String(l.id)));
      const batch = db.batch();

      // Write active lists
      for (const l of lists) {
        const docRef = db.collection("lists").doc(String(l.id));
        batch.set(docRef, l);
      }

      // Delete removed lists from Firestore
      snapshot.forEach((doc) => {
        if (!currentIds.has(doc.id)) {
          batch.delete(doc.ref);
        }
      });

      await batch.commit();
    } catch (err) {
      console.error("Failed to save lists to Firestore:", err);
    }
  }
}

// Helper to load/save affiliates from Firestore with local fallback
async function getAffiliates(): Promise<any[]> {
  if (db) {
    try {
      const snapshot = await db.collection("affiliates").get();
      if (!snapshot.empty) {
        const list: any[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data());
        });
        return list;
      } else {
        // Firestore is empty, seed it with local store content if available, else curated defaults
        let initial = INITIAL_AFFILIATES;
        try {
          if (fs.existsSync(AFFILIATES_FILE_PATH)) {
            const raw = fs.readFileSync(AFFILIATES_FILE_PATH, "utf-8");
            initial = JSON.parse(raw);
          }
        } catch (e) {
          console.error("Failed to read local affiliates store for seeding:", e);
        }
        await saveAffiliates(initial);
        return initial;
      }
    } catch (err) {
      console.error("Failed to fetch affiliates from Firestore, falling back to local files:", err);
    }
  }
  // Fallback to local files
  try {
    if (fs.existsSync(AFFILIATES_FILE_PATH)) {
      const raw = fs.readFileSync(AFFILIATES_FILE_PATH, "utf-8");
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error("Failed to read affiliates store:", e);
  }
  return INITIAL_AFFILIATES;
}

async function saveAffiliates(affiliates: any[]) {
  // Always update local files as a backup/fallback
  try {
    fs.writeFileSync(AFFILIATES_FILE_PATH, JSON.stringify(affiliates, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to write affiliates store:", e);
  }

  if (db) {
    try {
      const snapshot = await db.collection("affiliates").get();
      const currentIds = new Set(affiliates.map((a) => String(a.id)));
      const batch = db.batch();

      // Write active affiliates
      for (const a of affiliates) {
        const docRef = db.collection("affiliates").doc(String(a.id));
        batch.set(docRef, a);
      }

      // Delete removed affiliates from Firestore
      snapshot.forEach((doc) => {
        if (!currentIds.has(doc.id)) {
          batch.delete(doc.ref);
        }
      });

      await batch.commit();
    } catch (err) {
      console.error("Failed to save affiliates to Firestore:", err);
    }
  }
}

// Utility to verify passcode against configured ADMIN_PASSCODE env or default to "admin123"
function verifyPasscode(passcode: string | undefined): boolean {
  const adminPasscode = process.env.ADMIN_PASSCODE || "admin123";
  return passcode === adminPasscode;
}

// REST API Endpoints for Reviews list

// 0. Diagnostic database status check
app.get("/api/db-status", async (req, res) => {
  if (!db) {
    res.json({
      success: false,
      status: "Not Initialized",
      message: "No firebase-applet-config.json found or database initialization failed."
    });
    return;
  }

  try {
    const start = Date.now();
    // Test a simple read request from Firestore
    const snapshot = await db.collection("reviews").limit(1).get();
    res.json({
      success: true,
      status: "Connected",
      databaseId: db.databaseId,
      timeTakenMs: Date.now() - start,
      reviewsCountInSnapshot: snapshot.size
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      status: "Permission Denied or Error",
      error: err.message || String(err),
      stack: err.stack,
      databaseId: db.databaseId
    });
  }
});

// 1. Get current reviews
app.get("/api/reviews", async (req, res) => {
  const reviews = await getReviews();
  res.json({ success: true, reviews });
});

// 1b. Verify passcode
app.post("/api/verify-passcode", (req, res) => {
  const { passcode } = req.body;
  if (verifyPasscode(passcode)) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, error: "Invalid admin passcode." });
  }
});

// 2. Add a new review (Passcode Protected)
app.post("/api/reviews", async (req, res) => {
  const { passcode, review } = req.body;

  if (!verifyPasscode(passcode)) {
    res.status(403).json({ error: "Unauthorized: Invalid admin passcode. Please check your passcode or set ADMIN_PASSCODE in Settings." });
    return;
  }

  if (!review) {
    res.status(400).json({ error: "Missing review object." });
    return;
  }

  const current = await getReviews();
  // Set incremental ID securely on the server
  const maxId = current.reduce((max, r) => (r.id > max ? r.id : max), 0);
  const newReview = {
    ...review,
    id: maxId + 1,
    isUserAdded: true,
  };

  const updated = [newReview, ...current];
  await saveReviews(updated);

  res.json({ success: true, reviews: updated });
});

// 3. Replace/Update an existing review (Passcode Protected)
app.put("/api/reviews/:id", async (req, res) => {
  const targetId = Number(req.params.id);
  const { passcode, review } = req.body;

  if (!verifyPasscode(passcode)) {
    res.status(403).json({ error: "Unauthorized: Invalid admin passcode. Please check your passcode or set ADMIN_PASSCODE in Settings." });
    return;
  }

  if (!review) {
    res.status(400).json({ error: "Missing review object." });
    return;
  }

  const current = await getReviews();
  const updated = current.map((r) => (r.id === targetId ? { ...review, id: targetId } : r));
  await saveReviews(updated);

  res.json({ success: true, reviews: updated });
});

// 3.5 Delete an existing review (Passcode Protected)
app.delete("/api/reviews/:id", async (req, res) => {
  const targetId = Number(req.params.id);
  const { passcode } = req.body;

  if (!verifyPasscode(passcode)) {
    res.status(403).json({ error: "Unauthorized: Invalid admin passcode. Please check your passcode or set ADMIN_PASSCODE in Settings." });
    return;
  }

  const current = await getReviews();
  const updated = current.filter((r) => r.id !== targetId);
  await saveReviews(updated);

  res.json({ success: true, reviews: updated });
});

// 4. Reset reviews back to curated defaults (Passcode Protected)
app.post("/api/reviews/reset", async (req, res) => {
  const { passcode } = req.body;

  if (!verifyPasscode(passcode)) {
    res.status(403).json({ error: "Unauthorized: Invalid admin passcode. Please check your passcode or set ADMIN_PASSCODE in Settings." });
    return;
  }

  await saveReviews(INITIAL_REVIEWS);
  res.json({ success: true, reviews: INITIAL_REVIEWS });
});

// REST API Endpoints for Curated Lists

// 5. Get current lists
app.get("/api/lists", async (req, res) => {
  const lists = await getLists();
  res.json({ success: true, lists });
});

// 6. Add a new list (Passcode Protected)
app.post("/api/lists", async (req, res) => {
  const { passcode, list } = req.body;

  if (!verifyPasscode(passcode)) {
    res.status(403).json({ error: "Unauthorized: Invalid admin passcode. Please check your passcode or set ADMIN_PASSCODE in Settings." });
    return;
  }

  if (!list) {
    res.status(400).json({ error: "Missing list object." });
    return;
  }

  const current = await getLists();
  const newList = {
    ...list,
    id: `list-${Date.now()}`,
    isUserAdded: true,
  };

  const updated = [...current, newList];
  await saveLists(updated);

  res.json({ success: true, lists: updated });
});

// 7. Update an existing list (Passcode Protected)
app.put("/api/lists/:id", async (req, res) => {
  const targetId = req.params.id;
  const { passcode, list } = req.body;

  if (!verifyPasscode(passcode)) {
    res.status(403).json({ error: "Unauthorized: Invalid admin passcode. Please check your passcode or set ADMIN_PASSCODE in Settings." });
    return;
  }

  if (!list) {
    res.status(400).json({ error: "Missing list object." });
    return;
  }

  const current = await getLists();
  const updated = current.map((l) => (l.id === targetId ? { ...list, id: targetId } : l));
  await saveLists(updated);

  res.json({ success: true, lists: updated });
});

// 8. Delete an existing list (Passcode Protected)
app.delete("/api/lists/:id", async (req, res) => {
  const targetId = req.params.id;
  const { passcode } = req.body;

  if (!verifyPasscode(passcode)) {
    res.status(403).json({ error: "Unauthorized: Invalid admin passcode. Please check your passcode or set ADMIN_PASSCODE in Settings." });
    return;
  }

  const current = await getLists();
  const updated = current.filter((l) => l.id !== targetId);
  await saveLists(updated);

  res.json({ success: true, lists: updated });
});

// REST API Endpoints for Affiliates

// 9. Get current affiliates
app.get("/api/affiliates", async (req, res) => {
  const affiliates = await getAffiliates();
  res.json({ success: true, affiliates });
});

// 10. Add a new affiliate (Passcode Protected)
app.post("/api/affiliates", async (req, res) => {
  const { passcode, affiliate } = req.body;

  if (!verifyPasscode(passcode)) {
    res.status(403).json({ error: "Unauthorized: Invalid admin passcode. Please check your passcode or set ADMIN_PASSCODE in Settings." });
    return;
  }

  if (!affiliate) {
    res.status(400).json({ error: "Missing affiliate object." });
    return;
  }

  const current = await getAffiliates();
  const newAffiliate = {
    ...affiliate,
    id: String(Date.now()),
  };

  const updated = [...current, newAffiliate];
  await saveAffiliates(updated);

  res.json({ success: true, affiliates: updated });
});

// 11. Update an existing affiliate (Passcode Protected)
app.put("/api/affiliates/:id", async (req, res) => {
  const targetId = req.params.id;
  const { passcode, affiliate } = req.body;

  if (!verifyPasscode(passcode)) {
    res.status(403).json({ error: "Unauthorized: Invalid admin passcode. Please check your passcode or set ADMIN_PASSCODE in Settings." });
    return;
  }

  if (!affiliate) {
    res.status(400).json({ error: "Missing affiliate object." });
    return;
  }

  const current = await getAffiliates();
  const updated = current.map((a) => (a.id === targetId ? { ...affiliate, id: targetId } : a));
  await saveAffiliates(updated);

  res.json({ success: true, affiliates: updated });
});

// 12. Delete an existing affiliate (Passcode Protected)
app.delete("/api/affiliates/:id", async (req, res) => {
  const targetId = req.params.id;
  const { passcode } = req.body;

  if (!verifyPasscode(passcode)) {
    res.status(403).json({ error: "Unauthorized: Invalid admin passcode. Please check your passcode or set ADMIN_PASSCODE in Settings." });
    return;
  }

  const current = await getAffiliates();
  const updated = current.filter((a) => a.id !== targetId);
  await saveAffiliates(updated);

  res.json({ success: true, affiliates: updated });
});

// Helper for intelligent local heuristic parsing (Fallback Parser)
function runLocalHeuristicParser(caption: string): any {
  const cleanCaption = caption.replace(/[\r\n]+/g, "\n").trim();
  const lines = cleanCaption.split("\n").map(l => l.trim()).filter(Boolean);
  
  // 1. Title Heuristics
  let titleCandidate = "New Game Review";
  if (lines.length > 0) {
    // Take first line, strip emojis, punctuation and hashtags
    const firstLineClean = lines[0]
      .replace(/[#@][\w-]+/g, "")
      .replace(/[^\w\s-]/gi, "")
      .trim();
    if (firstLineClean && firstLineClean.split(/\s+/).length <= 5) {
      titleCandidate = firstLineClean;
    } else {
      // Find first line segment
      const firstSegment = lines[0].split(/[!?:.]/)[0].replace(/[#@][\w-]+/g, "").trim();
      if (firstSegment) titleCandidate = firstSegment;
    }
  }
  
  // 2. Score Heuristics
  let scoreCandidate = 8;
  const scoreMatch = caption.match(/(\d+(?:\.\d+)?)\s*\/\s*10/);
  if (scoreMatch) {
    scoreCandidate = Math.min(10, Math.max(1, Math.round(parseFloat(scoreMatch[1]))));
  } else {
    const starMatch = caption.match(/(\d+)\s*stars?/i);
    if (starMatch) {
      scoreCandidate = Math.min(10, Math.max(1, parseInt(starMatch[1], 10) * 2));
    }
  }
  
  // 3. Spoons / Cognitive Energy
  let spoonsCandidate: "low" | "medium" | "high" = "medium";
  const lowerCaption = caption.toLowerCase();
  if (lowerCaption.includes("high spoon") || lowerCaption.includes("brain burn") || lowerCaption.includes("complex") || lowerCaption.includes("heavy")) {
    spoonsCandidate = "high";
  } else if (lowerCaption.includes("low spoon") || lowerCaption.includes("easy") || lowerCaption.includes("simple") || lowerCaption.includes("party") || lowerCaption.includes("chill")) {
    spoonsCandidate = "low";
  }
  
  // 4. Player Count
  let playersCandidate = "2-4";
  const playersMatch = caption.match(/(\d+(?:\s*-\s*\d+)?)\s*(?:players|players?|p)/i);
  if (playersMatch) {
    playersCandidate = playersMatch[1].trim();
  }
  
  // 5. Play Time
  let timeCandidate = "45-60 min";
  const timeMatch = caption.match(/(\d+(?:\s*-\s*\d+)?)\s*(?:min|mins|minutes|hr|hours)/i);
  if (timeMatch) {
    timeCandidate = timeMatch[0].trim();
  }
  
  // 6. Game Type
  let typeCandidate = "strategy";
  if (lowerCaption.includes("party") || lowerCaption.includes("word")) {
    typeCandidate = "party";
  } else if (lowerCaption.includes("cooperative") || lowerCaption.includes("co-op")) {
    typeCandidate = "cooperative";
  } else if (lowerCaption.includes("family") || lowerCaption.includes("kids")) {
    typeCandidate = "family";
  }
  
  // 7. Extract Tags
  const tagsSet = new Set<string>();
  const hashtags = caption.match(/#(\w+)/g);
  if (hashtags) {
    hashtags.slice(0, 3).forEach(tag => {
      const cleanTag = tag.replace("#", "").toLowerCase();
      if (cleanTag !== "boardgames" && cleanTag !== "boardgame") {
        tagsSet.add(cleanTag);
      }
    });
  }
  if (tagsSet.size === 0) {
    tagsSet.add(typeCandidate);
    tagsSet.add("imported");
  }
  
  // 8. Dynamic Emojis
  let emojiCandidate = "🎲";
  const emojiMatches = caption.match(/[\u{1F300}-\u{1F9FF}]/gu);
  if (emojiMatches && emojiMatches.length > 0) {
    emojiCandidate = emojiMatches[0];
  }
  
  // 9. Verdict and Subtitle
  const verdictCandidate = `A delightful ${typeCandidate} game that scores a solid ${scoreCandidate}/10.`;
  const subtitleCandidate = `Successfully parsed from Instagram updates`;
  
  // 10. Generate HTML Body
  const htmlParagraphs = lines
    .map(line => {
      // strip hashtags for neat body
      const cleanLine = line.replace(/#\w+/g, "").trim();
      return cleanLine ? `<p>${cleanLine}</p>` : "";
    })
    .filter(Boolean)
    .join("\n");
  
  return {
    title: titleCandidate,
    subtitle: subtitleCandidate,
    type: typeCandidate,
    players: playersCandidate,
    time: timeCandidate,
    score: scoreCandidate,
    verdict: verdictCandidate,
    body: htmlParagraphs || "<p>An exciting game parsed successfully from social media updates.</p>",
    tags: Array.from(tagsSet),
    emoji: emojiCandidate,
    spoons: spoonsCandidate
  };
}

// API endpoint to parse Instagram captions into standard reviews
app.post("/api/parse-instagram", async (req, res) => {
  try {
    const { caption, imageUrl } = req.body;

    if (!caption || typeof caption !== "string") {
      res.status(400).json({ error: "Missing or invalid Instagram caption." });
      return;
    }

    let parsedData: any = null;
    let modelUsed = "";

    const client = getAiClient();

    if (!client) {
      console.warn("GEMINI_API_KEY is missing. Falling back directly to intelligent local heuristic regex parser.");
      modelUsed = "local-heuristic-parser";
      parsedData = runLocalHeuristicParser(caption);
    } else {
      const systemInstruction = `You are an expert board game reviewer and content parser. 
Your task is to take a raw Instagram post caption (which might include hashtags, emojis, casual text, ratings like '9/10' or '5 stars', spoons/energy references, and player counts) and parse/transform it into a beautifully written, structured, and comprehensive board game review object.

Make sure the HTML in the 'body' field is rich and engaging. Convert raw paragraph breaks into proper HTML <p> tags, and feel free to use <h3> or <strong> for subheadings/emphasis to make the review look like a professional, polished editorial piece.

If the input is missing specific details, use your knowledge of the game to populate details like play time, player count, or type.
For cognitive energy 'spoons':
- 'low': simple rules, easy to play, good for tired brains or casual party nights (e.g., Codenames, Ticket to Ride).
- 'medium': some tactical depth, light-to-moderate engine/tableau building, family strategy (e.g., Wingspan, Everdell).
- 'high': complex rules, deep optimization, high mental load (e.g., Dune: Imperium, Spirit Island).`;

      const prompt = `Here is the Instagram post caption to parse:
"""
${caption}
"""

Please parse this board game review and return the structured JSON representation.`;

      // Tier 1: Try gemini-3.5-flash
      try {
        modelUsed = "gemini-3.5-flash";
        const response = await client.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: "The title of the board game" },
                subtitle: { type: Type.STRING, description: "A catchy, clever subtitle or hook for the review" },
                type: { type: Type.STRING, description: "The category of the game, e.g., 'strategy', 'party', 'cooperative', 'family', 'card game', etc." },
                players: { type: Type.STRING, description: "Supported player count, e.g., '2-4' or '1-5'" },
                time: { type: Type.STRING, description: "Average play duration, e.g., '45-90 min'" },
                score: { type: Type.NUMBER, description: "Review rating out of 10. Must be a number from 1 to 10." },
                verdict: { type: Type.STRING, description: "A single-sentence summary representing the final verdict." },
                body: { type: Type.STRING, description: "The detailed, high-quality board game review body as HTML paragraphs (surrounded by <p>...</p> tags). Expand casual notes into smooth, professional, and descriptive critique. Ensure all text is inside proper HTML tags." },
                tags: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "An array of 2-4 key mechanics or themes of the game as lowercase tags, e.g. ['cooperative', 'deck building', 'word game']"
                },
                emoji: { type: Type.STRING, description: "A single highly representative board game-related or thematic emoji, e.g. 🧩, 🚂, 🌊, 🕵️" },
                spoons: { type: Type.STRING, description: "Cognitive energy level. Must be exactly 'low', 'medium', or 'high'." },
              },
              required: ["title", "subtitle", "type", "players", "time", "score", "verdict", "body", "tags", "emoji", "spoons"]
            }
          }
        });
        parsedData = JSON.parse(response.text.trim());
      } catch (err35: any) {
        console.warn("Tier 1 (gemini-3.5-flash) failed or high-demand, trying Tier 2 (gemini-2.5-flash)...", err35.message);
        
        // Tier 2: Try gemini-2.5-flash as recommended stable model
        try {
          modelUsed = "gemini-2.5-flash";
          const response = await client.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
              systemInstruction,
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "The title of the board game" },
                  subtitle: { type: Type.STRING, description: "A catchy, clever subtitle or hook for the review" },
                  type: { type: Type.STRING, description: "The category of the game, e.g., 'strategy', 'party', 'cooperative', 'family', 'card game', etc." },
                  players: { type: Type.STRING, description: "Supported player count, e.g., '2-4' or '1-5'" },
                  time: { type: Type.STRING, description: "Average play duration, e.g., '45-90 min'" },
                  score: { type: Type.NUMBER, description: "Review rating out of 10. Must be a number from 1 to 10." },
                  verdict: { type: Type.STRING, description: "A single-sentence summary representing the final verdict." },
                  body: { type: Type.STRING, description: "The detailed, high-quality board game review body as HTML paragraphs (surrounded by <p>...</p> tags). Expand casual notes into smooth, professional, and descriptive critique. Ensure all text is inside proper HTML tags." },
                  tags: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "An array of 2-4 key mechanics or themes of the game as lowercase tags, e.g. ['cooperative', 'deck building', 'word game']"
                  },
                  emoji: { type: Type.STRING, description: "A single highly representative board game-related or thematic emoji, e.g. 🧩, 🚂, 🌊, 🕵️" },
                  spoons: { type: Type.STRING, description: "Cognitive energy level. Must be exactly 'low', 'medium', or 'high'." },
                },
                required: ["title", "subtitle", "type", "players", "time", "score", "verdict", "body", "tags", "emoji", "spoons"]
              }
            }
          });
          parsedData = JSON.parse(response.text.trim());
        } catch (err25: any) {
          console.error("Both Gemini tiers failed. Falling back to intelligent local heuristic regex parser...", err25.message);
          modelUsed = "local-heuristic-parser";
          parsedData = runLocalHeuristicParser(caption);
        }
      }
    }

    // Attach the provided image URL if present, otherwise default to a nice board game placeholder
    parsedData.image = imageUrl || "https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&q=80&w=1200";
    
    res.json({ success: true, review: parsedData, parsedBy: modelUsed });
  } catch (error: any) {
    console.error("Gemini Parsing Error:", error);
    res.status(500).json({ error: error.message || "Failed to parse Instagram review caption." });
  }
});

// Setup Vite Dev Server / Static Asset Serving
async function initServer() {
  const distPath = path.join(process.cwd(), "dist");
  const useVite = process.env.NODE_ENV !== "production" || !fs.existsSync(distPath);

  console.log(`[initServer] NODE_ENV: ${process.env.NODE_ENV}, distPath exists: ${fs.existsSync(distPath)}, useVite: ${useVite}`);

  if (useVite) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("[initServer] Vite development server middleware mounted.");
  } else {
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("[initServer] Static production folder 'dist' mounted.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

initServer();
