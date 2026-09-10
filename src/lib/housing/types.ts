export type HouseholdRole = "head" | "member";
export type MaritalStatus = "single" | "married" | "engaged" | "divorced" | "widowed";
export type SubscriptionAccountType = "housingSubscriptionSavings" | "youthHousingDream" | "subscriptionSavings" | "subscriptionDeposit" | "subscriptionInstallment" | "none";
export type EligibilityStatus = "eligible" | "conditionallyEligible" | "ineligible" | "unknown";
export type FundingStatus = "sufficient" | "possible" | "additional_funds_needed" | "insufficient";
export type MatchStatus = "STRONG_MATCH" | "POSSIBLE" | "REVIEW_REQUIRED" | "DIFFICULT" | "INELIGIBLE";

export interface UserProfile {
  birthYear: number; residenceRegion: string; residenceCity: string; moveInDate: string; householdRole: HouseholdRole;
  isHomeless: boolean; homelessSince?: string; hasOwnedHouseBefore: boolean; hasPreSaleRight: boolean; hasOccupancyRight: boolean;
  maritalStatus: MaritalStatus; marriageDate?: string; spouseIncome?: number; spouseHousingHistory?: string;
  childrenCount: number; minorChildrenCount: number; newbornRelatedEligibility: boolean;
  subscriptionAccount: { type: SubscriptionAccountType; openedAt?: string; recognizedPaymentCount: number; recognizedPaymentAmount: number; currentBalance: number; monthlyPayment: number };
  income: { employmentType: string; annualIncome: number; previousYearIncome: number; spouseAnnualIncome: number; employmentPeriod: number };
  assets: { availableCash: number; savings: number; financialAssets: number; realEstateAssets: number; leaseDeposit: number; vehicleValue: number; otherAssets: number };
  debts: { type: string; balance: number; interestRate: number; monthlyPayment: number; remainingMonths: number }[];
  familySupport: { gift?: { amount: number; previousGiftAmount: number }; loan?: { amount: number; interestRate: number; repaymentYears: number; monthlyRepayment: number } };
  preferences: { preferredRegions: string[]; preferredHousingSizes: number[]; maxPrice: number; housingSupplyTypes: string[]; newHomeTypes: string[] };
}

export interface HousingType { typeName: string; exclusiveArea: number; supplyCount: number; price: number; estimatedTotalCost: number; specialSupplyCount: number; generalSupplyCount: number; }
export interface HousingNotice {
  noticeId: string; title: string; provider: string; region: string; city: string; district: string; noticeDate: string; applicationStartDate: string; applicationEndDate: string;
  housingCategory: string; supplyType: string; newHomeType: string; residencyRequirements: { regions: string[]; minMonths?: number }; incomeRequirements?: { maxAnnualIncome: number }; assetRequirements?: { maxAssets: number };
  subscriptionRequirements: { minimumMonths: number; minimumPayments: number; minimumRecognizedAmount?: number; acceptedAccountTypes: SubscriptionAccountType[] };
  specialSupplyTypes: string[]; sourceUrl: string; sourceName: string; sourceDate: string; housingTypes: HousingType[]; isHistorical?: boolean;
}

export interface Reason { label: string; status: EligibilityStatus | FundingStatus; detail: string; }
export interface SubscriptionAnalysis { status: EligibilityStatus; monthsOpen?: number; reasons: Reason[]; }
export interface FundingAnalysis { status: FundingStatus; ownFunds: number; giftFunds: number; familyLoanFunds: number; estimatedFinancing: { estimated: number; min: number; max: number; assumptions: string[] }; totalExpectedFunds: number; shortfall: number; reasons: Reason[]; }
export interface EligibilityAnalysis { status: EligibilityStatus; reasons: Reason[]; }
export interface Recommendation { notice: HousingNotice; housingType: HousingType; eligibility: EligibilityAnalysis; subscription: SubscriptionAnalysis; funding: FundingAnalysis; eligibilityScore: number; subscriptionFitScore: number; fundingScore: number; priceValueScore: number; overallScore: number; status: MatchStatus; reasons: string[]; }

export interface SubscriptionNoticeProvider { getNotices(): Promise<HousingNotice[]>; }
export interface PublicHousingProvider { getNotices(): Promise<HousingNotice[]>; }
export interface RealEstateTransactionProvider { getComparableTransactions(input: { region: string; area: number }): Promise<never[]>; }
