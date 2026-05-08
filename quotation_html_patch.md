# quotation.html — Fix mixed-case client info being saved

---

## FIX 1 — Uppercase at save time in saveAndPrintQuotation()

Find:
```javascript
                const clientName = document.querySelector('.client-info input[placeholder="Enter recipient name"]').value;
                const officeAddress = document.querySelector('.client-info input[placeholder="Enter office address"]').value;
                const contactPerson = document.querySelector('.client-info input[placeholder="Enter contact person"]').value;
                const contactNumber = document.querySelector('.client-info input[placeholder="Enter contact number"]').value;
```

Replace with:
```javascript
                const clientName = (document.querySelector('.client-info input[placeholder="Enter recipient name"]').value || '').toUpperCase();
                const officeAddress = (document.querySelector('.client-info input[placeholder="Enter office address"]').value || '').toUpperCase();
                const contactPerson = (document.querySelector('.client-info input[placeholder="Enter contact person"]').value || '').toUpperCase();
                const contactNumber = document.querySelector('.client-info input[placeholder="Enter contact number"]').value;
```

(Contact number is left as-is since it's numeric.)

---

## FIX 2 — Uppercase when pre-filling inputs in edit mode (loadQuotationForEdit in quotation.js)

In `quotation.js`, find the `loadQuotationForEdit` function, specifically:
```javascript
        const clientInputs = document.querySelectorAll('.client-info input');
        if (clientInputs[0]) clientInputs[0].value = quotation.client_name || '';
        if (clientInputs[1]) clientInputs[1].value = quotation.office_address || '';
        if (clientInputs[2]) clientInputs[2].value = quotation.contact_person || '';
        if (clientInputs[3]) clientInputs[3].value = quotation.contact_number || '';

        // Populate left setup panel (new UI)
        setInputValueIfPresent('setup-client-name', quotation.client_name || '');
        setInputValueIfPresent('setup-office-address', quotation.office_address || '');
        setInputValueIfPresent('setup-contact-person', quotation.contact_person || '');
        setInputValueIfPresent('setup-contact-no', quotation.contact_number || '');
```

Replace with:
```javascript
        const clientInputs = document.querySelectorAll('.client-info input');
        if (clientInputs[0]) clientInputs[0].value = (quotation.client_name || '').toUpperCase();
        if (clientInputs[1]) clientInputs[1].value = (quotation.office_address || '').toUpperCase();
        if (clientInputs[2]) clientInputs[2].value = (quotation.contact_person || '').toUpperCase();
        if (clientInputs[3]) clientInputs[3].value = quotation.contact_number || '';

        // Populate left setup panel (new UI)
        setInputValueIfPresent('setup-client-name', (quotation.client_name || '').toUpperCase());
        setInputValueIfPresent('setup-office-address', (quotation.office_address || '').toUpperCase());
        setInputValueIfPresent('setup-contact-person', (quotation.contact_person || '').toUpperCase());
        setInputValueIfPresent('setup-contact-no', quotation.contact_number || '');
```

---

## FIX 3 — Also uppercase in loadQuotationInViewMode() in quotation.html

Find:
```javascript
            if (clientInputs[0]) clientInputs[0].value = quotation.client_name || '';
            if (clientInputs[1]) clientInputs[1].value = quotation.office_address || '';
            if (clientInputs[2]) clientInputs[2].value = quotation.contact_person || '';
            if (clientInputs[3]) clientInputs[3].value = quotation.contact_number || '';
```

Replace with:
```javascript
            if (clientInputs[0]) clientInputs[0].value = (quotation.client_name || '').toUpperCase();
            if (clientInputs[1]) clientInputs[1].value = (quotation.office_address || '').toUpperCase();
            if (clientInputs[2]) clientInputs[2].value = (quotation.contact_person || '').toUpperCase();
            if (clientInputs[3]) clientInputs[3].value = quotation.contact_number || '';
```

---

## FIX 4 — Previous patches (if not yet applied)

### Missing Quotation Number fix (in saveAndPrintQuotation):
```javascript
                const editingQuotationId = localStorage.getItem('editingQuotationId');
                const quotationNo = localStorage.getItem('currentQuotationNumber')
                    || (editingQuotationId ? (document.getElementById('quote-number')?.textContent?.trim() || null) : null);
```
Then delete the duplicate `const editingQuotationId` line further down.

### Template dates (in saveAndPrintQuotation, add before quotationPayload):
```javascript
                const templateDates = (typeof window.qptplCollectDates === 'function')
                    ? window.qptplCollectDates() : null;
```
And add `template_dates: templateDates,` to the quotationPayload object.

### Template dates restore (in loadQuotationInViewMode):
```javascript
            if (typeof window.qptplInjectViewPages === 'function') {
                window.qptplInjectViewPages(quotation.template_dates || null);
            }
```

### Supabase SQL (run once if not done):
```sql
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS template_dates text;
```