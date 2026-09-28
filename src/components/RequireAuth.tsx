"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";

export default function RequireAuth({
  roles,
  children,
}: {
  roles?: Array<"researcher" | "content_manager" | "admin">;
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (roles && !roles.includes(user.role)) {
      router.replace(user.role === "researcher" ? "/dashboard" : "/admin");
    }
  }, [user, loading, roles, router]);

  if (loading || !user || (roles && !roles.includes(user.role))) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-20 text-center text-slate-500">
        Loading…
      </main>
    );
  }

  return <>{children}</>;
}
