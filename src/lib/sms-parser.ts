// Best-effort parser for mobile money confirmation SMS/notification text.
// Formats vary a lot by provider and country and change over time, so this
// is deliberately a quick-fill assist, not a source of truth — the user
// always reviews the prefilled amount/direction before saving.

export type ParsedTransaction = {
  amount: number | null
  direction: 'in' | 'out' | null
  note: string | null
  provider: string | null
}

// Currency-prefixed amounts: "Ksh1,000.00", "TSh 10,000", "KES1,000.00",
// "$50.00", "USD 50.00". Falls back to the shilling slash notation common
// in East African SMS: "10,000/=" or "10,000/-".
const CURRENCY_AMOUNT_RE =
  /(?:Ksh|KSh|KES|TSh|TZS|UGX|RWF|NGN|GHS|ZAR|USD|\$|£|€)\s?([\d,]+(?:\.\d{1,2})?)/
const SLASH_AMOUNT_RE = /([\d,]+(?:\.\d{1,2})?)\s?\/[=-]/

const RECEIVED_RE = /\b(received|deposit(?:ed)?|credited|umepokea|imepokelewa)\b/i
const SENT_RE = /\b(sent|paid|payment|withdraw(?:n|al)?|debited|purchase|bought|umetuma|umelipa|umetoa)\b/i

const FROM_RE = /\bfrom\s+([A-Z][A-Za-z.'-]+(?:\s+[A-Z][A-Za-z.'-]+){0,3})/
const TO_RE = /\bto\s+([A-Z][A-Za-z.'-]+(?:\s+[A-Z][A-Za-z.'-]+){0,3})/

type ProviderPattern = {
  name: string
  matches: (text: string) => boolean
}

// Order matters only for the `provider` label attached to the result —
// detection of amount/direction below is provider-agnostic since exact
// message wording isn't reliable enough to hard-code per provider.
const PROVIDERS: ProviderPattern[] = [
  { name: 'M-Pesa', matches: (t) => /m-?pesa/i.test(t) },
  { name: 'Tigo Pesa', matches: (t) => /tigo\s?pesa/i.test(t) },
  { name: 'Airtel Money', matches: (t) => /airtel\s?money/i.test(t) },
  { name: 'Halopesa', matches: (t) => /halo\s?pesa/i.test(t) },
  { name: 'Selcom', matches: (t) => /selcom/i.test(t) },
  { name: 'MTN MoMo', matches: (t) => /mtn\s?mo(?:mo)?/i.test(t) },
]

export function parseTransactionText(text: string): ParsedTransaction {
  const provider = PROVIDERS.find((p) => p.matches(text))?.name ?? null

  const amountMatch = text.match(CURRENCY_AMOUNT_RE) ?? text.match(SLASH_AMOUNT_RE)
  const amount = amountMatch ? Number(amountMatch[1].replace(/,/g, '')) : null

  let direction: 'in' | 'out' | null = null
  if (RECEIVED_RE.test(text)) direction = 'in'
  else if (SENT_RE.test(text)) direction = 'out'

  const rawCounterparty =
    text.match(direction === 'out' ? TO_RE : FROM_RE)?.[1] ??
    text.match(FROM_RE)?.[1] ??
    text.match(TO_RE)?.[1] ??
    null
  // Strip trailing sentence punctuation the name char class picks up
  // (e.g. "JOHN." at the end of a clause) without breaking real
  // apostrophes/hyphens/periods inside a name.
  const counterparty = rawCounterparty?.replace(/[.,]+$/, '') || null

  return { amount, direction, note: counterparty, provider }
}
