import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Initialize from localStorage on mount
    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
            try {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error('Failed to parse stored user:', e);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        }
        setLoading(false);
    }, []);

    // Verify token validity on mount
    useEffect(() => {
        if (token && !user?.isGuest) {
            authAPI.me()
                .then(response => {
                    if (response.success) {
                        setUser(prev => ({ ...prev, ...response.data.user }));
                    }
                })
                .catch(() => {
                    // Token invalid, clear auth
                    logout();
                });
        }
    }, [token]);

    const login = useCallback(async (email, password) => {
        setLoading(true);
        setError(null);
        try {
            const response = await authAPI.login(email, password);
            if (response.success) {
                const { token: newToken, user: newUser } = response.data;
                setAuth(newToken, newUser);
                return { success: true };
            } else {
                setError(response.error || 'Login failed');
                return { success: false, error: response.error };
            }
        } catch (e) {
            setError(e.message || 'Login failed');
            return { success: false, error: e.message };
        } finally {
            setLoading(false);
        }
    }, [setAuth]);

    const register = useCallback(async (userName, email, password) => {
        setLoading(true);
        setError(null);
        try {
            const response = await authAPI.register(userName, email, password);
            if (response.success) {
                const { token: newToken, user: newUser } = response.data;
                setAuth(newToken, newUser);
                return { success: true };
            } else {
                setError(response.error || 'Registration failed');
                return { success: false, error: response.error };
            }
        } catch (e) {
            setError(e.message || 'Registration failed');
            return { success: false, error: e.message };
        } finally {
            setLoading(false);
        }
    }, [setAuth]);

    const guestLogin = useCallback(async (userName) => {
        setLoading(true);
        setError(null);
        try {
            const response = await authAPI.guestLogin(userName);
            if (response.success) {
                const { token: newToken, user: newUser } = response.data;
                setAuth(newToken, newUser);
                return { success: true };
            } else {
                setError(response.message || 'Guest login failed');
                return { success: false, error: response.message };
            }
        } catch (e) {
            setError(e.message || 'Guest login failed');
            return { success: false, error: e.message };
        } finally {
            setLoading(false);
        }
    }, [setAuth]);

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
        setError(null);
    }, []);

    const isAuthenticated = !!token && !!user;

    const setAuth = useCallback((newToken, newUser) => {
        setToken(newToken);
        setUser(newUser);
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(newUser));
    }, []);

    // ... existing exports ...

    const value = {
        user,
        token,
        loading,
        error,
        isAuthenticated,
        login,
        register,
        guestLogin,
        logout,
        setAuth, // New method exposed
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export default AuthContext;
