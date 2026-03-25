/**
 * Negative rows created during a PDF upload are written just before the Audit row.
 * Associate items to an audit by matching dateImported to the audit's createdAt window.
 */
export function auditNegativeImportWindow(auditCreatedAt: Date): { gte: Date; lte: Date } {
  return {
    gte: new Date(auditCreatedAt.getTime() - 5 * 60 * 1000),
    lte: new Date(auditCreatedAt.getTime() + 2 * 60 * 1000),
  };
}

/** Rows from parseTradelinePastDueNegatives use accountType "Late 30" … "Late 120". */
export function isStructuredLatePaymentAccountType(accountType: string | null | undefined): boolean {
  return !!accountType && /^Late\s*(30|60|90|120)\b/i.test(accountType.trim());
}
