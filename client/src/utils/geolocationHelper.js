import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';

/**
 * Mendapatkan lokasi saat ini (mendukung web browser biasa dan native HP lewat Capacitor).
 * Bypasses web security "Secure Context (HTTPS)" di WebView android saat local development/Wi-Fi debug.
 */
export const getCurrentLocation = async (successCallback, errorCallback, options = { enableHighAccuracy: true }) => {
    if (Capacitor.isNativePlatform()) {
        try {
            const perm = await Geolocation.checkPermissions();
            if (perm.location !== 'granted') {
                const req = await Geolocation.requestPermissions();
                if (req.location !== 'granted') {
                    errorCallback(new Error("User denied Geolocation (Native)"));
                    return;
                }
            }
            const pos = await Geolocation.getCurrentPosition(options);
            successCallback(pos);
        } catch (err) {
            errorCallback(err);
        }
    } else {
        if (!navigator.geolocation) {
            errorCallback(new Error("Browser tidak mendukung Geolocation"));
            return;
        }
        navigator.geolocation.getCurrentPosition(successCallback, errorCallback, options);
    }
};

/**
 * Memantau pergerakan lokasi secara real-time (watchPosition).
 */
export const watchLocation = async (successCallback, errorCallback, options = { enableHighAccuracy: true }) => {
    if (Capacitor.isNativePlatform()) {
        try {
            const perm = await Geolocation.checkPermissions();
            if (perm.location !== 'granted') {
                await Geolocation.requestPermissions();
            }
            const watchId = await Geolocation.watchPosition(options, (pos, err) => {
                if (err) {
                    errorCallback(err);
                } else if (pos) {
                    successCallback(pos);
                }
            });
            return watchId;
        } catch (err) {
            errorCallback(err);
            return null;
        }
    } else {
        if (!navigator.geolocation) {
            errorCallback(new Error("Browser tidak mendukung Geolocation"));
            return null;
        }
        return navigator.geolocation.watchPosition(successCallback, errorCallback, options);
    }
};

/**
 * Menghentikan pemantauan lokasi real-time.
 */
export const stopWatchLocation = async (watchId) => {
    if (!watchId) return;
    if (Capacitor.isNativePlatform()) {
        try {
            await Geolocation.clearWatch({ id: watchId });
        } catch (e) {
            console.error("Gagal menghentikan watch posisi native:", e);
        }
    } else {
        if (navigator.geolocation) {
            navigator.geolocation.clearWatch(watchId);
        }
    }
};
