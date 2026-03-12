<template>
  <div class="p-8 max-w-6xl mx-auto">
    <!-- Header -->
    <div class="mb-10">
      <h1 class="text-2xl font-bold text-gray-900 mb-2">{{ $t('dashboard.title') }}</h1>
      <p class="text-gray-500">{{ $t('dashboard.subtitle') }}</p>
    </div>

    <!-- Text Bots -->
    <section class="mb-12">
      <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-5">
        {{ $t('dashboard.textBots') }}
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <BotCard v-for="bot in textBots" :key="bot.id" :bot="bot" />
      </div>
    </section>

    <!-- Creative Bots -->
    <section>
      <h2 class="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-5">
        {{ $t('dashboard.creativeBots') }}
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <BotCard v-for="bot in creativeBots" :key="bot.id" :bot="bot" />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const { textBots, creativeBots } = useBots();
</script>
