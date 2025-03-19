import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

async function getOrCreateTestCategory() {
  console.log('\nChecking for test category...');
  
  // First try to find existing test category
  const { data: existingCategory } = await supabase
    .from('categories')
    .select('*')
    .eq('name', 'Test Category')
    .maybeSingle();

  if (existingCategory) {
    console.log('Found existing test category');
    return existingCategory;
  }

  console.log('Creating new test category...');
  const { data, error } = await supabase
    .from('categories')
    .insert({
      name: 'Test Category',
      name_en: 'Test Category',
      name_ar: 'فئة اختبار',
      is_visible: true
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function getOrCreateTestProduct(categoryId: string) {
  console.log('\nChecking for test product...');

  // First try to find existing test product
  const { data: existingProduct } = await supabase
    .from('products')
    .select('*')
    .eq('name', 'Test Product')
    .maybeSingle();

  if (existingProduct) {
    console.log('Found existing test product');
    return existingProduct;
  }

  console.log('Creating new test product...');
  const { data, error } = await supabase
    .from('products')
    .insert({
      name: 'Test Product',
      name_en: 'Test Product',
      name_ar: 'منتج اختبار',
      description: 'Test product for price updates',
      price: 15.90,
      price_unit: 'kg',
      category: categoryId,
      quality: 'a',
      in_stock: true,
      in_season: true
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function checkAndUpdatePrices() {
  try {
    console.log('\nCurrent time (Israel):', new Intl.DateTimeFormat('he-IL', {
      timeZone: 'Asia/Jerusalem',
      dateStyle: 'full',
      timeStyle: 'long'
    }).format(new Date()));

    // Get or create test category and product
    const category = await getOrCreateTestCategory();
    const testProduct = await getOrCreateTestProduct(category.id);

    console.log('\nTest product:', testProduct.name);
    console.log('Current price:', testProduct.price);
    console.log('Current tomorrow_price:', testProduct.tomorrow_price);
    
    // Update the test product with a new tomorrow price
    const { data: updatedProduct, error: updateError } = await supabase
      .from('products')
      .update({
        tomorrow_price: 12.90,
        price_updated_at: new Date().toISOString()
      })
      .eq('id', testProduct.id)
      .select()
      .single();

    if (updateError) throw updateError;

    console.log('\nProduct updated successfully:');
    console.log('Current price:', updatedProduct.price);
    console.log('Tomorrow price:', updatedProduct.tomorrow_price);
    console.log('Last update:', new Date(updatedProduct.price_updated_at).toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' }));

    // Try to trigger the update immediately
    const { data: triggeredProduct, error: triggerError } = await supabase
      .from('products')
      .update({ price_updated_at: updatedProduct.price_updated_at })
      .eq('id', testProduct.id)
      .select()
      .single();

    if (triggerError) throw triggerError;

    console.log('\nAfter trigger attempt:');
    console.log('Final price:', triggeredProduct.price);
    console.log('Final tomorrow price:', triggeredProduct.tomorrow_price);
    console.log('Final update time:', new Date(triggeredProduct.price_updated_at).toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' }));

  } catch (error) {
    console.error('Error:', error);
  }
}

checkAndUpdatePrices();