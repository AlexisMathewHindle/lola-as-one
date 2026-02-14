import { createStore } from "vuex";

// Add these interfaces at the top of the file
interface BasketItem {
  theme_id: string;
  quantity: number;
  event_id?: string; // Add this line
  isLoading?: boolean;
  // Add other properties as needed
}

interface State {
  environment: string;
  basket: BasketItem[];
  category: string;
  total: number | null;
  discount: number | null;
  events: any[];
  themes: any[];
  discountApplied: boolean;
  booking: Record<string, unknown>;
  basket_quantity: number;
  isLoading: boolean;
  sibling_discount: any;
  initial_date: string;
  termTime: any[];
  currentTerm: object | null;
}

export default createStore<State>({
  state: {
    environment: "",
    basket: [],
    category: "",
    total: null,
    discount: null,
    events: [],
    themes: [],
    discountApplied: false,
    booking: {},
    basket_quantity: 0,
    isLoading: true,
    sibling_discount: {},
    initial_date: "",
    termTime: [],
    currentTerm: null,
  },
  getters: {
    basket(state) {
      return state.basket;
    },
    total(state) {
      return state.total;
    },
    category(state) {
      return state.category;
    },
    isLoading: (state) => state.isLoading,
  },
  mutations: {
    SET_DISCOUNT_APPLIED(state, payload) {
      state.discountApplied = payload;
    },
    SET_ENVIRONMENT(state, payload) {
      state.environment = payload;
    },
    SET_CURRENT_TERM(state, payload) {
      state.currentTerm = payload;
    },
    SET_TERM_TIME(state, payload) {
      state.termTime = payload;
    },
    SET_LOADING(state, payload) {
      state.isLoading = payload;
    },
    SET_BASKET(state, payload) {
      state.basket = payload;
      localStorage.setItem("basket", JSON.stringify(payload));
    },
    SET_INITIAL_DATE(state, payload) {
      state.initial_date = payload;
    },
    SET_SIBLING_DISCOUNT(state, payload) {
      state.sibling_discount = payload;
    },
    SET_BASKET_QUANTITY(state, payload) {
      state.basket_quantity = payload;
    },
    SET_BOOKING(state, payload) {
      state.booking = payload;
      // localStorage.setItem("booking", JSON.stringify(payload));
    },
    SET_THEMES(state, payload) {
      state.themes = payload;
    },
    SET_EVENTS(state, payload) {
      state.events = payload;
    },
    SET_BASKET_CATEGORY(state, payload) {
      state.category = payload;
    },
    SET_TOTAL(state, payload) {
      state.total = payload;
    },
    SET_DISCOUNT(state, payload) {
      state.discount = payload;
    },
    REMOVE_FROM_BASKET(state, theme) {
      if (theme.category === "single") {
        const itemIndex = state.basket.findIndex(
          (item) => item.theme_id === theme.theme_id
        );
        if (itemIndex !== -1) {
          state.basket[itemIndex].quantity--;
          if (state.basket[itemIndex].quantity <= 0) {
            state.basket.splice(itemIndex, 1);
          }
        }
      } else {
        state.basket = state.basket.filter(
          (basketTheme) => basketTheme.event_id !== theme.items[0].event_id
        );
      }
    },
  },
  actions: {
    removeFromBasket({ commit }, theme) {
      commit("REMOVE_FROM_BASKET", theme);
    },
    setLoading({ commit }, payload) {
      commit("SET_LOADING", payload);
    },
    setInitialDate({ commit }, payload) {
      commit("SET_INITIAL_DATE", payload);
    },
  },
  modules: {},
});
