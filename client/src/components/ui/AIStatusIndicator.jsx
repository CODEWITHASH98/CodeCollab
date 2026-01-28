/**
 * AIStatusIndicator Component
 * 
 * Shows AI service availability status in the header.
 * Green = all providers working
 * Yellow = some providers available
 * Red = AI unavailable
 */

import { Sparkles, AlertCircle, CheckCircle } from 'lucide-react';
import { Tooltip } from './Tooltip';

export function AIStatusIndicator({ available, providers, loading }) {
    if (loading) {
        return (
            <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" />
                <span className="hidden sm:inline">AI Loading...</span>
            </div>
        );
    }

    const activeProviders = Object.entries(providers || {})
        .filter(([, active]) => active)
        .map(([name]) => name);

    const providerCount = activeProviders.length;

    let colorClass = 'text-red-400';
    let bgClass = 'bg-red-400';
    let statusText = 'AI Offline';
    let Icon = AlertCircle;

    if (available && providerCount > 0) {
        colorClass = 'text-emerald-400';
        bgClass = 'bg-emerald-400';
        statusText = 'AI Ready';
        Icon = CheckCircle;
    } else if (providerCount > 0) {
        colorClass = 'text-yellow-400';
        bgClass = 'bg-yellow-400';
        statusText = 'AI Limited';
        Icon = Sparkles;
    }

    const tooltipContent = available
        ? `Active: ${activeProviders.join(', ') || 'Fallback'}`
        : 'AI features may be limited';

    return (
        <Tooltip content={tooltipContent}>
            <div className={`flex items-center gap-1.5 ${colorClass} text-xs cursor-help`}>
                <div className={`w-2 h-2 rounded-full ${bgClass}`} />
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{statusText}</span>
            </div>
        </Tooltip>
    );
}

export default AIStatusIndicator;
