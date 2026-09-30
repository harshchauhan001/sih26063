"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface User {
  id: string;
  name?: string;
  email?: string;
  role?: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setUser(data?.user ?? data ?? null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    {
      title: "Expeditions",
      description: "View and manage all expeditions",
      href: "/dashboard/expeditions",
    },
    {
      title: "New Expedition",
      description: "Create a new expedition entry",
      href: "/dashboard/expeditions/new",
    },
    {
      title: "Datasets",
      description: "Browse uploaded datasets",
      href: "/datasets",
    },
    {
      title: "Research",
      description: "View research publications",
      href: "/research",
    },
    {
      title: "Education",
      description: "Manage education resources",
      href: "/education",
    },
    {
      title: "Media",
      description: "Manage media library",
      href: "/media",
    },
    {
  title: "Approvals",
  description: "Review and approve pending submissions",
  href: "/admin/approvals",
},
  ];

  return (
    <div className="min-h-screen p-6 md:p-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        {!loading && user && (
          <p className="text-gray-500 mt-1">
            Welcome back{user.name ? `, ${user.name}` : ""} 👋
          </p>
        )}
        {loading && <p className="text-gray-400 mt-1">Loading...</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="block p-5 border rounded-xl shadow-sm hover:shadow-md hover:border-blue-500 transition"
          >
            <h2 className="text-lg font-semibold mb-1">{card.title}</h2>
            <p className="text-sm text-gray-500">{card.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}