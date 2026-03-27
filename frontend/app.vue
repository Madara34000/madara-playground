<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
const { loadFromStorage } = useAuth();
const { loadHistory } = useHistory();

onMounted(() => {
  loadFromStorage();
  loadHistory();
});
</script>
