import type { UserProfile } from "@/lib/housing/types";

export const sampleUser: UserProfile = {
  birthYear: 1992, residenceRegion: "경기도", residenceCity: "부천시", moveInDate: "2021-03-01", householdRole: "head",
  isHomeless: true, homelessSince: "2018-01-01", hasOwnedHouseBefore: false, hasPreSaleRight: false, hasOccupancyRight: false,
  maritalStatus: "single", childrenCount: 0, minorChildrenCount: 0, newbornRelatedEligibility: false,
  subscriptionAccount: { type: "youthHousingDream", openedAt: "2021-02-01", recognizedPaymentCount: 54, recognizedPaymentAmount: 9_600_000, currentBalance: 12_100_000, monthlyPayment: 250_000 },
  income: { employmentType: "근로소득", annualIncome: 30_000_000, previousYearIncome: 29_000_000, spouseAnnualIncome: 0, employmentPeriod: 48 },
  assets: { availableCash: 70_000_000, savings: 25_000_000, financialAssets: 10_000_000, realEstateAssets: 0, leaseDeposit: 15_000_000, vehicleValue: 5_000_000, otherAssets: 0 },
  debts: [], familySupport: { gift: { amount: 30_000_000, previousGiftAmount: 0 }, loan: { amount: 40_000_000, interestRate: 3.5, repaymentYears: 10, monthlyRepayment: 395_000 } },
  preferences: { preferredRegions: ["경기도", "서울특별시"], preferredHousingSizes: [59, 74, 84], maxPrice: 600_000_000, housingSupplyTypes: ["공공분양", "신혼희망타운"], newHomeTypes: ["아파트"] },
};
