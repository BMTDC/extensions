var ENC = {
    DATE: "date",
    PRIMARY: "primary",
    SECONDARY: "secondary",
    SERIES: "series"
};

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

var CLS = {
    message: "flex h-full min-h-56 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500",
    chart: "relative h-full min-h-56 w-full rounded-lg border border-gray-200 bg-gray-50 p-3"
};

var COLORS = ["#2e75b6", "#9dc3e6", "#c55a11", "#7f7f7f", "#548235", "#7030a0"];
var state = { settings: {}, chart: null, points: [], timer: null };

async function initialize() {
    try {
        await tableau.extensions.initializeAsync({ configure: openSettings });
        loadSettings();
        tableau.extensions.worksheetContent.worksheet.addEventListener(tableau.TableauEventType.SummaryDataChanged, loadData);
        window.addEventListener("resize", debounceDraw);
        await loadData();
    } catch (error) {
        showMessage("The extension could not start: " + safeError(error));
    }
}

function loadSettings() {
    state.settings = Object.assign({}, DEFAULTS, tableau.extensions.settings.getAll());
    var accent = validColor(state.settings.accentColor) ? state.settings.accentColor : DEFAULTS.accentColor;
    document.body.style.setProperty("--accent", accent);
}

async function loadData() {
    try {
        var worksheet = tableau.extensions.worksheetContent.worksheet;
        var spec = await worksheet.getVisualSpecificationAsync();
        var markIndex = spec.activeMarksSpecificationIndex || 0;
        var encodings = spec.marksSpecifications[markIndex].encodings || [];
        var fields = {};
        encodings.forEach(function (encoding) {
            if (encoding.field) fields[encoding.id] = encoding.field.name;
        });
        var missing = [ENC.DATE, ENC.PRIMARY, ENC.SECONDARY].filter(function (id) { return !fields[id]; });
        if (missing.length) {
            showMessage("Add fields to Date, Productivity and Comparison on the Marks card.");
            return;
        }
        var summary = await worksheet.getSummaryDataAsync({ ignoreSelection: true });
        if (!summary.data || !summary.data.length) {
            showMessage("No data is available for the current filters.");
            return;
        }
        var indexes = {
            date: findColumnIndex(summary.columns, fields[ENC.DATE]),
            primary: findColumnIndex(summary.columns, fields[ENC.PRIMARY]),
            secondary: findColumnIndex(summary.columns, fields[ENC.SECONDARY]),
            series: fields[ENC.SERIES] ? findColumnIndex(summary.columns, fields[ENC.SERIES]) : -1
        };
        if (indexes.date < 0 || indexes.primary < 0 || indexes.secondary < 0 || (fields[ENC.SERIES] && indexes.series < 0)) {
            showMessage("The encoded fields could not be matched to summary data. Available columns: " + summary.columns.map(function (column) { return column.fieldName; }).join(", "));
            return;
        }
        state.points = aggregate(summary.data, indexes);
        if (!state.points.length) {
            showMessage("No valid dated values are available for the current filters.");
            return;
        }
        draw();
    } catch (error) {
        showMessage("Data could not be loaded: " + safeError(error));
    }
}

function aggregate(data, indexes) {
    var grouped = {};
    data.forEach(function (row) {
        var day = toDay(row[indexes.date].nativeValue);
        if (!day) return;
        var series = indexes.series >= 0 ? String(row[indexes.series].formattedValue || row[indexes.series].nativeValue || "Comparison") : "Comparison";
        var key = day + "|" + series;
        if (!grouped[key]) grouped[key] = { day: day, series: series, primaryTotal: 0, primaryCount: 0, secondaryTotal: 0, secondaryCount: 0 };
        var primary = numericCell(row[indexes.primary]);
        var secondary = numericCell(row[indexes.secondary]);
        if (primary !== null) { grouped[key].primaryTotal += primary; grouped[key].primaryCount += 1; }
        if (secondary !== null) { grouped[key].secondaryTotal += secondary; grouped[key].secondaryCount += 1; }
    });
    var points = Object.keys(grouped).map(function (key) {
        var item = grouped[key];
        return {
            day: item.day,
            series: item.series,
            primary: item.primaryCount ? item.primaryTotal / item.primaryCount : null,
            secondary: item.secondaryCount ? item.secondaryTotal / item.secondaryCount : null
        };
    }).sort(function (a, b) { return a.day.localeCompare(b.day) || a.series.localeCompare(b.series); });
    var days = Array.from(new Set(points.map(function (point) { return point.day; })));
    var maxPoints = clamp(parseInt(state.settings.maxPoints, 10), 7, 100);
    var keepDays = days.slice(Math.max(0, days.length - maxPoints));
    return points.filter(function (point) { return keepDays.indexOf(point.day) >= 0; });
}

function draw() {
    if (!state.points.length || typeof Chart === "undefined") {
        showMessage(typeof Chart === "undefined" ? "Chart.js could not be loaded. Check that the CDN is allowed by your Tableau environment." : "No data is available.");
        return;
    }
    ensureCanvas();
    if (state.chart) { state.chart.destroy(); state.chart = null; }
    var labels = Array.from(new Set(state.points.map(function (point) { return point.day; }))).sort();
    var seriesNames = Array.from(new Set(state.points.map(function (point) { return point.series; }))).sort();
    var primaryByDay = {};
    labels.forEach(function (day) {
        var values = state.points.filter(function (point) { return point.day === day && point.primary !== null; }).map(function (point) { return point.primary; });
        primaryByDay[day] = values.length ? values.reduce(function (a, b) { return a + b; }, 0) / values.length : null;
    });
    var accent = validColor(state.settings.accentColor) ? state.settings.accentColor : DEFAULTS.accentColor;
    var datasets = [{
        type: "bar",
        label: state.settings.primaryLabel,
        data: labels.map(function (day) { return primaryByDay[day]; }),
        backgroundColor: colorWithAlpha(accent, 0.78),
        borderColor: accent,
        borderWidth: 1,
        borderRadius: 3,
        yAxisID: "y",
        order: 2
    }];
    seriesNames.forEach(function (series, index) {
        var byDay = {};
        state.points.filter(function (point) { return point.series === series; }).forEach(function (point) { byDay[point.day] = point.secondary; });
        datasets.push({
            type: "line",
            label: seriesNames.length > 1 ? series : state.settings.secondaryLabel,
            data: labels.map(function (day) { return byDay[day] === undefined ? null : byDay[day]; }),
            borderColor: COLORS[index % COLORS.length],
            backgroundColor: COLORS[index % COLORS.length],
            borderWidth: 2,
            pointRadius: state.settings.showPoints === "true" ? 3 : 0,
            pointHoverRadius: 5,
            tension: 0.25,
            spanGaps: true,
            yAxisID: "y1",
            order: 1
        });
    });
    var percent = isPercentMode(state.points.map(function (point) { return point.secondary; }));
    state.chart = new Chart(document.getElementById("mainChart"), {
        data: { labels: labels.map(formatDay), datasets: datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            resizeDelay: 100,
            interaction: { mode: "index", intersect: false },
            animation: { duration: 250 },
            plugins: {
                title: { display: Boolean(state.settings.chartTitle), text: state.settings.chartTitle, color: "#1f2937", font: { family: "Calibri, Arial, sans-serif", size: 15, weight: "bold" }, padding: { bottom: 14 } },
                legend: { display: state.settings.showLegend === "true", position: "top", labels: { color: "#6b7280", usePointStyle: true, boxWidth: 9, padding: 14, font: { family: "Calibri, Arial, sans-serif", size: 11 } } },
                tooltip: { backgroundColor: "#1f2937", titleFont: { family: "Calibri, Arial, sans-serif" }, bodyFont: { family: "Calibri, Arial, sans-serif" }, callbacks: { label: function (context) { var suffix = context.dataset.yAxisID === "y1" && percent ? "%" : ""; return context.dataset.label + ": " + formatNumber(context.parsed.y) + suffix; } } }
            },
            scales: {
                x: { grid: { display: false }, ticks: { color: "#6b7280", maxRotation: 45, autoSkip: true, maxTicksLimit: 14, font: { family: "Calibri, Arial, sans-serif", size: 11 } }, border: { color: "#d1d5db" } },
                y: { beginAtZero: state.settings.beginAtZero === "true", position: "left", title: { display: true, text: state.settings.primaryLabel, color: "#6b7280", font: { family: "Calibri, Arial, sans-serif", size: 11 } }, grid: { color: "#e5e7eb" }, ticks: { color: "#6b7280", font: { family: "Calibri, Arial, sans-serif", size: 11 } }, border: { color: "#d1d5db" } },
                y1: { beginAtZero: state.settings.beginAtZero === "true", position: "right", suggestedMax: percent ? 100 : undefined, title: { display: true, text: state.settings.secondaryLabel + (percent ? " (%)" : ""), color: "#6b7280", font: { family: "Calibri, Arial, sans-serif", size: 11 } }, grid: { drawOnChartArea: false }, ticks: { color: "#6b7280", callback: function (value) { return formatNumber(value) + (percent ? "%" : ""); }, font: { family: "Calibri, Arial, sans-serif", size: 11 } }, border: { color: "#d1d5db" } }
            }
        }
    });
    var controls = document.getElementById("controls");
    controls.classList.remove("hidden");
    controls.classList.add("flex");
    document.getElementById("rangeLabel").textContent = formatDay(labels[0]) + " to " + formatDay(labels[labels.length - 1]);
    document.getElementById("rowLabel").textContent = labels.length + " periods · " + seriesNames.length + " comparison series";
}

function isPercentMode(values) {
    if (state.settings.secondaryAxisMode === "percent") return true;
    if (state.settings.secondaryAxisMode === "number") return false;
    var valid = values.filter(function (value) { return value !== null && isFinite(value); });
    return valid.length > 0 && valid.every(function (value) { return value >= 0 && value <= 100; });
}

function ensureCanvas() {
    var box = document.getElementById("resultBox");
    if (!document.getElementById("mainChart")) box.innerHTML = '<div id="chartContainer" class="' + CLS.chart + '"><canvas id="mainChart" role="img" aria-label="SIFO productivity comparison chart"></canvas></div>';
}

async function openSettings() {
    try {
        await tableau.extensions.ui.displayDialogAsync(new URL("config.html", window.location.href).href, "", { height: 610, width: 600 });
        loadSettings();
        draw();
    } catch (err) {
        if (err.errorCode !== tableau.ErrorCodes.DialogClosedByUser) showMessage("Settings could not be opened: " + safeError(err));
    }
}

function findColumnIndex(columns, fieldName) {
    var exact = columns.findIndex(function (column) { return column.fieldName === fieldName; });
    if (exact >= 0) return exact;
    var wanted = String(fieldName).toLowerCase();
    return columns.findIndex(function (column) { var actual = String(column.fieldName || "").toLowerCase(); return actual.indexOf(wanted) >= 0 || wanted.indexOf(actual) >= 0; });
}

function numericCell(cell) { var value = Number(cell.nativeValue); return isFinite(value) ? value : null; }
function toDay(value) { if (value === null || value === undefined || value === "") return ""; var date = value instanceof Date ? value : new Date(value); if (isNaN(date.getTime())) return ""; return date.getUTCFullYear() + "-" + String(date.getUTCMonth() + 1).padStart(2, "0") + "-" + String(date.getUTCDate()).padStart(2, "0"); }
function formatDay(day) { return new Intl.DateTimeFormat(undefined, { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(day + "T00:00:00Z")); }
function formatNumber(value) { return new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(value); }
function colorWithAlpha(hex, alpha) { var value = hex.replace("#", ""); var r = parseInt(value.substring(0, 2), 16); var g = parseInt(value.substring(2, 4), 16); var b = parseInt(value.substring(4, 6), 16); return "rgba(" + r + "," + g + "," + b + "," + alpha + ")"; }
function clamp(value, min, max) { return Math.min(max, Math.max(min, isFinite(value) ? value : min)); }
function validColor(value) { return /^#[0-9a-f]{6}$/i.test(String(value)); }
function debounceDraw() { clearTimeout(state.timer); state.timer = setTimeout(draw, 100); }
function showMessage(message) { if (state.chart) { state.chart.destroy(); state.chart = null; } document.getElementById("resultBox").innerHTML = '<div class="' + CLS.message + '">' + escapeHtml(message) + '</div>'; document.getElementById("controls").classList.add("hidden"); }
function safeError(error) { return error && error.message ? error.message : String(error || "Unknown error"); }
function escapeHtml(value) { return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#039;"); }
