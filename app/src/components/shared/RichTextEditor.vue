<template>
  <div class="rich-text-editor border border-gray-300 rounded-lg overflow-hidden">
    <!-- Toolbar -->
    <div v-if="editor" class="border-b border-gray-300 bg-gray-50 p-2 flex flex-wrap gap-1">
      <!-- Text Formatting -->
      <button
        @click="editor.chain().focus().toggleBold().run()"
        :class="{ 'bg-primary-100 text-primary-700': editor.isActive('bold') }"
        class="px-3 py-1.5 rounded hover:bg-gray-200 transition-colors font-semibold"
        type="button"
        title="Bold"
      >
        <font-awesome-icon icon="bold" class="w-4 h-4" />
      </button>
      
      <button
        @click="editor.chain().focus().toggleItalic().run()"
        :class="{ 'bg-primary-100 text-primary-700': editor.isActive('italic') }"
        class="px-3 py-1.5 rounded hover:bg-gray-200 transition-colors italic"
        type="button"
        title="Italic"
      >
        <font-awesome-icon icon="italic" class="w-4 h-4" />
      </button>
      
      <button
        @click="editor.chain().focus().toggleStrike().run()"
        :class="{ 'bg-primary-100 text-primary-700': editor.isActive('strike') }"
        class="px-3 py-1.5 rounded hover:bg-gray-200 transition-colors line-through"
        type="button"
        title="Strikethrough"
      >
        <font-awesome-icon icon="strikethrough" class="w-4 h-4" />
      </button>
      
      <div class="w-px h-6 bg-gray-300 mx-1"></div>
      
      <!-- Headings -->
      <button
        @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
        :class="{ 'bg-primary-100 text-primary-700': editor.isActive('heading', { level: 2 }) }"
        class="px-3 py-1.5 rounded hover:bg-gray-200 transition-colors font-semibold"
        type="button"
        title="Heading 2"
      >
        H2
      </button>
      
      <button
        @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
        :class="{ 'bg-primary-100 text-primary-700': editor.isActive('heading', { level: 3 }) }"
        class="px-3 py-1.5 rounded hover:bg-gray-200 transition-colors font-semibold"
        type="button"
        title="Heading 3"
      >
        H3
      </button>
      
      <div class="w-px h-6 bg-gray-300 mx-1"></div>
      
      <!-- Lists -->
      <button
        @click="editor.chain().focus().toggleBulletList().run()"
        :class="{ 'bg-primary-100 text-primary-700': editor.isActive('bulletList') }"
        class="px-3 py-1.5 rounded hover:bg-gray-200 transition-colors"
        type="button"
        title="Bullet List"
      >
        <font-awesome-icon icon="list-ul" class="w-4 h-4" />
      </button>
      
      <button
        @click="editor.chain().focus().toggleOrderedList().run()"
        :class="{ 'bg-primary-100 text-primary-700': editor.isActive('orderedList') }"
        class="px-3 py-1.5 rounded hover:bg-gray-200 transition-colors"
        type="button"
        title="Numbered List"
      >
        <font-awesome-icon icon="list-ol" class="w-4 h-4" />
      </button>
      
      <div class="w-px h-6 bg-gray-300 mx-1"></div>
      
      <!-- Blockquote -->
      <button
        @click="editor.chain().focus().toggleBlockquote().run()"
        :class="{ 'bg-primary-100 text-primary-700': editor.isActive('blockquote') }"
        class="px-3 py-1.5 rounded hover:bg-gray-200 transition-colors"
        type="button"
        title="Blockquote"
      >
        <font-awesome-icon icon="quote-right" class="w-4 h-4" />
      </button>
      
      <div class="w-px h-6 bg-gray-300 mx-1"></div>
      
      <!-- Link -->
      <button
        @click="setLink"
        :class="{ 'bg-primary-100 text-primary-700': editor.isActive('link') }"
        class="px-3 py-1.5 rounded hover:bg-gray-200 transition-colors"
        type="button"
        title="Add Link"
      >
        <font-awesome-icon icon="link" class="w-4 h-4" />
      </button>
      
      <button
        v-if="editor.isActive('link')"
        @click="editor.chain().focus().unsetLink().run()"
        class="px-3 py-1.5 rounded hover:bg-gray-200 transition-colors"
        type="button"
        title="Remove Link"
      >
        <font-awesome-icon icon="unlink" class="w-4 h-4" />
      </button>
      
      <div class="w-px h-6 bg-gray-300 mx-1"></div>
      
      <!-- Undo/Redo -->
      <button
        @click="editor.chain().focus().undo().run()"
        :disabled="!editor.can().undo()"
        class="px-3 py-1.5 rounded hover:bg-gray-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        type="button"
        title="Undo"
      >
        <font-awesome-icon icon="undo" class="w-4 h-4" />
      </button>
      
      <button
        @click="editor.chain().focus().redo().run()"
        :disabled="!editor.can().redo()"
        class="px-3 py-1.5 rounded hover:bg-gray-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        type="button"
        title="Redo"
      >
        <font-awesome-icon icon="redo" class="w-4 h-4" />
      </button>
    </div>
    
    <!-- Editor Content -->
    <editor-content :editor="editor" class="p-4" />
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: 'Start writing...'
  }
})

const emit = defineEmits(['update:modelValue'])

const editor = useEditor({
  extensions: [
    StarterKit,
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: 'text-primary-600 underline hover:text-primary-700'
      }
    }),
    Placeholder.configure({
      placeholder: props.placeholder
    })
  ],
  content: props.modelValue,
  editorProps: {
    attributes: {
      class: 'prose prose-sm max-w-none focus:outline-none min-h-[300px]'
    }
  },
  onUpdate: ({ editor }) => {
    emit('update:modelValue', editor.getHTML())
  }
})

// Watch for external changes to modelValue
watch(() => props.modelValue, (newValue) => {
  const isSame = editor.value?.getHTML() === newValue
  if (!isSame && editor.value) {
    editor.value.commands.setContent(newValue, false)
  }
})

const setLink = () => {
  const previousUrl = editor.value?.getAttributes('link').href
  const url = window.prompt('Enter URL:', previousUrl)

  if (url === null) {
    return
  }

  if (url === '') {
    editor.value?.chain().focus().extendMarkRange('link').unsetLink().run()
    return
  }

  editor.value?.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
}

onBeforeUnmount(() => {
  editor.value?.destroy()
})
</script>

<style scoped>
/* Ensure Tiptap editor content displays formatting properly */
:deep(.ProseMirror) {
  outline: none;
  min-height: 300px;
}

/* Make sure formatted text is visible */
:deep(.ProseMirror strong) {
  font-weight: 700;
}

:deep(.ProseMirror em) {
  font-style: italic;
}

:deep(.ProseMirror s) {
  text-decoration: line-through;
}

:deep(.ProseMirror h2) {
  font-size: 1.5em;
  font-weight: 700;
  margin-top: 1em;
  margin-bottom: 0.5em;
  line-height: 1.3;
}

:deep(.ProseMirror h3) {
  font-size: 1.25em;
  font-weight: 700;
  margin-top: 0.8em;
  margin-bottom: 0.4em;
  line-height: 1.4;
}

:deep(.ProseMirror ul) {
  list-style-type: disc;
  padding-left: 1.5em;
  margin: 0.5em 0;
}

:deep(.ProseMirror ol) {
  list-style-type: decimal;
  padding-left: 1.5em;
  margin: 0.5em 0;
}

:deep(.ProseMirror li) {
  margin: 0.25em 0;
}

:deep(.ProseMirror blockquote) {
  border-left: 3px solid #d1d5db;
  padding-left: 1em;
  margin: 1em 0;
  color: #6b7280;
  font-style: italic;
}

:deep(.ProseMirror a) {
  color: #2563eb;
  text-decoration: underline;
}

:deep(.ProseMirror a:hover) {
  color: #1d4ed8;
}

:deep(.ProseMirror p) {
  margin: 0.5em 0;
}

/* Placeholder styling */
:deep(.ProseMirror p.is-editor-empty:first-child::before) {
  content: attr(data-placeholder);
  float: left;
  color: #9ca3af;
  pointer-events: none;
  height: 0;
}
</style>
