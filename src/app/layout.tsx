import type { Metadata } from "next";
import { M_PLUS_1p } from "next/font/google";
import "./globals.css";
import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
config.autoAddCss = false;

const mPlus = M_PLUS_1p({
  subsets: ["latin"],
  weight: ["100", "300", "400", "500", "700", "800", "900"],
  preload: false, 
});

export const metadata = {
  title: "薬局待ち人数表示",
  description: "簡易薬局待ち人数表示アプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={mPlus.className}>
        {children}
      </body>
    </html>
  );
}