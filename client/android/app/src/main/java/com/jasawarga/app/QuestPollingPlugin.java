package com.jasawarga.app;

import android.content.Intent;
import android.os.Build;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "QuestPolling")
public class QuestPollingPlugin extends Plugin {

    private static final String TAG = "QuestPollingPlugin";

    @PluginMethod()
    public void startService(PluginCall call) {
        String apiBaseUrl = call.getString("apiBaseUrl", "");
        String userId = call.getString("userId", "");
        double latitude = call.getDouble("latitude", -3.440);
        double longitude = call.getDouble("longitude", 114.836);
        int radius = call.getInt("radius", 2000);

        Log.d(TAG, "Starting QuestPollingService...");

        Intent serviceIntent = new Intent(getContext(), QuestPollingService.class);
        serviceIntent.putExtra("apiBaseUrl", apiBaseUrl);
        serviceIntent.putExtra("userId", userId);
        serviceIntent.putExtra("latitude", latitude);
        serviceIntent.putExtra("longitude", longitude);
        serviceIntent.putExtra("radius", radius);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            getContext().startForegroundService(serviceIntent);
        } else {
            getContext().startService(serviceIntent);
        }

        JSObject ret = new JSObject();
        ret.put("started", true);
        call.resolve(ret);
    }

    @PluginMethod()
    public void stopService(PluginCall call) {
        Log.d(TAG, "Stopping QuestPollingService...");
        Intent serviceIntent = new Intent(getContext(), QuestPollingService.class);
        getContext().stopService(serviceIntent);

        JSObject ret = new JSObject();
        ret.put("stopped", true);
        call.resolve(ret);
    }

    @PluginMethod()
    public void updateLocation(PluginCall call) {
        double latitude = call.getDouble("latitude", -3.440);
        double longitude = call.getDouble("longitude", 114.836);
        int radius = call.getInt("radius", 2000);

        // Restart service dengan lokasi baru
        String apiBaseUrl = call.getString("apiBaseUrl", "");
        String userId = call.getString("userId", "");

        Intent serviceIntent = new Intent(getContext(), QuestPollingService.class);
        serviceIntent.putExtra("apiBaseUrl", apiBaseUrl);
        serviceIntent.putExtra("userId", userId);
        serviceIntent.putExtra("latitude", latitude);
        serviceIntent.putExtra("longitude", longitude);
        serviceIntent.putExtra("radius", radius);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            getContext().startForegroundService(serviceIntent);
        } else {
            getContext().startService(serviceIntent);
        }

        JSObject ret = new JSObject();
        ret.put("updated", true);
        call.resolve(ret);
    }
}
