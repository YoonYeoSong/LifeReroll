# LifeReroll

> 현생은 리롤이 안 되지만, 번호는 리롤할 수 있습니다.

LifeReroll은 대한민국 로또 6/45의 포함된 과거 당첨번호를 바탕으로 10개의 번호 조합을 브라우저에서 생성하는 무료 웹서비스입니다. 회원가입, API, 데이터베이스, 서버 계산이 필요하지 않습니다.

## Features

- 한 번의 Reroll로 서로 다른 방식의 10게임 생성 (Historical 2, Pattern 2, Coverage 2, Pure Random 2, Balanced 1, Ensemble 1)
- 실제 포함 데이터에서 계산한 전체·최근 100회·Pair 통계
- 전체 출현빈도, 최근 빈도, Pair 빈도, 조합 형태를 섞은 Pattern Pick
- 10게임 내 순서 무관 완전 동일 조합 방지 및 Coverage 기반 분산
- `/statistics`의 빈도, Hot/Cold Number, Pair Top 20
- 모바일 우선 반응형 UI 및 접근 가능한 키보드 포커스

## How picks work

**Historical Pick**은 1~45번 각각의 전체 출현 횟수를 가중치로 사용하여, 한 게임 안에서는 중복 없이 번호를 뽑습니다. 높은 빈도의 번호가 약간 더 선택될 수 있지만 고정되지 않습니다.

**Pattern Pick**은 브라우저에서 3,000개의 후보를 생성해 다음의 정규화된 점수를 평가합니다.

- 35% Overall Frequency
- 25% Recent 100
- 25% Pair Frequency
- 15% Combination Shape (홀짝, 구간 분포, 합계, 간격, 연속수, 끝자리 집중)

**Coverage Pick**은 앞선 게임과의 공통 번호, 번호 반복, 전체 번호 범위를 점수화해 결과가 지나치게 닮지 않도록 2게임을 고릅니다. **Pure Random Pick**은 통계를 사용하지 않는 균등 Fisher–Yates 셔플입니다. **Balanced Pick**은 과거 조합 분포를 참고해 극단적인 홀짝·구간·합계·연속 번호 형태를 피할 뿐, 당첨 확률을 예측하지 않습니다. 마지막 **Ensemble Pick**은 Historical, Pattern, Coverage, Balance 점수를 후보별 0~100으로 정규화한 뒤 25%·25%·30%·20% 비율로 합산합니다.

## Tech stack

- Next.js 16, React 19, TypeScript (strict)
- App Router, Tailwind CSS 4
- Vitest
- Static JSON data, client-side calculations only

## Local development

```bash
pnpm install
pnpm dev
pnpm lint
pnpm test
pnpm build
```

`npm install`, `npm run dev`, `npm run lint`, `npm test`, `npm run build`도 같은 방식으로 사용할 수 있습니다.

## Deployment

GitHub 저장소를 Vercel에 Import한 뒤 Framework Preset을 Next.js로 두고 배포하면 됩니다. 환경 변수나 별도 서버 설정은 필요하지 않습니다.

## Lottery data

데이터는 [`src/data/lotto-history.json`](src/data/lotto-history.json)에 정적 스냅샷으로 포함됩니다. 각 객체는 `round`, `numbers`, `bonus`를 가지며, 보너스 번호는 통계와 생성에서 제외합니다.

갱신 시 공개 당첨 데이터에서 `round` 순서의 JSON을 준비하고, 중복 회차·1~45 범위·6개 번호 여부를 확인한 뒤 파일을 교체합니다. 개발 환경에서는 `validateLottoHistory`가 잘못된 데이터를 즉시 오류로 표시합니다. 런타임에 외부 API를 호출하지 않습니다.

## Disclaimer

LifeReroll은 로또 당첨 결과를 예측하지 않습니다. 정상적인 로또 추첨에서 모든 6개 번호 조합의 당첨 확률은 동일합니다. 이 서비스는 과거 데이터를 활용해 번호를 선택하는 하나의 재미있는 방법을 제공합니다.
