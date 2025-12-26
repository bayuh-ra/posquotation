// scripts/quotation_view_mode.js

// Check if we're in view mode when page loads
document.addEventListener('DOMContentLoaded', function() {
    const viewMode = localStorage.getItem('viewMode');
    const quotationData = localStorage.getItem('viewQuotationData');
    
    if (viewMode === 'true' && quotationData) {
        try {
            const quotation = JSON.parse(quotationData);
            loadQuotationInViewMode(quotation);
            
            // Clear the flags
            localStorage.removeItem('viewMode');
            localStorage.removeItem('viewQuotationData');
        } catch (error) {
            console.error('Error parsing quotation data:', error);
        }
    }
});

// Function to load quotation in view-only mode
async function loadQuotationInViewMode(quotation) {
    console.log('Loading quotation in view mode:', quotation);
    
    // Populate client information
    const clientInputs = document.querySelectorAll('.client-info input');
    if (clientInputs[0]) clientInputs[0].value = quotation.client_name || '';
    if (clientInputs[1]) clientInputs[1].value = quotation.office_address || '';
    if (clientInputs[2]) clientInputs[2].value = quotation.contact_person || '';
    if (clientInputs[3]) clientInputs[3].value = quotation.contact_number || '';
    
    // Populate quotation number and date
    const quoteNumber = document.getElementById('quote-number');
    const quoteDate = document.getElementById('quote-date');
    if (quoteNumber) quoteNumber.textContent = quotation.quotation_no || '';
    if (quoteDate) {
        const date = quotation.quotation_date || quotation.created_at;
        if (date) {
            const formatted = new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
            quoteDate.textContent = formatted;
        }
    }
    
    // LOAD QUOTATION ITEMS FROM DATABASE
    try {
        const { data: items, error } = await supabaseClient
            .from('quotation_items')
            .select('*')
            .eq('quotation_id', quotation.id)
            .order('row_order', { ascending: true });
        
        if (error) {
            console.error('Error loading quotation items:', error);
        } else if (items && items.length > 0) {
            console.log('Loaded items:', items);
            populateQuotationItems(items);
        } else {
            console.log('No items found for this quotation');
        }
    } catch (error) {
        console.error('Error fetching items:', error);
    }
    
    // Make page read-only
    makePageReadOnly();
}

// Function to populate the quotation items in the table
function populateQuotationItems(items) {
    const tbody = document.getElementById('quotation-tbody');
    if (!tbody) return;
    
    // Clear existing rows
    tbody.innerHTML = '';
    
    items.forEach((item, index) => {
        if (item.row_type === 'package') {
            // Create package type row
            const packageRow = document.createElement('tr');
            packageRow.id = 'package-type-row';
            packageRow.innerHTML = `
                <td rowspan="2" style="vertical-align: top; font-weight: bold;">
                    <select id="packageType" disabled style="font-weight: bold; font-size: 9px; padding: 5px; width: 100%;">
                        <option selected>${item.product_name}</option>
                    </select>
                </td>
                <td><input type="number" value="${item.quantity}" disabled class="qty-input" style="width: 50px; font-size: 10px; padding: 2px 4px; text-align: right;"></td>
                <td><input type="text" value="${item.unit || ''}" disabled class="unit-display" readonly style="font-size: 10px; padding: 2px 4px; width: 100%; text-align: center;"></td>
                <td>
                    <select id="descriptionDropdown" disabled style="font-weight: bold; font-size: 10px; padding: 5px; width: 100%;">
                        <option selected>${item.description || ''}</option>
                    </select>
                    <div id="typeInclusions" style="margin-top: 6px; font-size: 10px; color: #1976d2; font-style: italic;"></div>
                </td>
                <td><input type="number" value="${item.price}" disabled class="price-input" style="width: 80px; font-size: 10px; padding: 2px 4px; text-align: right;"></td>
                <td class="total-cell" style="text-align: right; font-weight: bold;">₱${item.total.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td class="no-print"></td>
            `;
            tbody.appendChild(packageRow);
            
        } else if (item.row_type === 'product') {
            // Create product row
            const productRow = document.createElement('tr');
            productRow.className = 'product-row';
            productRow.innerHTML = `
                <td></td>
                <td><input type="number" value="${item.quantity}" disabled class="qty-input" style="width: 50px; font-size: 10px; padding: 2px 4px; text-align: right;"></td>
                <td><input type="text" value="${item.unit || ''}" disabled class="unit-display" readonly style="font-size: 10px; padding: 2px 4px; width: 100%; text-align: center;"></td>
                <td>
                    <select disabled class="product-dropdown" style="font-weight: bold; font-size: 10px; padding: 5px; width: 100%;">
                        <option selected>${item.product_name}</option>
                    </select>
                    ${item.description ? `<div style="font-size: 9px; color: #666; margin-top: 4px;">${item.description}</div>` : ''}
                </td>
                <td><input type="number" value="${item.price}" disabled class="price-input" style="width: 80px; font-size: 10px; padding: 2px 4px; text-align: right;"></td>
                <td class="total-cell" style="text-align: right; font-weight: bold;">₱${item.total.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td class="no-print"></td>
            `;
            tbody.appendChild(productRow);
            
        } else if (item.row_type === 'delivery') {
            // Create delivery row
            const deliveryRow = document.createElement('tr');
            deliveryRow.id = 'delivery-row';
            const isFree = item.price === 0 || item.total === 0;
            deliveryRow.innerHTML = `
                <td></td>
                <td></td>
                <td></td>
                <td>
                    <div style="font-style: italic;">
                        <strong>${item.product_name}</strong><br>
                        <strong>${item.description || 'Guaranteed (1) year technical support'}</strong><br>
                        Via text, call and remote access
                    </div>
                </td>
                <td><input type="number" value="${item.price}" disabled class="delivery-price-input" style="width: 80px; font-size: 10px; padding: 2px 4px; text-align: right;"></td>
                <td class="delivery-total-cell" style="text-align: right; font-weight: bold; color: ${isFree ? '#28a745' : '#000'};">${isFree ? 'FREE' : '₱' + item.total.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td class="no-print"></td>
            `;
            tbody.appendChild(deliveryRow);
        }
    });
    
    // Update totals
    const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);
    const subtotalCell = document.getElementById('subtotal-cell');
    const discountedCell = document.getElementById('discounted-price-cell');
    
    if (subtotalCell) {
        subtotalCell.textContent = '₱' + subtotal.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    if (discountedCell) {
        discountedCell.textContent = '₱' + subtotal.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
}

// Function to make entire page read-only
function makePageReadOnly() {
    // Add visual indicator banner at the top
    const buttonContainer = document.querySelector('.button-container');
    if (buttonContainer && !document.querySelector('.view-mode-banner')) {
        const viewBanner = document.createElement('div');
        viewBanner.className = 'no-print view-mode-banner';
        viewBanner.style.cssText = 'background: #fff3cd; border: 2px solid #ffc107; padding: 15px; margin-bottom: 20px; text-align: center; font-weight: bold; color: #856404; border-radius: 8px; font-size: 16px;';
        viewBanner.innerHTML = '🔒 VIEW MODE - This quotation is read-only. You can only print or save as PDF.';
        buttonContainer.parentNode.insertBefore(viewBanner, buttonContainer);
    }
    
    // Update "Save Quotation" button
    const buttons = document.querySelectorAll('.button-container button');
    if (buttons[1]) { // Second button is "Save Quotation"
        buttons[1].textContent = '🔒 View Mode (Read Only)';
        buttons[1].style.background = '#6c757d';
        buttons[1].style.cursor = 'not-allowed';
        buttons[1].onclick = function(e) {
            e.preventDefault();
            alert('This quotation is in view-only mode. You cannot make changes.');
            return false;
        };
    }
    
    // Change "Back" button text to "Back to List"
    if (buttons[0]) {
        buttons[0].textContent = '← Back to List';
    }
    
    // Disable all inputs and selects
    const allInputs = document.querySelectorAll('input, select, textarea');
    allInputs.forEach(input => {
        input.disabled = true;
        input.style.cursor = 'not-allowed';
        input.style.opacity = '0.7';
    });
    
    // Hide all delete buttons
    const deleteButtons = document.querySelectorAll('button[onclick*="deleteRow"]');
    deleteButtons.forEach(btn => {
        btn.style.display = 'none';
    });
    
    // Hide "Add Another Product" button
    const addProductBtn = document.querySelector('.add-product-btn');
    if (addProductBtn) {
        addProductBtn.style.display = 'none';
    }
    
    // Hide Action column header and cells
    const actionHeaders = document.querySelectorAll('th.no-print');
    actionHeaders.forEach(th => {
        th.style.display = 'none';
    });
    
    const actionCells = document.querySelectorAll('td.no-print');
    actionCells.forEach(td => {
        td.style.display = 'none';
    });
}