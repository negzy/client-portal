/**
 * Convert Prisma values to plain JSON-safe data for props passed into "use client" components.
 * Decimal (and similar) types cannot cross the React Server/Client boundary.
 */
export type ClientSafeNegativeItem = {
  id: string;
  accountName: string;
  bureau: string;
  accountType: string | null;
  balance: number | null;
  negativeReason: string | null;
  currentOutcome: string | null;
};

export function toClientSafeNegativeItems<
  T extends {
    id: string;
    accountName: string;
    bureau: string;
    accountType: string | null;
    balance: unknown;
    negativeReason: string | null;
    currentOutcome: string | null;
  },
>(items: T[]): ClientSafeNegativeItem[] {
  return items.map((n) => ({
    id: n.id,
    accountName: n.accountName,
    bureau: n.bureau,
    accountType: n.accountType,
    balance: n.balance != null ? Number(n.balance) : null,
    negativeReason: n.negativeReason,
    currentOutcome: n.currentOutcome,
  }));
}
