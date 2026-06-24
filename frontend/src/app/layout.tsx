import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VaizAI - Enterprise AI Customer Support Platform",
  description: "Next-generation customer support automation platform with RAG, vector embeddings, and real-time sentiment scoring",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
