/**
 * useLanguages Hook
 * 
 * Fetches supported programming languages from the API.
 * Falls back to static list if API is unavailable.
 */

import { useState, useEffect } from 'react';
import { executionAPI } from '../services/api';
import { LANGUAGES } from '../utils/constants';

export function useLanguages() {
    const [languages, setLanguages] = useState(LANGUAGES);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchLanguages() {
            setLoading(true);
            try {
                const response = await executionAPI.getLanguages();
                if (response.success && response.data?.languages?.length > 0) {
                    // Transform API response to match expected format
                    const formattedLanguages = response.data.languages.map(lang => ({
                        value: lang,
                        label: lang.charAt(0).toUpperCase() + lang.slice(1),
                    }));
                    setLanguages(formattedLanguages);
                }
                // If API fails, we keep the static list
            } catch (err) {
                setError(err.message);
                // Keep static list as fallback
            } finally {
                setLoading(false);
            }
        }

        fetchLanguages();
    }, []);

    return { languages, loading, error };
}

export default useLanguages;
