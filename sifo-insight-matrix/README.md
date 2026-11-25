# SIFO Insight Matrix

A Tableau viz extension designed for the `WH - BE GRO1 - SD SIFO PICK Post BF` workbook. It combines a compact KPI summary, ranked performance bars, target comparison, volume context, search, sorting and an automatically generated operational insight.

## Field assignment

- **Group**: one dimension such as Shift, Zone, SIFO type, User, Day/Hour or Order size category.
- **Productivity**: one measure such as average productivity or units per hour.
- **Volume (optional)**: units, orders, locations or containers. Used as the weighting factor.
- **Target (optional)**: a target measure. When absent, the configured default target is used.
- **Date (optional)**: a continuous date used to display the active period.

Recommended first setup for this workbook:
- Group: `Shift` or a zone field
- Productivity: the existing productivity measure used in the corresponding Avg prod worksheet
- Volume: `Units picked`, `Orders picked`, `Container count` or `Location count`
- Target: a calculated constant or target field matching the productivity unit
- Date: `Transaction date`

## Hosting

1. Create a GitHub repository named `SIFO-Insight-Matrix` under the `bmtdc` account.
2. Upload `index.html`, `styles.css`, `app.js`, `config.html`, and `config.js` to the repository root.
3. Enable GitHub Pages from the main branch/root.
4. Confirm that `https://bmtdc.github.io/SIFO-Insight-Matrix/index.html` loads.
5. If a different host is used, update the exact HTTPS URL in `SIFO-Insight-Matrix.trex`.

## Install in Tableau

1. Open a worksheet in Tableau Desktop 2026.2 or Tableau Cloud web authoring.
2. In the Marks type menu, choose **Add Extension** > **Access Local Viz Extensions**.
3. Select `SIFO-Insight-Matrix.trex` and allow summary data access when prompted.
4. Assign the fields above on the new encoding cards.
5. Use **Format Extension** / **Configure** to adjust warning, good and default-target thresholds.
6. Add the worksheet to the relevant dashboard.

## Validation and first-run checklist

- TREX parses as XML and contains exactly one worksheet-extension.
- Encoding IDs in TREX and JavaScript are synchronized: date, group, productivity, volume, target.
- JavaScript syntax passes `node --check`.
- Test with Shift, Zone and SIFO type as Group.
- Verify filtering and date context refresh the extension.
- Verify missing optional fields, null values, zero volume and empty filters show safe states.
- Check settings save, cancel and reset.
- Resize from roughly 320 px to full dashboard width.
- Confirm Tableau Cloud allows the GitHub Pages host and summary-data permission.

## Assumptions

- The GitHub Pages path is based on the existing `bmtdc.github.io` convention and must be changed if that repository will not be used.
- Bleckmann styling uses a restrained orange/charcoal/white scheme; confirm locally approved brand tokens before broad publication.
- The extension uses summary data only and does not transmit data to another service.
