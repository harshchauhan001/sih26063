"use client";

import { useEffect, useState } from "react";

type ContentType =
  | "expeditions"
  | "publications"
  | "datasets"
  | "media"
  | "education"
  | "aiJobs";

interface BaseItem {
  id: number;
  title?: string;
  sourceTitle?: string;
  status: string;
  authorName: string;
  createdAt: string;
  reviewComment?: string | null;
}

interface ApprovalsData {
  expeditions: BaseItem[];
  publications: BaseItem[];
  datasets: BaseItem[];
  media: BaseItem[];
  education: BaseItem[];
  aiJobs: BaseItem[];
}

const API_ROUTE_MAP: Record<ContentType, string> = {
  expeditions: "/api/expeditions",
  publications: "/api/publications",
  datasets: "/api/datasets",
  media: "/api/media",
  education: "/api/education",
  aiJobs: "/api/ai/jobs",
};

const TABS: { key: ContentType; label: string }[] = [
  { key: "expeditions", label: "Expeditions" },
  { key: "publications", label: "Publications" },
  { key: "datasets", label: "Datasets" },
  { key: "media", label: "Media" },
  { key: "education", label: "Education" },
  { key: "aiJobs", label: "AI Jobs" },
];

type ReviewAction = "approve" | "reject" | "request_changes";

export default function AdminApprovalsPage() {
  const [data, setData] = useState<ApprovalsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ContentType>("expeditions");
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const fetchApprovals = () => {
    setLoading(true);
    fetch("/api/admin/approvals")
      .then(async (res) => {
        if (res.status === 401) throw new Error("Not logged in");
        if (res.status === 403) throw new Error("You are not authorized to view this page");
        if (!res.ok) throw new Error("Failed to load approvals");
        return res.json();
      })
      .then((json) => setData(json))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const handleAction = async (
    type: ContentType,
    id: number,
    reviewAction: ReviewAction
  ) => {
    let reviewComment: string | undefined;

    if (reviewAction === "reject" || reviewAction === "request_changes") {
      const reason = window.prompt(
        `Enter a reason for ${
          reviewAction === "reject" ? "rejecting" : "requesting changes on"
        } this item:`
      );
      if (reason === null) return;
      reviewComment = reason;
    }

    setActionLoadingId(id);
    try {
      const res = await fetch(`${API_ROUTE_MAP[type]}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewAction, reviewComment }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Action failed");
      }

      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          [type]: prev[type].filter((item) => item.id !== id),
        };
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setActionLoadingId(null);
    }
  };

  if (loading) {
    return <div className="p-10 text-gray-400">Loading approvals...</div>;
  }

  if (error) {
    return (
      <div className="p-10">
        <p className="text-red-500 bg-red-50 p-4 rounded-lg">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const activeItems = data[activeTab] || [];

  return (
    <div className="min-h-screen p-6 md:p-10">
      <h1 className="text-3xl font-bold mb-6">Admin Approvals</h1>

      <div className="flex flex-wrap gap-2 mb-6 border-b">
        {TABS.map((tab) => {
          const count = data[tab.key]?.length || 0;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                activeTab === tab.key
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label} {count > 0 && `(${count})`}
            </button>
          );
        })}
      </div>

      {activeItems.length === 0 ? (
        <p className="text-gray-500">No pending items in this category 🎉</p>
      ) : (
        <div className="space-y-4">
          {activeItems.map((item) => (
            <div
              key={item.id}
              className="border rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4"
            >
              <div>
                <h2 className="text-lg font-semibold">
                  {item.title || item.sourceTitle || "Untitled"}
                </h2>
                <p className="text-sm text-gray-500">
                  Submitted by <span className="font-medium">{item.authorName}</span> on{" "}
                  {new Date(item.createdAt).toLocaleDateString()}
                </p>
                <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                  {item.status}
                </span>
              </div>

              <div className="flex gap-2 shrink-0">
                <button
                  disabled={actionLoadingId === item.id}
                  onClick={() => handleAction(activeTab, item.id, "approve")}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
                >
                  Approve
                </button>
                <button
                  disabled={actionLoadingId === item.id}
                  onClick={() => handleAction(activeTab, item.id, "request_changes")}
                  className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 transition"
                >
                  Request Changes
                </button>
                <button
                  disabled={actionLoadingId === item.id}
                  onClick={() => handleAction(activeTab, item.id, "reject")}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}