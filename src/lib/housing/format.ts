export function formatWon(amount: number) {
  const won = Math.max(0, Math.round(amount));
  const eok = Math.floor(won / 100_000_000);
  const remainder = Math.round((won % 100_000_000) / 10_000);

  if (eok) return `${eok}억${remainder ? ` ${remainder.toLocaleString()}만원` : "원"}`;
  return remainder ? `${remainder.toLocaleString()}만원` : "0원";
}
