export type SpendingPeriod = {
  id: string
  /** Display name, defaults to "Tháng X/YYYY" */
  name: string
  /** Inclusive start date (yyyy-mm-dd) */
  startDate: string
  /** Inclusive end date (yyyy-mm-dd) */
  endDate: string
}

