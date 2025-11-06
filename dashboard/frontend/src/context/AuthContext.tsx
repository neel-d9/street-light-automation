import { createContext, useState, useContext, type ReactNode } from 'react';

interface AuthContextType {
  role: string | null;
  login: (role: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [role, setRole] = useState<string | null>(() => {
    return localStorage.getItem('userRole');
  });

  const login = (role: string) => {
    localStorage.setItem('userRole', role);
    setRole(role);
  };

  const logout = () => {
    localStorage.removeItem('userRole');
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ role, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
