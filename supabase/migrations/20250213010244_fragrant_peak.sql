/*
  # Add Customer Types, Services, and About Content Tables

  1. New Tables
    - `customer_types`: Stores different types of customers (restaurants, hospitals, etc.)
      - `id` (uuid, primary key)
      - `name` (text)
      - `name_en` (text)
      - `name_ar` (text)
      - `description` (text)
      - `description_en` (text)
      - `description_ar` (text)
      - `icon` (text)
      - `is_visible` (boolean)
      - `created_at` (timestamptz)

    - `services`: Stores available services
      - `id` (uuid, primary key)
      - `name` (text)
      - `name_en` (text)
      - `name_ar` (text)
      - `description` (text)
      - `description_en` (text)
      - `description_ar` (text)
      - `icon` (text)
      - `is_visible` (boolean)
      - `created_at` (timestamptz)

    - `about_content`: Stores website about section content
      - `id` (uuid, primary key)
      - `title` (text)
      - `title_en` (text)
      - `title_ar` (text)
      - `content` (text)
      - `content_en` (text)
      - `content_ar` (text)
      - `image` (text)
      - `section` (text)
      - `order` (integer)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for public read access
    - Add policies for admin full access
*/

-- Create customer_types table
CREATE TABLE IF NOT EXISTS customer_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_en text NOT NULL,
  name_ar text NOT NULL,
  description text,
  description_en text,
  description_ar text,
  icon text NOT NULL,
  is_visible boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create services table
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_en text NOT NULL,
  name_ar text NOT NULL,
  description text,
  description_en text,
  description_ar text,
  icon text NOT NULL,
  is_visible boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create about_content table
CREATE TABLE IF NOT EXISTS about_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  title_en text NOT NULL,
  title_ar text NOT NULL,
  content text NOT NULL,
  content_en text NOT NULL,
  content_ar text NOT NULL,
  image text,
  section text NOT NULL CHECK (section IN ('main', 'vision', 'advantages')),
  "order" integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE customer_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE about_content ENABLE ROW LEVEL SECURITY;

-- Policies for customer_types
CREATE POLICY "Allow public read access to customer_types"
  ON customer_types FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow admin full access to customer_types"
  ON customer_types FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policies for services
CREATE POLICY "Allow public read access to services"
  ON services FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow admin full access to services"
  ON services FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policies for about_content
CREATE POLICY "Allow public read access to about_content"
  ON about_content FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow admin full access to about_content"
  ON about_content FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customer_types_visibility ON customer_types(is_visible);
CREATE INDEX IF NOT EXISTS idx_services_visibility ON services(is_visible);
CREATE INDEX IF NOT EXISTS idx_about_content_section ON about_content(section);
CREATE INDEX IF NOT EXISTS idx_about_content_order ON about_content("order");

-- Insert some default data
INSERT INTO customer_types (name, name_en, name_ar, description, description_en, description_ar, icon)
VALUES 
  ('מסעדות', 'Restaurants', 'مطاعم', 'אספקת ירקות טריים ואיכותיים למסעדות ובתי קפה', 'Supply of fresh, quality vegetables to restaurants and cafes', 'توريد الخضروات الطازجة وعالية الجودة للمطاعم والمقاهي', 'utensils-crossed'),
  ('בתי אבות', 'Retirement Homes', 'دور المسنين', 'אספקה קבועה ואמינה לבתי אבות ודיור מוגן', 'Regular and reliable supply to retirement homes and assisted living facilities', 'إمداد منتظم وموثوق لدور المسنين ومرافق المعيشة المدعومة', 'building-2'),
  ('גני ילדים', 'Kindergartens', 'رياض الأطفال', 'אספקת ירקות טריים למוסדות חינוך וגני ילדים', 'Supply of fresh vegetables to educational institutions and kindergartens', 'توريد الخضروات الطازجة للمؤسسات التعليمية ورياض الأطفال', 'school'),
  ('בתי חולים', 'Hospitals', 'المستشفيات', 'אספקה יומית לבתי חולים ומוסדות רפואיים', 'Daily supply to hospitals and medical institutions', 'إمداد يومي للمستشفيات والمؤسسات الطبية', 'building');

INSERT INTO services (name, name_en, name_ar, description, description_en, description_ar, icon)
VALUES 
  ('אספקה יומית', 'Daily Supply', 'توريد يومي', 'משלוחים יומיים של תוצרת טרייה ישירות אליכם', 'Daily deliveries of fresh produce directly to you', 'توصيل يومي للمنتجات الطازجة مباشرة إليك', 'truck'),
  ('זמינות גבוהה', 'High Availability', 'توافر عالي', 'שירות זמין ומענה מהיר לכל בקשה', 'Available service and quick response to every request', 'خدمة متوفرة واستجابة سريعة لكل طلب', 'clock'),
  ('איכות מעולה', 'Premium Quality', 'جودة ممتازة', 'מוצרים באיכות גבוהה ובטריות מקסימלית', 'High quality products with maximum freshness', 'منتجات عالية الجودة مع أقصى درجات الطزاجة', 'thumbs-up'),
  ('שירות אישי', 'Personal Service', 'خدمة شخصية', 'ליווי אישי והתאמה לצרכים הספציפיים שלכם', 'Personal guidance and adaptation to your specific needs', 'توجيه شخصي وتكييف لاحتياجاتك الخاصة', 'heart-handshake');

INSERT INTO about_content (title, title_en, title_ar, content, content_en, content_ar, section, "order")
VALUES 
  ('יבולי הבוסתן', 'Yevulei HaBustan', 'يفولي هبوستان', 'ספק ירקות טריים מוביל לעסקים ומוסדות', 'Leading fresh vegetable supplier for businesses and institutions', 'مورد رائد للخضروات الطازجة للشركات والمؤسسات', 'main', 1),
  ('החזון שלנו', 'Our Vision', 'رؤيتنا', 'להיות הספק המוביל והאמין ביותר של ירקות טריים ואיכותיים', 'To be the leading and most reliable supplier of fresh, quality vegetables', 'أن نكون المورد الرائد والأكثر موثوقية للخضروات الطازجة وعالية الجودة', 'vision', 2);