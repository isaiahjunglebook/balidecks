import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BaliDecks — Private DJ Rental",
  description: "Private booking portal for premium DJ equipment rental in Bali.",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
