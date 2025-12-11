const API_URL = "http://localhost:5000";

// Upload a PDF file
export async function uploadFile(file) {
  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch(`${API_URL}/documents/upload`, {
      method: "POST",
      body: formData,
    });
    return await res.json();
  } catch (err) {
    console.error("Upload error:", err);
    return { error: "Upload failed" };
  }
}

// Fetch all uploaded documents
export async function fetchDocuments() {
  try {
    const res = await fetch(`${API_URL}/documents`);
    return await res.json();
  } catch (err) {
    console.error("Fetch documents error:", err);
    return [];
  }
}

// Delete a document by ID
export async function deleteDocument(id) {
  try {
    const res = await fetch(`${API_URL}/documents/${id}`, { method: "DELETE" });
    return await res.json();
  } catch (err) {
    console.error("Delete error:", err);
    return { error: "Delete failed" };
  }
}

// Get download URL for a document
export function getDownloadURL(filepath) {
  // Ensure forward slashes for Windows paths
  const urlPath = filepath.replace(/\\/g, "/");
  return `${API_URL}/${urlPath}`;
}

