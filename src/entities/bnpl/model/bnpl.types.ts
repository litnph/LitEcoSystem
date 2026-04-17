export type BnplProvider = {
  id: string
  name: string
  /** Ngày chốt sao kê hàng tháng (1–28) */
  statementDay: number
}

export const DEFAULT_STATEMENT_DAY = 20

export function buildBnplProvidersFromConfig(
  sources: string[],
  modes: Record<string, string>,
  statementDays: Record<string, number>,
): BnplProvider[] {
  return sources
    .filter((source) => modes[source] === 'bnpl')
    .map((source) => ({
      id: `bnpl-${source.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      name: source,
      statementDay: statementDays[source] ?? DEFAULT_STATEMENT_DAY,
    }))
}
