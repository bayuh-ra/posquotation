// backend/supabase.js


// Initialize Supabase client (create once and reuse to avoid redeclaration)
window.SUPABASE_CLIENT = window.SUPABASE_CLIENT || window.supabase.createClient(
  SUPABASE_CONFIG.url,
  SUPABASE_CONFIG.anonKey
);
const supabaseClient = window.SUPABASE_CLIENT;

// ===== PRODUCTS =====
async function getProducts() {
  const { data, error } = await supabaseClient
    .from('products')
    .select(`
      *,
      category:product_categories!products_category_fkey(name)
    `)
    .order('name');
  
  if (error) console.error('Error fetching products:', error);
  return data;
}

async function getProductsByCategory(categoryName) {
  const { data, error } = await supabaseClient
    .from('products')
    .select('*')
    .eq('category', categoryName);
  
  if (error) console.error('Error:', error);
  return data;
}

// ===== CATEGORIES =====
async function getCategories() {
  const { data, error } = await supabaseClient
    .from('product_categories')
    .select('*')
    .order('name');
  
  if (error) console.error('Error fetching categories:', error);
  return data;
}

// ===== UNITS =====
async function getUnits() {
  const { data, error } = await supabaseClient
    .from('units')
    .select('*');
  
  if (error) console.error('Error fetching units:', error);
  return data;
}

// ===== EMPLOYEES =====
async function getEmployees() {
  const { data, error } = await supabaseClient
    .from('employees')
    .select('*')
    .eq('is_active', true)
    .order('employee_code');
  if (error) {
    console.error('Error fetching employees:', error);
    return [];
  }
  return data || [];
}

async function getEmployeeByCode(code) {
  const { data, error } = await supabaseClient
    .from('employees')
    .select('*')
    .eq('employee_code', code)
    .eq('is_active', true)
    .limit(1)
    .single();
  if (error) {
    console.error('Error fetching employee by code:', error);
    return null;
  }
  return data || null;
}

// ===== QUOTATION NUMBER (RPC) =====
async function getNextQuotationNo(employeeName) {
  try {
    const { data, error } = await supabaseClient.rpc('get_next_quotation_no', { 
      emp_name: employeeName 
    });
    if (error) {
      console.error('RPC error get_next_quotation_no:', error);
      return null;
    }
    return data;
  } catch (err) {
    console.error('Error calling RPC get_next_quotation_no:', err);
    return null;
  }
}

// ===== PACKAGE TYPES =====
async function getPackageTypes() {
  const { data, error } = await supabaseClient
    .from('package_type')
    .select('*')
    .order('name');
  
  if (error) {
    console.error('Error fetching package types:', error);
    return [];
  }
  return data || [];
}

async function updatePackageTypeByName(oldName, newName, description) {
  // 1️⃣ If name did not change → update description only
  if (oldName === newName) {
    const { data, error } = await supabaseClient
      .from('package_type')
      .update({ description })
      .eq('name', oldName)
      .select()
      .single();

    if (error) {
      console.error('Error updating package type:', error);
      throw error;
    }
    return data;
  }

  // 2️⃣ Check if new name already exists
  const { data: exists, error: checkError } = await supabaseClient
    .from('package_type')
    .select('name')
    .eq('name', newName)
    .maybeSingle();

  if (checkError) throw checkError;
  if (exists) {
    throw new Error('Package type name already exists');
  }

  // 3️⃣ Rename safely
  const { data, error } = await supabaseClient
    .from('package_type')
    .update({ name: newName, description })
    .eq('name', oldName)
    .select()
    .single();

  if (error) {
    console.error('Error renaming package type:', error);
    throw error;
  }
  return data;
}


// ===== PACKAGE ITEMS =====
async function getPackageItems(packageName) {
  const { data, error } = await supabaseClient
    .from('package_type_products')
    .select(`
      *,
      product:products!package_type_products_product_name_fkey(name, base_price, description)
    `)
    .eq('package_type_name', packageName);
  
  if (error) console.error('Error fetching package items:', error);
  return data || [];
}

// ===== QUOTATIONS =====
async function createQuotation(quotationData) {
  const { data, error } = await supabaseClient
    .from('quotations')
    .insert([quotationData])
    .select()
    .single();
  
  if (error) {
    console.error('Error creating quotation:', error);
    throw error;
  }
  return data;
}

async function getQuotations() {
  const { data, error } = await supabaseClient
    .from('quotations')
    .select(`
      *,
      employee:employees!quotations_employee_name_fkey(full_name, employee_code)
    `)
    .order('created_at', { ascending: false });
  
  if (error) console.error('Error fetching quotations:', error);
  return data;
}

async function getQuotationById(id) {
  const { data, error } = await supabaseClient
    .from('quotations')
    .select(`
      *,
      employee:employees!quotations_employee_name_fkey(full_name, employee_code),
      items:quotation_items(
        *,
        product:products!quotation_items_product_name_fkey(name, description),
        unit:units!quotation_items_unit_name_fkey(name),
        package_type:package_type!quotation_items_package_type_name_fkey(name, description)
      )
    `)
    .eq('id', id)
    .single();
  
  if (error) console.error('Error fetching quotation:', error);
  return data;
}

async function updateQuotation(id, updates) {
  const { data, error } = await supabaseClient
    .from('quotations')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) console.error('Error updating quotation:', error);
  return data;
}

async function deleteQuotation(id) {
  const { error } = await supabaseClient
    .from('quotations')
    .delete()
    .eq('id', id);
  
  if (error) console.error('Error deleting quotation:', error);
  return !error;
}

// ===== QUOTATION ITEMS =====
async function addQuotationItem(itemData) {
  const { data, error } = await supabaseClient
    .from('quotation_items')
    .insert([itemData])
    .select()
    .single();
  
  if (error) {
    console.error('Error adding quotation item:', error);
    throw error;
  }
  return data;
}

async function updateQuotationItem(id, updates) {
  const { data, error } = await supabaseClient
    .from('quotation_items')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) console.error('Error updating item:', error);
  return data;
}

async function deleteQuotationItem(id) {
  const { error } = await supabaseClient
    .from('quotation_items')
    .delete()
    .eq('id', id);
  
  if (error) console.error('Error deleting item:', error);
  return !error;
}