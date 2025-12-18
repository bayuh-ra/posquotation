// Initialize Supabase (check if already exists to avoid conflicts)
let supabaseClient;
if (window.lapSupabaseClient) {
    supabaseClient = window.lapSupabaseClient;
} else {
    supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    window.lapSupabaseClient = supabaseClient;
}

// Navigation
function goBack() {
    window.location.href = 'index.html';
}

// Tab switching
function switchTab(tabName) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(tabName).classList.add('active');
    
    loadTabData(tabName);
}

function showMessage(elementId, message, isError = false) {
    const el = document.getElementById(elementId);
    el.innerHTML = `<div class="message ${isError ? 'error' : 'success'}">${message}</div>`;
    setTimeout(() => el.innerHTML = '', 3000);
}

// ===== UNITS =====
async function loadUnits() {
    const container = document.getElementById('units-list');
    const { data, error } = await supabaseClient.from('units').select('*').order('name');
    
    if (error) {
        container.innerHTML = '<p class="error">Error loading units: ' + error.message + '</p>';
        return;
    }
    
    let html = '<table><tr><th>Name</th></tr>';
    data.forEach((unit, index) => {
        const rowId = `unit-row-${index}`;
        html += `<tr id="${rowId}" style="cursor: pointer;" data-name="${encodeURIComponent(unit.name)}">
            <td>${unit.name}</td>
        </tr>`;
    });
    html += '</table>';
    container.innerHTML = html;
    
    // Add click listeners
    data.forEach((unit, index) => {
        const row = document.getElementById(`unit-row-${index}`);
        if (row) {
            row.addEventListener('click', function() {
                showUnitDetail(decodeURIComponent(this.dataset.name));
            });
        }
    });
}

function showUnitDetail(name) {
    document.getElementById('detail-unit-name').textContent = name;
    document.getElementById('detailUnitModal').dataset.name = name;
    document.getElementById('detailUnitModal').classList.add('active');
}

function closeDetailUnitModal() {
    document.getElementById('detailUnitModal').classList.remove('active');
}

function editUnitFromDetail() {
    const modal = document.getElementById('detailUnitModal');
    editUnit(modal.dataset.name);
    closeDetailUnitModal();
}

function deleteUnitFromDetail() {
    const modal = document.getElementById('detailUnitModal');
    deleteUnit(modal.dataset.name);
    closeDetailUnitModal();
}

async function addUnit() {
    const name = document.getElementById('unit-name').value.trim();
    if (!name) {
        showMessage('units-message', 'Please enter a unit name', true);
        return;
    }
    
    const { error } = await supabaseClient.from('units').insert([{ name }]);
    if (error) {
        showMessage('units-message', 'Error: ' + error.message, true);
        return;
    }
    
    showMessage('units-message', 'Unit added successfully!');
    document.getElementById('unit-name').value = '';
    loadUnits();
}

function editUnit(name) {
    document.getElementById('edit-unit-old-name').value = name;
    document.getElementById('edit-unit-name').value = name;
    document.getElementById('editUnitModal').classList.add('active');
}

function closeEditUnitModal() {
    document.getElementById('editUnitModal').classList.remove('active');
}

async function updateUnit() {
    const oldName = document.getElementById('edit-unit-old-name').value;
    const newName = document.getElementById('edit-unit-name').value.trim();
    
    if (!newName) {
        showMessage('edit-unit-message', 'Please enter a unit name', true);
        return;
    }
    
    const { error } = await supabaseClient
        .from('units')
        .update({ name: newName })
        .eq('name', oldName);
    
    if (error) {
        showMessage('edit-unit-message', 'Error: ' + error.message, true);
        return;
    }
    
    showMessage('units-message', 'Unit updated successfully!');
    closeEditUnitModal();
    loadUnits();
}

async function deleteUnit(name) {
    if (!confirm(`Delete unit "${name}"?`)) return;
    
    const { error } = await supabaseClient.from('units').delete().eq('name', name);
    if (error) {
        alert('Error: ' + error.message);
        return;
    }
    
    showMessage('units-message', 'Unit deleted successfully!');
    loadUnits();
}

// ===== CATEGORIES =====
async function loadCategories() {
    const container = document.getElementById('categories-list');
    const { data, error } = await supabaseClient.from('product_categories').select('*').order('name');
    
    if (error) {
        container.innerHTML = '<p class="error">Error loading categories: ' + error.message + '</p>';
        return;
    }
    
    let html = '<table><tr><th>Name</th></tr>';
    data.forEach((cat, index) => {
        const rowId = `category-row-${index}`;
        html += `<tr id="${rowId}" style="cursor: pointer;" data-name="${encodeURIComponent(cat.name)}">
            <td>${cat.name}</td>
        </tr>`;
    });
    html += '</table>';
    container.innerHTML = html;
    
    // Add click listeners
    data.forEach((cat, index) => {
        const row = document.getElementById(`category-row-${index}`);
        if (row) {
            row.addEventListener('click', function() {
                showCategoryDetail(decodeURIComponent(this.dataset.name));
            });
        }
    });
}

function showCategoryDetail(name) {
    document.getElementById('detail-category-name').textContent = name;
    document.getElementById('detailCategoryModal').dataset.name = name;
    document.getElementById('detailCategoryModal').classList.add('active');
}

function closeDetailCategoryModal() {
    document.getElementById('detailCategoryModal').classList.remove('active');
}

function editCategoryFromDetail() {
    const modal = document.getElementById('detailCategoryModal');
    editCategory(modal.dataset.name);
    closeDetailCategoryModal();
}

function deleteCategoryFromDetail() {
    const modal = document.getElementById('detailCategoryModal');
    deleteCategory(modal.dataset.name);
    closeDetailCategoryModal();
}

async function addCategory() {
    const name = document.getElementById('category-name').value.trim();
    if (!name) {
        showMessage('categories-message', 'Please enter a category name', true);
        return;
    }
    
    const { error } = await supabaseClient.from('product_categories').insert([{ name }]);
    if (error) {
        showMessage('categories-message', 'Error: ' + error.message, true);
        return;
    }
    
    showMessage('categories-message', 'Category added successfully!');
    document.getElementById('category-name').value = '';
    loadCategories();
}

function editCategory(name) {
    document.getElementById('edit-category-old-name').value = name;
    document.getElementById('edit-category-name').value = name;
    document.getElementById('editCategoryModal').classList.add('active');
}

function closeEditCategoryModal() {
    document.getElementById('editCategoryModal').classList.remove('active');
}

async function updateCategory() {
    const oldName = document.getElementById('edit-category-old-name').value;
    const newName = document.getElementById('edit-category-name').value.trim();
    
    if (!newName) {
        showMessage('edit-category-message', 'Please enter a category name', true);
        return;
    }
    
    const { error } = await supabaseClient
        .from('product_categories')
        .update({ name: newName })
        .eq('name', oldName);
    
    if (error) {
        showMessage('edit-category-message', 'Error: ' + error.message, true);
        return;
    }
    
    showMessage('categories-message', 'Category updated successfully!');
    closeEditCategoryModal();
    loadCategories();
}

async function deleteCategory(name) {
    if (!confirm(`Delete category "${name}"?`)) return;
    
    const { error } = await supabaseClient.from('product_categories').delete().eq('name', name);
    if (error) {
        alert('Error: ' + error.message);
        return;
    }
    
    showMessage('categories-message', 'Category deleted successfully!');
    loadCategories();
}

// ===== PRODUCTS =====
let allProducts = []; // Store all products for filtering

async function loadProducts() {
    const container = document.getElementById('products-list');
    const { data, error } = await supabaseClient
        .from('products')
        .select('*, category:product_categories(name)')
        .order('name');
    
    if (error) {
        container.innerHTML = '<p class="error">Error loading products: ' + error.message + '</p>';
        return;
    }
    
    allProducts = data; // Store for filtering
    displayProducts(data);
    
    // Load categories and units for dropdowns
    const { data: categories } = await supabaseClient.from('product_categories').select('*').order('name');
    const { data: units } = await supabaseClient.from('units').select('*').order('name');
    
    // Populate add form category dropdown
    const select = document.getElementById('product-category');
    select.innerHTML = '<option value="">Select category</option>';
    if (categories) {
        categories.forEach(cat => {
            select.innerHTML += `<option value="${cat.name}">${cat.name}</option>`;
        });
    }
    
    // Populate add form unit dropdown
    const unitSelect = document.getElementById('product-unit');
    unitSelect.innerHTML = '<option value="">Select unit</option>';
    if (units) {
        units.forEach(unit => {
            unitSelect.innerHTML += `<option value="${unit.name}">${unit.name}</option>`;
        });
    }
    
    // Populate filter dropdown
    const filterSelect = document.getElementById('filter-product-category');
    filterSelect.innerHTML = '<option value="">All Categories</option>';
    if (categories) {
        categories.forEach(cat => {
            filterSelect.innerHTML += `<option value="${cat.name}">${cat.name}</option>`;
        });
    }
}

function displayProducts(products) {
    const container = document.getElementById('products-list');
    
    if (products.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 20px; color: #718096;">No products found matching your filters.</p>';
        return;
    }
    
    let html = '<table><tr><th>Name</th><th>Category</th><th>Unit</th><th>Description</th><th>Price</th></tr>';
    products.forEach((prod, index) => {
        const rowId = `product-row-${index}`;
        html += `<tr id="${rowId}" style="cursor: pointer;" 
            data-name="${encodeURIComponent(prod.name)}" 
            data-category="${encodeURIComponent(prod.category ? prod.category.name : '')}" 
            data-unit="${encodeURIComponent(prod.unit || '')}" 
            data-description="${encodeURIComponent(prod.description || '')}" 
            data-price="${prod.base_price || 0}">
            <td>${prod.name}</td>
            <td>${prod.category ? prod.category.name : 'N/A'}</td>
            <td>${prod.unit || 'N/A'}</td>
            <td>${prod.description || ''}</td>
            <td>₱${parseFloat(prod.base_price || 0).toFixed(2)}</td>
        </tr>`;
    });
    html += '</table>';
    container.innerHTML = html;
    
    // Add click listeners after HTML is inserted
    products.forEach((prod, index) => {
        const row = document.getElementById(`product-row-${index}`);
        if (row) {
            row.addEventListener('click', function() {
                showProductDetail(
                    decodeURIComponent(this.dataset.name),
                    decodeURIComponent(this.dataset.category),
                    decodeURIComponent(this.dataset.unit),
                    decodeURIComponent(this.dataset.description),
                    this.dataset.price
                );
            });
        }
    });
}

function showProductDetail(name, category, unit, description, price) {
    document.getElementById('detail-product-name').textContent = name;
    document.getElementById('detail-product-category').textContent = category || 'N/A';
    document.getElementById('detail-product-unit').textContent = unit || 'N/A';
    document.getElementById('detail-product-description').textContent = description || 'No description';
    document.getElementById('detail-product-price').textContent = '₱' + parseFloat(price || 0).toFixed(2);
    
    // Store data for edit/delete
    document.getElementById('detailProductModal').dataset.name = name;
    document.getElementById('detailProductModal').dataset.category = category;
    document.getElementById('detailProductModal').dataset.unit = unit;
    document.getElementById('detailProductModal').dataset.description = description;
    document.getElementById('detailProductModal').dataset.price = price;
    
    document.getElementById('detailProductModal').classList.add('active');
}

function closeDetailProductModal() {
    document.getElementById('detailProductModal').classList.remove('active');
}

function editFromDetail() {
    const modal = document.getElementById('detailProductModal');
    editProduct(
        modal.dataset.name,
        modal.dataset.category,
        modal.dataset.unit,
        modal.dataset.description,
        modal.dataset.price
    );
    closeDetailProductModal();
}

function deleteFromDetail() {
    const modal = document.getElementById('detailProductModal');
    deleteProduct(modal.dataset.name);
    closeDetailProductModal();
}

function filterProducts() {
    const categoryFilter = document.getElementById('filter-product-category').value.toLowerCase();
    const nameFilter = document.getElementById('filter-product-name').value.toLowerCase();
    
    const filtered = allProducts.filter(prod => {
        const matchesCategory = !categoryFilter || (prod.category && prod.category.name.toLowerCase() === categoryFilter);
        const matchesName = !nameFilter || prod.name.toLowerCase().includes(nameFilter);
        return matchesCategory && matchesName;
    });
    
    displayProducts(filtered);
}

function clearProductFilters() {
    document.getElementById('filter-product-category').value = '';
    document.getElementById('filter-product-name').value = '';
    displayProducts(allProducts);
}

async function addProduct() {
    const name = document.getElementById('product-name').value.trim();
    const category = document.getElementById('product-category').value;
    const unit = document.getElementById('product-unit').value;
    const description = document.getElementById('product-description').value.trim();
    const price = parseFloat(document.getElementById('product-price').value) || 0;
    
    if (!name || !category || !unit) {
        showMessage('products-message', 'Please fill in all required fields (name, category, and unit)', true);
        return;
    }
    
    const { error } = await supabaseClient.from('products').insert([{
        name,
        category,
        unit,
        description,
        base_price: price
    }]);
    
    if (error) {
        showMessage('products-message', 'Error: ' + error.message, true);
        return;
    }
    
    showMessage('products-message', 'Product added successfully!');
    document.getElementById('product-name').value = '';
    document.getElementById('product-unit').value = '';
    document.getElementById('product-description').value = '';
    document.getElementById('product-price').value = '';
    loadProducts();
}

async function editProduct(name, category, unit, description, price) {
    document.getElementById('edit-product-old-name').value = name;
    document.getElementById('edit-product-name').value = name;
    document.getElementById('edit-product-description').value = description;
    document.getElementById('edit-product-price').value = price;
    
    // Load categories and units for edit modal
    const { data: categories } = await supabaseClient.from('product_categories').select('*').order('name');
    const { data: units } = await supabaseClient.from('units').select('*').order('name');
    
    // Populate category dropdown
    const select = document.getElementById('edit-product-category');
    select.innerHTML = '<option value="">Select category</option>';
    if (categories) {
        categories.forEach(cat => {
            const selected = cat.name === category ? 'selected' : '';
            select.innerHTML += `<option value="${cat.name}" ${selected}>${cat.name}</option>`;
        });
    }
    
    // Populate unit dropdown
    const unitSelect = document.getElementById('edit-product-unit');
    unitSelect.innerHTML = '<option value="">Select unit</option>';
    if (units) {
        units.forEach(u => {
            const selected = u.name === unit ? 'selected' : '';
            unitSelect.innerHTML += `<option value="${u.name}" ${selected}>${u.name}</option>`;
        });
    }
    
    document.getElementById('editProductModal').classList.add('active');
}

function closeEditProductModal() {
    document.getElementById('editProductModal').classList.remove('active');
}

async function updateProduct() {
    const oldName = document.getElementById('edit-product-old-name').value;
    const newName = document.getElementById('edit-product-name').value.trim();
    const category = document.getElementById('edit-product-category').value;
    const unit = document.getElementById('edit-product-unit').value;
    const description = document.getElementById('edit-product-description').value.trim();
    const price = parseFloat(document.getElementById('edit-product-price').value) || 0;
    
    if (!newName || !category || !unit) {
        showMessage('edit-product-message', 'Please fill in all required fields (name, category, and unit)', true);
        return;
    }
    
    const { error } = await supabaseClient
        .from('products')
        .update({
            name: newName,
            category,
            unit,
            description,
            base_price: price
        })
        .eq('name', oldName);
    
    if (error) {
        showMessage('edit-product-message', 'Error: ' + error.message, true);
        return;
    }
    
    showMessage('products-message', 'Product updated successfully!');
    closeEditProductModal();
    loadProducts();
}

async function deleteProduct(name) {
    if (!confirm(`Delete product "${name}"?`)) return;
    
    const { error } = await supabaseClient.from('products').delete().eq('name', name);
    if (error) {
        alert('Error: ' + error.message);
        return;
    }
    
    showMessage('products-message', 'Product deleted successfully!');
    loadProducts();
}

// ===== PACKAGE TYPES =====
async function loadPackageTypes() {
    const container = document.getElementById('package-types-list');
    const { data, error } = await supabaseClient.from('package_type').select('*').order('name');
    
    if (error) {
        container.innerHTML = '<p class="error">Error loading package types: ' + error.message + '</p>';
        return;
    }
    
    let html = '<table><tr><th>Name</th><th>Description</th></tr>';
    data.forEach((pkg, index) => {
        const rowId = `package-row-${index}`;
        html += `<tr id="${rowId}" style="cursor: pointer;" 
            data-name="${encodeURIComponent(pkg.name)}" 
            data-description="${encodeURIComponent(pkg.description || '')}">
            <td>${pkg.name}</td>
            <td>${pkg.description || ''}</td>
        </tr>`;
    });
    html += '</table>';
    container.innerHTML = html;
    
    // Add click listeners
    data.forEach((pkg, index) => {
        const row = document.getElementById(`package-row-${index}`);
        if (row) {
            row.addEventListener('click', function() {
                showPackageDetail(
                    decodeURIComponent(this.dataset.name),
                    decodeURIComponent(this.dataset.description)
                );
            });
        }
    });
}

function showPackageDetail(name, description) {
    document.getElementById('detail-package-name').textContent = name;
    document.getElementById('detail-package-description').textContent = description || 'No description';
    document.getElementById('detailPackageModal').dataset.name = name;
    document.getElementById('detailPackageModal').dataset.description = description;
    document.getElementById('detailPackageModal').classList.add('active');
}

function closeDetailPackageModal() {
    document.getElementById('detailPackageModal').classList.remove('active');
}

function editPackageFromDetail() {
    const modal = document.getElementById('detailPackageModal');
    editPackageType(modal.dataset.name, modal.dataset.description);
    closeDetailPackageModal();
}

function deletePackageFromDetail() {
    const modal = document.getElementById('detailPackageModal');
    deletePackageType(modal.dataset.name);
    closeDetailPackageModal();
}

async function addPackageType() {
    const name = document.getElementById('package-name').value.trim();
    const description = document.getElementById('package-description').value.trim();
    
    if (!name) {
        showMessage('package-types-message', 'Please enter a package name', true);
        return;
    }
    
    const { error } = await supabaseClient.from('package_type').insert([{ name, description }]);
    if (error) {
        showMessage('package-types-message', 'Error: ' + error.message, true);
        return;
    }
    
    showMessage('package-types-message', 'Package type added successfully!');
    document.getElementById('package-name').value = '';
    document.getElementById('package-description').value = '';
    loadPackageTypes();
}

function editPackageType(name, description) {
    document.getElementById('edit-package-old-name').value = name;
    document.getElementById('edit-package-name').value = name;
    document.getElementById('edit-package-description').value = description;
    document.getElementById('editPackageModal').classList.add('active');
}

function closeEditPackageModal() {
    document.getElementById('editPackageModal').classList.remove('active');
}

async function updatePackageType() {
    const oldName = document.getElementById('edit-package-old-name').value;
    const newName = document.getElementById('edit-package-name').value.trim();
    const description = document.getElementById('edit-package-description').value.trim();
    
    if (!newName) {
        showMessage('edit-package-message', 'Please enter a package name', true);
        return;
    }
    
    const { error } = await supabaseClient
        .from('package_type')
        .update({
            name: newName,
            description
        })
        .eq('name', oldName);
    
    if (error) {
        showMessage('edit-package-message', 'Error: ' + error.message, true);
        return;
    }
    
    showMessage('package-types-message', 'Package type updated successfully!');
    closeEditPackageModal();
    loadPackageTypes();
}

async function deletePackageType(name) {
    if (!confirm(`Delete package type "${name}"?`)) return;
    
    const { error } = await supabaseClient.from('package_type').delete().eq('name', name);
    if (error) {
        alert('Error: ' + error.message);
        return;
    }
    
    showMessage('package-types-message', 'Package type deleted successfully!');
    loadPackageTypes();
}

// ===== PACKAGE PRODUCTS =====
let allPackageProducts = []; // Store all package products for filtering
let currentSelectedPackage = null;

async function loadPackageProducts() {
    const container = document.getElementById('package-products-list');
    const { data, error } = await supabaseClient
        .from('package_type_products')
        .select('*')
        .order('package_type_name');
    
    if (error) {
        container.innerHTML = '<p class="error">Error loading package products: ' + error.message + '</p>';
        return;
    }
    
    allPackageProducts = data; // Store for filtering
    displayPackageProducts(data);
    
    // Load package types and products for dropdowns
    const { data: packages } = await supabaseClient.from('package_type').select('*').order('name');
    const { data: products } = await supabaseClient.from('products').select('*').order('name');
    
    // Populate package select for adding products (new dropdown)
    const pkgSelect = document.getElementById('pp-package-type-select');
    if (pkgSelect) {
        pkgSelect.innerHTML = '<option value="">Select a package type</option>';
        if (packages) {
            packages.forEach(pkg => {
                pkgSelect.innerHTML += `<option value="${pkg.name}">${pkg.name}</option>`;
            });
        }
    }
    
    // Populate filter dropdowns
    const filterPkgSelect = document.getElementById('filter-package-type');
    filterPkgSelect.innerHTML = '<option value="">All Package Types</option>';
    if (packages) {
        packages.forEach(pkg => {
            filterPkgSelect.innerHTML += `<option value="${pkg.name}">${pkg.name}</option>`;
        });
    }
    
    const filterProdSelect = document.getElementById('filter-product');
    filterProdSelect.innerHTML = '<option value="">All Products</option>';
    if (products) {
        products.forEach(prod => {
            filterProdSelect.innerHTML += `<option value="${prod.name}">${prod.name}</option>`;
        });
    }
}

function displayPackageProducts(packageProducts) {
    const container = document.getElementById('package-products-list');
    
    if (packageProducts.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 20px; color: #718096;">No package products found matching your filters.</p>';
        return;
    }
    
    let html = '<table><tr><th>Package Type</th><th>Product</th><th>Actions</th></tr>';
    packageProducts.forEach(pp => {
        html += `<tr>
            <td>${pp.package_type_name}</td>
            <td>${pp.product_name}</td>
            <td class="actions">
                <button class="btn btn-danger" onclick="deletePackageProduct(${pp.id})">Remove</button>
            </td>
        </tr>`;
    });
    html += '</table>';
    container.innerHTML = html;
}

function filterPackageProducts() {
    const packageFilter = document.getElementById('filter-package-type').value.toLowerCase();
    const productFilter = document.getElementById('filter-product').value.toLowerCase();
    
    const filtered = allPackageProducts.filter(pp => {
        const matchesPackage = !packageFilter || pp.package_type_name.toLowerCase() === packageFilter;
        const matchesProduct = !productFilter || pp.product_name.toLowerCase() === productFilter;
        return matchesPackage && matchesProduct;
    });
    
    displayPackageProducts(filtered);
}

function clearPackageProductFilters() {
    document.getElementById('filter-package-type').value = '';
    document.getElementById('filter-product').value = '';
    displayPackageProducts(allPackageProducts);
}

// Modal functions for adding multiple products
async function openAddProductsModal() {
    const packageSelect = document.getElementById('pp-package-type-select');
    const selectedPackage = packageSelect.value;
    
    if (!selectedPackage) {
        alert('Please select a package type first!');
        return;
    }
    
    currentSelectedPackage = selectedPackage;
    document.getElementById('selected-package-name').textContent = selectedPackage;
    
    // Load all products with checkboxes
    const { data: products, error } = await supabaseClient
        .from('products')
        .select('*')
        .order('name');
    
    if (error) {
        alert('Error loading products: ' + error.message);
        return;
    }
    
    const checkboxList = document.getElementById('products-checkbox-list');
    checkboxList.innerHTML = '';
    
    products.forEach(prod => {
        const item = document.createElement('div');
        item.className = 'product-checkbox-item';
        item.innerHTML = `
            <input type="checkbox" id="prod-${prod.id}" value="${prod.name}">
            <label for="prod-${prod.id}">${prod.name}</label>
        `;
        checkboxList.appendChild(item);
    });
    
    document.getElementById('addProductsModal').classList.add('active');
}

function closeAddProductsModal() {
    document.getElementById('addProductsModal').classList.remove('active');
    document.getElementById('add-products-message').innerHTML = '';
}

async function addMultipleProducts() {
    const checkboxes = document.querySelectorAll('#products-checkbox-list input[type="checkbox"]:checked');
    
    if (checkboxes.length === 0) {
        showMessage('add-products-message', 'Please select at least one product!', true);
        return;
    }
    
    const productsToAdd = Array.from(checkboxes).map(cb => ({
        package_type_name: currentSelectedPackage,
        product_name: cb.value
    }));
    
    const { error } = await supabaseClient
        .from('package_type_products')
        .insert(productsToAdd);
    
    if (error) {
        showMessage('add-products-message', 'Error: ' + error.message, true);
        return;
    }
    
    showMessage('package-products-message', `Successfully added ${checkboxes.length} product(s) to package!`);
    closeAddProductsModal();
    loadPackageProducts();
}

async function deletePackageProduct(id) {
    if (!confirm('Remove this product from the package?')) return;
    
    const { error } = await supabaseClient.from('package_type_products').delete().eq('id', id);
    if (error) {
        alert('Error: ' + error.message);
        return;
    }
    
    showMessage('package-products-message', 'Product removed from package!');
    loadPackageProducts();
}

// ===== EMPLOYEES =====
async function loadEmployees() {
    const container = document.getElementById('employees-list');
    const { data, error } = await supabaseClient.from('employees').select('*').order('employee_code');
    
    if (error) {
        container.innerHTML = '<p class="error">Error loading employees: ' + error.message + '</p>';
        return;
    }
    
    let html = '<table><tr><th>Employee Code</th><th>Full Name</th><th>Status</th></tr>';
    data.forEach((emp, index) => {
        const rowId = `employee-row-${index}`;
        html += `<tr id="${rowId}" style="cursor: pointer;" 
            data-id="${emp.id}" 
            data-code="${encodeURIComponent(emp.employee_code)}" 
            data-name="${encodeURIComponent(emp.full_name)}" 
            data-active="${emp.is_active}">
            <td>${emp.employee_code}</td>
            <td>${emp.full_name}</td>
            <td>${emp.is_active ? '<span style="color: green;">Active</span>' : '<span style="color: red;">Inactive</span>'}</td>
        </tr>`;
    });
    html += '</table>';
    container.innerHTML = html;
    
    // Add click listeners
    data.forEach((emp, index) => {
        const row = document.getElementById(`employee-row-${index}`);
        if (row) {
            row.addEventListener('click', function() {
                showEmployeeDetail(
                    this.dataset.id,
                    decodeURIComponent(this.dataset.code),
                    decodeURIComponent(this.dataset.name),
                    this.dataset.active === 'true'
                );
            });
        }
    });
}

function showEmployeeDetail(id, code, name, isActive) {
    document.getElementById('detail-employee-code').textContent = code;
    document.getElementById('detail-employee-name').textContent = name;
    const statusHtml = isActive ? '<span style="color: green; font-weight: bold;">Active</span>' : '<span style="color: red; font-weight: bold;">Inactive</span>';
    document.getElementById('detail-employee-status').innerHTML = statusHtml;
    
    document.getElementById('detailEmployeeModal').dataset.id = id;
    document.getElementById('detailEmployeeModal').dataset.code = code;
    document.getElementById('detailEmployeeModal').dataset.name = name;
    document.getElementById('detailEmployeeModal').dataset.active = isActive;
    document.getElementById('detailEmployeeModal').classList.add('active');
}

function closeDetailEmployeeModal() {
    document.getElementById('detailEmployeeModal').classList.remove('active');
}

function editEmployeeFromDetail() {
    const modal = document.getElementById('detailEmployeeModal');
    editEmployee(
        modal.dataset.id,
        modal.dataset.code,
        modal.dataset.name,
        modal.dataset.active === 'true'
    );
    closeDetailEmployeeModal();
}

function deleteEmployeeFromDetail() {
    const modal = document.getElementById('detailEmployeeModal');
    deleteEmployee(modal.dataset.id, modal.dataset.name);
    closeDetailEmployeeModal();
}

async function addEmployee() {
    const code = document.getElementById('employee-code').value.trim();
    const name = document.getElementById('employee-name').value.trim();
    const password = document.getElementById('employee-password').value;
    const isActive = document.getElementById('employee-status').value === 'true';
    
    if (!code || !name || !password) {
        showMessage('employees-message', 'Please fill in all fields', true);
        return;
    }
    
    const { error } = await supabaseClient.from('employees').insert([{
        employee_code: code,
        full_name: name,
        password_hash: password,
        is_active: isActive
    }]);
    
    if (error) {
        showMessage('employees-message', 'Error: ' + error.message, true);
        return;
    }
    
    showMessage('employees-message', 'Employee added successfully!');
    document.getElementById('employee-code').value = '';
    document.getElementById('employee-name').value = '';
    document.getElementById('employee-password').value = '';
    loadEmployees();
}

function editEmployee(id, code, name, isActive) {
    document.getElementById('edit-employee-id').value = id;
    document.getElementById('edit-employee-code').value = code;
    document.getElementById('edit-employee-fullname').value = name;
    document.getElementById('edit-employee-password').value = '';
    document.getElementById('edit-employee-active').value = isActive.toString();
    document.getElementById('editEmployeeModal').classList.add('active');
}

function closeEditEmployeeModal() {
    document.getElementById('editEmployeeModal').classList.remove('active');
}

async function updateEmployee() {
    const id = document.getElementById('edit-employee-id').value;
    const code = document.getElementById('edit-employee-code').value.trim();
    const name = document.getElementById('edit-employee-fullname').value.trim();
    const password = document.getElementById('edit-employee-password').value;
    const isActive = document.getElementById('edit-employee-active').value === 'true';
    
    if (!code || !name) {
        showMessage('edit-employee-message', 'Please fill in all required fields', true);
        return;
    }
    
    const updateData = {
        employee_code: code,
        full_name: name,
        is_active: isActive
    };
    
    // Only update password if a new one is provided
    if (password) {
        updateData.password_hash = password;
    }
    
    const { error } = await supabaseClient
        .from('employees')
        .update(updateData)
        .eq('id', id);
    
    if (error) {
        showMessage('edit-employee-message', 'Error: ' + error.message, true);
        return;
    }
    
    showMessage('employees-message', 'Employee updated successfully!');
    closeEditEmployeeModal();
    loadEmployees();
}

async function toggleEmployeeStatus(id, newStatus) {
    const { error } = await supabaseClient
        .from('employees')
        .update({ is_active: newStatus })
        .eq('id', id);
    
    if (error) {
        alert('Error: ' + error.message);
        return;
    }
    
    showMessage('employees-message', 'Employee status updated successfully!');
    loadEmployees();
}

async function deleteEmployee(id, name) {
    if (!confirm(`Delete employee "${name}"?`)) return;
    
    const { error } = await supabaseClient.from('employees').delete().eq('id', id);
    if (error) {
        alert('Error: ' + error.message);
        return;
    }
    
    showMessage('employees-message', 'Employee deleted successfully!');
    loadEmployees();
}

// Load tab data
function loadTabData(tabName) {
    switch(tabName) {
        case 'units': loadUnits(); break;
        case 'categories': loadCategories(); break;
        case 'products': loadProducts(); break;
        case 'pos':
            loadPackageTypes();
            loadPackageProducts();
            break;
        case 'employees': loadEmployees(); break;
    }
}

// Sub-tab switching for POS
function switchPOSSubTab(subTabName) {
    // Remove active class from all sub-tabs
    document.querySelectorAll('.sub-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.sub-page').forEach(p => p.style.display = 'none');
    
    // Add active class to clicked sub-tab
    event.target.classList.add('active');
    
    // Show the corresponding sub-page
    document.getElementById(subTabName).style.display = 'block';
    document.getElementById(subTabName).classList.add('active');
}

// Initial load
loadUnits();

