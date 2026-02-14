<template>
  <div v-if="showBanner" class="cookie-banner">
    <p>
      We use cookies to ensure you get the best experience on our website.
      <a-link
        href="https://www.lotsoflovelyart.org/privacy-policy/"
        class="no-decoration"
        >Learn more.</a-link
      >
    </p>
    <div class="cookie-actions">
      <v-btn color="white" @click="acceptCookies">Agree</v-btn>
      <v-btn color="white" @click="declineCookies">Deny</v-btn>
    </div>
  </div>
</template>

<script>
export default {
  name: "CookieBanner",
  data() {
    return {
      showBanner: false, // controls the display of the banner
    };
  },
  mounted() {
    this.checkCookieConsent();
  },
  methods: {
    checkCookieConsent() {
      const cookieConsent = localStorage.getItem("cookieConsent");
      if (!cookieConsent) {
        this.showBanner = true; // Show the banner if no consent has been given
      }
    },
    acceptCookies() {
      localStorage.setItem("cookieConsent", "accepted");
      this.showBanner = false;
      // You can load your analytics, ads, or other services here
      // e.g., this.loadAnalytics();
    },
    declineCookies() {
      localStorage.setItem("cookieConsent", "declined");
      this.showBanner = false;
    },
  },
};
</script>

<style scoped>
.cookie-banner {
  position: fixed;
  bottom: 0;
  width: 100%;
  background-color: var(--yellow);
  color: white;
  text-align: center;
  padding: 10px;
  z-index: 1000;

  p {
    font-weight: var(--weight-medium);
  }
}

.cookie-actions {
  margin-top: 10px;
}

.cookie-actions button {
  margin: 5px;
  padding: 8px 16px;
  border: none;
  cursor: pointer;
}

.cookie-actions button:first-child {
  background-color: green;
  color: white;
}

.cookie-actions button:last-child {
  background-color: red;
  color: white;
}
</style>
