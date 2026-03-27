<template>
  <div class="prose prose-sm max-w-none">
    <div
      v-html="renderedContent"
      :class="{ 'cursor-blink': isStreaming }"
    />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  content: string;
  isStreaming: boolean;
}>();

const renderedContent = computed(() => {
  // Basic markdown-like rendering
  let text = props.content;

  // Headers
  text = text.replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold text-gray-900 mt-4 mb-2">$1</h3>');
  text = text.replace(/^## (.+)$/gm, '<h2 class="text-lg font-semibold text-gray-900 mt-6 mb-3">$1</h2>');
  text = text.replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold text-gray-900 mt-6 mb-3">$1</h1>');

  // Bold
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>');

  // Italic
  text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Arrows
  text = text.replace(/→/g, '<span class="text-gray-400">→</span>');

  // Line breaks
  text = text.replace(/\n/g, '<br>');

  return text;
});
</script>
