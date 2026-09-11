import { formatWon } from "./format";
import type { HousingNotice, Reason, SubscriptionAnalysis, UserProfile } from "./types";
const monthsSince = (date?: string) => date ? Math.max(0, (new Date().getFullYear() - new Date(date).getFullYear()) * 12 + new Date().getMonth() - new Date(date).getMonth()) : undefined;
export function analyzeSubscription(profile: UserProfile, notice: HousingNotice): SubscriptionAnalysis {
  const account = profile.subscriptionAccount; const months = monthsSince(account.openedAt); const reasons: Reason[] = [];
  if (account.type === "none") reasons.push({ label: "청약통장 종류", status: "ineligible", detail: "입력된 청약통장이 없습니다." });
  else reasons.push({ label: "청약통장 종류", status: notice.subscriptionRequirements.acceptedAccountTypes.includes(account.type) ? "eligible" : "conditionallyEligible", detail: account.type === "youthHousingDream" ? "청년주택드림청약통장으로 별도 검토했습니다." : "공고의 통장 종류 요건을 기준으로 검토했습니다." });
  reasons.push({ label: "가입기간", status: months === undefined ? "unknown" : months >= notice.subscriptionRequirements.minimumMonths ? "eligible" : "conditionallyEligible", detail: months === undefined ? "개설일 정보가 필요합니다." : `약 ${months}개월 가입으로 계산됩니다.` });
  reasons.push({ label: "인정 납입회차", status: account.recognizedPaymentCount >= notice.subscriptionRequirements.minimumPayments ? "eligible" : "conditionallyEligible", detail: `인정회차 ${account.recognizedPaymentCount}회 / 공고 기준 ${notice.subscriptionRequirements.minimumPayments}회입니다.` });
  if (notice.subscriptionRequirements.minimumRecognizedAmount) reasons.push({ label: "청약 인정금액", status: account.recognizedPaymentAmount >= notice.subscriptionRequirements.minimumRecognizedAmount ? "eligible" : "conditionallyEligible", detail: `인정금액 ${formatWon(account.recognizedPaymentAmount)}을 현재잔액과 별도로 비교했습니다.` });
  const status = reasons.some(reason => reason.status === "ineligible") ? "ineligible" : reasons.some(reason => reason.status === "unknown") ? "unknown" : reasons.some(reason => reason.status === "conditionallyEligible") ? "conditionallyEligible" : "eligible";
  return { status, monthsOpen: months, reasons };
}
