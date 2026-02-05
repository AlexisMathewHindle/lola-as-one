<template>
  <div class="min-h-screen bg-white">
    <!-- Hero Section -->
    <section class="relative bg-gradient-to-br from-primary-50 via-white to-secondary-50 overflow-hidden">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
        <div class="text-center">
          <h1 class="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-gray-900 mb-6">
            <span class="text-primary-600">Blog</span>
          </h1>
          <p class="text-xl sm:text-2xl text-gray-600 max-w-3xl mx-auto">
            Creative inspiration, tutorials, and news from the Lola As One community
          </p>
        </div>
      </div>

      <!-- Decorative elements -->
      <div class="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-primary-200 rounded-full opacity-20 blur-3xl"></div>
      <div class="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-secondary-200 rounded-full opacity-20 blur-3xl"></div>
    </section>

    <!-- Blog Content Section -->
    <section class="py-16 sm:py-20 bg-gray-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Filters & Search -->
        <div class="bg-white rounded-xl shadow-md p-6 mb-8">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <!-- Search -->
            <div class="md:col-span-2">
              <label for="search" class="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <div class="relative">
                <input
                  id="search"
                  v-model="searchQuery"
                  type="text"
                  placeholder="Search blog posts..."
                  class="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  @input="handleSearch"
                >
                <font-awesome-icon
                  icon="search"
                  class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
              </div>
            </div>

            <!-- Category Filter -->
            <div>
              <label for="category" class="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                id="category"
                v-model="selectedCategory"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                @change="fetchPosts"
              >
                <option value="">All Categories</option>
                <option v-for="category in categories" :key="category.id" :value="category.id">
                  {{ category.name }}
                </option>
              </select>
            </div>
          </div>

          <!-- Active Filters -->
          <div v-if="searchQuery || selectedCategory" class="mt-4 flex items-center gap-2">
            <span class="text-sm text-gray-600">Active filters:</span>
            <button
              v-if="searchQuery"
              @click="clearSearch"
              class="inline-flex items-center px-3 py-1 bg-primary-100 text-primary-700 text-sm rounded-full hover:bg-primary-200"
            >
              Search: "{{ searchQuery }}"
              <font-awesome-icon icon="times" class="ml-2" />
            </button>
            <button
              v-if="selectedCategory"
              @click="clearCategory"
              class="inline-flex items-center px-3 py-1 bg-primary-100 text-primary-700 text-sm rounded-full hover:bg-primary-200"
            >
              {{ getCategoryName(selectedCategory) }}
              <font-awesome-icon icon="times" class="ml-2" />
            </button>
            <button
              @click="clearAllFilters"
              class="text-sm text-primary-600 hover:text-primary-700 underline"
            >
              Clear all
            </button>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="flex justify-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>

        <!-- Blog Posts Grid -->
        <div v-else-if="posts.length > 0">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <article
              v-for="post in posts"
              :key="post.id"
              class="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
              @click="$router.push(`/blog/${post.slug}`)"
            >
              <!-- Featured Image -->
              <div class="relative h-48 bg-gradient-to-br from-primary-100 to-primary-200">
                <img
                  v-if="post.featured_image_url"
                  :src="post.featured_image_url"
                  :alt="post.title"
                  class="w-full h-full object-cover"
                >
                <div v-else class="flex items-center justify-center h-full">
                  <font-awesome-icon icon="image" class="text-6xl text-primary-400" />
                </div>
              </div>

              <!-- Post Content -->
              <div class="p-6">
                <!-- Category Badge -->
                <div v-if="post.category" class="mb-3">
                  <span class="inline-block px-3 py-1 bg-primary-100 text-primary-700 text-xs font-semibold rounded-full">
                    {{ post.category.name }}
                  </span>
                </div>

                <!-- Title -->
                <h2 class="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
                  {{ post.title }}
                </h2>

                <!-- Excerpt -->
                <p class="text-gray-600 text-sm mb-4 line-clamp-3">
                  {{ post.excerpt || 'Read more to discover...' }}
                </p>

                <!-- Meta Info -->
                <div class="flex items-center justify-between text-sm text-gray-500">
                  <div class="flex items-center">
                    <font-awesome-icon icon="user" class="mr-2" />
                    <span>{{ post.author_name || 'Lola Team' }}</span>
                  </div>
                  <div class="flex items-center">
                    <font-awesome-icon icon="calendar" class="mr-2" />
                    <span>{{ formatDate(post.published_at) }}</span>
                  </div>
                </div>
              </div>
            </article>
          </div>

          <!-- Pagination -->
          <div v-if="totalPages > 1" class="mt-12 flex justify-center items-center gap-2">
            <button
              @click="goToPage(currentPage - 1)"
              :disabled="currentPage === 1"
              class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <font-awesome-icon icon="chevron-left" />
            </button>

            <button
              v-for="page in visiblePages"
              :key="page"
              @click="goToPage(page)"
              class="px-4 py-2 border rounded-lg"
              :class="page === currentPage ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-300 hover:bg-gray-50'"
            >
              {{ page }}
            </button>

            <button
              @click="goToPage(currentPage + 1)"
              :disabled="currentPage === totalPages"
              class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <font-awesome-icon icon="chevron-right" />
            </button>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="text-center py-12">
          <font-awesome-icon icon="file-lines" class="text-6xl text-gray-300 mb-4" />
          <h3 class="text-xl font-semibold text-gray-900 mb-2">No blog posts found</h3>
          <p class="text-gray-600 mb-6">
            {{ searchQuery || selectedCategory ? 'Try adjusting your filters' : 'Check back soon for new content!' }}
          </p>
          <button
            v-if="searchQuery || selectedCategory"
            @click="clearAllFilters"
            class="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700"
          >
            Clear Filters
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../lib/supabase'

// State
const loading = ref(true)
const posts = ref([])
const categories = ref([])
const searchQuery = ref('')
const selectedCategory = ref('')
const currentPage = ref(1)
const postsPerPage = 12
const totalPosts = ref(0)

// Computed
const totalPages = computed(() => Math.ceil(totalPosts.value / postsPerPage))

const visiblePages = computed(() => {
  const pages = []
  const maxVisible = 5
  let start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2))
  let end = Math.min(totalPages.value, start + maxVisible - 1)

  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1)
  }

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  return pages
})

// Fetch categories
const fetchCategories = async () => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, slug')
      .order('name')

    if (error) throw error
    categories.value = data || []
  } catch (err) {
    console.error('Error fetching categories:', err)
  }
}

// Fetch posts
const fetchPosts = async () => {
  try {
    loading.value = true

    // Build query
    let query = supabase
      .from('blog_posts')
      .select('id, slug, title, excerpt, featured_image_url, author_name, published_at', { count: 'exact' })
      .eq('status', 'published')
      .order('published_at', { ascending: false })

    // Apply search filter
    if (searchQuery.value) {
      query = query.or(`title.ilike.%${searchQuery.value}%,excerpt.ilike.%${searchQuery.value}%`)
    }

    // Apply pagination
    const from = (currentPage.value - 1) * postsPerPage
    const to = from + postsPerPage - 1
    query = query.range(from, to)

    const { data: postsData, error: postsError, count } = await query

    if (postsError) throw postsError

    totalPosts.value = count || 0

    // Fetch categories for each post
    if (postsData && postsData.length > 0) {
      const postIds = postsData.map(p => p.id)

      // Fetch post categories
      const { data: postCategories, error: categoriesError } = await supabase
        .from('blog_post_categories')
        .select('blog_post_id, category_id, categories(id, name, slug)')
        .in('blog_post_id', postIds)

      if (categoriesError) throw categoriesError

      // Merge posts with categories
      posts.value = postsData.map(post => {
        const postCategory = postCategories?.find(pc => pc.blog_post_id === post.id)
        return {
          ...post,
          category: postCategory?.categories || null
        }
      })

      // Apply category filter on client side (since we can't easily filter by join table in Supabase)
      if (selectedCategory.value) {
        posts.value = posts.value.filter(post => post.category?.id === selectedCategory.value)
      }
    } else {
      posts.value = []
    }
  } catch (err) {
    console.error('Error fetching posts:', err)
    posts.value = []
  } finally {
    loading.value = false
  }
}

// Format date
const formatDate = (dateString) => {
  if (!dateString) return 'TBA'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// Get category name
const getCategoryName = (categoryId) => {
  const category = categories.value.find(c => c.id === categoryId)
  return category?.name || ''
}

// Search handler (debounced)
let searchTimeout
const handleSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    fetchPosts()
  }, 500)
}

// Clear filters
const clearSearch = () => {
  searchQuery.value = ''
  currentPage.value = 1
  fetchPosts()
}

const clearCategory = () => {
  selectedCategory.value = ''
  currentPage.value = 1
  fetchPosts()
}

const clearAllFilters = () => {
  searchQuery.value = ''
  selectedCategory.value = ''
  currentPage.value = 1
  fetchPosts()
}

// Pagination
const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    fetchPosts()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

// Initialize
onMounted(() => {
  fetchCategories()
  fetchPosts()
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
