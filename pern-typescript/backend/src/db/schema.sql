-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL CHECK (length(trim(name)) >= 2),
    email VARCHAR(255) NOT NULL UNIQUE,
    bio TEXT CHECK (length(bio) <= 500),
    company VARCHAR(100),
    profile_picture TEXT,
    is_deleted BOOLEAN DEFAULT FALSE,
    last_profile_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit logs table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    action VARCHAR(10) NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE')),
    changes JSONB NOT NULL,
    changed_by UUID NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address INET,
    user_agent TEXT
);

-- Indexes for performance
CREATE INDEX idx_users_email_not_deleted ON users(email) WHERE is_deleted = FALSE;
CREATE INDEX idx_users_last_profile_update ON users(last_profile_update DESC);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_user_timestamp ON audit_logs(user_id, timestamp DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Function to prevent concurrent email updates
CREATE OR REPLACE FUNCTION check_email_uniqueness()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.email != OLD.email THEN
        -- Use advisory lock to prevent race conditions
        PERFORM pg_advisory_xact_lock(hashtext(NEW.email));
        
        IF EXISTS (
            SELECT 1 FROM users 
            WHERE email = NEW.email 
            AND id != NEW.id 
            AND is_deleted = FALSE
        ) THEN
            RAISE EXCEPTION 'Email already exists';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for email uniqueness check
CREATE TRIGGER check_email_uniqueness_trigger
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION check_email_uniqueness();

-- Cleanup old audit logs (optional - keep for 2 years)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS void AS $$
BEGIN
    DELETE FROM audit_logs 
    WHERE timestamp < CURRENT_TIMESTAMP - INTERVAL '2 years';
END;
$$ language 'plpgsql';

-- Sample data (optional)
INSERT INTO users (name, email, bio, company) VALUES
('John Doe', 'john@example.com', 'Software Developer', 'Tech Corp'),
('Jane Smith', 'jane@example.com', 'Product Manager', 'Startup Inc');