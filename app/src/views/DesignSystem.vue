<template>
  <div class="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-12">
        <h1 class="text-4xl font-bold text-dark-900 mb-2">Design System</h1>
        <p class="text-lg text-gray-600">Lola As One - Brand Guidelines & Components</p>
      </div>

      <!-- Colors Section -->
      <section class="mb-16">
        <h2 class="text-3xl font-bold text-dark-900 mb-6">Color Palette</h2>
        
        <!-- Primary Colors -->
        <div class="mb-8">
          <h3 class="text-xl font-semibold text-dark-800 mb-4">Primary - Orange</h3>
          <div class="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-4">
            <div v-for="shade in [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]" :key="shade" class="text-center">
              <div :class="`bg-primary-${shade} h-20 rounded-lg shadow-sm mb-2`"></div>
              <p class="text-xs font-medium text-gray-700">{{ shade }}</p>
              <p class="text-xs text-gray-500">primary-{{ shade }}</p>
            </div>
          </div>
        </div>

        <!-- Success Colors -->
        <div class="mb-8">
          <h3 class="text-xl font-semibold text-dark-800 mb-4">Success - Green</h3>
          <div class="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-4">
            <div v-for="shade in [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]" :key="shade" class="text-center">
              <div :class="`bg-success-${shade} h-20 rounded-lg shadow-sm mb-2`"></div>
              <p class="text-xs font-medium text-gray-700">{{ shade }}</p>
              <p class="text-xs text-gray-500">success-{{ shade }}</p>
            </div>
          </div>
        </div>

        <!-- Warning Colors -->
        <div class="mb-8">
          <h3 class="text-xl font-semibold text-dark-800 mb-4">Warning - Yellow</h3>
          <div class="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-4">
            <div v-for="shade in [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]" :key="shade" class="text-center">
              <div :class="`bg-warning-${shade} h-20 rounded-lg shadow-sm mb-2`"></div>
              <p class="text-xs font-medium text-gray-700">{{ shade }}</p>
              <p class="text-xs text-gray-500">warning-{{ shade }}</p>
            </div>
          </div>
        </div>

        <!-- Danger Colors -->
        <div class="mb-8">
          <h3 class="text-xl font-semibold text-dark-800 mb-4">Danger - Red</h3>
          <div class="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-4">
            <div v-for="shade in [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]" :key="shade" class="text-center">
              <div :class="`bg-danger-${shade} h-20 rounded-lg shadow-sm mb-2`"></div>
              <p class="text-xs font-medium text-gray-700">{{ shade }}</p>
              <p class="text-xs text-gray-500">danger-{{ shade }}</p>
            </div>
          </div>
        </div>

        <!-- Dark Colors -->
        <div class="mb-8">
          <h3 class="text-xl font-semibold text-dark-800 mb-4">Dark - Navy/Slate</h3>
          <div class="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-4">
            <div v-for="shade in [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]" :key="shade" class="text-center">
              <div :class="`bg-dark-${shade} h-20 rounded-lg shadow-sm mb-2`"></div>
              <p class="text-xs font-medium text-gray-700">{{ shade }}</p>
              <p class="text-xs text-gray-500">dark-{{ shade }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Typography Section -->
      <section class="mb-16">
        <h2 class="text-3xl font-bold text-dark-900 mb-6">Typography</h2>
        
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-8 space-y-6">
          <div>
            <p class="text-sm text-gray-500 mb-2">Heading 1</p>
            <h1 class="text-5xl font-bold text-dark-900">The quick brown fox jumps over the lazy dog</h1>
          </div>
          <div>
            <p class="text-sm text-gray-500 mb-2">Heading 2</p>
            <h2 class="text-4xl font-bold text-dark-900">The quick brown fox jumps over the lazy dog</h2>
          </div>
          <div>
            <p class="text-sm text-gray-500 mb-2">Heading 3</p>
            <h3 class="text-3xl font-semibold text-dark-900">The quick brown fox jumps over the lazy dog</h3>
          </div>
          <div>
            <p class="text-sm text-gray-500 mb-2">Heading 4</p>
            <h4 class="text-2xl font-semibold text-dark-900">The quick brown fox jumps over the lazy dog</h4>
          </div>
          <div>
            <p class="text-sm text-gray-500 mb-2">Heading 5</p>
            <h5 class="text-xl font-medium text-dark-900">The quick brown fox jumps over the lazy dog</h5>
          </div>
          <div>
            <p class="text-sm text-gray-500 mb-2">Body Text</p>
            <p class="text-base text-gray-700">The quick brown fox jumps over the lazy dog. Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
          </div>
          <div>
            <p class="text-sm text-gray-500 mb-2">Small Text</p>
            <p class="text-sm text-gray-600">The quick brown fox jumps over the lazy dog</p>
          </div>
          <div>
            <p class="text-sm text-gray-500 mb-2">Extra Small Text</p>
            <p class="text-xs text-gray-500">The quick brown fox jumps over the lazy dog</p>
          </div>
        </div>
      </section>

      <!-- Buttons Section -->
      <section class="mb-16">
        <h2 class="text-3xl font-bold text-dark-900 mb-6">Buttons</h2>
        
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div class="space-y-8">
            <!-- Primary Buttons -->
            <div>
              <h3 class="text-lg font-semibold text-dark-800 mb-4">Primary Buttons</h3>
              <div class="flex flex-wrap gap-4">
                <button class="px-6 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium shadow-sm">
                  Primary Button
                </button>
                <button class="px-6 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium shadow-sm inline-flex items-center">
                  <font-awesome-icon icon="plus" class="w-4 h-4 mr-2" />
                  With Icon
                </button>
                <button class="px-6 py-2.5 bg-primary-500 text-white rounded-lg opacity-50 cursor-not-allowed font-medium shadow-sm" disabled>
                  Disabled
                </button>
              </div>
            </div>

            <!-- Success Buttons -->
            <div>
              <h3 class="text-lg font-semibold text-dark-800 mb-4">Success Buttons</h3>
              <div class="flex flex-wrap gap-4">
                <button class="px-6 py-2.5 bg-success-500 text-white rounded-lg hover:bg-success-600 transition-colors font-medium shadow-sm">
                  Success Button
                </button>
                <button class="px-6 py-2.5 bg-success-500 text-white rounded-lg hover:bg-success-600 transition-colors font-medium shadow-sm inline-flex items-center">
                  <font-awesome-icon icon="check" class="w-4 h-4 mr-2" />
                  With Icon
                </button>
              </div>
            </div>

            <!-- Danger Buttons -->
            <div>
              <h3 class="text-lg font-semibold text-dark-800 mb-4">Danger Buttons</h3>
              <div class="flex flex-wrap gap-4">
                <button class="px-6 py-2.5 bg-danger-500 text-white rounded-lg hover:bg-danger-600 transition-colors font-medium shadow-sm">
                  Danger Button
                </button>
                <button class="px-6 py-2.5 bg-danger-500 text-white rounded-lg hover:bg-danger-600 transition-colors font-medium shadow-sm inline-flex items-center">
                  <font-awesome-icon icon="trash" class="w-4 h-4 mr-2" />
                  Delete
                </button>
              </div>
            </div>

            <!-- Outline Buttons -->
            <div>
              <h3 class="text-lg font-semibold text-dark-800 mb-4">Outline Buttons</h3>
              <div class="flex flex-wrap gap-4">
                <button class="px-6 py-2.5 border-2 border-primary-500 text-primary-500 rounded-lg hover:bg-primary-50 transition-colors font-medium">
                  Primary Outline
                </button>
                <button class="px-6 py-2.5 border-2 border-success-500 text-success-500 rounded-lg hover:bg-success-50 transition-colors font-medium">
                  Success Outline
                </button>
                <button class="px-6 py-2.5 border-2 border-danger-500 text-danger-500 rounded-lg hover:bg-danger-50 transition-colors font-medium">
                  Danger Outline
                </button>
              </div>
            </div>

            <!-- Ghost Buttons -->
            <div>
              <h3 class="text-lg font-semibold text-dark-800 mb-4">Ghost Buttons</h3>
              <div class="flex flex-wrap gap-4">
                <button class="px-6 py-2.5 text-primary-500 rounded-lg hover:bg-primary-50 transition-colors font-medium">
                  Ghost Primary
                </button>
                <button class="px-6 py-2.5 text-success-500 rounded-lg hover:bg-success-50 transition-colors font-medium">
                  Ghost Success
                </button>
                <button class="px-6 py-2.5 text-danger-500 rounded-lg hover:bg-danger-50 transition-colors font-medium">
                  Ghost Danger
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Form Elements Section -->
      <section class="mb-16">
        <h2 class="text-3xl font-bold text-dark-900 mb-6">Form Elements</h2>

        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-8 space-y-6">
          <!-- Text Input -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Text Input</label>
            <input type="text" placeholder="Enter text..." class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent">
          </div>

          <!-- Select -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Select Dropdown</label>
            <div class="relative">
              <select class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white">
                <option>Option 1</option>
                <option>Option 2</option>
                <option>Option 3</option>
              </select>
              <font-awesome-icon icon="chevron-down" class="absolute right-3 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <!-- Textarea -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Textarea</label>
            <textarea rows="4" placeholder="Enter description..." class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"></textarea>
          </div>

          <!-- Checkbox -->
          <div class="flex items-center">
            <input type="checkbox" id="checkbox1" class="h-5 w-5 text-primary-500 focus:ring-primary-500 border-gray-300 rounded">
            <label for="checkbox1" class="ml-3 text-sm font-medium text-gray-700">Checkbox Label</label>
          </div>

          <!-- Radio -->
          <div class="space-y-2">
            <div class="flex items-center">
              <input type="radio" id="radio1" name="radio" class="h-5 w-5 text-primary-500 focus:ring-primary-500 border-gray-300">
              <label for="radio1" class="ml-3 text-sm font-medium text-gray-700">Radio Option 1</label>
            </div>
            <div class="flex items-center">
              <input type="radio" id="radio2" name="radio" class="h-5 w-5 text-primary-500 focus:ring-primary-500 border-gray-300">
              <label for="radio2" class="ml-3 text-sm font-medium text-gray-700">Radio Option 2</label>
            </div>
          </div>
        </div>
      </section>

      <!-- Icons Section -->
      <section class="mb-16">
        <h2 class="text-3xl font-bold text-dark-900 mb-6">Icons (Font Awesome)</h2>

        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div class="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-6">
            <div v-for="icon in commonIcons" :key="icon" class="flex flex-col items-center text-center">
              <font-awesome-icon :icon="icon" class="w-8 h-8 text-dark-700 mb-2" />
              <p class="text-xs text-gray-600">{{ icon }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Cards Section -->
      <section class="mb-16">
        <h2 class="text-3xl font-bold text-dark-900 mb-6">Cards</h2>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <!-- Basic Card -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 class="text-lg font-semibold text-dark-900 mb-2">Basic Card</h3>
            <p class="text-sm text-gray-600">This is a basic card with shadow and border.</p>
          </div>

          <!-- Card with Icon -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
              <font-awesome-icon icon="star" class="w-6 h-6 text-primary-500" />
            </div>
            <h3 class="text-lg font-semibold text-dark-900 mb-2">Card with Icon</h3>
            <p class="text-sm text-gray-600">Card featuring an icon background.</p>
          </div>

          <!-- Stat Card -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-sm font-medium text-gray-600">Total Sales</h3>
              <div class="w-10 h-10 bg-success-100 rounded-lg flex items-center justify-center">
                <font-awesome-icon icon="chart-line" class="w-5 h-5 text-success-600" />
              </div>
            </div>
            <p class="text-3xl font-bold text-dark-900">£12,345</p>
            <p class="text-xs text-gray-500 mt-2">+12% from last month</p>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
const commonIcons = [
  'home', 'user', 'cog', 'bell', 'search', 'filter', 'plus', 'edit',
  'trash', 'check', 'times', 'star', 'heart', 'shopping-cart', 'box',
  'calendar', 'clock', 'envelope', 'phone', 'image', 'file-alt', 'chart-line'
]
</script>


