"use client";

import * as React from "react";
import {
  ChevronDown,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Copy,
  Download,
  ExternalLink,
  FileImage,
  FileText,
  Image as ImageIcon,
  KeyRound,
  Loader2,
  RefreshCw,
  Sparkles,
  Trash2,
  Upload,
  X
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Model = "openai" | "google";
type View = "dashboard" | "workspace" | "results";
/** restructure: 전환 구조로 재구성 / preserve: 원본 구성과 문구를 그대로 두고 디자인만 새로 만든다. */
type RedesignMode = "restructure" | "preserve";

type SectionCopy = {
  eyebrow: string;
  headline: string;
  subheadline: string;
  points: Array<{ label: string; desc: string }>;
  extras: string[];
  note: string;
};

type SectionResult = {
  id: string;
  name: string;
  purpose: string;
  source: string;
  prompt: string;
  copy?: SectionCopy;
  imageUrl?: string;
  revisions?: SectionRevision[];
};

type SectionRevision = {
  id: string;
  imageUrl: string;
  label: string;
  createdAt: string;
  request?: string;
  model?: Model;
};

type Project = {
  id: string;
  title: string;
  channel: string;
  mode?: RedesignMode;
  sectionTotal?: number;
  model: Model;
  count: number;
  ratio: string;
  status: string;
  files: string[];
  request: string;
  createdAt: string;
  sections: SectionResult[];
  analysis?: unknown;
  savedAt?: string;
};

type GenerationPlan = {
  model: Model;
  count: number;
  displayCount?: number;
  displayIndex?: number;
  showWaitVideo?: boolean;
  startedAt: number;
};

type GenerationProgress = {
  percent: number;
  elapsedSeconds: number;
  remainingSeconds: number;
  phase: string;
  tip: string;
};

const projectDbName = "hanirum-redesign-projects";
const projectStoreName = "projects";

const models = {
  openai: {
    label: "OpenAI Image 2.0",
    id: "gpt-image-2-2026-04-21"
  },
  google: {
    label: "Google Nano Banana 2",
    id: "gemini-3.1-flash-image"
  }
};

const commerceTips = [
  "첫 화면은 제품명보다 '누구의 어떤 문제를 해결하는지'가 먼저 보여야 이탈이 줄어듭니다.",
  "상세페이지의 수치는 조건이 함께 있을 때 신뢰가 생깁니다. 기간, 대상, 기준을 같이 적어주세요.",
  "구매전환을 높이는 CTA는 '구매하기'만 반복하기보다 혜택, 안심, 한정 이유를 번갈아 보여주는 편이 좋습니다.",
  "제품 구성이 복잡하면 선택지가 많아 보여 구매가 밀립니다. 대표 구성 1개와 비교 구성 1~2개로 압축해보세요.",
  "리뷰는 별점보다 사용감 문장이 강합니다. 고객이 실제로 말할 법한 짧은 문장 카드가 스캔에 유리합니다.",
  "고가 상품은 장점보다 불안 제거가 먼저입니다. 배송, 교환, AS, 사용법, 보증을 초반부터 노출하세요.",
  "혜택은 마지막에만 두지 말고 히어로, 근거 후, 후기 후, 마지막 CTA에 리듬 있게 반복하면 좋습니다.",
  "제품컷은 예쁘게 보이는 것보다 크기, 질감, 구성품, 사용 상황이 이해되는 쪽이 구매에 더 가깝습니다.",
  "스마트스토어와 쿠팡은 브랜드 서사보다 스캔 속도가 중요합니다. 제목, 불릿, 근거, CTA가 빨리 잡혀야 합니다.",
  "건강/뷰티/식품 카테고리는 효능을 단정하기보다 원료, 사용감, 섭취/사용 루틴, 고객 상황 중심으로 풀어야 안전합니다.",
  "상세페이지 한 장에는 메시지 하나만 담는 편이 좋습니다. 여러 주장을 한 화면에 넣으면 모두 약해집니다.",
  "구매 저항은 가격 때문만은 아닙니다. 나에게 맞을지, 사용이 쉬운지, 믿을 수 있는지가 먼저 해결되어야 합니다."
];

const hanirumYoutubeVideos = [
  { id: "QaUZFEM0EjY", title: "하네스로 15분만에 업무해방: AI 10배 핵심 기술 공개" },
  { id: "I-evLECnPwI", title: "돈 되는 제품을 찾아 드리는 AI 소싱 마법사 최초 무료 공개" },
  { id: "TknKqlmD4UU", title: "AI 상세페이지 마법사 2.0 공개" },
  { id: "E8OQozcx2G4", title: "100만원 짜리 상세페이지 800원에 만드는 놀라운 방법" },
  { id: "nfdCD1EzknI", title: "처음보는 미친 AI 상세페이지 마법사 1.5 무료 공개" },
  { id: "qlnjPadfqAw", title: "나노바나나로 텍스트 수정 안 되죠? 이걸로 끝냅니다" },
  { id: "6OW9TZbfxZ0", title: "쉽고 빠르지만 놀라운 상세페이지 자동화" }
];

const demoProjectTitles = new Set([
  "프리미엄 영양제 상세페이지 리디자인",
  "소형 가전 제품 USP 강화 작업",
  "뷰티 브랜드 첫 화면 3초 이해 개선"
]);

function loadProjects() {
  return [];
}

export function RedesignWizard() {
  const [view, setView] = React.useState<View>("dashboard");
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [activeProject, setActiveProject] = React.useState<Project | null>(null);
  const [selectedModel, setSelectedModel] = React.useState<Model>("openai");
  const [redesignMode, setRedesignMode] = React.useState<RedesignMode>("restructure");
  const [channel, setChannel] = React.useState("스마트스토어");
  const [count, setCount] = React.useState(1);
  const [ratio, setRatio] = React.useState("9:16");
  const [files, setFiles] = React.useState<File[]>([]);
  const [productFiles, setProductFiles] = React.useState<File[]>([]);
  const [request, setRequest] = React.useState(
    "첫 화면에서 제품의 차별점이 바로 보이게 하고, 구매 불안을 줄이는 근거 섹션을 강화해주세요. 과장 표현은 피하고 스마트스토어에 맞춰 스캔이 쉬운 구성으로 정리해주세요."
  );
  const [openaiKey, setOpenaiKey] = React.useState("");
  const [googleKey, setGoogleKey] = React.useState("");
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [generating, setGenerating] = React.useState(false);
  const [generationPlan, setGenerationPlan] = React.useState<GenerationPlan | null>(null);
  const [generationProgress, setGenerationProgress] = React.useState<GenerationProgress | null>(null);
  const [editingSectionId, setEditingSectionId] = React.useState<string | null>(null);
  const [toast, setToast] = React.useState("");
  const [rolloutRequest, setRolloutRequest] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const productInputRef = React.useRef<HTMLInputElement>(null);
  const generationAbortRef = React.useRef<AbortController | null>(null);

  React.useEffect(() => {
    const initial = loadProjects();
    setProjects(initial);
    setActiveProject(initial[0] ?? null);
    setOpenaiKey(localStorage.getItem("hanirum-openai-key") || "");
    setGoogleKey(localStorage.getItem("hanirum-google-key") || "");
    loadSavedProjects().then((savedProjects) => {
      if (savedProjects.length === 0) return;
      setProjects(savedProjects);
      setActiveProject(savedProjects[0]);
    });
  }, []);

  React.useEffect(() => {
    if (!toast) return;
    if (isPersistentToast(toast)) return;
    const timer = window.setTimeout(() => setToast(""), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  React.useEffect(() => {
    if (!generating || !generationPlan) {
      setGenerationProgress(null);
      return;
    }

    const totalSeconds = estimateGenerationSeconds(generationPlan.model, generationPlan.count);
    const update = () => {
      const elapsedSeconds = Math.max(0, Math.floor((Date.now() - generationPlan.startedAt) / 1000));
      const rawPercent = (elapsedSeconds / totalSeconds) * 100;
      const percent = Math.min(96, Math.max(4, Math.round(rawPercent)));
      const remainingSeconds = Math.max(5, totalSeconds - elapsedSeconds);
      const tip = commerceTips[Math.floor(elapsedSeconds / 7) % commerceTips.length];
      setGenerationProgress({
        percent,
        elapsedSeconds,
        remainingSeconds,
        phase: generationPhase(percent, elapsedSeconds),
        tip
      });
    };

    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [generating, generationPlan]);

  const currentProject = activeProject || projects[0];

  async function generate(
    nextCount = count,
    nextRolloutRequest = "",
    startSection = 1,
    baseProject?: Project | null,
    showWaitVideo = false,
    displayCount = nextCount,
    displayIndex = 1
  ): Promise<Project | null> {
    const outputCount = typeof nextCount === "number" && Number.isFinite(nextCount) ? nextCount : count;
    const outputRolloutRequest = typeof nextRolloutRequest === "string" ? nextRolloutRequest : "";
    // 이어서 생성할 때는 그 작업이 시작된 모드를 그대로 따른다.
    const activeMode: RedesignMode = baseProject?.mode || redesignMode;

    // 새로고침하거나 저장된 작업을 다시 열면 업로드 파일이 사라진다.
    // 이어서 생성하는 경우에는 이미 만든 섹션 이미지를 원본 참조로 대신 쓴다.
    const fallbackSourceImage = baseProject?.sections.find((section) => section.imageUrl)?.imageUrl || "";
    if (files.length === 0 && !fallbackSourceImage) {
      setToast("기존 상세페이지 이미지 또는 PDF를 먼저 업로드해주세요.");
      setView("workspace");
      return null;
    }

    const hasKey = selectedModel === "openai" ? Boolean(openaiKey) : Boolean(googleKey);
    if (!hasKey) {
      setToast(`${models[selectedModel].label} API 키를 먼저 설정해주세요.`);
      setSettingsOpen(true);
      return null;
    }

    if (outputCount > 1 && !baseProject) {
      reportClientLog("generate-sequence:start", {
        model: selectedModel,
        mode: activeMode,
        count: outputCount,
        startSection
      });
      let workingProject: Project | null = null;
      // 원본 구성 유지 모드의 총 장수는 첫 장을 만들면서 확정되는 원본 섹션 수를 따른다.
      let totalCount = outputCount;
      for (let sectionNumber = startSection; sectionNumber < startSection + totalCount; sectionNumber += 1) {
        const nextProject = await generate(1, outputRolloutRequest, sectionNumber, workingProject, true, totalCount, sectionNumber - startSection + 1);
        if (!nextProject) return workingProject;
        workingProject = nextProject;
        if (activeMode === "preserve") totalCount = totalSectionsOf(workingProject);
      }
      return workingProject;
    }

    reportClientLog("generate:start", {
      model: selectedModel,
      mode: activeMode,
      count: outputCount,
      startSection,
      files: files.length,
      append: Boolean(baseProject)
    });
    setGenerationPlan({
      model: selectedModel,
      count: outputCount,
      displayCount,
      displayIndex,
      showWaitVideo,
      startedAt: Date.now()
    });
    setGenerating(true);
    setToast("원본 자료를 이미지 생성용 PNG로 변환하는 중입니다.");
    const abortController = new AbortController();
    generationAbortRef.current = abortController;

    try {
      const form = new FormData();
      const uploadFiles = files.length > 0
        ? await normalizeFilesForUpload(files)
        : [await dataUrlToFile(await compressImageForRequest(fallbackSourceImage), "source-reference.jpg")];
      if (abortController.signal.aborted) throw new DOMException("생성 요청을 취소했습니다.", "AbortError");
      setToast("원본 분석과 실제 이미지 생성을 시작합니다.");
      const uploadProductFiles = productFiles.length > 0 ? await normalizeFilesForUpload(productFiles) : [];
      uploadFiles.forEach((file) => form.append("files", file));
      uploadProductFiles.forEach((file) => form.append("productFiles", file));
      form.append("request", request);
      form.append("model", selectedModel);
      form.append("mode", activeMode);
      form.append("channel", channel);
      form.append("ratio", ratio);
      form.append("count", String(outputCount));
      form.append("startSection", String(startSection));
      form.append("rolloutRequest", outputRolloutRequest);
      form.append("openaiKey", openaiKey);
      form.append("googleKey", googleKey);
      // 히어로 이후 섹션은 히어로 이미지를 스타일 기준으로 참조하고, 첫 요청에서 확정한 카피를 재사용한다.
      const heroImageUrl = baseProject?.sections.find((section) => section.id === "S1")?.imageUrl || "";
      if (heroImageUrl && startSection > 1) {
        form.append("heroImageUrl", await compressImageForRequest(heroImageUrl));
      }
      if (baseProject?.analysis) {
        form.append("blueprint", JSON.stringify(baseProject.analysis));
      }

      const response = await fetch("/api/generate", {
        method: "POST",
        body: form,
        signal: abortController.signal
      });
      const data = await readApiResponse(response);
      reportClientLog("generate:response", {
        ok: response.ok,
        status: response.status,
        count: outputCount,
        startSection,
        generated: data.project?.sections?.length || 0,
        warning: data.project?.warning || ""
      });
      if (!response.ok) throw new Error(data.error || "생성 요청 실패");
      if (!data.project?.sections?.length) {
        throw new Error(data.project?.warning || "생성 응답은 성공했지만 표시할 이미지가 없습니다. 서버 로그의 generated/failed 값을 확인해주세요.");
      }

      const project: Project = {
        ...data.project,
        title: projectDisplayTitle(data.project),
        sections: data.project.sections.map((section: Record<string, any>) => ({
          id: section.section_id,
          name: section.name,
          purpose: section.purpose,
          source: section.source,
          prompt: section.prompt,
          copy: section.copy,
          imageUrl: section.imageUrl
        }))
      };
      const finalProject = baseProject ? mergeGeneratedProject(baseProject, project) : project;
      const nextProjects = [finalProject, ...projects].filter((candidate, index, list) => (
        list.findIndex((item) => item.id === candidate.id) === index
      )).slice(0, 8);
      setProjects(nextProjects);
      setActiveProject(finalProject);
      setView("results");
      setToast(data.project.warning || `${models[selectedModel].label}로 ${project.sections.length}장 생성 완료`);
      return finalProject;
    } catch (error) {
      reportClientLog("generate:error", {
        count: outputCount,
        startSection,
        message: error instanceof Error ? error.message : "unknown"
      });
      if (isAbortError(error)) setToast("생성 요청을 취소했습니다.");
      else setToast(error instanceof Error ? error.message : "이미지 생성 중 오류가 발생했습니다.");
      return null;
    } finally {
      if (generationAbortRef.current === abortController) generationAbortRef.current = null;
      setGenerating(false);
    }
  }

  async function generateRemainingSections() {
    const baseProject = currentProject;
    if (!baseProject?.sections.length) {
      await generate(8, rolloutRequest);
      return;
    }

    let workingProject = baseProject;
    const totalCount = totalSectionsOf(workingProject);
    const existingSectionNumbers = new Set(
      workingProject.sections
        .map((section) => Number(section.id.replace(/\D/g, "")))
        .filter((sectionNumber) => Number.isFinite(sectionNumber))
    );
    const missingSections = Array.from({ length: totalCount }, (_, index) => index + 1)
      .filter((sectionNumber) => !existingSectionNumbers.has(sectionNumber));

    reportClientLog("generate-rest:start", {
      mode: workingProject.mode || "restructure",
      existing: workingProject.sections.length,
      missing: missingSections.join(",")
    });

    if (missingSections.length === 0) {
      setToast(`이미 ${totalCount}장 상세페이지가 생성되어 있습니다.`);
      return;
    }

    for (const [index, sectionNumber] of missingSections.entries()) {
      setToast(`S${sectionNumber} 섹션을 생성합니다.`);
      const nextProject = await generate(1, rolloutRequest, sectionNumber, workingProject, true, missingSections.length, index + 1);
      if (!nextProject) break;
      workingProject = nextProject;
    }
  }

  function saveSettings() {
    const nextOpenaiKey = openaiKey.trim();
    const nextGoogleKey = googleKey.trim();
    localStorage.setItem("hanirum-openai-key", nextOpenaiKey);
    localStorage.setItem("hanirum-google-key", nextGoogleKey);
    setOpenaiKey(nextOpenaiKey);
    setGoogleKey(nextGoogleKey);
    setSettingsOpen(false);
    setToast("API 키 설정을 저장했습니다.");
  }

  function clearSettings() {
    localStorage.removeItem("hanirum-openai-key");
    localStorage.removeItem("hanirum-google-key");
    setOpenaiKey("");
    setGoogleKey("");
    setToast("저장된 API 키를 삭제했습니다.");
  }

  function openProject(project: Project) {
    setActiveProject(project);
    setView("results");
  }

  async function deleteProject(project: Project) {
    const confirmed = window.confirm(`'${projectDisplayTitle(project)}' 작업을 삭제할까요?`);
    if (!confirmed) return;

    try {
      await deleteProjectFromDb(project.id);
      setProjects((current) => current.filter((candidate) => candidate.id !== project.id));
      setActiveProject((current) => current?.id === project.id ? null : current);
      setToast("작업을 삭제했습니다.");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "작업 삭제 중 오류가 발생했습니다.");
    }
  }

  async function saveCurrentProject(project?: Project | null) {
    const targetProject = project || currentProject;
    if (!targetProject) {
      setToast("저장할 작업이 없습니다.");
      return;
    }

    const savedProject = { ...targetProject, title: projectDisplayTitle(targetProject), savedAt: new Date().toISOString(), status: "저장됨" };
    try {
      await saveProjectToDb(savedProject);
      setProjects((current) => [savedProject, ...current.filter((candidate) => candidate.id !== savedProject.id)].slice(0, 20));
      setActiveProject(savedProject);
      setToast("작업을 저장했습니다. 대시보드에서 다시 열 수 있습니다.");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "작업 저장 중 오류가 발생했습니다.");
    }
  }

  async function editSection(sectionId: string, editRequest: string, model: Model) {
    const project = currentProject;
    const section = project?.sections.find((candidate) => candidate.id === sectionId);
    const trimmedEditRequest = editRequest.trim();
    if (!project || !section) {
      setToast("수정할 섹션을 찾지 못했습니다.");
      return;
    }
    if (!section.imageUrl) {
      setToast("저장된 이미지가 없는 섹션은 수정할 수 없습니다. 다시 생성한 뒤 시도해주세요.");
      return;
    }
    const hasKey = model === "openai" ? Boolean(openaiKey) : Boolean(googleKey);
    if (!hasKey) {
      setToast(`${models[model].label} API 키를 먼저 설정해주세요.`);
      setSettingsOpen(true);
      return;
    }
    if (!trimmedEditRequest) {
      setToast("섹션 수정 요청을 입력하거나 빠른 입력 버튼을 선택해주세요.");
      return;
    }

    setEditingSectionId(sectionId);
    setGenerationPlan({ model, count: 1, startedAt: Date.now() });
    setGenerating(true);
    setToast(`${section.name} 섹션을 수정하고 있습니다.`);
    const abortController = new AbortController();
    generationAbortRef.current = abortController;

    try {
      const requestImageUrl = await compressImageForRequest(section.imageUrl);
      reportClientLog("edit-section:start", {
        model,
        sectionId,
        imageBytes: estimateDataUrlBytes(requestImageUrl)
      });
      const response = await fetch("/api/edit-section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          imageUrl: requestImageUrl,
          request: trimmedEditRequest,
          section,
          project: { title: projectDisplayTitle(project), channel: project.channel, request: project.request },
          openaiKey,
          googleKey
        }),
        signal: abortController.signal
      });
      const data = await readApiResponse(response);
      if (!response.ok) throw new Error(data.error || "섹션 수정 실패");

      const updatedProject: Project = {
        ...project,
        sections: project.sections.map((candidate) => (
          candidate.id === sectionId
            ? addSectionRevision(candidate, data.imageUrl, data.prompt || candidate.prompt, trimmedEditRequest, model)
            : candidate
        )),
        status: project.savedAt ? "수정됨" : project.status
      };
      setActiveProject(updatedProject);
      setProjects((current) => [updatedProject, ...current.filter((candidate) => candidate.id !== updatedProject.id)].slice(0, 20));
      setToast(`${section.name} 수정 완료. 마음에 들면 작업 저장을 눌러주세요.`);
    } catch (error) {
      reportClientLog("edit-section:error", {
        sectionId,
        message: error instanceof Error ? error.message : "unknown"
      });
      if (isAbortError(error)) setToast("섹션 수정 요청을 취소했습니다.");
      else setToast(error instanceof Error ? error.message : "섹션 수정 중 오류가 발생했습니다.");
    } finally {
      if (generationAbortRef.current === abortController) generationAbortRef.current = null;
      setEditingSectionId(null);
      setGenerating(false);
    }
  }

  function cancelGeneration() {
    generationAbortRef.current?.abort();
    generationAbortRef.current = null;
    setEditingSectionId(null);
    setGenerating(false);
    setToast("요청을 취소했습니다. 이미 서버에 전달된 외부 API 요청은 잠시 후 로그에 완료될 수 있습니다.");
  }

  return (
    <div className="mx-auto grid min-h-screen w-full max-w-[1240px] grid-cols-[220px_minmax(0,1fr)] max-[1120px]:grid-cols-1">
      <aside className="sticky top-0 h-screen p-5 max-[1120px]:static max-[1120px]:h-auto">
        <button
          type="button"
          className="mb-7 flex items-center gap-3 rounded-2xl text-left transition hover:opacity-75"
          onClick={() => setView("dashboard")}
          aria-label="대시보드로 이동"
        >
          <div className="grid size-9 place-items-center rounded-2xl bg-foreground text-xs font-black text-background">HR</div>
          <div>
            <strong className="block text-sm leading-tight">한이룸의 상세페이지<br />리디자인 마법사 1.5</strong>
          </div>
        </button>
        <nav className="grid gap-1.5 max-[1120px]:grid-cols-3">
          {[
            ["dashboard", "대시보드", "01"],
            ["workspace", "리디자인 작업", "02"],
            ["results", "결과 확인", "03"]
          ].map(([id, label, index]) => (
            <button
              key={id}
              className={cn(
                "flex h-11 items-center justify-between rounded-2xl px-4 text-left text-sm font-medium text-muted-foreground transition hover:bg-white/70 hover:text-foreground",
                view === id && "bg-foreground text-background hover:bg-foreground hover:text-background"
              )}
              onClick={() => setView(id as View)}
            >
              {label}
              <span className="text-xs opacity-60">{index}</span>
            </button>
          ))}
        </nav>
        <button
          type="button"
          className="mt-3 flex w-full items-center justify-between gap-2 rounded-2xl px-4 py-3 text-left text-xs transition hover:bg-white/70"
          onClick={() => setSettingsOpen(true)}
        >
          <span className="flex items-center gap-2 text-muted-foreground">
            <KeyRound className="size-3.5" />
            API 키
          </span>
          <Badge variant={openaiKey || googleKey ? "green" : "default"}>{openaiKey || googleKey ? "연결됨" : "필요"}</Badge>
        </button>
      </aside>

      <main className="w-full min-w-0 px-6 py-6 max-md:px-4">
        {view === "dashboard" && (
          <Dashboard
            projects={projects}
            onNew={() => setView("workspace")}
            onOpenProject={openProject}
            onDeleteProject={deleteProject}
            onSettings={() => setSettingsOpen(true)}
          />
        )}
        {view === "workspace" && (
          <Workspace
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            redesignMode={redesignMode}
            setRedesignMode={setRedesignMode}
            channel={channel}
            setChannel={setChannel}
            count={count}
            setCount={setCount}
            ratio={ratio}
            setRatio={setRatio}
            files={files}
            setFiles={setFiles}
            productFiles={productFiles}
            setProductFiles={setProductFiles}
            request={request}
            setRequest={setRequest}
            inputRef={inputRef}
            productInputRef={productInputRef}
            generating={generating}
            onGenerate={() => generate()}
          />
        )}
        {view === "results" && (
          <Results
            project={currentProject}
            rolloutRequest={rolloutRequest}
            setRolloutRequest={setRolloutRequest}
            onToast={setToast}
            onSave={() => saveCurrentProject(currentProject)}
            onEditSection={editSection}
            onGenerateRest={generateRemainingSections}
            generating={generating}
            editingSectionId={editingSectionId}
          />
        )}
      </main>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>API 키 설정</DialogTitle>
            <DialogDescription>입력한 키는 이 브라우저에만 저장되고, 이미지 생성에만 사용됩니다.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 p-4">
            <div>
              <label className="mb-2 block text-xs font-bold text-muted-foreground">OpenAI Image 2.0 API 키</label>
              <Input type="password" value={openaiKey} onChange={(event) => setOpenaiKey(event.target.value)} placeholder="sk-..." />
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold text-muted-foreground">Google Nano Banana 2 API 키</label>
              <Input type="password" value={googleKey} onChange={(event) => setGoogleKey(event.target.value)} placeholder="AIza..." />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={clearSettings}>키 초기화</Button>
              <Button variant="secondary" onClick={() => setSettingsOpen(false)}>닫기</Button>
              <Button onClick={saveSettings}>저장</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {toast && (
        <div
          className={cn(
            "fixed bottom-4 right-4 z-50 max-w-lg rounded-2xl px-5 py-4 text-sm shadow-xl",
            isPersistentToast(toast)
              ? "bg-white text-foreground ring-1 ring-red-100"
              : "bg-foreground text-background"
          )}
          role="alert"
        >
          <div className="flex items-start gap-3">
            <p className="whitespace-pre-wrap leading-relaxed">{toast}</p>
            {isPersistentToast(toast) ? (
              <button
                type="button"
                className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground"
                onClick={() => setToast("")}
                aria-label="메시지 닫기"
              >
                <X className="size-4" />
              </button>
            ) : null}
          </div>
        </div>
      )}
      {generating && generationProgress && generationPlan && (
        <GenerationProgressPanel
          progress={generationProgress}
          modelLabel={models[generationPlan.model].label}
          count={generationPlan.displayCount || generationPlan.count}
          currentIndex={generationPlan.displayIndex || 1}
          showVideo={Boolean(generationPlan.showWaitVideo)}
          videoSeed={generationPlan.startedAt}
          onCancel={cancelGeneration}
        />
      )}
    </div>
  );
}

/**
 * 오류 메시지는 사용자가 읽고 복사할 때까지 남겨야 한다(CLAUDE.md 9번).
 * 키워드로 오류를 골라내던 방식은 새 오류 문구를 놓쳐 조용히 사라졌으므로,
 * 진행/완료 같은 일시 알림만 자동으로 닫고 나머지는 모두 유지한다.
 */
function isPersistentToast(message: string) {
  const transient = [
    "중입니다",
    "시작합니다",
    "생성합니다",
    "생성 완료",
    "저장했습니다",
    "복사했습니다",
    "삭제했습니다",
    "취소했습니다",
    "다운로드합니다",
    "저장했습니다"
  ];
  return !transient.some((keyword) => message.includes(keyword));
}

async function readApiResponse(response: Response): Promise<any> {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    return {
      error: simplifyPlainTextError(text, response.status)
    };
  }
}

function simplifyPlainTextError(text: string, status: number) {
  const message = text.trim() || "요청 처리 중 오류가 발생했습니다.";
  if (status === 413 || message.toLowerCase().includes("request entity too large")) {
    return "이미지 데이터가 너무 커서 섹션 수정 요청을 보낼 수 없습니다. 수정용 이미지를 압축해 다시 시도했지만, 계속 실패하면 해당 섹션을 다시 생성해 주세요.";
  }
  return message.slice(0, 500);
}

function reportClientLog(event: string, payload: Record<string, unknown> = {}) {
  fetch("/api/client-log", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event, payload, timestamp: new Date().toISOString() }),
    keepalive: true
  }).catch(() => {
    // Logging must never interrupt generation.
  });
}

async function openProjectDb() {
  if (typeof indexedDB === "undefined") return null;

  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(projectDbName, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(projectStoreName)) {
        db.createObjectStore(projectStoreName, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function loadSavedProjects() {
  const db = await openProjectDb();
  if (!db) return [];

  return new Promise<Project[]>((resolve, reject) => {
    const transaction = db.transaction(projectStoreName, "readonly");
    const store = transaction.objectStore(projectStoreName);
    const request = store.getAll();
    request.onsuccess = () => {
      const projects = (request.result as Project[])
        .filter((project) => project?.id && project.sections?.length)
        .filter((project) => !isDemoProject(project))
        .sort((a, b) => new Date(b.savedAt || b.createdAt).getTime() - new Date(a.savedAt || a.createdAt).getTime());
      resolve(projects);
    };
    request.onerror = () => reject(request.error);
  });
}

function isDemoProject(project: Project) {
  return demoProjectTitles.has(project.title) && project.sections.every((section) => !section.imageUrl);
}

async function saveProjectToDb(project: Project) {
  const db = await openProjectDb();
  if (!db) throw new Error("브라우저 저장소를 열 수 없습니다.");

  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(projectStoreName, "readwrite");
    transaction.objectStore(projectStoreName).put(project);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

async function deleteProjectFromDb(projectId: string) {
  const db = await openProjectDb();
  if (!db) throw new Error("브라우저 저장소를 열 수 없습니다.");

  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(projectStoreName, "readwrite");
    transaction.objectStore(projectStoreName).delete(projectId);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

function projectDisplayTitle(project: Partial<Project>) {
  const inferred = inferTitleFromAnalysis(project.analysis);
  if (inferred) return inferred;
  const current = String(project.title || "").trim();
  if (current && !current.includes(new Date().getFullYear().toString())) return current;
  return current || `${project.channel || "스마트스토어"} 상세페이지 리디자인`;
}

function mergeGeneratedProject(baseProject: Project, generatedProject: Project): Project {
  const sections = [...baseProject.sections];
  for (const generatedSection of generatedProject.sections) {
    const existingIndex = sections.findIndex((section) => section.id === generatedSection.id);
    if (existingIndex >= 0) sections[existingIndex] = generatedSection;
    else sections.push(generatedSection);
  }

  sections.sort((a, b) => sectionSortNumber(a.id) - sectionSortNumber(b.id));

  return {
    ...baseProject,
    title: projectDisplayTitle(baseProject) || projectDisplayTitle(generatedProject),
    status: generatedProject.status,
    count: sections.length,
    sections,
    analysis: generatedProject.analysis || baseProject.analysis,
    createdAt: baseProject.createdAt || generatedProject.createdAt
  };
}

/** 원본 구성 유지 모드의 총 장수는 원본에서 읽어낸 섹션 수를 따르고, 기본 모드는 8장이다. */
function totalSectionsOf(project?: Project | null) {
  if (project?.mode !== "preserve") return 8;
  const fromServer = Number(project.sectionTotal);
  if (Number.isFinite(fromServer) && fromServer > 0) return Math.min(10, fromServer);
  const fromBlueprint = blueprintSectionNames(project).length;
  return Math.min(10, Math.max(1, fromBlueprint || project.sections.length));
}

/** 원본 구성 유지 모드에서 이어서 만들 섹션 이름을 분석 결과에서 꺼낸다. */
function blueprintSectionNames(project?: Project | null): string[] {
  const sections = (project?.analysis as { sections?: unknown })?.sections;
  if (!Array.isArray(sections)) return [];
  return sections.slice(0, 10).map((item, index) => {
    const name = (item as { name?: unknown })?.name;
    return typeof name === "string" && name.trim() ? name.trim() : `원본 ${index + 1}번째 섹션`;
  });
}

function sectionSortNumber(sectionId: string) {
  const sectionNumber = Number(sectionId.replace(/\D/g, ""));
  return Number.isFinite(sectionNumber) ? sectionNumber : 999;
}

function downloadDataUrl(url: string, fileName: string) {
  if (!url) return;
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function buildImageFileName(projectTitle: string, section: SectionResult, index: number, revisionLabel = "") {
  const ext = imageExtension(section.imageUrl || "");
  const parts = [
    projectTitle || "redesign",
    section.id || `S${index + 1}`,
    section.name || "section",
    revisionLabel && revisionLabel !== "원본" ? revisionLabel : ""
  ].filter(Boolean);
  return `${sanitizeDownloadName(parts.join("-"))}.${ext}`;
}

function imageExtension(url: string) {
  const mime = url.match(/^data:([^;]+);/)?.[1] || "";
  if (mime.includes("jpeg")) return "jpg";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("png")) return "png";
  return "png";
}

function sanitizeDownloadName(name: string) {
  return name
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120) || "redesign-image";
}

async function compressImageForRequest(dataUrl: string) {
  if (!dataUrl.startsWith("data:image/")) return dataUrl;

  try {
    const image = await loadDataUrlImage(dataUrl);
    const maxWidth = 960;
    const scale = Math.min(1, maxWidth / Math.max(1, image.naturalWidth));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) return dataUrl;

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);
    return await canvasToDataUrl(canvas, "image/jpeg", 0.84);
  } catch {
    return dataUrl;
  }
}

async function dataUrlToFile(dataUrl: string, fileName: string) {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  return new File([blob], fileName, { type: blob.type || "image/jpeg" });
}

function loadDataUrlImage(dataUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("수정용 이미지를 압축하지 못했습니다."));
    image.src = dataUrl;
  });
}

async function canvasToDataUrl(canvas: HTMLCanvasElement, type: string, quality: number) {
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) resolve(result);
      else reject(new Error("이미지 압축에 실패했습니다."));
    }, type, quality);
  });
  return blobToDataUrl(blob);
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("이미지 변환에 실패했습니다."));
    reader.readAsDataURL(blob);
  });
}

function estimateDataUrlBytes(dataUrl: string) {
  const payload = dataUrl.split(",")[1] || "";
  return Math.round((payload.length * 3) / 4);
}

function addSectionRevision(section: SectionResult, nextImageUrl: string, nextPrompt: string, request: string, model: Model): SectionResult {
  const history = ensureSectionRevisions(section);
  const nextRevision: SectionRevision = {
    id: `revision-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    imageUrl: nextImageUrl,
    label: `수정 ${history.length}`,
    createdAt: new Date().toISOString(),
    request,
    model
  };

  return {
    ...section,
    imageUrl: nextImageUrl,
    prompt: nextPrompt,
    revisions: [...history, nextRevision]
  };
}

function ensureSectionRevisions(section: SectionResult): SectionRevision[] {
  const revisions = section.revisions?.length
    ? section.revisions
    : section.imageUrl
      ? [{
          id: `${section.id}-original`,
          imageUrl: section.imageUrl,
          label: "원본",
          createdAt: section.id
        }]
      : [];

  if (section.imageUrl && revisions.every((revision) => revision.imageUrl !== section.imageUrl)) {
    return [
      ...revisions,
      {
        id: `${section.id}-current-${revisions.length}`,
        imageUrl: section.imageUrl,
        label: `수정 ${revisions.length}`,
        createdAt: new Date().toISOString()
      }
    ];
  }

  return revisions;
}

function inferTitleFromAnalysis(analysis: unknown) {
  if (!analysis || typeof analysis !== "object" || !("product_inferred" in analysis)) return "";
  const product = (analysis as { product_inferred?: Record<string, unknown> }).product_inferred || {};
  const brand = pickAnalysisText(product, ["brand_name", "brand", "manufacturer", "maker"]);
  const productName = pickAnalysisText(product, ["product_name", "name", "product", "title"]);
  const category = pickAnalysisText(product, ["category", "product_category"]);

  if (brand && productName) return productName.includes(brand) ? `${productName} 리디자인` : `${brand} ${productName} 리디자인`;
  if (productName) return `${productName} 리디자인`;
  if (category) return `${category} 상세페이지 리디자인`;
  return "";
}

function pickAnalysisText(source: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

async function normalizeFilesForUpload(files: File[]) {
  const output: File[] = [];
  for (const file of files) {
    if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
      output.push(...(await renderPdfToImages(file)));
    } else if (file.type.startsWith("image/")) {
      output.push(...(await renderImageToReferenceFiles(file)));
    }
  }
  return output.slice(0, 4);
}

async function renderImageToReferenceFiles(file: File) {
  const image = await loadImageElement(file);
  const naturalWidth = image.naturalWidth || image.width;
  const naturalHeight = image.naturalHeight || image.height;
  if (!naturalWidth || !naturalHeight) throw new Error("업로드 이미지를 읽지 못했습니다.");

  const isLongDetailPage = naturalHeight / naturalWidth > 2.2;
  const sliceCount = isLongDetailPage ? Math.min(4, Math.ceil(naturalHeight / naturalWidth / 1.8)) : 1;
  const files: File[] = [];

  for (let index = 0; index < sliceCount; index += 1) {
    const sourceY = Math.floor((naturalHeight / sliceCount) * index);
    const sourceHeight = index === sliceCount - 1 ? naturalHeight - sourceY : Math.floor(naturalHeight / sliceCount);
    files.push(await cropImageToPngFile({
      image,
      sourceX: 0,
      sourceY,
      sourceWidth: naturalWidth,
      sourceHeight,
      fileName: file.name,
      index
    }));
  }

  URL.revokeObjectURL(image.src);
  return files;
}

function loadImageElement(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("이미지 파일을 브라우저에서 열 수 없습니다."));
    image.src = URL.createObjectURL(file);
  });
}

async function cropImageToPngFile({
  image,
  sourceX,
  sourceY,
  sourceWidth,
  sourceHeight,
  fileName,
  index
}: {
  image: HTMLImageElement;
  sourceX: number;
  sourceY: number;
  sourceWidth: number;
  sourceHeight: number;
  fileName: string;
  index: number;
}) {
  const maxWidth = 1200;
  const maxHeight = 1800;
  const scale = Math.min(1, maxWidth / sourceWidth, maxHeight / sourceHeight);
  const targetWidth = Math.max(1, Math.round(sourceWidth * scale));
  const targetHeight = Math.max(1, Math.round(sourceHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) throw new Error("이미지 변환 캔버스를 만들지 못했습니다.");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, targetWidth, targetHeight);
  context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, targetWidth, targetHeight);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) resolve(result);
      else reject(new Error("이미지를 PNG로 변환하지 못했습니다."));
    }, "image/png");
  });

  const safeName = fileName.replace(/\.[^.]+$/i, "");
  return new File([blob], `${safeName}-reference-${index + 1}.png`, { type: "image/png" });
}

async function renderPdfToImages(file: File) {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.mjs", import.meta.url).toString();

  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const pageCount = Math.min(pdf.numPages, 4);
  const pages: File[] = [];

  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1.6 });
    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const context = canvas.getContext("2d");
    if (!context) continue;

    await page.render({ canvas, canvasContext: context, viewport }).promise;
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((result) => {
        if (result) resolve(result);
        else reject(new Error("PDF 페이지를 이미지로 변환하지 못했습니다."));
      }, "image/png");
    });
    pages.push(new File([blob], `${file.name.replace(/\.pdf$/i, "")}-page-${pageNumber}.png`, { type: "image/png" }));
  }

  return pages;
}

function Dashboard({
  projects,
  onNew,
  onOpenProject,
  onDeleteProject,
  onSettings
}: {
  projects: Project[];
  onNew: () => void;
  onOpenProject: (project: Project) => void;
  onDeleteProject: (project: Project) => void;
  onSettings: () => void;
}) {
  return (
    <section>
      <Topbar eyebrow="대시보드">
        <Button variant="ghost" onClick={onSettings}><KeyRound className="size-4" />API 키</Button>
        <Button onClick={onNew}><Sparkles className="size-4" />새 리디자인 시작</Button>
      </Topbar>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>최근 작업</CardTitle>
            <CardDescription>저장한 리디자인 작업을 다시 열 수 있습니다.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid gap-2">
          {projects.length > 0 ? (
            projects.map((project) => (
              <div
                key={project.id}
                className="group grid grid-cols-[44px_minmax(0,1fr)_36px] items-center gap-3 rounded-2xl p-3 transition hover:bg-muted/50"
              >
                <button
                  type="button"
                  className="contents text-left"
                  onClick={() => onOpenProject(project)}
                  aria-label={`${project.title} 열기`}
                >
                  <MiniThumb />
                  <div className="min-w-0">
                    <strong className="block truncate text-sm">{project.title}</strong>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span>{project.channel}</span>
                      <span>{project.count}장</span>
                    </div>
                  </div>
                </button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="justify-self-end text-muted-foreground opacity-0 transition group-hover:opacity-100 hover:text-destructive"
                  onClick={() => onDeleteProject(project)}
                  aria-label={`${project.title} 삭제`}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))
          ) : (
            <div className="grid min-h-44 place-items-center rounded-2xl bg-muted/40 p-6 text-center">
              <div>
                <ImageIcon className="mx-auto mb-3 size-8 text-muted-foreground" />
                <strong className="text-sm">아직 작업한 리디자인 작업이 없습니다.</strong>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  새 리디자인을 시작하면 이곳에 최근 작업이 표시됩니다.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function Workspace(props: {
  selectedModel: Model;
  setSelectedModel: (model: Model) => void;
  redesignMode: RedesignMode;
  setRedesignMode: (mode: RedesignMode) => void;
  channel: string;
  setChannel: (channel: string) => void;
  count: number;
  setCount: (count: number) => void;
  ratio: string;
  setRatio: (ratio: string) => void;
  files: File[];
  setFiles: (files: File[]) => void;
  productFiles: File[];
  setProductFiles: (files: File[]) => void;
  request: string;
  setRequest: (request: string) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  productInputRef: React.RefObject<HTMLInputElement | null>;
  generating: boolean;
  onGenerate: () => void;
}) {
  const {
    selectedModel,
    setSelectedModel,
    redesignMode,
    setRedesignMode,
    channel,
    setChannel,
    count,
    setCount,
    ratio,
    setRatio,
    files,
    setFiles,
    productFiles,
    setProductFiles,
    request,
    setRequest,
    inputRef,
    productInputRef,
    generating,
    onGenerate
  } = props;

  return (
    <section className="mx-auto max-w-xl">
      <Topbar eyebrow="리디자인 작업" />

      <Card className="p-2">
        <UploadArea
          inputRef={inputRef}
          files={files}
          setFiles={setFiles}
          title="기존 상세페이지 올리기"
          hint="이미지 또는 PDF · 원본 제품컷과 정보를 최대한 보존합니다"
        />

        <div className="mt-2 grid gap-1">
          <Disclosure title="제품 사진" summary={productFiles.length > 0 ? `${productFiles.length}장` : "선택"}>
            <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
              깨끗한 제품컷을 함께 올리면 제품 모양과 패키지를 그대로 유지합니다. 누끼컷이나 정면 사진 1~2장이면 충분합니다.
            </p>
            <UploadArea
              inputRef={productInputRef}
              files={productFiles}
              setFiles={setProductFiles}
              title="제품 사진 올리기"
              hint=""
              accept="image/*"
              compact
            />
          </Disclosure>

          <Disclosure title="요청사항" summary={request.trim() ? "작성됨" : "기본값"}>
            <Textarea value={request} onChange={(event) => setRequest(event.target.value)} className="bg-muted/40" />
          </Disclosure>

          <Disclosure
            title="생성 옵션"
            summary={`${redesignModeLabel(redesignMode)} · ${models[selectedModel].label.replace("Google ", "")} · ${channel} · ${count === 1 ? "1장" : "전체"}`}
          >
            <div className="grid gap-4">
              <div>
                <OptionGroup
                  label="리디자인 방식"
                  value={redesignMode}
                  options={[["restructure", "전환 구조로 재구성"], ["preserve", "원본 구성 유지"]]}
                  onChange={(value) => setRedesignMode(value as RedesignMode)}
                />
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {redesignMode === "preserve"
                    ? "원본의 섹션 순서와 문구를 그대로 두고 디자인과 레이아웃만 새로 만듭니다. 장수도 원본 섹션 수를 그대로 따릅니다."
                    : "원본의 사실은 지키면서 카피와 섹션 구성을 구매전환 흐름(히어로 → 문제공감 → 베네핏 → 근거 → FAQ)으로 다시 설계합니다."}
                </p>
              </div>
              <OptionGroup
                label="이미지 생성 모델"
                value={selectedModel}
                options={[["openai", "OpenAI Image 2.0"], ["google", "Google Nano Banana 2"]]}
                onChange={(value) => setSelectedModel(value as Model)}
              />
              <OptionGroup
                label="결과 장수"
                value={String(count)}
                options={redesignMode === "preserve"
                  ? [["1", "첫 장 먼저"], ["8", "원본 전체 한 번에"]]
                  : [["1", "히어로 1장 먼저"], ["8", "8장 한 번에"]]}
                onChange={(value) => setCount(Number(value))}
              />
              <OptionGroup label="출력 비율" value={ratio} options={[["9:16", "9:16"], ["1080×1920", "1080×1920"]]} onChange={setRatio} />
              <ChannelOptionGroup value={channel} onChange={setChannel} />
            </div>
          </Disclosure>
        </div>
      </Card>

      <Button className="mt-4 h-12 w-full text-base" onClick={() => onGenerate()} disabled={generating || files.length === 0}>
        {generating ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
        리디자인 생성
      </Button>
      {files.length === 0 ? (
        <p className="mt-2 text-center text-xs text-muted-foreground">기존 상세페이지를 올리면 생성할 수 있습니다.</p>
      ) : null}
    </section>
  );
}

function redesignModeLabel(mode?: RedesignMode) {
  return mode === "preserve" ? "원본 구성 유지" : "전환 구조로 재구성";
}

/** 선택 입력을 접어두는 한 줄 행. 열림 상태에서만 내용을 보여준다. */
function Disclosure({
  title,
  summary,
  children
}: {
  title: string;
  summary: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className={cn("rounded-2xl transition", open && "bg-muted/40")}>
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left transition hover:bg-muted/40"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
      >
        <span className="text-sm font-semibold">{title}</span>
        <span className="flex items-center gap-2 text-xs text-muted-foreground">
          {open ? null : <span className="truncate">{summary}</span>}
          <ChevronDown className={cn("size-4 shrink-0 transition-transform", open && "rotate-180")} />
        </span>
      </button>
      {open ? <div className="px-4 pb-4">{children}</div> : null}
    </div>
  );
}

function UploadArea({
  inputRef,
  files,
  setFiles,
  title,
  hint,
  accept = "image/*,.pdf",
  compact = false
}: {
  inputRef: React.RefObject<HTMLInputElement | null>;
  files: File[];
  setFiles: (files: File[]) => void;
  title: string;
  hint: string;
  accept?: string;
  compact?: boolean;
}) {
  const [dragging, setDragging] = React.useState(false);

  function acceptFiles(list: File[]) {
    setFiles(list.filter((file) => file.type.startsWith("image/") || file.type === "application/pdf"));
  }

  return (
    <>
      <button
        type="button"
        className={cn(
          "grid w-full place-items-center rounded-2xl bg-muted/50 p-6 text-center transition hover:bg-muted",
          compact ? "min-h-24" : "min-h-52",
          dragging && "bg-emerald-50 ring-2 ring-emerald-200",
          files.length > 0 && "bg-emerald-50/60"
        )}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          acceptFiles(Array.from(event.dataTransfer.files));
        }}
      >
        <span>
          <span className={cn("mx-auto mb-3 grid place-items-center rounded-2xl bg-white text-emerald-600", compact ? "size-10" : "size-14")}>
            {files.length > 0 ? <Check className={compact ? "size-5" : "size-6"} /> : <Upload className={compact ? "size-5" : "size-6"} />}
          </span>
          <strong className="text-sm">{files.length > 0 ? `${files.length}개 파일 선택됨` : title}</strong>
          {hint && files.length === 0 ? <span className="mt-1 block text-xs text-muted-foreground">{hint}</span> : null}
        </span>
      </button>
      <input
        ref={inputRef}
        hidden
        multiple
        type="file"
        accept={accept}
        onChange={(event) => acceptFiles(Array.from(event.target.files || []))}
      />
      {files.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-2 px-2">
          {files.map((file) => (
            <Badge key={file.name} variant="default">
              {file.type === "application/pdf" ? <FileText className="mr-1 size-3" /> : <FileImage className="mr-1 size-3" />}
              <span className="max-w-40 truncate">{file.name}</span>
            </Badge>
          ))}
          <button
            type="button"
            className="text-xs font-bold text-muted-foreground underline-offset-2 hover:underline"
            onClick={() => setFiles([])}
          >
            비우기
          </button>
        </div>
      )}
    </>
  );
}

function ChannelOptionGroup({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = React.useState(false);
  const channels = [
    {
      name: "스마트스토어",
      points: ["스캔 쉬운 구성", "상품명/USP/혜택/리뷰/인증을 빠르게 노출", "네이버 쇼핑 사용자가 비교 구매한다는 전제", "과장보다 신뢰, 리뷰, 혜택 중심"]
    },
    {
      name: "쿠팡",
      points: ["더 빠른 구매 판단 중심", "첫 화면에서 핵심 정보와 가격/구성/배송/후기 신뢰를 강하게", "긴 브랜드 스토리보다 왜 지금 사야 하는지 압축", "썸네일처럼 잘 읽히는 굵은 카피와 정보 카드가 유리"]
    },
    {
      name: "자사몰",
      points: ["브랜드 톤앤매너와 스토리 비중이 더 큼", "제품 차별화, 브랜드 신뢰, 보증, 후기 흐름을 더 여유 있게 구성", "단순 구매보다 브랜드 설득과 재구매까지 고려"]
    },
    {
      name: "와디즈",
      points: ["문제 제기 → 해결책 → 제작 이유 → 검증 → 리워드/FAQ 흐름", "제품 탄생 배경, 개발 과정, 상세 검증, 리워드 구성이 중요", "왜 이 제품이 새롭고 믿을 만한가를 더 서사적으로 보여줌"]
    }
  ];

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <label className="block text-xs font-bold text-muted-foreground">판매 채널</label>
        <button
          type="button"
          className="grid size-5 place-items-center rounded-full text-muted-foreground transition hover:text-emerald-700"
          onClick={() => setOpen(true)}
          aria-label="판매 채널 설명 보기"
        >
          <CircleHelp className="size-4" />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {channels.map((channel) => (
          <button
            key={channel.name}
            className={cn("min-h-10 rounded-2xl bg-white px-3 text-xs font-bold text-muted-foreground transition hover:bg-white/60", value === channel.name && "bg-foreground text-background hover:bg-foreground")}
            onClick={() => onChange(channel.name)}
          >
            {channel.name}
          </button>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>판매 채널별 생성 기준</DialogTitle>
            <DialogDescription>
              판매 채널을 선택하면 해당 채널이 이미지 생성 프롬프트에 들어가고, AI가 구성과 문구 톤을 채널에 맞춰 조정합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 p-4">
            <div className="rounded-2xl bg-emerald-50 p-4 text-sm leading-relaxed text-emerald-900">
              채널별 고객의 구매 맥락이 다르기 때문에, 같은 상품이라도 첫 화면의 정보 우선순위와 설득 흐름이 달라집니다.
            </div>
            <div className="grid grid-cols-2 gap-3 max-md:grid-cols-1">
              {channels.map((channel) => (
                <div key={channel.name} className="rounded-2xl bg-muted/40 p-4">
                  <h3 className="mb-3 text-base font-bold">{channel.name}</h3>
                  <ul className="grid gap-2 text-sm leading-relaxed text-muted-foreground">
                    {channel.points.map((point) => (
                      <li key={point} className="flex gap-2">
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-emerald-500" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setOpen(false)}>확인</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Results({
  project,
  rolloutRequest,
  setRolloutRequest,
  onToast,
  onSave,
  onEditSection,
  onGenerateRest,
  generating,
  editingSectionId
}: {
  project?: Project | null;
  rolloutRequest: string;
  setRolloutRequest: (request: string) => void;
  onToast: (message: string) => void;
  onSave: () => void;
  onEditSection: (sectionId: string, editRequest: string, model: Model) => void;
  onGenerateRest: () => void;
  generating: boolean;
  editingSectionId: string | null;
}) {
  const [exporting, setExporting] = React.useState(false);
  const [viewerIndex, setViewerIndex] = React.useState<number | null>(null);

  if (!project) {
    return (
      <Card>
        <CardContent className="grid min-h-40 place-items-center text-sm text-muted-foreground">
          아직 생성된 결과가 없습니다.
        </CardContent>
      </Card>
    );
  }

  const totalCount = totalSectionsOf(project);
  const showRollout = project.sections.length < totalCount;
  const heroOnly = showRollout && project.sections.length === 1;
  const title = projectDisplayTitle(project);
  const downloadableSections = project.sections.filter((section) => section.imageUrl);
  const existingIds = new Set(project.sections.map((section) => section.id));
  const plan: Array<[string, string]> = project.mode === "preserve"
    ? blueprintSectionNames(project).map((name, index) => [`S${index + 1}`, name] as [string, string])
    : plannedSections;
  const missingSectionNames = plan.filter(([id]) => !existingIds.has(id)).map(([, name]) => name);
  const sectionCards = project.sections.map((section, index) => (
    <SectionResultCard
      key={section.id}
      section={section}
      index={index}
      projectTitle={title}
      defaultModel={project.model}
      onEditSection={onEditSection}
      onOpenViewer={() => setViewerIndex(index)}
      editing={editingSectionId === section.id}
      disabled={generating}
    />
  ));

  async function downloadZip() {
    if (downloadableSections.length === 0) {
      onToast("다운로드할 이미지가 없습니다.");
      return;
    }
    setExporting(true);
    try {
      const { buildSectionsZip, downloadBlob } = await import("@/lib/section-export");
      const blob = await buildSectionsZip(downloadableSections, title);
      downloadBlob(blob, `${sanitizeDownloadName(title)}.zip`);
      onToast(`${downloadableSections.length}장을 ZIP으로 저장했습니다.`);
    } catch (error) {
      onToast(error instanceof Error ? error.message : "ZIP 저장 중 오류가 발생했습니다.");
    } finally {
      setExporting(false);
    }
  }

  async function copyCopyMarkdown() {
    try {
      const { buildBlueprintMarkdown } = await import("@/lib/section-export");
      await navigator.clipboard.writeText(buildBlueprintMarkdown(project?.sections || [], title));
      onToast("카피를 마크다운으로 복사했습니다.");
    } catch {
      onToast("클립보드 복사에 실패했습니다. 브라우저 권한을 확인해주세요.");
    }
  }

  return (
    <section>
      <Topbar eyebrow={`결과 확인 · ${redesignModeLabel(project.mode)}`} title={title}>
        <Button variant="ghost" onClick={copyCopyMarkdown}><Copy className="size-4" />카피 복사</Button>
        <Button variant="ghost" onClick={onSave}><FileText className="size-4" />저장</Button>
        <Button onClick={downloadZip} disabled={downloadableSections.length === 0 || exporting}>
          {exporting ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
          ZIP 다운로드
        </Button>
      </Topbar>

      {heroOnly ? (
        // 히어로 1장만 있을 때는 결과를 왼쪽에 크게 보여주고, 남는 오른쪽 공간에 다음 단계를 붙인다.
        <div className="grid grid-cols-[minmax(0,300px)_minmax(0,1fr)] items-start gap-5 max-md:grid-cols-1">
          {sectionCards}
          <RolloutPanel
            missingSections={missingSectionNames}
            preserve={project.mode === "preserve"}
            rolloutRequest={rolloutRequest}
            setRolloutRequest={setRolloutRequest}
            onGenerateRest={onGenerateRest}
            generating={generating}
          />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-3 max-xl:grid-cols-3 max-md:grid-cols-2">{sectionCards}</div>
          {showRollout ? (
            <div className="mt-4">
              <RolloutPanel
                missingSections={missingSectionNames}
                preserve={project.mode === "preserve"}
                rolloutRequest={rolloutRequest}
                setRolloutRequest={setRolloutRequest}
                onGenerateRest={onGenerateRest}
                generating={generating}
              />
            </div>
          ) : null}
        </>
      )}

      {viewerIndex !== null ? (
        <ImageViewer
          sections={project.sections}
          index={viewerIndex}
          projectTitle={title}
          onIndexChange={setViewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      ) : null}
    </section>
  );
}

/** 섹션 이미지를 원본 크기로 크게 보는 뷰어. 좌우 키와 ESC를 지원한다. */
function ImageViewer({
  sections,
  index,
  projectTitle,
  onIndexChange,
  onClose
}: {
  sections: SectionResult[];
  index: number;
  projectTitle: string;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}) {
  const section = sections[index];
  const [zoomed, setZoomed] = React.useState(false);

  const move = React.useCallback((step: number) => {
    onIndexChange((index + step + sections.length) % sections.length);
    setZoomed(false);
  }, [index, sections.length, onIndexChange]);

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") move(-1);
      if (event.key === "ArrowRight") move(1);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [move, onClose]);

  if (!section) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-foreground/80 backdrop-blur-sm" onClick={onClose}>
      <div className="flex shrink-0 items-center justify-between gap-3 px-5 py-3 text-background" onClick={(event) => event.stopPropagation()}>
        <div className="min-w-0">
          <strong className="block truncate text-sm">{section.name.replace(/^S\d+\s*/, "")}</strong>
          <span className="text-xs opacity-70">{index + 1} / {sections.length}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="grid h-9 items-center rounded-full px-3 text-xs font-bold text-background/90 transition hover:bg-white/15"
            onClick={() => setZoomed((current) => !current)}
          >
            {zoomed ? "화면에 맞추기" : "원본 크기"}
          </button>
          <button
            type="button"
            className="grid size-9 place-items-center rounded-full text-background/90 transition hover:bg-white/15"
            onClick={() => section.imageUrl && downloadDataUrl(section.imageUrl, buildImageFileName(projectTitle, section, index))}
            aria-label="이미지 다운로드"
          >
            <Download className="size-5" />
          </button>
          <button
            type="button"
            className="grid size-9 place-items-center rounded-full text-background/90 transition hover:bg-white/15"
            onClick={onClose}
            aria-label="닫기"
          >
            <X className="size-5" />
          </button>
        </div>
      </div>

      <div className={cn("min-h-0 flex-1 px-5 pb-5", zoomed ? "overflow-auto" : "grid place-items-center overflow-hidden")}>
        {section.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={section.imageUrl}
            alt={section.name}
            className={cn(
              "rounded-2xl bg-white shadow-2xl",
              zoomed ? "w-auto max-w-none cursor-zoom-out" : "max-h-[calc(100vh-7.5rem)] w-auto max-w-full cursor-zoom-in object-contain"
            )}
            onClick={(event) => {
              event.stopPropagation();
              setZoomed((current) => !current);
            }}
          />
        ) : (
          <p className="text-sm text-background/80">이 섹션에는 저장된 이미지가 없습니다.</p>
        )}
      </div>

      {sections.length > 1 ? (
        <>
          <button
            type="button"
            className="absolute left-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-background transition hover:bg-white/25"
            onClick={(event) => {
              event.stopPropagation();
              move(-1);
            }}
            aria-label="이전 섹션"
          >
            <ChevronLeft className="size-6" />
          </button>
          <button
            type="button"
            className="absolute right-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-background transition hover:bg-white/25"
            onClick={(event) => {
              event.stopPropagation();
              move(1);
            }}
            aria-label="다음 섹션"
          >
            <ChevronRight className="size-6" />
          </button>
        </>
      ) : null}
    </div>
  );
}

const plannedSections: Array<[string, string]> = [
  ["S1", "히어로"],
  ["S2", "문제 공감"],
  ["S3", "베네핏 3개"],
  ["S4", "USP 차별점"],
  ["S5", "근거·신뢰"],
  ["S6", "사용법"],
  ["S7", "후기"],
  ["S8", "FAQ·안내"]
];

/** 아직 만들지 않은 섹션을 이어서 생성하는 패널. */
function RolloutPanel({
  missingSections,
  preserve,
  rolloutRequest,
  setRolloutRequest,
  onGenerateRest,
  generating
}: {
  missingSections: string[];
  preserve: boolean;
  rolloutRequest: string;
  setRolloutRequest: (request: string) => void;
  onGenerateRest: () => void;
  generating: boolean;
}) {
  return (
    <Card>
      <CardContent className="grid gap-4">
        <div>
          <strong className="text-base">이어서 나머지 {missingSections.length}장을 만드세요</strong>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
            {preserve
              ? "원본의 섹션 구성과 문구는 그대로 두고, 첫 장에서 잡은 디자인 스타일을 이어받습니다."
              : "히어로에서 확정한 카피 설계와 디자인 스타일을 그대로 이어받습니다."}
          </p>
        </div>

        {missingSections.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {missingSections.map((name) => (
              <span key={name} className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-bold text-muted-foreground">
                {name}
              </span>
            ))}
          </div>
        ) : null}

        <div>
          <label className="mb-2 block text-xs font-bold text-muted-foreground">반영할 방향 (선택)</label>
          <Textarea
            value={rolloutRequest}
            onChange={(event) => setRolloutRequest(event.target.value)}
            placeholder="예: 카피가 조금 과장되어 보여요. 나머지는 근거와 리뷰 중심으로 차분하게 해주세요."
            className="min-h-20 bg-muted/40"
          />
        </div>

        <Button className="h-11" onClick={onGenerateRest} disabled={generating}>
          {generating ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          나머지 만들기
        </Button>
      </CardContent>
    </Card>
  );
}

const quickEditPresets = [
  ["카피 강화", "헤드라인과 핵심 문구를 더 명확하고 구매전환 중심으로 강화해주세요. 근거 없는 수치나 효능은 추가하지 마세요."],
  ["글자 크게", "정보량은 그대로 두고 대제목과 소제목, 본문 글자만 더 크게 키워 스마트폰에서 잘 읽히게 해주세요."],
  ["정보 채우기", "빈 여백이 많습니다. 아이콘 타일 줄이나 정보 카드를 더 추가해 화면을 정보로 채워주세요. 없는 사실은 만들지 마세요."],
  ["레이아웃 변경", "다른 섹션과 반복되어 보이지 않도록 제품 위치, 카드 구조, 정보 흐름을 다르게 재구성해주세요."],
  ["안전 표현", "과장되거나 효능을 단정하는 표현은 줄이고 안전한 표현으로 완화해주세요."]
];

function SectionResultCard({
  section,
  index,
  projectTitle,
  defaultModel,
  onEditSection,
  onOpenViewer,
  editing,
  disabled
}: {
  section: SectionResult;
  index: number;
  projectTitle: string;
  defaultModel: Model;
  onEditSection: (sectionId: string, editRequest: string, model: Model) => void;
  onOpenViewer: () => void;
  editing: boolean;
  disabled: boolean;
}) {
  const [editRequest, setEditRequest] = React.useState("");
  const [editModel, setEditModel] = React.useState<Model>(defaultModel);
  const [editOpen, setEditOpen] = React.useState(false);
  const revisions = React.useMemo(() => ensureSectionRevisions(section), [section]);
  const currentIndex = Math.max(0, revisions.findIndex((revision) => revision.imageUrl === section.imageUrl));
  const [revisionIndex, setRevisionIndex] = React.useState(currentIndex);
  const activeRevision = revisions[revisionIndex] || revisions[0];
  const shortName = section.name.replace(/^S\d+\s*/, "");

  React.useEffect(() => {
    setRevisionIndex(currentIndex);
  }, [currentIndex, revisions.length]);

  function moveRevision(step: number) {
    if (revisions.length <= 1) return;
    setRevisionIndex((current) => (current + step + revisions.length) % revisions.length);
  }

  return (
    <Card className="group overflow-hidden">
      <div className="relative aspect-[9/16] bg-muted">
        {activeRevision?.imageUrl ? (
          <button type="button" className="block h-full w-full cursor-zoom-in" onClick={onOpenViewer} aria-label={`${shortName} 크게 보기`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={activeRevision.imageUrl} alt={`${shortName} ${activeRevision.label}`} className="h-full w-full object-cover" />
          </button>
        ) : (
          <PlaceholderThumb index={index} />
        )}

        <button
          type="button"
          className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-white/90 text-foreground opacity-0 shadow-sm transition hover:bg-white group-hover:opacity-100 focus-visible:opacity-100 disabled:hidden"
          onClick={() => activeRevision?.imageUrl && downloadDataUrl(activeRevision.imageUrl, buildImageFileName(projectTitle, section, index, activeRevision.label))}
          disabled={!activeRevision?.imageUrl}
          aria-label={`${shortName} 이미지 다운로드`}
        >
          <Download className="size-4" />
        </button>

        {revisions.length > 1 ? (
          <>
            <button
              type="button"
              className="absolute left-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-foreground shadow-sm transition hover:bg-white"
              onClick={() => moveRevision(-1)}
              aria-label="이전 이미지 보기"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-foreground shadow-sm transition hover:bg-white"
              onClick={() => moveRevision(1)}
              aria-label="다음 이미지 보기"
            >
              <ChevronRight className="size-4" />
            </button>
            <div className="absolute bottom-2 left-2 rounded-full bg-foreground/85 px-2 py-0.5 text-[11px] font-bold text-background">
              {activeRevision.label} · {revisionIndex + 1}/{revisions.length}
            </div>
          </>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-2 px-4 py-2.5">
        <span className="min-w-0 truncate text-xs font-semibold" title={section.purpose}>{shortName}</span>
        <button
          type="button"
          className={cn(
            "shrink-0 rounded-full px-2.5 py-1 text-xs font-bold text-muted-foreground transition hover:bg-muted hover:text-foreground",
            editOpen && "bg-muted text-foreground"
          )}
          onClick={() => setEditOpen((current) => !current)}
        >
          수정
        </button>
      </div>

      {editOpen ? (
        <div className="grid gap-2 bg-muted/40 p-3">
          <Textarea
            value={editRequest}
            onChange={(event) => setEditRequest(event.target.value)}
            placeholder="어떻게 바꿀까요?"
            className="min-h-16 bg-white text-xs"
          />
          <div className="flex flex-wrap gap-1">
            {quickEditPresets.map(([label, text]) => (
              <button
                key={label}
                type="button"
                className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-muted-foreground transition hover:text-emerald-700"
                onClick={() => setEditRequest((current) => (current ? `${current}\n${text}` : text))}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="text-[11px] font-bold text-muted-foreground underline-offset-2 hover:underline"
              onClick={() => setEditModel((current) => (current === "openai" ? "google" : "openai"))}
            >
              {models[editModel].label}
            </button>
            <Button
              type="button"
              size="sm"
              className="ml-auto"
              onClick={() => onEditSection(section.id, editRequest, editModel)}
              disabled={disabled || editing}
            >
              {editing ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
              적용
            </Button>
          </div>
        </div>
      ) : null}
    </Card>
  );
}

function GenerationProgressPanel({
  progress,
  modelLabel,
  count,
  currentIndex,
  showVideo,
  videoSeed,
  onCancel
}: {
  progress: GenerationProgress;
  modelLabel: string;
  count: number;
  currentIndex: number;
  showVideo: boolean;
  videoSeed: number;
  onCancel: () => void;
}) {
  const video = React.useMemo(() => {
    const index = Math.abs(Math.floor((Math.sin(videoSeed) * 10000) % hanirumYoutubeVideos.length));
    return hanirumYoutubeVideos[index] || hanirumYoutubeVideos[0];
  }, [videoSeed]);
  const isWaiting = progress.percent >= 96;
  const isLongWait = progress.elapsedSeconds >= 120;
  const generationTitle = count > 1
    ? `${count}장 중 ${currentIndex}번째 이미지 생성중입니다.`
    : `${modelLabel} · ${count}장 생성`;
  const statusLabel = isWaiting
    ? isLongWait
      ? "AI가 마무리 작업 중 · 조금 더 걸리고 있어요"
      : "AI가 마무리 작업 중"
    : `${progress.percent}%`;

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-white/55 p-4 backdrop-blur-sm">
      <div className="max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white/95 p-6 shadow-2xl">
        <div className="mb-3 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-emerald-700">생성 진행 중</p>
            <h2 className="mt-1 text-base font-bold">{generationTitle}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{count > 1 ? `${modelLabel} · ` : ""}경과 {formatDuration(progress.elapsedSeconds)}</p>
          </div>
          <div className="text-right">
            <strong className={cn("block leading-none", isWaiting ? "text-base" : "text-2xl")}>{statusLabel}</strong>
            <span className="mt-1 block text-xs text-muted-foreground">
              {isWaiting ? "AI가 이미지 최적화 작업을 진행중입니다." : `예상 ${formatDuration(progress.remainingSeconds)} 남음`}
            </span>
          </div>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-700 ease-out"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
        <div className="mt-3 grid grid-cols-[160px_minmax(0,1fr)] gap-3 text-sm max-sm:grid-cols-1">
          <div className="rounded-2xl bg-emerald-50 px-4 py-2.5 font-bold text-emerald-800">{progress.phase}</div>
          <div className="rounded-2xl bg-muted/60 px-4 py-2.5 leading-relaxed text-muted-foreground">
            {isLongWait && modelLabel.includes("OpenAI")
              ? "OpenAI Image 2.0은 이미지 편집 요청이 2분 이상 걸릴 수 있습니다. 특히 긴 상세페이지 캡처나 참조 이미지가 여러 장이면 응답 시간이 길어질 수 있어요."
              : progress.tip}
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted-foreground max-sm:flex-col max-sm:items-stretch">
          <span>취소하면 화면의 대기 상태를 멈춥니다. 이미 외부 API에 전달된 요청은 서버 로그에 뒤늦게 완료될 수 있습니다.</span>
          <Button type="button" variant="secondary" size="sm" onClick={onCancel}>
            요청 취소
          </Button>
        </div>
        {showVideo ? (
          <div className="mt-4 rounded-2xl bg-muted/40 p-4">
            <div className="mb-2 flex items-center justify-between gap-3 max-sm:flex-col max-sm:items-start">
              <div>
                <p className="text-sm font-bold">기다리는 동안 한이룸 유튜브 영상 함께 봐요!</p>
                <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{video.title}</p>
              </div>
              <a
                href="https://www.youtube.com/@irum_hahn"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700"
              >
                채널 열기 <ExternalLink className="size-3" />
              </a>
            </div>
            <div className="aspect-video overflow-hidden rounded-2xl bg-foreground">
              <iframe
                className="h-full w-full"
                src={`https://www.youtube.com/embed/${video.id}`}
                title={video.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Topbar({ eyebrow, title, children }: { eyebrow: string; title?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-5 flex items-center justify-between gap-4 max-md:flex-col max-md:items-start">
      <div>
        <p className={cn("text-xs font-bold text-muted-foreground", title && "mb-1")}>{eyebrow}</p>
        {title ? <h1 className="max-w-2xl text-2xl font-bold leading-tight tracking-normal max-md:text-xl">{title}</h1> : null}
      </div>
      {children ? <div className="flex flex-wrap items-center gap-1">{children}</div> : null}
    </div>
  );
}

function estimateGenerationSeconds(model: Model, count: number) {
  const setupSeconds = 24;
  const perImageSeconds = model === "google" ? 78 : 65;
  return setupSeconds + Math.max(1, count) * perImageSeconds;
}

function generationPhase(percent: number, elapsedSeconds: number) {
  if (percent >= 96) return elapsedSeconds >= 120 ? "최종 최적화 중" : "마무리 작업";
  if (percent < 15) return "원본 변환";
  if (percent < 32) return "프롬프트 구성";
  if (percent < 76) return "이미지 API 처리";
  return "결과 수신 준비";
}

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  if (minutes <= 0) return `${rest}초`;
  return `${minutes}분 ${rest.toString().padStart(2, "0")}초`;
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

function OptionGroup({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: string[][];
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-bold text-muted-foreground">{label}</label>
      <div className="grid grid-cols-2 gap-2">
        {options.map(([optionValue, optionLabel]) => (
          <button
            key={optionValue}
            className={cn("min-h-10 rounded-2xl bg-white px-3 text-xs font-bold text-muted-foreground transition hover:bg-white/60", value === optionValue && "bg-foreground text-background hover:bg-foreground")}
            onClick={() => onChange(optionValue)}
          >
            {optionLabel}
          </button>
        ))}
      </div>
    </div>
  );
}

function MiniThumb() {
  return (
    <div className="relative h-[56px] w-[44px] overflow-hidden rounded-xl bg-muted">
      <div className="absolute left-1.5 right-1.5 top-1.5 h-3 rounded-md bg-foreground/80" />
      <div className="absolute bottom-1.5 left-1.5 right-1.5 h-6 rounded-lg bg-gradient-to-br from-emerald-500 to-lime-300" />
    </div>
  );
}

function PlaceholderThumb({ index }: { index: number }) {
  return (
    <div className="absolute inset-0 p-3">
      <div className={cn("mb-2 h-2 rounded-full bg-foreground", index % 2 === 0 && "w-2/3")} />
      <div className="mb-1 h-1.5 rounded-full bg-zinc-300" />
      <div className="h-1.5 w-3/4 rounded-full bg-zinc-300" />
      <div className="absolute bottom-3 left-3 right-3 h-[42%] rounded-md bg-gradient-to-br from-emerald-500 to-lime-300" />
    </div>
  );
}
