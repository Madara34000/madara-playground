<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Mobile top bar -->
    <header class="lg:hidden fixed top-0 left-0 right-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100">
      <div class="flex items-center justify-between px-5 h-14">
        <NuxtLink to="/" class="flex items-center gap-2.5">
          <div class="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
            <span class="text-white font-bold text-xs">M</span>
          </div>
          <span class="font-semibold text-base tracking-tight">Madara</span>
        </NuxtLink>

        <div class="flex items-center gap-3">
          <!-- Language toggle -->
          <button
            @click="setLocale(locale === 'fr' ? 'en' : 'fr')"
            class="text-xs font-semibold px-2 py-1 rounded-md bg-gray-100 text-gray-600"
          >
            {{ locale === 'fr' ? 'EN' : 'FR' }}
          </button>

          <!-- User avatar or login -->
          <NuxtLink v-if="!isAuthenticated" to="/login" class="text-xs font-medium text-white bg-black rounded-lg px-3 py-1.5">
            {{ $t('auth.login') }}
          </NuxtLink>
          <button v-else @click="logout" class="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <span class="text-xs font-semibold text-gray-600">{{ user?.name?.charAt(0)?.toUpperCase() }}</span>
          </button>
        </div>
      </div>
    </header>

    <!-- Desktop sidebar -->
    <aside class="hidden lg:flex w-60 bg-white border-r border-gray-100 flex-col fixed h-full z-20">
      <div class="p-5 border-b border-gray-100">
        <NuxtLink to="/" class="flex items-center gap-2.5">
          <div class="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
            <span class="text-white font-bold text-xs">M</span>
          </div>
          <span class="font-semibold text-base tracking-tight">Madara</span>
        </NuxtLink>
      </div>

      <nav class="flex-1 p-3 space-y-0.5">
        <NuxtLink
          to="/"
          class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          :class="route.path === '/' ? 'bg-gray-100 text-black' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'"
        >
          <svg class="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          {{ $t('nav.dashboard') }}
        </NuxtLink>

        <NuxtLink
          to="/history"
          class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          :class="route.path.startsWith('/history') ? 'bg-gray-100 text-black' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'"
        >
          <svg class="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {{ $t('nav.history') }}
        </NuxtLink>
      </nav>

      <div class="p-3 border-t border-gray-100 space-y-2">
        <div class="flex items-center gap-1.5 px-3">
          <button
            v-for="loc in locales"
            :key="loc.code"
            @click="setLocale(loc.code)"
            class="text-xs font-medium px-2 py-0.5 rounded-md transition-colors"
            :class="locale === loc.code ? 'bg-black text-white' : 'text-gray-400 hover:text-gray-600'"
          >
            {{ loc.code.toUpperCase() }}
          </button>
        </div>

        <div v-if="isAuthenticated" class="flex items-center gap-2.5 px-3 py-1.5">
          <div class="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center">
            <span class="text-xs font-medium text-gray-600">{{ user?.name?.charAt(0)?.toUpperCase() }}</span>
          </div>
          <p class="text-sm font-medium truncate flex-1">{{ user?.name }}</p>
          <button @click="logout" class="text-gray-400 hover:text-gray-600">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
        <NuxtLink v-else to="/login" class="btn-primary block text-center text-xs !py-2 mx-3">
          {{ $t('auth.login') }}
        </NuxtLink>
      </div>
    </aside>

    <!-- Mobile bottom nav -->
    <nav class="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/80 backdrop-blur-xl border-t border-gray-100">
      <div class="flex items-center justify-around h-16 px-6 pb-safe">
        <NuxtLink
          to="/"
          class="flex flex-col items-center gap-1 py-1"
          :class="route.path === '/' ? 'text-black' : 'text-gray-400'"
        >
          <svg class="w-6 h-6" fill="none" :stroke="route.path === '/' ? 'currentColor' : 'currentColor'" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" :stroke-width="route.path === '/' ? '2' : '1.5'" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          <span class="text-[10px] font-medium">{{ $t('nav.dashboard') }}</span>
        </NuxtLink>

        <NuxtLink
          to="/history"
          class="flex flex-col items-center gap-1 py-1"
          :class="route.path.startsWith('/history') ? 'text-black' : 'text-gray-400'"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" :stroke-width="route.path.startsWith('/history') ? '2' : '1.5'" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span class="text-[10px] font-medium">{{ $t('nav.history') }}</span>
        </NuxtLink>

        <NuxtLink
          v-if="isAuthenticated"
          to="/settings"
          class="flex flex-col items-center gap-1 py-1 text-gray-400"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span class="text-[10px] font-medium">{{ $t('nav.settings') }}</span>
        </NuxtLink>
      </div>
    </nav>

    <!-- Main content -->
    <main class="pt-14 pb-20 lg:pt-0 lg:pb-0 lg:ml-60">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const { locale, locales, setLocale } = useI18n();
const { user, isAuthenticated, logout } = useAuth();
</script>
