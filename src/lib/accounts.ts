export const ACCOUNT_TYPES = [
  { value: 'bank', label: 'Bank Account' },
  { value: 'card', label: 'Card' },
  { value: 'mobile_money', label: 'Mobile Money' },
  { value: 'cash', label: 'Cash' },
  { value: 'other', label: 'Other' },
] as const

export type AccountType = (typeof ACCOUNT_TYPES)[number]['value']

export function accountTypeLabel(type: string) {
  return ACCOUNT_TYPES.find((t) => t.value === type)?.label ?? type
}

// Common East African mobile money providers first, since that's the
// underserved case most finance apps ignore, then a broader set of global
// wallet providers. "Other" always falls through to free text.
export const MOBILE_MONEY_PROVIDERS = [
  'M-Pesa',
  'Tigo Pesa',
  'Airtel Money',
  'Halopesa',
  'Selcom',
  'MTN MoMo',
  'GCash',
  'PayPal',
  'Venmo',
  'Other',
] as const

export const CURRENCIES = [
  'USD',
  'EUR',
  'GBP',
  'TZS',
  'KES',
  'UGX',
  'RWF',
  'NGN',
  'GHS',
  'ZAR',
  'INR',
  'PHP',
  'CNY',
  'JPY',
  'CAD',
  'AUD',
  'BRL',
  'MXN',
  'AED',
  'Other',
] as const

export type Account = {
  id: string
  name: string
  type: AccountType
  provider: string | null
  currency: string
  starting_balance: number
  created_at: string
}
