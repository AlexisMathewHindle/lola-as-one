<template>
  <div class="min-h-screen bg-white">
    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center min-h-screen">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="min-h-screen flex items-center justify-center bg-gray-50">
      <div class="text-center">
        <font-awesome-icon icon="exclamation-triangle" class="text-6xl text-danger-600 mb-4" />
        <h1 class="text-3xl font-display font-bold text-gray-900 mb-4">Post Not Found</h1>
        <p class="text-gray-600 mb-6">{{ error }}</p>
        <router-link
          to="/blog"
          class="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700"
        >
          <font-awesome-icon icon="arrow-left" class="mr-2" />
          Back to Blog
        </router-link>
      </div>
    </div>

    <!-- Post Content -->
    <article v-else-if="post">
      <!-- Hero Section with Featured Image -->
      <section class="relative bg-gray-900">
        <div v-if="post.featured_image_url" class="relative h-96 overflow-hidden">
          <img
            :src="post.featured_image_url"
            :alt="post.title"
            class="w-full h-full object-cover opacity-60"
          >
          <div class="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent"></div>
        </div>

        <div class="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8" :class="post.featured_image_url ? '-mt-32' : 'py-16'">
          <div class="bg-white rounded-xl shadow-xl p-8 sm:p-12">
            <!-- Category Badge -->
            <div v-if="post.category" class="mb-4">
              <span class="inline-block px-4 py-2 bg-primary-100 text-primary-700 text-sm font-semibold rounded-full">
                {{ post.category.name }}
              </span>
            </div>

            <!-- Title -->
            <h1 class="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-gray-900 mb-6">
              {{ post.title }}
            </h1>

            <!-- Meta Info -->
            <div class="flex flex-wrap items-center gap-4 text-gray-600 mb-6 pb-6 border-b border-gray-200">
              <div class="flex items-center">
                <div v-if="post.author_image_url" class="w-10 h-10 rounded-full overflow-hidden mr-3">
                  <img :src="post.author_image_url" :alt="post.author_name" class="w-full h-full object-cover">
                </div>
                <div v-else class="w-10 h-10 bg-gradient-to-br from-primary-200 to-primary-300 rounded-full flex items-center justify-center text-primary-700 font-semibold mr-3">
                  {{ getInitials(post.author_name) }}
                </div>
                <span class="font-medium">{{ post.author_name || 'Lola Team' }}</span>
              </div>
              <span class="text-gray-400">•</span>
              <div class="flex items-center">
                <font-awesome-icon icon="calendar" class="mr-2" />
                <span>{{ formatDate(post.published_at) }}</span>
              </div>
              <span class="text-gray-400">•</span>
              <div class="flex items-center">
                <font-awesome-icon icon="clock" class="mr-2" />
                <span>{{ readTime }} min read</span>
              </div>
            </div>

            <!-- Tags -->
            <div v-if="post.tags && post.tags.length > 0" class="flex flex-wrap gap-2 mb-6">
              <span
                v-for="tag in post.tags"
                :key="tag.id"
                class="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
              >
                #{{ tag.name }}
              </span>
            </div>
          </div>
        </div>
      </section>

      <!-- Post Body -->
      <section class="py-12 bg-gray-50">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="bg-white rounded-xl shadow-md p-8 sm:p-12">
            <!-- Excerpt -->
            <div v-if="post.excerpt" class="text-xl text-gray-600 italic mb-8 pb-8 border-b border-gray-200">
              {{ post.excerpt }}
            </div>

            <!-- Body Content -->
            <div class="prose prose-lg max-w-none">
              <div v-html="renderedBody"></div>
            </div>
          </div>
        </div>
      </section>

      <!-- Author Bio -->
      <section v-if="post.author_bio" class="py-12 bg-white">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="bg-gradient-to-br from-primary-50 to-white rounded-xl shadow-md p-8">
            <h3 class="text-2xl font-display font-bold text-gray-900 mb-6">About the Author</h3>
            <div class="flex items-start gap-6">
              <div v-if="post.author_image_url" class="flex-shrink-0">
                <img
                  :src="post.author_image_url"
                  :alt="post.author_name"
                  class="w-24 h-24 rounded-full object-cover"
                >
              </div>
              <div v-else class="flex-shrink-0">
                <div class="w-24 h-24 bg-gradient-to-br from-primary-200 to-primary-300 rounded-full flex items-center justify-center text-primary-700 font-semibold text-3xl">
                  {{ getInitials(post.author_name) }}
                </div>
              </div>
              <div>
                <h4 class="text-xl font-semibold text-gray-900 mb-2">{{ post.author_name || 'Lola Team' }}</h4>
                <p class="text-gray-600">{{ post.author_bio }}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Related Posts -->
      <section v-if="relatedPosts.length > 0" class="py-12 bg-gray-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 class="text-3xl font-display font-bold text-gray-900 mb-8 text-center">You Might Also Like</h3>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            <article
              v-for="relatedPost in relatedPosts"
              :key="relatedPost.id"
              class="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
              @click="navigateToPost(relatedPost.slug)"
            >
              <!-- Featured Image -->
              <div class="relative h-48 bg-gradient-to-br from-primary-100 to-primary-200">
                <img
                  v-if="relatedPost.featured_image_url"
                  :src="relatedPost.featured_image_url"
                  :alt="relatedPost.title"
                  class="w-full h-full object-cover"
                >
                <div v-else class="flex items-center justify-center h-full">
                  <font-awesome-icon icon="image" class="text-6xl text-primary-400" />
                </div>
              </div>

              <!-- Post Content -->
              <div class="p-6">
                <h4 class="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                  {{ relatedPost.title }}
                </h4>
                <p class="text-gray-600 text-sm mb-4 line-clamp-2">
                  {{ relatedPost.excerpt || 'Read more to discover...' }}
                </p>
                <div class="flex items-center text-sm text-gray-500">
                  <font-awesome-icon icon="calendar" class="mr-2" />
                  <span>{{ formatDate(relatedPost.published_at) }}</span>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <!-- Back to Blog -->
      <section class="py-12 bg-white">
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <router-link
            to="/blog"
            class="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors"
          >
            <font-awesome-icon icon="arrow-left" class="mr-2" />
            Back to Blog
          </router-link>
        </div>
      </section>
    </article>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '../lib/supabase'

const route = useRoute()
const router = useRouter()

// State
const loading = ref(true)
const error = ref(null)
const post = ref(null)
const relatedPosts = ref([])

// Computed
const readTime = computed(() => {
  if (!post.value?.body) return 5

  // Estimate read time based on body content
  let wordCount = 0

  if (typeof post.value.body === 'string') {
    wordCount = post.value.body.split(/\s+/).length
  } else if (post.value.body && typeof post.value.body === 'object') {
    // If JSONB, try to extract text
    const bodyText = JSON.stringify(post.value.body)
    wordCount = bodyText.split(/\s+/).length
  }

  // Average reading speed: 200 words per minute
  return Math.max(1, Math.ceil(wordCount / 200))
})

const renderedBody = computed(() => {
  if (!post.value?.body) return '<p>No content available.</p>'

  // If body is a string, render as HTML
  if (typeof post.value.body === 'string') {
    return post.value.body
  }

  // If body is JSONB (object), try to render it
  // For v1, we'll do a simple text extraction
  // For v2, implement proper Tiptap JSON rendering
  if (post.value.body && typeof post.value.body === 'object') {
    // Try to extract text from Tiptap JSON structure
    if (post.value.body.type === 'doc' && post.value.body.content) {
      return renderTiptapContent(post.value.body.content)
    }

    // Fallback: stringify the JSON
    return `<pre>${JSON.stringify(post.value.body, null, 2)}</pre>`
  }

  return '<p>No content available.</p>'
})

// Render Tiptap JSON content (simple version for v1)
const renderTiptapContent = (content) => {
  if (!Array.isArray(content)) return ''

  return content.map(node => {
    if (node.type === 'paragraph') {
      const text = node.content?.map(c => c.text || '').join('') || ''
      return `<p>${text}</p>`
    }

    if (node.type === 'heading') {
      const level = node.attrs?.level || 2
      const text = node.content?.map(c => c.text || '').join('') || ''
      return `<h${level}>${text}</h${level}>`
    }

    if (node.type === 'bulletList') {
      const items = node.content?.map(item => {
        const text = item.content?.[0]?.content?.map(c => c.text || '').join('') || ''
        return `<li>${text}</li>`
      }).join('') || ''
      return `<ul>${items}</ul>`
    }

    if (node.type === 'orderedList') {
      const items = node.content?.map(item => {
        const text = item.content?.[0]?.content?.map(c => c.text || '').join('') || ''
        return `<li>${text}</li>`
      }).join('') || ''
      return `<ol>${items}</ol>`
    }

    return ''
  }).join('')
}

// Get initials from name
const getInitials = (name) => {
  if (!name) return 'LT'
  const parts = name.split(' ')
  if (parts.length >= 2) {
    return parts[0][0] + parts[1][0]
  }
  return name.substring(0, 2).toUpperCase()
}

// Format date
const formatDate = (dateString) => {
  if (!dateString) return 'TBA'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Navigate to post
const navigateToPost = (postSlug) => {
  router.push(`/blog/${postSlug}`)
}

// Fetch post
const fetchPost = async () => {
  try {
    loading.value = true
    error.value = null

    // Fetch blog post
    const { data: postData, error: postError } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', route.params.slug)
      .eq('status', 'published')
      .single()

    if (postError) throw postError
    if (!postData) throw new Error('Post not found')

    post.value = postData

    // Fetch category
    const { data: categoryData, error: categoryError } = await supabase
      .from('blog_post_categories')
      .select('category_id, categories(id, name, slug)')
      .eq('blog_post_id', postData.id)
      .single()

    if (!categoryError && categoryData) {
      post.value.category = categoryData.categories
    }

    // Fetch tags
    const { data: tagsData, error: tagsError } = await supabase
      .from('blog_post_tags')
      .select('tag_id, tags(id, name, slug)')
      .eq('blog_post_id', postData.id)

    if (!tagsError && tagsData) {
      post.value.tags = tagsData.map(t => t.tags)
    }

    // Fetch related posts (same category, limit 3)
    if (post.value.category) {
      const { data: relatedPostIds, error: relatedIdsError } = await supabase
        .from('blog_post_categories')
        .select('blog_post_id')
        .eq('category_id', post.value.category.id)
        .neq('blog_post_id', postData.id)
        .limit(3)

      if (!relatedIdsError && relatedPostIds && relatedPostIds.length > 0) {
        const ids = relatedPostIds.map(r => r.blog_post_id)

        const { data: relatedData, error: relatedError } = await supabase
          .from('blog_posts')
          .select('id, slug, title, excerpt, featured_image_url, published_at')
          .in('id', ids)
          .eq('status', 'published')
          .limit(3)

        if (!relatedError && relatedData) {
          relatedPosts.value = relatedData
        }
      }
    }
  } catch (err) {
    console.error('Error fetching blog post:', err)
    error.value = err.message || 'Failed to load blog post'
  } finally {
    loading.value = false
  }
}

// Watch for route changes to refetch post data
watch(() => route.params.slug, () => {
  fetchPost()
})

// Initialize
onMounted(() => {
  fetchPost()
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Prose styles for blog content */
.prose {
  color: #374151;
  line-height: 1.75;
}

.prose p {
  margin-bottom: 1.25rem;
}

.prose h2 {
  font-size: 1.875rem;
  font-weight: 700;
  margin-top: 2rem;
  margin-bottom: 1rem;
  color: #111827;
}

.prose h3 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
  color: #111827;
}

.prose ul, .prose ol {
  margin-bottom: 1.25rem;
  padding-left: 1.5rem;
}

.prose li {
  margin-bottom: 0.5rem;
}

.prose a {
  color: #f97316;
  text-decoration: underline;
}

.prose a:hover {
  color: #ea580c;
}

.prose img {
  border-radius: 0.5rem;
  margin: 2rem 0;
}

.prose blockquote {
  border-left: 4px solid #f97316;
  padding-left: 1rem;
  font-style: italic;
  color: #6b7280;
  margin: 1.5rem 0;
}

.prose code {
  background-color: #f3f4f6;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
}

.prose pre {
  background-color: #1f2937;
  color: #f3f4f6;
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin: 1.5rem 0;
}
</style>
