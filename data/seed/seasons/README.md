# 시즌/문제 시드 데이터

이 폴더에 시즌별 파일을 추가하면 `scripts/seed-seasons.js` 명령으로 언제든 재입력할 수 있습니다.

## 파일 형식
- 파일 확장자: `.js`
- 예시: `season-1.js`, `season-2.js`
- 템플릿: `season-template.js` 참고

## 실행 방법
```bash
node scripts/seed-seasons.js
```

특정 시즌만 넣고 싶다면:
```bash
node scripts/seed-seasons.js --season 1
```

## 주의
- `seasonNumber`는 기존과 동일해야 업데이트됩니다.
- 문제는 `(seasonId, dayNumber)` 기준으로 upsert됩니다.
- 파일을 삭제해도 DB에서 자동 삭제되지는 않습니다.
