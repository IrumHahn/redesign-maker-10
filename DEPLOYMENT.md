# 배포 운영 방식

이 프로젝트는 로컬 작업과 라이브 발행을 분리해서 운영합니다.

## 로컬 작업

기본 수정과 테스트는 로컬에서만 확인합니다.

```bash
npm run dev:local
```

확인 주소:

```text
http://localhost:3002/
```

## 검증

라이브 발행 전에는 빌드를 확인합니다.

```bash
npm run build
```

## 라이브 발행

사용자가 "발행", "라이브 반영", "prod 배포"처럼 명시적으로 요청할 때만 Production으로 배포합니다.

```bash
npm run publish
```

라이브 주소(1.5):

```text
https://wizard.irumai.kr/redesign/15
```

Vercel 프로젝트는 `redesign-wizard-15`입니다.

## 1.0과의 분리

1.0은 같은 저장소의 옛 커밋(`v1.0` 태그 = `ec6d1ae`)이며, 별도 Vercel 프로젝트에서 계속 서비스합니다.

```text
https://hanirum-redesign-wizard.vercel.app/
```

이 폴더는 `redesign-wizard-15` 프로젝트에 연결되어 있으므로, 여기서 배포해도 1.0 주소는 영향을 받지 않습니다.
1.0을 되돌릴 일이 생기면 Vercel 대시보드의 Instant Rollback을 사용합니다.

## 경로 규칙

1.5는 `basePath: '/redesign/15'` 아래에서 동작합니다. 새 API 호출이나 정적 자산 링크를 추가할 때는
`@/lib/utils`의 `withBasePath()`를 반드시 거쳐야 합니다. Next.js의 basePath는 `fetch()` 경로를 자동으로 바꿔주지 않습니다.

## 참고

- Preview 배포만 필요할 때는 `npm run deploy:preview`를 사용합니다.
- Production 배포만 바로 실행할 때는 `npm run deploy:prod`를 사용합니다.
- 로컬 브라우저 IndexedDB에 저장된 생성 결과는 Production으로 자동 동기화되지 않습니다.
