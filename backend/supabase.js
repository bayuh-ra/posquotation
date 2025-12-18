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
      category:product_categories(id, name)
    `)
    .order('name');
  
  if (error) console.error('Error fetching products:', error);
  return data;
}

async function getProductsByCategory(categoryId) {
  const { data, error } = await supabaseClient
    .from('products')
    .select('*')
    .eq('category_id', categoryId);
  
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
async function getNextQuotationNo(employeeId) {
  try {
    const { data, error } = await supabaseClient.rpc('get_next_quotation_no', { 
      emp: employeeId 
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
  
  if (error) console.error('Error fetching package types:', error);
  return data || [];
}

// ===== QUOTATIONS =====
async function createQuotation(quotationData) {
  const { data, error } = await supabaseClient
    .from('quotations')
    .insert([quotationData])
    .select()
    .single();
  
  if (error) console.error('Error creating quotation:', error);
  return data;
}

async function getQuotations() {
  const { data, error } = await supabaseClient
    .from('quotations')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) console.error('Error fetching quotations:', error);
  return data;
}

async function getQuotationById(id) {
  const { data, error } = await supabaseClient
    .from('quotations')
    .select(`
      *,
      items:quotation_items(
        *,
        product:products(name),
        unit:units(name)
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
  
  if (error) console.error('Error adding quotation item:', error);
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