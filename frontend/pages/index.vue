<template>
  <div class="px-5 py-6 lg:p-8 max-w-3xl lg:max-w-6xl mx-auto">
    <!-- Header -->
    <div class="mb-7">
      <h1 class="text-[22px] font-bold text-gray-900 mb-1">{{ $t('dashboard.title') }}</h1>
      <p class="text-[13px] text-gray-400">{{ $t('dashboard.subtitle') }}</p>
    </div>

    <!-- Text Bots -->
    <section class="mb-8">
      <h2 class="section-label mb-3.5 px-1">{{ $t('dashboard.textBots') }}</h2>
      <div class="space-y-2.5 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-3 lg:space-y-0">
        <BotCard v-for="bot in textBots" :key="bot.id" :bot="bot" />
      </div>
    </section>

    <!-- Creative Bots -->
    <section>
      <h2 class="section-label mb-3.5 px-1">{{ $t('dashboard.creativeBots') }}</h2>
      <div class="space-y-2.5 lg:grid lg:grid-cols-2 xl:grid-cols-3 lg:gap-3 lg:space-y-0">
        <BotCard v-for="bot in creativeBots" :key="bot.id" :bot="bot" />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const { textBots, creativeBots } = useBots();
</script>
