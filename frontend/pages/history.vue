<template>
  <div class="p-8 max-w-4xl mx-auto">
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900 mb-2">{{ $t('history.title') }}</h1>
      <p class="text-gray-500">{{ $t('history.subtitle') }}</p>
    </div>

    <!-- Search -->
    <div class="mb-6">
      <input
        v-model="search"
        :placeholder="$t('history.search')"
        class="input-field"
      />
    </div>

    <!-- Empty state -->
    <div v-if="filteredHistory.length === 0" class="text-center py-20">
      <div class="text-4xl mb-4">📋</div>
      <p class="text-gray-400">{{ $t('history.empty') }}</p>
    </div>

    <!-- History list -->
    <div v-else class="space-y-3">
      <div
        v-for="entry in filteredHistory"
        :key="entry.id"
        class="card p-5"
      >
        <div class="flex items-start justify-between">
          <div class="flex items-start gap-3 flex-1 min-w-0">
            <span class="text-2xl">{{ entry.botIcon }}</span>
            <div class="flex-1 min-w-0">
              <h3 class="font-medium text-gray-900 text-sm">{{ entry.botName }}</h3>
              <p class="text-xs text-gray-400 mt-0.5">
                {{ new Date(entry.createdAt).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }}
              </p>
              <!-- Inputs summary -->
              <div class="flex flex-wrap gap-1.5 mt-2">
                <span
                  v-for="(value, key) in entry.inputs"
                  :key="key"
                  class="badge bg-gray-100 text-gray-600"
                >
                  {{ value }}
                </span>
              </div>
              <!-- Output preview -->
              <p class="text-sm text-gray-500 mt-2 line-clamp-2">
                {{ entry.output.substring(0, 150) }}...
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2 ml-4">
            <NuxtLink
              :to="`/history/${entry.id}`"
              class="btn-secondary !py-1.5 !px-3 text-xs"
            >
              {{ $t('history.view') }}
            </NuxtLink>
            <button
              @click="deleteFromHistory(entry.id)"
              class="text-gray-300 hover:text-red-500 transition-colors p-1"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { locale } = useI18n();
const { history, deleteFromHistory } = useHistory();

const search = ref("");

const filteredHistory = computed(() => {
  if (!search.value) return history.value;
  const q = search.value.toLowerCase();
  return history.value.filter(
    (e) =>
      e.botName.toLowerCase().includes(q) ||
      e.output.toLowerCase().includes(q) ||
      Object.values(e.inputs).some((v) => v.toLowerCase().includes(q))
  );
});
</script>
