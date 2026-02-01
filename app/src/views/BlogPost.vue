<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <article class="bg-white rounded-lg shadow-md overflow-hidden">
        <div class="p-8">
          <h1 class="text-4xl font-display font-bold text-gray-900 mb-4">
            Blog Post: {{ slug }}
          </h1>
          
          <div class="flex items-center gap-4 text-sm text-gray-600 mb-8">
            <span>By Author Name</span>
            <span>•</span>
            <span>Published: Jan 1, 2026</span>
            <span>•</span>
            <span>5 min read</span>
          </div>
          
          <div class="prose max-w-none">
            <p class="text-gray-600">
              This page will display the full blog post content:
            </p>
            <ul class="mt-4 space-y-2 text-gray-600">
              <li>• Featured image</li>
              <li>• Full post content (JSONB body field)</li>
              <li>• Author bio</li>
              <li>• Category and tags</li>
              <li>• Social sharing buttons</li>
              <li>• Related posts</li>
              <li>• Comments (if enabled)</li>
            </ul>
          </div>
          
          <div class="mt-8">
            <router-link 
              to="/blog" 
              class="text-primary-600 hover:text-primary-700"
            >
              ← Back to Blog
            </router-link>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()
const slug = route.params.slug
</script>

