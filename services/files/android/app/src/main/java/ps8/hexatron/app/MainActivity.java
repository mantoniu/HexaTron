package ps8.hexatron.app;

import android.os.Bundle;
import android.util.Log;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;

import ps8.hexatron.app.plugins.EnvPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(EnvPlugin.class);
        super.onCreate(savedInstanceState);
    }
}