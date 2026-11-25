var DEFAULTS = {
    accentColor: "#1f4e79",
    chartTitle: "Productivity and operational mix",
    primaryLabel: "Productivity",
    secondaryLabel: "Comparison",
    secondaryAxisMode: "auto",
    maxPoints: "35",
    showLegend: "true",
    showPoints: "false",
    beginAtZero: "true"
};

async function initializeConfig() {
    try {
        await tableau.extensions.initializeDialogAsync();
        fillForm(Object.assign({}, DEFAULTS, tableau.extensions.settings.getAll()));
        document.getElementById("resetButton").addEventListener("click", function () { fillForm(DEFAULTS); });
        document.getElementById("cancelButton").addEventListener("click", function () { tableau.extensions.ui.closeDialog("cancel"); });
        document.getElementById("saveButton").addEventListener("click", saveSettings);
    } catch (error) { showError("Settings could not be initialized: " + safeError(error)); }
}

function fillForm(values) {
    Object.keys(DEFAULTS).forEach(function (key) { var element = document.getElementById(key); if (element.type === "checkbox") element.checked = values[key] === "true"; else element.value = values[key]; });
    document.body.style.setProperty("--accent", values.accentColor);
}

async function saveSettings() {
    var accent = document.getElementById("accentColor").value;
    var maxPoints = clamp(parseInt(document.getElementById("maxPoints").value, 10), 7, 100);
    if (!/^#[0-9a-f]{6}$/i.test(accent)) { showError("Choose a valid accent colour."); return; }
    var values = {
        accentColor: accent,
        chartTitle: document.getElementById("chartTitle").value.trim(),
        primaryLabel: document.getElementById("primaryLabel").value.trim() || DEFAULTS.primaryLabel,
        secondaryLabel: document.getElementById("secondaryLabel").value.trim() || DEFAULTS.secondaryLabel,
        secondaryAxisMode: document.getElementById("secondaryAxisMode").value,
        maxPoints: String(maxPoints),
        showLegend: String(document.getElementById("showLegend").checked),
        showPoints: String(document.getElementById("showPoints").checked),
        beginAtZero: String(document.getElementById("beginAtZero").checked)
    };
    try { Object.keys(values).forEach(function (key) { tableau.extensions.settings.set(key, values[key]); }); await tableau.extensions.settings.saveAsync(); tableau.extensions.ui.closeDialog("saved"); } catch (error) { showError("Settings could not be saved: " + safeError(error)); }
}

function showError(message) { var box = document.getElementById("errorBox"); box.textContent = message; box.classList.remove("hidden"); }
function clamp(value, min, max) { return Math.min(max, Math.max(min, isFinite(value) ? value : min)); }
function safeError(error) { return error && error.message ? error.message : String(error || "Unknown error"); }
