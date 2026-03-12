<template>
  <div class="px-5 py-6 lg:p-8 max-w-2xl mx-auto">
    <div class="mb-6">
      <h1 class="text-[22px] font-bold text-gray-900 mb-1">{{ $t('history.title') }}</h1>
      <p class="text-[13px] text-gray-400">{{ $t('history.subtitle') }}</p>
    </div>

    <div class="mb-5">
      <input v-model="search" :placeholder="$t('history.search')" class="input-field" />
    </div>

    <div v-if="filteredHistory.length === 0" class="text-center py-16">
      <div class="text-3xl mb-3">📋</div>
      <p class="text-[13px] text-gray-400">{{ $t('history.empty') }}</p>
    </div>

    <div v-else class="space-y-2.5">
      <NuxtLink
        v-for="entry in filteredHistory"
        :key="entry.id"
        :to="`/history/${entry.id}`"
        class="card p-4 block active:scale-[0.98] transition-all duration-150"
      >
        <div class="flex items-start gap-3">
          <div class="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center flex-shrink-0">
            <span class="text-lg">{{ entry.botIcon }}</span>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between">
              <h3 class="font-semibold text-[14px] text-gray-900">{{ entry.botName }}</h3>
              <button
                @click.prevent="deleteFromHistory(entry.id)"
                class="p-1.5 rounded-lg active:bg-red-50 text-gray-300"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
            <p class="text-[11px] text-gray-400 mt-0.5">
              {{ new Date(entry.createdAt).toLocaleDateString(locale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) }}
            </p>
            <p class="text-[13px] text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">
              {{ entry.output.substring(0, 120) }}...
            </p>
          </div>
        </div>
      </NuxtLink>
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
