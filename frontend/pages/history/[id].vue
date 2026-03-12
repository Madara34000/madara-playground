<template>
  <div class="p-8 max-w-4xl mx-auto">
    <NuxtLink to="/history" class="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
      {{ $t('bot.back') }}
    </NuxtLink>

    <div v-if="entry">
      <div class="flex items-center gap-3 mb-6">
        <span class="text-3xl">{{ entry.botIcon }}</span>
        <div>
          <h1 class="text-xl font-bold text-gray-900">{{ entry.botName }}</h1>
          <p class="text-sm text-gray-400">
            {{ new Date(entry.createdAt).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }}
          </p>
        </div>
      </div>

      <!-- Inputs -->
      <div class="card p-5 mb-4">
        <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Inputs</h2>
        <div class="space-y-2">
          <div v-for="(value, key) in entry.inputs" :key="key" class="flex gap-3">
            <span class="text-sm font-medium text-gray-500 min-w-[120px]">{{ key }}</span>
            <span class="text-sm text-gray-900">{{ value }}</span>
          </div>
        </div>
      </div>

      <!-- Output -->
      <div class="card p-5">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wider">{{ $t('bot.result') }}</h2>
          <button @click="copyResult" class="btn-secondary !py-1.5 !px-3 text-xs">
            {{ copied ? $t('bot.copied') : $t('bot.copy') }}
          </button>
        </div>
        <div class="bg-gray-50 rounded-lg p-5">
          <StreamingText :content="entry.output" :is-streaming="false" />
        </div>
      </div>
    </div>

    <div v-else class="text-center py-20 text-gray-400">
      Entry not found.
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const { locale } = useI18n();
const { getEntry } = useHistory();

const entry = getEntry(route.params.id as string);
const copied = ref(false);

function copyResult() {
  if (!entry) return;
  navigator.clipboard.writeText(entry.output);
  copied.value = true;
  setTimeout(() => (copied.value = false), 2000);
}
</script>
