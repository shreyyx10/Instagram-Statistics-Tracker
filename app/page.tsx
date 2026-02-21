"use client";

import { useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { analyzeInstagramZip } from "../lib/instagramZipParser";
import UserList from "../components/UserList";

type TabKey = "not_following_back" | "you_dont_follow_back" | "mutuals";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function Home() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<TabKey>("not_following_back");
  const [fileName, setFileName] = useState<string>("");

  async function handleFile(file: File | undefined) {
    setError("");
    setData(null);
    if (!file) return;

    setFileName(file.name);
    setLoading(true);
    try {
      const result = await analyzeInstagramZip(file);
      setData(result);
    } catch (err: any) {
      setError(err.message || "Failed to analyze ZIP");
    } finally {
      setLoading(false);
    }
  }

  const onDrop = async (accepted: File[]) => {
    await handleFile(accepted?.[0]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: { "application/zip": [".zip"] },
  });

  const tabs = useMemo(() => {
    return [
      { key: "not_following_back" as const, label: "Not following back", count: data?.counts?.not_following_back },
      { key: "you_dont_follow_back" as const, label: "You don’t follow back", count: data?.counts?.you_dont_follow_back },
      { key: "mutuals" as const, label: "Mutuals", count: data?.counts?.mutuals },
    ];
  }, [data]);

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 relative overflow-hidden">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[hsl(var(--accent)/0.18)] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 right-[-100px] h-[520px] w-[520px] rounded-full bg-purple-500/10 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="mx-auto max-w-4xl px-5 py-10"
      >
        <header className="mb-7">
          <h1 className="text-3xl font-semibold tracking-tight">Instagram Unfollower Tracker</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Privacy-first: processed locally in your browser. Nothing is uploaded or stored.
          </p>
        </header>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="w-full">
              <div className="text-sm text-zinc-300 mb-2">Upload Instagram ZIP</div>

              <div
                {...getRootProps()}
                className={cx(
                  "rounded-2xl border bg-zinc-950/60 p-4 transition cursor-pointer",
                  "border-zinc-800 hover:border-zinc-700 hover:bg-zinc-950",
                  "focus-within:ring-2 focus-within:ring-accent",
                  isDragActive && "border-accent ring-2 ring-accent"
                )}
              >
                <input {...getInputProps()} />

                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm text-zinc-200">
                      {fileName ? (
                        <span className="truncate block">{fileName}</span>
                      ) : isDragActive ? (
                        <span className="text-accent">Drop the ZIP here…</span>
                      ) : (
                        <span>Drag & drop your Instagram ZIP here, or click to browse</span>
                      )}
                    </div>
                    <div className="mt-1 text-xs text-zinc-500">
                      Only followers/following files are read.
                    </div>
                  </div>

                  <span className="shrink-0 rounded-xl border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-xs text-zinc-200">
                    Browse
                  </span>
                </div>
              </div>
            </div>

            <div className="text-sm text-zinc-400">
              {loading ? <span className="text-accent">Parsing ZIP…</span> : data ? "Ready" : "Waiting"}
            </div>
          </div>

          {error && (
            <pre className="mt-4 whitespace-pre-wrap rounded-xl border border-red-900/40 bg-red-950/30 p-3 text-sm text-red-200">
              {error}
            </pre>
          )}

          {data && (
            <>
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
                <Stat title="Followers" value={data.counts.followers} />
                <Stat title="Following" value={data.counts.following} />
                <Stat title="Not back" value={data.counts.not_following_back} tone="accent" />
                <Stat title="You don’t" value={data.counts.you_dont_follow_back} />
                <Stat title="Mutuals" value={data.counts.mutuals} />
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {tabs.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={cx(
                      "rounded-xl border px-4 py-2 text-sm transition",
                      tab === t.key
                        ? "border-zinc-700 bg-zinc-800 text-white shadow-[0_0_0_3px_hsl(var(--accent)/0.12)]"
                        : "border-zinc-800 bg-zinc-950 text-zinc-300 hover:bg-zinc-900"
                    )}
                  >
                    {t.label}
                    {typeof t.count === "number" && (
                      <span className="ml-2 rounded-full bg-zinc-800/80 px-2 py-0.5 text-xs text-zinc-200">
                        {t.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div className="mt-2">
                <AnimatePresence mode="wait">
                  {tab === "not_following_back" && (
                    <motion.div
                      key="tab-not-back"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.18 }}
                    >
                      <UserList
                        title="Not following you back"
                        usernames={data.not_following_back}
                        storageKey="hidden_not_following_back_v1"
                        csvFileName="not_following_back.csv"
                      />
                    </motion.div>
                  )}

                  {tab === "you_dont_follow_back" && (
                    <motion.div
                      key="tab-you-dont"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.18 }}
                    >
                      <UserList
                        title="You don’t follow back"
                        usernames={data.you_dont_follow_back}
                        storageKey="hidden_you_dont_follow_back_v1"
                        csvFileName="you_dont_follow_back.csv"
                      />
                    </motion.div>
                  )}

                  {tab === "mutuals" && (
                    <motion.div
                      key="tab-mutuals"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.18 }}
                    >
                      <UserList
                        title="Mutual followers"
                        usernames={data.mutuals}
                        storageKey="hidden_mutuals_v1"
                        csvFileName="mutuals.csv"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          )}
        </div>

        <footer className="mt-6 text-xs text-zinc-500">
          Note: exports may include renamed/deactivated accounts.
        </footer>
      </motion.div>
    </main>
  );
}

function Stat({
  title,
  value,
  tone,
}: {
  title: string;
  value: number;
  tone?: "accent";
}) {
  return (
    <div
      className={cx(
        "rounded-2xl border bg-zinc-950 p-4 transition",
        "hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(0,0,0,0.35)]",
        tone === "accent" ? "border-accent" : "border-zinc-800 hover:border-zinc-700"
      )}
    >
      <div className="text-xs text-zinc-500">{title}</div>
      <div className="mt-1 text-xl font-semibold text-zinc-100">{value}</div>
    </div>
  );
}
