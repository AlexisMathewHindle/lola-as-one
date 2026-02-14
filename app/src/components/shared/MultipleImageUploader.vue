<template>
  <div class="space-y-6">
    <!-- Main Image Section -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Main Image <span class="text-red-500">*</span>
      </label>
      <ImageUploader
        v-model="mainImageUrl"
        :bucket="bucket"
        alt="Main offering image"
        :max-size-m-b="maxSizeMB"
        @update:modelValue="handleMainImageUpdate"
        @upload-complete="handleMainImageUpload"
        @upload-error="handleUploadError"
      />
    </div>

    <!-- Secondary Images Section -->
    <div>
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Secondary Images (up to 6)
      </label>
      
      <!-- Secondary Images Grid -->
      <div v-if="secondaryImages.length > 0" class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
        <div
          v-for="(image, index) in secondaryImages"
          :key="index"
          class="relative group"
        >
          <div class="w-full h-40 bg-gray-100 rounded-lg border-2 border-gray-200 overflow-hidden">
            <img
              :src="image.url"
              :alt="`Secondary image ${index + 1}`"
              class="w-full h-full object-cover"
            />
          </div>
          <div class="absolute inset-0 rounded-lg flex items-center justify-center transition-all duration-200 group-hover:bg-white group-hover:bg-opacity-90">
            <button
              @click="removeSecondaryImage(index)"
              type="button"
              class="opacity-0 group-hover:opacity-100 transition-opacity duration-200 px-3 py-1.5 bg-danger-600 text-white rounded-lg hover:bg-danger-700 flex items-center gap-2 shadow-lg text-sm"
            >
              <font-awesome-icon icon="trash" class="w-3 h-3" />
              Remove
            </button>
          </div>
          <div class="absolute top-2 left-2 bg-gray-900 bg-opacity-75 text-white text-xs px-2 py-1 rounded">
            {{ index + 1 }}
          </div>
        </div>
      </div>

      <!-- Upload Area for Secondary Images -->
      <div
        v-if="secondaryImages.length < 6"
        @drop.prevent="handleSecondaryDrop"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        :class="[
          'border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 cursor-pointer',
          isDragging
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
        ]"
        @click="triggerSecondaryFileInput"
      >
        <input
          ref="secondaryFileInput"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          @change="handleSecondaryFileSelect"
          class="hidden"
        />

        <div class="space-y-2">
          <div class="flex justify-center">
            <div :class="[
              'w-12 h-12 rounded-full flex items-center justify-center transition-colors',
              isDragging ? 'bg-primary-100' : 'bg-gray-100'
            ]">
              <font-awesome-icon
                :icon="uploading ? 'spinner' : 'cloud-upload-alt'"
                :class="[
                  'w-6 h-6',
                  uploading ? 'animate-spin text-primary-600' : isDragging ? 'text-primary-600' : 'text-gray-400'
                ]"
              />
            </div>
          </div>

          <div>
            <p class="text-sm font-medium text-gray-900">
              {{ uploading ? `Uploading ${uploadProgress.current}/${uploadProgress.total}...` : 'Add secondary images' }}
            </p>
            <p class="text-xs text-gray-500 mt-1">
              {{ secondaryImages.length }}/6 images • PNG, JPG, WEBP or GIF (max {{ maxSizeMB }}MB each)
            </p>
            <p class="text-xs text-gray-500 mt-1">
              Click to select or drag & drop multiple images
            </p>
          </div>
        </div>
      </div>

      <p v-if="secondaryImages.length >= 6" class="text-sm text-gray-500 mt-2">
        Maximum of 6 secondary images reached
      </p>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="p-4 bg-danger-50 border border-danger-200 rounded-lg">
      <p class="text-sm text-danger-700 whitespace-pre-line">{{ error }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { supabase } from '../../lib/supabase'
import ImageUploader from './ImageUploader.vue'

const props = defineProps({
  mainImage: {
    type: String,
    default: ''
  },
  secondaryImagesData: {
    type: Array,
    default: () => []
  },
  bucket: {
    type: String,
    required: true,
    validator: (value) => ['product-images', 'blog-images', 'workshop-images'].includes(value)
  },
  maxSizeMB: {
    type: Number,
    default: 5
  }
})

const emit = defineEmits(['update:mainImage', 'update:secondaryImagesData', 'upload-error'])

const secondaryFileInput = ref(null)
const mainImageUrl = ref(props.mainImage)
const secondaryImages = ref([...props.secondaryImagesData])
const uploading = ref(false)
const uploadProgress = ref({ current: 0, total: 0 })
const error = ref(null)
const isDragging = ref(false)

// Watch for external changes
watch(() => props.mainImage, (newValue) => {
  mainImageUrl.value = newValue
})

watch(() => props.secondaryImagesData, (newValue) => {
  secondaryImages.value = [...newValue]
}, { deep: true })

const handleMainImageUpdate = (url) => {
  mainImageUrl.value = url
  emit('update:mainImage', url)
}

const handleMainImageUpload = ({ url, path }) => {
  console.log('Main image uploaded:', { url, path })
}

const triggerSecondaryFileInput = () => {
  if (!uploading.value && secondaryImages.value.length < 6) {
    secondaryFileInput.value?.click()
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

const handleSecondaryFileSelect = (event) => {
  const files = Array.from(event.target.files || [])
  if (files.length > 0) {
    uploadMultipleSecondaryFiles(files)
  }
}

const handleSecondaryDrop = (event) => {
  isDragging.value = false
  const files = Array.from(event.dataTransfer.files || [])
  if (files.length > 0) {
    uploadMultipleSecondaryFiles(files)
  }
}

const uploadMultipleSecondaryFiles = async (files) => {
  // Filter out files that would exceed the limit
  const availableSlots = 6 - secondaryImages.value.length
  if (availableSlots === 0) {
    error.value = 'Maximum of 6 secondary images allowed'
    return
  }

  const filesToUpload = files.slice(0, availableSlots)

  if (files.length > availableSlots) {
    error.value = `Only uploading ${availableSlots} image(s) to stay within the 6 image limit`
  }

  uploading.value = true
  uploadProgress.value = { current: 0, total: filesToUpload.length }
  error.value = null

  const uploadedImages = []
  const errors = []

  for (let i = 0; i < filesToUpload.length; i++) {
    const file = filesToUpload[i]
    uploadProgress.value.current = i + 1

    // Validate file
    if (!validateFile(file)) {
      errors.push(`${file.name}: ${error.value}`)
      error.value = null
      continue
    }

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `${fileName}`

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
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

      // Add to uploaded images with order
      uploadedImages.push({
        url: publicUrl,
        order: secondaryImages.value.length + uploadedImages.length + 1
      })
    } catch (err) {
      errors.push(`${file.name}: ${err.message || 'Upload failed'}`)
    }
  }

  // Add all successfully uploaded images
  if (uploadedImages.length > 0) {
    secondaryImages.value.push(...uploadedImages)
    emit('update:secondaryImagesData', secondaryImages.value)
  }

  // Show errors if any
  if (errors.length > 0) {
    error.value = `Some uploads failed:\n${errors.join('\n')}`
    emit('upload-error', new Error(error.value))
  }

  // Clear file input
  if (secondaryFileInput.value) {
    secondaryFileInput.value.value = ''
  }

  uploading.value = false
  uploadProgress.value = { current: 0, total: 0 }
}

const uploadSecondaryFile = async (file) => {
  // Use the multiple upload function for single files too
  await uploadMultipleSecondaryFiles([file])
}

const removeSecondaryImage = (index) => {
  secondaryImages.value.splice(index, 1)

  // Reorder remaining images
  secondaryImages.value.forEach((img, idx) => {
    img.order = idx + 1
  })

  emit('update:secondaryImagesData', secondaryImages.value)
}

const handleUploadError = (err) => {
  error.value = err.message || 'Failed to upload image'
  emit('upload-error', err)
}
</script>


