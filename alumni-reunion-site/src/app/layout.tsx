import type { Metadata, Viewport } from "next";
import "./globals.css";

// 限定URL運用のため、検索エンジンには載せない
export const metadata: Metadata = {
  title: "同窓会のご案内",
  description: "同窓会の開催情報と出欠のご回答ページです。",
  robots: { index: false, follow: false, nocache: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1e3a5f",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
