# Daily Study - 코딩테스트 스터디 관리 시스템

2주 단위 코딩테스트 스터디의 제출체크/자동인증/환급계산 웹 시스템

## 기술 스택

- **프레임워크**: Next.js 14+ (App Router) + TypeScript
- **데이터베이스**: PostgreSQL (Supabase) + Prisma ORM
- **인증**: NextAuth.js (GitHub OAuth) - 관리자용
- **GitHub 연동**: Octokit - 공용 레포에 코드 자동 커밋
- **스타일링**: Tailwind CSS

## 주요 기능

### 참여자 기능
- 코드 제출 (GitHub 아이디 입력 → 문제 선택 → 코드 작성)
- 제출 시 GitHub 공용 레포에 자동 커밋
- 제출 현황 대시보드 확인

### 관리자 기능
- 기수(Season) 생성/관리 (시작일, 종료일, 참가비)
- 참여자 등록 (GitHub 아이디)
- 날짜별 문제 배정
- 제출 현황 모니터링
- 환급 계산 및 결과 확인

### 환급 규칙
- 1등 (0회 미인증): 중도포기자 금액의 70%
- 2등 (1회 미인증): 20%
- 3등 (2회 미인증): 10%
- 중도포기 (3회 이상): 환급 없음
- 완주자는 참가비 전액 환급

## 요구 환경

- **Node.js**: v20 이상
- **npm**: v10 이상
- **PostgreSQL**: Supabase 또는 로컬 PostgreSQL 15+

## 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.example`을 `.env`로 복사하고 값을 설정하세요:

```bash
cp .env.example .env
```

필요한 환경 변수:
- `DATABASE_URL`: PostgreSQL 연결 문자열
- `DIRECT_URL`: PostgreSQL 직접 연결 문자열 (Supabase pooling 사용 시)
- `NEXTAUTH_URL`: 앱 URL (개발: http://localhost:3000)
- `NEXTAUTH_SECRET`: NextAuth 시크릿 키
- `GITHUB_CLIENT_ID`: GitHub OAuth 앱 클라이언트 ID
- `GITHUB_CLIENT_SECRET`: GitHub OAuth 앱 시크릿
- `GITHUB_TOKEN`: GitHub Personal Access Token (코드 커밋용)
- `GITHUB_REPO_OWNER`: GitHub 레포 소유자
- `GITHUB_REPO_NAME`: GitHub 레포 이름
- `ADMIN_EMAILS`: 관리자 이메일 주소 (쉼표로 구분)

### 3. 데이터베이스 마이그레이션

```bash
npx prisma migrate dev
```

### 4. 개발 서버 실행

```bash
npm run dev
```

## 페이지 구조

### 공개 페이지
- `/` - 홈 (현재 진행중인 기수 정보)
- `/submit` - 코드 제출 페이지
- `/seasons` - 기수 목록
- `/seasons/[id]` - 기수별 제출 현황 대시보드

### 관리자 페이지 (GitHub OAuth 필요)
- `/admin` - 관리자 대시보드
- `/admin/seasons` - 기수 목록/생성
- `/admin/seasons/[id]` - 기수 상세 관리
- `/admin/seasons/[id]/problems` - 문제 관리
- `/admin/seasons/[id]/participants` - 참여자 관리
- `/admin/seasons/[id]/refund` - 환급 계산

## GitHub 연동

1. GitHub에 공용 레포지토리 생성 (예: `daily-study-submissions`)
2. Personal Access Token 생성 (repo 권한 필요)
3. 환경 변수에 토큰과 레포 정보 설정
4. 제출 시 자동으로 `season{번호}/{github_username}/{문제이름}.{확장자}` 경로로 커밋

## 배포

Vercel에 배포하는 것을 권장합니다:

```bash
npx vercel
```

## 라이선스

MIT
