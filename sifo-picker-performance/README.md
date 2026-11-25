# SIFO Picker Performance

A Tableau worksheet viz extension for the SIFO Pick report. It ranks pickers by average picked units per active day, shows filtered-range KPI cards, compares each picker with a configurable target, and optionally displays units and distinct containers.

## Folder and hosting

- Folder slug: `sifo-picker-performance`
- Production URL: https://bmtdc.github.io/extensions/sifo-picker-performance/
- TREX file: `SIFO-Picker-Performance.trex`

Upload this exact folder name under the GitHub repository's `extensions` directory. GitHub Pages paths are case-sensitive.

## Required local library

The extension loads the single shared `tableau.extensions.1.latest.js` from the parent `/extensions/` folder using `../tableau.extensions.1.latest.js`. Do not copy it into this extension folder.

## Encodings

- **Date**: required continuous dimension. Use `Transaction date`.
- **Picker**: required discrete dimension. Use `User`.
- **Units**: required continuous measure. Use `Quantity` aggregated as SUM.
- **Container**: optional discrete dimension. Use `Container` to show distinct-container context.

## Settings

- Accent colour: `#1f4e79`
- Top pickers: `10` (allowed 3–30)
- Target productivity: `100` units per active day
- Minimum units: `1`
- Show target comparison: enabled
- Show units and containers: enabled

## Deploy

1. Create `extensions/sifo-picker-performance/` in the `bmtdc.github.io` repository.
2. Copy every file from this package into that folder.
3. Confirm the shared `tableau.extensions.1.latest.js` already exists in the parent `/extensions/` folder.
4. Commit and push to GitHub Pages.
5. Verify https://bmtdc.github.io/extensions/sifo-picker-performance/ opens without a 404.

## Add to Tableau

1. Open the SIFO Pick workbook in Tableau Desktop.
2. Open or create a worksheet intended for the extension.
3. From the Marks card, choose **Add Extension** / **Viz Extension**.
4. Select **Access Local Extensions** and open `SIFO-Picker-Performance.trex`.
5. Assign `Transaction date` to **Date**, `User` to **Picker**, and `Quantity` to **Units**.
6. Optionally assign `Container` to **Container**.
7. Keep the workbook's normal date, warehouse and client filters. Summary data follows those filters automatically.
8. Open the extension's context menu and choose **Configure** to set the top-N, target, minimum units and colour.
9. Publish the workbook after testing the extension in Desktop.

## Calculation method

For each picker, the extension sums the encoded Units measure and divides by the number of distinct active dates present for that picker in the filtered summary data. This produces average picked units per active day. It is not the existing `Prod` field and should be labelled accordingly.

## Validation

- Worksheet extension manifest, not dashboard extension.
- Tableau Extensions API minimum version 1.14.
- Encoding IDs match `script.js` letter for letter.
- Required fields, unmatched columns, empty data and runtime errors show visible messages.
- Data refreshes on `SummaryDataChanged`.
- Layout redraws after a debounced resize.
- Settings persist as strings and support Save, Cancel and Reset.
- XML is well formed.

## Troubleshooting

- **Extension does not load**: confirm the folder is exactly `sifo-picker-performance` and the GitHub Pages URL returns the page over HTTPS.
- **Blank or field warning**: assign all three required encodings and ensure those fields are included in summary data.
- **Containers show zero**: add the optional Container encoding and make sure the field is not excluded by aggregation.
- **Unexpected productivity**: remember the visual calculates units per active day from the rows supplied to the extension. Filters and worksheet granularity affect the result.
- **Configure is unavailable**: use the Viz Extension context menu in the worksheet and verify `config.html` is deployed beside `index.html`.

## Changelog

- 1.0.1: Fixed TREX `data-spec` and `role-spec` schema structure and switched the API library reference to the shared parent copy.
- 1.0.0: Initial SIFO picker-performance extension.
