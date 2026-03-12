<template>
  <NuxtLink
    :to="`/bot/${bot.id}`"
    class="card p-4 active:scale-[0.98] transition-all duration-150 block"
  >
    <div class="flex items-start gap-3.5">
      <div class="w-11 h-11 rounded-2xl bg-gray-50 flex items-center justify-center flex-shrink-0">
        <span class="text-xl">{{ bot.icon }}</span>
      </div>

      <div class="flex-1 min-w-0">
        <div class="flex items-center justify-between mb-0.5">
          <h3 class="font-semibold text-[15px] text-gray-900 truncate pr-2">
            {{ locale === 'fr' ? bot.name : bot.nameEn }}
          </h3>
          <svg class="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </div>

        <p class="text-[13px] text-gray-500 leading-relaxed line-clamp-2">
          {{ locale === 'fr' ? bot.description : bot.descriptionEn }}
        </p>

        <div class="flex items-center gap-2 mt-2.5">
          <span :class="bot.badgeClass">
            {{ $t(`categories.${bot.type === 'social-media' ? 'content' : bot.type}`) }}
          </span>
          <span class="text-[11px] text-gray-300">
            {{ bot.apiProvider === 'anthropic' ? 'Claude' : bot.apiProvider === 'higgsfield' ? 'Higgsfield' : bot.apiProvider === 'google' ? 'Gemini' : bot.apiProvider }}
          </span>
        </div>
      </div>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { Bot } from "~/composables/useBots";

defineProps<{ bot: Bot }>();
const { locale } = useI18n();
</script>
