import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * basePath 아래에서 서비스할 때 API 호출과 정적 자산 링크에 접두사를 붙인다.
 * Next.js의 basePath는 라우팅만 처리하고 fetch 경로는 바꿔주지 않는다.
 */
export function withBasePath(path: string) {
  return `${process.env.NEXT_PUBLIC_BASE_PATH || ""}${path}`;
}
