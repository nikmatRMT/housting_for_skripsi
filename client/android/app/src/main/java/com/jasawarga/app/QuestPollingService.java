package com.jasawarga.app;

import android.Manifest;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;
import android.util.Log;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.app.ServiceCompat;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.HashSet;
import java.util.Set;

public class QuestPollingService extends Service {

    private static final String TAG = "QuestPollingService";
    private static final String CHANNEL_ID_FOREGROUND = "jasa_warga_foreground";
    private static final String CHANNEL_ID_QUEST = "jasa_warga_quest";
    private static final int FOREGROUND_NOTIFICATION_ID = 1001;
    private static final long POLL_INTERVAL_MS = 10000; // 10 detik
    private static final long WAKELOCK_TIMEOUT_MS = 10 * 60 * 1000L;
    private static final String PREFS_NAME = "QuestPollingPrefs";
    private static final String PREF_KNOWN_IDS = "knownQuestIds";

    private java.util.concurrent.ScheduledExecutorService scheduler;
    private Set<String> knownQuestIds = new HashSet<>();
    private boolean isFirstPoll = true;
    private String apiBaseUrl = "";
    private String userId = "";
    private double latitude = -3.440;
    private double longitude = 114.836;
    private int radius = 2000;
    private int questNotificationCounter = 2000;
    private PowerManager.WakeLock wakeLock;

    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "onCreate() called");
        createNotificationChannels();

        try {
            Notification foregroundNotification = buildForegroundNotification("Menyiapkan pemantauan tugas...");
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                ServiceCompat.startForeground(this, FOREGROUND_NOTIFICATION_ID, foregroundNotification, ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION);
            } else {
                startForeground(FOREGROUND_NOTIFICATION_ID, foregroundNotification);
            }
            Log.d(TAG, "Foreground mode activated in onCreate()");
        } catch (Exception e) {
            Log.e(TAG, "Gagal mengaktifkan foreground di onCreate(): " + e.getMessage(), e);
            reportJavaErrorToBackend("Gagal mengaktifkan foreground di onCreate", e);
        }

        PowerManager powerManager = (PowerManager) getSystemService(POWER_SERVICE);
        if (powerManager != null) {
            wakeLock = powerManager.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "JasaWarga::PollingWakeLock");
            try {
                wakeLock.acquire(WAKELOCK_TIMEOUT_MS);
                Log.d(TAG, "WakeLock acquired with timeout: " + WAKELOCK_TIMEOUT_MS);
            } catch (Exception e) {
                Log.e(TAG, "Gagal acquire WakeLock: " + e.getMessage(), e);
                reportJavaErrorToBackend("Gagal acquire WakeLock", e);
            }
        }

        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        knownQuestIds = new HashSet<>(prefs.getStringSet(PREF_KNOWN_IDS, new HashSet<>()));
        isFirstPoll = knownQuestIds.isEmpty();
        Log.d(TAG, "Known quest IDs restored: " + knownQuestIds.size() + ", isFirstPoll=" + isFirstPoll);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        SharedPreferences prefs = getSharedPreferences(PREFS_NAME, MODE_PRIVATE);
        
        if (intent != null && intent.hasExtra("apiBaseUrl")) {
            apiBaseUrl = intent.getStringExtra("apiBaseUrl");
            userId = intent.getStringExtra("userId");
            latitude = intent.getDoubleExtra("latitude", -3.440);
            longitude = intent.getDoubleExtra("longitude", 114.836);
            radius = intent.getIntExtra("radius", 2000);
            
            if (apiBaseUrl == null) apiBaseUrl = "";
            if (userId == null) userId = "";
            
            // Simpan ke preferensi untuk berjaga-jaga jika service direstart oleh sistem
            SharedPreferences.Editor editor = prefs.edit();
            editor.putString("apiBaseUrl", apiBaseUrl);
            editor.putString("userId", userId);
            editor.putFloat("latitude", (float) latitude);
            editor.putFloat("longitude", (float) longitude);
            editor.putInt("radius", radius);
            editor.apply();
        } else {
            // Restore jika direstart
            apiBaseUrl = prefs.getString("apiBaseUrl", "");
            userId = prefs.getString("userId", "");
            latitude = prefs.getFloat("latitude", -3.440f);
            longitude = prefs.getFloat("longitude", 114.836f);
            radius = prefs.getInt("radius", 2000);
        }

        Log.d(TAG, "Service started. API: " + apiBaseUrl + ", User: " + userId + ", Lat: " + latitude + ", Lng: " + longitude + ", Radius: " + radius);

        // Perbarui foreground notification agar mencerminkan state aktif
        try {
            Notification foregroundNotification = buildForegroundNotification("Memantau tugas baru di sekitar Anda...");
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                ServiceCompat.startForeground(this, FOREGROUND_NOTIFICATION_ID, foregroundNotification, ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION);
            } else {
                startForeground(FOREGROUND_NOTIFICATION_ID, foregroundNotification);
            }
        } catch (Exception e) {
            Log.e(TAG, "Gagal refresh foreground notification: " + e.getMessage(), e);
            reportJavaErrorToBackend("Gagal refresh foreground notification", e);
        }

        // Mulai polling
        startPolling();

        return START_STICKY; // Restart otomatis jika di-kill sistem
    }

    private void createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager manager = getSystemService(NotificationManager.class);

            // Channel untuk foreground service (prioritas rendah, tidak bersuara)
            NotificationChannel foregroundChannel = new NotificationChannel(
                CHANNEL_ID_FOREGROUND,
                "Jasa Warga Service",
                NotificationManager.IMPORTANCE_LOW
            );
            foregroundChannel.setDescription("Memantau tugas baru di sekitar Anda");
            foregroundChannel.setShowBadge(false);
            manager.createNotificationChannel(foregroundChannel);

            // Channel untuk notifikasi tugas baru (prioritas tinggi, BERSUARA!)
            NotificationChannel questChannel = new NotificationChannel(
                CHANNEL_ID_QUEST,
                "Tugas Baru",
                NotificationManager.IMPORTANCE_HIGH
            );
            questChannel.setDescription("Notifikasi saat ada tugas baru di sekitar");
            questChannel.enableVibration(true);
            questChannel.setVibrationPattern(new long[]{0, 300, 200, 300});
            manager.createNotificationChannel(questChannel);
        }
    }

    private Notification buildForegroundNotification(String contentText) {
        Intent notificationIntent = new Intent(this, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            this, 0, notificationIntent, PendingIntent.FLAG_IMMUTABLE
        );

        return new NotificationCompat.Builder(this, CHANNEL_ID_FOREGROUND)
            .setContentTitle("Jasa Warga Aktif")
            .setContentText(contentText)
            .setSmallIcon(getApplicationInfo().icon)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setOnlyAlertOnce(true)
            .build();
    }

    private void startPolling() {
        stopPolling();

        scheduler = java.util.concurrent.Executors.newSingleThreadScheduledExecutor();
        scheduler.scheduleAtFixedRate(new Runnable() {
            @Override
            public void run() {
                try {
                    Log.d(TAG, "Polling tick (background thread)...");
                    pollForNewQuests();
                } catch (Exception e) {
                    Log.e(TAG, "Error in scheduled polling: " + e.getMessage(), e);
                    reportJavaErrorToBackend("Error in scheduled polling", e);
                }
            }
        }, 0, POLL_INTERVAL_MS, java.util.concurrent.TimeUnit.MILLISECONDS);
        Log.d(TAG, "ScheduledExecutorService started with interval: " + POLL_INTERVAL_MS + " ms");
    }

    private void stopPolling() {
        if (scheduler != null && !scheduler.isShutdown()) {
            scheduler.shutdown();
            scheduler = null;
            Log.d(TAG, "Polling scheduler stopped");
        }
    }

    private void pollForNewQuests() {
        if (apiBaseUrl.isEmpty()) {
            Log.w(TAG, "API URL kosong, skip polling.");
            return;
        }

        try {
            String urlStr = apiBaseUrl + "/api/quests/nearby?latitude=" + latitude + "&longitude=" + longitude + "&radius=" + radius;
            Log.d(TAG, "Polling: " + urlStr);

            URL url = new URL(urlStr);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setConnectTimeout(8000);
            conn.setReadTimeout(8000);

            int responseCode = conn.getResponseCode();
            if (responseCode == 200) {
                BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                StringBuilder response = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) {
                    response.append(line);
                }
                reader.close();

                JSONObject json = new JSONObject(response.toString());
                if (json.optBoolean("success", false)) {
                    JSONArray quests = json.getJSONArray("data");
                    Set<String> currentIds = new HashSet<>();

                    for (int i = 0; i < quests.length(); i++) {
                        JSONObject quest = quests.getJSONObject(i);
                        String questId = quest.getString("_id");
                        String status = quest.optString("status", "");
                        currentIds.add(questId);

                        // Cek pembuat quest
                        String makerId = "";
                        Object pembuat = quest.opt("pembuat_id");
                        if (pembuat instanceof JSONObject) {
                            makerId = ((JSONObject) pembuat).optString("_id", "");
                        } else if (pembuat instanceof String) {
                            makerId = (String) pembuat;
                        }

                        boolean isOpen = "OPEN".equals(status);
                        boolean isOwnQuest = userId.equals(makerId);
                        boolean isNewQuest = !knownQuestIds.contains(questId);
                        
                        // NOTIFIKASI: Hanya jika bukan tick pertama (isFirstPoll = false), bukan quest buatan sendiri, dan status OPEN
                        boolean shouldNotify = !isFirstPoll && isNewQuest && !isOwnQuest && isOpen;

                        Log.d(TAG, "Quest check -> id=" + questId
                                + ", status=" + status
                                + ", makerId=" + makerId
                                + ", isOwnQuest=" + isOwnQuest
                                + ", isNewQuest=" + isNewQuest
                                + ", isFirstPoll=" + isFirstPoll
                                + ", shouldNotify=" + shouldNotify);

                        if (shouldNotify) {
                            String deskripsi = quest.optString("deskripsi", "Tugas baru");
                            double upah = quest.optDouble("upah_jasa", 0);
                            String upahStr = String.format("Rp %,.0f", upah).replace(",", ".");

                            String body = deskripsi;
                            if (body.length() > 50) body = body.substring(0, 50) + "...";
                            body += " (Upah: " + upahStr + ")";

                            String title = "Ada Tugas Baru di Sekitar! 📍";

                            showQuestNotification(title, body);
                            Log.d(TAG, "NOTIFIKASI DIKIRIM untuk questId=" + questId);
                        }
                    }

                    knownQuestIds = currentIds;
                    isFirstPoll = false;
                    getSharedPreferences(PREFS_NAME, MODE_PRIVATE)
                        .edit()
                        .putStringSet(PREF_KNOWN_IDS, new HashSet<>(knownQuestIds))
                        .apply();
                    Log.d(TAG, "Poll selesai. Jumlah quest: " + quests.length() + ", knownQuestIds saved: " + knownQuestIds.size());
                }
            } else {
                Log.w(TAG, "HTTP response code: " + responseCode);
            }

            conn.disconnect();
        } catch (Exception e) {
            Log.e(TAG, "Polling error: " + e.getMessage(), e);
            reportJavaErrorToBackend("Polling HTTP request error", e);
        }
    }

    private void showQuestNotification(String title, String body) {
        if (!NotificationManagerCompat.from(this).areNotificationsEnabled()) {
            Log.w(TAG, "Notifications disabled at system level. Skip notify.");
            return;
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
                checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            Log.w(TAG, "POST_NOTIFICATIONS permission not granted. Skip notify.");
            return;
        }

        Intent intent = new Intent(this, MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            this, questNotificationCounter, intent, PendingIntent.FLAG_IMMUTABLE
        );

        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID_QUEST)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(new NotificationCompat.BigTextStyle().bigText(body))
            .setSmallIcon(getApplicationInfo().icon)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_MESSAGE)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .setDefaults(NotificationCompat.DEFAULT_ALL)
            .setVibrate(new long[]{0, 300, 200, 300})
            .build();

        NotificationManager manager = getSystemService(NotificationManager.class);
        if (manager != null) {
            int notificationId = questNotificationCounter++;
            manager.notify(notificationId, notification);
            Log.d(TAG, "manager.notify() success. notificationId=" + notificationId + ", title=" + title);
        } else {
            Log.e(TAG, "NotificationManager null, notification gagal dikirim.");
            reportJavaErrorToBackend("NotificationManager null saat mengirim notifikasi tugas", null);
        }
    }

    public void updateLocation(double lat, double lng) {
        this.latitude = lat;
        this.longitude = lng;
    }

    private void reportJavaErrorToBackend(String message, Throwable throwable) {
        if (apiBaseUrl == null || apiBaseUrl.isEmpty()) return;
        
        new Thread(() -> {
            try {
                URL url = new URL(apiBaseUrl + "/api/logs/report");
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Content-Type", "application/json; utf-8");
                conn.setRequestProperty("Accept", "application/json");
                conn.setDoOutput(true);
                conn.setConnectTimeout(5000);
                conn.setReadTimeout(5000);

                String stackTrace = "";
                if (throwable != null) {
                    StringBuilder sb = new StringBuilder();
                    for (StackTraceElement element : throwable.getStackTrace()) {
                        sb.append(element.toString()).append("\n");
                    }
                    stackTrace = sb.toString();
                }

                JSONObject jsonParam = new JSONObject();
                jsonParam.put("level", "ERROR");
                jsonParam.put("message", "Java Background Service: " + message);
                jsonParam.put("stack", stackTrace);
                jsonParam.put("platform", "android_service");
                jsonParam.put("userId", userId);
                
                JSONObject deviceInfo = new JSONObject();
                deviceInfo.put("model", Build.MODEL);
                deviceInfo.put("brand", Build.BRAND);
                deviceInfo.put("androidVersion", Build.VERSION.RELEASE);
                deviceInfo.put("sdkVersion", Build.VERSION.SDK_INT);
                jsonParam.put("deviceInfo", deviceInfo);

                try (java.io.OutputStream os = conn.getOutputStream()) {
                    byte[] input = jsonParam.toString().getBytes("utf-8");
                    os.write(input, 0, input.length);
                }

                int code = conn.getResponseCode();
                Log.d(TAG, "Reported Java error to backend. Response code: " + code);
                conn.disconnect();
            } catch (Exception e) {
                Log.e(TAG, "Gagal mengirim remote error dari Java: " + e.getMessage());
            }
        }).start();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        Log.d(TAG, "onDestroy() called");
        stopPolling();
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
            Log.d(TAG, "WakeLock released");
        }
    }
}
