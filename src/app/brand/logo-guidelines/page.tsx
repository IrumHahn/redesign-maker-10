import type { Metadata } from "next";
import { BrandMark } from "@/components/brand-mark";
import { withBasePath } from "@/lib/utils";

export const metadata: Metadata = {
  title: "마법사 시리즈 로고 가이드라인",
  description: "한이룸 마법사 시리즈 공통 로고·컬러·타이포 규칙"
};

const colors = [
  { name: "Wizard Emerald", hex: "#34d399", role: "마크 배경" },
  { name: "Ink", hex: "#171a1f", role: "W 레터마크, 텍스트" },
  { name: "Off-white", hex: "#f7f8f5", role: "반전 배경" },
  { name: "Lime", hex: "#a3e635", role: "보조 강조 (제한 사용)" }
];

const donts = [
  "비율을 왜곡하거나 늘리지 않는다",
  "회전·기울이기를 하지 않는다",
  "마크 색을 바꾸지 않는다 (앱별 색 변주 금지)",
  "그림자·글로우·그라디언트를 넣지 않는다",
  "저대비 배경 위에 올리지 않는다",
  "테두리나 프레임을 추가하지 않는다",
  "W를 다른 글자·아이콘으로 교체하지 않는다",
  "투명도를 낮추지 않는다"
];

function Section({ title, kicker, children }: { title: string; kicker: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl bg-white p-8 shadow-[0_1px_2px_rgba(23,26,31,0.04),0_8px_24px_rgba(23,26,31,0.05)]">
      <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{kicker}</p>
      <h2 className="mb-6 text-xl font-bold">{title}</h2>
      {children}
    </section>
  );
}

export default function LogoGuidelinesPage() {
  return (
    <main className="mx-auto grid max-w-[1240px] gap-6 p-6 pb-24 md:p-10">
      <header className="flex flex-col gap-6 py-6 md:flex-row md:items-end md:justify-between">
        <div className="flex items-center gap-4">
          <BrandMark className="size-16" />
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Hanirum Wizard Series</p>
            <h1 className="text-3xl font-black leading-tight">마법사 시리즈 로고 가이드라인</h1>
          </div>
        </div>
        <p className="max-w-md text-sm text-muted-foreground">
          한이룸 브랜드 안의 두 형제: 실행학교(오렌지 R)와 마법사 시리즈(에메랄드 W).
          같은 문법 — 단색 사각형 + 한 글자 레터마크 — 을 공유하고 색과 글자만 다릅니다.
        </p>
      </header>

      <Section kicker="01 Master mark" title="마스터 마크">
        <div className="grid gap-6 md:grid-cols-[auto_1fr] md:items-center">
          <div className="grid size-56 place-items-center rounded-3xl bg-background">
            <BrandMark className="size-32" />
          </div>
          <div className="grid gap-3 text-sm leading-relaxed">
            <p>에메랄드 정사각형(코너 반경 = 변의 22%) 위에 차콜 <strong>W</strong>. 요소는 배경과 W 두 개뿐이며, 별·문서 등 부가 픽토그램을 붙이지 않습니다.</p>
            <p><span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Code</span> — R = 실행학교, W = 마법사 시리즈. 시리즈 안의 개별 앱은 마크가 아니라 워드마크 텍스트로만 구분합니다.</p>
            <p>W는 폰트가 아니라 SVG 패스로 고정되어 어떤 환경에서도 같은 형태로 렌더링됩니다.</p>
          </div>
        </div>
      </Section>

      <Section kicker="02 Variants" title="변형">
        <div className="grid gap-4 md:grid-cols-3">
          <figure className="grid gap-3">
            <div className="grid h-40 place-items-center rounded-2xl bg-background"><BrandMark className="size-20" /></div>
            <figcaption className="text-sm"><strong>마스터 마크</strong><br /><span className="text-muted-foreground">기본. 밝은 배경 위</span></figcaption>
          </figure>
          <figure className="grid gap-3">
            <div className="grid h-40 place-items-center rounded-2xl bg-foreground"><BrandMark className="size-20" /></div>
            <figcaption className="text-sm"><strong>다크 배경</strong><br /><span className="text-muted-foreground">에메랄드 사각형 그대로 유지</span></figcaption>
          </figure>
          <figure className="grid gap-3">
            <div className="grid h-40 place-items-center rounded-2xl bg-background"><BrandMark mono className="size-20" /></div>
            <figcaption className="text-sm"><strong>단색(모노)</strong><br /><span className="text-muted-foreground">1도 인쇄·흑백 문서 전용</span></figcaption>
          </figure>
        </div>
        <div className="mt-6 rounded-2xl bg-background p-6">
          <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Horizontal lockup</p>
          <div className="flex items-center gap-3">
            <BrandMark className="size-12" />
            <strong className="text-base leading-tight">한이룸의 상세페이지<br />리디자인 마법사 1.5</strong>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">워드마크는 2줄까지 허용. 형식은 <code className="font-mono text-xs">한이룸의 [업무] 마법사 [버전]</code>. 마크와 워드마크 간격은 마크 폭의 1/4.</p>
        </div>
      </Section>

      <Section kicker="03 Color" title="컬러">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {colors.map((c) => (
            <div key={c.hex} className="overflow-hidden rounded-2xl bg-background">
              <div className="h-24" style={{ background: c.hex }} />
              <div className="p-4 text-sm">
                <strong className="block">{c.name}</strong>
                <span className="font-mono text-xs uppercase text-muted-foreground">{c.hex}</span>
                <p className="mt-1 text-muted-foreground">{c.role}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section kicker="04 Typography" title="타이포그래피">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl bg-background p-6">
            <p className="text-3xl font-black">Pretendard</p>
            <p className="mt-2 text-sm text-muted-foreground">600–900. 워드마크, 제목, 본문. 실행학교와 동일.</p>
          </div>
          <div className="rounded-2xl bg-background p-6">
            <p className="font-mono text-2xl uppercase tracking-[0.18em]">SF Mono</p>
            <p className="mt-2 text-sm text-muted-foreground">대문자 + 자간. 라벨, 버전 태그, 캡션.</p>
          </div>
        </div>
      </Section>

      <Section kicker="05 Clear space & size" title="여백과 최소 크기">
        <div className="grid gap-6 md:grid-cols-[auto_1fr] md:items-center">
          <div className="grid size-56 place-items-center rounded-3xl bg-background">
            <div className="relative grid size-40 place-items-center outline-dashed outline-1 outline-muted-foreground/40">
              <BrandMark className="size-[6.5rem]" />
              <span className="absolute -top-5 font-mono text-[10px] uppercase text-muted-foreground">¼ H</span>
            </div>
          </div>
          <ul className="grid gap-2 text-sm">
            <li>• 여백: 마크 높이의 <strong>1/4</strong> 이상을 사방에 비운다.</li>
            <li>• 최소 크기: 디지털 <strong>24px</strong>, 인쇄 <strong>8mm</strong>.</li>
            <li>• 파비콘 16px에서도 배경과 W만으로 인식되도록 설계되어 있다. 축소판에서 요소를 추가하지 않는다.</li>
          </ul>
        </div>
      </Section>

      <Section kicker="06 Don'ts" title="금지 사항">
        <ul className="grid gap-2 text-sm sm:grid-cols-2">
          {donts.map((d) => (
            <li key={d} className="rounded-2xl bg-background px-4 py-3">✕ {d}</li>
          ))}
        </ul>
      </Section>

      <Section kicker="07 Assets" title="파일">
        <ul className="grid gap-2 font-mono text-sm">
          <li><a className="underline" href={withBasePath("/brand/wizard-mark.svg")}>/brand/wizard-mark.svg</a> — 마스터 마크</li>
          <li><a className="underline" href={withBasePath("/brand/wizard-mark-mono.svg")}>/brand/wizard-mark-mono.svg</a> — 단색</li>
          <li><a className="underline" href={withBasePath("/brand/wizard-lockup.svg")}>/brand/wizard-lockup.svg</a> — 가로 락업</li>
        </ul>
        <p className="mt-4 text-sm text-muted-foreground">앱 코드에서는 <code>src/components/brand-mark.tsx</code>의 <code>&lt;BrandMark /&gt;</code>를 사용한다.</p>
      </Section>
    </main>
  );
}
