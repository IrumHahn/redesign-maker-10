import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";
export const maxDuration = 300;

const OPENAI_IMAGE_MODEL = "gpt-image-2-2026-04-21";
const GOOGLE_NANO_BANANA_2_MODEL = "gemini-3.1-flash-image-preview";
const ANALYSIS_MODEL = process.env.OPENAI_ANALYSIS_MODEL || "gpt-5.5";
const MAX_REFERENCE_IMAGES = 4;

type Provider = "openai" | "google";

type ReferenceImage = {
  name: string;
  mimeType: string;
  buffer: Buffer;
};

type SectionCopy = {
  headline: string;
  subheadline: string;
  bullets: string[];
  cta: string;
};

type Section = {
  section_id: string;
  image_id: string;
  name: string;
  purpose: string;
  source: string;
  copy: SectionCopy;
  prompt: string;
  promptText: string;
};

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const files = form.getAll("files").filter((file): file is File => file instanceof File);
    const productFiles = form.getAll("productFiles").filter((file): file is File => file instanceof File);
    const requestText = String(form.get("request") || "");
    const rolloutRequest = String(form.get("rolloutRequest") || "");
    const provider = String(form.get("model") || "openai") === "google" ? "google" : "openai";
    const channel = String(form.get("channel") || "스마트스토어");
    const ratio = String(form.get("ratio") || "9:16");
    const count = clamp(Number(form.get("count") || 1), 1, 10);
    const startSection = clamp(Number(form.get("startSection") || 1), 1, 10);
    const openaiKey = String(form.get("openaiKey") || "");
    const googleKey = String(form.get("googleKey") || "");
    const heroImageUrl = String(form.get("heroImageUrl") || "");
    const blueprintJson = String(form.get("blueprint") || "");
    const apiKey = provider === "google" ? googleKey : openaiKey;

    console.info(`[generate] request provider=${provider} count=${count} startSection=${startSection} files=${files.length} productFiles=${productFiles.length} channel=${channel}`);

    if (!apiKey) {
      return NextResponse.json(
        { error: provider === "google" ? "Google Nano Banana 2 API 키가 필요합니다." : "OpenAI Image 2.0 API 키가 필요합니다." },
        { status: 400 }
      );
    }

    if (files.length === 0) {
      return NextResponse.json({ error: "기존 상세페이지 이미지 또는 PDF를 업로드해주세요." }, { status: 400 });
    }

    const jobId = randomUUID();
    const sourceReferences = await prepareReferenceImages(files);
    const productReferences = await prepareReferenceImages(productFiles);
    const heroReference = parseDataUrlReference(heroImageUrl);
    console.info(`[generate] references prepared job=${jobId} source=${sourceReferences.length} product=${productReferences.length} hero=${heroReference ? 1 : 0}`);
    if (sourceReferences.length === 0) {
      return NextResponse.json({ error: "이미지 생성에 사용할 참조 이미지가 없습니다. PDF는 브라우저에서 PNG로 변환한 뒤 전송됩니다." }, { status: 400 });
    }

    const modelInfo = modelMeta(provider);
    const payload = {
      request: requestText,
      rolloutRequest,
      options: { channel, ratio, count },
      hasProductImage: productReferences.length > 0
    };

    // 이어서 생성할 때는 첫 요청에서 확정한 카피 블루프린트를 그대로 재사용한다(8장 카피 일관성 유지).
    const reusedAnalysis = parseMaybeJson(blueprintJson);
    const hasReusableBlueprint = Array.isArray((reusedAnalysis as { sections?: unknown })?.sections)
      && ((reusedAnalysis as { sections: unknown[] }).sections.length > 0);

    let analysis: unknown;
    if (hasReusableBlueprint) {
      analysis = reusedAnalysis;
      console.info(`[generate] blueprint reused job=${jobId}`);
    } else {
      console.info(`[generate] analysis start job=${jobId}`);
      analysis = await analyzeSource({
        provider,
        apiKey,
        references: [...productReferences, ...sourceReferences].slice(0, MAX_REFERENCE_IMAGES),
        payload,
        modelInfo
      });
      console.info(`[generate] analysis done job=${jobId}`);
    }

    const sections = buildSections(count, startSection, payload, analysis, modelInfo);
    const projectTitle = inferProjectTitle(analysis, channel);

    const generatedSections = [];
    const failedSections = [];
    for (const [index, section] of sections.entries()) {
      const references = buildSectionReferences({
        sectionId: section.section_id,
        productReferences,
        sourceReferences,
        heroReference
      });
      try {
        console.info(`[generate] ${provider} ${section.section_id} start (${index + 1}/${sections.length}) refs=${references.length}`);
        const image = provider === "google"
          ? await generateGoogleImage({ apiKey, prompt: section.promptText, references })
          : await generateOpenAIImage({ apiKey, prompt: section.promptText, references });

        generatedSections.push({
          ...section,
          imageUrl: `data:${image.mimeType};base64,${image.buffer.toString("base64")}`,
          mimeType: image.mimeType
        });
        console.info(`[generate] ${provider} ${section.section_id} done bytes=${image.buffer.length} mime=${image.mimeType}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : "이미지 생성 실패";
        console.error(`[generate] ${provider} ${section.section_id} failed: ${message}`);
        failedSections.push({
          ...section,
          error: message
        });
        if (generatedSections.length === 0) {
          throw new Error(`${section.name} 생성 실패: ${humanizeProviderError(message)}`);
        }
        break;
      }
    }

    console.info(`[generate] complete provider=${provider} generated=${generatedSections.length} failed=${failedSections.length}`);

    return NextResponse.json({
      project: {
        id: jobId,
        title: projectTitle,
        channel,
        model: provider,
        modelLabel: modelInfo.label,
        modelId: modelInfo.id,
        count: generatedSections.length,
        ratio,
        status: failedSections.length > 0 ? "부분완료" : "완료",
        files: files.map((file) => file.name),
        request: requestText,
        createdAt: new Date().toISOString(),
        analysis,
        sections: generatedSections,
        failedSections,
        warning: failedSections.length > 0
          ? `${generatedSections.length}장은 생성됐고 ${failedSections.length}장 이후는 실패했습니다. 요청 제한이면 잠시 후 섹션별 재생성을 실행하세요.`
          : ""
      }
    });
  } catch (error) {
    console.error("[api/generate]", error);
    return NextResponse.json({ error: error instanceof Error ? humanizeProviderError(error.message) : "이미지 생성 중 오류가 발생했습니다." }, { status: 500 });
  }
}

type AnalysisPayload = {
  request: string;
  rolloutRequest: string;
  options: { channel: string; ratio: string; count: number };
  hasProductImage: boolean;
};

async function analyzeSource({
  provider,
  apiKey,
  references,
  payload,
  modelInfo
}: {
  provider: Provider;
  apiKey: string;
  references: ReferenceImage[];
  payload: AnalysisPayload;
  modelInfo: ReturnType<typeof modelMeta>;
}) {
  const prompt = [
    "너는 한국 이커머스 상세페이지 CRO 카피라이터다.",
    "업로드된 기존 상세페이지를 근거로 리디자인 블루프린트를 한국어 JSON으로 작성하라.",
    `판매 채널: ${payload.options.channel}`,
    `추가 요청사항: ${payload.request || "전환율 중심으로 리디자인"}`,
    payload.rolloutRequest ? `히어로 검토 후 반영할 요청: ${payload.rolloutRequest}` : "히어로 검토 후 요청: 없음",
    "",
    "# 사실 안전장치(강제)",
    "- 업로드 이미지와 사용자 입력에서 확인되지 않는 브랜드명/수치/인증/효능/리뷰를 새로 만들지 말 것",
    "- 근거가 부족하면 FAQ/보증/사용법 같은 안전한 구조로 대체할 것",
    "- headline/subheadline/bullets/cta는 제작자용 설명문(\"이 섹션은...\")이 아니라 소비자에게 그대로 보여줄 문장으로 쓸 것",
    "- 규제 리스크가 있으면 단정 표현을 피하고 안전한 표현으로 완화할 것",
    "",
    "# 출력 형식",
    "JSON 키: product_inferred, diagnostic_summary, strategy, sections, compliance_notes",
    "sections는 S1~S8 8개 배열이며 각 항목은 다음 형식을 반드시 지킨다.",
    '{ "section_id": "S1", "headline": "20자 이내", "subheadline": "35자 이내", "bullets": ["18자 이내", "18자 이내", "18자 이내"], "cta": "10자 이내 또는 빈 문자열", "evidence": "원본에서 확인된 근거만" }',
    "섹션 역할: S1 히어로 / S2 문제공감 체크리스트 / S3 베네핏 3개 / S4 USP 차별점 / S5 근거·신뢰 / S6 사용법 / S7 후기 / S8 FAQ·오퍼",
    "cta는 S1, S5, S8에 반드시 넣는다.",
    "모바일에서 크게 읽히도록 글자 수 제한을 넘기지 말고, 섹션마다 다른 헤드라인을 쓴다.",
    `이미지 생성 모델: ${modelInfo.label} (${modelInfo.id})`
  ].join("\n");

  try {
    if (provider === "google") {
      return await analyzeWithGoogle({ apiKey, prompt, references });
    }
    return await analyzeWithOpenAI({ apiKey, prompt, references });
  } catch (error) {
    return {
      product_inferred: { category: "업로드 자료 기반 추정", confidence: 0.4 },
      diagnostic_summary: `AI 분석 호출 실패: ${error instanceof Error ? error.message : "unknown"}`,
      strategy: "원본 자료의 제품컷/USP/근거를 보존하고, 8장 섹션 구조로 전환 설계를 적용합니다.",
      sections: [],
      compliance_notes: "근거 없는 수치, 리뷰, 인증, 효과 표현은 생성하지 않습니다."
    };
  }
}

async function analyzeWithOpenAI({ apiKey, prompt, references }: { apiKey: string; prompt: string; references: ReferenceImage[] }) {
  const content: Array<{ type: "input_text"; text: string } | { type: "input_image"; image_url: string }> = [{ type: "input_text", text: prompt }];
  for (const reference of references.slice(0, MAX_REFERENCE_IMAGES)) {
    content.push({
      type: "input_image",
      image_url: `data:${reference.mimeType};base64,${reference.buffer.toString("base64")}`
    });
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: ANALYSIS_MODEL,
      input: [{ role: "user", content }]
    })
  });

  const data = await readJsonResponse(response);
  if (!response.ok) throw new Error(withRequestId(data?.error?.message || "OpenAI 분석 요청 실패", response));
  const text = data.output_text || extractOpenAIText(data);
  return parseMaybeJson(text);
}

async function analyzeWithGoogle({ apiKey, prompt, references }: { apiKey: string; prompt: string; references: ReferenceImage[] }) {
  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [{ text: prompt }];
  for (const reference of references.slice(0, MAX_REFERENCE_IMAGES)) {
    parts.push({
      inlineData: {
        mimeType: reference.mimeType,
        data: reference.buffer.toString("base64")
      }
    });
  }

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GOOGLE_NANO_BANANA_2_MODEL}:generateContent`, {
    method: "POST",
    headers: {
      "x-goog-api-key": apiKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ contents: [{ parts }] })
  });

  const data = await readJsonResponse(response);
  if (!response.ok) throw new Error(withRequestId(data?.error?.message || "Google 분석 요청 실패", response));
  const text = data?.candidates?.[0]?.content?.parts?.find((part: { text?: string }) => part.text)?.text || "";
  return parseMaybeJson(text);
}

async function generateOpenAIImage({ apiKey, prompt, references }: { apiKey: string; prompt: string; references: ReferenceImage[] }) {
  const form = new FormData();
  form.append("model", OPENAI_IMAGE_MODEL);
  form.append("prompt", prompt);
  form.append("size", "1152x2048");
  form.append("quality", "low");
  form.append("output_format", "png");

  for (const reference of references.slice(0, MAX_REFERENCE_IMAGES)) {
    form.append("image[]", new Blob([new Uint8Array(reference.buffer)], { type: reference.mimeType }), reference.name);
  }

  const response = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form
  });

  const data = await readJsonResponse(response);
  if (!response.ok) throw new Error(withRequestId(data?.error?.message || "OpenAI Image 2.0 생성 실패", response));
  const imageBase64 = data?.data?.[0]?.b64_json;
  if (!imageBase64) throw new Error("OpenAI 응답에 이미지 데이터가 없습니다.");
  return { mimeType: "image/png", buffer: Buffer.from(imageBase64, "base64") };
}

async function generateGoogleImage({ apiKey, prompt, references }: { apiKey: string; prompt: string; references: ReferenceImage[] }) {
  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [{ text: prompt }];
  for (const reference of references.slice(0, MAX_REFERENCE_IMAGES)) {
    parts.push({
      inlineData: {
        mimeType: reference.mimeType,
        data: reference.buffer.toString("base64")
      }
    });
  }

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GOOGLE_NANO_BANANA_2_MODEL}:generateContent`, {
    method: "POST",
    headers: {
      "x-goog-api-key": apiKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ contents: [{ parts }] })
  });

  const data = await readJsonResponse(response);
  if (!response.ok) throw new Error(withRequestId(data?.error?.message || "Google Nano Banana 2 생성 실패", response));
  const imagePart = data?.candidates?.[0]?.content?.parts?.find((part: { inlineData?: { data?: string } }) => part.inlineData);
  if (!imagePart?.inlineData?.data) throw new Error("Google 응답에 이미지 데이터가 없습니다.");
  return {
    mimeType: imagePart.inlineData.mimeType || "image/png",
    buffer: Buffer.from(imagePart.inlineData.data, "base64")
  };
}

/** 제품컷 → 히어로(스타일 통일) → 원본 순으로 참조 이미지 예산을 채운다. */
function buildSectionReferences({
  sectionId,
  productReferences,
  sourceReferences,
  heroReference
}: {
  sectionId: string;
  productReferences: ReferenceImage[];
  sourceReferences: ReferenceImage[];
  heroReference: ReferenceImage | null;
}) {
  const references: ReferenceImage[] = [];
  references.push(...productReferences.slice(0, 2));
  if (heroReference && sectionId !== "S1") references.push(heroReference);
  for (const reference of sourceReferences) {
    if (references.length >= MAX_REFERENCE_IMAGES) break;
    references.push(reference);
  }
  return references.slice(0, MAX_REFERENCE_IMAGES);
}

function buildSections(
  count: number,
  startSection: number,
  payload: AnalysisPayload,
  analysis: unknown,
  modelInfo: ReturnType<typeof modelMeta>
): Section[] {
  return sectionTemplates(count, startSection).map((template) => {
    const copy = pickSectionCopy(analysis, template.id);
    const promptText = [
      "너는 한국 커머스 상세페이지 섹션 이미지 생성 엔진이다.",
      `이미지 생성 모델: ${modelInfo.label} (${modelInfo.id})`,
      "세로형 9:16 상세페이지 섹션 이미지 1장을 생성한다.",
      `섹션: ${template.name}`,
      `목적: ${template.purpose}`,
      `권장 레이아웃: ${template.layout}`,
      `판매 채널: ${payload.options.channel}`,
      `추가 요청사항: ${payload.request || "전환율 중심으로 리디자인"}`,
      payload.rolloutRequest ? `히어로 검토 후 사용자가 요청한 반영사항: ${payload.rolloutRequest}` : "히어로 검토 후 반영사항: 없음",
      "",
      "# 이미지에 넣을 문구 (아래 문구를 그대로 사용하고 새 문구를 지어내지 않는다)",
      `헤드라인: ${copy.headline}`,
      `서브헤드: ${copy.subheadline}`,
      copy.bullets.length > 0 ? `불릿(각각 한 줄): ${copy.bullets.join(" / ")}` : "불릿: 없음",
      copy.cta ? `CTA 버튼: ${copy.cta}` : "CTA 버튼: 없음",
      "",
      "# 디자인 규칙",
      "스타일: 한국 스마트스토어에서 흔히 보는 완성형 상세페이지 디자인을 따른다. 둥근 정보 카드, 체크 아이콘 목록, 번호 배지, 아이콘 타일, 포인트 컬러 강조 같은 익숙한 구성 요소를 사용하고, 밝은 배경에 정돈된 그리드로 배치한다.",
      "모바일 가독성: 스마트폰 세로 화면에서 그대로 읽히도록 크게 만든다. 헤드라인 글자 높이는 이미지 폭의 8% 이상, 본문과 불릿은 3.5% 이상으로 한다. 텍스트 블록은 한 장에 최대 5개, 불릿은 3개까지만 넣는다. 작은 각주, 빽빽한 표, 3단 이상 좌우 분할, 이미지 폭 3% 미만의 작은 글씨는 사용하지 않는다.",
      payload.hasProductImage
        ? "제품 사진 규칙: 첨부된 제품 사진의 제품 형태, 패키지 디자인, 라벨 문구, 색상, 로고를 그대로 유지한다. 제품을 새로 그리거나 변형하거나 다른 제품으로 바꾸지 않는다."
        : "제품 사진 규칙: 업로드된 원본의 제품컷 형태, 패키지, 색감을 그대로 보존한다. 제품을 새로 지어내지 않는다.",
      template.id === "S1"
        ? "통일 규칙: 이 히어로가 8장 전체의 스타일 기준이 된다. 배경 색, 포인트 색, 폰트 감각, 카드 스타일을 명확하게 잡는다."
        : "통일 규칙: 첨부된 히어로 섹션 이미지와 같은 배경 색, 포인트 색, 폰트 감각, 카드 스타일을 사용하되, 레이아웃 구성은 반드시 다르게 한다. 모든 섹션이 큰 상단 헤드라인 + 중앙 제품컷으로 반복되면 안 된다.",
      "브랜드 규칙: '한이룸', 'HANEERUM', 'HR'은 도구 이름일 뿐이며 제품 브랜드가 아니다. 이미지 안에 절대 쓰지 않는다. 제품 브랜드명과 제품명은 업로드된 원본이나 제품 패키지에서 확인되는 이름만 사용한다.",
      "안전 규칙: 근거 없는 수치, 리뷰, 인증, 효과를 만들지 않는다. 한 장에 메시지 하나만 담는다. 오탈자 없는 자연스러운 한국어로 표기한다."
    ].join("\n");

    return {
      section_id: template.id,
      image_id: `IMG_${template.id}`,
      name: template.name,
      purpose: template.purpose,
      source: template.source,
      copy,
      prompt: promptText.replaceAll("\n", "<br>"),
      promptText
    };
  });
}

/** 분석이 확정한 섹션 카피를 꺼낸다. 분석 실패 시에는 템플릿 목적을 그대로 쓰도록 빈 값을 준다. */
function pickSectionCopy(analysis: unknown, sectionId: string): SectionCopy {
  const sections = (analysis as { sections?: unknown })?.sections;
  const list = Array.isArray(sections) ? sections : [];
  const match = list.find((item) => {
    const id = (item as { section_id?: unknown })?.section_id;
    return typeof id === "string" && id.toUpperCase() === sectionId;
  }) as Record<string, unknown> | undefined;

  if (!match) {
    return { headline: "", subheadline: "", bullets: [], cta: "" };
  }

  const bullets = Array.isArray(match.bullets)
    ? match.bullets.filter((bullet): bullet is string => typeof bullet === "string" && bullet.trim().length > 0).slice(0, 3)
    : [];

  return {
    headline: typeof match.headline === "string" ? match.headline.trim() : "",
    subheadline: typeof match.subheadline === "string" ? match.subheadline.trim() : "",
    bullets,
    cta: typeof match.cta === "string" ? match.cta.trim() : ""
  };
}

async function prepareReferenceImages(files: File[]): Promise<ReferenceImage[]> {
  const references: ReferenceImage[] = [];
  for (const file of files) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const safeName = sanitizeFileName(file.name || "upload");
    const mimeType = file.type || guessMimeType(safeName);

    if (mimeType.startsWith("image/")) {
      references.push({ name: safeName, mimeType, buffer });
    }
  }
  return references.slice(0, MAX_REFERENCE_IMAGES);
}

function parseDataUrlReference(value: string): ReferenceImage | null {
  const match = value.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  const mimeType = match[1];
  // 파일명 확장자가 실제 mime과 다르면 OpenAI 편집 API가 입력을 거부한다.
  const extension = mimeType === "image/jpeg" ? "jpg" : mimeType === "image/webp" ? "webp" : "png";
  return {
    name: `hero-style-reference.${extension}`,
    mimeType,
    buffer: Buffer.from(match[2], "base64")
  };
}

function sectionTemplates(count: number, startSection = 1) {
  const templates = [
    ["S1 히어로", "3초 안에 제품, 타겟, 핵심 약속, CTA를 전달합니다.", "제품컷, 대표 USP", "제품컷을 크게 쓰는 히어로. 상단은 짧은 약속, 하단은 CTA 버튼과 핵심 배지. 상세페이지의 첫 장답게 가장 강한 비주얼."],
    ["S2 문제 공감", "고객이 자기 상황이라고 느끼는 체크리스트를 배치합니다.", "사용 전 고민 문구", "체크 아이콘이 붙은 고민 카드 3~4개를 세로로 쌓는다. 제품컷은 작게 보조로만 사용."],
    ["S3 베네핏 3개", "기능 나열을 체감 언어로 바꿔 기억 구조를 만듭니다.", "기능 설명, 사용 장점", "01/02/03 번호 배지가 붙은 가로 카드 3개. 각 카드에 아이콘 또는 사용 장면 사진."],
    ["S4 USP 차별점", "경쟁 제품 대비 선택 이유를 한 문장으로 압축합니다.", "소재, 구성, 가격", "선택 이유 카드 또는 간단한 2열 비교 구조. 제품컷은 우측 하단에 작게."],
    ["S5 근거/신뢰", "결과, 조건, 해석의 3단 구조로 신뢰를 설계합니다.", "인증, 수치, 테스트", "인증 배지와 데이터 카드 중심의 밝은 정보 패널. 하단에 CTA 버튼."],
    ["S6 사용법", "선택지를 2~3개로 줄여 구매 후 사용 장벽을 낮춥니다.", "루틴, 구성품", "STEP 1·2·3 타임라인. 각 스텝에 사용 장면 사진을 함께 배치."],
    ["S7 후기 카드", "실제 리뷰가 있을 때 사용감 문장 후기 카드로 구성합니다.", "리뷰, 평점", "말풍선 형태의 후기 카드 3개. 제품컷은 배경 요소로만 약하게 사용."],
    ["S8 FAQ/오퍼", "마지막 구매 저항을 해소하고 CTA로 마무리합니다.", "배송, AS, 혜택", "Q&A 카드 3개와 하단의 큰 CTA 버튼. 마지막 행동 유도에 집중."],
    ["S9 비교/보증", "선택 불안을 줄이는 비교표와 보증 구조를 제안합니다.", "보증, 비교 근거", "간단한 비교 매트릭스와 보증 배지 중심."],
    ["S10 최종 CTA", "혜택과 구매 이유를 다시 압축해 마지막 행동을 유도합니다.", "오퍼, 사은품, 한정 조건", "핵심 요약 3개와 큰 구매 버튼을 하단에 강하게 배치."]
  ];

  return templates
    .map(([name, purpose, source, layout], index) => ({ id: `S${index + 1}`, name, purpose, source, layout }))
    .slice(startSection - 1, startSection - 1 + count);
}

function inferProjectTitle(analysis: unknown, channel: string) {
  const product = typeof analysis === "object" && analysis && "product_inferred" in analysis
    ? (analysis as { product_inferred?: Record<string, unknown> }).product_inferred || {}
    : {};
  const brand = pickString(product, ["brand_name", "brand", "manufacturer", "maker"]);
  const productName = pickString(product, ["product_name", "name", "product", "title"]);
  const category = pickString(product, ["category", "product_category"]);

  if (brand && productName) {
    return productName.includes(brand) ? `${productName} 리디자인` : `${brand} ${productName} 리디자인`;
  }
  if (productName) return `${productName} 리디자인`;
  if (category) return `${category} 상세페이지 리디자인`;
  return `${channel} 상세페이지 리디자인`;
}

function pickString(source: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function parseMaybeJson(text: string) {
  const raw = String(text || "").trim();
  const jsonText = raw.match(/\{[\s\S]*\}/)?.[0];
  if (!jsonText) return { summary: raw };
  try {
    return JSON.parse(jsonText);
  } catch {
    return { summary: raw };
  }
}

function extractOpenAIText(data: { output?: Array<{ content?: Array<{ text?: string }> }> }) {
  return data.output?.flatMap((item) => item.content || []).map((content) => content.text || "").filter(Boolean).join("\n") || "";
}

function modelMeta(provider: Provider) {
  if (provider === "google") {
    return { provider: "google" as const, label: "Google Nano Banana 2", id: GOOGLE_NANO_BANANA_2_MODEL };
  }
  return { provider: "openai" as const, label: "OpenAI Image 2.0", id: OPENAI_IMAGE_MODEL };
}

async function readJsonResponse(response: Response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { error: { message: text || response.statusText } };
  }
}

function withRequestId(message: string, response: Response) {
  const requestId = response.headers.get("x-request-id");
  return requestId ? `${message} (request_id: ${requestId})` : message;
}

function humanizeProviderError(message: string) {
  if (message.includes("Incorrect API key provided")) {
    return [
      "OpenAI API 키가 올바르지 않습니다.",
      "API 키 설정에서 기존 키를 삭제한 뒤 OpenAI Platform에서 발급한 최신 키를 다시 입력해주세요.",
      message.match(/request_id: [^)]+/)?.[0] || ""
    ].filter(Boolean).join(" ");
  }
  if (message.includes("invalid_api_key")) {
    return [
      "API 키가 올바르지 않습니다.",
      "선택한 이미지 생성 모델에 맞는 API 키를 다시 입력해주세요.",
      message.match(/request_id: [^)]+/)?.[0] || ""
    ].filter(Boolean).join(" ");
  }
  if (message.includes("must be verified") && message.includes("gpt-image-2-2026-04-21")) {
    return [
      "OpenAI Image 2.0 사용 권한이 아직 없습니다.",
      "이 모델은 OpenAI 조직 인증이 필요합니다.",
      "OpenAI Platform > Settings > Organization > General에서 Verify Organization을 완료한 뒤 15분 정도 기다려주세요.",
      message.match(/request_id: [^)]+/)?.[0] || ""
    ].filter(Boolean).join(" ");
  }
  if (message.includes("does not have access to model") && message.includes("gpt-image-2-2026-04-21")) {
    return [
      "현재 입력한 OpenAI API 키의 프로젝트가 OpenAI Image 2.0 모델에 접근할 수 없습니다.",
      "OpenAI 조직 인증, 프로젝트 권한, 결제 상태를 확인한 뒤 Image 2.0 권한이 있는 프로젝트의 API 키를 다시 입력해주세요.",
      message.match(/request_id: [^)]+/)?.[0] || ""
    ].filter(Boolean).join(" ");
  }
  if (message.includes("Billing hard limit has been reached")) {
    return [
      "OpenAI 결제 한도에 도달해 이미지 생성이 중단되었습니다.",
      "OpenAI Platform의 Billing 한도 또는 사용량 제한을 올린 뒤 다시 시도해주세요.",
      message.match(/request_id: [^)]+/)?.[0] || ""
    ].filter(Boolean).join(" ");
  }
  if (message.includes("exceeded your current quota") || message.includes("Quota exceeded")) {
    return "Google Nano Banana 2 API 할당량을 초과했습니다. Google AI Studio 또는 Cloud Console에서 현재 사용량과 rate limit을 확인한 뒤 잠시 후 다시 시도해주세요.";
  }
  if (message.includes("Invalid image file or mode") || message.includes("Invalid input image")) {
    return [
      "업로드 이미지 형식이 OpenAI Image 2.0 편집 입력과 맞지 않습니다.",
      "앱에서 PNG 변환/분할 후 다시 전송하도록 되어 있으니 새로고침 후 다시 생성해주세요.",
      message.match(/request_id: [^)]+/)?.[0] || ""
    ].filter(Boolean).join(" ");
  }
  return message;
}

function sanitizeFileName(name: string) {
  return String(name).replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 120) || "upload";
}

function guessMimeType(name: string) {
  const ext = name.slice(name.lastIndexOf(".")).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  if (ext === ".pdf") return "application/pdf";
  return "application/octet-stream";
}

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}
