<template>
  <header class="c-header">
    <nav class="c-main-menu" aria-label="Main Navigation">
      <a href="/">
        <img
          class="c-header__logo c-header__logo--desktop"
          src="/img/images/logo.png"
          title="Lots Of Lovely Art Logo"
          alt="Lots Of Lovely Art Logo"
        />
      </a>
      <div class="c-main-menu__container" :class="{ active: isMenuOpen }">
        <ul class="c-main-menu__list">
          <li class="menu-item" v-if="route.name !== 'home'" @click="closeMenu">
            <router-link to="/">Art Classes</router-link>
          </li>
          <li class="menu-item" @click="closeMenu">
            <router-link to="/private-parties">LoLA Art Parties</router-link>
          </li>
          <li class="menu-item" @click="closeMenu">
            <router-link to="/adult-art-workshops"
              >Adult Art Workshops</router-link
            >
          </li>
          <li class="menu-item" @click="closeMenu" v-if="isMobile">
            <router-link to="/holiday-workshops">Half Term</router-link>
          </li>
          <li class="menu-item" @click="closeMenu">
            <router-link to="/summer-workshops">Summer Workshops</router-link>
          </li>
          <!-- <li
            v-else
            class="menu-item"
            @mouseover="toggleSubMenu(true)"
            @mouseleave="toggleSubMenu(false)"
          >
            <span>Holiday Workshops</span>
            <ul
              v-if="isSubMenuOpen"
              class="submenu"
              :class="{ 'has-submenu': isSubMenuOpen }"
            >
              <li @click="closeMenu">
                <router-link to="/holiday-workshops">Half Term</router-link>
              </li>
              <li @click="closeMenu">
                <router-link to="/summer-workshops"
                  >Summer Workshops</router-link
                >
              </li>
            </ul>
          </li> -->
          <li class="menu-item" @click="closeMenu">
            <a target="_blank" href="https://www.lotsoflovelyart.org/">Shop</a>
          </li>
          <li class="menu-item" @click="closeMenu">
            <router-link to="/about">About</router-link>
          </li>
          <li class="menu-item" @click="closeMenu">
            <router-link to="/faqs">FAQs</router-link>
          </li>
          <li class="menu-item" @click="openNewsletterModal">
            <a href="#" @click.prevent>Newsletter</a>
          </li>
        </ul>
      </div>
    </nav>
    <nav class="c-main-menu__secondary">
      <ul style="display: flex; align-items: center">
        <li class="mr-4" @click="closeMenu">
          <BasketMenuComponet />
        </li>
        <li>
          <div
            class="hamburger"
            :class="{ active: isMenuOpen }"
            @click="toggleMenu"
          >
            <span class="hamburger-line"></span>
            <span class="hamburger-line"></span>
            <span class="hamburger-line"></span>
          </div>
        </li>
      </ul>
    </nav>
  </header>
</template>
<script>
import { defineComponent, onMounted, ref } from "vue";
import BasketMenuComponet from "./BasketMenuComponent.vue";
import { useRoute } from "vue-router";
import eventBus from "@/eventBus";

export default defineComponent({
  components: {
    BasketMenuComponet,
  },
  setup() {
    const route = useRoute();
    const isMenuOpen = ref(false);
    const isSubMenuOpen = ref(false);

    const isMobile = ref(false);

    // Close the menu when a menu item is clicked
    const closeMenu = () => {
      isMenuOpen.value = false;
      handleBodyScroll(isMenuOpen.value);
    };

    const toggleSubMenu = (open) => {
      isSubMenuOpen.value = open;
    };

    const handleBodyScroll = (disable) => {
      if (disable) {
        document.body.classList.add("no-scroll");
      } else {
        document.body.classList.remove("no-scroll");
      }
    };

    const handleResize = () => {
      if (window.innerWidth <= 1023) {
        isMobile.value = true;
      } else {
        isMobile.value = false;
      }
    };

    const toggleMenu = () => {
      isMenuOpen.value = !isMenuOpen.value;
      handleBodyScroll(isMenuOpen.value);
    };

    const openNewsletterModal = () => {
      closeMenu();
      eventBus.emit("open-newsletter-modal");
    };

    onMounted(() => {
      handleResize();
      window.addEventListener("resize", handleResize);
    });

    return {
      isMenuOpen,
      toggleMenu,
      closeMenu,
      handleBodyScroll,
      toggleSubMenu,
      isMobile,
      isSubMenuOpen,
      route,
      openNewsletterModal,
    };
  },
});
</script>
<style lang="scss">
.c-main-menu {
  display: flex;
  width: 100%;
  align-items: center;

  &__list {
    .menu-item {
      color: var(--dark-grey);
      font-weight: var(--weight-medium);
    }
  }

  @media screen and (max-width: 1023px) {
    justify-content: flex-start;
    flex-direction: row;
  }
}

.hamburger {
  display: none;
  flex-direction: column;
  justify-content: space-around;
  width: 30px;
  height: 30px;
  cursor: pointer;
  z-index: 10;
  transition: transform 0.3s ease;

  &-line {
    width: 100%;
    height: 4px;
    background-color: black;
    transition: all 0.3s ease;
  }

  &.active .hamburger-line:nth-child(1) {
    transform: rotate(50deg) translate(10px, 8px);
  }

  &.active .hamburger-line:nth-child(2) {
    opacity: 0;
  }

  &.active .hamburger-line:nth-child(3) {
    transform: rotate(-45deg) translate(5px, -5px);
  }
}

@media only screen and (max-width: 1023px) {
  .hamburger {
    display: flex;
  }

  .c-main-menu__container {
    position: absolute;
    top: 100px;
    left: -102%;
    background-color: var(--white);
    color: white;
    width: 100% !important;
    height: 100vh !important;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: left 0.3s ease;
    z-index: 5;
  }

  .c-main-menu__container.active {
    left: 0;
  }

  .c-main-menu__list {
    flex-direction: column;
    align-items: center;
  }
}

nav {
  &:last-of-type {
    display: flex;
    align-items: center;
    align-self: flex-start;
  }
}
.c-header {
  align-items: center;
  background: #fff;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  position: relative;
  padding: 20px;
}

.c-header__logo {
  height: 38px;
  max-width: 350px;
  padding-right: 24px;
  width: auto;
}

.c-header__logo--mobile {
  display: none;
}

@media only screen and (max-width: 1023px) {
  .c-header__logo--mobile {
    display: block;
    max-width: 200px;
  }
}

@media only screen and (max-width: 400px) {
  .c-header__logo {
    width: 100%; // Use 100% of the container width
    // max-width: 150px;
  }
}

.c-main-menu {
  &__basket--icon {
    position: relative;
    width: 60px;
    height: 60px;
  }
  &__secondary {
    ul {
      list-style: none;
    }
  }
}

@media only screen and (max-width: 764px) {
  .c-main-menu {
    align-items: flex-start;
  }
}

.c-main-menu__container {
  height: 100%;
  width: calc(100% + 17px);
  display: flex;
  justify-content: flex-end;
  margin-right: 40px;
}

.c-main-menu__list {
  align-items: center;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: center;
  list-style: none;
}
.c-main-menu__list li {
  padding: 0 15px;
  line-height: 40px;
}
@media only screen and (max-width: 1023px) {
  .c-main-menu__list li {
    padding: 0;
    display: block;
  }
  .c-main-menu__list li a {
    padding: 20px;
    display: block;
  }

  .c-main-menu__container {
    justify-content: flex-start;
    align-items: flex-start;
    margin-right: 0;
  }
}

@media only screen and (max-width: 764px) {
  // .c-main-menu__list li a {
  //   padding: 5px 0;
  // }

  // .c-main-menu__container {
  //   justify-content: flex-start;
  //   margin-right: 0;
  // }
}

.c-main-menu__list li a,
.c-main-menu__list li span {
  color: var(--dark-grey);
  text-decoration: none;
  text-transform: uppercase;
  transition: color 0.4s ease-in-out;
  font-size: 14.4px;
  font-family: var(--font-family);
}
@media (min-width: 1024px) and (max-width: 1200px) {
  .c-main-menu__list li a {
    font-size: 90%;
  }
}
.c-main-menu__list li a:hover {
  color: var(--yellow);
  transition: color 0.4s ease-in-out;
}

@media only screen and (max-width: 1023px) {
  .c-main-menu__list {
    align-items: flex-start;
    flex-direction: column;
    justify-content: flex-start;
  }
}

@media only screen and (max-width: 764px) {
  // .c-main-menu__list {
  //   align-items: flex-start;
  //   flex-direction: column;
  // }
}

.c-main-menu__list li {
  height: 40px;
  position: relative;
}
@media only screen and (max-width: 1023px) {
  .c-main-menu__list li {
    height: auto;
    text-align: center;
  }
}

.c-header {
  padding: 20px 20px 10px;
}
@media only screen and (max-width: 1023px) {
  .c-header {
    padding: 20px;
  }
}

.has-submenu {
  position: relative;
}

.submenu {
  position: absolute;
  background-color: white;
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  top: 100%;
  left: 0;
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
  z-index: 10;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s ease, visibility 0.3s ease;
}

// :hover .submenu

.has-submenu {
  opacity: 1;
  visibility: visible;
}
</style>
