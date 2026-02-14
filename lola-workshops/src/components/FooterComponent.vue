<template>
  <footer class="footer" v-if="!isAdmin">
    <img
      class="footer-bar"
      style="margin-right: 20px"
      src="/img/images/footer_line_01.png"
    />
    <div class="footer-section">
      <ul class="footer-links">
        <li class="mb-0"><router-link to="/faqs">FAQs</router-link></li>
        <li class="mb-0">
          <router-link to="/">Workshop Schedule</router-link>
        </li>
        <li class="mb-0"><router-link to="/about">About</router-link></li>
      </ul>
      <div>
        <ul class="footer-links">
          <li class="mb-0">
            <router-link class="small-link" to="/terms-and-conditions"
              >Terms & Conditions</router-link
            >
          </li>
          <li class="mb-0">
            <a
              class="small-link"
              href="https://www.lotsoflovelyart.org/privacy-policy/"
              >Privacy Policy</a
            >
          </li>
        </ul>
        <p class="copyright mb-0">Copyright 2024 All rights reserved</p>
      </div>
    </div>

    <img
      class="footer-bar"
      style="margin-right: 20px"
      src="/img/images/footer_line_02.png"
    />
    <div class="footer-section">
      <h4 class="mb-0">Opening times</h4>
      <p class="mb-0">Mon Closed</p>
      <p class="mb-0">Tues 9am - 5pm</p>
      <p class="mb-0">Wed 9am - 6pm</p>
      <p class="mb-0">Thurs 9am - 6pm</p>
      <p class="mb-0">Fri 9am - 5pm</p>
      <p class="mb-0">Sat 9.30am - 3pm</p>
      <p class="mb-0">Sun 9.30am - 1pm</p>
    </div>
    <img
      class="footer-bar"
      style="margin-right: 20px"
      src="/img/images/footer_line_03.png"
    />
    <div class="footer-section">
      <NewsletterSignupComponent />
    </div>
    <img
      class="footer-bar"
      style="margin-right: 20px"
      src="/img/images/footer_line_01.png"
    />
    <div class="footer-section">
      <h4 class="mb-0">Come and find us at:</h4>
      <p class="mb-0">LoLA Lots of Lovely Art Creative Space</p>
      <p class="mb-0">50B Northbrook Street</p>
      <p class="mb-0">Newbury RG14 1DT</p>
      <p class="mb-0">Any questions? Please get in contact:</p>
      <a href="mailto:hello@lotsoflovelyart.com" class="contact-link"
        >hello@lotsoflovelyart.com</a
      >
      <div class="social-icons">
        <a
          href="https://www.instagram.com/lotsoflovelyart/"
          target="_blank"
          class="icon-link"
        >
          <img src="/img/images/social_icon_insta.png" alt="Instagram" />
        </a>
        <a
          href="https://www.facebook.com/lotsoflovelyart"
          target="_blank"
          class="icon-link"
        >
          <img src="/img/images/social_icon_fb.png" alt="Facebook" />
        </a>
      </div>
    </div>
  </footer>
</template>

<script>
import { defineComponent, computed } from "vue";
import { useRoute } from "vue-router";
import NewsletterSignupComponent from "./NewsletterSignupComponent.vue";

export default defineComponent({
  name: "FooterComponent",

  components: {
    NewsletterSignupComponent,
  },

  setup() {
    const route = useRoute();

    const isAdmin = computed(() => {
      return route.path.includes("/admin");
    });
    return {
      isAdmin,
    };
  },
});
</script>

<style lang="scss" scoped>
.footer {
  display: flex;
  padding: 20px;
  background-color: #fff;
  color: #333;
  flex-wrap: wrap;

  .footer-section {
    display: flex;
    flex-direction: column;
    margin-right: 20px;
    width: 20%;

    &:first-of-type {
      justify-content: space-between;
    }

    &:last-child {
      margin-right: 0;
    }

    h4 {
      margin: 0 0 10px;
      font-size: 16px;
      font-weight: bold;
    }

    p {
      margin: 5px 0;
      font-size: 14px;
    }

    &:last-of-type {
      p {
        &:last-of-type {
          font-weight: var(--weight-bold);
        }
      }
    }

    .contact-link {
      color: var(--yellow);
      text-decoration: none;
      font-weight: bold;
    }

    .footer-links {
      list-style: none;
      padding: 0;
      margin: 0;

      &:first-of-type {
        li {
          font-weight: bold;
        }
      }

      li {
        a {
          color: var(--yellow);
          text-decoration: none;
          font-size: 14px;

          &.small-link {
            font-size: 12px;
            // color: var(--dark-grey);
          }
        }
      }
    }

    .social-icons {
      display: flex;
      margin-top: 10px;

      .icon-link {
        margin-right: 10px;
        color: var(--yellow);
        font-size: 20px;

        img {
          width: 30px;
          height: 30px;
        }

        &:last-child {
          margin-right: 0;
        }
      }
    }
  }

  .copyright {
    font-size: 12px;
    color: var(--grey);
  }

  // Media Query for responsiveness
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;

    .footer-bar {
      display: none;
    }

    .footer-section {
      margin-bottom: 20px;
      margin-right: 0;
      width: 100%;

      &:last-child {
        margin-bottom: 0;
      }
    }
  }
}
</style>
