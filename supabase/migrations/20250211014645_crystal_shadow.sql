/*
  # Add Admin User

  1. Changes
    - Add admin user to auth.users table
    - Set up admin role and permissions
*/

-- Create admin user if it doesn't exist
DO $$
DECLARE
  admin_uid UUID;
BEGIN
  -- Check if admin user exists
  SELECT id INTO admin_uid
  FROM auth.users
  WHERE email = 'admin@yevulei.com';

  -- If admin doesn't exist, create it
  IF admin_uid IS NULL THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'admin@yevulei.com',
      crypt('admin123456', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"role":"admin"}',
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    );
  END IF;
END $$;