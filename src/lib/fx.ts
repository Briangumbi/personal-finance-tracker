// exchangerate-api.com's free "open access" endpoint — no API key, rates
// refresh once daily on their end. We cache our own fetch for 12h so we
// don't hit it on every request; this is only ever called when a user's
// accounts span more than one currency.
export const BASE_CURRENCY = 'USD'

export async function getExchangeRates(): Promise<Record<string, number> | null> {
  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${BASE_CURRENCY}`, {
      next: { revalidate: 60 * 60 * 12 },
    })
    if (!res.ok) return null

    const data = await res.json()
    if (data.result !== 'success' || !data.rates) return null

    return data.rates as Record<string, number>
  } catch {
    return null
  }
}

// Rates are expressed as "1 BASE_CURRENCY = rate[currency] currency", so
// converting a `currency` amount back to the base is amount / rate.
export function convertToBase(
  amount: number,
  currency: string,
  rates: Record<string, number>
): number | null {
  if (currency === BASE_CURRENCY) return amount
  const rate = rates[currency]
  if (!rate) return null
  return amount / rate
}
