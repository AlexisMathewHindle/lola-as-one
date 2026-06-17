const PENDING_CHECKOUT_STORAGE_KEY = 'pendingCheckoutSession'
const PENDING_CHECKOUT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

let pendingResolutionPromise = null

const canUseLocalStorage = () => {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

const normalizeCartItemsForSignature = (items = []) => {
  if (!Array.isArray(items)) {
    return []
  }

  return items
    .map(item => ({
      id: String(item.id || item.productId || ''),
      productId: String(item.productId || item.id || ''),
      variantId: item.variantId || null,
      eventId: item.event_id || null,
      offeringId: item.offering_id || null,
      type: item.type || null,
      quantity: Number(item.quantity || 0),
      title: item.title || item.name || ''
    }))
    .sort((firstItem, secondItem) => {
      return JSON.stringify(firstItem).localeCompare(JSON.stringify(secondItem))
    })
}

const createCartSignature = (items = []) => {
  return JSON.stringify(normalizeCartItemsForSignature(items))
}

export const rememberPendingCheckoutSession = (sessionId, cartItems = []) => {
  if (!canUseLocalStorage() || !sessionId) {
    return
  }

  window.localStorage.setItem(PENDING_CHECKOUT_STORAGE_KEY, JSON.stringify({
    sessionId,
    createdAt: Date.now(),
    cartSignature: createCartSignature(cartItems)
  }))
}

export const getPendingCheckoutSession = () => {
  if (!canUseLocalStorage()) {
    return null
  }

  const rawPendingSession = window.localStorage.getItem(PENDING_CHECKOUT_STORAGE_KEY)

  if (!rawPendingSession) {
    return null
  }

  try {
    const parsedSession = JSON.parse(rawPendingSession)
    const pendingSession = typeof parsedSession === 'string'
      ? { sessionId: parsedSession, createdAt: Date.now(), cartSignature: null }
      : parsedSession

    if (!pendingSession?.sessionId) {
      window.localStorage.removeItem(PENDING_CHECKOUT_STORAGE_KEY)
      return null
    }

    if (
      pendingSession.createdAt &&
      Date.now() - Number(pendingSession.createdAt) > PENDING_CHECKOUT_MAX_AGE_MS
    ) {
      window.localStorage.removeItem(PENDING_CHECKOUT_STORAGE_KEY)
      return null
    }

    return pendingSession
  } catch (error) {
    window.localStorage.removeItem(PENDING_CHECKOUT_STORAGE_KEY)
    return null
  }
}

export const clearPendingCheckoutSession = (sessionId = null) => {
  if (!canUseLocalStorage()) {
    return
  }

  if (!sessionId) {
    window.localStorage.removeItem(PENDING_CHECKOUT_STORAGE_KEY)
    return
  }

  const pendingSession = getPendingCheckoutSession()

  if (!pendingSession || pendingSession.sessionId === sessionId) {
    window.localStorage.removeItem(PENDING_CHECKOUT_STORAGE_KEY)
  }
}

export const fetchOrderByCheckoutSession = async (sessionId) => {
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-order-by-session?session_id=${sessionId}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      }
    }
  )

  const responseData = await response.json().catch(() => null)

  if (!response.ok) {
    const error = new Error(responseData?.error || 'Failed to fetch order')
    error.status = response.status
    error.responseData = responseData
    throw error
  }

  return responseData
}

const cartStillMatchesPendingSession = (cartItems, pendingSession) => {
  if (!pendingSession?.cartSignature) {
    return true
  }

  return createCartSignature(cartItems) === pendingSession.cartSignature
}

const isOrderStillPendingError = (error) => {
  return error?.message?.toLowerCase().includes('order not found')
}

export const clearCartForCompletedPendingCheckout = async (cartStore) => {
  if (pendingResolutionPromise) {
    return pendingResolutionPromise
  }

  pendingResolutionPromise = (async () => {
    const pendingSession = getPendingCheckoutSession()

    if (!pendingSession?.sessionId) {
      return { cleared: false, reason: 'none' }
    }

    if (!cartStillMatchesPendingSession(cartStore.items, pendingSession)) {
      clearPendingCheckoutSession(pendingSession.sessionId)
      return { cleared: false, reason: 'cart_changed' }
    }

    try {
      const order = await fetchOrderByCheckoutSession(pendingSession.sessionId)

      if (order?.pending) {
        return { cleared: false, reason: 'pending' }
      }

      cartStore.clearCart()
      clearPendingCheckoutSession(pendingSession.sessionId)
      return { cleared: true, order }
    } catch (error) {
      if (!isOrderStillPendingError(error)) {
        console.warn('Unable to resolve pending checkout session:', error)
      }

      return {
        cleared: false,
        reason: isOrderStillPendingError(error) ? 'pending' : 'error',
        error
      }
    }
  })()

  try {
    return await pendingResolutionPromise
  } finally {
    pendingResolutionPromise = null
  }
}
