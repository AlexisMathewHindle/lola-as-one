<template>
  <div class="slider-container">
    <div class="slider" :style="sliderStyles">
      <div
        class="slide"
        v-for="(image, index) in images"
        :key="index"
        :style="slideStyles"
      >
        <img :src="image" class="slider-image" alt="Slider Image" />
      </div>
    </div>
    <div class="nav prev" @click="prevSlide">
      <v-icon>mdi-chevron-left</v-icon>
    </div>
    <div class="nav next" @click="nextSlide">
      <v-icon>mdi-chevron-right</v-icon>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";

export default {
  name: "ImageSlider",
  props: {
    images: {
      type: Array,
      required: true,
    },
    autoSlide: {
      type: Boolean,
      default: false,
    },
    slideInterval: {
      type: Number,
      default: 3000,
    },
  },
  setup(props) {
    const currentIndex = ref(0);
    const visibleImages = ref(5); // Default to 5 images
    const updateVisibleImages = () => {
      const width = window.innerWidth;
      if (width >= 1024) {
        visibleImages.value = 5; // Desktop
      } else if (width >= 768) {
        visibleImages.value = 3; // Tablet
      } else {
        visibleImages.value = 1; // Mobile
      }
    };

    const slideWidth = computed(() => 100 / visibleImages.value);

    const sliderStyles = computed(() => ({
      display: "flex",
      transition: "transform 0.5s ease-in-out",
      width: `${props.images.length * (100 / visibleImages.value)}%`,
      transform: `translateX(-${currentIndex.value * slideWidth.value}%)`,
    }));

    const slideStyles = computed(() => ({
      flex: `0 0 ${100 / visibleImages.value}%`,
    }));

    const nextSlide = () => {
      if (currentIndex.value < props.images.length - visibleImages.value) {
        currentIndex.value += 1;
      } else {
        currentIndex.value = 0;
      }
    };

    const prevSlide = () => {
      if (currentIndex.value > 0) {
        currentIndex.value -= 1;
      } else {
        currentIndex.value = props.images.length - visibleImages.value;
      }
    };

    let resizeObserver;
    onMounted(() => {
      updateVisibleImages();
      window.addEventListener("resize", updateVisibleImages);
    });

    onBeforeUnmount(() => {
      window.removeEventListener("resize", updateVisibleImages);
    });

    return { currentIndex, nextSlide, prevSlide, sliderStyles, slideStyles };
  },
};
</script>

<style scoped>
.slider-container {
  position: relative;
  width: 100%;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
}

.slider {
  display: flex;
  transition: transform 0.5s ease-in-out;
}

.slide {
  transition: opacity 0.5s ease-in-out;
  margin-right: 10px;
  flex-shrink: 0;
  display: flex;
  justify-content: center;
  align-items: center; /* Ensure the image is centered in the slide */
}

/* Image Styles: Ensure proper centering and scaling */
.slider-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain; /* Ensures image is contained within parent */
}

/* Responsive height for the slider-container */
.slider-container {
  height: auto;
  max-height: 50vh; /* Limit max height relative to viewport height */
}

@media (max-width: 1024px) {
  .slider-container {
    max-height: 40vh; /* Reduce height for tablets */
  }
}

@media (max-width: 768px) {
  .slider-container {
    max-height: 30vh; /* Further reduce height for mobile */
  }
}

.nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background-color: var(--yellow);
  border: none;
  color: white;
  padding: 10px;
  cursor: pointer;
  border-radius: 50%;
}

.nav.prev {
  left: 10px;
}

.nav.next {
  right: 10px;
}
</style>
