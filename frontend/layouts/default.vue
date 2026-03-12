<template>
  <div class="min-h-screen flex">
    <!-- Sidebar -->
    <aside class="w-64 bg-white border-r border-gray-100 flex flex-col fixed h-full z-20">
      <!-- Logo -->
      <div class="p-6 border-b border-gray-100">
        <NuxtLink to="/" class="flex items-center gap-3">
          <div class="w-9 h-9 bg-black rounded-lg flex items-center justify-center">
            <span class="text-white font-bold text-sm">M</span>
          </div>
          <span class="font-semibold text-lg tracking-tight">Madara</span>
        </NuxtLink>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 p-4 space-y-1">
        <NuxtLink
          to="/"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
          :class="route.path === '/' ? 'bg-gray-100 text-black' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          {{ $t('nav.dashboard') }}
        </NuxtLink>

        <NuxtLink
          to="/history"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
          :class="route.path === '/history' ? 'bg-gray-100 text-black' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {{ $t('nav.history') }}
        </NuxtLink>
      </nav>

      <!-- Language switcher + User -->
      <div class="p-4 border-t border-gray-100 space-y-3">
        <!-- Language -->
        <div class="flex items-center gap-2 px-3">
          <button
            v-for="loc in locales"
            :key="loc.code"
            @click="setLocale(loc.code)"
            class="text-xs font-medium px-2.5 py-1 rounded-md transition-colors"
            :class="locale === loc.code ? 'bg-black text-white' : 'text-gray-400 hover:text-gray-600'"
          >
            {{ loc.code.toUpperCase() }}
          </button>
        </div>

        <!-- User -->
        <div v-if="isAuthenticated" class="flex items-center gap-3 px-3 py-2">
          <div class="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
            <span class="text-xs font-medium text-gray-600">{{ user?.name?.charAt(0)?.toUpperCase() }}</span>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium truncate">{{ user?.name }}</p>
          </div>
          <button @click="logout" class="text-gray-400 hover:text-gray-600">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
        <NuxtLink v-else to="/login" class="btn-primary block text-center text-sm">
          {{ $t('auth.login') }}
        </NuxtLink>
      </div>
    </aside>

    <!-- Main content -->
    <main class="flex-1 ml-64">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const { locale, locales, setLocale } = useI18n();
const { user, isAuthenticated, logout } = useAuth();
</script>
