"use client";

import * as React from "react";
import { AlertCircle, CheckCircle2, Loader2, MessageCircle, Send, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  BUG_REPORT_CATEGORIES,
  BUG_REPORT_DESCRIPTION_MAX,
  BUG_REPORT_EMAIL_MAX,
  BUG_REPORT_TITLE_MAX,
  isValidReporterEmail,
  type BugReportCategory,
  type BugReportContext
} from "@/lib/bug-report";
import { cn, withBasePath } from "@/lib/utils";

const REPORTER_EMAIL_STORAGE_KEY = "hanirum-redesign-wizard-contact-email";

export function ContactWidget({ context }: { context: BugReportContext }) {
  const [open, setOpen] = React.useState(false);
  const [category, setCategory] = React.useState<BugReportCategory>("bug");
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [reporterEmail, setReporterEmail] = React.useState("");
  const [attachContext, setAttachContext] = React.useState(true);
  const [honeypot, setHoneypot] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [status, setStatus] = React.useState<{ kind: "idle" | "success" | "error"; message: string; id?: string }>({
    kind: "idle",
    message: ""
  });

  React.useEffect(() => {
    try {
      setReporterEmail(localStorage.getItem(REPORTER_EMAIL_STORAGE_KEY) || "");
    } catch {
      setReporterEmail("");
    }
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedDescription = description.trim();
    if (trimmedDescription.length < 5) {
      setStatus({ kind: "error", message: "문제가 난 상황을 조금 더 적어주세요." });
      return;
    }

    const trimmedEmail = reporterEmail.trim();
    if (!isValidReporterEmail(trimmedEmail)) {
      setStatus({ kind: "error", message: "처리 결과를 받을 이메일을 입력해 주세요." });
      return;
    }

    setSubmitting(true);
    setStatus({ kind: "idle", message: "" });

    try {
      const response = await fetch(withBasePath("/api/bug-report"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          title,
          description: trimmedDescription,
          reporterEmail: trimmedEmail,
          context: attachContext ? buildContext(context) : { surface: context.surface },
          website: honeypot
        })
      });
      const payload = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        id?: string;
        message?: string;
      };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.message || "신고를 접수하지 못했습니다.");
      }

      try {
        localStorage.setItem(REPORTER_EMAIL_STORAGE_KEY, trimmedEmail);
      } catch {
        // 이메일 기억은 실패해도 접수에는 영향이 없다.
      }

      setStatus({
        kind: "success",
        message: "접수되었습니다. 처리 결과는 입력한 이메일로 안내드릴게요.",
        id: payload.id
      });
      setTitle("");
      setDescription("");
    } catch (error) {
      setStatus({
        kind: "error",
        message: error instanceof Error ? error.message : "신고를 접수하지 못했습니다."
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed bottom-4 left-4 z-40 flex flex-col items-start gap-3 max-md:bottom-3 max-md:left-3">
      {open && (
        <section
          aria-label="문의하기"
          role="dialog"
          className="w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-3xl bg-white shadow-[0_24px_60px_-24px_rgba(23,26,31,0.35)]"
        >
          <header className="flex items-start justify-between gap-3 px-5 pb-3 pt-5">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-2xl bg-[#edf2ec] text-emerald-700">
                <MessageCircle className="size-4" />
              </span>
              <div>
                <h2 className="text-sm font-bold leading-tight">문의하기</h2>
                <p className="text-xs text-muted-foreground">막힌 지점을 남겨주세요.</p>
              </div>
            </div>
            <button
              type="button"
              aria-label="문의 패널 닫기"
              className="grid size-7 place-items-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground"
              onClick={() => setOpen(false)}
            >
              <X className="size-4" />
            </button>
          </header>

          <form className="grid max-h-[70vh] gap-3 overflow-y-auto px-5 pb-5" onSubmit={handleSubmit}>
            <input
              aria-hidden="true"
              autoComplete="off"
              className="absolute left-[-9999px] size-0 opacity-0"
              onChange={(event) => setHoneypot(event.target.value)}
              tabIndex={-1}
              type="text"
              value={honeypot}
            />

            <div className="grid grid-cols-2 gap-2" role="group" aria-label="문의 유형">
              {BUG_REPORT_CATEGORIES.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  aria-pressed={category === item.value}
                  onClick={() => setCategory(item.value)}
                  className={cn(
                    "rounded-2xl px-3 py-2 text-left transition",
                    category === item.value ? "bg-[#34d399] text-foreground" : "bg-muted/60 hover:bg-muted"
                  )}
                >
                  <strong className="block text-xs font-bold">{item.label}</strong>
                  <span
                    className={cn(
                      "block text-[11px] leading-tight",
                      category === item.value ? "text-foreground/70" : "text-muted-foreground"
                    )}
                  >
                    {item.description}
                  </span>
                </button>
              ))}
            </div>

            <label className="grid gap-1.5">
              <span className="text-xs font-bold text-muted-foreground">제목</span>
              <Input
                maxLength={BUG_REPORT_TITLE_MAX}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="예: 다운로드 버튼이 반응하지 않음"
                type="text"
                value={title}
              />
            </label>

            <label className="grid gap-1.5">
              <span className="text-xs font-bold text-muted-foreground">내용</span>
              <Textarea
                maxLength={BUG_REPORT_DESCRIPTION_MAX}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="어떤 화면에서, 무엇을 눌렀을 때, 어떤 결과가 나왔는지 적어주세요."
                required
                rows={5}
                value={description}
              />
            </label>

            <label className="grid gap-1.5">
              <span className="text-xs font-bold text-muted-foreground">답변 받을 이메일</span>
              <Input
                autoComplete="email"
                maxLength={BUG_REPORT_EMAIL_MAX}
                onChange={(event) => setReporterEmail(event.target.value)}
                placeholder="you@example.com"
                required
                type="email"
                value={reporterEmail}
              />
            </label>

            <label className="flex cursor-pointer items-center gap-2 rounded-2xl bg-muted/60 px-4 py-3 text-xs text-muted-foreground">
              <input
                checked={attachContext}
                onChange={(event) => setAttachContext(event.target.checked)}
                type="checkbox"
                className="size-4 accent-[#34d399]"
              />
              <ShieldCheck className="size-3.5" />
              현재 화면 맥락 함께 보내기
            </label>

            {status.kind !== "idle" && (
              <div
                className={cn(
                  "flex items-start gap-2 rounded-2xl px-4 py-3 text-xs leading-relaxed",
                  status.kind === "success" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"
                )}
              >
                {status.kind === "success" ? (
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                ) : (
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                )}
                <span>
                  {status.message}
                  {status.id ? <strong className="ml-1">#{status.id}</strong> : null}
                </span>
              </div>
            )}

            <Button disabled={submitting} type="submit">
              {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              문의 보내기
            </Button>
            <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
              업로드한 원본 이미지와 API 키는 저장되지 않습니다.
            </p>
          </form>
        </section>
      )}

      <button
        type="button"
        aria-expanded={open}
        aria-label={open ? "문의하기 닫기" : "문의하기 열기"}
        title={open ? "문의하기 닫기" : "문의하기"}
        onClick={() => {
          setOpen((prev) => !prev);
          setStatus({ kind: "idle", message: "" });
        }}
        className="flex h-11 items-center gap-2 rounded-full bg-foreground px-4 text-sm font-semibold text-background shadow-lg transition hover:bg-foreground/90"
      >
        {open ? <X className="size-4" /> : <MessageCircle className="size-4" />}
        <span className="max-md:sr-only">{open ? "닫기" : "문의하기"}</span>
      </button>
    </div>
  );
}

function buildContext(context: BugReportContext): BugReportContext {
  if (typeof window === "undefined") return context;

  return {
    ...context,
    route: buildCurrentRoute(),
    pageTitle: document.title,
    viewport: `${window.innerWidth}x${window.innerHeight}`
  };
}

/** 주소에 키가 붙어 있어도 접수 내용에는 남기지 않는다. */
function buildCurrentRoute() {
  try {
    const url = new URL(window.location.href);
    ["token", "apiKey", "openaiKey", "googleKey"].forEach((key) => url.searchParams.delete(key));
    const query = url.searchParams.toString();
    return `${url.pathname}${query ? `?${query}` : ""}`;
  } catch {
    return window.location.pathname;
  }
}
