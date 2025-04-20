package ps8.hexatron.app.plugins;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import ps8.hexatron.app.BuildConfig;

@CapacitorPlugin(name = "EnvPlugin")
public class EnvPlugin extends Plugin {
    @PluginMethod
    public void getApiUrl(PluginCall call) {
        String apiUrl = BuildConfig.API_URL;
        JSObject ret = new JSObject();
        ret.put("apiUrl", apiUrl);
        call.resolve(ret);
    }
}