"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { authStorage, User } from "../../lib/auth-storage";

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load auth data from localStorage on mount
    const savedUser = authStorage.getUser();
    const savedToken = authStorage.getToken();

    if (savedUser && savedToken) {
      setUser(savedUser);
      setToken(savedToken);
    }

    setIsLoading(false);
  }, []);

  const login = (newToken: string, newUser: User) => {
    const authData = { token: newToken, user: newUser };
    authStorage.set(authData);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    authStorage.clear();
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    login,
    logout,
    isAuthenticated: !!user && !!token,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
