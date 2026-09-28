import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-950 text-slate-300">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-4 lg:px-8">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-800 text-base font-bold text-white">
              ❄
            </span>
            <span className="text-sm font-bold text-white">Polar Science Portal</span>
          </div>
          <p className="mt-3 text-sm text-slate-400">
            An integrated outreach, knowledge repository and media dissemination portal for Indian
            polar science, built for NCPOR, Ministry of Earth Sciences.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Explore</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/expeditions" className="hover:text-white">Expeditions</Link></li>
            <li><Link href="/research" className="hover:text-white">Publications</Link></li>
            <li><Link href="/datasets" className="hover:text-white">Datasets</Link></li>
            <li><Link href="/media" className="hover:text-white">Media Gallery</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Learn</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/education" className="hover:text-white">Articles &amp; Modules</Link></li>
            <li><Link href="/education?type=glossary" className="hover:text-white">Glossary</Link></li>
            <li><Link href="/education?type=quiz" className="hover:text-white">Quizzes</Link></li>
            <li><Link href="/search" className="hover:text-white">Global Search</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Account</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/login" className="hover:text-white">Researcher Login</Link></li>
            <li><Link href="/register" className="hover:text-white">Create Account</Link></li>
            <li><Link href="/dashboard/ai" className="hover:text-white">AI Content Generator</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-800 py-4 text-center text-xs text-slate-500">
        SIH 2025 · Problem Statement 26063 · Store once, organize well, discover easily, explain
        clearly, and publish responsibly.
      </div>
    </footer>
  );
}
