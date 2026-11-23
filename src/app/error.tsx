"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorBoundary({ error, reset }: { error: Error & { digest?: string }; reset: () => void }): React.JSX.Element {
  useEffect(() => {
    console.error("OneAtlas page error:", error);
  }, [error]);

  return <div role="alert" className="mx-auto max-w-xl rounded-xl border border-red-200 bg-white p-8 text-center dark:border-red-900 dark:bg-[#191a17]">
    <h2 className="text-lg font-semibold">This page could not be loaded</h2>
    <p className="mt-2 text-sm text-muted">Try again, or return to the model directory.</p>
    <div className="mt-5 flex justify-center gap-3"><button onClick={reset} className="rounded-lg bg-ink px-3 py-2 text-sm text-white dark:bg-white dark:text-ink">Try again</button><Link href="/models" className="rounded-lg border border-line px-3 py-2 text-sm dark:border-[#393a35]">Browse models</Link></div>
  </div>;
}
