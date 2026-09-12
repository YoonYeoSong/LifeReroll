import { describe, expect, it } from "vitest";
import { sampleUser } from "../../data/housing/sample-user";
import { analyzeEligibility, analyzeFunding, analyzeSubscription, recommend } from "./index";
import type { HousingNotice } from "./types";

const notice: HousingNotice = {
  noticeId: "test-notice", title: "테스트 공고", provider: "테스트", region: "경기도", city: "부천시", district: "", noticeDate: "2026-09-01", applicationStartDate: "2026-09-21", applicationEndDate: "2026-09-23",
  housingCategory: "공공분양", supplyType: "일반공급", newHomeType: "아파트", residencyRequirements: { regions: ["경기도"], minMonths: 12 }, incomeRequirements: { maxAnnualIncome: 45_000_000 }, assetRequirements: { maxAssets: 350_000_000 },
  subscriptionRequirements: { minimumMonths: 24, minimumPayments: 24, minimumRecognizedAmount: 6_000_000, acceptedAccountTypes: ["housingSubscriptionSavings", "youthHousingDream"] }, specialSupplyTypes: ["청년"], sourceUrl: "https://example.test/notice", sourceName: "테스트", sourceDate: "2026-09-01",
  housingTypes: [
    { typeName: "59A", exclusiveArea: 59, supplyCount: 180, price: 510_000_000, estimatedTotalCost: 530_000_000, specialSupplyCount: 90, generalSupplyCount: 90 },
    { typeName: "74A", exclusiveArea: 74, supplyCount: 80, price: 610_000_000, estimatedTotalCost: 633_000_000, specialSupplyCount: 40, generalSupplyCount: 40 },
  ],
};
const expensiveNotice: HousingNotice = { ...notice, noticeId: "test-expensive-notice", housingTypes: [{ typeName: "84A", exclusiveArea: 84, supplyCount: 70, price: 780_000_000, estimatedTotalCost: 810_000_000, specialSupplyCount: 35, generalSupplyCount: 35 }] };
describe("Cheongyak Fit analysis", () => {
  it("treats the sample homeless resident as eligible for a matching notice", () => {
    expect(analyzeEligibility(sampleUser, notice).status).toBe("eligible");
  });
  it("reports a regional mismatch as ineligible", () => {
    expect(analyzeEligibility({ ...sampleUser, residenceRegion: "부산광역시" }, notice).status).toBe("ineligible");
  });
  it("keeps unknown when required residence data is absent", () => {
    expect(analyzeEligibility({ ...sampleUser, moveInDate: "" }, notice).status).toBe("unknown");
  });
  it("separates youth housing dream account and recognized amount from account balance", () => {
    const analysis = analyzeSubscription(sampleUser, notice);
    expect(analysis.status).toBe("eligible");
    expect(analysis.reasons.find(reason => reason.label === "청약 인정금액")?.detail).toContain("현재잔액과 별도로");
  });
  it("flags missing payment count or insufficient subscription period for review", () => {
    expect(analyzeSubscription({ ...sampleUser, subscriptionAccount: { ...sampleUser.subscriptionAccount, recognizedPaymentCount: 1, openedAt: "2026-08-01" } }, notice).status).toBe("conditionallyEligible");
  });
  it("adds cash, gift and family loan separately before estimated financing", () => {
    const result = analyzeFunding(sampleUser, notice.housingTypes[0]);
    expect(result.giftFunds).toBe(sampleUser.familySupport.gift?.amount);
    expect(result.familyLoanFunds).toBe(sampleUser.familySupport.loan?.amount);
    expect(result.totalExpectedFunds).toBe(result.ownFunds + result.leaseDepositReturnFunds + result.giftFunds + result.familyLoanFunds + result.estimatedFinancing.estimated);
    expect(result.estimatedLoans.mortgage).toBe(result.estimatedFinancing.estimated);
    expect(result.estimatedLoans.plannedCreditLoan).toBe(0);
  });
  it("adds a credit loan only when the user explicitly enters a plan", () => {
    const result = analyzeFunding({ ...sampleUser, financingPlan: { plannedCreditLoanAmount: 20_000_000 } }, notice.housingTypes[0]);
    expect(result.estimatedLoans.plannedCreditLoan).toBe(20_000_000);
    expect(result.totalExpectedFunds).toBe(result.ownFunds + result.leaseDepositReturnFunds + result.giftFunds + result.familyLoanFunds + result.estimatedFinancing.estimated + 20_000_000);
  });
  it("makes a shortfall visible for an unaffordable type", () => {
    const result = analyzeFunding({ ...sampleUser, assets: { ...sampleUser.assets, availableCash: 0, savings: 0, financialAssets: 0 }, familySupport: {} }, expensiveNotice.housingTypes[0]);
    expect(result.shortfall).toBeGreaterThan(0);
  });
  it("returns type-level recommendations and never labels score as probability", () => {
    const results = recommend(sampleUser, [notice, expensiveNotice]);
    expect(results).toHaveLength(3);
    expect(results[0]).toHaveProperty("overallScore");
    expect(results[0]).toHaveProperty("status");
  });
});
