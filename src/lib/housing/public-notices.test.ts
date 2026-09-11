import { describe, expect, it } from "vitest";
import { parseLhNoticeResponse } from "./public-notices";

describe("LH public notice response", () => {
  it("normalizes a small JSON response without inferring eligibility rules", () => {
    const notices = parseLhNoticeResponse(JSON.stringify({ response: { body: { items: { item: [{ PAN_ID: "123", PAN_NM: "테스트 공고", CNP_CD_NM: "서울특별시", AIS_TP_CD_NM: "공공분양", PAN_DT: "20260911", PAN_NT_ST_DT: "20260920", PAN_NT_ET_DT: "20260922" }] } } } }), "application/json");
    expect(notices).toHaveLength(1);
    expect(notices[0]).toMatchObject({ noticeId: "lh-123", noticeDate: "2026-09-11", applicationStartDate: "2026-09-20", applicationEndDate: "2026-09-22" });
    expect(notices[0].incomeRequirements).toBeUndefined();
    expect(notices[0].housingTypes).toEqual([]);
  });

  it("reads XML when the provider does not return JSON", () => {
    const notices = parseLhNoticeResponse("<response><body><items><item><PAN_ID>456</PAN_ID><PAN_NM><![CDATA[XML 공고]]></PAN_NM><PAN_DT>20260911</PAN_DT></item></items></body></response>", "application/xml");
    expect(notices[0]).toMatchObject({ noticeId: "lh-456", title: "XML 공고", noticeDate: "2026-09-11" });
  });
});
