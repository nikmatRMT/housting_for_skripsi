import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

// Helper to save key-value to both localStorage and Capacitor Preferences
export async function saveStorageItem(key, value) {
    localStorage.setItem(key, value);
    if (Capacitor.isNativePlatform()) {
        try {
            await Preferences.set({
                key: key,
                value: value,
            });
        } catch (e) {
            console.error("Gagal menyimpan ke Preferences:", e);
        }
    }
}

// Helper to remove key-value from both
export async function removeStorageItem(key) {
    localStorage.removeItem(key);
    if (Capacitor.isNativePlatform()) {
        try {
            await Preferences.remove({ key: key });
        } catch (e) {
            console.error("Gagal menghapus dari Preferences:", e);
        }
    }
}

// Sync preferences back to localStorage on app load
export async function syncStorageToLocalStorage() {
    if (!Capacitor.isNativePlatform()) return;
    
    try {
        const keys = ['token', 'myUserId', 'userRole', 'guestMode', 'rememberedEmail', 'bypassMobileBlock'];
        for (const key of keys) {
            const { value } = await Preferences.get({ key: key });
            if (value !== null) {
                localStorage.setItem(key, value);
            }
        }
        console.log("Sinkronisasi Preferences ke LocalStorage berhasil!");
    } catch (e) {
        console.error("Gagal sinkronisasi Preferences:", e);
    }
}
