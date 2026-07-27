"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "./types";
import { api } from "./api";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  error: string | null;
  setError: (err: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCurrentUser = async () => {
    try {
      setLoading(true);
      const currentUser = await api.auth.me();
      setUser(currentUser);
    } catch (err: any) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    setError(null);
    try {
      const loggedUser = await api.auth.login(email, password);
      setUser(loggedUser);
      return loggedUser;
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
      throw err;
    }
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch (err) {
      console.error("Logout request failed:", err);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, error, setError }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
