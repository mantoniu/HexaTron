const {execSync} = require("child_process");
const fs = require("fs");
const os = require("os");

function getLocalExternalIPv4() {
    const interfaces = os.networkInterfaces();

    for (const name in interfaces) {
        for (const net of interfaces[name]) {
            if (
                net.family === "IPv4" &&
                !net.internal &&
                !net.address.startsWith("169.") &&
                net.address.match("^(\\d{1,3})\\.(\\d{1,3})\\.1\\.(\\d{1,3})$")
            ) {
                return net.address;
            }
        }
    }
    return null;
}

const env = process.argv[2];
const config = require("./capacitor.config.json");
const ip = process.argv[3] || getLocalExternalIPv4();
let addr;
switch (env) {
    case "prod":
        addr = "https://hexatron.ps8.pns.academy";
        config.server.androidScheme = "https";
        config.server.cleartext = false;
        break;
    default:
        addr = `http://${ip}:8000`;
        config.server.androidScheme = "http";
        config.server.cleartext = true;
}

fs.writeFileSync("./android/env.gradle", `ext { API_URL = "${addr}" }`);
fs.writeFileSync("./capacitor.config.json", JSON.stringify(config, null, 2));

console.log(`Configuration done for the environment ${env} ${env === "dev" ? "with IP " + ip : ""}`);
execSync("npx cap sync", {stdio: "inherit"});

