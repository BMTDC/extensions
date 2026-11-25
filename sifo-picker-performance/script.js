var ENC = {
    DATE: "date",
    PICKER: "picker",
    UNITS: "units",
    CONTAINER: "container"
};

var DEFAULTS = {
    accentColor: "#1f4e79",
    topN: "10",
    targetValue: "100",
    minimumUnits: "1",
    showTarget: "true",
    showSecondary: "true"
};

var CLS = {
    message: "flex h-full min-h-48 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500",
    cards: "grid grid-cols-1 gap-3 md:grid-cols-3",
    card: "rounded-lg border border-gray-200 bg-gray-50 p-4",
    label: "text-xs font-medium uppercase tracking-wide text-gray-500",
    value: "mt-1 text-2xl font-bold text-gray-800",
    section: "mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4",
    row: "grid grid-cols-[minmax(90px,1fr)_3fr_auto] items-center gap-3 py-2",
    picker: "truncate text-sm font-medium text-gray-700",
    secondary: "text-xs text-gray-400"
};

var state = { settings: {}, rows: [], timer: null };

async function initialize() {
    try {
        await tableau.extensions.initializeAsync({ configure: openSettings });
        loadSettings();
        var worksheet = tableau.extensions.worksheetContent.worksheet;
        worksheet.addEventListener(tableau.TableauEventType.SummaryDataChanged, loadData);
        window.addEventListener("resize", debounceDraw);
        await loadData();
    } catch (error) {
        showMessage("The extension could not start: " + safeError(error));
    }
}

function loadSettings() {
    state.settings = Object.assign({}, DEFAULTS, tableau.extensions.settings.getAll());
    document.body.style.setProperty("--accent", validColor(state.settings.accentColor) ? state.settings.accentColor : DEFAULTS.accentColor);
}

async function loadData() {
    try {
        var worksheet = tableau.extensions.worksheetContent.worksheet;
        var spec = await worksheet.getVisualSpecificationAsync();
        var markIndex = spec.activeMarksSpecificationIndex || 0;
        var encodings = spec.marksSpecifications[markIndex].encodings || [];
        var fields = {};
        encodings.forEach(function (encoding) {
            if (encoding.field) {
                fields[encoding.id] = encoding.field.name;
            }
        });
        var missing = [ENC.DATE, ENC.PICKER, ENC.UNITS].filter(function (id) { return !fields[id]; });
        if (missing.length) {
            showMessage("Add fields to the required encodings: Date, Picker and Units.");
            return;
        }
        var summary = await worksheet.getSummaryDataAsync({ ignoreSelection: true });
        if (!summary.data || !summary.data.length) {
            showMessage("No data is available for the current filters.");
            return;
        }
        var indexes = {
            date: findColumnIndex(summary.columns, fields[ENC.DATE]),
            picker: findColumnIndex(summary.columns, fields[ENC.PICKER]),
            units: findColumnIndex(summary.columns, fields[ENC.UNITS]),
            container: fields[ENC.CONTAINER] ? findColumnIndex(summary.columns, fields[ENC.CONTAINER]) : -1
        };
        if (indexes.date < 0 || indexes.picker < 0 || indexes.units < 0 || (fields[ENC.CONTAINER] && indexes.container < 0)) {
            showMessage("The encoded fields could not be matched to summary data. Available columns: " + summary.columns.map(function (c) { return c.fieldName; }).join(", "));
            return;
        }
        state.rows = aggregate(summary.data, indexes);
        if (!state.rows.length) {
            showMessage("No picker rows meet the current minimum-units setting.");
            return;
        }
        draw();
    } catch (error) {
        showMessage("Data could not be loaded: " + safeError(error));
    }
}

function aggregate(data, indexes) {
    var grouped = {};
    var dates = [];
    data.forEach(function (row) {
        var picker = String(row[indexes.picker].formattedValue || row[indexes.picker].nativeValue || "Unknown");
        var units = numberValue(row[indexes.units].nativeValue);
        var date = toDay(row[indexes.date].nativeValue);
        var container = indexes.container >= 0 ? String(row[indexes.container].nativeValue || row[indexes.container].formattedValue || "") : "";
        if (!grouped[picker]) grouped[picker] = { picker: picker, units: 0, containers: {}, days: {} };
        grouped[picker].units += units;
        if (container) grouped[picker].containers[container] = true;
        if (date) { grouped[picker].days[date] = true; dates.push(date); }
    });
    var min = Math.max(0, numberValue(state.settings.minimumUnits));
    var rows = Object.keys(grouped).map(function (key) {
        var item = grouped[key];
        var days = Math.max(1, Object.keys(item.days).length);
        item.productivity = item.units / days;
        item.containerCount = Object.keys(item.containers).length;
        return item;
    }).filter(function (item) { return item.units >= min; });
    rows.sort(function (a, b) { return b.productivity - a.productivity; });
    state.dateRange = dates.length ? [dates.sort()[0], dates.sort()[dates.length - 1]] : [];
    return rows.slice(0, clamp(parseInt(state.settings.topN, 10), 3, 30));
}

function draw() {
    var box = document.getElementById("resultBox");
    var rows = state.rows;
    if (!rows.length) { showMessage("No data is available."); return; }
    var target = Math.max(0, numberValue(state.settings.targetValue));
    var totalUnits = rows.reduce(function (sum, row) { return sum + row.units; }, 0);
    var avg = rows.reduce(function (sum, row) { return sum + row.productivity; }, 0) / rows.length;
    var max = Math.max.apply(null, rows.map(function (row) { return row.productivity; }).concat([target, 1]));
    var html = '<div class="' + CLS.cards + '">';
    html += card("Top picker", rows[0].picker, formatNumber(rows[0].productivity) + " units/day");
    html += card("Average productivity", formatNumber(avg), "units/day across displayed pickers");
    html += card("Displayed units", formatNumber(totalUnits), rows.length + " pickers");
    html += '</div><section class="' + CLS.section + '"><div class="mb-2 flex items-center justify-between"><span class="' + CLS.label + '">Picker ranking</span><span class="' + CLS.secondary + '">Average units per active day</span></div>';
    rows.forEach(function (row, index) {
        var width = Math.max(1, row.productivity / max * 100);
        var status = target > 0 ? (row.productivity >= target ? "▲" : "▼") : "■";
        var statusClass = row.productivity >= target ? "text-green-700" : "text-red-700";
        var secondary = state.settings.showSecondary === "true" ? formatNumber(row.units) + " units" + (row.containerCount ? " · " + row.containerCount + " containers" : "") : "";
        html += '<div class="' + CLS.row + '"><div><div class="' + CLS.picker + '">' + (index + 1) + '. ' + escapeHtml(row.picker) + '</div><div class="' + CLS.secondary + '">' + escapeHtml(secondary) + '</div></div><div class="h-3 overflow-hidden rounded-full bg-gray-200"><div class="h-full rounded-full" style="width:' + width + '%;background:var(--accent)"></div></div><div class="text-right"><span class="text-sm font-bold text-gray-800">' + formatNumber(row.productivity) + '</span>' + (state.settings.showTarget === "true" && target > 0 ? '<span class="ml-2 ' + statusClass + '">' + status + '</span>' : '') + '</div></div>';
    });
    html += "</section>";
    box.innerHTML = html;
    var controls = document.getElementById("controls");
    controls.classList.remove("hidden");
    controls.classList.add("flex");
    document.getElementById("rangeLabel").textContent = state.dateRange.length ? formatDay(state.dateRange[0]) + " to " + formatDay(state.dateRange[1]) : "Current filtered range";
}

function card(label, value, secondary) {
    return '<div class="' + CLS.card + '"><div class="' + CLS.label + '">' + escapeHtml(label) + '</div><div class="' + CLS.value + '">' + escapeHtml(String(value)) + '</div><div class="' + CLS.secondary + '">' + escapeHtml(secondary) + '</div></div>';
}

async function openSettings() {
    try {
        await tableau.extensions.ui.displayDialogAsync(new URL("config.html", window.location.href).href, "", { height: 520, width: 540 });
        loadSettings();
        await loadData();
    } catch (err) {
        if (err.errorCode !== tableau.ErrorCodes.DialogClosedByUser) showMessage("Settings could not be opened: " + safeError(err));
    }
}

function findColumnIndex(columns, fieldName) {
    var exact = columns.findIndex(function (column) { return column.fieldName === fieldName; });
    if (exact >= 0) return exact;
    var wanted = String(fieldName).toLowerCase();
    return columns.findIndex(function (column) {
        var actual = String(column.fieldName || "").toLowerCase();
        return actual.indexOf(wanted) >= 0 || wanted.indexOf(actual) >= 0;
    });
}

function toDay(value) {
    if (value === null || value === undefined || value === "") return "";
    var date = value instanceof Date ? value : new Date(value);
    if (isNaN(date.getTime())) return "";
    return date.getUTCFullYear() + "-" + String(date.getUTCMonth() + 1).padStart(2, "0") + "-" + String(date.getUTCDate()).padStart(2, "0");
}

function formatDay(day) { return new Intl.DateTimeFormat(undefined, { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(day + "T00:00:00Z")); }
function formatNumber(value) { return new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(value); }
function numberValue(value) { var n = Number(value); return isFinite(n) ? n : 0; }
function clamp(value, min, max) { return Math.min(max, Math.max(min, isFinite(value) ? value : min)); }
function validColor(value) { return /^#[0-9a-f]{6}$/i.test(String(value)); }
function debounceDraw() { clearTimeout(state.timer); state.timer = setTimeout(draw, 100); }
function showMessage(message) { document.getElementById("resultBox").innerHTML = '<div class="' + CLS.message + '">' + escapeHtml(message) + '</div>'; document.getElementById("controls").classList.add("hidden"); }
function safeError(error) { return error && error.message ? error.message : String(error || "Unknown error"); }
function escapeHtml(value) { return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;"); }
