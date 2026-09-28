"use client";

import { useState } from "react";

export default function FileUploader({
  label,
  accept,
  value,
  onChange,
}: {
  label: string;
  accept?: string;
  value?: string;
  onChange: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");

  async function handleFile(file: File) {
    setUploading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      onChange(data.url);
      setFileName(file.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <div className="flex items-center gap-3">
        <input
          type="file"
          accept={accept}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
          className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-full file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-700"
        />
      </div>
      {uploading && <p className="mt-1 text-xs text-cyan-700">Uploading…</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      {value && !uploading && (
        <p className="mt-1 truncate text-xs text-emerald-700">Uploaded: {fileName || value}</p>
      )}
    </div>
  );
}
