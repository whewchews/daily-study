# Supabase 비용 최적화 현황

> 마지막 검토: 2026-02-02

## 개요

이 문서는 프로젝트의 Supabase 사용 현황과 비용 최적화 상태를 기록합니다.

---

## 현재 적용된 최적화

### 1. Connection Pooling (PgBouncer)

| 항목 | 값 |
|------|-----|
| 상태 | 적용됨 |
| 포트 | 6543 |
| 모드 | Transaction mode |

```
# .env 설정
DATABASE_URL="postgresql://...@db.xxx.supabase.co:6543/postgres?pgbouncer=true"
```

**효과:** 연결 수 최소화, Serverless 환경에서 cold start 시 연결 재사용

### 2. Prisma 클라이언트 싱글톤

```typescript
// src/lib/prisma.ts
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
export const prisma = globalForPrisma.prisma || new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

**효과:** 개발 환경에서 Hot Reload 시 연결 누수 방지

### 3. React Query 클라이언트 캐싱

| 설정 | 값 | 설명 |
|------|-----|------|
| staleTime | 5분 | 데이터를 "신선"하게 유지하는 시간 |
| gcTime | 30분 | 캐시 데이터 유지 시간 |
| refetchOnWindowFocus | false | 창 포커스 시 자동 refetch 비활성화 |

**효과:** 동일한 데이터에 대한 중복 API 호출 감소

### 4. 미사용 Supabase 기능

다음 기능들은 사용하지 않아 추가 비용이 발생하지 않습니다:

- **Realtime:** 실시간 구독 미사용
- **Storage:** 파일은 GitHub에 저장
- **Edge Functions:** 미사용
- **Vector/AI:** 미사용

### 5. 데이터베이스 인덱스

```prisma
// 자동 생성된 인덱스 (unique 제약조건)
model Season { @@unique([year, month]) }
model Problem { @@unique([seasonId, day]) }
model Submission { @@unique([participantId, problemId]) }
model SeasonParticipant { @@unique([seasonId, userId]) }
```

**효과:** 주요 조회 쿼리에 대한 효율적인 인덱스 커버리지

---

## 현재 사용량 추정

| 지표 | 예상 값 | Free Tier 한도 |
|------|---------|---------------|
| 월간 쿼리 | ~7,000-10,000회 | 무제한* |
| 데이터 증가 | ~10MB/월 | 500MB |
| 동시 연결 | < 10 | 60 (pooler) |
| 동시 사용자 | < 100명 | - |

*쿼리 수는 무제한이나 컴퓨팅 시간에 제한이 있을 수 있음

---

## 선택적 최적화 (현재 미적용)

아래 최적화는 현재 규모에서 ROI가 낮아 적용하지 않았습니다.

### 트랜잭션 최적화

**대상:** `/api/submissions` POST (4-5개 쿼리)

```typescript
// 현재: 개별 쿼리
const season = await prisma.season.findUnique(...)
const participant = await prisma.seasonParticipant.findUnique(...)
const submission = await prisma.submission.upsert(...)

// 최적화 시: 트랜잭션
await prisma.$transaction([...])
```

**적용 시점:** 제출 API 호출이 분당 100회 이상일 때

### 서버사이드 캐싱

**대상:** `/api/dashboard/[seasonId]` (복합 쿼리)

```typescript
// Redis 또는 메모리 캐싱
import { unstable_cache } from 'next/cache'

const getCachedDashboard = unstable_cache(
  async (seasonId) => fetchDashboard(seasonId),
  ['dashboard'],
  { revalidate: 300 } // 5분
)
```

**적용 시점:** 동시 접속자 50명 이상

### 데이터 정리

**대상:** NextAuth 세션 및 토큰 테이블

```sql
-- 만료된 세션 정리
DELETE FROM "Session" WHERE "expires" < NOW();

-- 만료된 인증 토큰 정리
DELETE FROM "VerificationToken" WHERE "expires" < NOW();
```

**적용 시점:** 세션 테이블이 10,000행 이상

---

## 규모 확장 시 로드맵

| 단계 | 조건 | 대응 |
|------|------|------|
| 1 | 참가자 500명+ | Next.js cache로 대시보드 캐싱 |
| 2 | 동시 접속 50명+ | Supabase Read Replica 검토 |
| 3 | 제출 10만건+ | 오래된 제출 아카이빙 |
| 4 | Free Tier 초과 | Pro 플랜 전환 ($25/월) |

---

## 모니터링 체크리스트

정기적으로 확인할 항목:

- [ ] Supabase Dashboard > Database > Database Size
- [ ] Supabase Dashboard > Database > Active Connections
- [ ] Supabase Dashboard > Reports > API Requests
- [ ] Vercel Dashboard > Analytics > Function Invocations

---

## 참고 자료

- [Supabase Pricing](https://supabase.com/pricing)
- [Prisma Connection Pooling](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management)
- [React Query Caching](https://tanstack.com/query/latest/docs/react/guides/caching)
