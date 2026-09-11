import { formatWon } from "./format";
import type { FundingAnalysis, HousingType, Reason, UserProfile } from "./types";
export function analyzeFunding(profile: UserProfile, housingType: HousingType): FundingAnalysis {
  const ownFunds = profile.assets.availableCash + profile.assets.savings + profile.assets.financialAssets;
  const giftFunds = profile.familySupport.gift?.amount ?? 0; const familyLoanFunds = profile.familySupport.loan?.amount ?? 0;
  const debtBalance = profile.debts.reduce((sum, debt) => sum + debt.balance, 0);
  const estimated = Math.max(0, Math.min(Math.round(housingType.estimatedTotalCost * 0.5), 300_000_000 - debtBalance));
  const mortgage = Math.min(estimated, Math.round(housingType.price * 0.4));
  const generalLoan = Math.max(0, estimated - mortgage);
  const totalExpectedFunds = ownFunds + giftFunds + familyLoanFunds + estimated; const shortfall = Math.max(0, housingType.estimatedTotalCost - totalExpectedFunds);
  const status = totalExpectedFunds >= housingType.estimatedTotalCost ? "sufficient" : totalExpectedFunds >= housingType.estimatedTotalCost * .85 ? "possible" : totalExpectedFunds >= housingType.estimatedTotalCost * .65 ? "additional_funds_needed" : "insufficient";
  const reasons: Reason[] = [{ label: "자기자금", status, detail: `현금·예금·금융자산 합계 ${formatWon(ownFunds)}입니다.` }, { label: "가족 지원", status: "possible", detail: `증여 ${formatWon(giftFunds)}, 차용 ${formatWon(familyLoanFunds)}을 분리해 반영했습니다.` }, { label: "예상 금융조달", status: "conditionallyEligible", detail: `주택담보대출 ${formatWon(mortgage)}, 일반대출 ${formatWon(generalLoan)}으로 나눈 참고용 예상치입니다.` }];
  return { status, ownFunds, giftFunds, familyLoanFunds, estimatedFinancing: { estimated, min: Math.round(estimated * .7), max: Math.round(estimated * 1.15), assumptions: ["입력한 기존 대출 잔액을 반영", "실제 대출 승인·금리·한도는 금융기관 심사에 따름"] }, estimatedLoans: { mortgage, generalLoan }, totalExpectedFunds, shortfall, reasons };
}
