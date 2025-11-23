-- Mental Health First Aid Bot - Initial Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    consented BOOLEAN DEFAULT FALSE,
    locale VARCHAR(10),
    age_range VARCHAR(20)
);

-- Sessions table
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    consented BOOLEAN DEFAULT FALSE,
    metadata JSONB,
    safe_mode BOOLEAN DEFAULT FALSE,
    safe_mode_expires TIMESTAMPTZ
);

-- Messages table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'bot', 'system', 'human')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    anonymized BOOLEAN DEFAULT FALSE,
    flagged BOOLEAN DEFAULT FALSE,
    classifier JSONB,
    crisis_detected BOOLEAN DEFAULT FALSE
);

-- Helplines table
CREATE TABLE helplines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    country_code VARCHAR(2) NOT NULL,
    region VARCHAR(100),
    description TEXT NOT NULL,
    phone VARCHAR(50) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('emergency', 'suicide', 'general', 'child', 'women', 'local_service')),
    priority INTEGER DEFAULT 1,
    metadata JSONB,
    active BOOLEAN DEFAULT TRUE
);

-- Techniques table
CREATE TABLE techniques (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL,
    locale VARCHAR(10) DEFAULT 'en',
    steps TEXT[] NOT NULL,
    duration_seconds INTEGER NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    description TEXT,
    category VARCHAR(50)
);

-- Audit log table
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID,
    session_id UUID,
    ip_address INET
);

-- Human review queue table
CREATE TABLE human_review_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL,
    message_id UUID,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_to VARCHAR(100),
    notes TEXT,
    crisis_level INTEGER,
    metadata JSONB
);

-- Indexes for performance
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_last_activity ON sessions(last_activity);
CREATE INDEX idx_messages_session_id ON messages(session_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_crisis_detected ON messages(crisis_detected);
CREATE INDEX idx_helplines_country_type ON helplines(country_code, type);
CREATE INDEX idx_helplines_active ON helplines(active);
CREATE INDEX idx_techniques_locale_active ON techniques(locale, active);
CREATE INDEX idx_audit_log_event_type ON audit_log(event_type);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);
CREATE INDEX idx_review_queue_status ON human_review_queue(status);
CREATE INDEX idx_review_queue_crisis_level ON human_review_queue(crisis_level);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_human_review_queue_updated_at 
    BEFORE UPDATE ON human_review_queue 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();