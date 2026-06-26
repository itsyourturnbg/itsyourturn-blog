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
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

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

// Helper to preserve base64 images directly inside the Firestore document.
// This works perfectly on the Starter/Spark tier and ensures 100% cloud persistence without Storage bucket upgrades.
async function saveBase64Image(base64Str: string): Promise<string> {
  return base64Str;
}

// Process all images in a review to extract base64s to disk or cloud storage
async function processReviewImages(review: any): Promise<any> {
  if (!review) return review;
  const processed = { ...review };

  if (processed.image) {
    processed.image = await saveBase64Image(processed.image);
  }

  if (Array.isArray(processed.images)) {
    processed.images = await Promise.all(
      processed.images.map((img: any) => saveBase64Image(img))
    );
  }

  return processed;
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
  const processedReview = await processReviewImages(review);
  // Set incremental ID securely on the server
  const maxId = current.reduce((max, r) => (r.id > max ? r.id : max), 0);
  const newReview = {
    ...processedReview,
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
  const processedReview = await processReviewImages(review);
  const updated = current.map((r) => (r.id === targetId ? { ...processedReview, id: targetId } : r));
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
