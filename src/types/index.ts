export interface Product {
  id: uuid;
  name: string;
  name_en: string;
  name_ar: string;
  description: string | null;
  description_en: string | null;
  description_ar: string | null;
  price: number;
  tomorrow_price: number | null;
  price_updated_at: string;
  price_unit: 'kg' | 'g' | 'unit';
  category: uuid;
  image: string | null;
  in_stock: boolean;
  quality: 'premium' | 'a' | 'b' | 'c';
  in_season: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: uuid;
  name: string;
  name_en: string;
  name_ar: string;
  is_visible: boolean;
  created_at: string;
}

export interface Review {
  id: uuid;
  customer_name: string;
  restaurant_name: string;
  content: string;
  rating: number;
  image: string | null;
  is_approved: boolean;
  created_at: string;
}

export interface Promotion {
  id: uuid;
  product_id: uuid;
  discount_price: number;
  start_date: string;
  end_date: string;
  created_at: string;
}

export interface Activitya {
  id: uuid;
  type: 'product_view' | 'product_update' | 'category_update' | 'review' | 'promotion' | 'settings_update';
  description: string;
  metadata: Json;
  created_at: string;
  actor?: string;
}

export interface CustomerType {
  id: uuid;
  name: string;
  name_en: string;
  name_ar: string;
  description: string;
  description_en: string;
  description_ar: string;
  icon: string;
  is_visible: boolean;
  created_at: string;
}

export interface Service {
  id: uuid;
  name: string;
  name_en: string;
  name_ar: string;
  description: string;
  description_en: string;
  description_ar: string;
  icon: string;
  is_visible: boolean;
  created_at: string;
}

export interface AboutContent {
  id: uuid;
  title: string;
  title_en: string;
  title_ar: string;
  content: string;
  content_en: string;
  content_ar: string;
  image: string;
  section: 'main' | 'vision' | 'advantages';
  order: number;
  created_at: string;
}

// Database types
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      products: {
        Row: Product
        Insert: Omit<Product, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Product, 'id'>>
      }
      categories: {
        Row: Category
        Insert: Omit<Category, 'id' | 'created_at'>
        Update: Partial<Omit<Category, 'id'>>
      }
      reviews: {
        Row: Review
        Insert: Omit<Review, 'id' | 'created_at'>
        Update: Partial<Omit<Review, 'id'>>
      }
      promotions: {
        Row: Promotion
        Insert: Omit<Promotion, 'id' | 'created_at'>
        Update: Partial<Omit<Promotion, 'id'>>
      }
      activities: {
        Row: Activitya;
        Insert: Omit<Activitya, 'id' | 'created_at'>;
        Update: Partial<Omit<Activitya, 'id'>>;
      }
      customer_types: {
        Row: CustomerType;
        Insert: Omit<CustomerType, 'id' | 'created_at'>;
        Update: Partial<Omit<CustomerType, 'id'>>;
      }
      services: {
        Row: Service;
        Insert: Omit<Service, 'id' | 'created_at'>;
        Update: Partial<Omit<Service, 'id'>>;
      }
      about_content: {
        Row: AboutContent;
        Insert: Omit<AboutContent, 'id' | 'created_at'>;
        Update: Partial<Omit<AboutContent, 'id'>>;
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}