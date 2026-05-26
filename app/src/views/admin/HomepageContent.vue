<template>
  <div class="max-w-6xl space-y-6">
    <div class="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Homepage Content</h1>
        <p class="mt-1 text-sm text-gray-600">
          Manage the homepage hero slides, workshop calendar intro, image gallery, feature columns, banner panels, and reviews slider without editing JSON manually.
        </p>
      </div>

      <button
        @click="handleSave"
        :disabled="loading || saving"
        class="inline-flex items-center justify-center rounded-lg bg-primary-600 px-5 py-2.5 font-medium text-white shadow-sm transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <font-awesome-icon
          :icon="saving ? 'spinner' : 'save'"
          class="mr-2 h-4 w-4"
          :class="{ 'animate-spin': saving }"
        />
        {{ saving ? 'Saving...' : 'Save' }}
      </button>
    </div>

    <div
      v-if="error"
      class="rounded-lg border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700"
    >
      {{ error }}
    </div>

    <div v-if="loading" class="rounded-xl border border-gray-200 bg-white p-10 text-center">
      <div class="inline-block h-10 w-10 animate-spin rounded-full border-b-2 border-primary-600"></div>
      <p class="mt-4 text-sm text-gray-600">Loading homepage content...</p>
    </div>

    <template v-else>
      <section class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <div class="flex flex-col gap-4 border-b border-gray-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 class="text-lg font-semibold text-gray-900">Hero Slider</h2>
            <p class="mt-1 text-sm text-gray-600">
              Control the full-width homepage slideshow and the utility strap CTAs.
            </p>
          </div>

          <label class="inline-flex items-center gap-3 text-sm text-gray-700">
            <input
              v-model="heroSection.is_enabled"
              type="checkbox"
              class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            >
            Show hero section
          </label>
        </div>

        <div class="mt-6 grid gap-5 md:grid-cols-2">
          <div>
            <label class="mb-2 block text-sm font-medium text-gray-700">Autoplay (ms)</label>
            <input
              v-model.number="heroConfig.autoplay_ms"
              type="number"
              min="2500"
              step="500"
              class="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
          </div>
          <div>
            <label class="mb-2 block text-sm font-medium text-gray-700">Sort Order</label>
            <input
              v-model.number="heroSection.sort_order"
              type="number"
              min="0"
              step="10"
              class="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
          </div>
        </div>

        <div class="mt-8 space-y-6">
          <article
            v-for="(slide, index) in heroSlides"
            :key="`hero-slide-${index}`"
            class="rounded-xl border border-gray-200 bg-gray-50 p-5"
          >
            <div class="flex flex-col gap-3 border-b border-gray-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <h3 class="text-base font-semibold text-gray-900">Slide {{ index + 1 }}</h3>
              <div class="flex flex-wrap gap-2">
                <button
                  type="button"
                  @click="moveHeroSlide(index, -1)"
                  :disabled="index === 0"
                  class="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Move Up
                </button>
                <button
                  type="button"
                  @click="moveHeroSlide(index, 1)"
                  :disabled="index === heroSlides.length - 1"
                  class="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Move Down
                </button>
                <button
                  type="button"
                  @click="removeHeroSlide(index)"
                  :disabled="heroSlides.length === 1"
                  class="rounded-lg border border-danger-300 px-3 py-2 text-sm text-danger-700 transition-colors hover:bg-danger-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            </div>

            <div class="mt-5 grid gap-6 xl:grid-cols-[1.1fr_1.4fr]">
              <div>
                <label class="mb-2 block text-sm font-medium text-gray-700">Slide Image</label>
                <ImageUploader
                  v-model="slide.image_url"
                  bucket="site-images"
                  :alt="slide.headline || `Homepage hero slide ${index + 1}`"
                />
              </div>

              <div class="space-y-5">
                <div>
                  <label class="mb-2 block text-sm font-medium text-gray-700">Eyebrow</label>
                  <input
                    v-model="slide.eyebrow"
                    type="text"
                    class="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                </div>

                <div>
                  <label class="mb-2 block text-sm font-medium text-gray-700">Headline</label>
                  <input
                    v-model="slide.headline"
                    type="text"
                    class="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                </div>

                <div>
                  <label class="mb-2 block text-sm font-medium text-gray-700">Subheading</label>
                  <textarea
                    v-model="slide.subheading"
                    rows="3"
                    class="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
                  ></textarea>
                </div>

                <div class="grid gap-5 lg:grid-cols-2">
                  <div class="space-y-4 rounded-xl border border-gray-200 bg-white p-4">
                    <h4 class="text-sm font-semibold text-gray-900">Primary CTA</h4>

                    <div>
                      <label class="mb-2 block text-sm font-medium text-gray-700">Label</label>
                      <input
                        v-model="slide.primary_cta.label"
                        type="text"
                        class="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                    </div>

                    <div>
                      <label class="mb-2 block text-sm font-medium text-gray-700">Link Type</label>
                      <div class="relative">
                        <select
                          :value="ctaLinkType(slide.primary_cta)"
                          class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
                          @change="setCtaLinkType(slide.primary_cta, $event.target.value)"
                        >
                          <option value="page">Page</option>
                          <option value="custom">Custom URL or Anchor</option>
                        </select>
                        <font-awesome-icon icon="chevron-down" class="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400" />
                      </div>
                    </div>

                    <div v-if="ctaLinkType(slide.primary_cta) === 'page'">
                      <label class="mb-2 block text-sm font-medium text-gray-700">Linked Page</label>
                      <div class="relative">
                        <select
                          v-model="slide.primary_cta.page_key"
                          class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="">Select page</option>
                          <option
                            v-for="page in pageOptions"
                            :key="page.id"
                            :value="page.page_key"
                          >
                            {{ page.title }}
                          </option>
                        </select>
                        <font-awesome-icon icon="chevron-down" class="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400" />
                      </div>
                    </div>

                    <div v-else>
                      <label class="mb-2 block text-sm font-medium text-gray-700">URL or Anchor</label>
                      <input
                        v-model="slide.primary_cta.href"
                        type="text"
                        class="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="#home_schedule or https://..."
                      >
                    </div>
                  </div>

                  <div class="space-y-4 rounded-xl border border-gray-200 bg-white p-4">
                    <h4 class="text-sm font-semibold text-gray-900">Secondary CTA</h4>

                    <div>
                      <label class="mb-2 block text-sm font-medium text-gray-700">Label</label>
                      <input
                        v-model="slide.secondary_cta.label"
                        type="text"
                        class="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                    </div>

                    <div>
                      <label class="mb-2 block text-sm font-medium text-gray-700">Link Type</label>
                      <div class="relative">
                        <select
                          :value="ctaLinkType(slide.secondary_cta)"
                          class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
                          @change="setCtaLinkType(slide.secondary_cta, $event.target.value)"
                        >
                          <option value="page">Page</option>
                          <option value="custom">Custom URL or Anchor</option>
                        </select>
                        <font-awesome-icon icon="chevron-down" class="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400" />
                      </div>
                    </div>

                    <div v-if="ctaLinkType(slide.secondary_cta) === 'page'">
                      <label class="mb-2 block text-sm font-medium text-gray-700">Linked Page</label>
                      <div class="relative">
                        <select
                          v-model="slide.secondary_cta.page_key"
                          class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="">Select page</option>
                          <option
                            v-for="page in pageOptions"
                            :key="page.id"
                            :value="page.page_key"
                          >
                            {{ page.title }}
                          </option>
                        </select>
                        <font-awesome-icon icon="chevron-down" class="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400" />
                      </div>
                    </div>

                    <div v-else>
                      <label class="mb-2 block text-sm font-medium text-gray-700">URL or Anchor</label>
                      <input
                        v-model="slide.secondary_cta.href"
                        type="text"
                        class="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="#home_schedule or https://..."
                      >
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </article>
        </div>

        <button
          type="button"
          @click="addHeroSlide"
          class="mt-6 inline-flex items-center justify-center rounded-lg border border-primary-300 px-4 py-2.5 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-50"
        >
          <font-awesome-icon icon="plus" class="mr-2 h-4 w-4" />
          Add Hero Slide
        </button>
      </section>

      <section class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <div class="flex flex-col gap-4 border-b border-gray-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 class="text-lg font-semibold text-gray-900">Workshop Calendar Intro</h2>
            <p class="mt-1 text-sm text-gray-600">
              Control the heading and CTA above the live workshops calendar on the homepage.
            </p>
          </div>

          <label class="inline-flex items-center gap-3 text-sm text-gray-700">
            <input
              v-model="scheduleSection.is_enabled"
              type="checkbox"
              class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            >
            Show calendar section
          </label>
        </div>

        <div class="mt-6 grid gap-5 md:grid-cols-2">
          <div>
            <label class="mb-2 block text-sm font-medium text-gray-700">Eyebrow</label>
            <input
              v-model="scheduleConfig.eyebrow"
              type="text"
              class="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
          </div>

          <div>
            <label class="mb-2 block text-sm font-medium text-gray-700">Title</label>
            <input
              v-model="scheduleConfig.title"
              type="text"
              class="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
          </div>

          <div class="md:col-span-2">
            <label class="mb-2 block text-sm font-medium text-gray-700">Intro</label>
            <textarea
              v-model="scheduleConfig.intro"
              rows="3"
              class="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
            ></textarea>
          </div>

          <div>
            <label class="mb-2 block text-sm font-medium text-gray-700">CTA Label</label>
            <input
              v-model="scheduleConfig.primary_cta.label"
              type="text"
              class="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
          </div>

          <div>
            <label class="mb-2 block text-sm font-medium text-gray-700">CTA Page</label>
            <div class="relative">
              <select
                v-model="scheduleConfig.primary_cta.page_key"
                class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Select page</option>
                <option
                  v-for="page in pageOptions"
                  :key="page.id"
                  :value="page.page_key"
                >
                  {{ page.title }}
                </option>
              </select>
              <font-awesome-icon icon="chevron-down" class="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
        </div>
      </section>

      <section class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <div class="flex flex-col gap-4 border-b border-gray-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 class="text-lg font-semibold text-gray-900">Image Slider</h2>
            <p class="mt-1 text-sm text-gray-600">
              Add as many gallery images as you need. The public slider will paginate through them in groups.
            </p>
          </div>

          <label class="inline-flex items-center gap-3 text-sm text-gray-700">
            <input
              v-model="gallerySection.is_enabled"
              type="checkbox"
              class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            >
            Show image slider
          </label>
        </div>

        <div class="mt-6 grid gap-5 md:grid-cols-2">
          <div>
            <label class="mb-2 block text-sm font-medium text-gray-700">Eyebrow</label>
            <input
              v-model="galleryConfig.eyebrow"
              type="text"
              class="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
          </div>

          <div>
            <label class="mb-2 block text-sm font-medium text-gray-700">Title</label>
            <input
              v-model="galleryConfig.title"
              type="text"
              class="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
          </div>

          <div class="md:col-span-2">
            <label class="mb-2 block text-sm font-medium text-gray-700">Intro</label>
            <textarea
              v-model="galleryConfig.intro"
              rows="3"
              class="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
            ></textarea>
          </div>
        </div>

        <div class="mt-8 space-y-6">
          <article
            v-for="(item, index) in galleryItems"
            :key="`gallery-item-${index}`"
            class="rounded-xl border border-gray-200 bg-gray-50 p-5"
          >
            <div class="flex flex-col gap-3 border-b border-gray-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <h3 class="text-base font-semibold text-gray-900">Gallery Image {{ index + 1 }}</h3>
              <div class="flex flex-wrap gap-2">
                <button
                  type="button"
                  @click="moveGalleryItem(index, -1)"
                  :disabled="index === 0"
                  class="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Move Up
                </button>
                <button
                  type="button"
                  @click="moveGalleryItem(index, 1)"
                  :disabled="index === galleryItems.length - 1"
                  class="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Move Down
                </button>
                <button
                  type="button"
                  @click="removeGalleryItem(index)"
                  :disabled="galleryItems.length === 1"
                  class="rounded-lg border border-danger-300 px-3 py-2 text-sm text-danger-700 transition-colors hover:bg-danger-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            </div>

            <div class="mt-5 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
              <div>
                <label class="mb-2 block text-sm font-medium text-gray-700">Image</label>
                <ImageUploader
                  v-model="item.image_url"
                  bucket="site-images"
                  :alt="item.alt || `Homepage gallery image ${index + 1}`"
                />
              </div>

              <div class="space-y-5">
                <div>
                  <label class="mb-2 block text-sm font-medium text-gray-700">Alt Text</label>
                  <input
                    v-model="item.alt"
                    type="text"
                    class="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                </div>

                <div>
                  <label class="mb-2 block text-sm font-medium text-gray-700">Fallback Background</label>
                  <input
                    v-model="item.background"
                    type="text"
                    class="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="linear-gradient(135deg, #ead9bf, #d7a774)"
                  >
                </div>
              </div>
            </div>
          </article>
        </div>

        <button
          type="button"
          @click="addGalleryItem"
          class="mt-6 inline-flex items-center justify-center rounded-lg border border-primary-300 px-4 py-2.5 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-50"
        >
          <font-awesome-icon icon="plus" class="mr-2 h-4 w-4" />
          Add Gallery Image
        </button>
      </section>

      <section class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <div class="flex flex-col gap-4 border-b border-gray-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 class="text-lg font-semibold text-gray-900">Three-Column Feature Strip</h2>
            <p class="mt-1 text-sm text-gray-600">
              Manage the three informational columns that sit beneath the image slider.
            </p>
          </div>

          <label class="inline-flex items-center gap-3 text-sm text-gray-700">
            <input
              v-model="featureColumnsSection.is_enabled"
              type="checkbox"
              class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            >
            Show feature strip
          </label>
        </div>

        <div class="mt-6">
          <label class="mb-2 block text-sm font-medium text-gray-700">Sort Order</label>
          <input
            v-model.number="featureColumnsSection.sort_order"
            type="number"
            min="0"
            step="5"
            class="max-w-48 rounded-lg border border-gray-300 px-4 py-2.5 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
        </div>

        <div class="mt-8 space-y-6">
          <article
            v-for="(item, index) in featureColumnItems"
            :key="`feature-column-${index}`"
            class="rounded-xl border border-gray-200 bg-gray-50 p-5"
          >
            <div class="flex flex-col gap-3 border-b border-gray-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <h3 class="text-base font-semibold text-gray-900">Column {{ index + 1 }}</h3>
              <div class="flex flex-wrap gap-2">
                <button
                  type="button"
                  @click="moveFeatureColumn(index, -1)"
                  :disabled="index === 0"
                  class="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Move Left
                </button>
                <button
                  type="button"
                  @click="moveFeatureColumn(index, 1)"
                  :disabled="index === featureColumnItems.length - 1"
                  class="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Move Right
                </button>
                <button
                  type="button"
                  @click="removeFeatureColumn(index)"
                  :disabled="featureColumnItems.length <= 1"
                  class="rounded-lg border border-danger-300 px-3 py-2 text-sm text-danger-700 transition-colors hover:bg-danger-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            </div>

            <div class="mt-5 grid gap-5 md:grid-cols-2">
              <div>
                <label class="mb-2 block text-sm font-medium text-gray-700">Icon</label>
                <div class="relative">
                  <select
                    v-model="item.icon"
                    class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option
                      v-for="option in featureIconOptions"
                      :key="option.value"
                      :value="option.value"
                    >
                      {{ option.label }}
                    </option>
                  </select>
                  <font-awesome-icon icon="chevron-down" class="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              <div>
                <label class="mb-2 block text-sm font-medium text-gray-700">Title</label>
                <input
                  v-model="item.title"
                  type="text"
                  class="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
              </div>

              <div class="md:col-span-2">
                <label class="mb-2 block text-sm font-medium text-gray-700">Body Copy</label>
                <textarea
                  v-model="item.body"
                  rows="3"
                  class="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
                ></textarea>
              </div>
            </div>
          </article>
        </div>

        <button
          type="button"
          @click="addFeatureColumn"
          class="mt-6 inline-flex items-center justify-center rounded-lg border border-primary-300 px-4 py-2.5 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-50"
        >
          <font-awesome-icon icon="plus" class="mr-2 h-4 w-4" />
          Add Column
        </button>
      </section>

      <section class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <div class="flex flex-col gap-4 border-b border-gray-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 class="text-lg font-semibold text-gray-900">Banner Panels</h2>
            <p class="mt-1 text-sm text-gray-600">
              Manage the alternating image-and-copy banners shown below the three-column strip.
            </p>
          </div>

          <label class="inline-flex items-center gap-3 text-sm text-gray-700">
            <input
              v-model="bannerSection.is_enabled"
              type="checkbox"
              class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            >
            Show banner panels
          </label>
        </div>

        <div class="mt-6">
          <label class="mb-2 block text-sm font-medium text-gray-700">Sort Order</label>
          <input
            v-model.number="bannerSection.sort_order"
            type="number"
            min="0"
            step="5"
            class="max-w-48 rounded-lg border border-gray-300 px-4 py-2.5 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
        </div>

        <div class="mt-8 space-y-6">
          <article
            v-for="(item, index) in bannerItems"
            :key="`banner-item-${index}`"
            class="rounded-xl border border-gray-200 bg-gray-50 p-5"
          >
            <div class="flex flex-col gap-3 border-b border-gray-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <h3 class="text-base font-semibold text-gray-900">Banner {{ index + 1 }}</h3>
              <div class="flex flex-wrap gap-2">
                <button
                  type="button"
                  @click="moveBannerItem(index, -1)"
                  :disabled="index === 0"
                  class="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Move Up
                </button>
                <button
                  type="button"
                  @click="moveBannerItem(index, 1)"
                  :disabled="index === bannerItems.length - 1"
                  class="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Move Down
                </button>
                <button
                  type="button"
                  @click="removeBannerItem(index)"
                  :disabled="bannerItems.length <= 1"
                  class="rounded-lg border border-danger-300 px-3 py-2 text-sm text-danger-700 transition-colors hover:bg-danger-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            </div>

            <div class="mt-5 grid gap-6 xl:grid-cols-[1.05fr_1.4fr]">
              <div>
                <label class="mb-2 block text-sm font-medium text-gray-700">Banner Image</label>
                <ImageUploader
                  v-model="item.image_url"
                  bucket="site-images"
                  :alt="item.image_alt || item.title || `Homepage banner image ${index + 1}`"
                />
              </div>

              <div class="space-y-5">
                <div class="grid gap-5 md:grid-cols-2">
                  <div>
                    <label class="mb-2 block text-sm font-medium text-gray-700">Eyebrow</label>
                    <input
                      v-model="item.eyebrow"
                      type="text"
                      class="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                  </div>

                  <div>
                    <label class="mb-2 block text-sm font-medium text-gray-700">Image Position</label>
                    <div class="relative">
                      <select
                        v-model="item.image_side"
                        class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="left">Image left</option>
                        <option value="right">Image right</option>
                      </select>
                      <font-awesome-icon icon="chevron-down" class="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400" />
                    </div>
                  </div>
                </div>

                <div>
                  <label class="mb-2 block text-sm font-medium text-gray-700">Title</label>
                  <input
                    v-model="item.title"
                    type="text"
                    class="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                </div>

                <div>
                  <label class="mb-2 block text-sm font-medium text-gray-700">Body Paragraphs</label>
                  <textarea
                    v-model="item.body_text"
                    rows="5"
                    class="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Separate paragraphs with a blank line"
                  ></textarea>
                </div>

                <div>
                  <div class="mb-3 flex items-center justify-between">
                    <label class="block text-sm font-medium text-gray-700">Buttons</label>
                    <button
                      type="button"
                      @click="addBannerCta(item)"
                      class="rounded-lg border border-primary-300 px-3 py-2 text-sm text-primary-700 transition-colors hover:bg-primary-50"
                    >
                      Add Button
                    </button>
                  </div>

                  <div class="space-y-4">
                    <div
                      v-for="(cta, ctaIndex) in item.ctas"
                      :key="`banner-${index}-cta-${ctaIndex}`"
                      class="rounded-lg border border-gray-200 bg-white p-4"
                    >
                      <div class="mb-4 flex justify-end">
                        <button
                          type="button"
                          @click="removeBannerCta(item, ctaIndex)"
                          class="text-sm text-danger-700 transition-colors hover:text-danger-800"
                        >
                          Remove
                        </button>
                      </div>

                      <div class="grid gap-4 md:grid-cols-3">
                        <div>
                          <label class="mb-2 block text-sm font-medium text-gray-700">Label</label>
                          <input
                            v-model="cta.label"
                            type="text"
                            class="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
                          >
                        </div>

                        <div>
                          <label class="mb-2 block text-sm font-medium text-gray-700">Link Type</label>
                          <div class="relative">
                            <select
                              :value="ctaLinkType(cta)"
                              class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
                              @change="setCtaLinkType(cta, $event.target.value)"
                            >
                              <option value="page">Page</option>
                              <option value="custom">Custom URL</option>
                            </select>
                            <font-awesome-icon icon="chevron-down" class="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400" />
                          </div>
                        </div>

                        <div v-if="ctaLinkType(cta) === 'page'">
                          <label class="mb-2 block text-sm font-medium text-gray-700">Linked Page</label>
                          <div class="relative">
                            <select
                              v-model="cta.page_key"
                              class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                              <option value="">Select page</option>
                              <option
                                v-for="page in pageOptions"
                                :key="page.id"
                                :value="page.page_key"
                              >
                                {{ page.title }}
                              </option>
                            </select>
                            <font-awesome-icon icon="chevron-down" class="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400" />
                          </div>
                        </div>

                        <div v-else>
                          <label class="mb-2 block text-sm font-medium text-gray-700">URL</label>
                          <input
                            v-model="cta.href"
                            type="text"
                            class="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="/workshops or https://..."
                          >
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div class="mb-3 flex items-center justify-between">
                    <label class="block text-sm font-medium text-gray-700">Icon Row</label>
                    <button
                      type="button"
                      @click="addBannerIcon(item)"
                      class="rounded-lg border border-primary-300 px-3 py-2 text-sm text-primary-700 transition-colors hover:bg-primary-50"
                    >
                      Add Icon
                    </button>
                  </div>

                  <div class="space-y-3">
                    <div
                      v-for="(icon, iconIndex) in item.icons"
                      :key="`banner-${index}-icon-${iconIndex}`"
                      class="grid gap-3 rounded-lg border border-gray-200 bg-white p-4 md:grid-cols-[1fr_1fr_1fr_auto]"
                    >
                      <div>
                        <label class="mb-2 block text-sm font-medium text-gray-700">Type</label>
                        <div class="relative">
                          <select
                            v-model="icon.type"
                            class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
                          >
                            <option value="icon">Font Awesome icon</option>
                            <option value="image">Uploaded image</option>
                          </select>
                          <font-awesome-icon icon="chevron-down" class="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400" />
                        </div>
                      </div>

                      <div v-if="icon.type !== 'image'">
                        <label class="mb-2 block text-sm font-medium text-gray-700">Icon</label>
                        <div class="relative">
                          <select
                            v-model="icon.name"
                            class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
                          >
                            <option
                              v-for="option in bannerIconOptions"
                              :key="option.value"
                              :value="option.value"
                            >
                              {{ option.label }}
                            </option>
                          </select>
                          <font-awesome-icon icon="chevron-down" class="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-gray-400" />
                        </div>
                      </div>

                      <div v-else>
                        <label class="mb-2 block text-sm font-medium text-gray-700">Image</label>
                        <ImageUploader
                          v-model="icon.image_url"
                          bucket="site-images"
                          :alt="icon.alt || `Banner icon image ${iconIndex + 1}`"
                        />
                      </div>

                      <div v-if="icon.type !== 'image'">
                        <label class="mb-2 block text-sm font-medium text-gray-700">Color</label>
                        <input
                          v-model="icon.color"
                          type="text"
                          class="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
                          placeholder="#d7b15d"
                        >
                      </div>

                      <div v-else>
                        <label class="mb-2 block text-sm font-medium text-gray-700">Alt Text</label>
                        <input
                          v-model="icon.alt"
                          type="text"
                          class="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                      </div>

                      <div class="flex items-end">
                        <button
                          type="button"
                          @click="removeBannerIcon(item, iconIndex)"
                          class="rounded-lg border border-danger-300 px-3 py-2 text-sm text-danger-700 transition-colors hover:bg-danger-50"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </article>
        </div>

        <button
          type="button"
          @click="addBannerItem"
          class="mt-6 inline-flex items-center justify-center rounded-lg border border-primary-300 px-4 py-2.5 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-50"
        >
          <font-awesome-icon icon="plus" class="mr-2 h-4 w-4" />
          Add Banner
        </button>
      </section>

      <section class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <div class="flex flex-col gap-4 border-b border-gray-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 class="text-lg font-semibold text-gray-900">Reviews Slider</h2>
            <p class="mt-1 text-sm text-gray-600">
              Manage the centered testimonial slider shown below the homepage banners.
            </p>
          </div>

          <label class="inline-flex items-center gap-3 text-sm text-gray-700">
            <input
              v-model="testimonialSection.is_enabled"
              type="checkbox"
              class="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            >
            Show reviews slider
          </label>
        </div>

        <div class="mt-6 grid gap-5 lg:grid-cols-2">
          <div>
            <label class="mb-2 block text-sm font-medium text-gray-700">Eyebrow</label>
            <input
              v-model="testimonialConfig.eyebrow"
              type="text"
              class="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
          </div>

          <div>
            <label class="mb-2 block text-sm font-medium text-gray-700">Title</label>
            <input
              v-model="testimonialConfig.title"
              type="text"
              class="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
          </div>

          <div>
            <label class="mb-2 block text-sm font-medium text-gray-700">Autoplay (ms)</label>
            <input
              v-model.number="testimonialConfig.autoplay_ms"
              type="number"
              min="2500"
              step="500"
              class="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
          </div>

          <div>
            <label class="mb-2 block text-sm font-medium text-gray-700">Sort Order</label>
            <input
              v-model.number="testimonialSection.sort_order"
              type="number"
              min="0"
              step="5"
              class="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
          </div>

          <div class="lg:col-span-2">
            <label class="mb-2 block text-sm font-medium text-gray-700">Intro</label>
            <textarea
              v-model="testimonialConfig.intro"
              rows="3"
              class="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
            ></textarea>
          </div>
        </div>

        <div class="mt-8 space-y-6">
          <article
            v-for="(item, index) in testimonialItems"
            :key="`testimonial-${index}`"
            class="rounded-xl border border-gray-200 bg-gray-50 p-5"
          >
            <div class="flex flex-col gap-3 border-b border-gray-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <h3 class="text-base font-semibold text-gray-900">Review {{ index + 1 }}</h3>
              <div class="flex flex-wrap gap-2">
                <button
                  type="button"
                  @click="moveTestimonial(index, -1)"
                  :disabled="index === 0"
                  class="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Move Up
                </button>
                <button
                  type="button"
                  @click="moveTestimonial(index, 1)"
                  :disabled="index === testimonialItems.length - 1"
                  class="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Move Down
                </button>
                <button
                  type="button"
                  @click="removeTestimonial(index)"
                  :disabled="testimonialItems.length <= 1"
                  class="rounded-lg border border-danger-300 px-3 py-2 text-sm text-danger-700 transition-colors hover:bg-danger-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            </div>

            <div class="mt-5 grid gap-5 lg:grid-cols-2">
              <div class="lg:col-span-2">
                <label class="mb-2 block text-sm font-medium text-gray-700">Quote</label>
                <textarea
                  v-model="item.quote"
                  rows="4"
                  class="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
                ></textarea>
              </div>

              <div>
                <label class="mb-2 block text-sm font-medium text-gray-700">Name</label>
                <input
                  v-model="item.name"
                  type="text"
                  class="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
              </div>

              <div>
                <label class="mb-2 block text-sm font-medium text-gray-700">Role</label>
                <input
                  v-model="item.role"
                  type="text"
                  class="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Parent"
                >
              </div>

              <div class="max-w-48">
                <label class="mb-2 block text-sm font-medium text-gray-700">Stars</label>
                <input
                  v-model.number="item.stars"
                  type="number"
                  min="1"
                  max="5"
                  step="1"
                  class="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
              </div>
            </div>
          </article>
        </div>

        <button
          type="button"
          @click="addTestimonial"
          class="mt-6 inline-flex items-center justify-center rounded-lg border border-primary-300 px-4 py-2.5 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-50"
        >
          <font-awesome-icon icon="plus" class="mr-2 h-4 w-4" />
          Add Review
        </button>
      </section>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { supabase } from '../../lib/supabase'
import ImageUploader from '../../components/shared/ImageUploader.vue'
import { getAdminPageWithSectionsByKey, getPublishedSitePages, upsertPageSections } from '../../lib/cms'
import { useToastStore } from '../../stores/toast'

const toastStore = useToastStore()

const loading = ref(true)
const saving = ref(false)
const error = ref(null)
const homePageId = ref(null)
const pageOptions = ref([])
const originalSectionConfigs = ref(new Map())

const heroSection = reactive(createHeroSection())
const scheduleSection = reactive(createScheduleSection())
const featureColumnsSection = reactive(createFeatureColumnsSection())
const bannerSection = reactive(createBannerSection())
const gallerySection = reactive(createGallerySection())
const testimonialSection = reactive(createTestimonialSection())

const heroConfig = heroSection.config_json
const scheduleConfig = scheduleSection.config_json
const featureColumnsConfig = featureColumnsSection.config_json
const bannerConfig = bannerSection.config_json
const galleryConfig = gallerySection.config_json
const testimonialConfig = testimonialSection.config_json

const heroSlides = computed(() => heroConfig.slides)
const featureColumnItems = computed(() => featureColumnsConfig.items)
const bannerItems = computed(() => bannerConfig.items)
const galleryItems = computed(() => galleryConfig.items)
const testimonialItems = computed(() => testimonialConfig.items)

const featureIconOptions = [
  { value: 'mug-hot', label: 'Coffee cup' },
  { value: 'cake-candles', label: 'Cake' },
  { value: 'book-open', label: 'Book' },
  { value: 'gift', label: 'Gift' },
  { value: 'paint-brush', label: 'Paint brush' },
  { value: 'palette', label: 'Palette' }
]

const bannerIconOptions = [
  { value: 'heart', label: 'Heart' },
  { value: 'gift', label: 'Gift' },
  { value: 'mug-hot', label: 'Coffee cup' },
  { value: 'paint-brush', label: 'Paint brush' },
  { value: 'palette', label: 'Palette' },
  { value: 'star', label: 'Star' },
  { value: 'baby', label: 'Baby' },
  { value: 'cake-candles', label: 'Cake' },
  { value: 'book-open', label: 'Book' }
]

function cloneValue(value) {
  if (value === undefined) return undefined
  return JSON.parse(JSON.stringify(value))
}

function isPlainObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]'
}

function valuesEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b)
}

function diffJsonValue(originalValue, nextValue) {
  if (valuesEqual(originalValue, nextValue)) return undefined

  if (Array.isArray(originalValue) && Array.isArray(nextValue)) {
    const canPatchByIndex = originalValue.length === nextValue.length &&
      nextValue.every(isPlainObject) &&
      originalValue.every(isPlainObject)

    if (!canPatchByIndex) return cloneValue(nextValue)

    return nextValue.map((item, index) => {
      const itemPatch = diffJsonValue(originalValue[index], item)

      if (itemPatch === undefined) {
        return item.id ? { id: item.id } : {}
      }

      if (isPlainObject(itemPatch) && item.id && itemPatch.id === undefined) {
        return { id: item.id, ...itemPatch }
      }

      return itemPatch
    })
  }

  if (isPlainObject(originalValue) && isPlainObject(nextValue)) {
    const patch = {}

    Object.entries(nextValue).forEach(([key, value]) => {
      const fieldPatch = diffJsonValue(originalValue[key], value)
      if (fieldPatch !== undefined) {
        patch[key] = fieldPatch
      }
    })

    return Object.keys(patch).length ? patch : undefined
  }

  return cloneValue(nextValue)
}

function configPatchForSection(section, nextConfig) {
  if (!section.id || !originalSectionConfigs.value.has(section.section_key)) {
    return nextConfig
  }

  return diffJsonValue(originalSectionConfigs.value.get(section.section_key), nextConfig) || {}
}

function createDefaultCta(link = {}) {
  return {
    id: link.id || undefined,
    label: link.label || '',
    page_key: link.page_key || '',
    href: link.href || '',
    open_in_new_tab: Boolean(link.open_in_new_tab),
    editor_link_type: link.page_key
      ? 'page'
      : (link.href ? 'custom' : 'page')
  }
}

function createDefaultHeroSlide(slide = {}) {
  return {
    id: slide.id || undefined,
    eyebrow: slide.eyebrow || '',
    headline: slide.headline || '',
    subheading: slide.subheading || '',
    image_url: slide.image_url || '',
    background: slide.background || '',
    preview_background: slide.preview_background || '',
    primary_cta: createDefaultCta(slide.primary_cta),
    secondary_cta: createDefaultCta(slide.secondary_cta)
  }
}

function createHeroSection(section = {}) {
  const config = section.config_json || {}

  return {
    id: section.id || null,
    page_id: section.page_id || null,
    section_key: section.section_key || 'home_hero',
    section_type: 'hero_banner',
    sort_order: section.sort_order ?? 10,
    is_enabled: section.is_enabled ?? true,
    config_json: {
      autoplay_ms: Number(config.autoplay_ms) || 5000,
      slides: Array.isArray(config.slides) && config.slides.length
        ? config.slides.map(createDefaultHeroSlide)
        : [
            createDefaultHeroSlide({
              eyebrow: 'Lola As One',
              headline: 'Creative classes for children, adults and families',
              subheading: 'A warm, colourful creative space in Newbury for making, learning and relaxing together.',
              primary_cta: { label: 'Browse workshops', page_key: 'workshops' },
              secondary_cta: { label: 'Schedule', href: '#home_schedule' }
            })
          ]
    }
  }
}

function createScheduleSection(section = {}) {
  const config = section.config_json || {}

  return {
    id: section.id || null,
    page_id: section.page_id || null,
    section_key: section.section_key || 'home_schedule',
    section_type: 'schedule_grid',
    sort_order: section.sort_order ?? 20,
    is_enabled: section.is_enabled ?? true,
    config_json: {
      eyebrow: config.eyebrow || "What's On",
      title: config.title || 'Lola Art Classes',
      intro: config.intro || 'The homepage reuses the live workshops calendar so this section stays aligned with the real schedule.',
      show_view_toggle: config.show_view_toggle ?? false,
      primary_cta: createDefaultCta(config.primary_cta || { label: 'View all workshops', page_key: 'workshops' })
    }
  }
}

function createGalleryItem(item = {}) {
  return {
    id: item.id || undefined,
    image_url: item.image_url || '',
    alt: item.alt || '',
    background: item.background || 'linear-gradient(135deg, #ead9bf, #d7a774)'
  }
}

function createFeatureColumnItem(item = {}) {
  return {
    id: item.id || undefined,
    icon: item.icon || 'book-open',
    title: item.title || '',
    body: item.body || ''
  }
}

function createFeatureColumnsSection(section = {}) {
  const config = section.config_json || {}

  return {
    id: section.id || null,
    page_id: section.page_id || null,
    section_key: section.section_key || 'home_feature_columns',
    section_type: 'feature_split',
    sort_order: section.sort_order ?? 35,
    is_enabled: section.is_enabled ?? true,
    config_json: {
      layout_style: 'columns',
      items: Array.isArray(config.items) && config.items.length
        ? config.items.map(createFeatureColumnItem)
        : [
            createFeatureColumnItem({
              icon: 'mug-hot',
              title: 'Redemption Roasters coffee',
              body: 'We proudly serve coffee from Redemption Roasters — rich speciality coffee that has social impact.'
            }),
            createFeatureColumnItem({
              icon: 'cake-candles',
              title: 'Pastries & cakes',
              body: 'Freshly baked treats to enjoy while your child creates. From buttery croissants to homemade cakes.'
            }),
            createFeatureColumnItem({
              icon: 'book-open',
              title: 'The book corner',
              body: "Browse our curated collection of children's art books — from Little People, Big Dreams to Phaidon's My Art Book series."
            })
          ]
    }
  }
}

function createBannerIcon(icon = {}) {
  if (typeof icon === 'string') {
    return {
      id: undefined,
      type: 'icon',
      name: icon,
      image_url: '',
      alt: '',
      color: ''
    }
  }

  return {
    id: icon.id || undefined,
    type: icon.image_url ? 'image' : 'icon',
    name: icon.name || 'heart',
    image_url: icon.image_url || '',
    alt: icon.alt || '',
    color: icon.color || ''
  }
}

function createBannerItem(item = {}) {
  const body = Array.isArray(item.body)
    ? item.body
    : (typeof item.body === 'string' && item.body ? [item.body] : [])

  return {
    id: item.id || undefined,
    image_url: item.image_url || '',
    image_alt: item.image_alt || '',
    image_side: item.image_side || 'left',
    eyebrow: item.eyebrow || '',
    title: item.title || '',
    body_text: body.join('\n\n'),
    ctas: Array.isArray(item.ctas) && item.ctas.length
      ? item.ctas.map(createDefaultCta)
      : [createDefaultCta()],
    icons: Array.isArray(item.icons) && item.icons.length
      ? item.icons.map(createBannerIcon)
      : [createBannerIcon()]
  }
}

function createBannerSection(section = {}) {
  const config = section.config_json || {}

  return {
    id: section.id || null,
    page_id: section.page_id || null,
    section_key: section.section_key || 'home_banners',
    section_type: 'feature_split',
    sort_order: section.sort_order ?? 45,
    is_enabled: section.is_enabled ?? true,
    config_json: {
      layout_style: 'banners',
      items: Array.isArray(config.items) && config.items.length
        ? config.items.map(createBannerItem)
        : [
            createBannerItem({
              image_side: 'left',
              eyebrow: 'Ages 4+',
              title: 'After School Art Clubs',
              body: [
                "A joyful creative moment in your child's week — learning about artists and art styles, exploring new materials, and having fun in a beautiful space.",
                'Wednesday classes explore changing themes through the year, with term-time registration by age band.'
              ],
              ctas: [
                { label: 'Register — Wednesday (4+)', href: '/workshops' },
                { label: 'Register — Thursday (4-8)', href: '/workshops' },
                { label: 'Register — Thursday (9-13)', href: '/workshops' }
              ],
              icons: ['heart', 'gift', 'mug-hot', 'paint-brush', 'palette', 'star']
            }),
            createBannerItem({
              image_side: 'right',
              eyebrow: 'Ages 2-4',
              title: 'Little Ones',
              body: [
                'All about the process, not the result. LoLA for Little Ones helps young children explore creativity through texture, colour and new materials in a relaxed, playful environment.',
                'We ask that you stay and co-create alongside your child. Sessions are first come, first served — book online to secure your place.'
              ],
              ctas: [
                { label: 'Register — Tuesday', href: '/workshops' },
                { label: 'Register — Friday', href: '/workshops' },
                { label: 'Register — Saturday', href: '/workshops' }
              ],
              icons: ['baby', 'gift', 'paint-brush', 'palette', 'cake-candles', 'heart']
            }),
            createBannerItem({
              image_side: 'left',
              eyebrow: 'All ages',
              title: 'Open Studio',
              body: [
                'Drop in, grab a coffee, and let your child get freely creative. Open Studio sessions offer open-ended projects at the art table — no instruction, just inspiration.',
                'A member of the LoLA team will be present, but this is not a taught session. We kindly ask that parents stay within the café and help supervise each child. Each ticket is for one hour.'
              ],
              ctas: [
                { label: 'Book Open Studio', href: '/workshops' }
              ],
              icons: ['palette', 'paint-brush', 'heart', 'gift', 'star']
            })
          ]
    }
  }
}

function createGallerySection(section = {}) {
  const config = section.config_json || {}

  return {
    id: section.id || null,
    page_id: section.page_id || null,
    section_key: section.section_key || 'home_creative_slider',
    section_type: 'image_gallery',
    sort_order: section.sort_order ?? 30,
    is_enabled: section.is_enabled ?? true,
    config_json: {
      eyebrow: config.eyebrow || 'Studio Highlights',
      title: config.title || 'Art Classes & LoLA Cafe',
      intro: config.intro || '',
      items: Array.isArray(config.items) && config.items.length
        ? config.items.map(createGalleryItem)
        : [createGalleryItem(), createGalleryItem(), createGalleryItem(), createGalleryItem()]
    }
  }
}

function createTestimonialItem(item = {}) {
  return {
    id: item.id || undefined,
    quote: item.quote || '',
    name: item.name || '',
    role: item.role || '',
    stars: Math.min(5, Math.max(1, Number(item.stars) || 5))
  }
}

function createTestimonialSection(section = {}) {
  const config = section.config_json || {}

  return {
    id: section.id || null,
    page_id: section.page_id || null,
    section_key: section.section_key || 'home_testimonials',
    section_type: 'testimonial_strip',
    sort_order: section.sort_order ?? 55,
    is_enabled: section.is_enabled ?? true,
    config_json: {
      eyebrow: config.eyebrow || 'What People Say',
      title: config.title || 'Loved by families & educators',
      intro: config.intro || '',
      autoplay_ms: Number(config.autoplay_ms) || 6000,
      items: Array.isArray(config.items) && config.items.length
        ? config.items.map(createTestimonialItem)
        : [
            createTestimonialItem({
              quote: "LoLA has been the highlight of my daughter's week. She comes home buzzing with excitement and covered in paint — exactly what childhood should look like.",
              name: 'Sarah M.',
              role: 'Parent',
              stars: 5
            }),
            createTestimonialItem({
              quote: 'The studio feels thoughtful, calm and genuinely creative. Every session introduces artists and materials in a way children can really connect with.',
              name: 'Emma R.',
              role: 'Teacher',
              stars: 5
            }),
            createTestimonialItem({
              quote: 'Open Studio is our favourite weekend ritual. Coffee for us, paint for them, and everyone leaves happier than they arrived.',
              name: 'James T.',
              role: 'Parent',
              stars: 5
            })
          ]
    }
  }
}

function applySection(target, source) {
  const cloned = cloneValue(source)
  const nextConfig = cloned.config_json || {}

  target.id = cloned.id ?? null
  target.page_id = cloned.page_id ?? null
  target.section_key = cloned.section_key || target.section_key
  target.section_type = cloned.section_type || target.section_type
  target.sort_order = cloned.sort_order ?? target.sort_order
  target.is_enabled = cloned.is_enabled ?? target.is_enabled

  Object.keys(target.config_json || {}).forEach(key => {
    delete target.config_json[key]
  })

  Object.assign(target.config_json, nextConfig)
}

function ctaLinkType(cta) {
  if (cta?.editor_link_type === 'custom' || cta?.editor_link_type === 'page') {
    return cta.editor_link_type
  }

  return cta?.href ? 'custom' : 'page'
}

function setCtaLinkType(cta, type) {
  cta.editor_link_type = type

  if (type === 'custom') {
    cta.page_key = ''
    cta.href = cta.href || ''
    return
  }

  cta.href = ''
}

function addHeroSlide() {
  heroSlides.value.push(createDefaultHeroSlide())
}

function removeHeroSlide(index) {
  if (heroSlides.value.length <= 1) return
  heroSlides.value.splice(index, 1)
}

function moveHeroSlide(index, delta) {
  const nextIndex = index + delta
  if (nextIndex < 0 || nextIndex >= heroSlides.value.length) return
  const [slide] = heroSlides.value.splice(index, 1)
  heroSlides.value.splice(nextIndex, 0, slide)
}

function addGalleryItem() {
  galleryItems.value.push(createGalleryItem())
}

function addFeatureColumn() {
  featureColumnItems.value.push(createFeatureColumnItem())
}

function addBannerItem() {
  bannerItems.value.push(createBannerItem())
}

function addTestimonial() {
  testimonialItems.value.push(createTestimonialItem())
}

function removeFeatureColumn(index) {
  if (featureColumnItems.value.length <= 1) return
  featureColumnItems.value.splice(index, 1)
}

function moveFeatureColumn(index, delta) {
  const nextIndex = index + delta
  if (nextIndex < 0 || nextIndex >= featureColumnItems.value.length) return
  const [item] = featureColumnItems.value.splice(index, 1)
  featureColumnItems.value.splice(nextIndex, 0, item)
}

function removeBannerItem(index) {
  if (bannerItems.value.length <= 1) return
  bannerItems.value.splice(index, 1)
}

function moveBannerItem(index, delta) {
  const nextIndex = index + delta
  if (nextIndex < 0 || nextIndex >= bannerItems.value.length) return
  const [item] = bannerItems.value.splice(index, 1)
  bannerItems.value.splice(nextIndex, 0, item)
}

function removeTestimonial(index) {
  if (testimonialItems.value.length <= 1) return
  testimonialItems.value.splice(index, 1)
}

function moveTestimonial(index, delta) {
  const nextIndex = index + delta
  if (nextIndex < 0 || nextIndex >= testimonialItems.value.length) return
  const [item] = testimonialItems.value.splice(index, 1)
  testimonialItems.value.splice(nextIndex, 0, item)
}

function addBannerCta(item) {
  item.ctas.push(createDefaultCta())
}

function removeBannerCta(item, index) {
  if (item.ctas.length <= 1) {
    item.ctas.splice(index, 1, createDefaultCta())
    return
  }
  item.ctas.splice(index, 1)
}

function addBannerIcon(item) {
  item.icons.push(createBannerIcon())
}

function removeBannerIcon(item, index) {
  if (item.icons.length <= 1) {
    item.icons.splice(index, 1, createBannerIcon())
    return
  }
  item.icons.splice(index, 1)
}

function removeGalleryItem(index) {
  if (galleryItems.value.length <= 1) return
  galleryItems.value.splice(index, 1)
}

function moveGalleryItem(index, delta) {
  const nextIndex = index + delta
  if (nextIndex < 0 || nextIndex >= galleryItems.value.length) return
  const [item] = galleryItems.value.splice(index, 1)
  galleryItems.value.splice(nextIndex, 0, item)
}

function normalizeCta(cta) {
  const normalized = {
    id: cta?.id || undefined,
    label: cta?.label?.trim() || '',
    href: null,
    page_key: null,
    open_in_new_tab: false
  }

  if (cta?.href?.trim()) {
    normalized.href = cta.href.trim()
    normalized.page_key = null
    if (cta.open_in_new_tab) normalized.open_in_new_tab = true
    return normalized
  }

  if (cta?.page_key?.trim()) {
    normalized.page_key = cta.page_key.trim()
    normalized.href = null
    normalized.open_in_new_tab = false
    return normalized
  }

  return normalized.label ? normalized : null
}

function normalizeParagraphs(value) {
  return (value || '')
    .split(/\n\s*\n/)
    .map(paragraph => paragraph.trim())
    .filter(Boolean)
}

function buildHeroConfigForSave() {
  return {
    autoplay_ms: Math.max(2500, Number(heroConfig.autoplay_ms) || 5000),
    slides: heroSlides.value.map(slide => ({
      id: slide.id || undefined,
      eyebrow: slide.eyebrow?.trim() || '',
      headline: slide.headline?.trim() || '',
      subheading: slide.subheading?.trim() || '',
      image_url: slide.image_url?.trim() || '',
      background: slide.background?.trim() || undefined,
      preview_background: slide.preview_background?.trim() || undefined,
      primary_cta: normalizeCta(slide.primary_cta),
      secondary_cta: normalizeCta(slide.secondary_cta)
    }))
  }
}

function buildScheduleConfigForSave() {
  return {
    eyebrow: scheduleConfig.eyebrow?.trim() || '',
    title: scheduleConfig.title?.trim() || '',
    intro: scheduleConfig.intro?.trim() || '',
    show_view_toggle: Boolean(scheduleConfig.show_view_toggle),
    primary_cta: normalizeCta(scheduleConfig.primary_cta)
  }
}

function buildFeatureColumnsConfigForSave() {
  return {
    layout_style: 'columns',
    items: featureColumnItems.value
      .map(item => ({
        id: item.id || undefined,
        icon: item.icon || 'book-open',
        title: item.title?.trim() || '',
        body: item.body?.trim() || ''
      }))
      .filter(item => item.title || item.body)
  }
}

function buildBannerConfigForSave() {
  return {
    layout_style: 'banners',
    items: bannerItems.value
      .map(item => ({
        id: item.id || undefined,
        image_url: item.image_url?.trim() || '',
        image_alt: item.image_alt?.trim() || '',
        image_side: item.image_side || 'left',
        eyebrow: item.eyebrow?.trim() || '',
        title: item.title?.trim() || '',
        body: normalizeParagraphs(item.body_text),
        ctas: (item.ctas || [])
          .map(normalizeCta)
          .filter(Boolean),
        icons: (item.icons || [])
          .map(icon => {
            if (icon.type === 'image' && icon.image_url?.trim()) {
              return {
                id: icon.id || undefined,
                image_url: icon.image_url.trim(),
                alt: icon.alt?.trim() || '',
                name: null,
                color: ''
              }
            }

            return {
              id: icon.id || undefined,
              name: icon.name || 'heart',
              image_url: null,
              alt: null,
              color: icon.color?.trim() || ''
            }
          })
          .filter(icon => icon.name || icon.image_url)
      }))
      .filter(item => item.title || item.image_url || item.body.length)
  }
}

function buildGalleryConfigForSave() {
  return {
    eyebrow: galleryConfig.eyebrow?.trim() || '',
    title: galleryConfig.title?.trim() || '',
    intro: galleryConfig.intro?.trim() || '',
    items: galleryItems.value
      .map(item => ({
        id: item.id || undefined,
        image_url: item.image_url?.trim() || '',
        alt: item.alt?.trim() || '',
        background: item.background?.trim() || ''
      }))
      .filter(item => item.image_url || item.alt || item.background)
  }
}

function buildTestimonialConfigForSave() {
  return {
    eyebrow: testimonialConfig.eyebrow?.trim() || '',
    title: testimonialConfig.title?.trim() || '',
    intro: testimonialConfig.intro?.trim() || '',
    autoplay_ms: Math.max(2500, Number(testimonialConfig.autoplay_ms) || 6000),
    items: testimonialItems.value
      .map(item => ({
        id: item.id || undefined,
        quote: item.quote?.trim() || '',
        name: item.name?.trim() || '',
        role: item.role?.trim() || '',
        stars: Math.min(5, Math.max(1, Number(item.stars) || 5))
      }))
      .filter(item => item.quote || item.name)
  }
}

function rememberOriginalSectionConfigs() {
  originalSectionConfigs.value = new Map([
    [heroSection.section_key, cloneValue(buildHeroConfigForSave())],
    [scheduleSection.section_key, cloneValue(buildScheduleConfigForSave())],
    [featureColumnsSection.section_key, cloneValue(buildFeatureColumnsConfigForSave())],
    [bannerSection.section_key, cloneValue(buildBannerConfigForSave())],
    [gallerySection.section_key, cloneValue(buildGalleryConfigForSave())],
    [testimonialSection.section_key, cloneValue(buildTestimonialConfigForSave())]
  ])
}

function buildSectionPayload(section, config) {
  return {
    id: section.id || undefined,
    page_id: homePageId.value,
    section_key: section.section_key,
    section_type: section.section_type,
    sort_order: Number(section.sort_order) || 0,
    is_enabled: Boolean(section.is_enabled),
    config_json: config
  }
}

async function loadHomepageContent() {
  try {
    loading.value = true
    error.value = null

    const [homePage, pages] = await Promise.all([
      getAdminPageWithSectionsByKey('home'),
      getPublishedSitePages()
    ])

    homePageId.value = homePage.id
    pageOptions.value = pages

    const sectionsByKey = new Map((homePage.sections || []).map(section => [section.section_key, section]))

    applySection(heroSection, createHeroSection(sectionsByKey.get('home_hero')))
    applySection(scheduleSection, createScheduleSection(sectionsByKey.get('home_schedule')))
    applySection(featureColumnsSection, createFeatureColumnsSection(sectionsByKey.get('home_feature_columns')))
    applySection(bannerSection, createBannerSection(sectionsByKey.get('home_banners')))
    applySection(gallerySection, createGallerySection(sectionsByKey.get('home_creative_slider')))
    applySection(testimonialSection, createTestimonialSection(sectionsByKey.get('home_testimonials')))
    rememberOriginalSectionConfigs()
  } catch (err) {
    error.value = err.message || 'Failed to load homepage content'
    console.error('Error loading homepage content:', err)
  } finally {
    loading.value = false
  }
}

async function handleSave() {
  try {
    saving.value = true
    error.value = null

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('You must be logged in to update homepage content')
    if (!homePageId.value) throw new Error('Homepage record not loaded')

    const nextHeroConfig = buildHeroConfigForSave()
    const nextScheduleConfig = buildScheduleConfigForSave()
    const nextFeatureColumnsConfig = buildFeatureColumnsConfigForSave()
    const nextBannerConfig = buildBannerConfigForSave()
    const nextGalleryConfig = buildGalleryConfigForSave()
    const nextTestimonialConfig = buildTestimonialConfigForSave()

    const payload = [
      buildSectionPayload(heroSection, configPatchForSection(heroSection, nextHeroConfig)),
      buildSectionPayload(scheduleSection, configPatchForSection(scheduleSection, nextScheduleConfig)),
      buildSectionPayload(featureColumnsSection, configPatchForSection(featureColumnsSection, nextFeatureColumnsConfig)),
      buildSectionPayload(bannerSection, configPatchForSection(bannerSection, nextBannerConfig)),
      buildSectionPayload(gallerySection, configPatchForSection(gallerySection, nextGalleryConfig)),
      buildSectionPayload(testimonialSection, configPatchForSection(testimonialSection, nextTestimonialConfig))
    ].map(section => ({
      ...section,
      created_by: user.id,
      updated_by: user.id
    }))

    await upsertPageSections(payload)
    toastStore.success('Homepage content updated')
    await loadHomepageContent()
  } catch (err) {
    error.value = err.message || 'Failed to save homepage content'
    toastStore.error(error.value)
    console.error('Error saving homepage content:', err)
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadHomepageContent()
})
</script>

<style scoped>
select {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  padding-right: 2.5rem;
}
</style>
