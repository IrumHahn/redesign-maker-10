"use client";

// 1.5 카피 방식 파일럿 비교 페이지 (임시).
// 같은 원본으로 히어로 1장을 ① 통이미지(AI가 카피까지 렌더링) ② 텍스트 없는 배경 + Canvas 카피 합성
// 두 방식으로 생성해 나란히 비교한다. 메인 UI에는 노출하지 않으며 방식 결정 후 제거한다.

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { renderHeroOverlay, type HeroCopy } from "@/lib/overlay-renderer";
import { normalizeFilesForUpload } from "@/components/redesign-wizard";

type Model = "openai" | "google";

const defaultCopy: HeroCopy = {
  headline: "카피가 아직 없습니다",
  subheadline: "생성 후 분석 결과의 히어로 카피가 여기에 채워집니다",
  cta: "지금 확인하기"
};

export default function PilotPage() {
  const [files, setFiles] = React.useState<File[]>([]);
  const [model, setModel] = React.useState<Model>("openai");
  const [request, setRequest] = React.useState(
    "첫 화면에서 제품의 차별점이 바로 보이게 하고, 구매 불안을 줄이는 근거 섹션을 강화해주세요."
  );
  const [openaiKey, setOpenaiKey] = React.useState("");
  const [googleKey, setGoogleKey] = React.useState("");
  const [phase, setPhase] = React.useState("");
  const [error, setError] = React.useState("");
  const [bakedImage, setBakedImage] = React.useState("");
  const [textlessImage, setTextlessImage] = React.useState("");
  const [composedImage, setComposedImage] = React.useState("");
  const [copy, setCopy] = React.useState<HeroCopy>(defaultCopy);
  const running = phase !== "";

  React.useEffect(() => {
    setOpenaiKey(localStorage.getItem("hanirum-openai-key") || "");
    setGoogleKey(localStorage.getItem("hanirum-google-key") || "");
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css";
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  React.useEffect(() => {
    if (!textlessImage) return;
    let cancelled = false;
    renderHeroOverlay(textlessImage, copy)
      .then((result) => {
        if (!cancelled) setComposedImage(result);
      })
      .catch((composeError) => {
        if (!cancelled) setError(composeError instanceof Error ? composeError.message : "카피 합성에 실패했습니다.");
      });
    return () => {
      cancelled = true;
    };
  }, [textlessImage, copy]);

  async function generateVariant(copyMode: "baked" | "textless", normalizedFiles: File[]) {
    const form = new FormData();
    for (const file of normalizedFiles) form.append("files", file);
    form.append("request", request);
    form.append("model", model);
    form.append("count", "1");
    form.append("startSection", "1");
    form.append("copyMode", copyMode);
    form.append("openaiKey", openaiKey);
    form.append("googleKey", googleKey);

    const response = await fetch("/api/generate", { method: "POST", body: form });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.error || `생성 실패 (HTTP ${response.status})`);
    const section = data?.project?.sections?.[0];
    if (!section?.imageUrl) throw new Error("응답에 생성 이미지가 없습니다.");
    return { imageUrl: section.imageUrl as string, analysis: data?.project?.analysis };
  }

  async function runComparison() {
    if (files.length === 0) {
      setError("기존 상세페이지 이미지 또는 PDF를 업로드해주세요.");
      return;
    }
    const key = model === "google" ? googleKey : openaiKey;
    if (!key) {
      setError(model === "google" ? "Google API 키를 입력해주세요." : "OpenAI API 키를 입력해주세요.");
      return;
    }

    setError("");
    setBakedImage("");
    setTextlessImage("");
    setComposedImage("");
    try {
      setPhase("원본을 이미지 생성용 PNG로 변환중");
      const normalizedFiles = await normalizeFilesForUpload(files);
      if (normalizedFiles.length === 0) throw new Error("업로드 파일을 참조 이미지로 변환하지 못했습니다.");

      setPhase("① 통이미지 히어로 생성중 (1/2)");
      const baked = await generateVariant("baked", normalizedFiles);
      setBakedImage(baked.imageUrl);

      setPhase("② 텍스트리스 배경 생성중 (2/2)");
      const textless = await generateVariant("textless", normalizedFiles);
      const heroCopy = (textless.analysis as { sections?: Array<Partial<HeroCopy>> } | undefined)?.sections?.[0];
      if (heroCopy?.headline) {
        setCopy({
          headline: heroCopy.headline,
          subheadline: heroCopy.subheadline || "",
          bullets: heroCopy.bullets,
          cta: heroCopy.cta || ""
        });
      }
      setTextlessImage(textless.imageUrl);
      setPhase("");
    } catch (runError) {
      setPhase("");
      setError(runError instanceof Error ? runError.message : "비교 생성 중 오류가 발생했습니다.");
    }
  }

  function download(url: string, name: string) {
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.click();
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-6 py-10">
      <div>
        <h1 className="text-xl font-semibold">1.5 카피 방식 파일럿 비교</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          같은 원본으로 히어로 1장을 통이미지 방식과 텍스트리스+카피 합성 방식으로 각각 생성해 비교합니다. 총 2장이 순차 생성됩니다.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">생성 조건</CardTitle>
          <CardDescription>원본 이미지(최대 4장)와 API 키는 브라우저에서만 사용됩니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            type="file"
            accept="image/*,.pdf"
            multiple
            onChange={(event) => setFiles(Array.from(event.target.files || []).slice(0, 4))}
          />
          <Textarea value={request} onChange={(event) => setRequest(event.target.value)} rows={2} />
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant={model === "openai" ? "default" : "secondary"}
              size="sm"
              onClick={() => setModel("openai")}
            >
              OpenAI Image 2.0
            </Button>
            <Button
              type="button"
              variant={model === "google" ? "default" : "secondary"}
              size="sm"
              onClick={() => setModel("google")}
            >
              Google Nano Banana 2
            </Button>
          </div>
          {model === "openai" ? (
            <Input
              type="password"
              placeholder="OpenAI API 키"
              value={openaiKey}
              onChange={(event) => setOpenaiKey(event.target.value)}
            />
          ) : (
            <Input
              type="password"
              placeholder="Google API 키"
              value={googleKey}
              onChange={(event) => setGoogleKey(event.target.value)}
            />
          )}
          <Button type="button" onClick={runComparison} disabled={running}>
            {running ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                {phase}
              </>
            ) : (
              "비교 생성 시작 (2장 순차 생성)"
            )}
          </Button>
          {error && (
            <p className="whitespace-pre-wrap rounded-md border border-destructive/30 bg-white px-3 py-2 text-sm" role="alert">
              {error}
            </p>
          )}
        </CardContent>
      </Card>

      {(bakedImage || composedImage) && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">① 통이미지 (현재 1.0 방식)</CardTitle>
              <CardDescription>AI가 카피 텍스트까지 이미지에 직접 렌더링</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {bakedImage ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={bakedImage} alt="통이미지 히어로" className="w-full rounded-md border" />
                  <Button type="button" variant="secondary" size="sm" onClick={() => download(bakedImage, "pilot_통이미지_히어로.png")}>
                    다운로드
                  </Button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">{running ? "생성중..." : "아직 생성되지 않았습니다."}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">② 텍스트리스 + 카피 합성 (1.5 후보)</CardTitle>
              <CardDescription>텍스트 없는 배경 위에 앱이 Canvas로 카피 합성 — 아래에서 카피를 고치면 즉시 반영</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {composedImage ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={composedImage} alt="카피 합성 히어로" className="w-full rounded-md border" />
                  <div className="space-y-2">
                    <Input
                      value={copy.headline}
                      onChange={(event) => setCopy((prev) => ({ ...prev, headline: event.target.value }))}
                      placeholder="헤드라인"
                    />
                    <Input
                      value={copy.subheadline || ""}
                      onChange={(event) => setCopy((prev) => ({ ...prev, subheadline: event.target.value }))}
                      placeholder="서브헤드"
                    />
                    <Input
                      value={copy.cta || ""}
                      onChange={(event) => setCopy((prev) => ({ ...prev, cta: event.target.value }))}
                      placeholder="CTA"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="secondary" size="sm" onClick={() => download(composedImage, "pilot_카피합성_히어로.png")}>
                      합성본 다운로드
                    </Button>
                    <Button type="button" variant="secondary" size="sm" onClick={() => download(textlessImage, "pilot_텍스트리스_배경.png")}>
                      배경 원본 다운로드
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">{running ? "생성중..." : "아직 생성되지 않았습니다."}</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  );
}
