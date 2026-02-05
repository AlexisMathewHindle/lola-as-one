<template>
  <div class="max-w-4xl">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="text-center">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        <p class="mt-4 text-gray-600">Loading blog post...</p>
      </div>
    </div>

    <!-- Error Alert -->
    <div v-if="error" class="bg-danger-50 border border-danger-200 rounded-lg p-4 flex items-start mb-6">
      <font-awesome-icon icon="exclamation-triangle" class="w-5 h-5 text-danger-600 mt-0.5 mr-3 flex-shrink-0" />
      <div class="flex-1">
        <h3 class="text-sm font-semibold text-danger-800">Error</h3>
        <p class="text-sm text-danger-700 mt-1">{{ error }}</p>
      </div>
      <button @click="error = null" class="text-danger-600 hover:text-danger-800">
        <font-awesome-icon icon="times" class="w-4 h-4" />
      </button>
    </div>

    <template v-if="!loading">
      <!-- Header -->
      <div class="mb-6 sm:mb-8">
        <router-link
          to="/admin/blog"
          class="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <font-awesome-icon icon="chevron-left" class="w-3 h-3 mr-2" />
          Back to Blog Posts
        </router-link>
        <h1 class="text-2xl sm:text-3xl font-bold text-gray-900">
          {{ isEdit ? 'Edit Blog Post' : 'Create New Blog Post' }}
        </h1>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Basic Information -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 space-y-6">
          <div class="flex items-center mb-2">
            <font-awesome-icon icon="file-alt" class="w-4 h-4 text-gray-500 mr-2" />
            <h3 class="text-lg font-semibold text-gray-900">Basic Information</h3>
          </div>

          <!-- Title -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Title <span class="text-red-500">*</span>
            </label>
            <input
              v-model="form.title"
              @input="onTitleChange"
              type="text"
              required
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              placeholder="e.g., 10 Tips for Watercolor Beginners"
            >
          </div>

          <!-- Slug -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Slug <span class="text-red-500">*</span>
            </label>
            <input
              v-model="form.slug"
              type="text"
              required
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              placeholder="e.g., 10-tips-watercolor-beginners"
            >
            <p class="text-xs text-gray-500 mt-2 flex items-center">
              <font-awesome-icon icon="external-link-alt" class="w-3 h-3 mr-1" />
              URL-friendly version of the title
            </p>
          </div>

          <!-- Excerpt -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Excerpt
            </label>
            <textarea
              v-model="form.excerpt"
              rows="3"
              maxlength="200"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
              placeholder="Short summary for previews and SEO (max 200 characters)"
            ></textarea>
            <p class="text-xs text-gray-500 mt-2">
              {{ form.excerpt?.length || 0 }} / 200 characters
            </p>
          </div>

          <!-- Body (Rich Text Editor) -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Content <span class="text-red-500">*</span>
            </label>
            <RichTextEditor
              v-model="form.body"
              placeholder="Write your blog post content here..."
            />
          </div>

          <!-- Featured Image -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Featured Image
            </label>
            <ImageUploader
              v-model="form.featured_image_url"
              bucket="blog-images"
              alt="Blog post featured image"
              :max-size-m-b="5"
              @upload-complete="handleImageUpload"
              @upload-error="handleImageError"
            />
          </div>
        </div>

        <!-- Author Information -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 space-y-6">
          <div class="flex items-center mb-2">
            <font-awesome-icon icon="user-circle" class="w-4 h-4 text-gray-500 mr-2" />
            <h3 class="text-lg font-semibold text-gray-900">Author Information</h3>
          </div>

          <!-- Author Name -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Author Name
            </label>
            <input
              v-model="form.author_name"
              type="text"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              placeholder="e.g., Jane Doe"
            >
          </div>

          <!-- Author Bio -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Author Bio
            </label>
            <textarea
              v-model="form.author_bio"
              rows="3"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
              placeholder="Brief bio about the author"
            ></textarea>
          </div>

          <!-- Author Image -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Author Image
            </label>
            <ImageUploader
              v-model="form.author_image_url"
              bucket="blog-images"
              alt="Author profile image"
              :max-size-m-b="5"
            />
          </div>
        </div>

        <!-- Publishing Settings -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 space-y-6">
          <div class="flex items-center mb-2">
            <font-awesome-icon icon="cog" class="w-4 h-4 text-gray-500 mr-2" />
            <h3 class="text-lg font-semibold text-gray-900">Publishing Settings</h3>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <!-- Status -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Status <span class="text-red-500">*</span>
              </label>
              <div class="relative">
                <select
                  v-model="form.status"
                  required
                  class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white transition-all"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
                <font-awesome-icon icon="chevron-down" class="absolute right-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <!-- Published Date -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Published Date
              </label>
              <input
                v-model="form.published_at"
                type="datetime-local"
                class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              >
              <p class="text-xs text-gray-500 mt-2">
                Leave empty for unpublished posts
              </p>
            </div>
          </div>
        </div>

        <!-- SEO Metadata -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 space-y-6">
          <div class="flex items-center mb-2">
            <font-awesome-icon icon="search" class="w-4 h-4 text-gray-500 mr-2" />
            <h3 class="text-lg font-semibold text-gray-900">SEO Metadata</h3>
          </div>

          <!-- Meta Title -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Meta Title
            </label>
            <input
              v-model="form.meta_title"
              type="text"
              maxlength="60"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              placeholder="SEO title (defaults to post title)"
            >
            <p class="text-xs text-gray-500 mt-2">
              {{ form.meta_title?.length || 0 }} / 60 characters
            </p>
          </div>

          <!-- Meta Description -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Meta Description
            </label>
            <textarea
              v-model="form.meta_description"
              rows="3"
              maxlength="160"
              class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
              placeholder="SEO description (defaults to excerpt)"
            ></textarea>
            <p class="text-xs text-gray-500 mt-2">
              {{ form.meta_description?.length || 0 }} / 160 characters
            </p>
          </div>
        </div>

        <!-- Form Actions -->
        <div class="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <button
            type="submit"
            :disabled="saving"
            class="flex-1 sm:flex-none inline-flex items-center justify-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all duration-200 shadow-sm hover:shadow-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <font-awesome-icon v-if="saving" icon="spinner" class="w-4 h-4 mr-2 animate-spin" />
            <font-awesome-icon v-else icon="save" class="w-4 h-4 mr-2" />
            {{ saving ? 'Saving...' : (isEdit ? 'Update Blog Post' : 'Create Blog Post') }}
          </button>
          <router-link
            to="/admin/blog"
            class="flex-1 sm:flex-none inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-200 font-medium"
          >
            Cancel
          </router-link>
        </div>
      </form>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '../../lib/supabase'
import RichTextEditor from '../../components/shared/RichTextEditor.vue'
import ImageUploader from '../../components/shared/ImageUploader.vue'

const route = useRoute()
const router = useRouter()
const isEdit = !!route.params.id

const loading = ref(false)
const saving = ref(false)
const error = ref(null)

const form = ref({
  title: '',
  slug: '',
  excerpt: '',
  body: '',
  featured_image_url: '',
  author_name: '',
  author_bio: '',
  author_image_url: '',
  published_at: '',
  status: 'draft',
  meta_title: '',
  meta_description: ''
})

// Auto-generate slug from title
const onTitleChange = () => {
  if (!isEdit || !form.value.slug) {
    form.value.slug = generateSlug(form.value.title)
  }
}

const generateSlug = (title) => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Load existing blog post data
const loadBlogPost = async () => {
  if (!isEdit) return

  try {
    loading.value = true
    error.value = null

    const { data, error: fetchError } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', route.params.id)
      .single()

    if (fetchError) throw fetchError

    if (data) {
      form.value = {
        title: data.title || '',
        slug: data.slug || '',
        excerpt: data.excerpt || '',
        body: data.body || '',
        featured_image_url: data.featured_image_url || '',
        author_name: data.author_name || '',
        author_bio: data.author_bio || '',
        author_image_url: data.author_image_url || '',
        published_at: data.published_at ? new Date(data.published_at).toISOString().slice(0, 16) : '',
        status: data.status || 'draft',
        meta_title: data.meta_title || '',
        meta_description: data.meta_description || ''
      }
    }
  } catch (err) {
    error.value = err.message || 'Failed to load blog post'
    console.error('Error loading blog post:', err)
  } finally {
    loading.value = false
  }
}

// Form validation
const validateForm = () => {
  error.value = null

  if (!form.value.title?.trim()) {
    error.value = 'Title is required'
    return false
  }

  if (!form.value.slug?.trim()) {
    error.value = 'Slug is required'
    return false
  }

  if (!form.value.body?.trim()) {
    error.value = 'Content is required'
    return false
  }

  if (!form.value.status) {
    error.value = 'Status is required'
    return false
  }

  return true
}

// Handle form submission
const handleSubmit = async () => {
  if (!validateForm()) {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    return
  }

  saving.value = true
  error.value = null

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('You must be logged in')

    const blogData = {
      title: form.value.title.trim(),
      slug: form.value.slug.trim(),
      excerpt: form.value.excerpt?.trim() || null,
      body: form.value.body,
      featured_image_url: form.value.featured_image_url?.trim() || null,
      author_name: form.value.author_name?.trim() || null,
      author_bio: form.value.author_bio?.trim() || null,
      author_image_url: form.value.author_image_url?.trim() || null,
      published_at: form.value.published_at ? new Date(form.value.published_at).toISOString() : null,
      status: form.value.status,
      meta_title: form.value.meta_title?.trim() || null,
      meta_description: form.value.meta_description?.trim() || null,
      updated_by: user.id
    }

    if (isEdit) {
      // Update existing blog post
      const { data, error: updateError } = await supabase
        .from('blog_posts')
        .update(blogData)
        .eq('id', route.params.id)
        .select()
        .single()

      if (updateError) throw updateError
    } else {
      // Create new blog post
      blogData.created_by = user.id

      const { data, error: insertError } = await supabase
        .from('blog_posts')
        .insert(blogData)
        .select()
        .single()

      if (insertError) throw insertError
    }

    // Redirect to blog list
    router.push({ name: 'AdminBlog' })
  } catch (err) {
    error.value = err.message || 'Failed to save blog post'
    console.error('Error saving blog post:', err)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } finally {
    saving.value = false
  }
}

// Image upload handlers
const handleImageUpload = ({ url, path }) => {
  console.log('Image uploaded successfully:', url)
}

const handleImageError = (err) => {
  error.value = `Image upload failed: ${err.message}`
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Load data on mount
onMounted(() => {
  loadBlogPost()
})
</script>


