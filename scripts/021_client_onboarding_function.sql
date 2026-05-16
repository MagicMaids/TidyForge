-- Create a secure function to handle client onboarding
-- This bypasses RLS by running with SECURITY DEFINER privileges

CREATE OR REPLACE FUNCTION create_client_onboarding_profile(
  p_email TEXT,
  p_first_name TEXT,
  p_last_name TEXT,
  p_phone TEXT,
  p_company_name TEXT DEFAULT NULL,
  p_address TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_auth_user_id UUID;
  v_client_id UUID;
  v_portal_user_id UUID;
  v_user_id UUID;
  v_result JSON;
BEGIN
  -- Get the authenticated user's ID
  v_auth_user_id := auth.uid();
  
  IF v_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;

  -- Check if client already exists for this auth user
  SELECT id INTO v_client_id
  FROM clients
  WHERE email = p_email;

  -- If client doesn't exist, create it
  IF v_client_id IS NULL THEN
    INSERT INTO clients (
      email,
      first_name,
      last_name,
      phone,
      company_name,
      address
    ) VALUES (
      p_email,
      p_first_name,
      p_last_name,
      p_phone,
      p_company_name,
      p_address
    )
    RETURNING id INTO v_client_id;
  END IF;

  -- Create or update client portal user
  INSERT INTO client_portal_users (
    email,
    client_id,
    auth_user_id,
    is_active
  ) VALUES (
    p_email,
    v_client_id,
    v_auth_user_id,
    TRUE
  )
  ON CONFLICT (email) 
  DO UPDATE SET 
    auth_user_id = v_auth_user_id,
    client_id = v_client_id,
    is_active = TRUE
  RETURNING id INTO v_portal_user_id;

  -- Create or update user record with account_type
  INSERT INTO users (
    id,
    email,
    first_name,
    last_name,
    account_type,
    company_id
  ) VALUES (
    v_auth_user_id,
    p_email,
    p_first_name,
    p_last_name,
    'client',
    NULL
  )
  ON CONFLICT (id)
  DO UPDATE SET
    email = p_email,
    first_name = p_first_name,
    last_name = p_last_name,
    account_type = 'client'
  RETURNING id INTO v_user_id;

  -- Return success with IDs
  v_result := json_build_object(
    'success', TRUE,
    'client_id', v_client_id,
    'portal_user_id', v_portal_user_id,
    'user_id', v_user_id
  );

  RETURN v_result;

EXCEPTION WHEN OTHERS THEN
  -- Return error details
  v_result := json_build_object(
    'success', FALSE,
    'error', SQLERRM,
    'detail', SQLSTATE
  );
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_client_onboarding_profile TO authenticated;
