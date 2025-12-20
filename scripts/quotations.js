// original copy


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
                
                console.log('Processing item:', item.product_name);
                console.log('Item product:', item.product);
                console.log('Item product unit:', item.product ? item.product.unit : 'NO PRODUCT');
                
                // Use product data from the join
                if (item.product) {
                    option.dataset.description = item.product.description || '';
                    option.dataset.price = item.product.base_price || 0;
                    option.dataset.unit = item.product.unit || '';
                    console.log('Set dataset.unit to:', option.dataset.unit);
                }
                
                descriptionDropdown.appendChild(option);
            });
            
            // Remove existing change event listeners by replacing the element
            const parent = descriptionDropdown.parentNode;
            const newDropdown = descriptionDropdown.cloneNode(true);
            parent.replaceChild(newDropdown, descriptionDropdown);
            
            // Add change event listener to the new dropdown
            const dropdown = document.getElementById('descriptionDropdown');
            if (dropdown) {
                dropdown.addEventListener('change', function() {
                    const selectedOption = this.options[this.selectedIndex];
                    const row = this.closest('tr');
                    
                    console.log('=== DESCRIPTION DROPDOWN CHANGED ===');
                    console.log('Selected:', selectedOption.value);
                    console.log('Dataset unit:', selectedOption.dataset.unit);
                    console.log('Dataset price:', selectedOption.dataset.price);
                    
                    // Set unit
                    const unitDisplay = row.querySelector('.unit-display');
                    console.log('Unit display element:', unitDisplay);
                    if (unitDisplay && selectedOption.dataset.unit) {
                        unitDisplay.value = selectedOption.dataset.unit;
                        console.log('Set unit display to:', unitDisplay.value);
                    } else {
                        console.log('Could not set unit - display:', unitDisplay, 'unit data:', selectedOption.dataset.unit);
                    }
                    
                    // Set price
                    const priceInput = row.querySelector('.price-input');
                    if (priceInput && selectedOption.dataset.price) {
                        priceInput.value = selectedOption.dataset.price;
                    }
                    
                    calculateRowTotal(row);
                    calculateTotals();
                });
            }
        } else {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'No products found for this package';
            option.disabled = true;
            descriptionDropdown.appendChild(option);
        }
        
        // Also populate all existing product dropdowns in additional rows
        await populateAllProductDropdowns(packageTypeName);
        
    } catch (error) {
        console.error('Error loading products for package:', error);
        descriptionDropdown.innerHTML = '<option value="" selected disabled>Error loading products</option>';
    }
}

// New function to populate all product dropdowns when package type changes
// Populate product dropdowns with ALL non-License products from database
async function populateAllProductDropdowns(packageTypeName) {
    const productDropdowns = document.querySelectorAll('.product-dropdown');
    
    // Fetch ALL products from database (not just package products)
    const allProducts = await getProducts();
    
    console.log('populateAllProductDropdowns - found', productDropdowns.length, 'dropdowns');
    console.log('All products from database:', allProducts);
    
    productDropdowns.forEach((dropdown, index) => {
        dropdown.innerHTML = '<option value="" selected disabled>Select product</option>';
        
        if (allProducts && allProducts.length > 0) {
            // Filter to only show non-License products
            const filteredProducts = allProducts.filter(product => {
                if (!product.unit) {
                    console.log('Skipping product (no unit):', product.name);
                    return false;
                }
                const isLicense = product.unit.toLowerCase() === 'license';
                console.log('Product:', product.name, 'Unit:', product.unit, 'Is License?', isLicense);
                return !isLicense; // Keep non-License products
            });
            
            console.log('Dropdown', index, '- filtered products:', filteredProducts.length, 'out of', allProducts.length);
            
            filteredProducts.forEach(product => {
                const option = document.createElement('option');
                option.value = product.name;
                option.textContent = product.name;
                
                // Set product data
                option.dataset.unit = product.unit || '';
                option.dataset.price = product.base_price || 0;
                option.dataset.description = product.description || '';
                
                dropdown.appendChild(option);
            });
            
            console.log('Dropdown', index, '- populated with', filteredProducts.length, 'options');
        }
    });
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
    const rows = document.querySelectorAll('tbody tr:not(#delivery-row)');
    let subtotal = 0;
    
    rows.forEach(row => {
        const qtyInput = row.querySelector('.qty-input');
        const priceInput = row.querySelector('.price-input');
        const totalCell = row.querySelector('.total-cell');
        
        if (qtyInput && priceInput && totalCell) {
            const qty = parseFloat(qtyInput.value) || 0;
            const price = parseFloat(priceInput.value) || 0;
            const total = qty * price;
            
            totalCell.textContent = total > 0 ? `₱${total.toLocaleString('en-PH', {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : '₱0.00';
            subtotal += total;
        }
    });
    
    // Add delivery row to subtotal
    const deliveryRow = document.getElementById('delivery-row');
    if (deliveryRow) {
        const deliveryQty = deliveryRow.querySelector('.delivery-qty-input');
        const deliveryPrice = deliveryRow.querySelector('.delivery-price-input');
        
        if (deliveryQty && deliveryPrice) {
            const qty = parseFloat(deliveryQty.value) || 0;
            const price = parseFloat(deliveryPrice.value) || 0;
            subtotal += (qty * price);
        }
    }
    
    const subtotalCell = document.getElementById('subtotal-cell');
    if (subtotalCell) {
        subtotalCell.textContent = `₱${subtotal.toLocaleString('en-PH', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    }
    
    // Also update discounted price (same as subtotal for now)
    const discountedCell = document.getElementById('discounted-price-cell');
    if (discountedCell) {
        discountedCell.textContent = `₱${subtotal.toLocaleString('en-PH', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
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
    
    // Add event listeners to all existing rows
    document.querySelectorAll('.product-row, #package-type-row').forEach(row => {
        const qtyInput = row.querySelector('.qty-input');
        const priceInput = row.querySelector('.price-input');
        const productDropdown = row.querySelector('.product-dropdown');
        
        if (productDropdown) {
            productDropdown.addEventListener('change', function() {
                const selectedOption = this.options[this.selectedIndex];
                const currentRow = this.closest('tr');
                
                console.log('Product selected:', selectedOption.value, 'Unit:', selectedOption.dataset.unit);
                
                // Set unit
                const unitDisplay = currentRow.querySelector('.unit-display');
                if (unitDisplay && selectedOption.dataset.unit) {
                    unitDisplay.value = selectedOption.dataset.unit;
                }
                
                // Set price
                const priceInput = currentRow.querySelector('.price-input');
                if (priceInput && selectedOption.dataset.price) {
                    priceInput.value = selectedOption.dataset.price;
                }
                
                calculateRowTotal(currentRow);
                calculateTotals();
            });
        }
        
        if (qtyInput) {
            qtyInput.addEventListener('input', function() {
                calculateRowTotal(row);
                calculateTotals();
            });
        }
        
        if (priceInput) {
            priceInput.addEventListener('input', function() {
                calculateRowTotal(row);
                calculateTotals();
            });
        }
    });
    
    // Add listener to description dropdown
    const descDropdown = document.getElementById('descriptionDropdown');
    if (descDropdown) {
        descDropdown.addEventListener('change', function() {
            const row = this.closest('tr');
            calculateRowTotal(row);
            calculateTotals();
        });
    }
    
    // Add event listeners for delivery row
    const deliveryQty = document.querySelector('.delivery-qty-input');
    const deliveryPrice = document.querySelector('.delivery-price-input');
    
    if (deliveryQty) {
        deliveryQty.addEventListener('input', function() {
            calculateDeliveryTotal();
            calculateTotals();
        });
    }
    
    if (deliveryPrice) {
        deliveryPrice.addEventListener('input', function() {
            calculateDeliveryTotal();
            calculateTotals();
        });
    }
    
    calculateTotals();
});

// Calculate delivery row total
function calculateDeliveryTotal() {
    const deliveryRow = document.getElementById('delivery-row');
    const qtyInput = deliveryRow.querySelector('.delivery-qty-input');
    const priceInput = deliveryRow.querySelector('.delivery-price-input');
    const totalCell = deliveryRow.querySelector('.delivery-total-cell');
    
    if (qtyInput && priceInput && totalCell) {
        const qty = parseFloat(qtyInput.value) || 0;
        const price = parseFloat(priceInput.value) || 0;
        const total = qty * price;
        
        if (total === 0) {
            totalCell.textContent = 'FREE';
            totalCell.style.color = '#28a745';
        } else {
            totalCell.textContent = '₱' + total.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            totalCell.style.color = '#000';
        }
    }
}

// Calculate total for a single row
function calculateRowTotal(row) {
    const qtyInput = row.querySelector('.qty-input');
    const priceInput = row.querySelector('.price-input');
    const totalCell = row.querySelector('.total-cell');
    
    if (qtyInput && priceInput && totalCell) {
        const qty = parseFloat(qtyInput.value) || 0;
        const price = parseFloat(priceInput.value) || 0;
        const total = qty * price;
        
        totalCell.textContent = '₱' + total.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
}