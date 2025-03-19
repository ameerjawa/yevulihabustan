import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const supabase = createClient<Database>(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

async function checkPrices() {
  try {
    // Get Israel time
    const israelTime = new Intl.DateTimeFormat('he-IL', {
      timeZone: 'Asia/Jerusalem',
      dateStyle: 'full',
      timeStyle: 'long'
    }).format(new Date());

    console.log('\nזמן נוכחי (ישראל):', israelTime);

    // Get all products with tomorrow prices
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .not('tomorrow_price', 'is', null)
      .order('price_updated_at', { ascending: false });

    if (error) throw error;

    if (!products || products.length === 0) {
      console.log('\nלא נמצאו מוצרים עם מחירים מתוכננים למחר.');
      return;
    }

    console.log('\nמוצרים עם מחירים מתוכננים למחר:');
    products.forEach(product => {
      console.log(`\nמוצר: ${product.name}`);
      console.log(`מחיר נוכחי: ₪${product.price}/${product.price_unit}`);
      console.log(`מחיר למחר: ₪${product.tomorrow_price}/${product.price_unit}`);
      console.log('עדכון אחרון:', new Date(product.price_updated_at).toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' }));
      console.log(`שינוי: ${((product.tomorrow_price! / product.price - 1) * 100).toFixed(1)}%`);
    });

    // Get all products updated in the last 24 hours
    const { data: recentUpdates, error: recentError } = await supabase
      .from('products')
      .select('*')
      .gt('price_updated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('price_updated_at', { ascending: false });

    if (recentError) throw recentError;

    if (recentUpdates && recentUpdates.length > 0) {
      console.log('\nמוצרים שעודכנו ב-24 שעות האחרונות:');
      recentUpdates.forEach(product => {
        console.log(`\nמוצר: ${product.name}`);
        console.log(`מחיר נוכחי: ₪${product.price}/${product.price_unit}`);
        console.log('זמן עדכון:', new Date(product.price_updated_at).toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' }));
      });
    } else {
      console.log('\nלא נמצאו עדכוני מחירים ב-24 שעות האחרונות.');
    }

  } catch (error) {
    console.error('שגיאה:', error);
  }
}

checkPrices();