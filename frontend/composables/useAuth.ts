interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

const user = ref<User | null>(null);
const isAuthenticated = computed(() => !!user.value);
const token = ref<string | null>(null);

export function useAuth() {
  function setUser(userData: User, authToken: string) {
    user.value = userData;
    token.value = authToken;
    if (import.meta.client) {
      localStorage.setItem("auth_token", authToken);
      localStorage.setItem("auth_user", JSON.stringify(userData));
    }
  }

  function loadFromStorage() {
    if (import.meta.client) {
      const savedToken = localStorage.getItem("auth_token");
      const savedUser = localStorage.getItem("auth_user");
      if (savedToken && savedUser) {
        token.value = savedToken;
        user.value = JSON.parse(savedUser);
      }
    }
  }

  async function login(email: string, password: string) {
    const res = await $fetch<{ user: User; token: string }>("/api/auth/login", {
      method: "POST",
      body: { email, password },
    });
    setUser(res.user, res.token);
    return res;
  }

  async function register(name: string, email: string, password: string) {
    const res = await $fetch<{ user: User; token: string }>("/api/auth/register", {
      method: "POST",
      body: { name, email, password },
    });
    setUser(res.user, res.token);
    return res;
  }

  function loginWithOAuth(provider: "google" | "github") {
    if (import.meta.client) {
      window.location.href = `/api/auth/${provider}`;
    }
  }

  function logout() {
    user.value = null;
    token.value = null;
    if (import.meta.client) {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_user");
    }
    navigateTo("/login");
  }

  return {
    user,
    token,
    isAuthenticated,
    login,
    register,
    loginWithOAuth,
    logout,
    loadFromStorage,
    setUser,
  };
}
