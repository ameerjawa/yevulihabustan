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
    -- Create the user
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      created_at,
      updated_at
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      uuid_generate_v4(),
      'authenticated',
      'authenticated',
      'admin@yevulei.com',
      crypt('admin123456', gen_salt('bf')),
      now(),
      now(),
      '{"provider": "email", "providers": ["email"]}',
      '{"role": "admin"}',
      false,
      now(),
      now()
    );

    -- Set up identities
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    )
    SELECT
      uuid_generate_v4(),
      id,
      jsonb_build_object('sub', id::text),
      'email',
      now(),
      now(),
      now()
    FROM auth.users
    WHERE email = 'admin@yevulei.com';
  END IF;
END $$;