<template>
  <div class="px-5 py-4 lg:p-8 max-w-2xl mx-auto">
    <!-- Back -->
    <NuxtLink to="/" class="inline-flex items-center gap-1.5 text-[13px] text-gray-400 active:text-gray-600 mb-5">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
      {{ $t('bot.back') }}
    </NuxtLink>

    <div v-if="bot">
      <!-- Bot header -->
      <div class="flex items-center gap-3 mb-6">
        <div class="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center">
          <span class="text-2xl">{{ bot.icon }}</span>
        </div>
        <div class="flex-1 min-w-0">
          <h1 class="text-lg font-bold text-gray-900 leading-tight">
            {{ locale === 'fr' ? bot.name : bot.nameEn }}
          </h1>
          <p class="text-[13px] text-gray-400 mt-0.5 truncate">
            {{ locale === 'fr' ? bot.description : bot.descriptionEn }}
          </p>
        </div>
      </div>

      <!-- Form -->
      <div class="card p-5 mb-4">
        <form @submit.prevent="generate" class="space-y-4">
          <div v-for="variable in bot.variables" :key="variable.key">
            <label class="block text-[13px] font-medium text-gray-600 mb-1.5">
              {{ locale === 'fr' ? variable.label : variable.labelEn }}
            </label>
            <input
              v-model="formData[variable.key]"
              :placeholder="locale === 'fr' ? variable.placeholder : variable.placeholderEn"
              class="input-field"
              required
            />
          </div>

          <!-- Image upload for creative bots -->
          <div v-if="bot.category === 'creative'">
            <label class="block text-[13px] font-medium text-gray-600 mb-1.5">
              {{ locale === 'fr' ? 'Importer une image (optionnel)' : 'Upload an image (optional)' }}
            </label>
            <label class="flex items-center justify-center gap-2 w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-[13px] text-gray-400 active:border-gray-300 active:bg-gray-50 transition-colors cursor-pointer">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {{ uploadedImage ? uploadedImage.name : (locale === 'fr' ? 'Choisir une image' : 'Choose an image') }}
              <input type="file" accept="image/*" class="hidden" @change="handleImageUpload" />
            </label>
          </div>

          <button
            type="submit"
            :disabled="isGenerating"
            class="btn-primary w-full flex items-center justify-center gap-2"
            :class="{ 'opacity-50': isGenerating }"
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
      <div v-if="output || isGenerating" class="card overflow-hidden mb-4">
        <!-- Action bar -->
        <div class="flex items-center justify-between px-5 py-3 border-b border-gray-50">
          <span class="text-[13px] font-semibold text-gray-900">{{ $t('bot.result') }}</span>
          <div v-if="output && !isGenerating" class="flex items-center gap-1">
            <button @click="copyResult" class="p-2 rounded-xl active:bg-gray-100 transition-colors">
              <svg v-if="!copied" class="w-[18px] h-[18px] text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <svg v-else class="w-[18px] h-[18px] text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </button>
            <button @click="saveResult" class="p-2 rounded-xl active:bg-gray-100 transition-colors">
              <svg v-if="!saved" class="w-[18px] h-[18px] text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              <svg v-else class="w-[18px] h-[18px] text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Media result with download -->
        <div v-if="mediaUrl" class="p-4">
          <div class="relative">
            <img v-if="bot.type === 'image' || bot.type === 'design'" :src="mediaUrl" class="rounded-2xl w-full" />
            <video v-else-if="bot.type === 'video'" :src="mediaUrl" controls class="rounded-2xl w-full" />
            <!-- Download button overlay -->
            <button
              @click="downloadMedia"
              class="absolute top-3 right-3 p-2.5 bg-black/60 backdrop-blur-sm rounded-xl text-white active:bg-black/80 transition-colors"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Text result -->
        <div class="px-5 py-4 min-h-[120px]">
          <StreamingText :content="output" :is-streaming="isGenerating" />
        </div>

        <!-- Actions bottom -->
        <div v-if="!isGenerating && output" class="px-5 pb-5 space-y-2.5">
          <!-- Pipeline: Send to creative bots -->
          <div v-if="bot.category === 'text'" class="space-y-2">
            <p class="section-label px-1">{{ locale === 'fr' ? 'Envoyer vers' : 'Send to' }}</p>
            <div class="flex gap-2 overflow-x-auto pb-1">
              <button
                v-for="cBot in creativeBots"
                :key="cBot.id"
                @click="sendToCreativeBot(cBot)"
                :disabled="isSendingTo === cBot.id"
                class="flex items-center gap-2 px-4 py-2.5 bg-gray-50 rounded-2xl text-[13px] font-medium text-gray-700 whitespace-nowrap active:bg-gray-100 transition-colors flex-shrink-0"
                :class="{ 'opacity-50': isSendingTo === cBot.id }"
              >
                <svg v-if="isSendingTo === cBot.id" class="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span v-else>{{ cBot.icon }}</span>
                {{ locale === 'fr' ? cBot.name : cBot.nameEn }}
              </button>
            </div>
          </div>

          <button @click="reset" class="btn-secondary w-full text-[13px]">
            {{ $t('bot.newGeneration') }}
          </button>
        </div>
      </div>

      <!-- Pipeline generated media -->
      <div v-if="pipelineMedia.length > 0" class="space-y-3">
        <p class="section-label px-1">{{ locale === 'fr' ? 'Media generees' : 'Generated media' }}</p>
        <div
          v-for="(media, idx) in pipelineMedia"
          :key="idx"
          class="card overflow-hidden"
        >
          <div class="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="text-base">{{ media.icon }}</span>
              <span class="text-[13px] font-medium text-gray-700">{{ media.botName }}</span>
            </div>
            <button
              @click="downloadPipelineMedia(media)"
              class="p-2 rounded-xl active:bg-gray-100 transition-colors"
            >
              <svg class="w-[18px] h-[18px] text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
          </div>
          <div class="p-3">
            <img v-if="media.type === 'image'" :src="media.url" class="rounded-xl w-full" />
            <video v-else-if="media.type === 'video'" :src="media.url" controls class="rounded-xl w-full" />
            <p v-if="media.message && !media.url" class="text-[13px] text-gray-500 p-2">{{ media.message }}</p>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-20 text-gray-400 text-sm">
      Bot not found.
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Bot } from "~/composables/useBots";

const route = useRoute();
const { locale } = useI18n();
const { getBotById, creativeBots } = useBots();
const { saveToHistory } = useHistory();

const bot = getBotById(route.params.id as string);
const formData = ref<Record<string, string>>({});
const output = ref("");
const isGenerating = ref(false);
const copied = ref(false);
const saved = ref(false);
const mediaUrl = ref("");
const uploadedImage = ref<File | null>(null);
const isSendingTo = ref("");
const pipelineMedia = ref<Array<{ botName: string; icon: string; type: string; url: string; message: string }>>([]);

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
    body: JSON.stringify({ botId: bot!.id, inputs: formData.value }),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  if (!reader) throw new Error("No reader");

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    for (const line of chunk.split("\n")) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6);
        if (data === "[DONE]") continue;
        try {
          const parsed = JSON.parse(data);
          if (parsed.text) output.value += parsed.text;
        } catch {}
      }
    }
  }
}

async function generateCreative() {
  const response = await $fetch<{ url?: string; message?: string }>("/api/creative", {
    method: "POST",
    body: { botId: bot!.id, provider: bot!.apiProvider, inputs: formData.value },
  });
  if (response.url) mediaUrl.value = response.url;
  if (response.message) output.value = response.message;
}

async function sendToCreativeBot(creativeBot: Bot) {
  if (isSendingTo.value) return;
  isSendingTo.value = creativeBot.id;

  try {
    // Use the text output as the prompt for the creative bot
    const summary = output.value.substring(0, 500);
    const inputs: Record<string, string> = {
      prompt: summary,
    };
    // Fill other fields with defaults
    for (const v of creativeBot.variables) {
      if (v.key !== "prompt") {
        inputs[v.key] = v.placeholder.replace("Ex: ", "").replace("E.g.: ", "");
      }
    }

    const response = await $fetch<{ url?: string; message?: string }>("/api/creative", {
      method: "POST",
      body: { botId: creativeBot.id, provider: creativeBot.apiProvider, inputs },
    });

    pipelineMedia.value.push({
      botName: creativeBot.name,
      icon: creativeBot.icon,
      type: creativeBot.type,
      url: response.url || "",
      message: response.message || "",
    });
  } catch (err: any) {
    pipelineMedia.value.push({
      botName: creativeBot.name,
      icon: creativeBot.icon,
      type: creativeBot.type,
      url: "",
      message: `Erreur: ${err.message}`,
    });
  } finally {
    isSendingTo.value = "";
  }
}

function handleImageUpload(e: Event) {
  const target = e.target as HTMLInputElement;
  if (target.files?.[0]) {
    uploadedImage.value = target.files[0];
  }
}

function downloadMedia() {
  if (!mediaUrl.value) return;
  const a = document.createElement("a");
  a.href = mediaUrl.value;
  a.download = `madara-${bot?.id}-${Date.now()}.${mediaUrl.value.includes("video") ? "mp4" : "png"}`;
  a.click();
}

function downloadPipelineMedia(media: { url: string; type: string; botName: string }) {
  if (!media.url) return;
  const a = document.createElement("a");
  a.href = media.url;
  a.download = `madara-${media.botName}-${Date.now()}.${media.type === "video" ? "mp4" : "png"}`;
  a.click();
}

function copyResult() {
  navigator.clipboard.writeText(output.value);
  copied.value = true;
  setTimeout(() => (copied.value = false), 2000);
}

function saveResult() {
  if (!bot) return;
  saveToHistory({
    botId: bot.id, botName: bot.name, botIcon: bot.icon,
    inputs: { ...formData.value }, output: output.value,
  });
  saved.value = true;
  setTimeout(() => (saved.value = false), 2000);
}

function reset() {
  output.value = "";
  mediaUrl.value = "";
  copied.value = false;
  saved.value = false;
  pipelineMedia.value = [];
}
</script>
