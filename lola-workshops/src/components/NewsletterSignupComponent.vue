<template>
  <div class="newsletter-signup">
    <h4 class="newsletter-title">Stay Updated</h4>
    <p class="newsletter-description">
      Subscribe to our newsletter for workshop updates and creative inspiration
    </p>
    <form @submit.prevent="handleSubmit" class="newsletter-form">
      <div class="input-wrapper">
        <input
          v-model="email"
          type="email"
          placeholder="Enter your email"
          required
          class="newsletter-input"
          :disabled="loading"
        />
        <button
          type="submit"
          class="newsletter-button"
          :disabled="loading || !email"
        >
          {{ loading ? "Subscribing..." : "Subscribe" }}
        </button>
      </div>
      <p v-if="message" :class="['message', messageType]">{{ message }}</p>
    </form>
  </div>
</template>

<script>
import { defineComponent, ref } from "vue";
import { getFunctions, httpsCallable } from "firebase/functions";
import { getAnalytics, logEvent } from "firebase/analytics";

export default defineComponent({
  name: "NewsletterSignupComponent",

  props: {
    source: {
      type: String,
      default: "footer",
    },
  },

  setup(props) {
    const email = ref("");
    const loading = ref(false);
    const message = ref("");
    const messageType = ref(""); // 'success' or 'error'

    const handleSubmit = async () => {
      if (!email.value) return;

      loading.value = true;
      message.value = "";
      messageType.value = "";

      try {
        const functions = getFunctions();
        const subscribeToNewsletter = httpsCallable(
          functions,
          "emails-subscribeToNewsletter"
        );

        const response = await subscribeToNewsletter({
          email: email.value,
        });

        if (response.data.success) {
          message.value = "Thank you for subscribing!";
          messageType.value = "success";
          email.value = "";

          // Log analytics event
          const analytics = getAnalytics();
          logEvent(analytics, "newsletter_signup", {
            source: props.source,
            timestamp: new Date().toISOString(),
          });
        } else {
          message.value =
            response.data.message || "Something went wrong. Please try again.";
          messageType.value = "error";
        }
      } catch (error) {
        console.error("Newsletter signup error:", error);
        message.value = "Failed to subscribe. Please try again later.";
        messageType.value = "error";
      } finally {
        loading.value = false;
      }
    };

    return {
      email,
      loading,
      message,
      messageType,
      handleSubmit,
    };
  },
});
</script>

<style lang="scss" scoped>
.newsletter-signup {
  .newsletter-title {
    margin: 0 0 8px;
    font-size: 16px;
    font-weight: bold;
    color: var(--dark-grey);
  }

  .newsletter-description {
    margin: 0 0 12px;
    font-size: 14px;
    color: var(--grey);
  }

  .newsletter-form {
    .input-wrapper {
      display: flex;
      gap: 8px;
      margin-bottom: 8px;

      @media (max-width: 768px) {
        flex-direction: column;
      }
    }

    .newsletter-input {
      flex: 1;
      padding: 10px 12px;
      border: 1px solid var(--light-grey);
      border-radius: 4px;
      font-size: 14px;
      font-family: var(--font-family);
      color: var(--dark-grey);

      &:focus {
        outline: none;
        border-color: var(--yellow);
      }

      &:disabled {
        background-color: #f5f5f5;
        cursor: not-allowed;
      }
    }

    .newsletter-button {
      padding: 10px 20px;
      background-color: var(--yellow);
      color: var(--white);
      border: none;
      border-radius: 4px;
      font-size: 14px;
      font-weight: var(--weight-medium);
      cursor: pointer;
      transition: background-color 0.3s ease;
      white-space: nowrap;

      &:hover:not(:disabled) {
        background-color: var(--tan);
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }

    .message {
      margin: 0;
      font-size: 13px;
      padding: 8px;
      border-radius: 4px;

      &.success {
        color: #168377;
        background-color: #e8f5f3;
      }

      &.error {
        color: var(--errors);
        background-color: #fff0f0;
      }
    }
  }
}
</style>
