/**
 * useAIStatus Hook
 * 
 * Monitors AI service availability and provider status.
 * Updates periodically to reflect current state.
 */

import { useState, useEffect, useCallback } from 'react';
import { executionAPI } from '../services/api';

export function useAIStatus(refreshInterval = 60000) {
    const [status, setStatus] = useState({
        available: true, // Optimistic default
        providers: {},
        loading: true,
        error: null,
    });

    const fetchStatus = useCallback(async () => {
        try {
            const response = await executionAPI.getAIStatus();
            if (response.success) {
                setStatus({
                    available: response.data?.available ?? false,
                    providers: response.data?.providers ?? {},
                    loading: false,
                    error: null,
                });
            } else {
                setStatus(prev => ({
                    ...prev,
                    loading: false,
                    error: response.error,
                }));
            }
        } catch (err) {
            setStatus(prev => ({
                ...prev,
                loading: false,
                error: err.message,
            }));
        }
    }, []);

    useEffect(() => {
        fetchStatus();

        // Periodic refresh
        const interval = setInterval(fetchStatus, refreshInterval);
        return () => clearInterval(interval);
    }, [fetchStatus, refreshInterval]);

    return {
        ...status,
        refresh: fetchStatus,
    };
}

export default useAIStatus;
