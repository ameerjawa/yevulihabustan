// Predefined product lists organized by category
export const productLists = {
  vegetables: [
    { name: 'עגבניות', name_en: 'Tomatoes', name_ar: 'طماطم', type: 'tomatoes' },
    { name: 'מלפפונים', name_en: 'Cucumbers', name_ar: 'خيار', type: 'cucumbers' },
    { name: 'גזר', name_en: 'Carrots', name_ar: 'جزر', type: 'carrots' },
    { name: 'תפוחי אדמה', name_en: 'Potatoes', name_ar: 'بطاطس', type: 'potatoes' },
    { name: 'בצל', name_en: 'Onions', name_ar: 'بصل', type: 'onions' },
    { name: 'חסה', name_en: 'Lettuce', name_ar: 'خس', type: 'lettuce' },
    { name: 'כרוב', name_en: 'Cabbage', name_ar: 'ملفوف', type: 'cabbage' },
    { name: 'פלפלים', name_en: 'Peppers', name_ar: 'فلفل', type: 'peppers' },
    { name: 'חציל', name_en: 'Eggplant', name_ar: 'باذنجان', type: 'eggplant' },
    { name: 'קישואים', name_en: 'Zucchini', name_ar: 'كوسة', type: 'zucchini' },
    { name: 'כרובית', name_en: 'Cauliflower', name_ar: 'قرنبيط', type: 'cauliflower' },
    { name: 'ברוקולי', name_en: 'Broccoli', name_ar: 'بروكلي', type: 'broccoli' }
  ],
  fruits: [
    { name: 'תפוחים', name_en: 'Apples', name_ar: 'تفاح', type: 'apples' },
    { name: 'תפוזים', name_en: 'Oranges', name_ar: 'برتقال', type: 'oranges' },
    { name: 'לימונים', name_en: 'Lemons', name_ar: 'ليمون', type: 'lemons' },
    { name: 'ענבים', name_en: 'Grapes', name_ar: 'عنب', type: 'grapes' },
    { name: 'תותים', name_en: 'Strawberries', name_ar: 'فراولة', type: 'strawberries' },
    { name: 'אבטיח', name_en: 'Watermelon', name_ar: 'بطيخ', type: 'watermelon' },
    { name: 'אגסים', name_en: 'Pears', name_ar: 'كمثرى', type: 'pears' }
  ],
  herbs: [
    { name: 'פטרוזיליה', name_en: 'Parsley', name_ar: 'بقدونس', type: 'parsley' },
    { name: 'נענע', name_en: 'Mint', name_ar: 'نعناع', type: 'mint' },
    { name: 'בזיליקום', name_en: 'Basil', name_ar: 'ريحان', type: 'basil' },
    { name: 'שמיר', name_en: 'Dill', name_ar: 'شبت', type: 'dill' },
    { name: 'כוסברה', name_en: 'Cilantro', name_ar: 'كزبرة', type: 'cilantro' }
  ]
} as const;

export type ProductType = typeof productLists[keyof typeof productLists][number]['type'];

export function getProductListByCategory(categoryId: string): typeof productLists[keyof typeof productLists] {
  switch (categoryId) {
    case 'vegetables':
      return productLists.vegetables;
    case 'fruits':
      return productLists.fruits;
    case 'herbs':
      return productLists.herbs;
    default:
      return [];
  }
}