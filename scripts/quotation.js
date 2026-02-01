// scripts/quotation.js - LAP I.T. Solutions Quotation System

// Global variables
let products = [];
let categories = [];
let units = [];
let packageTypes = [];

// ✅ CHECK VIEW MODE IMMEDIATELY - Before any other code runs
const viewMode = localStorage.getItem('viewMode');
const viewQuotationData = localStorage.getItem('viewQuotationData');
const isViewMode = (viewMode === 'true' && viewQuotationData);

if (isViewMode) {
    console.log('🔵 VIEW MODE DETECTED - Quotation initialization will be skipped');
}

// Function to replace dropdown with wrapped text after selection
function handleDropdownSelection(selectElement) {
    console.log('handleDropdownSelection called for:', selectElement.id || selectElement.className);

    selectElement.addEventListener('change', function () {
        console.log('Dropdown changed, value:', this.value);

        if (this.value) {
            // Get selected option
            const selectedOption = this.options[this.selectedIndex];
            const selectedText = selectedOption.text;
            const productDescription = selectedOption.dataset.description || '';

            console.log('Selected text:', selectedText);
            console.log('Description:', productDescription);

            // Create a div to show the wrapped text
            const textDiv = document.createElement('div');
            textDiv.className = 'selected-dropdown-text';

            // Add product name
            const nameDiv = document.createElement('div');
            nameDiv.textContent = selectedText;
            nameDiv.style.fontWeight = 'bold';
            textDiv.appendChild(nameDiv);

            // Add product description if available
            if (productDescription) {
                // Split description by line breaks first
                let descLines = productDescription.split('\n').filter(line => line.trim());

                // If no line breaks found, try splitting by common patterns
                // Check if description looks like it has multiple items without line breaks
                if (descLines.length === 1 && productDescription.length > 50) {
                    // Try to intelligently split long descriptions
                    // Look for patterns like: "Item1 Item2 Item3" or "Feature: description Feature: description"
                    const singleLine = productDescription;

                    // Check for common patterns and split accordingly
                    // Pattern 1: Check if there are numbers like "15.6", "120GB" which usually indicate separate items
                    if (/\d+(?:GB|TB|MB|"|'|GHz|MHz|inch)/.test(singleLine)) {
                        // Split on common hardware specs patterns
                        descLines = singleLine.split(/(?<=\s)(?=\d+(?:GB|TB|MB|"|'|GHz|MHz|inch|months|year|warranty))/).filter(line => line.trim());
                    } else {
                        // Keep as single line if no clear pattern
                        descLines = [singleLine];
                    }
                }

                if (descLines.length > 0) {
                    const listContainer = document.createElement('div');
                    listContainer.style.cssText = `
                        font-size: 9px;
                        color: #666;
                        margin-top: 6px;
                        text-align: left;
                    `;

                    descLines.forEach(line => {
                        const listItem = document.createElement('div');
                        listItem.style.cssText = `
                            margin-bottom: 2px;
                            line-height: 1.4;
                            text-align: left;
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
                text-align: left;
            `;

            // Store the select element for later (in case we need to change it)
            textDiv.dataset.selectId = this.id || '';

            // Click to show dropdown again
            textDiv.addEventListener('click', function () {
                console.log('Text div clicked, showing dropdown again');
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

            console.log('Text div created and inserted');
        }
    });
}

// Get frequently used products based on actual usage in quotations
async function getFrequentlyUsedProducts() {
    try {
        // Query to get products used most frequently in quotations
        // Join quotation_items with products and count occurrences
        const { data, error } = await supabaseClient
            .from('quotation_items')
            .select(`
                product_id,
                product:products (
                    id,
                    name,
                    description,
                    unit,
                    base_price
                )
            `)
            .not('product_id', 'is', null); // Exclude delivery rows (which have null product_id)

        if (error) {
            console.error('Error fetching product usage:', error);
            return [];
        }

        if (!data || data.length === 0) {
            console.log('No product usage data found');
            return [];
        }

        // Count occurrences of each product
        const productCount = {};
        data.forEach(item => {
            if (item.product && item.product.id) {
                const productId = item.product.id;
                if (!productCount[productId]) {
                    productCount[productId] = {
                        count: 0,
                        product: item.product
                    };
                }
                productCount[productId].count++;
            }
        });

        // Convert to array and sort by count (most used first)
        const sortedProducts = Object.values(productCount)
            .sort((a, b) => b.count - a.count)
            .slice(0, 10) // Get top 10 most used products
            .map(item => item.product);

        console.log('Frequently used products (by usage):', sortedProducts);
        return sortedProducts;

    } catch (error) {
        console.error('Error in getFrequentlyUsedProducts:', error);
        return [];
    }
}

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

    // Add "Customize" option at the top
    const customizeOption = document.createElement('option');
    customizeOption.value = 'CUSTOMIZE';
    customizeOption.textContent = 'Customize (Build your own)';
    customizeOption.dataset.inclusions = 'Build your own custom package by selecting individual products below.';
    packageTypeSelect.appendChild(customizeOption);

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

        // Check if "Customize" was selected
        if (selectedVal === 'CUSTOMIZE') {
            console.log('Customize option selected - clearing all fields');

            // Update inclusions text
            if (typeInclusions) {
                typeInclusions.textContent = 'Add your custom items below.';
                typeInclusions.style.color = '#1976d2';
                typeInclusions.style.fontStyle = 'italic';
            }

            // Call the handleCustomizePackage function to clear everything
            if (typeof handleCustomizePackage === 'function') {
                handleCustomizePackage();
            }

            return;
        }

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
    const tbody = document.getElementById('quotation-tbody');
    const packageRow = document.getElementById('package-type-row');
    const deliveryRow = document.getElementById('delivery-row');

    if (!tbody || !packageRow) return;

    try {
        // Fetch package items from Supabase
        const packageItems = await getPackageItems(packageTypeName);

        console.log('Package items for', packageTypeName, ':', packageItems);

        if (!packageItems || packageItems.length === 0) {
            alert('No products found for this package type');
            return;
        }

        // ✅ NEW: Get the package total price from packageTypes
        const selectedPackage = packageTypes.find(p => p.name === packageTypeName);
        const packageTotalPrice = selectedPackage ? (selectedPackage.package_price || 0) : 0;

        console.log('Selected package:', selectedPackage);
        console.log('Package total price:', packageTotalPrice);

        // Clear all existing product rows (but keep package row and delivery row)
        const existingProductRows = tbody.querySelectorAll('.product-row');
        existingProductRows.forEach(row => row.remove());

        // Sort items: License first, Set second, then others
        const sortedItems = packageItems.sort((a, b) => {
            const aUnit = (a.product && a.product.unit ? a.product.unit.toLowerCase() : '');
            const bUnit = (b.product && b.product.unit ? b.product.unit.toLowerCase() : '');

            const aIsLicense = aUnit === 'license';
            const bIsLicense = bUnit === 'license';
            const aIsSet = aUnit === 'set';
            const bIsSet = bUnit === 'set';

            // License comes first
            if (aIsLicense && !bIsLicense) return -1;
            if (!aIsLicense && bIsLicense) return 1;

            // Set comes second (after License)
            if (aIsSet && !bIsSet && !bIsLicense) return -1;
            if (!aIsSet && bIsSet && !aIsLicense) return 1;

            // Everything else stays in original order
            return 0;
        });

        console.log('Sorted items:', sortedItems);

        // Populate the first row (package-type-row) with the first product (License)
        if (sortedItems.length > 0) {
            const firstItem = sortedItems[0];
            console.log('Populating first row with:', firstItem);

            // Update quantity
            const qtyInput = packageRow.querySelector('.qty-input');
            if (qtyInput) qtyInput.value = 1;

            // Update unit
            const unitDisplay = packageRow.querySelector('.unit-display');
            if (unitDisplay && firstItem.product) {
                unitDisplay.value = firstItem.product.unit || '';
                console.log('Set unit to:', firstItem.product.unit);
            }

            // Update description - replace the placeholder div content
            const descriptionDiv = document.getElementById('description-display');

            if (descriptionDiv) {
                // Build description HTML with product name and checkmarks
                let descriptionHTML = `<div style="font-weight: bold; font-size: 10px; margin-bottom: 4px;">${firstItem.product_name}</div>`;
                if (firstItem.product && firstItem.product.description) {
                    const descLines = firstItem.product.description.split('\n').filter(line => line.trim());
                    if (descLines.length > 0) {
                        descriptionHTML += '<div style="font-size: 9px; color: #666;">';
                        descLines.forEach(line => {
                            descriptionHTML += `<div style="margin-bottom: 2px;">✓ ${line.trim()}</div>`;
                        });
                        descriptionHTML += '</div>';
                    }
                }

                // Replace the content of the description div
                descriptionDiv.innerHTML = descriptionHTML;
                descriptionDiv.style.color = '#000';
                descriptionDiv.style.fontStyle = 'normal';
            }

            // Store product info in the row
            packageRow.dataset.productId = firstItem.product ? firstItem.product.id : '';
            packageRow.dataset.productName = firstItem.product_name;

            // ✅ UPDATE PRICE: Show package total price in first row
            const priceInput = packageRow.querySelector('.price-input');
            if (priceInput) {
                priceInput.value = packageTotalPrice; // ← Use package price from database
                console.log('Set package total price to:', packageTotalPrice);
            }

            // Calculate total for first row
            calculateRowTotal(packageRow);
        }

        // Create rows for remaining products (starting from index 1)
        let previousRow = packageRow; // Start from the package-type-row

        for (let i = 1; i < sortedItems.length; i++) {
            const item = sortedItems[i];
            console.log('Creating row', i, 'for item:', item.product_name);

            // Create new product row
            const newRow = document.createElement('tr');
            newRow.className = 'product-row';
            newRow.dataset.productId = item.product ? item.product.id : '';
            newRow.dataset.productName = item.product_name;

            // Build description HTML with checkmarks
            let descriptionHTML = `<div style="font-weight: bold; font-size: 10px; padding: 5px;">${item.product_name}</div>`;
            if (item.product && item.product.description) {
                const descLines = item.product.description.split('\n').filter(line => line.trim());
                if (descLines.length > 0) {
                    descriptionHTML += '<div style="font-size: 9px; color: #666; padding: 2px 5px;">';
                    descLines.forEach(line => {
                        descriptionHTML += `<div style="margin-bottom: 2px;">✓ ${line.trim()}</div>`;
                    });
                    descriptionHTML += '</div>';
                }
            }

            // ✅ SET PRICE TO 0 FOR ALL OTHER PRODUCTS
            newRow.innerHTML = `
                <td class="item-number-cell" style="text-align: center; font-weight: bold; font-size: 12px;"></td>
                <td><input type="number" value="1" min="0" class="qty-input" style="width: 50px; font-size: 10px; padding: 2px 4px; border: 1px solid #ccc; border-radius: 3px; text-align: right;"></td>
                <td><input type="text" value="${item.product && item.product.unit ? item.product.unit : ''}" class="unit-display" readonly style="font-size: 10px; padding: 2px 4px; border: 1px solid #e0e0e0; border-radius: 3px; background: #f5f5f5; width: 100%; text-align: center;"></td>
                <td>${descriptionHTML}</td>
                <td><input type="number" value="0" step="0.01" class="price-input" style="width: 80px; font-size: 10px; padding: 2px 4px; border: 1px solid #ccc; border-radius: 3px; text-align: right;"></td>
                <td class="total-cell" style="text-align: right; font-weight: bold;">₱0.00</td>
                <td class="no-print"><button onclick="deleteRow(this)" style="background: #dc3545; color: white; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer; font-size: 10px;">Delete</button></td>
            `;

            // Insert right after the previous row
            previousRow.insertAdjacentElement('afterend', newRow);

            // Update previousRow for next iteration
            previousRow = newRow;

            // Add event listeners to the new row
            setupRowEventListeners(newRow);

            // Calculate total for this row
            calculateRowTotal(newRow);

            console.log('Row', i, 'inserted successfully');
        }

        // Recalculate all totals
        calculateTotals();
        updateTotalItemsCount();
        updateItemNumbers();

        console.log('Finished loading', sortedItems.length, 'products');

    } catch (error) {
        console.error('Error loading products for package:', error);
        alert('Error loading products: ' + error.message);
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

            // ✅ UPDATED: Show empty cell when zero (not ₱0.00)
            if (total > 0) {
                totalCell.textContent = `₱${total.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            } else {
                totalCell.innerHTML = ''; // ← Empty cell
            }
            subtotal += total;
        }
    });

    // Add delivery row to subtotal (qty is always 1, no input field)
    const deliveryRow = document.getElementById('delivery-row');
    if (deliveryRow) {
        const deliveryPrice = deliveryRow.querySelector('.delivery-price-input');

        if (deliveryPrice) {
            const price = parseFloat(deliveryPrice.value) || 0;
            subtotal += price; // qty is always 1
        }
    }

    // Update subtotal input
    const subtotalInput = document.getElementById('subtotal-input');
    if (subtotalInput) {
        subtotalInput.value = subtotal.toFixed(2);
    }

    // Get on-site delivery and discount values
    const onsiteDeliveryInput = document.getElementById('onsite-delivery-input');
    const discountInput = document.getElementById('discount-input');

    const onsiteDelivery = onsiteDeliveryInput ? parseFloat(onsiteDeliveryInput.value) || 0 : 0;
    const discount = discountInput ? parseFloat(discountInput.value) || 0 : 0;

    // Calculate final total: subtotal + on-site delivery - discount
    const totalPackagePrice = subtotal + onsiteDelivery - discount;

    // Update total package price input
    const totalPackagePriceInput = document.getElementById('total-package-price-input');
    if (totalPackagePriceInput) {
        totalPackagePriceInput.value = totalPackagePrice.toFixed(2);
    }

    // Update total items count
    updateTotalItemsCount();
}

// Calculate total when inputs are manually changed
function calculateTotalFromInputs() {
    const subtotalInput = document.getElementById('subtotal-input');
    const onsiteDeliveryInput = document.getElementById('onsite-delivery-input');
    const discountInput = document.getElementById('discount-input');
    const totalPackagePriceInput = document.getElementById('total-package-price-input');

    // ✅ UPDATED: Remove peso signs and commas before parsing
    const subtotal = subtotalInput ? parseFloat(subtotalInput.value.replace(/[₱,]/g, '')) || 0 : 0;
    const onsiteDelivery = onsiteDeliveryInput ? parseFloat(onsiteDeliveryInput.value.replace(/[₱,]/g, '')) || 0 : 0;
    const discount = discountInput ? parseFloat(discountInput.value.replace(/[₱,]/g, '')) || 0 : 0;

    // Calculate total: subtotal + on-site delivery - discount
    const totalPackagePrice = subtotal + onsiteDelivery - discount;

    // ✅ UPDATED: Format with peso sign and smart decimals
    if (totalPackagePriceInput) {
        // Check if total has decimals
        const hasDecimals = totalPackagePrice % 1 !== 0;

        if (hasDecimals) {
            totalPackagePriceInput.value = '₱' + totalPackagePrice.toLocaleString('en-PH', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
            });
        } else {
            totalPackagePriceInput.value = '₱' + totalPackagePrice.toLocaleString('en-PH', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            });
        }
    }
}

// Validate that total package price makes sense (optional warning)
function validateTotalPackagePrice() {
    const subtotalInput = document.getElementById('subtotal-input');
    const onsiteDeliveryInput = document.getElementById('onsite-delivery-input');
    const discountInput = document.getElementById('discount-input');
    const totalPackagePriceInput = document.getElementById('total-package-price-input');

    const subtotal = subtotalInput ? parseFloat(subtotalInput.value) || 0 : 0;
    const onsiteDelivery = onsiteDeliveryInput ? parseFloat(onsiteDeliveryInput.value) || 0 : 0;
    const discount = discountInput ? parseFloat(discountInput.value) || 0 : 0;
    const totalPackagePrice = totalPackagePriceInput ? parseFloat(totalPackagePriceInput.value) || 0 : 0;

    const expectedTotal = subtotal + onsiteDelivery - discount;

    // If manually edited total doesn't match calculation, just accept it
    // (User may have a specific reason for the custom total)
    console.log('Expected total:', expectedTotal, 'Actual total:', totalPackagePrice);
}

// Update total items count in the "No. of Items" cell
function updateTotalItemsCount() {
    const tbody = document.getElementById('quotation-tbody');
    if (!tbody) return;

    let totalItems = 0;

    // Get all rows except delivery row
    const rows = tbody.querySelectorAll('tr:not(#delivery-row)');
    rows.forEach(row => {
        const qtyInput = row.querySelector('.qty-input');
        if (qtyInput) {
            totalItems += parseFloat(qtyInput.value) || 0;
        }
    });

    // Update the total items cell (if it exists)
    const totalItemsCell = document.getElementById('total-items-cell');
    if (totalItemsCell) {
        totalItemsCell.textContent = totalItems;
    }
}

// Save quotation to Supabase
// Updated saveQuotation function - saves quotation AND its items
// Replace your existing saveQuotation() function with this

// Updated saveQuotation function - uses product_id instead of storing names/descriptions
// Replace your existing saveQuotation() function in scripts/quotation.js with this

async function saveQuotation() {
    try {
        // Get employee name
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

        // Get client information
        const clientName = document.querySelector('.client-info input[placeholder="Enter recipient name"]').value;
        const officeAddress = document.querySelector('.client-info input[placeholder="Enter office address"]').value;
        const contactPerson = document.querySelector('.client-info input[placeholder="Enter contact person"]').value;
        const contactNumber = document.querySelector('.client-info input[placeholder="Enter contact number"]').value;

        if (!clientName || !officeAddress || !contactPerson || !contactNumber) {
            alert('Please fill in all client information fields.');
            return;
        }

        // Get package type
        const packageTypeSelect = document.getElementById('packageType');
        const packageType = packageTypeSelect.options[packageTypeSelect.selectedIndex]?.text || '';

        // Get quotation date
        const quotationDate = document.getElementById('quote-date').textContent;

        // Get total amounts
        const subtotalInput = document.getElementById('subtotal-input');
        const subtotal = subtotalInput ? parseFloat(subtotalInput.value) || 0 : 0;

        const totalPackagePriceInput = document.getElementById('total-package-price-input');
        const totalPackagePrice = totalPackagePriceInput ? parseFloat(totalPackagePriceInput.value) || 0 : 0;

        // Get onsite delivery and discount
        const onsiteDeliveryInput = document.getElementById('onsite-delivery-input');
        const discountInput = document.getElementById('discount-input');
        const onsiteDelivery = onsiteDeliveryInput ? parseFloat(onsiteDeliveryInput.value) || 0 : 0;
        const discount = discountInput ? parseFloat(discountInput.value) || 0 : 0;

        console.log('Saving quotation with employee_name:', employeeName);
        console.log('Package type:', packageType);

        // STEP 1: Save the main quotation
        const quotationPayload = {
            quotation_no: quotationNo,
            quotation_date: quotationDate,
            client_name: clientName,
            office_address: officeAddress,
            contact_person: contactPerson,
            contact_number: contactNumber,
            package_type: packageType,
            total: totalPackagePrice,
            discount: discount,
            employee_name: employeeName,
            status: 'pending'
        };

        console.log('Quotation payload:', quotationPayload);

        const quotation = await createQuotation(quotationPayload);

        if (!quotation || !quotation.id) {
            alert('Error: Failed to save quotation. No response from server.');
            return;
        }

        console.log('Quotation saved successfully:', quotation);

        // STEP 2: Collect all quotation items with product_id lookup
        const items = [];
        let rowOrder = 0;

        // Get package type row (first row)
        const packageRow = document.getElementById('package-type-row');
        if (packageRow) {
            const packageQty = parseFloat(packageRow.querySelector('.qty-input')?.value) || 0;
            const packagePrice = parseFloat(packageRow.querySelector('.price-input')?.value) || 0;
            const packageTotal = parseFloat(packageRow.querySelector('.total-cell')?.textContent.replace(/[₱,]/g, '')) || 0;

            // Get the selected product name from description dropdown
            const packageDesc = document.getElementById('descriptionDropdown');
            const packageProductName = packageDesc?.options[packageDesc.selectedIndex]?.value || '';

            // Look up product_id from product name
            let packageProductId = null;
            if (packageProductName) {
                const { data: productData, error: productError } = await supabaseClient
                    .from('products')
                    .select('id')
                    .eq('name', packageProductName)
                    .single();

                if (!productError && productData) {
                    packageProductId = productData.id;
                }
            }

            items.push({
                quotation_id: quotation.id,
                product_id: packageProductId,
                row_type: 'package',
                quantity: packageQty,
                price: packagePrice,
                total: packageTotal,
                row_order: rowOrder++
            });
        }

        // Get all product rows
        const productRows = document.querySelectorAll('.product-row');
        for (const row of productRows) {
            const qty = parseFloat(row.querySelector('.qty-input')?.value) || 0;

            // Only save rows that have a quantity > 0
            if (qty > 0) {
                const dropdown = row.querySelector('.product-dropdown');
                const productName = dropdown?.options[dropdown.selectedIndex]?.value || '';
                const price = parseFloat(row.querySelector('.price-input')?.value) || 0;
                const total = parseFloat(row.querySelector('.total-cell')?.textContent.replace(/[₱,]/g, '')) || 0;

                // Look up product_id from product name
                let productId = null;
                if (productName) {
                    const { data: productData, error: productError } = await supabaseClient
                        .from('products')
                        .select('id')
                        .eq('name', productName)
                        .single();

                    if (!productError && productData) {
                        productId = productData.id;
                    }
                }

                items.push({
                    quotation_id: quotation.id,
                    product_id: productId,
                    row_type: 'product',
                    quantity: qty,
                    price: price,
                    total: total,
                    row_order: rowOrder++
                });
            }
        }

        // Get delivery row (delivery is not a product, so product_id will be NULL)
        const deliveryRow = document.getElementById('delivery-row');
        if (deliveryRow) {
            const deliveryPrice = parseFloat(deliveryRow.querySelector('.delivery-price-input')?.value) || 0;
            const deliveryTotal = deliveryRow.querySelector('.delivery-total-cell')?.textContent || 'FREE';
            const deliveryTotalNum = deliveryTotal === 'FREE' ? 0 : parseFloat(deliveryTotal.replace(/[₱,]/g, '')) || 0;

            items.push({
                quotation_id: quotation.id,
                product_id: null, // Delivery is not a product
                row_type: 'delivery',
                quantity: 1,
                price: deliveryPrice,
                total: deliveryTotalNum,
                row_order: rowOrder++
            });
        }

        console.log('Items to save:', items);

        // STEP 3: Save all items to database
        if (items.length > 0) {
            const { data: savedItems, error: itemsError } = await supabaseClient
                .from('quotation_items')
                .insert(items)
                .select();

            if (itemsError) {
                console.error('Error saving quotation items:', itemsError);
                alert('Quotation saved, but failed to save items: ' + itemsError.message);
                return;
            }

            console.log('Items saved successfully:', savedItems);
        }

        // Success!
        alert(`Quotation saved successfully!\n\nQuotation No: ${quotation.quotation_no || quotationNo}\nPackage Type: ${packageType}\nItems Saved: ${items.length}`);

        // Clear the stored quotation number
        localStorage.removeItem('currentQuotationNumber');

    } catch (error) {
        console.error('Error saving quotation:', error);
        alert('Error saving quotation: ' + (error.message || 'Unknown error'));
    }
}

// Combined function: Save quotation AND print as PDF
async function saveAndPrintPDF() {
    try {
        // Call saveQuotation but suppress the default alert
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

        // Get client information
        const clientName = document.querySelector('.client-info input[placeholder="Enter recipient name"]').value;
        const officeAddress = document.querySelector('.client-info input[placeholder="Enter office address"]').value;
        const contactPerson = document.querySelector('.client-info input[placeholder="Enter contact person"]').value;
        const contactNumber = document.querySelector('.client-info input[placeholder="Enter contact number"]').value;

        if (!clientName || !officeAddress || !contactPerson || !contactNumber) {
            alert('Please fill in all client information fields.');
            return;
        }

        // Get package type
        const packageTypeSelect = document.getElementById('packageType');
        const packageType = packageTypeSelect.options[packageTypeSelect.selectedIndex]?.text || '';

        // Get quotation date
        const quotationDate = document.getElementById('quote-date').textContent;

        // Get total amounts
        const subtotalInput = document.getElementById('subtotal-input');
        const subtotal = subtotalInput ? parseFloat(subtotalInput.value) || 0 : 0;

        const totalPackagePriceInput = document.getElementById('total-package-price-input');
        const totalPackagePrice = totalPackagePriceInput ? parseFloat(totalPackagePriceInput.value) || 0 : 0;

        // Get onsite delivery and discount
        const onsiteDeliveryInput = document.getElementById('onsite-delivery-input');
        const discountInput = document.getElementById('discount-input');
        const onsiteDelivery = onsiteDeliveryInput ? parseFloat(onsiteDeliveryInput.value) || 0 : 0;
        const discount = discountInput ? parseFloat(discountInput.value) || 0 : 0;

        console.log('Saving quotation with employee_name:', employeeName);
        console.log('Package type:', packageType);

        // STEP 1: Save the main quotation
        const quotationPayload = {
            quotation_no: quotationNo,
            quotation_date: quotationDate,
            client_name: clientName,
            office_address: officeAddress,
            contact_person: contactPerson,
            contact_number: contactNumber,
            package_type: packageType,
            total: totalPackagePrice,
            discount: discount,
            employee_name: employeeName,
            status: 'pending'
        };

        console.log('Quotation payload:', quotationPayload);

        const quotation = await createQuotation(quotationPayload);

        if (!quotation || !quotation.id) {
            alert('Error: Failed to save quotation. No response from server.');
            return;
        }

        console.log('Quotation saved successfully:', quotation);

        // STEP 2: Collect all quotation items with product_id lookup
        const items = [];
        let rowOrder = 0;

        // Get package type row (first row)
        const packageRow = document.getElementById('package-type-row');
        if (packageRow) {
            const packageQty = parseFloat(packageRow.querySelector('.qty-input')?.value) || 0;
            const packagePrice = parseFloat(packageRow.querySelector('.price-input')?.value) || 0;
            const packageTotal = parseFloat(packageRow.querySelector('.total-cell')?.textContent.replace(/[₱,]/g, '')) || 0;

            // Get the selected product name from description dropdown
            const packageDesc = document.getElementById('descriptionDropdown');
            const packageProductName = packageDesc?.options[packageDesc.selectedIndex]?.value || '';

            // Look up product_id from product name
            let packageProductId = null;
            if (packageProductName) {
                const { data: productData, error: productError } = await supabaseClient
                    .from('products')
                    .select('id')
                    .eq('name', packageProductName)
                    .single();

                if (!productError && productData) {
                    packageProductId = productData.id;
                }
            }

            items.push({
                quotation_id: quotation.id,
                product_id: packageProductId,
                row_type: 'package',
                quantity: packageQty,
                price: packagePrice,
                total: packageTotal,
                row_order: rowOrder++
            });
        }

        // Get all product rows
        const productRows = document.querySelectorAll('.product-row');
        for (const row of productRows) {
            const qty = parseFloat(row.querySelector('.qty-input')?.value) || 0;

            // Only save rows that have a quantity > 0
            if (qty > 0) {
                const dropdown = row.querySelector('.product-dropdown');
                const productName = dropdown?.options[dropdown.selectedIndex]?.value || '';
                const price = parseFloat(row.querySelector('.price-input')?.value) || 0;
                const total = parseFloat(row.querySelector('.total-cell')?.textContent.replace(/[₱,]/g, '')) || 0;

                // Look up product_id from product name
                let productId = null;
                if (productName) {
                    const { data: productData, error: productError } = await supabaseClient
                        .from('products')
                        .select('id')
                        .eq('name', productName)
                        .single();

                    if (!productError && productData) {
                        productId = productData.id;
                    }
                }

                items.push({
                    quotation_id: quotation.id,
                    product_id: productId,
                    row_type: 'product',
                    quantity: qty,
                    price: price,
                    total: total,
                    row_order: rowOrder++
                });
            }
        }

        // Get delivery row (delivery is not a product, so product_id will be NULL)
        const deliveryRow = document.getElementById('delivery-row');
        if (deliveryRow) {
            const deliveryPrice = parseFloat(deliveryRow.querySelector('.delivery-price-input')?.value) || 0;
            const deliveryTotal = deliveryRow.querySelector('.delivery-total-cell')?.textContent || 'FREE';
            const deliveryTotalNum = deliveryTotal === 'FREE' ? 0 : parseFloat(deliveryTotal.replace(/[₱,]/g, '')) || 0;

            items.push({
                quotation_id: quotation.id,
                product_id: null, // Delivery is not a product
                row_type: 'delivery',
                quantity: 1,
                price: deliveryPrice,
                total: deliveryTotalNum,
                row_order: rowOrder++
            });
        }

        console.log('Items to save:', items);

        // STEP 3: Save all items to database
        if (items.length > 0) {
            const { data: savedItems, error: itemsError } = await supabaseClient
                .from('quotation_items')
                .insert(items)
                .select();

            if (itemsError) {
                console.error('Error saving quotation items:', itemsError);
                alert('Quotation saved, but failed to save items: ' + itemsError.message);
                return;
            }

            console.log('Items saved successfully:', savedItems);
        }

        // Clear the stored quotation number
        localStorage.removeItem('currentQuotationNumber');

        // Now trigger the print dialog
        console.log('Quotation saved successfully. Opening print dialog...');
        setTimeout(() => {
            window.print();
        }, 500);

    } catch (error) {
        console.error('Error in saveAndPrintPDF:', error);
        alert('Error saving quotation: ' + (error.message || 'Unknown error'));
    }
}

// For print: ensure the wrapped text shows instead of dropdown
document.addEventListener('DOMContentLoaded', function () {
    console.log('Page loaded, initializing...');

    // ✅ CHECK: Don't initialize if in view mode
    if (isViewMode) {
        console.log('🔵 View mode active - skipping new quotation initialization');
        return;
    }

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
            productDropdown.addEventListener('change', function () {
                const selectedOption = this.options[this.selectedIndex];
                const currentRow = this.closest('tr');

                console.log('Product selected:', selectedOption.value, 'Unit:', selectedOption.dataset.unit);
                console.log('Product description:', selectedOption.dataset.description);

                // Auto-set quantity to 1 when product is selected
                const qtyInput = currentRow.querySelector('.qty-input');
                if (qtyInput && parseFloat(qtyInput.value) === 0) {
                    qtyInput.value = 1;
                }

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
                updateItemNumbers();
            });
        }

        if (qtyInput) {
            qtyInput.addEventListener('input', function () {
                calculateRowTotal(row);
                calculateTotals();
                updateItemNumbers();
            });
        }

        if (priceInput) {
            priceInput.addEventListener('input', function () {
                calculateRowTotal(row);
                calculateTotals();
            });
        }
    });

    // Add listener to description dropdown
    const descDropdown = document.getElementById('descriptionDropdown');
    if (descDropdown) {
        descDropdown.addEventListener('change', function () {
            const row = this.closest('tr');
            calculateRowTotal(row);
            calculateTotals();
        });
    }

    // Add event listeners for delivery row (only price, qty is always 1)
    const deliveryPrice = document.querySelector('.delivery-price-input');

    if (deliveryPrice) {
        deliveryPrice.addEventListener('input', function () {
            calculateDeliveryTotal();
            calculateTotals();
        });
    }

    calculateTotals();
    updateItemNumbers();
});

// Calculate delivery row total
function calculateDeliveryTotal() {
    const deliveryRow = document.getElementById('delivery-row');
    const priceInput = deliveryRow.querySelector('.delivery-price-input');
    const totalCell = deliveryRow.querySelector('.delivery-total-cell');

    if (priceInput && totalCell) {
        const price = parseFloat(priceInput.value) || 0;
        const total = price; // qty is always 1

        if (total === 0) {
            totalCell.textContent = 'FREE';
            totalCell.style.color = '#28a745';
        } else {
            totalCell.textContent = '₱' + total.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            totalCell.style.color = '#000';
        }
    }
}

// For print: ensure the wrapped text shows instead of dropdown
window.addEventListener('beforeprint', function () {
    console.log('=== BEFORE PRINT EVENT ===');

    // Show wrapped text divs
    document.querySelectorAll('.selected-dropdown-text').forEach(function (div) {
        div.style.display = 'block';
    });

    // Hide dropdowns that have wrapped text replacements
    document.querySelectorAll('#packageType, #descriptionDropdown, .product-dropdown').forEach(function (select) {
        if (select.nextElementSibling && select.nextElementSibling.classList.contains('selected-dropdown-text')) {
            select.style.display = 'none';
        }
    });

    // Ensure unit-display inputs are visible
    document.querySelectorAll('.unit-display').forEach(function (input) {
        input.style.display = 'block';
        input.style.visibility = 'visible';
        input.style.border = 'none';
        input.style.background = 'transparent';
    });

    // Show price inputs only when qty > 1
    document.querySelectorAll('.product-row, #package-type-row').forEach(function (row, index) {
        const qtyInput = row.querySelector('.qty-input');
        const priceInput = row.querySelector('.price-input');

        if (qtyInput && priceInput) {
            const qty = parseFloat(qtyInput.value) || 0;
            console.log('Row', index, '- Qty:', qty, 'Price input:', priceInput.value);

            if (qty > 1) {
                priceInput.classList.add('show-in-print');
                console.log('Row', index, '- Added show-in-print class');
            } else {
                priceInput.classList.remove('show-in-print');
                console.log('Row', index, '- Removed show-in-print class (qty <= 1)');
            }
        }
    });

    console.log('=== END BEFORE PRINT ===');
});

// After print: restore dropdown display if needed
window.addEventListener('afterprint', function () {
    // Optionally restore dropdowns after printing
});

// Calculate total for a single row
function calculateRowTotal(row) {
    const qtyInput = row.querySelector('.qty-input');
    const priceInput = row.querySelector('.price-input');
    const totalCell = row.querySelector('.total-cell');

    if (qtyInput && priceInput && totalCell) {
        const qty = parseFloat(qtyInput.value) || 0;
        const price = parseFloat(priceInput.value) || 0;
        const total = qty * price;

        // ✅ UPDATED: Use innerHTML to make cell truly empty (no text node)
        if (total > 0) {
            totalCell.textContent = '₱' + total.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
        } else {
            totalCell.innerHTML = ''; // ← Completely empty HTML
        }
    }
}
// Update item numbers sequentially (skip rows with qty = 0)
function updateItemNumbers() {
    const tbody = document.getElementById('quotation-tbody');
    if (!tbody) return;

    let itemNumber = 1;

    // Get all rows
    const allRows = tbody.querySelectorAll('tr');

    allRows.forEach(row => {
        // Skip delivery row
        if (row.id === 'delivery-row') {
            const itemCell = row.querySelector('td:first-child');
            if (itemCell) itemCell.textContent = '';
            return;
        }

        // Get quantity
        const qtyInput = row.querySelector('.qty-input');
        const qty = qtyInput ? parseFloat(qtyInput.value) || 0 : 0;

        // Get the first cell (item number cell)
        const itemCell = row.querySelector('td:first-child');

        if (itemCell) {
            if (qty > 0) {
                // Has quantity - assign number
                itemCell.textContent = itemNumber;
                itemCell.style.textAlign = 'center';
                itemCell.style.fontWeight = 'bold';
                itemCell.style.fontSize = '12px';
                itemNumber++;
            } else {
                // No quantity - clear number
                itemCell.textContent = '';
            }
        }
    });

    console.log('Item numbers updated. Total items:', itemNumber - 1);
}
