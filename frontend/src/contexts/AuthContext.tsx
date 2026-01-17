'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, User } from '@/lib/api';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    register: (data: {
        email: string;
        password: string;
        role: string;
        firstName?: string;
        lastName?: string;
        name?: string;
        specialty?: string;
        location?: string;
    }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check for existing auth on mount
        const storedUser = authApi.getUser();
        const token = authApi.getToken();

        if (storedUser && token) {
            setUser(storedUser);
        }
        setIsLoading(false);
    }, []);

    const login = async (email: string, password: string) => {
        const response = await authApi.login(email, password);
        setUser(response.user);
    };

    const logout = () => {
        authApi.logout();
        setUser(null);
    };

    const register = async (data: {
        email: string;
        password: string;
        role: string;
        firstName?: string;
        lastName?: string;
        name?: string;
        specialty?: string;
        location?: string;
    }) => {
        const response = await authApi.register(data);
        setUser(response.user);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isAuthenticated: !!user,
                login,
                logout,
                register,
            }}
        >
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

export default AuthContext;
