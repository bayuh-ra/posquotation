// scripts/quotation.js - LAP I.T. Solutions Quotation System

// Global variables
let products = [];
let categories = [];
let units = [];
let packageTypes = [];

// Load all data from Supabase
async function loadData() {
    try {
        products = await getProducts();
        categories = await getCategories();
        units = await getUnits();
        packageTypes = await getPackageTypes();
        
        console.log('Loaded products:', products);
        console.log('Loaded categories:', categories);
        console.log('Loaded units:', units);
        console.log('Loaded package types:', packageTypes);
        
        populatePackageTypes();
        populateUnits();
        populateDescriptions();
        
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

// Populate package type dropdown
function populatePackageTypes() {
    const packageTypeSelect = document.getElementById('packageType');
    const typeInclusions = document.getElementById('typeInclusions');
    if (!packageTypeSelect) return;

    packageTypeSelect.innerHTML = '<option value="" selected disabled>Select package type</option>';

    console.log('populatePackageTypes() - packageTypes length:', packageTypes ? packageTypes.length : 0);
    if (packageTypes && packageTypes.length > 0) console.table(packageTypes);

    if (packageTypes && packageTypes.length > 0) {
        packageTypes.forEach(type => {
            const option = document.createElement('option');
            const val = type.id || type.name || '';
            option.value = val;
            option.textContent = type.name || type.title || val;
            if (type.description) option.dataset.inclusions = type.description;
            if (type.inclusions) option.dataset.inclusions = type.inclusions;
            packageTypeSelect.appendChild(option);
        });
    } else {
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = 'No package types found';
        opt.disabled = true;
        packageTypeSelect.appendChild(opt);
        if (typeInclusions) typeInclusions.textContent = 'No package type data found. Check Supabase or table permissions.';
    }

    packageTypeSelect.addEventListener('change', function () {
        const selectedVal = this.value;
        const selected = packageTypes.find(t => String(t.id) === String(selectedVal) || t.name === selectedVal);
        if (typeInclusions) {
            typeInclusions.textContent = selected ? (selected.description || selected.inclusions || '') : 'Inclusions for selected type will appear here.';
        }
    });

    if (packageTypeSelect.value) packageTypeSelect.dispatchEvent(new Event('change'));
}

// Populate description dropdown with products
function populateDescriptions() {
    const descriptionDropdown = document.getElementById('descriptionDropdown');
    if (descriptionDropdown && products.length > 0) {
        descriptionDropdown.innerHTML = '';
        
        const posProducts = products.filter(p => 
            p.category && p.category.name === 'POS Software'
        );
        
        posProducts.forEach(product => {
            const option = document.createElement('option');
            option.value = product.id;
            option.textContent = product.name;
            option.dataset.description = product.description || '';
            option.dataset.price = product.base_price || 0;
            descriptionDropdown.appendChild(option);
        });
    }
}

// Populate unit selects
function populateUnits() {
    const selects = document.querySelectorAll('select.unit-select');
    console.log('populateUnits() - units length:', units ? units.length : 0);
    if (!selects || selects.length === 0) return;

    selects.forEach(sel => {
        sel.innerHTML = '<option value="" selected disabled>Select</option>';
        if (units && units.length > 0) {
            units.forEach(u => {
                const opt = document.createElement('option');
                opt.value = u.id || u.name || u.code || u;
                opt.textContent = u.name || u.label || opt.value;
                sel.appendChild(opt);
            });
        } else {
            const opt = document.createElement('option');
            opt.value = '';
            opt.textContent = 'No units found';
            opt.disabled = true;
            sel.appendChild(opt);
        }
    });
}

// Initialize quotation with date and number
function initializeQuotation() {
    const today = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    document.getElementById('quote-date').textContent = today;

    const quotationNumber = localStorage.getItem('currentQuotationNumber');
    if (quotationNumber) {
        document.getElementById('quote-number').textContent = quotationNumber;
        console.log('Using quotation number from localStorage:', quotationNumber);
    } else {
        const tempNum = `TEMP-${Date.now()}`;
        document.getElementById('quote-number').textContent = tempNum;
        console.warn('No quotation number in localStorage, using temporary:', tempNum);
    }
}

// Calculate totals
function calculateTotals() {
    const rows = document.querySelectorAll('tbody tr');
    let subtotal = 0;
    
    rows.forEach(row => {
        const qtyInput = row.querySelector('input[type="number"]');
        const priceInput = row.querySelector('.price-input');
        const totalCell = row.querySelector('.total-cell');
        
        if (qtyInput && priceInput && totalCell) {
            const qty = parseFloat(qtyInput.value) || 0;
            const priceText = priceInput.value.replace(/[₱,]/g, '').trim();
            
            if (priceText.toUpperCase() === 'FREE') {
                totalCell.textContent = 'FREE';
            } else {
                const price = parseFloat(priceText) || 0;
                const total = qty * price;
                totalCell.textContent = total > 0 ? `₱${total.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : '';
                subtotal += total;
            }
        }
    });
    
    const subtotalCell = document.getElementById('subtotal-cell');
    if (subtotalCell) {
        subtotalCell.textContent = `₱${subtotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    }
}

// Save quotation to Supabase
async function saveQuotation() {
    try {
        const employeeId = localStorage.getItem('selectedEmployeeId');
        
        if (!employeeId) {
            alert('Error: No employee selected. Please go back to home and select an employee.');
            return;
        }

        const clientName = document.querySelector('.client-info input[placeholder="Enter recipient name"]').value;
        const officeAddress = document.querySelector('.client-info input[placeholder="Enter office address"]').value;
        const contactPerson = document.querySelector('.client-info input[placeholder="Enter contact person"]').value;
        const contactNumber = document.querySelector('.client-info input[placeholder="Enter contact number"]').value;
        
        if (!clientName || !officeAddress || !contactPerson || !contactNumber) {
            alert('Please fill in all client information fields.');
            return;
        }
        
        const subtotalText = document.getElementById('subtotal-cell').textContent;
        const total = parseFloat(subtotalText.replace(/[₱,]/g, '')) || 0;
        
        console.log('Saving quotation with employee_id:', employeeId);
        
        const payload = {
            client_name: clientName,
            office_address: officeAddress,
            contact_person: contactPerson,
            contact_number: contactNumber,
            total: total,
            discount: 0,
            employee_id: employeeId
        };

        console.log('Quotation payload:', payload);

        const quotation = await createQuotation(payload);
        
        if (quotation) {
            console.log('Quotation saved successfully:', quotation);
            
            if (quotation.quotation_no) {
                document.getElementById('quote-number').textContent = quotation.quotation_no;
                localStorage.setItem('currentQuotationNumber', quotation.quotation_no);
                console.log('Auto-generated quotation number:', quotation.quotation_no);
            }
            
            alert(`Quotation saved successfully!\nQuotation No: ${quotation.quotation_no || 'N/A'}`);
            
        } else {
            alert('Error: Failed to save quotation. No response from server.');
        }
    } catch (error) {
        console.error('Error saving quotation:', error);
        alert('Error saving quotation: ' + (error.message || 'Unknown error'));
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('Page loaded, initializing...');
    
    const employeeId = localStorage.getItem('selectedEmployeeId');
    const employeeName = localStorage.getItem('selectedEmployeeName');
    const quotationNo = localStorage.getItem('currentQuotationNumber');
    
    console.log('Session data:', {
        employeeId,
        employeeName,
        quotationNo
    });
    
    loadData();
    initializeQuotation();
    
    document.querySelectorAll('input[type="number"], .price-input').forEach(input => {
        input.addEventListener('input', calculateTotals);
    });
    
    calculateTotals();
});