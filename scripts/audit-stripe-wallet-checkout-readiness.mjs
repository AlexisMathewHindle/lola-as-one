import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')

const checkoutFunctions = [
  {
    label: 'one-time checkout',
    path: 'supabase/functions/create-checkout-session/index.ts',
    expectedMode: "mode: 'payment'",
  },
  {
    label: 'subscription checkout',
    path: 'supabase/functions/create-subscription-checkout-session/index.ts',
    expectedMode: "mode: 'subscription'",
  },
]

const results = []

function add(status, check, details) {
  results.push({ status, check, details })
}

function pass(check, details) {
  add('passed', check, details)
}

function fail(check, details) {
  add('failed', check, details)
}

function source(path) {
  return readFileSync(resolve(root, path), 'utf8')
}

function extractCheckoutSessionArgs(contents) {
  const marker = 'stripe.checkout.sessions.create({'
  const start = contents.indexOf(marker)

  if (start === -1) {
    return ''
  }

  let depth = 0
  for (let index = start + marker.indexOf('{'); index < contents.length; index += 1) {
    const char = contents[index]

    if (char === '{') {
      depth += 1
    } else if (char === '}') {
      depth -= 1
      if (depth === 0) {
        return contents.slice(start, index + 1)
      }
    }
  }

  return ''
}

for (const checkoutFunction of checkoutFunctions) {
  const contents = source(checkoutFunction.path)
  const sessionArgs = extractCheckoutSessionArgs(contents)

  if (!sessionArgs) {
    fail(`${checkoutFunction.label}: Checkout Session creation`, 'No stripe.checkout.sessions.create call found.')
    continue
  }

  pass(`${checkoutFunction.label}: Checkout Session creation`, checkoutFunction.path)

  if (sessionArgs.includes(checkoutFunction.expectedMode)) {
    pass(`${checkoutFunction.label}: Checkout mode`, checkoutFunction.expectedMode)
  } else {
    fail(`${checkoutFunction.label}: Checkout mode`, `Expected ${checkoutFunction.expectedMode}.`)
  }

  if (sessionArgs.includes('success_url') && sessionArgs.includes('cancel_url')) {
    pass(`${checkoutFunction.label}: hosted Checkout redirect URLs`, 'Success and cancel URLs are configured.')
  } else {
    fail(`${checkoutFunction.label}: hosted Checkout redirect URLs`, 'Missing success_url or cancel_url.')
  }

  if (sessionArgs.includes('payment_method_types')) {
    fail(
      `${checkoutFunction.label}: dynamic payment method eligibility`,
      'Checkout Session pins payment_method_types. Remove it so Stripe can evaluate wallet eligibility from Dashboard settings.',
    )
  } else {
    pass(
      `${checkoutFunction.label}: dynamic payment method eligibility`,
      'No payment_method_types override is present, so Stripe Checkout can show eligible wallets.',
    )
  }

  if (sessionArgs.includes('excluded_payment_method_types')) {
    fail(
      `${checkoutFunction.label}: wallet exclusion guard`,
      'Checkout Session excludes payment methods. Confirm this is not filtering wallet-capable card payments.',
    )
  } else {
    pass(`${checkoutFunction.label}: wallet exclusion guard`, 'No per-session payment method exclusions are present.')
  }

  if (sessionArgs.includes('ui_mode')) {
    fail(
      `${checkoutFunction.label}: hosted Checkout mode`,
      'ui_mode is set. This audit expects Stripe-hosted Checkout redirects for wallet support.',
    )
  } else {
    pass(`${checkoutFunction.label}: hosted Checkout mode`, 'No embedded/custom Checkout ui_mode override is present.')
  }
}

const oneTimeCheckout = source('supabase/functions/create-checkout-session/index.ts')
const subscriptionCheckout = source('supabase/functions/create-subscription-checkout-session/index.ts')

for (const [label, contents] of [
  ['one-time checkout', oneTimeCheckout],
  ['subscription checkout', subscriptionCheckout],
]) {
  const defaultUrlMatch = contents.match(/const DEFAULT_CHECKOUT_APP_URL = '([^']+)'/)
  const defaultUrl = defaultUrlMatch?.[1]

  if (!defaultUrl) {
    fail(`${label}: default app URL`, 'DEFAULT_CHECKOUT_APP_URL is missing.')
    continue
  }

  if (defaultUrl.startsWith('https://')) {
    pass(`${label}: HTTPS default return URL`, defaultUrl)
  } else {
    fail(`${label}: HTTPS default return URL`, `${defaultUrl} is not HTTPS.`)
  }

  if (contents.includes('LEGACY_CHECKOUT_HOSTS') && contents.includes('lola-workshops.netlify.app')) {
    pass(`${label}: legacy host guard`, 'Legacy checkout host falls back to the current app URL.')
  } else {
    fail(`${label}: legacy host guard`, 'Legacy checkout host fallback is missing.')
  }
}

const failed = results.filter((result) => result.status === 'failed')

console.log('# Stripe wallet checkout readiness audit')
console.log('')
console.log(`Checks: ${results.length}`)
console.log(`Passed: ${results.length - failed.length}`)
console.log(`Failed: ${failed.length}`)
console.log('')

for (const result of results) {
  console.log(`- ${result.status}: ${result.check} - ${result.details}`)
}

if (failed.length > 0) {
  process.exitCode = 1
}
