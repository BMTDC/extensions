# SIFO Chart.js Mixed Chart

A Tableau worksheet viz extension that renders productivity as bars and every selected Measure Values item as its own Chart.js line.

## Encodings

- **Date** (`date`): required continuous dimension. Recommended: `Pick date`.
- **Productivity** (`primary`): required continuous measure. Recommended: `AVG(Prod)`.
- **Measure Names** (`measureNames`): required discrete dimension. Use Tableau's generated `Measure Names` field.
- **Measure Values** (`measureValues`): required continuous measure. Use Tableau's generated `Measure Values` field.

Tableau creates Measure Names and Measure Values automatically. Measure Names supplies the line labels and Measure Values supplies each line's numeric values.

## Settings

- `accentColor`: `#1f4e79`
- `chartTitle`: `Productivity and operational mix`
- `primaryLabel`: `Productivity`
- `secondaryLabel`: `Measure values`
- `secondaryAxisMode`: `auto`
- `maxPoints`: `35`
- `showLegend`: `true`
- `showPoints`: `false`
- `beginAtZero`: `true`

## Hosting

- Folder slug: `sifo-chartjs-mixed-chart`
- Production URL: https://bmtdc.github.io/extensions/sifo-chartjs-mixed-chart/
- TREX: `SIFO-ChartJS-Mixed-Chart.trex`

Upload this exact folder under the repository's `extensions` directory. Do not rename it. The shared Tableau API library must remain at `extensions/tableau.extensions.1.latest.js` and is loaded with `../tableau.extensions.1.latest.js`.

Chart.js is loaded from `https://cdn.jsdelivr.net/npm/chart.js@4.5.1/dist/chart.umd.min.js`.

## Deployment

1. Replace the existing files inside `extensions/sifo-chartjs-mixed-chart/` with this complete version.
2. Commit and push the changes.
3. Verify https://bmtdc.github.io/extensions/sifo-chartjs-mixed-chart/ does not return 404.
4. Re-import the updated `SIFO-ChartJS-Mixed-Chart.trex` because the manifest version and encoding tiles changed.

## Tableau setup

1. Add the extension from the updated TREX.
2. Put `Pick date` on **Date**.
3. Put `AVG(Prod)` on **Productivity**.
4. Put Tableau's generated `Measure Names` field on **Measure Names**.
5. Put Tableau's generated `Measure Values` field on **Measure Values**.
6. Use the resulting Measure Values card to keep only the measures that should become lines.
7. Use a Measure Names filter to control which lines remain visible.
8. Open **Configure** to set the right-axis format to Automatic, Percentage, or Number.

Example: keep `Pct 33M`, `Pct 33P`, `Pct 43M`, `Pct 43P`, and `Pct 53P` on the Measure Values card. Productivity remains the bar series and the five measures become five line series.

## Behaviour

- Productivity uses the left axis.
- All selected Measure Values use the right axis.
- Each distinct Measure Names value becomes a separate Chart.js line and legend item.
- Duplicate date and Measure Names rows are averaged.
- The right axis is shared by all Measure Values. Do not mix percentages and unit counts on that axis unless their scales are intentionally comparable.
- The chart redraws after summary-data changes and debounced window resizing.

## Troubleshooting

- Only one line: check that multiple measures remain on the Measure Values card and that the Measure Names filter does not restrict the view to one measure.
- Missing encoding message: assign all four fields, including both generated Tableau fields.
- Unmatched columns: ensure Measure Names and Measure Values are part of the extension worksheet's summary data.
- Incorrect scaling: set the Measure Values axis to Percentage or Number in Configure.
- Chart.js load error: permit `cdn.jsdelivr.net` or host the UMD file internally.

## Changelog

- 1.1.0: Replaced the single Comparison and optional Series encodings with native Measure Names and Measure Values support; every selected measure now renders as a separate line.
- 1.0.0: Initial Chart.js mixed-chart extension.
