import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "한이룸의 상세페이지 리디자인 마법사 1.5",
  description: "기존 상세페이지 이미지와 PDF를 분석해 구매전환 중심 상세페이지 이미지로 리디자인합니다."
  // icons는 선언하지 않는다. src/app/icon.svg와 apple-icon.svg 파일 규칙을 Next가 자동으로 잡아주고,
  // 그래야 basePath('/redesign/15')가 붙은 주소로 링크된다. 수동 선언은 basePath를 무시한다.
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
