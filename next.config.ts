import type { NextConfig } from "next";

// 1.5는 wizard.irumai.kr/redesign/15 경로에서 서비스한다.
// 1.0은 별도 Vercel 프로젝트(hanirum-redesign-wizard)에 그대로 남아 있다.
const basePath = "/redesign/15";

const nextConfig: NextConfig = {
  basePath,
  // basePath는 클라이언트 fetch 경로를 자동으로 바꿔주지 않아서 값을 직접 넘긴다.
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  async redirects() {
    return [
      // 서브도메인 루트로 들어오면 마법사로 보낸다. basePath 밖 경로라 basePath: false가 필요하다.
      { source: "/", destination: basePath, basePath: false, permanent: false }
    ];
  }
};

export default nextConfig;
