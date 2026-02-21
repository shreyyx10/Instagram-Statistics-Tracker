"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

type Props = {
  title: string;
  usernames: string[];
  storageKey: string;
  csvFileName: string;
};

function loadHidden(key: string) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? new Set<string>(JSON.parse(raw)) : new Set<string>();
  } catch {
    return new Set<string>();
  }
}

function saveHidden(key: string, hiddenSet: Set<string>) {
  localStorage.setItem(key, JSON.stringify(Array.from(hiddenSet)));
}

function downloadCSV(filename: string, rows: string[]) {
  const header = "username\n";
  const body = rows.map((u) => `"${u.replaceAll('"', '""')}"`).join("\n");
  const csv = header + body + "\n";

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
}

function looksDeleted(username: string) {
  const u = username.toLowerCase();
  return (
    u.startsWith("deleted_") ||
    u.startsWith("_deleted_") ||
    u.includes("instagramuser") ||
    u.includes("instagram_user") ||
    u.includes("deleted")
  );
}

export default function UserList({ title, usernames, storageKey, csvFileName }: Props) {
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [hideDeleted, setHideDeleted] = useState(true);

  useEffect(() => {
    setHidden(loadHidden(storageKey));
  }, [storageKey]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return usernames
      .filter((u) => !hidden.has(u))
      .filter((u) => (hideDeleted ? !looksDeleted(u) : true))
      .filter((u) => (q ? u.toLowerCase().includes(q) : true));
  }, [usernames, hidden, query, hideDeleted]);

  const hideUser = (u: string) => {
    const next = new Set(hidden);
    next.add(u);
    setHidden(next);
    saveHidden(storageKey, next);
  };

  const resetHidden = () => {
    const next = new Set<string>();
    setHidden(next);
    saveHidden(storageKey, next);
  };

  const copyUser = async (u: string) => {
    try {
      await navigator.clipboard.writeText(u);
      setCopied(u);
      setTimeout(() => setCopied(null), 900);
    } catch {}
  };

  return (
    <section className="mt-7">
      {/* Title row */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">
            {title}{" "}
            <span className="ml-2 rounded-full bg-zinc-800/80 px-2 py-0.5 text-xs text-zinc-200">
              {visible.length}
            </span>
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            Click to open Instagram. Hide affects only your device.
          </p>
        </div>

        <div className="text-xs text-zinc-500">
          Showing <span className="text-zinc-200">{visible.length}</span> of{" "}
          <span className="text-zinc-200">{usernames.length}</span>
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {copied && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            className="fixed bottom-6 right-6 z-50 rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-200 shadow-lg"
          >
            Copied <span className="text-accent">@{copied}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Container */}
      <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950">
        {/* Sticky header */}
        <div className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/85 backdrop-blur px-3 py-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 items-center gap-3">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search username…"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-accent"
              />

              <label className="flex items-center gap-2 text-xs text-zinc-300 shrink-0 select-none">
                <input
                  type="checkbox"
                  checked={hideDeleted}
                  onChange={(e) => setHideDeleted(e.target.checked)}
                  className="accent-[hsl(var(--accent))]"
                />
                Hide deleted
              </label>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => downloadCSV(csvFileName, visible)}
                className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 transition hover:border-accent hover:ring-2 hover:ring-accent"
              >
                Download CSV
              </button>
              <button
                onClick={resetHidden}
                className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 transition hover:bg-zinc-900"
              >
                Reset hidden
              </button>
            </div>
          </div>
        </div>

        {/* List */}
        {visible.length === 0 ? (
          <div className="p-4 text-sm text-zinc-400">
            Nothing to show. Clear search, untick “Hide deleted”, or reset hidden.
          </div>
        ) : (
          <div className="max-h-[560px] overflow-y-auto divide-y divide-zinc-900">
            {visible.map((u) => (
              <motion.div
                key={u}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.12 }}
                className="px-3"
              >
                <div className="flex items-center justify-between gap-3 py-3">
                  <a
                    href={`https://www.instagram.com/${encodeURIComponent(u)}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate text-sm text-zinc-100 hover:text-accent hover:underline"
                    title={u}
                  >
                    @{u}
                  </a>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      onClick={() => copyUser(u)}
                      className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-2.5 py-1.5 text-xs text-zinc-200 transition hover:bg-zinc-900"
                    >
                      Copy
                    </button>
                    <button
                      onClick={() => hideUser(u)}
                      className="rounded-lg border border-zinc-800 bg-zinc-900/40 px-2.5 py-1.5 text-xs text-zinc-200 transition hover:bg-zinc-900"
                    >
                      Hide
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
