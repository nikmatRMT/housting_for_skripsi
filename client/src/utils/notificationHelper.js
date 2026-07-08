import { Capacitor, registerPlugin } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

// Register plugin native QuestPolling
const QuestPolling = Capacitor.isNativePlatform()
    ? registerPlugin('QuestPolling')
    : null;

let nativeServiceStarted = false;

export async function requestNotificationPermission() {
    if (Capacitor.isNativePlatform()) {
        try {
            const perm = await LocalNotifications.checkPermissions();
            if (perm.display !== 'granted') {
                await LocalNotifications.requestPermissions();
            }
        } catch (e) {
            console.error("Gagal meminta izin notifikasi native:", e);
        }
    } else {
        if ('Notification' in window && Notification.permission === 'default') {
            await Notification.requestPermission();
        }
    }
}

/**
 * Memulai native Android Foreground Service untuk polling tugas baru.
 * Service ini berjalan di JAVA (bukan JavaScript), sehingga tetap aktif
 * meskipun aplikasi diminimalkan atau layar HP dikunci.
 */
export async function startNativePollingService(apiBaseUrl, userId, latitude, longitude, radius) {
    if (!Capacitor.isNativePlatform() || !QuestPolling || nativeServiceStarted) return;

    // Pastikan izin notifikasi sudah disetujui sebelum memulai service
    await requestNotificationPermission();

    try {
        await QuestPolling.startService({
            apiBaseUrl: apiBaseUrl || '',
            userId: userId || '',
            latitude: latitude || -3.440,
            longitude: longitude || 114.836,
            radius: radius || 2000
        });
        nativeServiceStarted = true;
        console.log("Native QuestPollingService berhasil dimulai!");
    } catch (e) {
        console.error("Gagal memulai native polling service:", e);
    }
}

export async function stopNativePollingService() {
    if (!Capacitor.isNativePlatform() || !QuestPolling || !nativeServiceStarted) return;

    try {
        await QuestPolling.stopService();
        nativeServiceStarted = false;
        console.log("Native QuestPollingService dihentikan.");
    } catch (e) {
        console.error("Gagal menghentikan native polling service:", e);
    }
}

export async function updateNativeServiceLocation(apiBaseUrl, userId, latitude, longitude, radius) {
    if (!Capacitor.isNativePlatform() || !QuestPolling) return;

    try {
        await QuestPolling.updateLocation({
            apiBaseUrl: apiBaseUrl || '',
            userId: userId || '',
            latitude: latitude || -3.440,
            longitude: longitude || 114.836,
            radius: radius || 2000
        });
    } catch (e) {
        console.error("Gagal memperbarui lokasi service:", e);
    }
}

export async function showNotification(title, body) {
    if (Capacitor.isNativePlatform()) {
        try {
            await LocalNotifications.schedule({
                notifications: [
                    {
                        title: title,
                        body: body,
                        id: Math.floor(Math.random() * 1000000),
                        schedule: { at: new Date(Date.now() + 50) },
                        sound: 'default',
                        actionTypeId: 'OPEN_APP'
                    }
                ]
            });
        } catch (e) {
            console.error("Gagal menampilkan notifikasi native:", e);
        }
    } else {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, {
                body: body,
                icon: '/logo.svg'
            });
        }
    }
}
