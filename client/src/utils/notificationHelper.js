import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

let foregroundServiceStarted = false;

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

export async function startBackgroundService() {
    if (!Capacitor.isNativePlatform() || foregroundServiceStarted) return;
    
    try {
        const { ForegroundService } = await import('@capawesome-team/capacitor-android-foreground-service');
        
        await ForegroundService.startForegroundService({
            id: 1001,
            title: 'Jasa Warga Aktif',
            body: 'Memantau tugas baru di sekitar Anda...',
            smallIcon: 'ic_stat_name',
        });
        
        foregroundServiceStarted = true;
        console.log("Foreground Service berhasil dimulai!");
    } catch (e) {
        console.error("Gagal memulai Foreground Service:", e);
    }
}

export async function stopBackgroundService() {
    if (!Capacitor.isNativePlatform() || !foregroundServiceStarted) return;
    
    try {
        const { ForegroundService } = await import('@capawesome-team/capacitor-android-foreground-service');
        await ForegroundService.stopForegroundService();
        foregroundServiceStarted = false;
        console.log("Foreground Service dihentikan.");
    } catch (e) {
        console.error("Gagal menghentikan Foreground Service:", e);
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
