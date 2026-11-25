# SIFO Chart.js Mixed Chart

A Tableau worksheet viz extension that replaces dense native dual-axis graphs with a readable Chart.js mixed chart: productivity bars on the left axis and one or more operational comparison lines on the right axis.

## Encodings

- **Date** (`date`): required continuous dimension. Recommended: `Pick date`.
- **Productivity** (`primary`): required continuous measure. Recommended: `AVG(Prod)`.
- **Comparison** (`secondary`): required continuous measure. Examples: `Pct 33M`, `Pct units directs`, `Units per container`, or `Average per list per location`.
- **Series** (`series`): optional discrete dimension. Use a category field when comparison data is stored in rows. Leave empty when using one comparison measure.

Viz extensions support a maximum of four custom encoding tiles, so this extension is intentionally reusable per graph rather than attempting to place all report measures into one worksheet.

## Settings

- Accent colour: `#1f4e79`
- Chart title: `Productivity and operational mix`
- Primary label: `Productivity`
- Comparison label: `Comparison`
- Comparison axis: automatic, percentage or number
- Maximum points: `35` (7–100)
- Legend: shown
- Line points: hidden
- Axes start at zero: enabled

## Hosting

- Folder slug: `sifo-chartjs-mixed-chart`
- Production URL: https://bmtdc.github.io/extensions/sifo-chartjs-mixed-chart/
- TREX: `SIFO-ChartJS-Mixed-Chart.trex`

Upload this exact folder under the repository's `extensions` directory. The folder name and URL are case-sensitive.

The extension loads the shared Tableau API library from `../tableau.extensions.1.latest.js`. Do not copy that file into this folder.

Chart.js is loaded from `https://cdn.jsdelivr.net/npm/chart.js@4.5.1/dist/chart.umd.min.js`. Tableau and the user's browser must be allowed to reach jsDelivr. If your environment blocks public CDNs, download that exact UMD file into the shared parent folder and update the script reference before deployment.

## Deployment

1. Upload the complete `sifo-chartjs-mixed-chart` folder to `extensions/` in the `bmtdc.github.io` repository.
2. Confirm the shared `tableau.extensions.1.latest.js` exists directly in the parent `extensions/` folder.
3. Commit and push.
4. Open https://bmtdc.github.io/extensions/sifo-chartjs-mixed-chart/ and verify it does not return 404.
5. The standalone page will show an initialization message outside Tableau; that is expected.

## Add to the SIFO workbook

1. Open the SIFO report in Tableau Desktop.
2. Create or duplicate a worksheet for the graph being replaced.
3. From the Marks type menu, select **Add Extension** and then **Access Local Viz Extensions**.
4. Open `SIFO-ChartJS-Mixed-Chart.trex`.
5. Assign `Pick date` to **Date**.
6. Assign `AVG(Prod)` to **Productivity**.
7. Assign one operational measure to **Comparison**.
8. Optionally assign a category dimension to **Series**.
9. Add the same client, warehouse, shift, SD110D01 and date filters used by the existing worksheet.
10. Open the extension context menu and select **Configure** to set the title, labels, axis type, colours and number of displayed periods.
11. Replace the old worksheet on the dashboard only after validating totals and filter behaviour.

## Recommended report replacements

- **Location mix**: Productivity = `AVG(Prod)`; Comparison = a percentage measure such as `Pct 33M`; use separate extension worksheets per measure unless the percentages are pivoted into a category/value structure.
- **Units per location/list + UPC**: Productivity = `AVG(Prod)`; Comparison = `Average per list per location` or `Units per container`.
- **Directs versus holds**: Productivity = `AVG(Prod)`; Comparison = `Pct units directs` or `Pct holds`.
- **SIFO type**: Productivity = `AVG(Prod)`; Comparison = `SIFO1 pct` through `SIFO4 pct`, preferably after pivoting these fields into one category and one value field.
- **Order size**: Productivity = `AVG(Prod)`; Comparison = one of the order-size percentage or unit measures.

## Behaviour

The extension averages values for duplicate date/series combinations in the summary data. It then displays the last configured number of dates. The primary measure is rendered as bars. Comparison values are rendered as lines on a separate right axis. Automatic percentage detection treats a comparison as a percentage when every visible value is between 0 and 100; override this in Configure when necessary.

## Validation and troubleshooting

- Missing field message: add Date, Productivity and Comparison encodings.
- Column matching message: ensure encoded fields are present in worksheet summary data.
- Chart.js load message: allow `cdn.jsdelivr.net`, or host the UMD file internally.
- Incorrect percentages: set Comparison axis to **Percentage** or **Number** manually.
- Too many labels: reduce Maximum points or aggregate Pick date to week/month in Tableau.
- Shift comparison: use the existing Shift filter. A viz extension cannot independently read dashboard filters that do not affect its worksheet.

## Changelog

- 1.0.0: Initial Chart.js mixed-chart extension for clearer SIFO productivity comparisons.
