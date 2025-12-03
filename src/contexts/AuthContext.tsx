import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { apiService, type LoginRequest } from "@/services/api";
import { getCookie } from "@/lib/cookies";

interface AuthContextType {
  user: any | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    const token = getCookie("token");
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const userData = await apiService.getCurrentUser();
      setUser(userData);
    } catch (error) {
      // If we have a token but can't fetch user, still consider authenticated
      // with a minimal user object (the token is valid)
      setUser({ authenticated: true });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (credentials: LoginRequest) => {
    const response = await apiService.login(credentials);
    // If login response includes user data, use it directly
    if (response.user) {
      setUser(response.user);
      setIsLoading(false);
    } else {
      // Otherwise, try to fetch user data
      // If that fails, still set a minimal user object since we have a token
      try {
        const userData = await apiService.getCurrentUser();
        setUser(userData);
      } catch (error) {
        // Token is valid, so user is authenticated even if we can't fetch details
        setUser({ authenticated: true });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const logout = async () => {
    await apiService.logout();
    setUser(null);
  };

  const refreshUser = async () => {
    await checkAuth();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
