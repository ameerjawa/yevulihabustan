import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  'https://ynymauvdhwduhcvingor.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlueW1hdXZkaHdkdWhjdmluZ29yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkyMzMzMjUsImV4cCI6MjA1NDgwOTMyNX0.1Sx2l3UEG-xbOAoeT3-TJZjwGrTtngBe5CeI9n7hNdQ'
);

async function checkPrices() {
  try {
    // Get current time in Israel
    const israelTime = new Intl.DateTimeFormat('he-IL', {
      timeZone: 'Asia/Jerusalem',
      dateStyle: 'full',
      timeStyle: 'long'
    }).format(new Date());

    console.log('\nזמן נוכחי (ישראל):', israelTime);

    // Get detailed time information
    const now = new Date();
    const israelNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jerusalem' }));
    console.log('\nפרטי זמן מדויקים:');
    console.log('שעה:', israelNow.getHours());
    console.log('דקות:', israelNow.getMinutes());
    console.log('תאריך:', israelNow.toISOString());

    // Calculate time until next update
    const currentHour = israelNow.getHours();
    const currentMinutes = israelNow.getMinutes();
    let minutesUntilUpdate;
    
    if (currentHour < 1) {
      // Before 1 AM
      minutesUntilUpdate = (60 - currentMinutes) + (0 * 60);
    } else if (currentHour === 1) {
      // Between 1 AM and 2 AM
      minutesUntilUpdate = 0;
      console.log('\nזמן העדכון! המחירים אמורים להתעדכן עכשיו');
    } else {
      // After 1 AM
      minutesUntilUpdate = (60 - currentMinutes) + ((23 - currentHour) * 60);
    }

    const hoursUntilUpdate = Math.floor(minutesUntilUpdate / 60);
    const remainingMinutes = minutesUntilUpdate % 60;
    
    console.log('\nזמן עד העדכון הבא:');
    console.log(`${hoursUntilUpdate} שעות ו-${remainingMinutes} דקות`);

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
      console.log('\n------------------------');
      console.log(`מוצר: ${product.name}`);
      console.log(`מחיר נוכחי: ₪${product.price}/${product.price_unit}`);
      console.log(`מחיר למחר: ₪${product.tomorrow_price}/${product.price_unit}`);
      console.log('עדכון אחרון:', new Date(product.price_updated_at).toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' }));
      console.log(`שינוי: ${((product.tomorrow_price / product.price - 1) * 100).toFixed(1)}%`);
      
      // Check update conditions
      const lastUpdateDay = new Date(product.price_updated_at).toLocaleDateString('he-IL', { timeZone: 'Asia/Jerusalem' });
      const currentDay = israelNow.toLocaleDateString('he-IL', { timeZone: 'Asia/Jerusalem' });
      const hourInIsrael = israelNow.getHours();
      
      console.log('\nבדיקת תנאי עדכון:');
      console.log('תאריך עדכון אחרון:', lastUpdateDay);
      console.log('תאריך נוכחי:', currentDay);
      console.log('שעה נוכחית:', hourInIsrael);
      console.log('האם צריך לעדכן?', lastUpdateDay < currentDay && hourInIsrael === 1 ? 'כן' : 'לא');
      if (lastUpdateDay < currentDay && hourInIsrael === 1) {
        console.log('סיבת העדכון: השעה היא 01:00 והמחיר לא עודכן היום');
      } else if (lastUpdateDay >= currentDay) {
        console.log('סיבת אי-עדכון: המחיר כבר עודכן היום');
      } else if (hourInIsrael !== 1) {
        console.log('סיבת אי-עדכון: השעה אינה 01:00');
      }
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
        console.log('\n------------------------');
        console.log(`מוצר: ${product.name}`);
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