import "../protobuf.min.js";
import "../license_protocol.js";
import { Utils } from '../jsplayready/utils.js';
import { AsyncLocalStorage, base64toUint8Array, stringToUint8Array, DeviceManager, RemoteCDMManager, PRDeviceManager, SettingsManager } from "../util.js";

const key_container = document.getElementById('key-container');

// ================ Main Settings & Toggles ================
const enabled = document.getElementById('enabled');
enabled.addEventListener('change', async () => await SettingsManager.setEnabled(enabled.checked));

const wvEnabled = document.getElementById('wvEnabled');
wvEnabled.addEventListener('change', async () => await SettingsManager.setWVEnabled(wvEnabled.checked));

const prEnabled = document.getElementById('prEnabled');
prEnabled.addEventListener('change', async () => await SettingsManager.setPREnabled(prEnabled.checked));

const wvd_select = document.getElementById('wvd_select');
wvd_select.addEventListener('change', async () => {
    if (wvd_select.checked) await SettingsManager.saveSelectedDeviceType("WVD");
});

const remote_select = document.getElementById('remote_select');
remote_select.addEventListener('change', async () => {
    if (remote_select.checked) await SettingsManager.saveSelectedDeviceType("REMOTE");
});

const export_button = document.getElementById('export');
export_button.addEventListener('click', async () => {
    const logs = await AsyncLocalStorage.getStorage(null);
    SettingsManager.downloadFile(stringToUint8Array(JSON.stringify(logs)), "logs.json");
});

// ================ Device Management Section Toggle ================
const manageDevicesBtn = document.getElementById('manage-devices-btn');
const deviceManagementSection = document.getElementById('device-management-section');
manageDevicesBtn.addEventListener('click', () => {
    const isHidden = deviceManagementSection.style.display === 'none';
    deviceManagementSection.style.display = isHidden ? 'block' : 'none';
    manageDevicesBtn.textContent = isHidden ? 'Hide Devices' : 'Manage Devices';
});

async function refreshAllDeviceLists() {
    wvd_combobox.innerHTML = '';
    remote_combobox.innerHTML = '';
    prd_combobox.innerHTML = '';
    
    await DeviceManager.loadSetAllWidevineDevices();
    await DeviceManager.selectWidevineDevice(await DeviceManager.getSelectedWidevineDevice());
    
    await RemoteCDMManager.loadSetAllRemoteCDMs();
    await RemoteCDMManager.selectRemoteCDM(await RemoteCDMManager.getSelectedRemoteCDM());

    await PRDeviceManager.loadSetAllPlayreadyDevices();
    await PRDeviceManager.selectPlayreadyDevice(await PRDeviceManager.getSelectedPlayreadyDevice());
}

// ================ Widevine Device (WVD) ================
const wvdFileInput = document.getElementById('wvdFileInput');
const wvdChooseBtn = document.getElementById('wvdChooseBtn');
wvdChooseBtn.addEventListener('click', () => wvdFileInput.click()); 

wvdFileInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (file) {
        await SettingsManager.importDevice(file);
        await refreshAllDeviceLists(); 
    }
    event.target.value = null; 
});

const remove = document.getElementById('remove');
remove.addEventListener('click', async () => {
    await DeviceManager.removeSelectedWidevineDevice();
    await refreshAllDeviceLists();
});

const download = document.getElementById('download');
download.addEventListener('click', async () => {
    const deviceName = await DeviceManager.getSelectedWidevineDevice();
    const deviceData = await DeviceManager.loadWidevineDevice(deviceName);
    SettingsManager.downloadFile(base64toUint8Array(deviceData), deviceName + ".wvd");
});

const wvd_combobox = document.getElementById('wvd-combobox');
wvd_combobox.addEventListener('change', async () => {
    await DeviceManager.saveSelectedWidevineDevice(wvd_combobox.options[wvd_combobox.selectedIndex].text);
});


// ================ Remote Widevine CDM ================
const remoteFileInput = document.getElementById('remoteFileInput');
const remoteChooseBtn = document.getElementById('remoteChooseBtn');
remoteChooseBtn.addEventListener('click', () => remoteFileInput.click());

remoteFileInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if(file) {
        await SettingsManager.loadRemoteCDMFromFile(file);
        await refreshAllDeviceLists();
    }
    event.target.value = null;
});

const remote_remove = document.getElementById('remoteRemove');
remote_remove.addEventListener('click', async () => {
    await RemoteCDMManager.removeSelectedRemoteCDM();
    await refreshAllDeviceLists();
});

const remote_download = document.getElementById('remoteDownload');
remote_download.addEventListener('click', async () => {
    const cdmName = await RemoteCDMManager.getSelectedRemoteCDM();
    const cdmData = await RemoteCDMManager.loadRemoteCDM(cdmName); // Returns a stringified JSON
    SettingsManager.downloadFile(stringToUint8Array(cdmData), cdmName + ".json");
});

const remote_combobox = document.getElementById('remote-combobox');
remote_combobox.addEventListener('change', async () => {
    await RemoteCDMManager.saveSelectedRemoteCDM(remote_combobox.options[remote_combobox.selectedIndex].text);
});


// ================ PlayReady Device (PRD) ================
const prdFileInput = document.getElementById('prdFileInput');
const prdChooseBtn = document.getElementById('prdChooseBtn');
prdChooseBtn.addEventListener('click', () => prdFileInput.click());

prdFileInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (file) {
        await SettingsManager.importPRDevice(file);
        await refreshAllDeviceLists();
    }
    event.target.value = null;
});

const prd_combobox = document.getElementById('prd-combobox');
prd_combobox.addEventListener('change', async () => {
    await PRDeviceManager.saveSelectedPlayreadyDevice(prd_combobox.options[prd_combobox.selectedIndex].text);
});

const prdRemove = document.getElementById('prdRemove');
prdRemove.addEventListener('click', async () => {
    await PRDeviceManager.removeSelectedPlayreadyDevice();
    await refreshAllDeviceLists();
});

const prdDownload = document.getElementById('prdDownload');
prdDownload.addEventListener('click', async () => {
    const deviceName = await PRDeviceManager.getSelectedPlayreadyDevice();
    const deviceData = await PRDeviceManager.loadPlayreadyDevice(deviceName);
    SettingsManager.downloadFile(base64toUint8Array(deviceData), deviceName + ".prd");
});
// ============================================

// ================ Command Options ================
const use_shaka = document.getElementById('use-shaka');
use_shaka.addEventListener('change', async () => await SettingsManager.saveUseShakaPackager(use_shaka.checked));

const downloader_name = document.getElementById('downloader-name');
downloader_name.addEventListener('input', async (event) => await SettingsManager.saveExecutableName(downloader_name.value));
// =================================================

// ================ Keys ================
const clear = document.getElementById('clear');
clear.addEventListener('click', async () => {
    chrome.runtime.sendMessage({ type: "CLEAR" });
    key_container.innerHTML = "";
});

async function createCommand(json, key_string) {
    const metadata = JSON.parse(json);
    const header_string = Object.entries(metadata.headers).map(([key, value]) => `-H "${key}: ${value.replace(/"/g, "'")}"`).join(' ');
    return `${await SettingsManager.getExecutableName()} "${metadata.url}" ${header_string} ${key_string} ${await SettingsManager.getUseShakaPackager() ? "--use-shaka-packager " : ""}-M format=mkv`;
}

async function appendLog(result) {
    console.log("[Panel.js] appendLog called with:", result);
    const key_string = result.keys.map(key => `--key ${key.kid}:${key.k}`).join(' ');
    const date = new Date(result.timestamp * 1000);
    const date_string = date.toLocaleString();

    const logContainer = document.createElement('div');
    logContainer.classList.add('log-container');
    logContainer.innerHTML = `
        <button class="toggleButton">+</button>
        <div class="expandableDiv collapsed">
            <label class="always-visible right-bound">
                URL:<input type="text" class="text-box" value="${result.url}">
            </label>
            <label class="expanded-only right-bound">
                Type:<input type="text" class="text-box" value="${result.type}">
            </label>
            <label class="expanded-only right-bound">
            <label class="expanded-only right-bound">
                ${result.type === "PLAYREADY" ? "WRM" : "PSSH"}:<input type="text" class="text-box" value='${result.pssh_data || result.wrm_header}'>
            </label>
            <label class="expanded-only right-bound key-copy">
                <a href="#" title="Click to copy">Keys:</a><input type="text" class="text-box" value="${key_string}">
            </label>
            <label class="expanded-only right-bound">
                Date:<input type="text" class="text-box" value="${date_string}">
            </label>
            ${result.manifests.length > 0 ? `<label class="expanded-only right-bound manifest-copy">
                <a href="#" title="Click to copy">Manifest:</a><select id="manifest" class="text-box"></select>
            </label>
            <label class="expanded-only right-bound command-copy">
                <a href="#" title="Click to copy">Cmd:</a><input type="text" id="command" class="text-box">
            </label>` : ''}
        </div>`;

    const keysInput = logContainer.querySelector('.key-copy');
    keysInput.addEventListener('click', () => {
        navigator.clipboard.writeText(key_string);
    });

    if (result.manifests.length > 0) {
        const command = logContainer.querySelector('#command');

        const select = logContainer.querySelector("#manifest");
        select.addEventListener('change', async () => {
            command.value = await createCommand(select.value, key_string);
        });
        result.manifests.forEach((manifest) => {
            const option = new Option(`[${manifest.type}] ${manifest.url}`, JSON.stringify(manifest));
            select.add(option);
        });
        command.value = await createCommand(select.value, key_string);

        const manifest_copy = logContainer.querySelector('.manifest-copy');
        manifest_copy.addEventListener('click', () => {
            navigator.clipboard.writeText(JSON.parse(select.value).url);
        });

        const command_copy = logContainer.querySelector('.command-copy');
        command_copy.addEventListener('click', () => {
            navigator.clipboard.writeText(command.value);
        });
    }

    const toggleButtons = logContainer.querySelector('.toggleButton');
    toggleButtons.addEventListener('click', function () {
        const expandableDiv = this.nextElementSibling;
        if (expandableDiv.classList.contains('collapsed')) {
            toggleButtons.innerHTML = "-";
            expandableDiv.classList.remove('collapsed');
            expandableDiv.classList.add('expanded');
        } else {
            toggleButtons.innerHTML = "+";
            expandableDiv.classList.remove('expanded');
            expandableDiv.classList.add('collapsed');
        }
    });

    key_container.appendChild(logContainer);
}

chrome.storage.onChanged.addListener(async (changes, areaName) => {
    if (areaName === 'local') {
        for (const [key, values] of Object.entries(changes)) {
            await appendLog(values.newValue);
        }
    }
});

function checkLogs() {
    chrome.runtime.sendMessage({ type: "GET_LOGS" }, (response) => {
        if (response) {
            response.forEach(async (result) => {
                await appendLog(result);
            });
        }
    });
}

// ================ Page Initialization ================
document.addEventListener('DOMContentLoaded', async () => {
    enabled.checked = await SettingsManager.getEnabled();
    wvEnabled.checked = await SettingsManager.getWVEnabled(true);
    prEnabled.checked = await SettingsManager.getPREnabled(true);
    use_shaka.checked = await SettingsManager.getUseShakaPackager();
    downloader_name.value = await SettingsManager.getExecutableName();
    await SettingsManager.setSelectedDeviceType(await SettingsManager.getSelectedDeviceType());

    await refreshAllDeviceLists();

    checkLogs();
});
// ======================================
