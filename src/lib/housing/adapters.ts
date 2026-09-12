import type { PublicHousingProvider, RealEstateTransactionProvider, SubscriptionNoticeProvider } from "./types";
// Official data is fetched through the LH server route. These adapters remain
// intentionally empty until another verified provider is connected.
export const unavailableSubscriptionNoticeProvider: SubscriptionNoticeProvider = { async getNotices() { return []; } };
export const unavailablePublicHousingProvider: PublicHousingProvider = { async getNotices() { return []; } };
export const unavailableTransactionProvider: RealEstateTransactionProvider = { async getComparableTransactions() { return []; } };
