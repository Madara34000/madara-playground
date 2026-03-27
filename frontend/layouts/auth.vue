<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <!-- Logo -->
      <div class="text-center mb-8">
        <NuxtLink to="/" class="inline-flex items-center gap-3">
          <div class="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
            <span class="text-white font-bold">M</span>
          </div>
          <span class="font-semibold text-xl tracking-tight">Madara</span>
        </NuxtLink>
      </div>

      <slot />
    </div>
  </div>
</template>
