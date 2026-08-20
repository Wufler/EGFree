import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import Snow from "@/components/ui/Snow";
import { Toaster } from "@/components/ui/sonner";
import { getMobileGames } from "@/lib/EGData";
import { getEpicFreeGames } from "@/lib/getGames";

const inter = Inter({ subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const [games, mobileGames] = await Promise.all([
    getEpicFreeGames(),
    getMobileGames(),
  ]);

  const now = new Date();
  const activeMobileGames = mobileGames.filter(
    (g) => !g.promoEndDate || new Date(g.promoEndDate) > now,
  );

  const currentTitles = games.currentGames.map((game) => game.title).join(", ");
  const mobileTitles = activeMobileGames.map((game) => game.title).join(", ");
  const upcomingTitles = games.nextGames.map((game) => game.title).join(", ");

  const altParts = [];
  if (currentTitles) {
    altParts.push(`Desktop: ${currentTitles}`);
  }
  if (mobileTitles) {
    altParts.push(`Mobile: ${mobileTitles}`);
  }
  if (upcomingTitles) {
    altParts.push(`Upcoming: ${upcomingTitles}`);
  }

  const altText =
    altParts.length > 0
      ? `All current free games on the Epic Games Store this week.\n${altParts.join("\n")}`
      : "Epic Games Store free games this week.";

  return {
    title: "Epic Games Free Games",
    description: "All current free games on the Epic Games Store this week.",
    metadataBase: new URL("https://free.wolfey.me/"),
    openGraph: {
      title: "Epic Games Free Games",
      description: "All current free games on the Epic Games Store this week.",
      url: "https://free.wolfey.me/",
      images: [
        {
          url: `/api/og?date=${Date.now()}`,
          width: 1280,
          height: 720,
          alt: altText,
        },
      ],
      locale: "en_US",
      type: "website",
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          defaultTheme="system"
          attribute="class"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Snow />
          <Toaster position="bottom-center" />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
