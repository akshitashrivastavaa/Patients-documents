const express = require("express");
const cors = require("cors");
const multer = require("multer");
const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const uploadFolder = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadFolder)) fs.mkdirSync(uploadFolder);


const db = new sqlite3.Database("./patients.db", (err) => {
  if (err) console.error("DB connection error:", err);
  else console.log("Connected to SQLite database");
});


db.run(
  `CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    filepath TEXT NOT NULL,
    filesize INTEGER NOT NULL,
    created_at TEXT NOT NULL
  )`
);


const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Only PDF files are allowed"));
    }
    cb(null, true);
  },
});


app.get("/", (req, res) => {
  res.send("Backend OK");
});


app.post("/documents/upload", upload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const uploadedFile = req.file;
    const filename = uploadedFile.filename;
    const filepath = uploadedFile.path.replace(/\\/g, "/"); // fix Windows paths
    const size = uploadedFile.size;
    const createdAt = new Date().toISOString();

    
    db.run(
      "INSERT INTO documents (filename, filepath, filesize, created_at) VALUES (?, ?, ?, ?)",
      [filename, filepath, size, createdAt],
      function (err) {
        if (err) {
          console.error("DB insert error:", err);
          return res.status(500).json({ error: "Database error" });
        }

        console.log(`File uploaded: ${filename} (${size} bytes)`);
        res.json({
          message: "File uploaded successfully",
          file: { id: this.lastID, filename, filepath, size, created_at: createdAt },
        });
      }
    );
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Server error" });
  }
});


app.get("/documents", (req, res) => {
  db.all("SELECT * FROM documents ORDER BY created_at DESC", [], (err, rows) => {
    if (err) {
      console.error("DB fetch error:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(rows);
  });
});


app.get("/documents/:id", (req, res) => {
  const id = req.params.id;
  db.get("SELECT * FROM documents WHERE id = ?", [id], (err, row) => {
    if (err || !row) return res.status(404).json({ error: "Document not found" });
    res.download(path.join(__dirname, row.filepath), row.filename);
  });
});


app.delete("/documents/:id", (req, res) => {
  const id = req.params.id;
  db.get("SELECT * FROM documents WHERE id = ?", [id], (err, row) => {
    if (err || !row) return res.status(404).json({ error: "Document not found" });

    fs.unlink(path.join(__dirname, row.filepath), (fsErr) => {
      if (fsErr) console.error("File deletion error:", fsErr);

   
      db.run("DELETE FROM documents WHERE id = ?", [id], function (dbErr) {
        if (dbErr) return res.status(500).json({ error: "Database error" });
        console.log(`Deleted file: ${row.filename}`);
        res.json({ message: "Document deleted successfully" });
      });
    });
  });
});


const PORT = 5000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
