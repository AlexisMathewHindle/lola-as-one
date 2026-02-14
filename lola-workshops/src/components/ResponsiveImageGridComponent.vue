<template>
  <v-container>
    <div class="image-grid">
      <img
        v-for="(image, index) in displayedImages"
        :key="index"
        :src="image.src"
        :alt="image.alt"
        class="grid-image"
      />
    </div>
  </v-container>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";

// Define your images array
const images = [
  { src: "/img/images/shape_01.svg", alt: "Image 1" },
  { src: "/img/images/shape_02.svg", alt: "Image 2" },
  { src: "/img/images/shape_03.svg", alt: "Image 3" },
  { src: "/img/images/shape_04.svg", alt: "Image 4" },
  { src: "/img/images/shape_05.svg", alt: "Image 5" },
  { src: "/img/images/shape_06.svg", alt: "Image 6" },
  { src: "/img/images/shape_07.svg", alt: "Image 7" },
  { src: "/img/images/shape_08.svg", alt: "Image 8" },
  { src: "/img/images/shape_09.svg", alt: "Image 9" },
  { src: "/img/images/shape_10.svg", alt: "Image 10" },
  { src: "/img/images/shape_11.svg", alt: "Image 11" },
  { src: "/img/images/shape_12.svg", alt: "Image 12" },
];

const shuffledImages = ref([]); // Hold the shuffled images
const displayedImages = ref([]);

// Function to shuffle an array
const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]; // Swap elements
  }
  return array;
};

// Function to update the displayed images based on screen size
const updateDisplayedImages = () => {
  const screenWidth = window.innerWidth;
  if (screenWidth > 1024) {
    displayedImages.value = shuffledImages.value.slice(0, 6); // Show 6 images for large screens
  } else if (screenWidth > 768) {
    displayedImages.value = shuffledImages.value.slice(0, 3); // Show 3 images for tablets
  } else {
    displayedImages.value = shuffledImages.value.slice(0, 1); // Show 1 image for phones
  }
};

onMounted(() => {
  shuffledImages.value = shuffleArray([...images]); // Shuffle once when component is mounted
  updateDisplayedImages(); // Initial display update based on screen size
  window.addEventListener("resize", updateDisplayedImages); // Update displayed images on resize
});

onUnmounted(() => {
  window.removeEventListener("resize", updateDisplayedImages); // Clean up listener on unmount
});
</script>

<style scoped>
.image-grid {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(6, 1fr); /* Default to 6 columns */
}

.grid-image {
  width: 100%;
  height: auto;
  object-fit: cover;
}

/* Responsive adjustments using media queries */
@media (max-width: 1024px) {
  .image-grid {
    grid-template-columns: repeat(3, 1fr); /* 3 columns for tablets */
  }
}

@media (max-width: 768px) {
  .grid-image {
    margin: 0 auto;
    width: 50%;
  }

  .image-grid {
    grid-template-columns: repeat(1, 1fr); /* 1 column for phones */
  }
}
</style>
