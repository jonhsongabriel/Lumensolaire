import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Profile } from '@/types';
import { authApi } from '@/services/api';
import { toast } from 'sonner';

interface UserInfo {
  id: string;
  username: string;
  email: string | null;
  role: string;
}

interface AuthContextType {
  user: UserInfo | null;
  profile: Profile | null;
  loading: boolean;
  signInWithUsername: (username: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithUsername: (username: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    if (!user) {
      setProfile(null);
      return;
    }
    try {
      const profileData = await authApi.getMe();
      setProfile(profileData);
    } catch (error) {
      console.error('Erreur récupération profil:', error);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('lumen_token');
    if (token) {
      authApi.getMe()
        .then((data: Record<string, unknown>) => {
          setUser({
            id: data.id as string,
            username: data.username as string,
            email: data.email as string | null,
            role: data.role as string,
          });
          setProfile(data as unknown as Profile);
        })
        .catch(() => {
          localStorage.removeItem('lumen_token');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const signInWithUsername = async (username: string, password: string) => {
    try {
      const response = await authApi.login(username, password);
      if (response.token) {
        localStorage.setItem('lumen_token', response.token);
        setUser({
          id: response.user.id,
          username: response.user.username,
          email: response.user.email,
          role: response.user.role,
        });
        setProfile(response.user);
      }
      return { error: null };
    } catch (error: unknown) {
      return { error: error instanceof Error ? error : new Error(String(error)) };
    }
  };

  const signUpWithUsername = async (username: string, password: string) => {
    try {
      const response = await authApi.register(username, password);
      if (response.token) {
        localStorage.setItem('lumen_token', response.token);
        setUser({
          id: response.user.id,
          username: response.user.username,
          email: response.user.email,
          role: response.user.role,
        });
        setProfile(response.user);
      }
      return { error: null };
    } catch (error: unknown) {
      return { error: error instanceof Error ? error : new Error(String(error)) };
    }
  };

  const signOut = () => {
    localStorage.removeItem('lumen_token');
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signInWithUsername, signUpWithUsername, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
