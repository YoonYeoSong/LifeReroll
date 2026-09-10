import { housingNotices } from "../../data/housing/notices"; import type { HousingNotice, PublicHousingProvider, RealEstateTransactionProvider, SubscriptionNoticeProvider } from "./types";
export const fixtureSubscriptionNoticeProvider: SubscriptionNoticeProvider = { async getNotices(): Promise<HousingNotice[]> { return housingNotices.filter(notice => !notice.isHistorical); } };
export const fixturePublicHousingProvider: PublicHousingProvider = { async getNotices(): Promise<HousingNotice[]> { return housingNotices; } };
export const unavailableTransactionProvider: RealEstateTransactionProvider = { async getComparableTransactions() { return []; } };
