import axios from 'axios';
import { Capacitor } from '@capacitor/core';

const API_URL = import.meta.env.VITE_API_URL || '';

export function initErrorReporter() {
    const reportError = async (level, message, stack) => {
        try {
            const userId = localStorage.getItem('myUserId') || '';
            const deviceInfo = {
                userAgent: navigator.userAgent,
                href: window.location.href,
                isNative: Capacitor.isNativePlatform()
            };

            await axios.post(`${API_URL}/api/logs/report`, {
                level: level,
                message: message,
                stack: stack || '',
                platform: Capacitor.isNativePlatform() ? 'android' : 'web',
                userId: userId,
                deviceInfo: deviceInfo
            });
        } catch (e) {
            // Abaikan agar tidak looping terus jika request log sendiri gagal
        }
    };

    // 1. Tangkap unhandled runtime error
    window.addEventListener('error', (event) => {
        const message = event.message || event.error?.message || 'Unknown runtime error';
        const stack = event.error?.stack || '';
        reportError('ERROR', message, stack);
    });

    // 2. Tangkap unhandled promise rejection
    window.addEventListener('unhandledrejection', (event) => {
        const message = event.reason?.message || event.reason || 'Unhandled promise rejection';
        const stack = event.reason?.stack || '';
        reportError('ERROR', `Promise Rejection: ${message}`, stack);
    });

    // 3. Monkeypatch console.error untuk pelaporan log otomatis
    const originalConsoleError = console.error;
    console.error = function (...args) {
        originalConsoleError.apply(console, args);

        const message = args.map(arg => {
            if (arg instanceof Error) return arg.message;
            if (typeof arg === 'object') {
                try {
                    return JSON.stringify(arg);
                } catch (e) {
                    return '[Object]';
                }
            }
            return String(arg);
        }).join(' ');

        // Abaikan logging request itu sendiri agar tidak infinite loop
        if (message.includes('/api/logs/report')) return;

        const stack = args.find(arg => arg instanceof Error)?.stack || new Error().stack || '';
        reportError('ERROR', `Console.error: ${message}`, stack);
    };

    console.log("Remote Error Reporter diaktifkan!");
}
