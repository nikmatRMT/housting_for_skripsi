package com.jasawarga.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Daftarkan plugin QuestPolling ke Capacitor Bridge
        registerPlugin(QuestPollingPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
