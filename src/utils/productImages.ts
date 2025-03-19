import type { Product } from '../types';
import type { ProductType } from './productLists';

// Map of product types to their corresponding Unsplash image URLs
const productImageMap: Record<ProductType | string, string> = {
  // Vegetables
  'tomatoes': 'https://images.unsplash.com/photo-1546470427-e26264fde27e',
  'cucumbers': 'https://images.unsplash.com/photo-1604977042946-1eecc30f269e',
  'carrots': 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37',
  'potatoes': 'https://images.unsplash.com/photo-1518977676601-b53f82aba655',
  'onions': 'https://images.unsplash.com/photo-1620574387735-3624d75b2dbc',
  'lettuce': 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1',
  'cabbage': 'https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f',
  'peppers': 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83',
  'eggplant': 'https://images.unsplash.com/photo-1634464677220-98f2f4ee2c9f',
  'zucchini': 'https://images.unsplash.com/photo-1596505148270-c3cee3b24fb0',
  'cauliflower': 'https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3',
  'broccoli': 'https://images.unsplash.com/photo-1584270354949-c26b0d5b4a0c',
  
  // Fruits
  'apples': 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6',
  'oranges': 'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b',
  'lemons': 'https://images.unsplash.com/photo-1582087463261-ddea03f80e5d',
  'grapes': 'https://images.unsplash.com/photo-1537640538966-79f369143f8f',
  'strawberries': 'https://images.unsplash.com/photo-1518635017498-87f514b751ba',
  'watermelon': 'https://images.unsplash.com/photo-1563114773-84221bd62daa',
  'pears': 'https://images.unsplash.com/photo-1631160299919-6a175aa6d189',
  
  // Herbs
  'parsley': 'https://images.unsplash.com/photo-1599541409388-e7370d960f68',
  'mint': 'https://images.unsplash.com/photo-1628556270448-4d4e4148e1b1',
  'basil': 'https://images.unsplash.com/photo-1618164435735-413d3b066c9a',
  'dill': 'https://images.unsplash.com/photo-1596095627882-99ddb3854123',
  'cilantro': 'https://images.unsplash.com/photo-1625536069517-841e2c83a006',
  
  // Default image for unknown products
  'default': 'https://images.unsplash.com/photo-1542838132-92c53300491e'
};

export function getProductImage(type: string): string {
  return `${productImageMap[type] || productImageMap.default}?auto=format&fit=crop&w=800`;
}