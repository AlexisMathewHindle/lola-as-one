import { defineStore } from "pinia";
import { ref, computed } from "vue";

// TypeScript interfaces for cart items
interface CartItem {
  id: string;
  theme_id?: string;
  event_id?: string;
  offering_id?: string;
  offering_event_id?: string;
  category: "single" | "term";
  category_slug?: string;
  title: string;
  theme_title?: string;
  event_title?: string;
  price: number;
  quantity: number;
  date?: string;
  start_time?: string;
  end_time?: string;
  type: string;
  stock?: number;
  term?: string;
  passed?: boolean;
  items?: any[]; // For term events with nested weeks
}

function isTermCartItem(item: any): boolean {
  return (
    item?.category === "term" ||
    (Array.isArray(item?.items) && item.items.length > 0)
  );
}

function getSingleCartItemKey(item: any): string | undefined {
  return (
    item?.event_id || item?.offering_event_id || item?.theme_id || item?.id
  );
}

function getTermCartItemKey(item: any): string | undefined {
  return item?.term_group_key || item?.event_id || item?.id;
}

function normalizeCartItem(item: any): CartItem {
  const rawCategory =
    typeof item?.category === "string" ? item.category : undefined;
  const normalizedCategory: "single" | "term" = isTermCartItem(item)
    ? "term"
    : "single";
  const categorySlug =
    item?.category_slug ||
    (rawCategory && rawCategory !== "single" && rawCategory !== "term"
      ? rawCategory
      : undefined);
  const normalizedQuantity = Math.max(1, Number(item?.quantity || 1));

  return {
    ...item,
    category: normalizedCategory,
    category_slug: categorySlug,
    quantity: normalizedQuantity,
  };
}

function coalesceCartItems(rawItems: any[]): CartItem[] {
  const mergedItems = new Map<string, CartItem>();

  rawItems
    .map((item) => normalizeCartItem(item))
    .forEach((item) => {
      const itemKey =
        item.category === "term"
          ? getTermCartItemKey(item)
          : getSingleCartItemKey(item);

      if (!itemKey) {
        return;
      }

      const mapKey = `${item.category}:${itemKey}`;
      const existingItem = mergedItems.get(mapKey);

      if (existingItem) {
        existingItem.quantity += item.quantity || 1;
        return;
      }

      mergedItems.set(mapKey, { ...item });
    });

  return Array.from(mergedItems.values());
}

export const useCartStore = defineStore("cart", () => {
  const items = ref<CartItem[]>([]);

  // Computed properties
  const itemCount = computed(() =>
    items.value.reduce((total, item) => total + item.quantity, 0)
  );

  const subtotal = computed(() =>
    items.value.reduce((total, item) => {
      // Handle term events with nested items (legacy)
      if (isTermCartItem(item) && item.items && item.items.length > 0) {
        const bundledTotal = item.items.reduce(
          (sum, session) => sum + parseFloat(session.price || item.price),
          0
        );
        return total + bundledTotal * item.quantity;
      }
      // Handle regular items
      return total + item.price * item.quantity;
    }, 0)
  );

  /**
   * Add item to cart - supports both single and term events (legacy)
   * @param event - Event object (can be single or term event)
   * @param quantity - Quantity to add (default: 1)
   */
  function addItem(event: any, quantity = 1) {
    const normalizedEvent = normalizeCartItem(event);
    const eventId =
      normalizedEvent.id ||
      normalizedEvent.event_id ||
      normalizedEvent.theme_id ||
      "";

    if (normalizedEvent.category === "term") {
      const termKey = getTermCartItemKey(normalizedEvent);
      const termId = normalizedEvent.id || termKey || eventId;
      const existingItem = items.value.find(
        (item) => isTermCartItem(item) && getTermCartItemKey(item) === termKey
      );

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        items.value.push({
          ...normalizedEvent,
          id: termId,
          theme_id: normalizedEvent.theme_id,
          event_id: normalizedEvent.event_id || termKey,
          offering_id: normalizedEvent.offering_id,
          offering_event_id: normalizedEvent.offering_event_id,
          category: "term",
          title: normalizedEvent.event_title || normalizedEvent.title,
          theme_title: normalizedEvent.theme_title,
          event_title: normalizedEvent.event_title,
          price: normalizedEvent.price,
          quantity: quantity,
          items: normalizedEvent.items || [],
          type: normalizedEvent.type || "event",
          stock: normalizedEvent.stock,
          term: normalizedEvent.term,
        });
      }
    } else {
      const singleKey = getSingleCartItemKey(normalizedEvent);
      const singleId = normalizedEvent.id || eventId || singleKey || "";
      const existingItem = items.value.find(
        (item) =>
          !isTermCartItem(item) && getSingleCartItemKey(item) === singleKey
      );

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        items.value.push({
          ...normalizedEvent,
          id: singleId,
          theme_id: singleKey,
          event_id: normalizedEvent.event_id || singleKey,
          offering_id: normalizedEvent.offering_id || normalizedEvent.id,
          offering_event_id:
            normalizedEvent.offering_event_id ||
            normalizedEvent.event_id ||
            singleKey,
          category: "single",
          title: normalizedEvent.theme_title || normalizedEvent.title,
          theme_title: normalizedEvent.theme_title,
          event_title: normalizedEvent.event_title,
          price: normalizedEvent.price,
          quantity: quantity,
          date: normalizedEvent.date,
          start_time: normalizedEvent.start_time,
          end_time: normalizedEvent.end_time,
          type: normalizedEvent.type || "event",
          stock: normalizedEvent.stock,
          passed: normalizedEvent.passed,
        });
      }
    }

    saveToLocalStorage();
  }

  /**
   * Remove item from cart - handles term vs single events
   * @param item - Item to remove
   */
  function removeItem(item: any) {
    const normalizedItem = normalizeCartItem(item);

    if (normalizedItem.category === "term") {
      const termKey = getTermCartItemKey(normalizedItem);
      items.value = items.value.filter(
        (i) => !(isTermCartItem(i) && getTermCartItemKey(i) === termKey)
      );
    } else {
      const singleKey = getSingleCartItemKey(normalizedItem);
      const existingItem = items.value.find(
        (i) => !isTermCartItem(i) && getSingleCartItemKey(i) === singleKey
      );

      if (existingItem) {
        existingItem.quantity -= 1;
        if (existingItem.quantity <= 0) {
          items.value = items.value.filter(
            (i) =>
              !(!isTermCartItem(i) && getSingleCartItemKey(i) === singleKey)
          );
        }
      }
    }
    saveToLocalStorage();
  }

  /**
   * Clear entire cart
   */
  function clearCart() {
    items.value = [];
    saveToLocalStorage();
  }

  /**
   * Save cart to localStorage
   */
  function saveToLocalStorage() {
    localStorage.setItem("basket", JSON.stringify(items.value));
  }

  /**
   * Load cart from localStorage
   */
  function loadFromLocalStorage() {
    const saved = localStorage.getItem("basket");
    if (saved) {
      try {
        const parsedItems = JSON.parse(saved);
        items.value = Array.isArray(parsedItems)
          ? coalesceCartItems(parsedItems)
          : [];
        saveToLocalStorage();
      } catch (error) {
        console.error("Error loading cart from localStorage:", error);
        items.value = [];
      }
    }
  }

  // Initialize cart from localStorage on store creation
  loadFromLocalStorage();

  return {
    items,
    itemCount,
    subtotal,
    addItem,
    removeItem,
    clearCart,
  };
});
