"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { MaritalStatus, SubscriptionAccountType, UserProfile } from "@/lib/housing/types";

const STORAGE_KEY = "cheongyak-fit-profile-v1";
const steps = ["기본 정보", "주택·가구", "청약통장", "소득·자금", "희망 조건", "분석"];
const regions = ["서울특별시", "경기도", "인천광역시", "강원특별자치도", "충청북도", "충청남도", "대전광역시", "세종특별자치시", "전북특별자치도", "전라남도", "광주광역시", "경상북도", "경상남도", "대구광역시", "울산광역시", "부산광역시", "제주특별자치도"];

const emptyProfile: UserProfile = {
  birthYear: 0, residenceRegion: "", residenceCity: "", moveInDate: "", householdRole: "head",
  isHomeless: false, homelessSince: "", hasOwnedHouseBefore: false, hasPreSaleRight: false, hasOccupancyRight: false,
  maritalStatus: "single", childrenCount: 0, minorChildrenCount: 0, newbornRelatedEligibility: false,
  subscriptionAccount: { type: "none", openedAt: "", recognizedPaymentCount: 0, recognizedPaymentAmount: 0, currentBalance: 0, monthlyPayment: 0 },
  income: { employmentType: "", annualIncome: 0, previousYearIncome: 0, spouseAnnualIncome: 0, employmentPeriod: 0 },
  assets: { availableCash: 0, savings: 0, financialAssets: 0, realEstateAssets: 0, leaseDeposit: 0, vehicleValue: 0, otherAssets: 0 },
  debts: [], familySupport: {}, financingPlan: { plannedCreditLoanAmount: 0 },
  preferences: { preferredRegions: [], preferredHousingSizes: [], maxPrice: 0, housingSupplyTypes: [], newHomeTypes: [] },
};

const formatWon = (value: number) => {
  const won = Math.max(0, Math.round(value));
  const eok = Math.floor(won / 100_000_000);
  const remainder = Math.round((won % 100_000_000) / 10_000);
  return eok ? `${eok}억${remainder ? ` ${remainder.toLocaleString()}만원` : "원"}` : `${remainder.toLocaleString()}만원`;
};

const formatMoneyInput = (value: number | undefined) => value ? Math.max(0, Math.round(value)).toLocaleString("ko-KR") : "";
const formatDateInput = (value: string) => {
  const digits = value.replace(/[^0-9]/g, "").slice(0, 8);
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
};

export function ProfileWizard() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile>(emptyProfile);
  const [step, setStep] = useState(0);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const savedProfile = window.localStorage.getItem(STORAGE_KEY);
    if (!savedProfile) return;
    try { const parsed = JSON.parse(savedProfile); queueMicrotask(() => setProfile({ ...emptyProfile, ...parsed, financingPlan: { ...emptyProfile.financingPlan, ...parsed.financingPlan } })); }
    catch { window.localStorage.removeItem(STORAGE_KEY); }
  }, []);

  const set = <K extends keyof UserProfile>(key: K, value: UserProfile[K]) => setProfile(current => ({ ...current, [key]: value }));
  const number = (value: string) => Number(value.replace(/[^0-9]/g, "")) || 0;
  const save = () => { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile)); setSaved(true); };
  const finish = () => { save(); router.push("/housing/results"); };
  const textField = (label: string, value: string | number | undefined, onChange: (value: string) => void, type = "text", help?: string) => <label className="housing-field"><FieldLabel label={label} help={help} /><input type={type} value={type === "number" && !value ? "" : value ?? ""} onChange={event => onChange(event.target.value)} /></label>;
  const updateRegion = (region: string) => set("preferences", { ...profile.preferences, preferredRegions: profile.preferences.preferredRegions.includes(region) ? profile.preferences.preferredRegions.filter(item => item !== region) : [...profile.preferences.preferredRegions, region] });

  return <div className="wizard"><ol className="wizard-steps">{steps.map((label, index) => <li className={index === step ? "is-current" : index < step ? "is-done" : ""} key={label}>{index + 1}. {label}</li>)}</ol><section className="housing-card wizard-card">
    {step === 0 && <><h2>기본 정보</h2><p className="field-help">공고의 거주 요건을 가늠하기 위한 정보예요. 날짜가 확실하지 않으면 비워두고 결과에서 ‘확인 필요’로 보세요.</p><div className="housing-form-grid">{textField("출생연도", profile.birthYear, value => set("birthYear", number(value)), "number")}
      <label className="housing-field"><FieldLabel label="현재 거주 시/도" help="주민등록상 현재 주소의 시·도를 선택하세요." /><select value={profile.residenceRegion} onChange={event => set("residenceRegion", event.target.value)}><option value="">선택</option>{regions.map(region => <option value={region} key={region}>{region}</option>)}</select></label>
      {textField("시/군/구", profile.residenceCity, value => set("residenceCity", value), "text", "현재 주민등록상 시·군·구를 적어 주세요.")}
      <DateField label="전입일" value={profile.moveInDate} onChange={value => set("moveInDate", value)} help="현재 주소로 전입신고를 한 날입니다. 공고마다 거주기간의 기준일과 계산법이 다르니, 최종적으로 공고문을 확인하세요." />
      <label className="housing-field"><FieldLabel label="세대 내 역할" help="주민등록등본 기준의 세대주·세대원 여부입니다." /><select value={profile.householdRole} onChange={event => set("householdRole", event.target.value as UserProfile["householdRole"])}><option value="head">세대주</option><option value="member">세대원</option></select></label>
    </div></>}
    {step === 1 && <><h2>주택·가구 조건</h2><div className="choice-grid"><Toggle label="현재 무주택입니다" value={profile.isHomeless} onChange={value => set("isHomeless", value)} /><Toggle label="과거 주택 소유 이력이 있습니다" value={profile.hasOwnedHouseBefore} onChange={value => set("hasOwnedHouseBefore", value)} /><Toggle label="분양권이 있습니다" value={profile.hasPreSaleRight} onChange={value => set("hasPreSaleRight", value)} /><Toggle label="입주권이 있습니다" value={profile.hasOccupancyRight} onChange={value => set("hasOccupancyRight", value)} /></div>{profile.isHomeless && <div className="housing-form-grid"><DateField label="무주택 시작일" value={profile.homelessSince ?? ""} onChange={value => set("homelessSince", value)} help="마지막으로 주택을 처분해 무주택 세대가 된 시점을 공고 기준으로 확인해 입력하세요. 무주택기간 산정은 세대원 이력 등에 따라 달라질 수 있습니다." /></div>}<div className="housing-form-grid"><label className="housing-field">혼인 상태<select value={profile.maritalStatus} onChange={event => set("maritalStatus", event.target.value as MaritalStatus)}><option value="single">미혼</option><option value="married">기혼</option><option value="engaged">예비부부</option><option value="divorced">이혼</option><option value="widowed">사별</option></select></label>{textField("미성년 자녀 수", profile.minorChildrenCount, value => set("minorChildrenCount", number(value)), "number")}</div>{profile.maritalStatus === "married" && <div className="housing-form-grid"><DateField label="혼인일" value={profile.marriageDate ?? ""} onChange={value => set("marriageDate", value)} /><label className="housing-field">배우자 주택 이력<select value={profile.spouseHousingHistory ?? ""} onChange={event => set("spouseHousingHistory", event.target.value)}><option value="">선택</option><option value="none">없음</option><option value="owned">소유 이력 있음</option></select></label></div>}</>}
    {step === 2 && <><h2>청약통장</h2><div className="housing-form-grid"><label className="housing-field">통장 종류<select value={profile.subscriptionAccount.type} onChange={event => set("subscriptionAccount", { ...profile.subscriptionAccount, type: event.target.value as SubscriptionAccountType })}><option value="none">없음 / 아직 만들지 않음</option><option value="housingSubscriptionSavings">주택청약종합저축</option><option value="youthHousingDream">청년주택드림청약통장</option><option value="subscriptionSavings">청약저축</option><option value="subscriptionDeposit">청약예금</option><option value="subscriptionInstallment">청약부금</option></select></label><DateField label="개설일" value={profile.subscriptionAccount.openedAt ?? ""} onChange={value => set("subscriptionAccount", { ...profile.subscriptionAccount, openedAt: value })} />{textField("인정 납입회차", profile.subscriptionAccount.recognizedPaymentCount, value => set("subscriptionAccount", { ...profile.subscriptionAccount, recognizedPaymentCount: number(value) }), "number", "통장 거래내역 또는 청약홈에서 확인한 인정회차를 적으세요.")}<MoneyField label="청약 인정금액" value={profile.subscriptionAccount.recognizedPaymentAmount} onChange={value => set("subscriptionAccount", { ...profile.subscriptionAccount, recognizedPaymentAmount: number(value) })} /></div><p className="field-help">현재 잔액이 아니라 공고에 인정되는 납입금액을 기준으로 봅니다. 모르면 비워두어도 됩니다.</p></>}
    {step === 3 && <><h2>소득·자금</h2><p className="field-help">부담 수준을 가늠하기 위한 간단한 자금 계획입니다. 일반 신용대출은 실제 이용할 계획이 있을 때만 입력하세요.</p><div className="housing-form-grid"><MoneyField label="연소득" value={profile.income.annualIncome} onChange={value => set("income", { ...profile.income, annualIncome: number(value) })} />{textField("근속기간 (개월)", profile.income.employmentPeriod, value => set("income", { ...profile.income, employmentPeriod: number(value) }), "number")}<MoneyField label="바로 쓸 수 있는 현금" value={profile.assets.availableCash} onChange={value => set("assets", { ...profile.assets, availableCash: number(value) })} /><MoneyField label="예금·적금 및 금융자산" value={profile.assets.savings + profile.assets.financialAssets} onChange={value => set("assets", { ...profile.assets, savings: number(value), financialAssets: 0 })} /><MoneyField label="기존 전세보증금 반환 예정액" value={profile.assets.leaseDeposit} onChange={value => set("assets", { ...profile.assets, leaseDeposit: number(value) })} /><MoneyField label="가족 증여 예정액" value={profile.familySupport.gift?.amount ?? 0} onChange={value => set("familySupport", { ...profile.familySupport, gift: { amount: number(value), previousGiftAmount: profile.familySupport.gift?.previousGiftAmount ?? 0 } })} /><MoneyField label="가족 차용 예정액" value={profile.familySupport.loan?.amount ?? 0} onChange={value => set("familySupport", { ...profile.familySupport, loan: { amount: number(value), interestRate: profile.familySupport.loan?.interestRate ?? 0, repaymentYears: profile.familySupport.loan?.repaymentYears ?? 0, monthlyRepayment: profile.familySupport.loan?.monthlyRepayment ?? 0 } })} /><MoneyField label="일반 신용대출 계획액" value={profile.financingPlan?.plannedCreditLoanAmount ?? 0} onChange={value => set("financingPlan", { plannedCreditLoanAmount: number(value) })} help="주택담보대출과 별도로 실제 이용할 계획이 있을 때만 입력하세요." /></div><p className="funding-preview">현재 입력 자금: 자기자금 {formatWon(profile.assets.availableCash + profile.assets.savings + profile.assets.financialAssets)} · 전세보증금 {formatWon(profile.assets.leaseDeposit)} · 증여 {formatWon(profile.familySupport.gift?.amount ?? 0)} · 차용 {formatWon(profile.familySupport.loan?.amount ?? 0)}</p></>}
    {step === 4 && <><h2>희망 조건</h2><p className="field-help">희망 지역을 고르면 해당 지역의 공고만 플랜에서 추려 보여드려요. 가능한 면적은 분석 결과에서 공고별로 확인할 수 있어요.</p><div className="region-picker" role="group" aria-label="희망 지역 선택">{regions.map(region => <label key={region}><input type="checkbox" checked={profile.preferences.preferredRegions.includes(region)} onChange={() => updateRegion(region)} /><span>{region}</span></label>)}</div><div className="housing-form-grid"><MoneyField label="최대 분양가" value={profile.preferences.maxPrice} onChange={value => set("preferences", { ...profile.preferences, maxPrice: number(value) })} help="부대비용을 제외한 분양가 기준으로 입력하세요." /></div></>}
    {step === 5 && <><h2>분석 준비 완료</h2><p className="page-intro">입력한 조건을 기준으로 현재 공고를 추리고, 자금 부담 수준과 확인할 조건을 함께 보여드릴게요. 과거 분양은 옆에서 참고 사례로만 확인할 수 있습니다.</p><button className="housing-primary" onClick={finish}>내 조건으로 플랜 보기</button>{saved && <p className="success-note">입력값을 이 브라우저에 저장했습니다.</p>}</>}
    <div className="wizard-actions"><button className="housing-secondary" disabled={step === 0} onClick={() => setStep(current => current - 1)}>이전</button>{step < steps.length - 1 ? <button className="housing-primary" onClick={() => setStep(current => current + 1)}>다음</button> : <button className="housing-primary" onClick={finish}>플랜 보기</button>}</div>
  </section></div>;
}

function FieldLabel({ label, help }: { label: string; help?: string }) { return <span>{label}{help && <span className="field-help-icon" title={help} aria-label={`${label} 안내`}>!</span>}</span>; }
function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) { return <label className="toggle"><input type="checkbox" checked={value} onChange={event => onChange(event.target.checked)} /> <span>{label}</span></label>; }
function MoneyField({ label, value, onChange, help }: { label: string; value: number; onChange: (value: string) => void; help?: string }) { return <label className="housing-field money-field"><FieldLabel label={`${label} (원)`} help={help} /><input type="text" inputMode="numeric" autoComplete="off" placeholder="예: 50,000,000" value={formatMoneyInput(value)} onChange={event => onChange(event.target.value)} /><small className="money-preview">{value > 0 ? <>입력 금액 <strong>{formatWon(value)}</strong> · {value.toLocaleString("ko-KR")}원</> : "금액을 입력하면 만원·억원 단위로 함께 보여드려요."}</small></label>; }
function DateField({ label, value, onChange, help }: { label: string; value: string; onChange: (value: string) => void; help?: string }) { const pickerRef = useRef<HTMLInputElement>(null); const openPicker = () => { const picker = pickerRef.current; if (!picker) return; try { picker.showPicker(); } catch { picker.focus(); } }; return <div className="housing-field date-field"><FieldLabel label={label} help={help} /><div className="date-input-row"><input type="text" inputMode="numeric" autoComplete="off" placeholder="YYYY-MM-DD" maxLength={10} value={formatDateInput(value)} onChange={event => onChange(formatDateInput(event.target.value))} /><button type="button" className="date-picker-button" onClick={openPicker} aria-label={`${label} 달력 열기`}>달력</button><input ref={pickerRef} className="native-date-picker" type="date" value={value} onChange={event => onChange(event.target.value)} tabIndex={-1} aria-hidden="true" /></div><small className="date-preview">숫자만 입력해도 <strong>YYYY-MM-DD</strong> 형식으로 맞춰집니다.</small></div>; }
