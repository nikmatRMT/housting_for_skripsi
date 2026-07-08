package com.jasawarga.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.util.Log;

import androidx.core.app.NotificationCompat;

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

    private Handler handler;
    private Runnable pollRunnable;
    private Set<String> knownQuestIds = new HashSet<>();
    private boolean isFirstPoll = true;
    private String apiBaseUrl = "";
    private String userId = "";
    private double latitude = -3.440;
    private double longitude = 114.836;
    private int radius = 2000;
    private int questNotificationCounter = 2000;

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannels();
        handler = new Handler(Looper.getMainLooper());
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null) {
            apiBaseUrl = intent.getStringExtra("apiBaseUrl");
            userId = intent.getStringExtra("userId");
            latitude = intent.getDoubleExtra("latitude", -3.440);
            longitude = intent.getDoubleExtra("longitude", 114.836);
            radius = intent.getIntExtra("radius", 2000);
            
            if (apiBaseUrl == null) apiBaseUrl = "";
            if (userId == null) userId = "";
        }

        Log.d(TAG, "Service started. API: " + apiBaseUrl + ", User: " + userId + ", Lat: " + latitude + ", Lng: " + longitude);

        // Mulai sebagai Foreground Service
        Notification foregroundNotification = buildForegroundNotification();
        startForeground(FOREGROUND_NOTIFICATION_ID, foregroundNotification);

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

    private Notification buildForegroundNotification() {
        Intent notificationIntent = new Intent(this, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            this, 0, notificationIntent, PendingIntent.FLAG_IMMUTABLE
        );

        return new NotificationCompat.Builder(this, CHANNEL_ID_FOREGROUND)
            .setContentTitle("Jasa Warga Aktif")
            .setContentText("Memantau tugas baru di sekitar Anda...")
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .build();
    }

    private void startPolling() {
        if (pollRunnable != null) {
            handler.removeCallbacks(pollRunnable);
        }

        pollRunnable = new Runnable() {
            @Override
            public void run() {
                new Thread(() -> pollForNewQuests()).start();
                handler.postDelayed(this, POLL_INTERVAL_MS);
            }
        };

        handler.post(pollRunnable);
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

                        // Tampilkan notifikasi hanya untuk tugas baru yang bukan milik sendiri
                        if (!isFirstPoll && !knownQuestIds.contains(questId) 
                                && "OPEN".equals(status) && !userId.equals(makerId)) {
                            
                            String deskripsi = quest.optString("deskripsi", "Tugas baru");
                            double upah = quest.optDouble("upah_jasa", 0);
                            String upahStr = String.format("Rp %,.0f", upah).replace(",", ".");
                            
                            String body = deskripsi;
                            if (body.length() > 50) body = body.substring(0, 50) + "...";
                            body += " (Upah: " + upahStr + ")";

                            showQuestNotification("Ada Tugas Baru di Sekitar! 📍", body);
                            Log.d(TAG, "NOTIFIKASI TERKIRIM: " + questId);
                        }
                    }

                    knownQuestIds = currentIds;
                    isFirstPoll = false;
                    Log.d(TAG, "Poll selesai. Jumlah quest: " + quests.length());
                }
            } else {
                Log.w(TAG, "HTTP response code: " + responseCode);
            }

            conn.disconnect();
        } catch (Exception e) {
            Log.e(TAG, "Polling error: " + e.getMessage());
        }
    }

    private void showQuestNotification(String title, String body) {
        Intent intent = new Intent(this, MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            this, questNotificationCounter, intent, PendingIntent.FLAG_IMMUTABLE
        );

        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID_QUEST)
            .setContentTitle(title)
            .setContentText(body)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .setDefaults(NotificationCompat.DEFAULT_ALL) // Suara + Getar + LED
            .setVibrate(new long[]{0, 300, 200, 300})
            .build();

        NotificationManager manager = getSystemService(NotificationManager.class);
        manager.notify(questNotificationCounter++, notification);
    }

    public void updateLocation(double lat, double lng) {
        this.latitude = lat;
        this.longitude = lng;
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if (handler != null && pollRunnable != null) {
            handler.removeCallbacks(pollRunnable);
        }
        Log.d(TAG, "Service destroyed.");
    }
}
