<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Header -->
    <div class="flex justify-between items-center mb-8">
      <div>
        <h1 class="text-3xl font-display font-bold text-gray-900">Event Categories</h1>
        <p class="mt-2 text-sm text-gray-600">
          Manage event categories and their hierarchy
        </p>
      </div>
      <button
        @click="openCreateModal"
        class="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
      >
        <font-awesome-icon icon="plus" class="mr-2" />
        Add Category
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-12">
      <font-awesome-icon icon="spinner" spin class="text-4xl text-gray-400" />
      <p class="mt-4 text-gray-600">Loading categories...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
      <p class="text-red-800">{{ error }}</p>
    </div>

    <!-- Categories List -->
    <div v-else class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th class="hidden md:table-cell px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Slug
              </th>
              <th class="hidden lg:table-cell px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Age Range
              </th>
              <th class="hidden xl:table-cell px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order
              </th>
              <th class="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th class="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <template v-for="parent in parentCategories">
              <!-- Parent Category Row -->
              <tr :key="`parent-${parent.id}`" class="bg-gray-50">
                <td class="px-4 sm:px-6 py-4">
                  <div class="flex items-center">
                    <span v-if="parent.icon" class="mr-2">
                      <font-awesome-icon :icon="parent.icon" :style="{ color: parent.color_hex }" />
                    </span>
                    <span class="font-semibold text-gray-900">{{ parent.name }}</span>
                  </div>
                  <div class="md:hidden text-xs text-gray-500 mt-1">
                    {{ parent.slug }}
                  </div>
                </td>
                <td class="hidden md:table-cell px-4 sm:px-6 py-4 text-sm text-gray-500">
                  {{ parent.slug }}
                </td>
                <td class="hidden lg:table-cell px-4 sm:px-6 py-4 text-sm text-gray-500">
                  {{ formatAgeRange(parent.age_range) }}
                </td>
                <td class="hidden xl:table-cell px-4 sm:px-6 py-4 text-sm text-gray-500">
                  {{ parent.display_order }}
                </td>
                <td class="px-4 sm:px-6 py-4">
                  <span :class="parent.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'"
                        class="px-2 py-1 text-xs font-medium rounded-full">
                    {{ parent.is_active ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td class="px-4 sm:px-6 py-4 text-right text-sm font-medium">
                  <button
                    @click="openEditModal(parent)"
                    class="text-primary-600 hover:text-primary-900 mr-2 sm:mr-3"
                  >
                    <font-awesome-icon icon="edit" />
                  </button>
                  <button
                    @click="confirmDelete(parent)"
                    class="text-red-600 hover:text-red-900"
                  >
                    <font-awesome-icon icon="trash" />
                  </button>
                </td>
              </tr>

              <!-- Child Category Rows -->
              <tr v-for="child in getChildCategories(parent.id)" :key="child.id">
                <td class="px-4 sm:px-6 py-4">
                  <div class="flex items-center pl-4 sm:pl-8">
                    <span class="text-gray-400 mr-2">└─</span>
                    <span class="text-gray-700">{{ child.name }}</span>
                  </div>
                  <div class="md:hidden text-xs text-gray-500 mt-1 pl-4 sm:pl-8">
                    {{ child.slug }}
                  </div>
                </td>
                <td class="hidden md:table-cell px-4 sm:px-6 py-4 text-sm text-gray-500">
                  {{ child.slug }}
                </td>
                <td class="hidden lg:table-cell px-4 sm:px-6 py-4 text-sm text-gray-500">
                  {{ formatAgeRange(child.age_range) }}
                </td>
                <td class="hidden xl:table-cell px-4 sm:px-6 py-4 text-sm text-gray-500">
                  {{ child.display_order }}
                </td>
                <td class="px-4 sm:px-6 py-4">
                  <span :class="child.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'"
                        class="px-2 py-1 text-xs font-medium rounded-full">
                    {{ child.is_active ? 'Active' : 'Inactive' }}
                  </span>
                </td>
                <td class="px-4 sm:px-6 py-4 text-right text-sm font-medium">
                  <button
                    @click="openEditModal(child)"
                    class="text-primary-600 hover:text-primary-900 mr-2 sm:mr-3"
                  >
                    <font-awesome-icon icon="edit" />
                  </button>
                  <button
                    @click="confirmDelete(child)"
                    class="text-red-600 hover:text-red-900"
                  >
                    <font-awesome-icon icon="trash" />
                  </button>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <!-- Empty State -->
      <div v-if="categories.length === 0" class="text-center py-12">
        <p class="text-gray-500">No categories found. Create your first category to get started.</p>
      </div>
    </div>

    <!-- Category Modal -->
    <CategoryModal
      :show="showModal"
      :mode="modalMode"
      :category="editingCategory"
      :parent-categories="parentCategories"
      @close="closeModal"
      @save="handleSave"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useEventCategories } from '../../composables/useEventCategories'
import { useToastStore } from '../../stores/toast'
import CategoryModal from '../../components/admin/CategoryModal.vue'

// Composable
const {
  categories,
  parentCategories,
  getChildCategories,
  fetchCategories,
  deleteCategory,
  loading,
  error
} = useEventCategories()

const toastStore = useToastStore()

// Modal state
const showModal = ref(false)
const modalMode = ref('create') // 'create' or 'edit'
const editingCategory = ref(null)

// Load categories on mount
onMounted(async () => {
  await fetchCategories({ activeOnly: false })
})

// Format age range for display
const formatAgeRange = (ageRange) => {
  if (!ageRange) return 'All ages'

  const min = ageRange.min || 0
  const max = ageRange.max

  if (min === 0 && !max) return 'All ages'
  if (!max) return `${min}+`
  return `${min}-${max}`
}

// Modal actions
const openCreateModal = () => {
  modalMode.value = 'create'
  editingCategory.value = null
  showModal.value = true
}

const openEditModal = (category) => {
  modalMode.value = 'edit'
  editingCategory.value = { ...category }
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
  editingCategory.value = null
}

// Delete confirmation
const confirmDelete = async (category) => {
  if (confirm(`Are you sure you want to delete "${category.name}"? This action cannot be undone.`)) {
    try {
      await deleteCategory(category.id)
      toastStore.success('Category deleted successfully')
    } catch (err) {
      toastStore.error(`Error deleting category: ${err.message}`)
    }
  }
}

// Handle save from modal
const handleSave = async () => {
  await fetchCategories({ activeOnly: false })
  closeModal()
}
</script>


