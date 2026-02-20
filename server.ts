import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import multer from "multer";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import pdf from "pdf-parse";
import db from "./server/db";
import { GoogleGenAI, Type } from "@google/genai";

const upload = multer({ dest: "uploads/" });

// Ensure uploads directory exists
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for parsing JSON
  app.use(express.json());

  // Initialize Gemini
  // Note: In a real app, we'd handle the missing key more gracefully
  const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  // --- API Routes ---

  // 1. Upload Resume (Raw Text or PDF)
  app.post("/api/upload", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      let content = "";
      if (req.file.mimetype === "application/pdf") {
        const dataBuffer = fs.readFileSync(req.file.path);
        const data = await pdf(dataBuffer);
        content = data.text;
      } else {
        content = fs.readFileSync(req.file.path, "utf-8");
      }

      // Clean up uploaded file
      fs.unlinkSync(req.file.path);

      const id = uuidv4();
      const stmt = db.prepare(
        "INSERT INTO resumes (id, filename, content, upload_date) VALUES (?, ?, ?, ?)"
      );
      stmt.run(id, req.file.originalname, content, new Date().toISOString());

      res.json({ id, content, filename: req.file.originalname });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "Failed to process file" });
    }
  });

  // 2. Get All Resumes
  app.get("/api/resumes", (req, res) => {
    const stmt = db.prepare("SELECT * FROM resumes ORDER BY upload_date DESC");
    const resumes = stmt.all();
    res.json(resumes);
  });

  // 3. Get Single Resume
  app.get("/api/resumes/:id", (req, res) => {
    const stmt = db.prepare("SELECT * FROM resumes WHERE id = ?");
    const resume = stmt.get(req.params.id);
    if (!resume) return res.status(404).json({ error: "Resume not found" });

    const annotationsStmt = db.prepare(
      "SELECT * FROM annotations WHERE resume_id = ?"
    );
    const annotations = annotationsStmt.all(req.params.id);

    res.json({ ...resume, annotations });
  });

  // 4. Save Annotations
  app.post("/api/resumes/:id/annotate", (req, res) => {
    const { annotations } = req.body; // Array of { label, start, end, text }
    const resumeId = req.params.id;

    const deleteStmt = db.prepare("DELETE FROM annotations WHERE resume_id = ?");
    const insertStmt = db.prepare(
      "INSERT INTO annotations (id, resume_id, label, start_index, end_index, text) VALUES (?, ?, ?, ?, ?, ?)"
    );
    const updateStatusStmt = db.prepare(
      "UPDATE resumes SET status = 'annotated' WHERE id = ?"
    );

    const transaction = db.transaction(() => {
      deleteStmt.run(resumeId);
      for (const ann of annotations) {
        insertStmt.run(
          uuidv4(),
          resumeId,
          ann.label,
          ann.start_index,
          ann.end_index,
          ann.text
        );
      }
      updateStatusStmt.run(resumeId);
    });

    try {
      transaction();
      res.json({ success: true });
    } catch (error) {
      console.error("Annotation save error:", error);
      res.status(500).json({ error: "Failed to save annotations" });
    }
  });

  // 5. AI Extraction (Simulate Model Inference)
  app.post("/api/extract", async (req, res) => {
    const { text } = req.body;
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
      
      const prompt = `
        You are a Named Entity Recognition (NER) system specialized in parsing resumes.
        Extract the following entities from the text:
        - Name (The candidate's full name)
        - Email (Email address)
        - Skills (List of technical or professional skills)
        - Organization (Companies worked for)
        - Education (Universities or degrees)
        - Location (City, Country)

        Return the result as a JSON object with these keys. 
        For list items (Skills, Organization, Education), return arrays of strings.
        If an entity is not found, return null or empty array.
      `;

      const result = await model.generateContent({
        contents: [
          { role: "user", parts: [{ text: prompt }, { text: `RESUME TEXT:\n${text}` }] }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              Name: { type: Type.STRING },
              Email: { type: Type.STRING },
              Skills: { type: Type.ARRAY, items: { type: Type.STRING } },
              Organization: { type: Type.ARRAY, items: { type: Type.STRING } },
              Education: { type: Type.ARRAY, items: { type: Type.STRING } },
              Location: { type: Type.STRING },
            }
          }
        }
      });

      res.json(JSON.parse(result.response.text()));
    } catch (error) {
      console.error("AI Extraction error:", error);
      res.status(500).json({ error: "AI extraction failed" });
    }
  });

  // 6. AI Pre-annotation (For the Annotation Studio)
  app.post("/api/pre-annotate", async (req, res) => {
     const { text } = req.body;
     try {
       const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
       
       const prompt = `
         You are a data annotator. I need you to identify spans of text in the resume corresponding to these labels:
         - NAME
         - EMAIL
         - SKILL
         - ORG (Organization/Company)
         - EDU (Education/University)
         - LOC (Location)
 
         Return a JSON object containing a list of annotations.
         Each annotation should have:
         - "label": The label name (one of the above)
         - "text": The exact text substring found
         
         IMPORTANT: The "text" field must match the content in the resume exactly so I can find its index.
       `;
 
       const result = await model.generateContent({
         contents: [
           { role: "user", parts: [{ text: prompt }, { text: `RESUME TEXT:\n${text}` }] }
         ],
         config: {
           responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    annotations: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                label: { type: Type.STRING },
                                text: { type: Type.STRING }
                            }
                        }
                    }
                }
            }
         }
       });
 
       const responseData = JSON.parse(result.response.text());
       
       // Post-process to find indices (simple exact match, first occurrence - robust enough for demo)
       const annotations = [];
       let searchStartIndex = 0;
       
       // We can't easily do perfect index matching from LLM output without offset mapping, 
       // so we'll do a best-effort search in the text.
       if (responseData.annotations) {
           for (const item of responseData.annotations) {
               const index = text.indexOf(item.text);
               if (index !== -1) {
                   annotations.push({
                       label: item.label,
                       text: item.text,
                       start_index: index,
                       end_index: index + item.text.length
                   });
               }
           }
       }
 
       res.json(annotations);
     } catch (error) {
       console.error("AI Pre-annotation error:", error);
       res.status(500).json({ error: "AI pre-annotation failed" });
     }
   });

   // 7. Dashboard Stats
   app.get("/api/stats", (req, res) => {
       const totalResumes = db.prepare("SELECT COUNT(*) as count FROM resumes").get().count;
       const annotatedResumes = db.prepare("SELECT COUNT(*) as count FROM resumes WHERE status = 'annotated'").get().count;
       const totalAnnotations = db.prepare("SELECT COUNT(*) as count FROM annotations").get().count;
       
       // Get label distribution
       const labelStats = db.prepare("SELECT label, COUNT(*) as count FROM annotations GROUP BY label").all();

       res.json({
           totalResumes,
           annotatedResumes,
           totalAnnotations,
           labelStats
       });
   });

   // 8. Export Dataset (JSONL)
   app.get("/api/export", (req, res) => {
     const resumes = db.prepare("SELECT * FROM resumes WHERE status = 'annotated'").all();
     
     // Set headers for file download
     res.setHeader('Content-Type', 'application/x-jsonlines');
     res.setHeader('Content-Disposition', 'attachment; filename="dataset.jsonl"');

     for (const resume of resumes) {
       const annotations = db.prepare("SELECT label, start_index, end_index, text FROM annotations WHERE resume_id = ?").all(resume.id);
       
       const data = {
         text: resume.content,
         meta: { filename: resume.filename, id: resume.id },
         spans: annotations.map(a => ({
           label: a.label,
           start: a.start_index,
           end: a.end_index,
           text: a.text
         }))
       };
       
       res.write(JSON.stringify(data) + '\n');
     }
     res.end();
   });


  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
