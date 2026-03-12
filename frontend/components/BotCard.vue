<template>
  <NuxtLink
    :to="`/bot/${bot.id}`"
    class="card p-6 group cursor-pointer block"
  >
    <div class="flex items-start justify-between mb-4">
      <span class="text-3xl">{{ bot.icon }}</span>
      <span :class="bot.badgeClass">
        {{ $t(`categories.${bot.type === 'social-media' ? 'content' : bot.type}`) }}
      </span>
    </div>

    <h3 class="font-semibold text-gray-900 mb-2 group-hover:text-black transition-colors">
      {{ locale === 'fr' ? bot.name : bot.nameEn }}
    </h3>

    <p class="text-sm text-gray-500 leading-relaxed mb-4">
      {{ locale === 'fr' ? bot.description : bot.descriptionEn }}
    </p>

    <div class="flex items-center justify-between">
      <div class="flex items-center gap-1.5">
        <span v-if="bot.apiProvider === 'anthropic'" class="text-xs text-gray-400">Claude AI</span>
        <span v-else-if="bot.apiProvider === 'higgsfield'" class="text-xs text-gray-400">Higgsfield</span>
        <span v-else-if="bot.apiProvider === 'banana'" class="text-xs text-gray-400">Banana AI</span>
      </div>

      <span class="text-sm font-medium text-gray-900 group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
        {{ $t('dashboard.run') }}
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </span>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { Bot } from "~/composables/useBots";

defineProps<{ bot: Bot }>();
const { locale } = useI18n();
</script>
