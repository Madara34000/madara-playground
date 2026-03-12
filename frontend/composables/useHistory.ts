export interface HistoryEntry {
  id: string;
  botId: string;
  botName: string;
  botIcon: string;
  inputs: Record<string, string>;
  output: string;
  createdAt: string;
}

const history = ref<HistoryEntry[]>([]);

export function useHistory() {
  function loadHistory() {
    if (import.meta.client) {
      const saved = localStorage.getItem("madara_history");
      if (saved) {
        history.value = JSON.parse(saved);
      }
    }
  }

  function saveToHistory(entry: Omit<HistoryEntry, "id" | "createdAt">) {
    const newEntry: HistoryEntry = {
      ...entry,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    history.value.unshift(newEntry);
    persistHistory();
    return newEntry;
  }

  function deleteFromHistory(id: string) {
    history.value = history.value.filter((e) => e.id !== id);
    persistHistory();
  }

  function clearHistory() {
    history.value = [];
    persistHistory();
  }

  function getEntry(id: string) {
    return history.value.find((e) => e.id === id);
  }

  function persistHistory() {
    if (import.meta.client) {
      localStorage.setItem("madara_history", JSON.stringify(history.value));
    }
  }

  return {
    history,
    loadHistory,
    saveToHistory,
    deleteFromHistory,
    clearHistory,
    getEntry,
  };
}
