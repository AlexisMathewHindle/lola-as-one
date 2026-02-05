<template>
  <div class="min-h-screen bg-gray-50 py-12">
    <div class="max-w-4xl mx-auto px-4">
      <h1 class="text-3xl font-bold text-gray-900 mb-8">User Debug Info</h1>
      
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">Current User</h2>
        <pre class="bg-gray-100 p-4 rounded overflow-auto text-sm">{{ JSON.stringify(user, null, 2) }}</pre>
      </div>
      
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">Session</h2>
        <pre class="bg-gray-100 p-4 rounded overflow-auto text-sm">{{ JSON.stringify(session, null, 2) }}</pre>
      </div>
      
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">Admin Status</h2>
        <p class="text-lg">
          <span class="font-semibold">Is Admin:</span> 
          <span :class="isAdmin ? 'text-green-600' : 'text-red-600'">
            {{ isAdmin ? 'YES ✓' : 'NO ✗' }}
          </span>
        </p>
        <p class="text-sm text-gray-600 mt-2">
          Role in app_metadata: <code class="bg-gray-100 px-2 py-1 rounded">{{ user?.app_metadata?.role || 'not set' }}</code>
        </p>
      </div>
      
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 class="text-lg font-semibold text-blue-900 mb-3">How to Set Admin Role</h3>
        <p class="text-blue-800 mb-4">
          Run this SQL in your Supabase SQL Editor to grant admin access:
        </p>
        <pre class="bg-white p-4 rounded border border-blue-300 text-sm overflow-auto">UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'::jsonb
WHERE email = '{{ user?.email }}';</pre>
        <p class="text-sm text-blue-700 mt-3">
          After running this SQL, sign out and sign back in for the changes to take effect.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../lib/supabase'

const user = ref(null)
const session = ref(null)

const isAdmin = computed(() => user.value?.app_metadata?.role === 'admin')

onMounted(async () => {
  const { data: { session: currentSession } } = await supabase.auth.getSession()
  session.value = currentSession
  
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  user.value = currentUser
})
</script>

