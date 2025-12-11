import { useState, useEffect } from "react";
import { uploadFile, fetchDocuments, deleteDocument, getDownloadURL } from "./api";

export default function App() {
  const [file, setFile] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Load documents on mount
  useEffect(() => {
    const loadDocuments = async () => {
      try {
        setLoading(true);
        const docs = await fetchDocuments();
        setDocuments(docs);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    loadDocuments();
  }, []);

  // Upload PDF
  const handleUpload = async () => {
    if (!file) return setMsg("⚠️ Select a PDF first");
    setMsg("");
    setLoading(true);

    const res = await uploadFile(file);
    setMsg(res.message || res.error);

    const docs = await fetchDocuments();
    setDocuments(docs);
    setFile(null); // reset file input
    setLoading(false);
  };

  // Delete PDF
  const handleDelete = async (id) => {
    setLoading(true);
    await deleteDocument(id);
    const docs = await fetchDocuments();
    setDocuments(docs);
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 700, margin: "40px auto", fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ textAlign: "center", color: "#2c3e50" }}>Patient Document Portal</h1>

      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files[0])}
          style={{ flex: 1, padding: 8 }}
        />
        <button
          onClick={handleUpload}
          style={{
            padding: "8px 16px",
            backgroundColor: "#2980b9",
            color: "white",
            border: "none",
            cursor: "pointer",
            borderRadius: 4,
          }}
        >
          Upload
        </button>
      </div>

      {msg && <p style={{ color: msg.includes("success") ? "green" : "red" }}>{msg}</p>}

      <h2 style={{ marginTop: 30, color: "#34495e" }}>Uploaded Documents</h2>

      {loading ? (
        <p>Loading...</p>
      ) : documents.length === 0 ? (
        <p>No documents uploaded yet.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {documents.map((doc) => (
            <li
              key={doc.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 15px",
                marginBottom: 8,
                border: "1px solid #ccc",
                borderRadius: 6,
                backgroundColor: "#f9f9f9",
              }}
            >
              <div>
                <strong>{doc.filename}</strong>{" "}
                <span style={{ color: "#7f8c8d" }}>
                  ({(doc.filesize / 1024).toFixed(1)} KB)
                </span>
              </div>
              <div>
                <a
                  href={getDownloadURL(doc.filepath)}
                  target="_blank"
                  style={{
                    marginRight: 10,
                    textDecoration: "none",
                    color: "#27ae60",
                    fontWeight: "bold",
                  }}
                >
                  Download
                </a>
                <button
                  onClick={() => handleDelete(doc.id)}
                  style={{
                    padding: "4px 8px",
                    backgroundColor: "#c0392b",
                    color: "white",
                    border: "none",
                    cursor: "pointer",
                    borderRadius: 4,
                  }}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
