"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import RequireAuth from "@/components/RequireAuth";
import FileUploader from "@/components/FileUploader";

const REGIONS = ["antarctic", "arctic", "himalaya", "southern_ocean", "other"];

function ExpeditionFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");

  const [form, setForm] = useState({
    title: "",
    expeditionNumber: "",
    year: new Date().getFullYear().toString(),
    region: "antarctic",
    location: "",
    objectives: "",
    description: "",
    organizations: "",
    scientists: "",
    reportUrl: "",
    coverImageUrl: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [statusNote, setStatusNote] = useState("");

  useEffect(() => {
    if (!editId) return;
    fetch(`/api/expeditions/${editId}`)
      .then((r) => r.json())
      .then((data) => {
        const e = data.result;
        if (!e) return;
        setForm({
          title: e.title || "",
          expeditionNumber: e.expeditionNumber || "",
          year: String(e.year || ""),
          region: e.region || "antarctic",
          location: e.location || "",
          objectives: e.objectives || "",
          description: e.description || "",
          organizations: (e.organizations || []).join(", "),
          scientists: (e.scientists || []).join(", "),
          reportUrl: e.reportUrl || "",
          coverImageUrl: e.coverImageUrl || "",
        });
        setStatusNote(e.status);
      });
  }, [editId]);

  async function save(submitForReview: boolean) {
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        organizations: form.organizations.split(",").map((s) => s.trim()).filter(Boolean),
        scientists: form.scientists.split(",").map((s) => s.trim()).filter(Boolean),
        status: submitForReview ? "submitted" : "draft",
      };
      const res = await fetch(editId ? `/api/expeditions/${editId}` : "/api/expeditions", {
        method: editId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save expedition");
      router.push("/dashboard?tab=expeditions");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save expedition");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-slate-900">{editId ? "Edit Expedition" : "New Expedition"}</h1>
      {statusNote && <p className="mt-1 text-sm text-slate-500">Current status: {statusNote}</p>}
      {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="mt-6 space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <Field label="Title *">
          <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Expedition Number">
            <input className="input" value={form.expeditionNumber} onChange={(e) => setForm({ ...form, expeditionNumber: e.target.value })} />
          </Field>
          <Field label="Year *">
            <input type="number" className="input" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Region">
            <select className="input" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })}>
              {REGIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </Field>
          <Field label="Location">
            <input className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </Field>
        </div>
        <Field label="Objectives">
          <textarea className="input h-24" value={form.objectives} onChange={(e) => setForm({ ...form, objectives: e.target.value })} />
        </Field>
        <Field label="Description / Overview">
          <textarea className="input h-32" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </Field>
        <Field label="Participating organizations (comma separated)">
          <input className="input" value={form.organizations} onChange={(e) => setForm({ ...form, organizations: e.target.value })} />
        </Field>
        <Field label="Participating scientists (comma separated)">
          <input className="input" value={form.scientists} onChange={(e) => setForm({ ...form, scientists: e.target.value })} />
        </Field>
        <FileUploader label="Expedition Report (PDF)" accept=".pdf" value={form.reportUrl} onChange={(url) => setForm({ ...form, reportUrl: url })} />
        <FileUploader label="Cover Image" accept="image/*" value={form.coverImageUrl} onChange={(url) => setForm({ ...form, coverImageUrl: url })} />

        <div className="flex flex-wrap gap-3 pt-2">
          <button disabled={saving} onClick={() => save(false)} className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100">
            Save Draft
          </button>
          <button disabled={saving} onClick={() => save(true)} className="rounded-full bg-cyan-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-cyan-800">
            Submit for Review
          </button>
        </div>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}

export default function ExpeditionForm() {
  return (
    <RequireAuth roles={["researcher", "content_manager", "admin"]}>
      <Suspense fallback={null}>
        <ExpeditionFormInner />
      </Suspense>
    </RequireAuth>
  );
}
