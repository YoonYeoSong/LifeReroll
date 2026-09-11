import { describe, expect, it } from "vitest";
import { housingNotices } from "../../data/housing/notices";
import { sampleUser } from "../../data/housing/sample-user";
import { analyzeEligibility, analyzeFunding, analyzeSubscription, recommend } from "./index";

const notice = housingNotices[0];
describe("Cheongyak Fit analysis", () => {
  it("treats the sample homeless resident as eligible for the matching fixture", () => {
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
    const result = analyzeFunding({ ...sampleUser, assets: { ...sampleUser.assets, availableCash: 0, savings: 0, financialAssets: 0 }, familySupport: {} }, housingNotices[1].housingTypes[0]);
    expect(result.shortfall).toBeGreaterThan(0);
  });
  it("returns type-level recommendations and never labels score as probability", () => {
    const results = recommend(sampleUser, housingNotices);
    expect(results).toHaveLength(3);
    expect(results[0]).toHaveProperty("overallScore");
    expect(results[0]).toHaveProperty("status");
  });
});
