import { formatWon } from "./format";
import type { FundingAnalysis, HousingType, Reason, UserProfile } from "./types";
export function analyzeFunding(profile: UserProfile, housingType: HousingType): FundingAnalysis {
  const ownFunds = profile.assets.availableCash + profile.assets.savings + profile.assets.financialAssets;
  const leaseDepositReturnFunds = profile.assets.leaseDeposit;
  const giftFunds = profile.familySupport.gift?.amount ?? 0; const familyLoanFunds = profile.familySupport.loan?.amount ?? 0;
  const plannedCreditLoan = profile.financingPlan?.plannedCreditLoanAmount ?? 0;
  const debtBalance = profile.debts.reduce((sum, debt) => sum + debt.balance, 0);
  const estimated = Math.max(0, Math.min(Math.round(housingType.estimatedTotalCost * 0.5), 300_000_000 - debtBalance));
  const mortgage = estimated;
  const totalExpectedFunds = ownFunds + leaseDepositReturnFunds + giftFunds + familyLoanFunds + mortgage + plannedCreditLoan; const shortfall = Math.max(0, housingType.estimatedTotalCost - totalExpectedFunds);
  const status = totalExpectedFunds >= housingType.estimatedTotalCost ? "sufficient" : totalExpectedFunds >= housingType.estimatedTotalCost * .85 ? "possible" : totalExpectedFunds >= housingType.estimatedTotalCost * .65 ? "additional_funds_needed" : "insufficient";
  const reasons: Reason[] = [{ label: "자기자금", status, detail: `현금·예금·금융자산 합계 ${formatWon(ownFunds)}입니다.` }, { label: "전세보증금", status: "possible", detail: `반환 예정액 ${formatWon(leaseDepositReturnFunds)}을 별도로 반영했습니다.` }, { label: "가족 지원", status: "possible", detail: `증여 ${formatWon(giftFunds)}, 차용 ${formatWon(familyLoanFunds)}을 분리해 반영했습니다.` }, { label: "예상 주택담보대출", status: "conditionallyEligible", detail: `입력 정보와 공고 가격을 기준으로 한 ${formatWon(mortgage)}의 참고용 예상치입니다.` }];
  if (plannedCreditLoan) reasons.push({ label: "일반 신용대출", status: "possible", detail: `직접 입력한 계획 금액 ${formatWon(plannedCreditLoan)}을 반영했습니다.` });
  return { status, ownFunds, leaseDepositReturnFunds, giftFunds, familyLoanFunds, estimatedFinancing: { estimated, min: Math.round(estimated * .7), max: Math.round(estimated * 1.15), assumptions: ["입력한 기존 대출 잔액을 반영", "실제 대출 승인·금리·한도는 금융기관 심사에 따름"] }, estimatedLoans: { mortgage, plannedCreditLoan }, totalExpectedFunds, shortfall, reasons };
}
