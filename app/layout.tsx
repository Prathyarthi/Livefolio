import type { Metadata } from "next";
import { JetBrains_Mono, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/query-provider";
import { GlobalFooter } from "@/components/global-footer";
import { rootMetadata } from "@/lib/seo";
import { Analytics } from "@vercel/analytics/next"

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["500", "700"],
});

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = rootMetadata;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${sourceSans.variable} ${jetbrainsMono.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <Analytics />
        <Providers>
          <div className="flex min-h-screen flex-col">
            <div className="flex flex-1 flex-col">{children}</div>
            <GlobalFooter />
          </div>
        </Providers>
      </body>
    </html>
  );
}
