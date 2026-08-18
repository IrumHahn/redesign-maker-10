import { cn } from "@/lib/utils";

type Props = { className?: string; mono?: boolean };

/** 마법사 시리즈 마스터 마크: 에메랄드 사각형 + 차콜 W. 색·글자 변경 금지. */
export function BrandMark({ className, mono = false }: Props) {
  return (
    <svg viewBox="0 0 64 64" role="img" aria-label="한이룸 마법사 시리즈" className={cn("size-9 shrink-0", className)}>
      <rect width="64" height="64" rx="14" fill={mono ? "#171a1f" : "#34d399"} />
      <path
        d="M17 21l7 24 8-17 8 17 7-24"
        fill="none"
        stroke={mono ? "#f7f8f5" : "#171a1f"}
        strokeWidth="8"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
