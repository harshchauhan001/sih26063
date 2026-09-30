"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Expedition {
  id: string;
  title?: string;
  name?: string;
  description?: string;
  status?: string;
  createdAt?: string;
  startDate?: string;
  endDate?: string;
}

export default function ExpeditionsListPage() {
  const [expeditions, setExpeditions] = useState<Expedition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/expeditions")
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to fetch expeditions");
        return res.json();
      })
      .then((data) => {
        // handle both { expeditions: [...] } and [...] shapes
        const list = Array.isArray(data) ? data : data.expeditions ?? [];
        setExpeditions(list);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen p-6 md:p-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Expeditions</h1>
        <Link
          href="/dashboard/expeditions/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          + New Expedition
        </Link>
      </div>

      {loading && <p className="text-gray-400">Loading expeditions...</p>}

      {error && (
        <p className="text-red-500 bg-red-50 p-3 rounded-lg">
          Error: {error}
        </p>
      )}

      {!loading && !error && expeditions.length === 0 && (
        <p className="text-gray-500">
          No expeditions found. Click "New Expedition" to create one.
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {expeditions.map((exp) => (
          <Link
            key={exp.id}
            href={`/expeditions/${exp.id}`}
            className="block p-5 border rounded-xl shadow-sm hover:shadow-md hover:border-blue-500 transition"
          >
            <h2 className="text-lg font-semibold mb-1">
              {exp.title || exp.name || "Untitled Expedition"}
            </h2>
            {exp.description && (
              <p className="text-sm text-gray-500 line-clamp-2 mb-2">
                {exp.description}
              </p>
            )}
            <div className="flex justify-between text-xs text-gray-400">
              {exp.status && <span>{exp.status}</span>}
              {exp.startDate && (
                <span>{new Date(exp.startDate).toLocaleDateString()}</span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}