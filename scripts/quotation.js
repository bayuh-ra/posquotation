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

// Function to replace dropdown with wrapped text after selection
function handleDropdownSelection(selectElement) {
    selectElement.addEventListener('change', function() {
        if (this.value) {
            // Get selected option
            const selectedOption = this.options[this.selectedIndex];
            const selectedText = selectedOption.text;
            const productDescription = selectedOption.dataset.description || '';
            
            // Create a div to show the wrapped text
            const textDiv = document.createElement('div');
            textDiv.className = 'selected-dropdown-text';
            
            // Add product name
            const nameDiv = document.createElement('div');
            nameDiv.textContent = selectedText;
            nameDiv.style.fontWeight = 'bold';
            textDiv.appendChild(nameDiv);
            
            // Add product description if available (only for descriptionDropdown)
            if (this.id === 'descriptionDropdown' && productDescription) {
                // Split description by line breaks or bullet points
                const descLines = productDescription.split('\n').filter(line => line.trim());
                
                if (descLines.length > 0) {
                    const listContainer = document.createElement('div');
                    listContainer.style.cssText = `
                        font-size: 9px;
                        color: #666;
                        margin-top: 6px;
                        margin-left: 15px;
                    `;
                    
                    descLines.forEach(line => {
                        const listItem = document.createElement('div');
                        listItem.style.cssText = `
                            margin-bottom: 2px;
                            line-height: 1.4;
                        `;
                        // Add checkmark before each item
                        listItem.innerHTML = '✓ ' + line.trim();
                        listContainer.appendChild(listItem);
                    });
                    
                    textDiv.appendChild(listContainer);
                }
            }
            
            textDiv.style.cssText = `
                font-size: 10px;
                line-height: 1.4;
                word-wrap: break-word;
                white-space: normal;
                padding: 4px;
                cursor: pointer;
                max-width: 100%;
            `;
            
            // Store the select element for later (in case we need to change it)
            textDiv.dataset.selectId = this.id;
            
            // Click to show dropdown again
            textDiv.addEventListener('click', function() {
                this.style.display = 'none';
                selectElement.style.display = 'block';
                selectElement.focus();
            });
            
            // Remove any existing text div
            const existingDiv = this.parentNode.querySelector('.selected-dropdown-text');
            if (existingDiv) {
                existingDiv.remove();
            }
            
            // Hide the select and show the div
            this.style.display = 'none';
            this.parentNode.insertBefore(textDiv, this.nextSibling);
        }
    });
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
            // Use name instead of id
            const val = type.name || '';
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

    packageTypeSelect.addEventListener('change', async function () {
        const selectedVal = this.value;
        const selected = packageTypes.find(t => t.name === selectedVal);
        
        // Update inclusions text
        if (typeInclusions) {
            typeInclusions.textContent = selected ? (selected.description || selected.inclusions || '') : 'Inclusions for selected type will appear here.';
        }
        
        // Load products for this package type
        if (selectedVal) {
            await loadProductsForPackageType(selectedVal);
        }
    });

    if (packageTypeSelect.value) packageTypeSelect.dispatchEvent(new Event('change'));
    
    // Enable text wrapping after selection
    handleDropdownSelection(packageTypeSelect);
}

// Load products associated with a package type
async function loadProductsForPackageType(packageTypeName) {
    const descriptionDropdown = document.getElementById('descriptionDropdown');
    if (!descriptionDropdown) return;
    
    try {
        // Fetch package items from Supabase
        const packageItems = await getPackageItems(packageTypeName);
        
        console.log('Package items for', packageTypeName, ':', packageItems);
        
        descriptionDropdown.innerHTML = '<option value="" selected disabled>Select description</option>';
        
        if (packageItems && packageItems.length > 0) {
            packageItems.forEach(item => {
                const option = document.createElement('option');
                option.value = item.product_name;
                option.textContent = item.product_name;
                
                // Add product details if available
                if (item.product) {
                    option.dataset.description = item.product.description || '';
                    option.dataset.price = item.product.base_price || 0;
                }
                
                descriptionDropdown.appendChild(option);
            });
        } else {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'No products found for this package';
            option.disabled = true;
            descriptionDropdown.appendChild(option);
        }
    } catch (error) {
        console.error('Error loading products for package:', error);
        descriptionDropdown.innerHTML = '<option value="" selected disabled>Error loading products</option>';
    }
}

// Populate description dropdown with products (initial load - will be replaced when package type is selected)
function populateDescriptions() {
    const descriptionDropdown = document.getElementById('descriptionDropdown');
    if (descriptionDropdown) {
        descriptionDropdown.innerHTML = '<option value="" selected disabled>Select package type first</option>';
        
        // Enable text wrapping after selection
        handleDropdownSelection(descriptionDropdown);
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
                // Use name instead of id
                opt.value = u.name || u.code || u;
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
async function initializeQuotation() {
    const today = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    document.getElementById('quote-date').textContent = today;

    // Generate and display the next quotation number
    const employeeName = localStorage.getItem('selectedEmployeeName');
    if (employeeName) {
        try {
            const nextQuotationNo = await getNextQuotationNo(employeeName);
            if (nextQuotationNo) {
                document.getElementById('quote-number').textContent = nextQuotationNo;
                // Store it for use when saving
                localStorage.setItem('currentQuotationNumber', nextQuotationNo);
                console.log('Pre-generated quotation number:', nextQuotationNo);
            } else {
                document.getElementById('quote-number').textContent = 'Error generating number';
            }
        } catch (error) {
            console.error('Error getting quotation number:', error);
            document.getElementById('quote-number').textContent = 'Error';
        }
    } else {
        document.getElementById('quote-number').textContent = 'No employee selected';
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
        // Changed from employeeId to employeeName
        const employeeName = localStorage.getItem('selectedEmployeeName');
        const quotationNo = localStorage.getItem('currentQuotationNumber');
        
        if (!employeeName) {
            alert('Error: No employee selected. Please go back to home and select an employee.');
            return;
        }

        if (!quotationNo) {
            alert('Error: No quotation number generated. Please refresh the page.');
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
        
        console.log('Saving quotation with employee_name:', employeeName);
        
        // Changed employee_id to employee_name and include quotation_no
        const payload = {
            quotation_no: quotationNo,  // Include the pre-generated quotation number
            client_name: clientName,
            office_address: officeAddress,
            contact_person: contactPerson,
            contact_number: contactNumber,
            total: total,
            discount: 0,
            employee_name: employeeName  // Changed this line
        };

        console.log('Quotation payload:', payload);

        const quotation = await createQuotation(payload);
        
        if (quotation) {
            console.log('Quotation saved successfully:', quotation);
            
            alert(`Quotation saved successfully!\nQuotation No: ${quotation.quotation_no || quotationNo}`);
            
            // Clear the stored quotation number so a new one is generated on next page load
            localStorage.removeItem('currentQuotationNumber');
            
        } else {
            alert('Error: Failed to save quotation. No response from server.');
        }
    } catch (error) {
        console.error('Error saving quotation:', error);
        alert('Error saving quotation: ' + (error.message || 'Unknown error'));
    }
}

// For print: ensure the wrapped text shows instead of dropdown
window.addEventListener('beforeprint', function() {
    document.querySelectorAll('.selected-dropdown-text').forEach(function(div) {
        div.style.display = 'block';
    });
    document.querySelectorAll('#packageType, #descriptionDropdown').forEach(function(select) {
        if (select.nextElementSibling && select.nextElementSibling.classList.contains('selected-dropdown-text')) {
            select.style.display = 'none';
        }
    });
});

// After print: restore dropdown display if needed
window.addEventListener('afterprint', function() {
    // Optionally restore dropdowns after printing
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('Page loaded, initializing...');
    
    // Keep both for logging, but only employeeName is needed now
    const employeeName = localStorage.getItem('selectedEmployeeName');
    const quotationNo = localStorage.getItem('currentQuotationNumber');
    
    console.log('Session data:', {
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