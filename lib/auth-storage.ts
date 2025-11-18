interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthData {
  token: string;
  user: User;
}

const AUTH_STORAGE_KEY = "aley_auth";

export const authStorage = {
  get: (): AuthData | null => {
    if (typeof window === "undefined") return null;

    try {
      const data = localStorage.getItem(AUTH_STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  set: (authData: AuthData): void => {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
    } catch (error) {
      console.error("Failed to store auth data:", error);
    }
  },

  clear: (): void => {
    if (typeof window === "undefined") return;

    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (error) {
      console.error("Failed to clear auth data:", error);
    }
  },

  getToken: (): string | null => {
    const authData = authStorage.get();
    return authData?.token || null;
  },

  getUser: (): User | null => {
    const authData = authStorage.get();
    return authData?.user || null;
  },

  isAuthenticated: (): boolean => {
    return !!authStorage.getToken();
  },
};

export type { User, AuthData };
