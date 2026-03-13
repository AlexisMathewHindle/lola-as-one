<template>
  <div class="space-y-4">
    <!-- Preview Image -->
    <div v-if="imageUrl" class="relative group">
      <div class="w-full h-64 bg-gray-100 rounded-lg border-2 border-gray-200 overflow-hidden">
        <img
          :src="imageUrl"
          :alt="alt"
          class="w-full h-full object-contain"
        />
      </div>
      <div class="absolute inset-0 rounded-lg flex items-center justify-center transition-all duration-200 group-hover:bg-white group-hover:bg-opacity-90">
        <button
          @click="removeImage"
          type="button"
          class="opacity-0 group-hover:opacity-100 transition-opacity duration-200 px-4 py-2 bg-danger-600 text-white rounded-lg hover:bg-danger-700 flex items-center gap-2 shadow-lg"
        >
          <font-awesome-icon icon="trash" class="w-4 h-4" />
          Remove Image
        </button>
      </div>
    </div>

    <!-- Upload Area -->
    <div
      v-if="!imageUrl"
      @drop.prevent="handleDrop"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      :class="[
        'border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer',
        isDragging
          ? 'border-primary-500 bg-primary-50'
          : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
      ]"
      @click="triggerFileInput"
    >
      <input
        ref="fileInput"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        @change="handleFileSelect"
        class="hidden"
      />

      <div class="space-y-3">
        <div class="flex justify-center">
          <div :class="[
            'w-16 h-16 rounded-full flex items-center justify-center transition-colors',
            isDragging ? 'bg-primary-100' : 'bg-gray-100'
          ]">
            <font-awesome-icon
              :icon="uploading ? 'spinner' : 'cloud-upload-alt'"
              :class="[
                'w-8 h-8',
                uploading ? 'animate-spin text-primary-600' : isDragging ? 'text-primary-600' : 'text-gray-400'
              ]"
            />
          </div>
        </div>

        <div>
          <p class="text-sm font-medium text-gray-900">
            {{ uploading ? 'Uploading...' : 'Drop image here or click to browse' }}
          </p>
          <p class="text-xs text-gray-500 mt-1">
            PNG, JPG, WEBP or GIF (max {{ maxSizeMB }}MB)
          </p>
        </div>
      </div>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="bg-danger-50 border border-danger-200 rounded-lg p-3 flex items-start gap-2">
      <font-awesome-icon icon="exclamation-triangle" class="w-4 h-4 text-danger-600 mt-0.5 flex-shrink-0" />
      <p class="text-sm text-danger-700">{{ error }}</p>
    </div>

    <!-- Upload Progress -->
    <div v-if="uploading" class="space-y-2">
      <div class="flex items-center justify-between text-sm">
        <span class="text-gray-600">Uploading...</span>
        <span class="text-gray-900 font-medium">{{ uploadProgress }}%</span>
      </div>
      <div class="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          class="bg-primary-600 h-2 transition-all duration-300 rounded-full"
          :style="{ width: `${uploadProgress}%` }"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { supabase } from '../../lib/supabase'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  bucket: {
    type: String,
    required: true,
    validator: (value) => ['product-images', 'blog-images', 'workshop-images', 'category-images'].includes(value)
  },
  alt: {
    type: String,
    default: 'Uploaded image'
  },
  maxSizeMB: {
    type: Number,
    default: 5
  }
})

const emit = defineEmits(['update:modelValue', 'upload-complete', 'upload-error'])

const fileInput = ref(null)
const imageUrl = ref(props.modelValue)
const uploading = ref(false)
const uploadProgress = ref(0)
const error = ref(null)
const isDragging = ref(false)

// Watch for external changes to modelValue
watch(() => props.modelValue, (newValue) => {
  imageUrl.value = newValue
})

const triggerFileInput = () => {
  if (!uploading.value) {
    fileInput.value?.click()
  }
}

const validateFile = (file) => {
  error.value = null

  // Check file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowedTypes.includes(file.type)) {
    error.value = 'Please upload a valid image file (PNG, JPG, WEBP, or GIF)'
    return false
  }

  // Check file size
  const maxSizeBytes = props.maxSizeMB * 1024 * 1024
  if (file.size > maxSizeBytes) {
    error.value = `File size must be less than ${props.maxSizeMB}MB`
    return false
  }

  return true
}

const handleFileSelect = (event) => {
  const file = event.target.files?.[0]
  if (file) {
    uploadFile(file)
  }
}

const handleDrop = (event) => {
  isDragging.value = false
  const file = event.dataTransfer.files?.[0]
  if (file) {
    uploadFile(file)
  }
}

const uploadFile = async (file) => {
  if (!validateFile(file)) return

  uploading.value = true
  uploadProgress.value = 0
  error.value = null

  try {
    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `${fileName}`

    // Upload to Supabase Storage
    const { data, error: uploadError } = await supabase.storage
      .from(props.bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) throw uploadError

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(props.bucket)
      .getPublicUrl(filePath)

    imageUrl.value = publicUrl
    emit('update:modelValue', publicUrl)
    emit('upload-complete', { url: publicUrl, path: filePath })
    uploadProgress.value = 100
  } catch (err) {
    error.value = err.message || 'Failed to upload image'
    emit('upload-error', err)
  } finally {
    uploading.value = false
  }
}

const removeImage = () => {
  imageUrl.value = ''
  emit('update:modelValue', '')
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}


</script>
