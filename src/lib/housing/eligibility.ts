import type { EligibilityAnalysis, EligibilityStatus, HousingNotice, Reason, UserProfile } from "./types";

const monthsBetween = (from: string, to = new Date().toISOString().slice(0, 10)) => Math.max(0, (new Date(to).getFullYear() - new Date(from).getFullYear()) * 12 + new Date(to).getMonth() - new Date(from).getMonth());
const combine = (statuses: EligibilityStatus[]): EligibilityStatus => statuses.includes("ineligible") ? "ineligible" : statuses.includes("unknown") ? "unknown" : statuses.includes("conditionallyEligible") ? "conditionallyEligible" : "eligible";
export function analyzeEligibility(profile: UserProfile, notice: HousingNotice): EligibilityAnalysis {
  const reasons: Reason[] = [];
  reasons.push({ label: "무주택", status: profile.isHomeless && !profile.hasPreSaleRight && !profile.hasOccupancyRight ? "eligible" : "ineligible", detail: profile.isHomeless ? "입력한 무주택 정보 기준으로 검토됩니다." : "무주택 조건을 충족하지 않는 것으로 입력되었습니다." });
  if (!profile.residenceRegion || !profile.moveInDate) reasons.push({ label: "거주 요건", status: "unknown", detail: "거주지역 또는 전입일 정보가 필요합니다." });
  else { const matches = notice.residencyRequirements.regions.includes(profile.residenceRegion); const months = monthsBetween(profile.moveInDate); reasons.push({ label: "거주 요건", status: matches && months >= (notice.residencyRequirements.minMonths ?? 0) ? "eligible" : matches ? "conditionallyEligible" : "ineligible", detail: matches ? `입력한 거주기간은 약 ${months}개월입니다.` : `${notice.region} 거주 요건을 다시 확인하세요.` }); }
  if (notice.incomeRequirements) reasons.push({ label: "소득", status: profile.income.annualIncome > 0 ? profile.income.annualIncome <= notice.incomeRequirements.maxAnnualIncome ? "eligible" : "ineligible" : "unknown", detail: `연소득 기준 ${Math.round(notice.incomeRequirements.maxAnnualIncome / 10_000).toLocaleString()}만원 이하 조건입니다.` });
  if (notice.assetRequirements) { const totalAssets = Object.values(profile.assets).reduce((sum, value) => sum + value, 0); reasons.push({ label: "자산", status: totalAssets > 0 ? totalAssets <= notice.assetRequirements.maxAssets ? "eligible" : "conditionallyEligible" : "unknown", detail: `입력 자산 합계 기준으로 검토합니다.` }); }
  if (profile.maritalStatus === "married" && profile.spouseHousingHistory === undefined) reasons.push({ label: "배우자 정보", status: "unknown", detail: "혼인 가구는 배우자 주택 이력 확인이 필요합니다." });
  return { status: combine(reasons.map(reason => reason.status as EligibilityStatus)), reasons };
}
