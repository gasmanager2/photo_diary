import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

// app/layout.tsx의 metadata 예시
export const metadata: Metadata = {
  title: "나의 소중한 추억 다이어리",
  description: "소중한 사진과 추억을 기록하는 공간",
  // 🔽 아래 verification 영역을 추가하고 복사한 키값을 넣어주세요! 🔽
  verification: {
    google: "rn8fNATZteN22_wYEqbpY0B4DCZEgfavUI4YO5Q9OxQ",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2476231295737523"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}