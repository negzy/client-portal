/** All three credit bureaus — always use this for dropdowns, charts, and labels. */
export const BUREAUS = ["Experian", "Equifax", "TransUnion"] as const;
export type BureauName = (typeof BUREAUS)[number];

/** Returns data for all 3 bureaus (Experian, Equifax, TransUnion); use 0 when bureau has no data. */
export function ensureAllThreeBureaus(
  items: { bureau: string; _count: number }[]
): { name: string; count: number; fill: string }[] {
  const colors = ["#f97316", "#fb923c", "#fdba74"];
  return BUREAUS.map((name, i) => {
    const row = items.find((x) => x.bureau === name);
    return { name, count: row?._count ?? 0, fill: colors[i] };
  });
}
