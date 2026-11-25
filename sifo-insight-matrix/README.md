# SIFO Insight Matrix 1.0.1

Corrected Tableau Viz Extension package.

## Changes from 1.0.0
- Removed the invalid `summary data` permission. Summary data does not require a permissions declaration.
- Reduced the extension to Tableau's maximum of four custom encodings.
- Removed Target as a field encoding. Target is now configured in extension settings.
- Corrected data type `date` to `temporal`.
- Corrected role types to `continuous-dimension`, `discrete-dimension`, and `continuous-measure`.
- Replaced unsupported `calendar` icon with supported letter tokens.
- JavaScript no longer expects a Target field.

## Encodings
1. Date (optional): temporal, continuous dimension
2. Group: discrete dimension
3. Productivity: continuous measure
4. Volume (optional): continuous measure

## Hosting
Upload `index.html`, `styles.css`, `app.js`, `config.html`, and `config.js` to the root of the GitHub Pages repository so that this URL resolves:

https://bmtdc.github.io/SIFO-Insight-Matrix/index.html

If you use another URL, change `<source-location>` in `SIFO-Insight-Matrix.trex` before opening it in Tableau.

## Tableau setup
1. Add the local `SIFO-Insight-Matrix.trex` as a Viz Extension.
2. Assign Group and Productivity.
3. Optionally assign Date and Volume.
4. Open Configure/Format Extension and set the productivity target plus warning/good thresholds.
