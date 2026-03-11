import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import HomeView from "../views/HomeView.vue";
import store from "@/store"; // Import store directly
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getAnalytics, logEvent } from "firebase/analytics";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    name: "home",
    meta: {
      title: "Home - LOLA Workshops",
    },
    component: HomeView,
  },
  {
    path: "/login",
    name: "login",
    meta: {
      title: "Admin Login - LOLA Workshops",
    },
    component: () =>
      import(/* webpackChunkName: "login" */ "../views/LoginView.vue"),
  },
  {
    path: "/admin",
    name: "admin",
    redirect: "/admin/dashboard",
    meta: {
      requiresAuth: true, // Protect this route
      title: "Admin - LOLA Workshops",
    },
    component: () =>
      import(/* webpackChunkName: "admin" */ "../views/AdminView.vue"),
    children: [
      {
        path: "dashboard",
        name: "admin dashboard",
        meta: {
          title: "Dashboard - LOLA Workshops",
        },
        component: () =>
          import(
            /* webpackChunkName: "admin-dashboard" */ "../views/DashboardView.vue"
          ),
      },
      {
        path: "event-edit/:id",
        name: "event-edit",
        component: () =>
          import(
            /* webpackChunkName: "event-edit" */ "../views/EventEditView.vue"
          ),
      },
      {
        path: "bookings",
        name: "admin bookings",
        meta: {
          title: "Bookings - LOLA Workshops",
        },
        component: () =>
          import(
            /* webpackChunkName: "admin-bookings" */ "../views/BookingsView.vue"
          ),
      },
      {
        path: "coupons",
        name: "admin coupons",
        meta: {
          title: "Coupons - LOLA Workshops",
        },
        component: () =>
          import(
            /* webpackChunkName: "admin-coupons" */ "../views/CouponsView.vue"
          ),
      },
      {
        path: "settings",
        name: "admin settings",
        meta: {
          title: "Settings - LOLA Workshops",
        },
        component: () =>
          import(
            /* webpackChunkName: "admin-settings" */ "../views/SettingsView.vue"
          ),
      },
      {
        path: "events",
        name: "admin events",
        meta: {
          title: "Events - LOLA Workshops",
        },
        component: () =>
          import(
            /* webpackChunkName: "admin-events" */ "../views/EventsView.vue"
          ),
      },
      {
        path: "downloads",
        name: "downloads",
        meta: {
          title: "Download Themes - LOLA Workshops",
        },
        component: () =>
          import(
            /* webpackChunkName: "download-themes" */ "../views/DownloadView.vue"
          ),
      },
      {
        path: "upload",
        name: "upload",
        meta: {
          title: "Upload Themes - LOLA Workshops",
        },
        component: () =>
          import(
            /* webpackChunkName: "upload-themes" */ "../views/UploadView.vue"
          ),
      },
    ],
  },
  // {
  //   path: "/events",
  //   name: "events",
  //   meta: {
  //     requiresAuth: true, // Protect this route
  //     title: "Events - LOLA Workshops",
  //   },
  //   component: () =>
  //     import(/* webpackChunkName: "events" */ "../views/EventsView.vue"),
  // },
  {
    path: "/event-details/:id",
    name: "event-details",
    meta: {
      title: "Event Details - LOLA Workshops",
    },
    component: () =>
      import(
        /* webpackChunkName: "event-details" */ "../views/EventDetailsView.vue"
      ),
  },
  {
    path: "/checkout",
    name: "checkout",
    meta: {
      title: "Checkout - LOLA Workshops",
    },
    component: () =>
      import(/* webpackChunkName: "checkout" */ "../views/CheckoutView.vue"),
  },
  {
    path: "/about",
    name: "about",
    meta: {
      title: "About - LOLA Workshops",
    },
    component: () =>
      import(/* webpackChunkName: "about" */ "../views/AboutView.vue"),
  },
  {
    path: "/behaviour-policy",
    name: "behaviour policy",
    meta: {
      title: "behaviour Policy - LOLA Workshops",
    },
    component: () =>
      import(
        /* webpackChunkName: "behaviour-policy" */ "../views/BehaviourPolicyView.vue"
      ),
  },
  {
    path: "/adult-art-workshops",
    name: "adult art workshops",
    meta: {
      title: "Adult art - LOLA Workshops",
    },
    component: () =>
      import(
        /* webpackChunkName: adult workshops*/ "../views/AdultWorkshopView.vue"
      ),
  },
  {
    path: "/private-parties",
    name: "private parties",
    meta: {
      title: "Private Parties - LOLA Workshops",
    },
    component: () =>
      import(
        /* webpackChunkName: private parties*/ "../views/PrivatePartyView.vue"
      ),
  },
  {
    path: "/summer-workshops",
    name: "summer workshops",
    meta: {
      title: "Summer workshops - LOLA Workshops",
    },
    component: () =>
      import(/* webpackChunkName: "summer" */ "../views/SummerView.vue"),
  },
  {
    path: "/holiday-workshops",
    name: "holiday workshops",
    meta: {
      title: "Holiday workshops - LOLA Workshops",
    },
    component: () =>
      import(/* webpackChunkName: "half-term" */ "../views/HalfTermView.vue"),
  },
  {
    path: "/half-term",
    name: "half-term",
    meta: {
      title: "Half Term - LOLA Workshops",
    },
    component: () =>
      import(/* webpackChunkName: "half-term" */ "../views/HalfTermView.vue"),
  },
  {
    path: "/terms-and-conditions",
    name: "terms and conditions",
    meta: {
      title: "Terms and Conditions - LOLA Workshops",
    },
    component: () =>
      import(
        /* webpackChunkName: "terms-and-conditions" */ "../views/TermsAndConditionsView.vue"
      ),
  },
  {
    path: "/faqs",
    name: "faqs",
    meta: {
      title: "FAQs - LOLA Workshops",
    },
    component: () =>
      import(/* webpackChunkName: "faqs" */ "../views/FaqsView.vue"),
  },
  {
    path: "/basket",
    name: "basket",
    meta: {
      title: "Basket - LOLA Workshops",
    },
    component: () =>
      import(/* webpackChunkName: "basket" */ "../views/BasketView.vue"),
  },
  {
    path: "/registration",
    name: "registration",
    meta: {
      title: "Registration - LOLA Workshops",
    },
    component: () =>
      import(
        /* webpackChunkName: "registration" */ "../views/RegistrationView.vue"
      ),
  },
  {
    path: "/booking/:id",
    name: "booking",
    meta: {
      title: "Booking - LOLA Workshops",
    },
    component: () =>
      import(/* webpackChunkName: "booking" */ "../views/BookingView.vue"),
  },
  {
    path: "/order/success",
    name: "order-success",
    meta: {
      title: "Order Confirmation - LOLA Workshops",
    },
    component: () =>
      import(/* webpackChunkName: "order-success" */ "../views/OrderSuccessView.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,

  scrollBehavior() {
    return { left: 0, top: 0 };
  },
});

router.beforeEach((to, from, next) => {
  if (typeof to.meta.title === "string") {
    document.title = to.meta.title;
  }
  // next();

  const auth = getAuth();
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);

  if (requiresAuth) {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        next(); // User is authenticated, allow access
      } else {
        next({ name: "login" }); // User is not authenticated, redirect to login
      }
    });
  } else {
    next(); // Route does not require authentication, proceed
  }
});

router.afterEach((to) => {
  const analytics = getAnalytics(); // Get the initialized analytics instance
  logEvent(analytics, "page_view" as const, {
    page_title: (to.meta.title || to.name) as string,
    page_path: to.fullPath,
    route_name: to.name,
    added_at: new Date().toISOString(),
    environment: store.state.environment,
  });
});

export default router;
