import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "한이룸의 상세페이지 리디자인 마법사 1.5",
  description: "기존 상세페이지 이미지와 PDF를 분석해 구매전환 중심 상세페이지 이미지로 리디자인합니다.",
  icons: {
    icon: "/icon.svg",
    apple: "/apple-icon.svg"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
