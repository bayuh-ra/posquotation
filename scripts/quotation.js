// scripts/quotation.js - LAP I.T. Solutions Quotation System

// Global variables
let products = [];
let categories = [];
let units = [];
let packageTypes = [];
let __dataLoadPromise = null;

function formatPHP(amount) {
    const n = Number(amount) || 0;
    return '₱' + n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parsePHP(value) {
    if (value == null) return 0;
    return parseFloat(String(value).replace(/[₱,]/g, '').trim()) || 0;
}

// âœ… CHECK VIEW MODE IMMEDIATELY - Before any other code runs
const viewMode = localStorage.getItem('viewMode');
const viewQuotationData = localStorage.getItem('viewQuotationData');
const isViewMode = (viewMode === 'true' && viewQuotationData);

if (isViewMode) {
    console.log('ðŸ”µ VIEW MODE DETECTED - Quotation initialization will be skipped');
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
                        // Replace leading dash or bullet with checkmark, or prepend checkmark if not present
                        let cleanLine = line.trim();
                        if (/^[-•]/.test(cleanLine)) {
                            cleanLine = cleanLine.replace(/^[-•]\s*/, '&#10003; ');
                        } else if (!/^(&#10003;|✓)/.test(cleanLine)) {
                            cleanLine = '&#10003; ' + cleanLine;
                        }
                        listItem.innerHTML = cleanLine;
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

function ensureDataLoaded() {
    if (!__dataLoadPromise) __dataLoadPromise = loadData();
    return __dataLoadPromise;
}

function setInputValueIfPresent(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value ?? '';
}

function getResolvedPackageTypeValue(packageTypeText) {
    const packageTypeSelect = document.getElementById('packageType');
    if (!packageTypeSelect || !packageTypeText) return null;

    for (let i = 0; i < packageTypeSelect.options.length; i++) {
        const opt = packageTypeSelect.options[i];
        if (opt.text === packageTypeText || opt.value === packageTypeText) return opt.value;
    }
    return null;
}

function applyPackageTypeToUI(packageTypeText) {
    const resolvedValue = getResolvedPackageTypeValue(packageTypeText);

    const packageTypeSelect = document.getElementById('packageType');
    if (packageTypeSelect && resolvedValue) packageTypeSelect.value = resolvedValue;

    const setupSelect = document.getElementById('setup-package-type');
    if (setupSelect && resolvedValue) setupSelect.value = resolvedValue;

    const pkgText = document.getElementById('pkg-dd-text');
    if (pkgText && packageTypeText) pkgText.textContent = packageTypeText;
}

async function enrichQuotationItems(items) {
    if (!Array.isArray(items) || items.length === 0) return [];

    const ids = Array.from(new Set(items.map(i => i?.product_id).filter(Boolean))).map(Number);
    const productMap = new Map();

    // Seed from already loaded products
    if (Array.isArray(products)) {
        products.forEach(p => {
            if (p && p.id != null) productMap.set(Number(p.id), p);
        });
    }

    const missingIds = ids.filter(id => !productMap.has(Number(id)));
    if (missingIds.length > 0) {
        try {
            const { data, error } = await supabaseClient
                .from('products')
                .select('id,name,unit,description,base_price')
                .in('id', missingIds);
            if (error) throw error;
            (data || []).forEach(p => productMap.set(Number(p.id), p));
        } catch (e) {
            console.error('Failed to enrich items with products:', e);
        }
    }

    return items.map(item => {
        const pid = item?.product_id ? Number(item.product_id) : null;
        const product = pid != null ? productMap.get(pid) : null;
        return { ...item, product };
    });
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

    // Also populate setup panel dropdown (split-panel create mode)
    const setupPackageSelect = document.getElementById('setup-package-type');
    if (setupPackageSelect) {
        setupPackageSelect.innerHTML = '<option value="" disabled selected>Select package type</option>';
        const setupCustomize = document.createElement('option');
        setupCustomize.value = 'CUSTOMIZE';
        setupCustomize.textContent = 'Customize (Build your own)';
        setupPackageSelect.appendChild(setupCustomize);
    }

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
            // Mirror to setup panel
            if (setupPackageSelect) {
                const opt2 = document.createElement('option');
                opt2.value = val;
                opt2.textContent = option.textContent;
                setupPackageSelect.appendChild(opt2);
            }
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

        // âœ… NEW: Get the package total price from packageTypes
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
                            descriptionHTML += `<div style="margin-bottom: 2px;">&#10003; ${line.trim()}</div>`;
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

            // âœ… UPDATE PRICE: Show package total price in first row
            const priceInput = packageRow.querySelector('.price-input');
            if (priceInput) {
                priceInput.value = packageTotalPrice; // â† Use package price from database
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
                        descriptionHTML += `<div style="margin-bottom: 2px;">&#10003; ${line.trim()}</div>`;
                    });
                    descriptionHTML += '</div>';
                }
            }

            // âœ… SET PRICE TO 0 FOR ALL OTHER PRODUCTS
            newRow.innerHTML = `
                <td class="item-number-cell" style="text-align: center; font-weight: bold; font-size: 12px;"></td>
                <td><input type="number" value="1" min="0" class="qty-input" style="width: 50px; font-size: 10px; padding: 2px 4px; border: 1px solid #ccc; border-radius: 3px; text-align: right;"></td>
                <td><input type="text" value="${item.product && item.product.unit ? item.product.unit : ''}" class="unit-display" readonly style="font-size: 10px; padding: 2px 4px; border: 1px solid #e0e0e0; border-radius: 3px; background: #f5f5f5; width: 100%; text-align: center;"></td>
                <td>${descriptionHTML}</td>
                <td><input type="number" value="0" step="0.01" class="price-input" style="width: 80px; font-size: 10px; padding: 2px 4px; border: 1px solid #ccc; border-radius: 3px; text-align: right;"></td>
                <td class="total-cell" style="text-align: right; font-weight: bold;"></td>
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

    // Check if we're in edit mode
    const editQuotationDataStr = localStorage.getItem('editQuotationData');
    if (editQuotationDataStr) {
        try {
            const editData = JSON.parse(editQuotationDataStr);
            if (editData.isEdit) {
                await ensureDataLoaded();
                await loadQuotationForEdit(editData);
                return;

            setTimeout(() => {
                    const quotationData = editData; // Use the data from localStorage
                    if (quotationData.template_dates) {
                        try {
                            const tDates = JSON.parse(quotationData.template_dates);
                            const allTemplateDateInputs = document.querySelectorAll('.qptpl-template-page input[type="date"]');
                            const dateValues = [tDates.amc_start, tDates.amc_end, tDates.sla_date, tDates.eula_date];

                            allTemplateDateInputs.forEach((input, index) => {
                                if (dateValues[index]) {
                                    input.value = dateValues[index];
                                    if (window.qptplFormatDate) window.qptplFormatDate(input);
                                }
                            });
                        } catch (e) {
                            console.error("Error parsing template dates:", e);
                        }
                    }
                }, 500);

            return;
        }


        } catch (error) {
            console.error('Error parsing edit quotation data:', error);
            // Clear invalid data
            localStorage.removeItem('editQuotationData');
        }
    }

    // Generate and display the next quotation number (only for new quotations)
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
                totalCell.textContent = formatPHP(total);
            } else {
                totalCell.innerHTML = ''; // â† Empty cell
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
        subtotalInput.value = formatPHP(subtotal);
    }

    // Get on-site delivery and discount values
    const onsiteDeliveryInput = document.getElementById('onsite-delivery-input');
    const discountInput = document.getElementById('discount-input');

    const onsiteDelivery = onsiteDeliveryInput ? parsePHP(onsiteDeliveryInput.value) : 0;
    const discount = discountInput ? parsePHP(discountInput.value) : 0;

    // Calculate final total: subtotal + on-site delivery - discount
    const totalPackagePrice = subtotal + onsiteDelivery - discount;

    // Update total package price input
    const totalPackagePriceInput = document.getElementById('total-package-price-input');
    if (totalPackagePriceInput) {
        totalPackagePriceInput.value = formatPHP(totalPackagePrice);
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
    const subtotal = subtotalInput ? parsePHP(subtotalInput.value) : 0;
    const onsiteDelivery = onsiteDeliveryInput ? parsePHP(onsiteDeliveryInput.value) : 0;
    const discount = discountInput ? parsePHP(discountInput.value) : 0;

    // Calculate total: subtotal + on-site delivery - discount
    const totalPackagePrice = subtotal + onsiteDelivery - discount;

    if (totalPackagePriceInput) {
        totalPackagePriceInput.value = formatPHP(totalPackagePrice);
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

// Helper function to get quotation by ID
async function getQuotationById(quotationId) {
    try {
        const { data, error } = await supabaseClient
            .from('quotations')
            .select('quotation_no')
            .eq('id', quotationId)
            .single();

        if (error) {
            console.error('Error fetching quotation:', error);
            return null;
        }

        return data;
    } catch (error) {
        console.error('Error in getQuotationById:', error);
        return null;
    }
}

async function saveQuotation() {
        try {
            // Check if we're in edit mode
            const editingQuotationId = localStorage.getItem('editingQuotationId');
            const isEditMode = !!editingQuotationId;

            // Get employee name
            const employeeName = localStorage.getItem('selectedEmployeeName');
            const quotationNo = isEditMode ?
                (await getQuotationById(editingQuotationId))?.quotation_no :
                localStorage.getItem('currentQuotationNumber');

            if (!employeeName) {
                showAlert('Error', 'No employee selected. Please go back to home and select an employee.', 'error');
                return;
            }

            if (!quotationNo) {
                showAlert('Error', 'Error: No quotation number found. Please refresh the page.', 'error');
                return;
            }

            // Get client information
            const clientName = document.querySelector('.client-info input[placeholder="Enter recipient name"]').value;
            const officeAddress = document.querySelector('.client-info input[placeholder="Enter office address"]').value;
            const contactPerson = document.querySelector('.client-info input[placeholder="Enter contact person"]').value;
            const contactNumber = document.querySelector('.client-info input[placeholder="Enter contact number"]').value;

            if (!clientName || !officeAddress || !contactPerson || !contactNumber) {
                showAlert('Missing Info', 'Please fill in all client information fields.', 'warning');
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

            const templateDatesObj = {
                amc_start: document.querySelector('input[type="date"][onchange*="qptplFormatDate"]')?.value || '',
                amc_end: document.querySelectorAll('input[type="date"][onchange*="qptplFormatDate"]')[1]?.value || '',
                sla_date: document.querySelector('.qptpl-template-page:nth-of-type(2) input[type="date"]')?.value || '',
                eula_date: document.querySelector('.qptpl-template-page:nth-of-type(3) input[type="date"]')?.value || ''
            };

            console.log('Saving quotation with employee_name:', employeeName);
            console.log('Package type:', packageType);
            console.log('Edit mode:', isEditMode);

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
                status: 'pending',
                template_dates: JSON.stringify(templateDatesObj)
            };

            console.log('Quotation payload:', quotationPayload);

            let quotation;
            if (isEditMode) {
                // Update existing quotation
                const { data: updatedQuotationArr, error: updateError } = await supabaseClient
                    .from('quotations')
                    .update(quotationPayload)
                    .eq('id', editingQuotationId)
                    .select('*');

                if (updateError) {
                    console.error('Error updating quotation:', updateError);
                    showAlert('Error', 'Failed to update quotation: ' + updateError.message, 'error');
                    return;
                }

                if (!updateQuotationArr || updateQuotationArr.length === 0) {
                    console.error('Update failed: ID not found in database');
                    showAlert('Error', 'Update failed: The quotation you are editing could not be found. It may have been deleted.', 'error');
                    return;
                }

                quotation = updatedQuotationArr[0];
                console.log('Quotation updated successfully:', quotation);

                // Delete existing items before creating new ones
                await supabaseClient
                    .from('quotation_items')
                    .delete()
                    .eq('quotation_id', editingQuotationId);

            } else {
                // Create new quotation
                quotation = await createQuotation(quotationPayload);

                if (!quotation || !quotation.id) {
                    showAlert('Error', 'Error: Failed to save quotation. No response from server.', 'error');
                    return;
                }

                console.log('Quotation saved successfully:', quotation);
            }

            // STEP 2: Collect all quotation items with product_id lookup
            const items = [];
            let rowOrder = 0;

            // Get package type row (first row)
            const packageRow = document.getElementById('package-type-row');
            if (packageRow) {
                const packageQty = parseFloat(packageRow.querySelector('.qty-input')?.value) || 0;
                const packagePrice = parseFloat(packageRow.querySelector('.price-input')?.value) || 0;
                const packageTotal = parsePHP(packageRow.querySelector('.total-cell')?.textContent);

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
                    const total = parsePHP(row.querySelector('.total-cell')?.textContent);

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
                const deliveryTotalNum = deliveryTotal === 'FREE' ? 0 : parsePHP(deliveryTotal);

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
                    showAlert('Partial Save', 'Quotation saved, but failed to save items: ' + itemsError.message, 'warning');
                    return;
                }

                console.log('Items saved successfully:', savedItems);
            }

            // Success!
            const action = isEditMode ? 'updated' : 'saved';
            showAlert('Success', `Quotation ${action} successfully!\n\nQuotation No: ${quotation.quotation_no || quotationNo}\nPackage Type: ${packageType}\nItems Saved: ${items.length}`, 'success', function () {
                if (isEditMode) {
                    // Navigate back to quotation list after updating
                    window.location.href = 'quotationlist.html';
                }
            });

            // Clear the stored quotation number and edit mode
            localStorage.removeItem('currentQuotationNumber');
            if (isEditMode) {
                localStorage.removeItem('editingQuotationId');
            }

        } catch (error) {
            console.error('Error saving quotation:', error);
            showAlert('Error', 'Error saving quotation: ' + (error.message || 'Unknown error'), 'error');
        }
    }

// Combined function: Save quotation AND print as PDF
async function saveAndPrintPDF() {
    try {
        // Call saveQuotation but suppress the default alert
        const employeeName = localStorage.getItem('selectedEmployeeName');
        const quotationNo = localStorage.getItem('currentQuotationNumber');

        if (!employeeName) {
            showAlert('Error', 'No employee selected. Please go back to home and select an employee.', 'error');
            return;
        }

        if (!quotationNo) {
            showAlert('Error', 'Error: No quotation number generated. Please refresh the page.', 'error');
            return;
        }

        // Get client information
        const clientName = document.querySelector('.client-info input[placeholder="Enter recipient name"]').value;
        const officeAddress = document.querySelector('.client-info input[placeholder="Enter office address"]').value;
        const contactPerson = document.querySelector('.client-info input[placeholder="Enter contact person"]').value;
        const contactNumber = document.querySelector('.client-info input[placeholder="Enter contact number"]').value;

        if (!clientName || !officeAddress || !contactPerson || !contactNumber) {
            showAlert('Missing Info', 'Please fill in all client information fields.', 'warning');
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

        // Check if we're updating an existing quotation (edit mode)
        const editingQuotationId = localStorage.getItem('editingQuotationId');
        const isEditMode = !!editingQuotationId;

        let quotation;
        if (isEditMode) {
            // Update existing quotation
            const { data: updatedQuotationArr, error: updateError } = await supabaseClient
                .from('quotations')
                .update(quotationPayload)
                .eq('id', editingQuotationId)
                .select('*');

            if (updateError) {
                console.error('Error updating quotation in saveAndPrintPDF:', updateError);
                showAlert('Error', 'Failed to update quotation: ' + updateError.message, 'error');
                return;
            }

            quotation = Array.isArray(updatedQuotationArr) ? updatedQuotationArr[0] : updatedQuotationArr;
            console.log('Quotation updated successfully:', quotation);

            // Delete existing items before inserting new ones
            const { error: deleteItemsError } = await supabaseClient
                .from('quotation_items')
                .delete()
                .eq('quotation_id', editingQuotationId);

            if (deleteItemsError) {
                console.error('Error deleting existing quotation items:', deleteItemsError);
                showAlert('Warning', 'Failed to delete existing quotation items: ' + deleteItemsError.message, 'warning');
            }
        } else {
            // Create new quotation
            quotation = await createQuotation(quotationPayload);

            if (!quotation || !quotation.id) {
                showAlert('Error', 'Error: Failed to save quotation. No response from server.', 'error');
                return;
            }

            console.log('Quotation saved successfully:', quotation);
        }

        // STEP 2: Collect all quotation items with product_id lookup
        const items = [];
        let rowOrder = 0;

        // Get package type row (first row)
        const packageRow = document.getElementById('package-type-row');
        if (packageRow) {
            const packageQty = parseFloat(packageRow.querySelector('.qty-input')?.value) || 0;
            const packagePrice = parseFloat(packageRow.querySelector('.price-input')?.value) || 0;
            const packageTotal = parsePHP(packageRow.querySelector('.total-cell')?.textContent);

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
                const total = parsePHP(row.querySelector('.total-cell')?.textContent);

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
            const deliveryTotalNum = deliveryTotal === 'FREE' ? 0 : parsePHP(deliveryTotal);

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
                showAlert('Partial Save', 'Quotation saved, but failed to save items: ' + itemsError.message, 'warning');
                return;
            }

            console.log('Items saved successfully:', savedItems);
        }

        // Clear the stored quotation number
        localStorage.removeItem('currentQuotationNumber');
        if (isEditMode) {
            localStorage.removeItem('editingQuotationId');
        }

        // Now trigger the print dialog
        console.log('Quotation saved successfully. Opening print dialog...');
        window.__redirectToListAfterPrint = true;
        setTimeout(() => {
            window.print();
        }, 500);

    } catch (error) {
        console.error('Error in saveAndPrintPDF:', error);
        showAlert('Error', 'Error saving quotation: ' + (error.message || 'Unknown error'), 'error');
    }
}

// For print: ensure the wrapped text shows instead of dropdown
document.addEventListener('DOMContentLoaded', function () {
    console.log('Page loaded, initializing...');

    // âœ… CHECK: Don't initialize if in view mode
    if (isViewMode) {
        console.log('ðŸ”µ View mode active - skipping new quotation initialization');
        return;
    }

    // Keep both for logging, but only employeeName is needed now
    const employeeName = localStorage.getItem('selectedEmployeeName');
    const quotationNo = localStorage.getItem('currentQuotationNumber');

    console.log('Session data:', {
        employeeName,
        quotationNo
    });

    (async () => {
        await ensureDataLoaded();
        await initializeQuotation();
    })();

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
        const price = parsePHP(priceInput.value);
        const total = price; // qty is always 1

        if (total === 0) {
            totalCell.textContent = 'FREE';
            totalCell.style.color = '#28a745';
        } else {
            totalCell.textContent = formatPHP(total);
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
        const price = parsePHP(priceInput.value);
        const total = qty * price;

        // âœ… UPDATED: Use innerHTML to make cell truly empty (no text node)
        if (total > 0) {
            totalCell.textContent = formatPHP(total);
        } else {
            totalCell.innerHTML = ''; // â† Completely empty HTML
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
        // Skip delivery row for numbering
        if (row.id === 'delivery-row') {
            const itemCell = row.querySelector('td:first-child');
            if (itemCell) itemCell.textContent = '';
            return;
        }

        // Handle package row and product rows
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

// Load quotation data for editing
async function loadQuotationForEdit(editData) {
    const { quotation, items } = editData;

    try {
        console.log('Loading quotation for edit:', quotation);
        console.log('Loading items for edit:', items);

        // Store the original quotation ID for updating
        localStorage.setItem('editingQuotationId', quotation.id);
        // Update quotation number and date
        const quoteNumber = document.getElementById('quote-number');
        const quoteDate = document.getElementById('quote-date');
        if (quoteNumber) quoteNumber.textContent = quotation.quotation_no || '';
        if (quoteDate) {
            const date = quotation.quotation_date || quotation.created_at;
            if (date) {
                const formatted = new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
                quoteDate.textContent = formatted;
            }
        }

        // Populate client information
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

        // Populate package type (both preview select + setup select)
        if (quotation.package_type) {
            applyPackageTypeToUI(quotation.package_type);
        }

        // Populate items immediately (items come from quotation_items; enrich via product_id)
        const enrichedItems = await enrichQuotationItems(items);
        console.log('🔍 About to populate edit items (enriched)...');
        populateEditItems(enrichedItems);

        // Update totals
        if (quotation.total) {
            const totalPackagePriceInput = document.getElementById('total-package-price-input');
            if (totalPackagePriceInput) {
                totalPackagePriceInput.value = formatPHP(quotation.total);
            }
        }

        if (quotation.onsite_delivery !== undefined && quotation.onsite_delivery !== null) {
            const onsiteDeliveryInput = document.getElementById('onsite-delivery-input');
            if (onsiteDeliveryInput) {
                onsiteDeliveryInput.value = formatPHP(quotation.onsite_delivery);
            }
        }

        if (quotation.discount !== undefined && quotation.discount !== null) {
            const discountInput = document.getElementById('discount-input');
            if (discountInput) {
                discountInput.value = formatPHP(quotation.discount);
            }
        }

        // Restore page 2 HTML (terms/notes/payment lines) if present
        try {
            const page2 = document.getElementById('page2-content');
            if (page2 && quotation.page2_html) {
                page2.innerHTML = quotation.page2_html;
                // Re-bind payment amount inputs formatting and events
                page2.querySelectorAll('.payment-amount-input').forEach(input => {
                    let value = String(input.value || '').replace(/,/g, '');
                    if (value && !isNaN(value)) input.value = parseFloat(value).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    input.addEventListener('focus', function () { this.value = String(this.value || '').replace(/,/g, ''); });
                    input.addEventListener('blur', function () {
                        let v = String(this.value || '').replace(/,/g, '');
                        if (v && !isNaN(v)) this.value = parseFloat(v).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    });
                });
            }
        } catch (e) { console.error('Error restoring page2_html in edit load:', e); }

        // Recompute derived totals to match hydrated row values
        calculateDeliveryTotal();
        calculateTotals();
        updateItemNumbers();
        updateTotalItemsCount();

        // Clear the edit data from localStorage
        localStorage.removeItem('editQuotationData');

        console.log('Quotation loaded successfully for editing');

        if (quotation.template_dates){
            setTimeout(() => {
                try{
                    const tDates = typeof quotaion.templates_dates === 'string'
                        ? JSON.parse(quotation.template_dates)
                        : quotation.template_dates;

                    const allTemplateDateInputs = [tDates.amc_start, tDates.amc_end,tDates.sla_date,tDates.eula_date];

                    allTemplateDateInputs.forEach((dateStr, index) => {
                        if (dateValues[index]) {
                            if (window.qptplFormatDate){
                                window.qptplFormatDate(input);
                            }   
                        }    
                    });
                    console.log('Template dates re-populated');
                } catch (e) {
                    console.error('Error parsing template dates:', e);
                }
            }, 600);
        }

    } catch (error) {
        console.error('Error loading quotation for edit:', error);
        showAlert('Error', 'Failed to load quotation data for editing: ' + error.message, 'error');
    }
}

// Populate items from the loaded quotation
function populateEditItems(items) {
    console.log('🔍 populateEditItems called with items:', items);
    const tbody = document.getElementById('quotation-tbody');
    if (!tbody) {
        console.error('🔍 quotation-tbody not found!');
        return;
    }

    // Clear existing rows except package and delivery rows
    const existingProductRows = tbody.querySelectorAll('.product-row');
    existingProductRows.forEach(row => row.remove());

    let previousRow = document.getElementById('package-type-row');

    const packageItem = (items || []).find(i => i?.row_type === 'package') || null;
    const deliveryItem = (items || []).find(i => i?.row_type === 'delivery') || null;
    const productItems = (items || []).filter(i => i?.row_type === 'product');

    if (packageItem) {
        const packageRow = document.getElementById('package-type-row');
        if (packageRow) {
            const qtyInput = packageRow.querySelector('.qty-input');
            if (qtyInput) qtyInput.value = packageItem.quantity ?? 1;

            const priceInput = packageRow.querySelector('.price-input');
            if (priceInput) priceInput.value = packageItem.price ?? 0;

            const unitDisplay = packageRow.querySelector('.unit-display');
            if (unitDisplay) unitDisplay.value = packageItem.product?.unit || '';

            packageRow.dataset.productId = packageItem.product_id || '';
            packageRow.dataset.productName = packageItem.product?.name || '';

            const descriptionDiv = document.getElementById('description-display');
            if (descriptionDiv) {
                const title = packageItem.product?.name || 'Package';
                let descriptionHTML = `<div style="font-weight: bold; font-size: 10px; margin-bottom: 4px;">${title}</div>`;
                const descLines = String(packageItem.product?.description || '').split('\n').filter(line => line.trim());
                if (descLines.length > 0) {
                    descriptionHTML += '<div style="font-size: 9px; color: #666;">';
                    descLines.forEach(line => { descriptionHTML += `<div style="margin-bottom: 2px;">&#10003; ${line.trim()}</div>`; });
                    descriptionHTML += '</div>';
                }
                descriptionDiv.innerHTML = descriptionHTML;
                descriptionDiv.style.color = '#000';
                descriptionDiv.style.fontStyle = 'normal';
            }

            calculateRowTotal(packageRow);
        }
    }

    productItems.forEach(item => {
        const productRow = document.createElement('tr');
        productRow.className = 'product-row';
        productRow.dataset.productId = item.product_id || '';
        productRow.dataset.productName = item.product?.name || '';

        const title = item.product?.name || item.product_name || 'Product';
        const unit = item.product?.unit || item.unit || '';
        const desc = item.product?.description || item.description || '';

        let descriptionHTML = `<div style="font-weight: bold; font-size: 10px; padding: 5px;">${title}</div>`;
        const descLines = String(desc).split('\n').filter(line => line.trim());
        if (descLines.length > 0) {
            descriptionHTML += '<div style="font-size: 9px; color: #666; padding: 2px 5px;">';
            descLines.forEach(line => {
                descriptionHTML += `<div style="margin-bottom: 2px;">&#10003; ${line.trim()}</div>`;
            });
            descriptionHTML += '</div>';
        }

        productRow.innerHTML = `
            <td class="item-number-cell" style="text-align: center; font-weight: bold; font-size: 12px;"></td>
            <td><input type="number" value="${item.quantity ?? 1}" min="0" class="qty-input" style="width: 50px; font-size: 10px; padding: 2px 4px; border: 1px solid #ccc; border-radius: 3px; text-align: right;"></td>
            <td><input type="text" value="${unit}" class="unit-display" readonly style="font-size: 10px; padding: 2px 4px; border: 1px solid #e0e0e0; border-radius: 3px; background: #f5f5f5; width: 100%; text-align: center;"></td>
            <td>${descriptionHTML}</td>
            <td><input type="number" value="${item.price ?? 0}" step="0.01" class="price-input" style="width: 80px; font-size: 10px; padding: 2px 4px; border: 1px solid #ccc; border-radius: 3px; text-align: right;"></td>
            <td class="total-cell" style="text-align: right; font-weight: bold;"></td>
            <td class="no-print"><button onclick="deleteRow(this)" style="background: #dc3545; color: white; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer; font-size: 10px;">Delete</button></td>
        `;

        if (previousRow && previousRow.nextSibling) {
            previousRow.parentNode.insertBefore(productRow, previousRow.nextSibling);
        } else {
            tbody.appendChild(productRow);
        }
        previousRow = productRow;

        setupRowEventListeners(productRow);
        calculateRowTotal(productRow);
    });

    if (deliveryItem) {
        const deliveryRow = document.getElementById('delivery-row');
        if (deliveryRow) {
            const deliveryPriceInput = deliveryRow.querySelector('.delivery-price-input');
            if (deliveryPriceInput) deliveryPriceInput.value = deliveryItem.price ?? 0;
        }
    }

    // Update totals and item numbers
    calculateTotals();
    updateItemNumbers();
    updateTotalItemsCount();
}
