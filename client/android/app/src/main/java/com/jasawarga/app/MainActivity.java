package com.jasawarga.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Daftarkan plugin QuestPolling ke Capacitor Bridge setelah super.onCreate
        registerPlugin(QuestPollingPlugin.class);
    }
}
