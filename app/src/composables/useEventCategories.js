import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase'

/**
 * Composable for managing event categories
 * Provides methods to fetch, create, update, and delete event categories
 */
export function useEventCategories() {
  const categories = ref([])
  const loading = ref(false)
  const error = ref(null)

  /**
   * Fetch all event categories from the database
   * @param {Object} options - Query options
   * @param {boolean} options.activeOnly - Only fetch active categories (default: false)
   * @param {boolean} options.includeParent - Include parent category data (default: true)
   */
  const fetchCategories = async (options = {}) => {
    const { activeOnly = false, includeParent = true } = options
    
    try {
      loading.value = true
      error.value = null

      let query = supabase
        .from('event_categories')
        .select(includeParent ? '*, parent:parent_id(*)' : '*')
        .order('display_order', { ascending: true })

      if (activeOnly) {
        query = query.eq('is_active', true)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      categories.value = data || []
      return data
    } catch (err) {
      error.value = err.message
      console.error('Error fetching event categories:', err)
      return []
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch a single category by ID
   * @param {string} id - Category UUID
   */
  const fetchCategoryById = async (id) => {
    try {
      loading.value = true
      error.value = null

      const { data, error: fetchError } = await supabase
        .from('event_categories')
        .select('*, parent:parent_id(*)')
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError

      return data
    } catch (err) {
      error.value = err.message
      console.error('Error fetching category:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Create a new event category
   * @param {Object} categoryData - Category data
   */
  const createCategory = async (categoryData) => {
    try {
      loading.value = true
      error.value = null

      const { data, error: createError } = await supabase
        .from('event_categories')
        .insert([categoryData])
        .select()
        .single()

      if (createError) throw createError

      // Refresh categories list
      await fetchCategories()

      return data
    } catch (err) {
      error.value = err.message
      console.error('Error creating category:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Update an existing event category
   * @param {string} id - Category UUID
   * @param {Object} updates - Fields to update
   */
  const updateCategory = async (id, updates) => {
    try {
      loading.value = true
      error.value = null

      const { data, error: updateError } = await supabase
        .from('event_categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError

      // Refresh categories list
      await fetchCategories()

      return data
    } catch (err) {
      error.value = err.message
      console.error('Error updating category:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Delete an event category
   * @param {string} id - Category UUID
   */
  const deleteCategory = async (id) => {
    try {
      loading.value = true
      error.value = null

      const { error: deleteError } = await supabase
        .from('event_categories')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      // Refresh categories list
      await fetchCategories()

      return true
    } catch (err) {
      error.value = err.message
      console.error('Error deleting category:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Reorder categories by updating display_order
   * @param {Array} orderedIds - Array of category IDs in desired order
   */
  const reorderCategories = async (orderedIds) => {
    try {
      loading.value = true
      error.value = null

      // Update each category's display_order
      const updates = orderedIds.map((id, index) =>
        supabase
          .from('event_categories')
          .update({ display_order: index })
          .eq('id', id)
      )

      await Promise.all(updates)

      // Refresh categories list
      await fetchCategories()

      return true
    } catch (err) {
      error.value = err.message
      console.error('Error reordering categories:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Computed properties
  const parentCategories = computed(() => {
    return categories.value.filter(cat => !cat.parent_id)
  })

  const childCategories = computed(() => {
    return categories.value.filter(cat => cat.parent_id)
  })

  /**
   * Get child categories for a specific parent
   * @param {string} parentId - Parent category UUID
   */
  const getChildCategories = (parentId) => {
    return categories.value.filter(cat => cat.parent_id === parentId)
  }

  /**
   * Get hierarchical category structure for dropdowns
   * Returns array with parent categories and their children indented
   */
  const hierarchicalCategories = computed(() => {
    const result = []

    parentCategories.value.forEach(parent => {
      result.push({
        ...parent,
        isParent: true,
        level: 0
      })

      const children = getChildCategories(parent.id)
      children.forEach(child => {
        result.push({
          ...child,
          isParent: false,
          level: 1
        })
      })
    })

    return result
  })

  return {
    // State
    categories,
    loading,
    error,

    // Methods
    fetchCategories,
    fetchCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,

    // Computed
    parentCategories,
    childCategories,
    hierarchicalCategories,
    getChildCategories
  }
}

