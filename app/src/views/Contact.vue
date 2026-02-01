<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="bg-white rounded-lg shadow-md p-8">
        <h1 class="text-4xl font-display font-bold text-gray-900 mb-6">
          Contact Us
        </h1>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 class="text-2xl font-semibold text-gray-900 mb-4">
              Get in Touch
            </h2>
            <p class="text-gray-600 mb-6">
              Have questions about workshops or art boxes? We'd love to hear from you!
            </p>
            
            <div class="space-y-4">
              <div>
                <h3 class="font-semibold text-gray-900">Email</h3>
                <p class="text-gray-600">hello@lolaasone.com</p>
              </div>
              
              <div>
                <h3 class="font-semibold text-gray-900">Phone</h3>
                <p class="text-gray-600">+44 (0) 123 456 7890</p>
              </div>
              
              <div>
                <h3 class="font-semibold text-gray-900">Address</h3>
                <p class="text-gray-600">
                  Lola Creative Space<br>
                  123 Creative Street<br>
                  London, UK
                </p>
              </div>
            </div>
          </div>
          
          <div>
            <h2 class="text-2xl font-semibold text-gray-900 mb-4">
              Send a Message
            </h2>
            <form class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input 
                  type="text" 
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Your name"
                >
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input 
                  type="email" 
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="your@email.com"
                >
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea 
                  rows="4"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="How can we help?"
                ></textarea>
              </div>
              
              <button 
                type="submit"
                class="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Send Message
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// Contact page
</script>

