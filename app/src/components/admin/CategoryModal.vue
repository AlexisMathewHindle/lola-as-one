<template>
  <div v-if="show" class="fixed inset-0 z-50 overflow-y-auto">
    <!-- Backdrop -->
    <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity" @click="$emit('close')"></div>
    
    <!-- Modal -->
    <div class="flex items-center justify-center min-h-screen p-4">
      <div class="relative bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
        <!-- Header -->
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold text-gray-900">
            {{ mode === 'create' ? 'Create Category' : 'Edit Category' }}
          </h2>
          <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600">
            <font-awesome-icon icon="times" class="text-xl" />
          </button>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <!-- Name -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Category Name <span class="text-red-500">*</span>
            </label>
            <input
              v-model="formData.name"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="e.g., Open Studio (all ages)"
            >
          </div>

          <!-- Slug -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Slug <span class="text-red-500">*</span>
            </label>
            <input
              v-model="formData.slug"
              type="text"
              required
              pattern="[a-z0-9\-]+"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="e.g., open-studio-all-ages"
            >
            <p class="text-xs text-gray-500 mt-1">Lowercase letters, numbers, and hyphens only</p>
          </div>

          <!-- Description -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              v-model="formData.description"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Brief description of this category"
            ></textarea>
          </div>

          <!-- Parent Category -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Parent Category
            </label>
            <select
              v-model="formData.parent_id"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option :value="null">None (Top-level category)</option>
              <option v-for="parent in parentCategories" :key="parent.id" :value="parent.id">
                {{ parent.name }}
              </option>
            </select>
          </div>

          <!-- Age Range -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Min Age
              </label>
              <input
                v-model.number="formData.age_min"
                type="number"
                min="0"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g., 2"
              >
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Max Age (leave empty for no limit)
              </label>
              <input
                v-model.number="formData.age_max"
                type="number"
                min="0"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g., 4"
              >
            </div>
          </div>

          <!-- Display Order -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Display Order
            </label>
            <input
              v-model.number="formData.display_order"
              type="number"
              min="0"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="0"
            >
            <p class="text-xs text-gray-500 mt-1">Lower numbers appear first</p>
          </div>

          <!-- Color -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Color (Hex)
            </label>
            <input
              v-model="formData.color_hex"
              type="text"
              pattern="^#[0-9A-Fa-f]{6}$"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="#3B82F6"
            >
          </div>

          <!-- Icon -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Icon (Font Awesome name)
            </label>
            <input
              v-model="formData.icon"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="palette"
            >
          </div>

          <!-- Active Status -->
          <div class="flex items-center">
            <input
              v-model="formData.is_active"
              type="checkbox"
              id="is_active"
              class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            >
            <label for="is_active" class="ml-2 block text-sm text-gray-700">
              Active (visible to users)
            </label>
          </div>

          <!-- Error Message -->
          <div v-if="error" class="bg-red-50 border border-red-200 rounded-md p-3">
            <p class="text-sm text-red-800">{{ error }}</p>
          </div>

          <!-- Actions -->
          <div class="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              @click="$emit('close')"
              class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="saving"
              class="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
            >
              <font-awesome-icon v-if="saving" icon="spinner" spin class="mr-2" />
              {{ mode === 'create' ? 'Create Category' : 'Save Changes' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useEventCategories } from '../../composables/useEventCategories'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  mode: {
    type: String,
    default: 'create',
    validator: (value) => ['create', 'edit'].includes(value)
  },
  category: {
    type: Object,
    default: null
  },
  parentCategories: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close', 'save'])

const { createCategory, updateCategory } = useEventCategories()

const saving = ref(false)
const error = ref(null)

const formData = ref({
  name: '',
  slug: '',
  description: '',
  parent_id: null,
  age_min: null,
  age_max: null,
  display_order: 0,
  color_hex: '',
  icon: '',
  is_active: true
})

const resetForm = () => {
  formData.value = {
    name: '',
    slug: '',
    description: '',
    parent_id: null,
    age_min: null,
    age_max: null,
    display_order: 0,
    color_hex: '',
    icon: '',
    is_active: true
  }
}

// Watch for category changes (when editing)
watch(() => props.category, (newCategory) => {
  if (newCategory) {
    formData.value = {
      name: newCategory.name || '',
      slug: newCategory.slug || '',
      description: newCategory.description || '',
      parent_id: newCategory.parent_id || null,
      age_min: newCategory.age_range?.min || null,
      age_max: newCategory.age_range?.max || null,
      display_order: newCategory.display_order || 0,
      color_hex: newCategory.color_hex || '',
      icon: newCategory.icon || '',
      is_active: newCategory.is_active ?? true
    }
  } else {
    resetForm()
  }
}, { immediate: true })

const handleSubmit = async () => {
  try {
    saving.value = true
    error.value = null

    // Prepare age_range JSONB
    const age_range = {}
    if (formData.value.age_min !== null && formData.value.age_min !== '') {
      age_range.min = formData.value.age_min
    }
    if (formData.value.age_max !== null && formData.value.age_max !== '') {
      age_range.max = formData.value.age_max
    }

    const categoryData = {
      name: formData.value.name,
      slug: formData.value.slug,
      description: formData.value.description || null,
      parent_id: formData.value.parent_id || null,
      age_range: Object.keys(age_range).length > 0 ? age_range : null,
      display_order: formData.value.display_order,
      color_hex: formData.value.color_hex || null,
      icon: formData.value.icon || null,
      is_active: formData.value.is_active
    }

    if (props.mode === 'create') {
      await createCategory(categoryData)
    } else {
      await updateCategory(props.category.id, categoryData)
    }

    emit('save')
    resetForm()
  } catch (err) {
    error.value = err.message
  } finally {
    saving.value = false
  }
}
</script>


