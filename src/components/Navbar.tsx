"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import SearchBar from "@/components/SearchBar";

const NAV_LINKS = [
  { href: "/expeditions", label: "Expeditions" },
  { href: "/research", label: "Research" },
  { href: "/datasets", label: "Datasets" },
  { href: "/media", label: "Media" },
  { href: "/education", label: "Education" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 shrink-0" onClick={() => setOpen(false)}>
          <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-cyan-600 to-blue-900 text-base font-bold text-white">
            ❄
          </span>
          <span className="hidden flex-col leading-tight sm:flex">
            <span className="text-sm font-bold tracking-tight text-slate-900">Polar Science Portal</span>
            <span className="text-[11px] text-slate-500">NCPOR · Ministry of Earth Sciences</span>
          </span>
        </Link>

        <nav className="ml-2 hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-full px-3 py-2 text-sm font-medium transition ${
                pathname?.startsWith(link.href)
                  ? "bg-slate-900 text-white"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden flex-1 max-w-sm md:block">
          <SearchBar compact />
        </div>

        <div className="ml-auto hidden items-center gap-2 lg:flex">
          {loading ? null : user ? (
            <>
              <Link
                href={user.role === "researcher" ? "/dashboard" : "/admin"}
                className="rounded-full px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                {user.role === "researcher" ? "Dashboard" : "Admin"}
              </Link>
              <span className="text-sm text-slate-500">Hi, {user.name.split(" ")[0]}</span>
              <button
                onClick={() => logout()}
                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="rounded-full px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-cyan-700 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-800"
              >
                Researcher Sign Up
              </Link>
            </>
          )}
        </div>

        <button
          className="ml-auto grid h-9 w-9 place-items-center rounded-lg border border-slate-300 lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle navigation menu"
        >
          <span className="text-lg">{open ? "✕" : "☰"}</span>
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-200 px-4 pb-4 lg:hidden">
          <div className="py-3">
            <SearchBar compact onNavigate={() => setOpen(false)} />
          </div>
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                {link.label}
              </Link>
            ))}
            <div className="my-2 h-px bg-slate-200" />
            {loading ? null : user ? (
              <>
                <Link
                  href={user.role === "researcher" ? "/dashboard" : "/admin"}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  {user.role === "researcher" ? "Researcher Dashboard" : "Admin Dashboard"}
                </Link>
                <button
                  onClick={() => logout()}
                  className="rounded-lg bg-slate-900 px-3 py-2 text-left text-sm font-medium text-white"
                >
                  Logout ({user.name.split(" ")[0]})
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
                  Login
                </Link>
                <Link
                  href="/register"
                  onClick={() => setOpen(false)}
                  className="rounded-lg bg-cyan-700 px-3 py-2 text-sm font-medium text-white"
                >
                  Researcher Sign Up
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
