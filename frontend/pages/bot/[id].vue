<template>
  <div class="p-8 max-w-4xl mx-auto">
    <!-- Back button -->
    <NuxtLink to="/" class="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
      {{ $t('bot.back') }}
    </NuxtLink>

    <div v-if="bot">
      <!-- Bot header -->
      <div class="flex items-center gap-4 mb-8">
        <span class="text-4xl">{{ bot.icon }}</span>
        <div>
          <h1 class="text-2xl font-bold text-gray-900">
            {{ locale === 'fr' ? bot.name : bot.nameEn }}
          </h1>
          <p class="text-gray-500 text-sm mt-1">
            {{ locale === 'fr' ? bot.description : bot.descriptionEn }}
          </p>
        </div>
      </div>

      <!-- Input form -->
      <div class="card p-6 mb-6">
        <p class="text-sm text-gray-500 mb-5">{{ $t('bot.fillFields') }}</p>

        <form @submit.prevent="generate" class="space-y-4">
          <div v-for="variable in bot.variables" :key="variable.key">
            <label class="block text-sm font-medium text-gray-700 mb-1.5">
              {{ locale === 'fr' ? variable.label : variable.labelEn }}
            </label>
            <input
              v-model="formData[variable.key]"
              :placeholder="locale === 'fr' ? variable.placeholder : variable.placeholderEn"
              class="input-field"
              required
            />
          </div>

          <button
            type="submit"
            :disabled="isGenerating"
            class="btn-primary w-full flex items-center justify-center gap-2"
            :class="{ 'opacity-50 cursor-not-allowed': isGenerating }"
          >
            <svg v-if="isGenerating" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {{ isGenerating ? $t('bot.generating') : $t('bot.generate') }}
          </button>
        </form>
      </div>

      <!-- Result -->
      <div v-if="output || isGenerating" class="card p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-semibold text-gray-900">{{ $t('bot.result') }}</h2>
          <div v-if="output && !isGenerating" class="flex items-center gap-2">
            <button @click="copyResult" class="btn-secondary !py-1.5 !px-3 text-xs flex items-center gap-1.5">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              {{ copied ? $t('bot.copied') : $t('bot.copy') }}
            </button>
            <button @click="saveResult" class="btn-secondary !py-1.5 !px-3 text-xs flex items-center gap-1.5">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              {{ saved ? $t('bot.saved') : $t('bot.save') }}
            </button>
          </div>
        </div>

        <!-- Creative bot result (media) -->
        <div v-if="bot.category === 'creative' && mediaUrl" class="mb-4">
          <img v-if="bot.type === 'image' || bot.type === 'design'" :src="mediaUrl" class="rounded-lg max-w-full" />
          <video v-else-if="bot.type === 'video'" :src="mediaUrl" controls class="rounded-lg max-w-full" />
        </div>

        <!-- Text result with streaming -->
        <div class="bg-gray-50 rounded-lg p-5 min-h-[200px]">
          <StreamingText :content="output" :is-streaming="isGenerating" />
        </div>

        <!-- New generation -->
        <button
          v-if="!isGenerating && output"
          @click="reset"
          class="btn-secondary mt-4 text-sm"
        >
          {{ $t('bot.newGeneration') }}
        </button>
      </div>
    </div>

    <div v-else class="text-center py-20 text-gray-400">
      Bot not found.
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const { locale } = useI18n();
const { getBotById } = useBots();
const { saveToHistory } = useHistory();

const bot = getBotById(route.params.id as string);
const formData = ref<Record<string, string>>({});
const output = ref("");
const isGenerating = ref(false);
const copied = ref(false);
const saved = ref(false);
const mediaUrl = ref("");

// Initialize form data
if (bot) {
  for (const v of bot.variables) {
    formData.value[v.key] = "";
  }
}

async function generate() {
  if (!bot || isGenerating.value) return;

  output.value = "";
  isGenerating.value = true;
  mediaUrl.value = "";

  try {
    if (bot.category === "creative") {
      await generateCreative();
    } else {
      await generateText();
    }
  } catch (err: any) {
    output.value += `\n\nErreur: ${err.message || "Une erreur est survenue"}`;
  } finally {
    isGenerating.value = false;
  }
}

async function generateText() {
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      botId: bot!.id,
      inputs: formData.value,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) throw new Error("No reader");

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split("\n");

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6);
        if (data === "[DONE]") continue;
        try {
          const parsed = JSON.parse(data);
          if (parsed.text) {
            output.value += parsed.text;
          }
        } catch {
          // skip malformed lines
        }
      }
    }
  }
}

async function generateCreative() {
  const response = await $fetch<{ url?: string; message?: string }>("/api/creative", {
    method: "POST",
    body: {
      botId: bot!.id,
      provider: bot!.apiProvider,
      inputs: formData.value,
    },
  });

  if (response.url) {
    mediaUrl.value = response.url;
  }
  if (response.message) {
    output.value = response.message;
  }
}

function copyResult() {
  navigator.clipboard.writeText(output.value);
  copied.value = true;
  setTimeout(() => (copied.value = false), 2000);
}

function saveResult() {
  if (!bot) return;
  saveToHistory({
    botId: bot.id,
    botName: bot.name,
    botIcon: bot.icon,
    inputs: { ...formData.value },
    output: output.value,
  });
  saved.value = true;
  setTimeout(() => (saved.value = false), 2000);
}

function reset() {
  output.value = "";
  mediaUrl.value = "";
  copied.value = false;
  saved.value = false;
}
</script>
