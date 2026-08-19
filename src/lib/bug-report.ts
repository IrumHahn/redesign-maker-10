/**
 * 문의하기(버그신고) 공용 타입.
 *
 * 접수 저장과 어드민은 PDP Maker 3.0과 함께 쓴다. 1.5는 접수만 만들어 넘기고
 * `source`로 어느 제품에서 들어온 신고인지 구분한다.
 */

export const BUG_REPORT_SOURCE = "redesign-wizard-15";

export type BugReportCategory = "bug" | "generation" | "editor" | "account" | "other";

export const BUG_REPORT_CATEGORIES: Array<{
  value: BugReportCategory;
  label: string;
  description: string;
}> = [
  { value: "bug", label: "오류", description: "화면, 버튼, 저장 문제" },
  { value: "generation", label: "생성", description: "이미지 생성 실패나 결과 문제" },
  { value: "editor", label: "수정", description: "섹션 수정, 다운로드 문제" },
  { value: "account", label: "키/비용", description: "API 키나 과금 관련 문제" },
  { value: "other", label: "기타", description: "분류하기 어려운 문제" }
];

export type BugReportContext = {
  surface?: string;
  route?: string;
  pageTitle?: string;
  appState?: string;
  aiProvider?: string;
  redesignMode?: string;
  channel?: string;
  ratio?: string;
  sectionCount?: number;
  errorMessage?: string;
  [key: string]: unknown;
};

export const BUG_REPORT_TITLE_MAX = 120;
export const BUG_REPORT_DESCRIPTION_MAX = 2400;
export const BUG_REPORT_EMAIL_MAX = 180;

export function isValidReporterEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
