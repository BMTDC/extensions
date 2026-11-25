var DEFAULTS = {
    accentColor: "#1f4e79",
    topN: "10",
    targetValue: "100",
    minimumUnits: "1",
    showTarget: "true",
    showSecondary: "true"
};

async function initializeConfig() {
    try {
        await tableau.extensions.initializeDialogAsync();
        fillForm(Object.assign({}, DEFAULTS, tableau.extensions.settings.getAll()));
        document.getElementById("resetButton").addEventListener("click", function () { fillForm(DEFAULTS); });
        document.getElementById("cancelButton").addEventListener("click", function () { tableau.extensions.ui.closeDialog("cancel"); });
        document.getElementById("saveButton").addEventListener("click", saveSettings);
    } catch (error) {
        showError("Settings could not be initialized: " + safeError(error));
    }
}

function fillForm(values) {
    Object.keys(DEFAULTS).forEach(function (key) {
        var element = document.getElementById(key);
        if (element.type === "checkbox") element.checked = values[key] === "true";
        else element.value = values[key];
    });
    document.body.style.setProperty("--accent", values.accentColor);
}

async function saveSettings() {
    var topN = clamp(parseInt(document.getElementById("topN").value, 10), 3, 30);
    var target = Math.max(0, numberValue(document.getElementById("targetValue").value));
    var minimum = Math.max(0, numberValue(document.getElementById("minimumUnits").value));
    var accent = document.getElementById("accentColor").value;
    if (!/^#[0-9a-f]{6}$/i.test(accent)) { showError("Choose a valid accent colour."); return; }
    var values = {
        accentColor: accent,
        topN: String(topN),
        targetValue: String(target),
        minimumUnits: String(minimum),
        showTarget: String(document.getElementById("showTarget").checked),
        showSecondary: String(document.getElementById("showSecondary").checked)
    };
    try {
        Object.keys(values).forEach(function (key) { tableau.extensions.settings.set(key, values[key]); });
        await tableau.extensions.settings.saveAsync();
        tableau.extensions.ui.closeDialog("saved");
    } catch (error) { showError("Settings could not be saved: " + safeError(error)); }
}

function showError(message) { var box = document.getElementById("errorBox"); box.textContent = message; box.classList.remove("hidden"); }
function numberValue(value) { var n = Number(value); return isFinite(n) ? n : 0; }
function clamp(value, min, max) { return Math.min(max, Math.max(min, isFinite(value) ? value : min)); }
function safeError(error) { return error && error.message ? error.message : String(error || "Unknown error"); }
