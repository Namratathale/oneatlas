import type { Metadata } from "next";
import { AppProvider } from "@/components/app-provider";
import { SiteShell } from "@/components/site-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "OneAtlas — AI models, compared",
  description: "Explore AI models, compare pricing and benchmarks, and find the right inference provider."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>): React.JSX.Element {
  return <html lang="en" suppressHydrationWarning><body><AppProvider><SiteShell>{children}</SiteShell></AppProvider></body></html>;
}
