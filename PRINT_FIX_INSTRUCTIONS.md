# Print Margin Fix — quotation.html

## The Problem
In quotation.html, the print CSS has:
```css
.page {
    page-break-inside: avoid !important;
}
```
This forces every `.page` div onto ONE physical sheet.
When AMC/SLA content is longer than one sheet, the browser squishes or cuts it.

## The Fix
In quotation.html, find the `@media print` block and locate this rule:

```css
.page {
    zoom: 1 !important;
    width: 8.27in !important;
    height: auto !important;
    min-height: 11.2in !important;
    max-height: none !important;
    box-shadow: none !important;
    margin: 0 !important;
    padding: 0.3in 0.4in 0.6in !important;
    page-break-after: always !important;
    page-break-inside: avoid !important;   ← THIS IS THE PROBLEM
    position: relative !important;
    overflow: visible !important;
    box-sizing: border-box !important;
    border-bottom: none !important;
    border-radius: 0 !important;
}
```

Add these lines RIGHT AFTER that `.page { }` block (do not modify the existing block):

```css
/* Allow template pages (AMC/SLA/EULA) to flow across multiple print sheets */
.qptpl-template-page {
    page-break-inside: auto !important;
    break-inside: auto !important;
    min-height: unset !important;
    height: auto !important;
    page-break-after: always !important;
    break-after: page !important;
}
.qptpl-template-page .page-inner {
    page-break-inside: auto !important;
    break-inside: auto !important;
}
```

That's the ONLY change needed in quotation.html.
No changes to quotation-templates.js are required.

## Why This Works
- `.page { page-break-inside: avoid }` is correct for pages 1 and 2 (fixed-height quotation pages)
- But template pages are variable-length documents — they NEED to break across sheets
- The override `.qptpl-template-page { page-break-inside: auto }` un-does the avoid rule
  only for template pages, leaving pages 1 and 2 untouched
- The browser's existing `@page { margin: 0.4in 0.35in }` then applies correctly
  to every continuation sheet
