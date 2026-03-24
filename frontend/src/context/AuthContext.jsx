import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);
const API = '';  // relative — routes through Vite proxy to localhost:5000

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fetch subscription + merge plan into user object
    const refreshPlan = useCallback(async (tok, currentUser) => {
        if (!tok || !currentUser) return;
        try {
            const res = await fetch(`${API}/api/subscription`, {
                headers: { Authorization: `Bearer ${tok}` },
            });
            if (res.ok) {
                const data = await res.json();
                const updated = { ...currentUser, plan: data.plan || 'free' };
                setUser(updated);
                localStorage.setItem('loanxai_user', JSON.stringify(updated));
            }
        } catch (_) { }
    }, []);

    // Restore from localStorage on mount
    useEffect(() => {
        const savedToken = localStorage.getItem('loanxai_token');
        const savedUser = localStorage.getItem('loanxai_user');
        if (savedToken && savedUser) {
            const parsedUser = JSON.parse(savedUser);
            setToken(savedToken);
            setUser(parsedUser);
            // Always refresh plan from server on mount
            refreshPlan(savedToken, parsedUser);
        }
        setLoading(false);
    }, [refreshPlan]);

    const login = (newToken, newUser) => {
        setToken(newToken);
        setUser(newUser);
        localStorage.setItem('loanxai_token', newToken);
        localStorage.setItem('loanxai_user', JSON.stringify(newUser));
        // Fetch plan after login
        refreshPlan(newToken, newUser);
    };

    const logout = async () => {
        try {
            if (token) {
                await fetch(`/api/auth/logout`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
        } catch (_) { }
        setToken(null);
        setUser(null);
        localStorage.removeItem('loanxai_token');
        localStorage.removeItem('loanxai_user');
    };

    const updateUserPlan = (plan) => {
        const updated = { ...user, plan };
        setUser(updated);
        localStorage.setItem('loanxai_user', JSON.stringify(updated));
    };

    return (
        <AuthContext.Provider value={{
            user, token, login, logout, loading,
            isAuthenticated: !!token,
            refreshPlan: () => refreshPlan(token, user),
            updateUserPlan
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
