-- Create user_profiles table
-- Data: 2025-01-20
-- Description: Tabela para armazenar perfis detalhados dos usuários

CREATE TABLE IF NOT EXISTS ${schema}.user_profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL, -- UUID do usuário do Supabase Auth
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    cpf VARCHAR(14),
    rg VARCHAR(12),
    birth_date DATE,
    gender VARCHAR(20),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create unique index on user_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_user_id 
ON ${schema}.user_profiles(user_id);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_name 
ON ${schema}.user_profiles(name);

CREATE INDEX IF NOT EXISTS idx_user_profiles_cpf 
ON ${schema}.user_profiles(cpf) 
WHERE cpf IS NOT NULL;

-- Enable RLS
ALTER TABLE ${schema}.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for user_profiles
-- Users can only access their own profile
CREATE POLICY "Users can access own profile" ON ${schema}.user_profiles
    FOR ALL USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Create update trigger
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON ${schema}.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions to schema_user
GRANT SELECT, INSERT, UPDATE, DELETE ON ${schema}.user_profiles TO ${schema_user};
GRANT USAGE, SELECT, UPDATE ON SEQUENCE ${schema}.user_profiles_id_seq TO ${schema_user};

-- Grant permissions to schema_admin_user
GRANT SELECT, INSERT, UPDATE, DELETE ON ${schema}.user_profiles TO ${schema_admin_user};
GRANT USAGE, SELECT, UPDATE ON SEQUENCE ${schema}.user_profiles_id_seq TO ${schema_admin_user};
