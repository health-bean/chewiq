-- =====================================================
-- Health Platform Database Schema
-- Generated: 2025-07-13T22:57:08.477Z
-- Tables: 19
-- Views: 4
-- Indexes: 34
-- JSONB Columns: 8
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Set timezone
SET timezone = 'UTC';

-- =====================================================
-- TABLE DEFINITIONS
-- =====================================================

-- Table: anonymous_data_pool
CREATE TABLE IF NOT EXISTS anonymous_data_pool (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    anonymized_user_id UUID,
    protocol_type VARCHAR(100),
    user_demographics JSONB,
    health_conditions ARRAY,
    tracking_data JSONB,
    outcome_metrics JSONB,
    data_hash VARCHAR(255),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    PRIMARY KEY (id)
);


-- Table: content_items
CREATE TABLE IF NOT EXISTS content_items (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    external_id VARCHAR(255),
    title VARCHAR(255) NOT NULL,
    content TEXT,
    summary TEXT,
    url VARCHAR(500),
    category VARCHAR(100),
    tags ARRAY,
    content_type VARCHAR(50),
    protocol_relevance ARRAY,
    is_global BOOLEAN DEFAULT true,
    created_by UUID,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    PRIMARY KEY (id)
);

ALTER TABLE content_items ADD CONSTRAINT content_items_created_by_fkey FOREIGN KEY (created_by) REFERENCES users(id);

-- Table: detox_types
CREATE TABLE IF NOT EXISTS detox_types (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    duration_suggested INTEGER,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY (id)
);


-- Table: food_properties
CREATE TABLE IF NOT EXISTS food_properties (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    nightshade BOOLEAN DEFAULT false,
    histamine VARCHAR(10) DEFAULT 'low'::character varying,
    oxalate VARCHAR(10) DEFAULT 'low'::character varying,
    lectin VARCHAR(10) DEFAULT 'low'::character varying,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    fodmap VARCHAR(20),
    salicylate VARCHAR(20),
    PRIMARY KEY (id)
);


-- Table: journal_entries
CREATE TABLE IF NOT EXISTS journal_entries (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    user_id UUID,
    entry_date DATE NOT NULL,
    bedtime TIME WITHOUT TIME ZONE,
    wake_time TIME WITHOUT TIME ZONE,
    sleep_quality VARCHAR(20),
    overnight_symptoms TEXT,
    stress_level INTEGER,
    stress_event TEXT,
    overall_feeling VARCHAR(20),
    activity_level VARCHAR(20),
    detox_coffee_enema BOOLEAN DEFAULT false,
    detox_mag_foot_bath BOOLEAN DEFAULT false,
    detox_other TEXT,
    meditation_practice BOOLEAN DEFAULT false,
    meditation_minutes INTEGER DEFAULT 0,
    mindfulness_activities TEXT,
    additional_notes TEXT,
    consent_to_anonymize BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    energy_level INTEGER,
    mood_level INTEGER,
    physical_comfort INTEGER,
    cycle_day VARCHAR(10),
    ovulation BOOLEAN DEFAULT false,
    PRIMARY KEY (id)
);

ALTER TABLE journal_entries ADD CONSTRAINT journal_entries_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);

-- Table: medications_database
CREATE TABLE IF NOT EXISTS medications_database (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    prescription_required BOOLEAN DEFAULT true,
    description TEXT,
    synonyms ARRAY,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY (id)
);


-- Table: patient_content
CREATE TABLE IF NOT EXISTS patient_content (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    patient_id UUID,
    content_id UUID,
    assigned_by UUID,
    assignment_date TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    read_at TIMESTAMP WITHOUT TIME ZONE,
    rating INTEGER,
    notes TEXT,
    PRIMARY KEY (id)
);

ALTER TABLE patient_content ADD CONSTRAINT patient_content_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES users(id);
ALTER TABLE patient_content ADD CONSTRAINT patient_content_content_id_fkey FOREIGN KEY (content_id) REFERENCES content_items(id);
ALTER TABLE patient_content ADD CONSTRAINT patient_content_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES users(id);

-- Table: patient_practitioner_relationships
CREATE TABLE IF NOT EXISTS patient_practitioner_relationships (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL,
    practitioner_id UUID NOT NULL,
    status VARCHAR(20) DEFAULT 'active'::character varying,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

ALTER TABLE patient_practitioner_relationships ADD CONSTRAINT patient_practitioner_relationships_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES users(id);
ALTER TABLE patient_practitioner_relationships ADD CONSTRAINT patient_practitioner_relationships_practitioner_id_fkey FOREIGN KEY (practitioner_id) REFERENCES users(id);

-- Table: practitioner_access
CREATE TABLE IF NOT EXISTS practitioner_access (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    patient_id UUID,
    practitioner_id UUID,
    access_level VARCHAR(50) DEFAULT 'full'::character varying,
    granted_date TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    revoked_date TIMESTAMP WITHOUT TIME ZONE,
    active BOOLEAN DEFAULT true,
    PRIMARY KEY (id)
);

ALTER TABLE practitioner_access ADD CONSTRAINT practitioner_access_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES users(id);
ALTER TABLE practitioner_access ADD CONSTRAINT practitioner_access_practitioner_id_fkey FOREIGN KEY (practitioner_id) REFERENCES users(id);

-- Table: protocol_food_rules
CREATE TABLE IF NOT EXISTS protocol_food_rules (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    protocol_id UUID,
    food_id UUID,
    status VARCHAR(20) NOT NULL,
    phase INTEGER DEFAULT 1,
    notes TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    PRIMARY KEY (id)
);

ALTER TABLE protocol_food_rules ADD CONSTRAINT protocol_food_rules_protocol_id_fkey FOREIGN KEY (protocol_id) REFERENCES protocols(id);
ALTER TABLE protocol_food_rules ADD CONSTRAINT protocol_food_rules_food_id_fkey FOREIGN KEY (food_id) REFERENCES food_properties(id);

-- Table: protocols
CREATE TABLE IF NOT EXISTS protocols (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    phases JSONB,
    created_by UUID,
    is_global BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    official BOOLEAN DEFAULT false,
    version VARCHAR(20) DEFAULT '1.0'::character varying,
    protocol_type VARCHAR(20) DEFAULT 'rule_based'::character varying,
    PRIMARY KEY (id)
);

ALTER TABLE protocols ADD CONSTRAINT protocols_created_by_fkey FOREIGN KEY (created_by) REFERENCES users(id);

-- Table: supplements_database
CREATE TABLE IF NOT EXISTS supplements_database (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    synonyms ARRAY,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY (id)
);


-- Table: symptoms_database
CREATE TABLE IF NOT EXISTS symptoms_database (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    synonyms ARRAY,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY (id)
);


-- Table: timeline_entries
CREATE TABLE IF NOT EXISTS timeline_entries (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    journal_entry_id UUID,
    user_id UUID,
    entry_time TIME WITHOUT TIME ZONE NOT NULL,
    entry_type VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    severity INTEGER,
    protocol_compliant BOOLEAN,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    duration_minutes INTEGER,
    notes TEXT,
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    structured_content JSONB,
    PRIMARY KEY (id)
);

ALTER TABLE timeline_entries ADD CONSTRAINT timeline_entries_journal_entry_id_fkey FOREIGN KEY (journal_entry_id) REFERENCES journal_entries(id);
ALTER TABLE timeline_entries ADD CONSTRAINT timeline_entries_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);

-- Table: user_frequent_items
CREATE TABLE IF NOT EXISTS user_frequent_items (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    user_id UUID,
    item_name VARCHAR(255) NOT NULL,
    item_type VARCHAR(50) NOT NULL,
    frequency_score INTEGER DEFAULT 1,
    last_used_date DATE,
    is_daily BOOLEAN DEFAULT false,
    active BOOLEAN DEFAULT true,
    PRIMARY KEY (id)
);

ALTER TABLE user_frequent_items ADD CONSTRAINT user_frequent_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);

-- Table: user_preferences
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    preferences JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
);

ALTER TABLE user_preferences ADD CONSTRAINT user_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);

-- Table: user_protocols
CREATE TABLE IF NOT EXISTS user_protocols (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID,
    protocol_id UUID,
    current_phase INTEGER DEFAULT 1,
    start_date DATE NOT NULL,
    end_date DATE,
    compliance_score NUMERIC,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    PRIMARY KEY (id)
);

ALTER TABLE user_protocols ADD CONSTRAINT user_protocols_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);
ALTER TABLE user_protocols ADD CONSTRAINT user_protocols_protocol_id_fkey FOREIGN KEY (protocol_id) REFERENCES protocols(id);

-- Table: user_sessions
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    refresh_token VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_agent TEXT,
    ip_address INET,
    PRIMARY KEY (id)
);

ALTER TABLE user_sessions ADD CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);

-- Table: users
CREATE TABLE IF NOT EXISTS users (
    id UUID NOT NULL DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    data_sharing_consent BOOLEAN DEFAULT false,
    anonymization_consent BOOLEAN DEFAULT false,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now(),
    custom_food_overrides JSONB DEFAULT '{}'::jsonb,
    current_protocol_id UUID,
    password_hash VARCHAR(255),
    user_type user_type_enum DEFAULT 'patient'::user_type_enum,
    email_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    PRIMARY KEY (id)
);

ALTER TABLE users ADD CONSTRAINT users_current_protocol_id_fkey FOREIGN KEY (current_protocol_id) REFERENCES protocols(id);

-- =====================================================
-- VIEW DEFINITIONS
-- =====================================================

-- View: exercise_energy_correlations
CREATE OR REPLACE VIEW exercise_energy_correlations AS
 WITH exercise_sessions AS (
         SELECT te.user_id,
            te.entry_date,
            te.entry_time,
            te.content AS exercise_type,
            te.severity AS intensity,
            te.created_at
           FROM timeline_entries te
          WHERE ((te.entry_type)::text = 'exercise'::text)
        ), energy_levels AS (
         SELECT te.user_id,
            te.entry_date,
            te.entry_time,
            te.content AS energy_description,
            te.severity AS energy_level,
            te.created_at
           FROM timeline_entries te
          WHERE ((te.entry_type)::text = 'energy'::text)
        )
 SELECT es.exercise_type,
    es.intensity AS exercise_intensity,
    count(
        CASE
            WHEN ((el.entry_time > es.entry_time) AND (el.entry_time <= (es.entry_time + '04:00:00'::interval))) THEN 1
            ELSE NULL::integer
        END) AS immediate_energy_entries,
    avg(
        CASE
            WHEN ((el.entry_time > es.entry_time) AND (el.entry_time <= (es.entry_time + '04:00:00'::interval))) THEN el.energy_level
            ELSE NULL::integer
        END) AS avg_post_exercise_energy,
    count(
        CASE
            WHEN ((el.entry_time > (es.entry_time + '18:00:00'::interval)) AND (el.entry_time <= (es.entry_time + '30:00:00'::interval))) THEN 1
            ELSE NULL::integer
        END) AS next_day_energy_entries,
    avg(
        CASE
            WHEN ((el.entry_time > (es.entry_time + '18:00:00'::interval)) AND (el.entry_time <= (es.entry_time + '30:00:00'::interval))) THEN el.energy_level
            ELSE NULL::integer
        END) AS avg_next_day_energy
   FROM (exercise_sessions es
     LEFT JOIN energy_levels el ON (((es.user_id = el.user_id) AND ((el.entry_date >= es.entry_date) AND (el.entry_date <= (es.entry_date + '1 day'::interval))))))
  GROUP BY es.exercise_type, es.intensity
 HAVING (count(es.*) >= 3)
  ORDER BY (avg(
        CASE
            WHEN ((el.entry_time > es.entry_time) AND (el.entry_time <= (es.entry_time + '04:00:00'::interval))) THEN el.energy_level
            ELSE NULL::integer
        END)) DESC NULLS LAST;;

-- View: medication_symptom_correlations
CREATE OR REPLACE VIEW medication_symptom_correlations AS
 WITH medication_timeline AS (
         SELECT te.user_id,
            te.entry_date,
            te.entry_time,
            te.content AS medication,
            te.created_at
           FROM timeline_entries te
          WHERE ((te.entry_type)::text = 'medication'::text)
        ), symptom_timeline AS (
         SELECT te.user_id,
            te.entry_date,
            te.entry_time,
            te.content AS symptom,
            te.severity,
            te.created_at
           FROM timeline_entries te
          WHERE ((te.entry_type)::text = ANY ((ARRAY['symptom'::character varying, 'side_effect'::character varying])::text[]))
        )
 SELECT mt.medication,
    st.symptom,
    count(*) AS correlation_count,
    avg(st.severity) AS avg_severity,
    round((((count(*))::numeric * 1.0) / (NULLIF(( SELECT count(*) AS count
           FROM medication_timeline mt2
          WHERE (mt2.medication = mt.medication)), 0))::numeric), 3) AS correlation_rate
   FROM (medication_timeline mt
     JOIN symptom_timeline st ON (((mt.user_id = st.user_id) AND (mt.entry_date = st.entry_date) AND (st.entry_time >= mt.entry_time) AND (st.entry_time <= (mt.entry_time + '06:00:00'::interval)))))
  GROUP BY mt.medication, st.symptom
 HAVING (count(*) >= 1)
  ORDER BY (count(*)) DESC, (round((((count(*))::numeric * 1.0) / (NULLIF(( SELECT count(*) AS count
           FROM medication_timeline mt2
          WHERE (mt2.medication = mt.medication)), 0))::numeric), 3)) DESC;;

-- View: stress_symptom_amplification
CREATE OR REPLACE VIEW stress_symptom_amplification AS
 WITH stress_events AS (
         SELECT te.user_id,
            te.entry_date,
            te.entry_time,
            te.severity AS stress_level,
            te.content AS stress_source,
            te.created_at
           FROM timeline_entries te
          WHERE ((te.entry_type)::text = 'stress'::text)
        ), symptom_events AS (
         SELECT te.user_id,
            te.entry_date,
            te.entry_time,
            te.content AS symptom,
            te.severity AS symptom_severity,
            te.created_at
           FROM timeline_entries te
          WHERE ((te.entry_type)::text = 'symptom'::text)
        )
 SELECT se.symptom,
    count(
        CASE
            WHEN (stress.stress_level >= 7) THEN 1
            ELSE NULL::integer
        END) AS high_stress_occurrences,
    avg(
        CASE
            WHEN (stress.stress_level >= 7) THEN se.symptom_severity
            ELSE NULL::integer
        END) AS avg_severity_high_stress,
    count(
        CASE
            WHEN (stress.stress_level <= 4) THEN 1
            ELSE NULL::integer
        END) AS low_stress_occurrences,
    avg(
        CASE
            WHEN (stress.stress_level <= 4) THEN se.symptom_severity
            ELSE NULL::integer
        END) AS avg_severity_low_stress,
    (avg(
        CASE
            WHEN (stress.stress_level >= 7) THEN se.symptom_severity
            ELSE NULL::integer
        END) - avg(
        CASE
            WHEN (stress.stress_level <= 4) THEN se.symptom_severity
            ELSE NULL::integer
        END)) AS stress_amplification_factor
   FROM (symptom_events se
     LEFT JOIN stress_events stress ON (((se.user_id = stress.user_id) AND (se.entry_date = stress.entry_date) AND (abs(EXTRACT(epoch FROM (se.entry_time - stress.entry_time))) <= (14400)::numeric))))
  GROUP BY se.symptom
 HAVING ((count(
        CASE
            WHEN (stress.stress_level >= 7) THEN 1
            ELSE NULL::integer
        END) >= 3) AND (count(
        CASE
            WHEN (stress.stress_level <= 4) THEN 1
            ELSE NULL::integer
        END) >= 3))
  ORDER BY (avg(
        CASE
            WHEN (stress.stress_level >= 7) THEN se.symptom_severity
            ELSE NULL::integer
        END) - avg(
        CASE
            WHEN (stress.stress_level <= 4) THEN se.symptom_severity
            ELSE NULL::integer
        END)) DESC NULLS LAST;;

-- View: supplement_sleep_correlations
CREATE OR REPLACE VIEW supplement_sleep_correlations AS
 WITH evening_supplements AS (
         SELECT te.user_id,
            te.entry_date,
            te.entry_time,
            te.content AS supplement,
            te.created_at
           FROM timeline_entries te
          WHERE (((te.entry_type)::text = 'supplement'::text) AND (te.entry_time >= '18:00:00'::time without time zone))
        ), sleep_quality AS (
         SELECT te.user_id,
            te.entry_date,
            te.content AS sleep_description,
            te.severity AS sleep_quality_score,
            te.created_at
           FROM timeline_entries te
          WHERE ((te.entry_type)::text = 'sleep'::text)
        )
 SELECT es.supplement,
    count(*) AS nights_taken,
    round(avg(sq.sleep_quality_score), 1) AS avg_sleep_quality,
    count(
        CASE
            WHEN (sq.sleep_quality_score >= 8) THEN 1
            ELSE NULL::integer
        END) AS good_sleep_nights,
    count(
        CASE
            WHEN (sq.sleep_quality_score <= 5) THEN 1
            ELSE NULL::integer
        END) AS poor_sleep_nights,
    round((((count(
        CASE
            WHEN (sq.sleep_quality_score >= 8) THEN 1
            ELSE NULL::integer
        END))::numeric * 1.0) / (NULLIF(count(*), 0))::numeric), 2) AS good_sleep_rate
   FROM (evening_supplements es
     LEFT JOIN sleep_quality sq ON (((es.user_id = sq.user_id) AND (sq.entry_date = (es.entry_date + '1 day'::interval)))))
  GROUP BY es.supplement
 HAVING (count(*) >= 2)
  ORDER BY (round(avg(sq.sleep_quality_score), 1)) DESC, (round((((count(
        CASE
            WHEN (sq.sleep_quality_score >= 8) THEN 1
            ELSE NULL::integer
        END))::numeric * 1.0) / (NULLIF(count(*), 0))::numeric), 2)) DESC;;

-- =====================================================
-- INDEX DEFINITIONS
-- =====================================================

-- Index on anonymous_data_pool
CREATE UNIQUE INDEX anonymous_data_pool_data_hash_key ON public.anonymous_data_pool USING btree (data_hash);

-- Index on detox_types
CREATE INDEX idx_detox_types_name_search ON public.detox_types USING gin (to_tsvector('english'::regconfig, (name)::text));

-- Index on food_properties
CREATE UNIQUE INDEX food_properties_name_key ON public.food_properties USING btree (name);

-- Index on food_properties
CREATE INDEX idx_food_properties_category ON public.food_properties USING btree (category);

-- Index on food_properties
CREATE INDEX idx_food_properties_histamine ON public.food_properties USING btree (histamine);

-- Index on food_properties
CREATE INDEX idx_food_properties_lectin ON public.food_properties USING btree (lectin);

-- Index on food_properties
CREATE INDEX idx_food_properties_nightshade ON public.food_properties USING btree (nightshade);

-- Index on food_properties
CREATE INDEX idx_food_properties_oxalate ON public.food_properties USING btree (oxalate);

-- Index on medications_database
CREATE INDEX idx_medications_name_search ON public.medications_database USING gin (to_tsvector('english'::regconfig, (name)::text));

-- Index on patient_practitioner_relationships
CREATE INDEX idx_patient_practitioner_patient ON public.patient_practitioner_relationships USING btree (patient_id);

-- Index on patient_practitioner_relationships
CREATE INDEX idx_patient_practitioner_practitioner ON public.patient_practitioner_relationships USING btree (practitioner_id);

-- Index on patient_practitioner_relationships
CREATE INDEX idx_patient_practitioner_status ON public.patient_practitioner_relationships USING btree (status);

-- Index on patient_practitioner_relationships
CREATE UNIQUE INDEX patient_practitioner_relationshi_patient_id_practitioner_id_key ON public.patient_practitioner_relationships USING btree (patient_id, practitioner_id);

-- Index on protocol_food_rules
CREATE INDEX idx_protocol_food_rules_food ON public.protocol_food_rules USING btree (food_id);

-- Index on protocol_food_rules
CREATE INDEX idx_protocol_food_rules_protocol ON public.protocol_food_rules USING btree (protocol_id);

-- Index on protocol_food_rules
CREATE INDEX idx_protocol_food_rules_status ON public.protocol_food_rules USING btree (status);

-- Index on protocol_food_rules
CREATE UNIQUE INDEX protocol_food_rules_protocol_id_food_id_key ON public.protocol_food_rules USING btree (protocol_id, food_id);

-- Index on supplements_database
CREATE INDEX idx_supplements_name_search ON public.supplements_database USING gin (to_tsvector('english'::regconfig, (name)::text));

-- Index on symptoms_database
CREATE INDEX idx_symptoms_name_search ON public.symptoms_database USING gin (to_tsvector('english'::regconfig, (name)::text));

-- Index on timeline_entries
CREATE INDEX idx_timeline_structured_content_gin ON public.timeline_entries USING gin (structured_content);

-- Index on timeline_entries
CREATE INDEX idx_timeline_structured_content_type ON public.timeline_entries USING btree (((structured_content ->> 'type'::text)));

-- Index on user_preferences
CREATE INDEX idx_user_preferences_user_id ON public.user_preferences USING btree (user_id);

-- Index on user_preferences
CREATE UNIQUE INDEX user_preferences_user_id_key ON public.user_preferences USING btree (user_id);

-- Index on user_protocols
CREATE INDEX idx_user_protocols_protocol ON public.user_protocols USING btree (protocol_id);

-- Index on user_protocols
CREATE INDEX idx_user_protocols_user ON public.user_protocols USING btree (user_id);

-- Index on user_sessions
CREATE INDEX idx_user_sessions_expires ON public.user_sessions USING btree (expires_at);

-- Index on user_sessions
CREATE INDEX idx_user_sessions_token ON public.user_sessions USING btree (refresh_token);

-- Index on user_sessions
CREATE INDEX idx_user_sessions_user_id ON public.user_sessions USING btree (user_id);

-- Index on user_sessions
CREATE UNIQUE INDEX user_sessions_refresh_token_key ON public.user_sessions USING btree (refresh_token);

-- Index on users
CREATE INDEX idx_users_active ON public.users USING btree (is_active);

-- Index on users
CREATE INDEX idx_users_created_at ON public.users USING btree (created_at);

-- Index on users
CREATE INDEX idx_users_email ON public.users USING btree (email);

-- Index on users
CREATE INDEX idx_users_type ON public.users USING btree (user_type);

-- Index on users
CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);

-- =====================================================
-- CONSTRAINT DEFINITIONS
-- =====================================================

-- CHECK constraint on anonymous_data_pool
ALTER TABLE anonymous_data_pool ADD CONSTRAINT 2200_16686_1_not_null CHECK id IS NOT NULL;

-- UNIQUE constraint on anonymous_data_pool
ALTER TABLE anonymous_data_pool ADD CONSTRAINT anonymous_data_pool_data_hash_key UNIQUE (anonymous_data_pool_data_hash_key);

-- CHECK constraint on content_items
ALTER TABLE content_items ADD CONSTRAINT 2200_16636_1_not_null CHECK id IS NOT NULL;

-- CHECK constraint on content_items
ALTER TABLE content_items ADD CONSTRAINT 2200_16636_4_not_null CHECK title IS NOT NULL;

-- CHECK constraint on detox_types
ALTER TABLE detox_types ADD CONSTRAINT 2200_16863_1_not_null CHECK id IS NOT NULL;

-- CHECK constraint on detox_types
ALTER TABLE detox_types ADD CONSTRAINT 2200_16863_2_not_null CHECK name IS NOT NULL;

-- CHECK constraint on detox_types
ALTER TABLE detox_types ADD CONSTRAINT 2200_16863_3_not_null CHECK category IS NOT NULL;

-- CHECK constraint on food_properties
ALTER TABLE food_properties ADD CONSTRAINT 2200_16729_1_not_null CHECK id IS NOT NULL;

-- CHECK constraint on food_properties
ALTER TABLE food_properties ADD CONSTRAINT 2200_16729_2_not_null CHECK name IS NOT NULL;

-- CHECK constraint on food_properties
ALTER TABLE food_properties ADD CONSTRAINT 2200_16729_3_not_null CHECK category IS NOT NULL;

-- UNIQUE constraint on food_properties
ALTER TABLE food_properties ADD CONSTRAINT food_properties_name_key UNIQUE (food_properties_name_key);

-- CHECK constraint on journal_entries
ALTER TABLE journal_entries ADD CONSTRAINT 2200_16565_1_not_null CHECK id IS NOT NULL;

-- CHECK constraint on journal_entries
ALTER TABLE journal_entries ADD CONSTRAINT 2200_16565_4_not_null CHECK entry_date IS NOT NULL;

-- CHECK constraint on journal_entries
ALTER TABLE journal_entries ADD CONSTRAINT journal_entries_energy_level_check CHECK ((energy_level >= 1) AND (energy_level <= 10));

-- CHECK constraint on journal_entries
ALTER TABLE journal_entries ADD CONSTRAINT journal_entries_mood_level_check CHECK ((mood_level >= 1) AND (mood_level <= 10));

-- CHECK constraint on journal_entries
ALTER TABLE journal_entries ADD CONSTRAINT journal_entries_physical_comfort_check CHECK ((physical_comfort >= 1) AND (physical_comfort <= 10));

-- CHECK constraint on medications_database
ALTER TABLE medications_database ADD CONSTRAINT 2200_16847_1_not_null CHECK id IS NOT NULL;

-- CHECK constraint on medications_database
ALTER TABLE medications_database ADD CONSTRAINT 2200_16847_2_not_null CHECK name IS NOT NULL;

-- CHECK constraint on medications_database
ALTER TABLE medications_database ADD CONSTRAINT 2200_16847_3_not_null CHECK category IS NOT NULL;

-- CHECK constraint on patient_content
ALTER TABLE patient_content ADD CONSTRAINT 2200_16657_1_not_null CHECK id IS NOT NULL;

-- CHECK constraint on patient_practitioner_relationships
ALTER TABLE patient_practitioner_relationships ADD CONSTRAINT 2200_16912_1_not_null CHECK id IS NOT NULL;

-- CHECK constraint on patient_practitioner_relationships
ALTER TABLE patient_practitioner_relationships ADD CONSTRAINT 2200_16912_2_not_null CHECK patient_id IS NOT NULL;

-- CHECK constraint on patient_practitioner_relationships
ALTER TABLE patient_practitioner_relationships ADD CONSTRAINT 2200_16912_3_not_null CHECK practitioner_id IS NOT NULL;

-- UNIQUE constraint on patient_practitioner_relationships
ALTER TABLE patient_practitioner_relationships ADD CONSTRAINT patient_practitioner_relationshi_patient_id_practitioner_id_key UNIQUE (patient_practitioner_relationshi_patient_id_practitioner_id_key);

-- CHECK constraint on patient_practitioner_relationships
ALTER TABLE patient_practitioner_relationships ADD CONSTRAINT patient_practitioner_relationships_status_check CHECK ((status)::text = ANY ((ARRAY['active'::character varying, 'pending'::character varying, 'revoked'::character varying])::text[]));

-- CHECK constraint on practitioner_access
ALTER TABLE practitioner_access ADD CONSTRAINT 2200_16483_1_not_null CHECK id IS NOT NULL;

-- CHECK constraint on protocol_food_rules
ALTER TABLE protocol_food_rules ADD CONSTRAINT 2200_16750_1_not_null CHECK id IS NOT NULL;

-- CHECK constraint on protocol_food_rules
ALTER TABLE protocol_food_rules ADD CONSTRAINT 2200_16750_4_not_null CHECK status IS NOT NULL;

-- UNIQUE constraint on protocol_food_rules
ALTER TABLE protocol_food_rules ADD CONSTRAINT protocol_food_rules_protocol_id_food_id_key UNIQUE (protocol_food_rules_protocol_id_food_id_key);

-- CHECK constraint on protocol_food_rules
ALTER TABLE protocol_food_rules ADD CONSTRAINT protocol_food_rules_status_check CHECK ((status)::text = ANY ((ARRAY['included'::character varying, 'avoid_for_now'::character varying, 'try_in_moderation'::character varying])::text[]));

-- CHECK constraint on protocols
ALTER TABLE protocols ADD CONSTRAINT 2200_16507_1_not_null CHECK id IS NOT NULL;

-- CHECK constraint on protocols
ALTER TABLE protocols ADD CONSTRAINT 2200_16507_2_not_null CHECK name IS NOT NULL;

-- CHECK constraint on supplements_database
ALTER TABLE supplements_database ADD CONSTRAINT 2200_16832_1_not_null CHECK id IS NOT NULL;

-- CHECK constraint on supplements_database
ALTER TABLE supplements_database ADD CONSTRAINT 2200_16832_2_not_null CHECK name IS NOT NULL;

-- CHECK constraint on supplements_database
ALTER TABLE supplements_database ADD CONSTRAINT 2200_16832_3_not_null CHECK category IS NOT NULL;

-- CHECK constraint on symptoms_database
ALTER TABLE symptoms_database ADD CONSTRAINT 2200_16817_1_not_null CHECK id IS NOT NULL;

-- CHECK constraint on symptoms_database
ALTER TABLE symptoms_database ADD CONSTRAINT 2200_16817_2_not_null CHECK name IS NOT NULL;

-- CHECK constraint on symptoms_database
ALTER TABLE symptoms_database ADD CONSTRAINT 2200_16817_3_not_null CHECK category IS NOT NULL;

-- CHECK constraint on timeline_entries
ALTER TABLE timeline_entries ADD CONSTRAINT 2200_16592_13_not_null CHECK entry_date IS NOT NULL;

-- CHECK constraint on timeline_entries
ALTER TABLE timeline_entries ADD CONSTRAINT 2200_16592_1_not_null CHECK id IS NOT NULL;

-- CHECK constraint on timeline_entries
ALTER TABLE timeline_entries ADD CONSTRAINT 2200_16592_5_not_null CHECK entry_time IS NOT NULL;

-- CHECK constraint on timeline_entries
ALTER TABLE timeline_entries ADD CONSTRAINT 2200_16592_6_not_null CHECK entry_type IS NOT NULL;

-- CHECK constraint on timeline_entries
ALTER TABLE timeline_entries ADD CONSTRAINT 2200_16592_7_not_null CHECK content IS NOT NULL;

-- CHECK constraint on user_frequent_items
ALTER TABLE user_frequent_items ADD CONSTRAINT 2200_16616_1_not_null CHECK id IS NOT NULL;

-- CHECK constraint on user_frequent_items
ALTER TABLE user_frequent_items ADD CONSTRAINT 2200_16616_4_not_null CHECK item_name IS NOT NULL;

-- CHECK constraint on user_frequent_items
ALTER TABLE user_frequent_items ADD CONSTRAINT 2200_16616_5_not_null CHECK item_type IS NOT NULL;

-- CHECK constraint on user_preferences
ALTER TABLE user_preferences ADD CONSTRAINT 2200_16934_1_not_null CHECK id IS NOT NULL;

-- CHECK constraint on user_preferences
ALTER TABLE user_preferences ADD CONSTRAINT 2200_16934_2_not_null CHECK user_id IS NOT NULL;

-- CHECK constraint on user_preferences
ALTER TABLE user_preferences ADD CONSTRAINT 2200_16934_3_not_null CHECK preferences IS NOT NULL;

-- UNIQUE constraint on user_preferences
ALTER TABLE user_preferences ADD CONSTRAINT user_preferences_user_id_key UNIQUE (user_preferences_user_id_key);

-- CHECK constraint on user_protocols
ALTER TABLE user_protocols ADD CONSTRAINT 2200_16778_1_not_null CHECK id IS NOT NULL;

-- CHECK constraint on user_protocols
ALTER TABLE user_protocols ADD CONSTRAINT 2200_16778_6_not_null CHECK start_date IS NOT NULL;

-- CHECK constraint on user_sessions
ALTER TABLE user_sessions ADD CONSTRAINT 2200_16895_1_not_null CHECK id IS NOT NULL;

-- CHECK constraint on user_sessions
ALTER TABLE user_sessions ADD CONSTRAINT 2200_16895_2_not_null CHECK user_id IS NOT NULL;

-- CHECK constraint on user_sessions
ALTER TABLE user_sessions ADD CONSTRAINT 2200_16895_3_not_null CHECK refresh_token IS NOT NULL;

-- CHECK constraint on user_sessions
ALTER TABLE user_sessions ADD CONSTRAINT 2200_16895_4_not_null CHECK expires_at IS NOT NULL;

-- CHECK constraint on user_sessions
ALTER TABLE user_sessions ADD CONSTRAINT user_sessions_expires_check CHECK (expires_at > created_at);

-- UNIQUE constraint on user_sessions
ALTER TABLE user_sessions ADD CONSTRAINT user_sessions_refresh_token_key UNIQUE (user_sessions_refresh_token_key);

-- CHECK constraint on users
ALTER TABLE users ADD CONSTRAINT 2200_16463_1_not_null CHECK id IS NOT NULL;

-- CHECK constraint on users
ALTER TABLE users ADD CONSTRAINT 2200_16463_3_not_null CHECK email IS NOT NULL;

-- CHECK constraint on users
ALTER TABLE users ADD CONSTRAINT 2200_16463_4_not_null CHECK role IS NOT NULL;

-- UNIQUE constraint on users
ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (users_email_key);

-- =====================================================
-- JSONB COLUMN DOCUMENTATION
-- =====================================================

-- JSONB Column: anonymous_data_pool.outcome_metrics
-- Sample structures:

-- JSONB Column: anonymous_data_pool.tracking_data
-- Sample structures:

-- JSONB Column: anonymous_data_pool.user_demographics
-- Sample structures:

-- JSONB Column: protocols.phases
-- Sample structures:
-- --   [
--     {
--       "name": "Elimination",
--       "description": "Strict 30-day elimination",
--       "duration_weeks": 4
--     },
--     {
--       "name": "Reintroduction",
--       "description": "Systematic reintroduction of eliminated foods",
--       "duration_weeks": 2
--     }
--   ]
-- --   [
--     {
--       "name": "Elimination",
--       "description": "Eliminate high histamine foods",
--       "duration_weeks": "2-6"
--     },
--     {
--       "name": "Reintroduction",
--       "description": "Test medium histamine foods one at a time",
--       "duration_weeks": "4-8"
--     }
--   ]

-- JSONB Column: timeline_entries.structured_content
-- Sample structures:
-- --   {
--     "type": "food",
--     "foods": [
--       {
--         "name": "cabbage",
--         "category": "vegetable",
--         "compliance_status": "included"
--       },
--       {
--         "name": "onions",
--         "category": "vegetable",
--         "compliance_status": "included"
--       },
--       {
--         "name": "salmon",
--         "category": "protein",
--         "compliance_status": "included"
--       },
--       {
--         "name": "spinach",
--         "category": "unknown",
--         "compliance_status": "unknown"
--       }
--     ],
--     "notes": "",
--     "original_content": "cabbage, onions, salmon, spinach"
--   }
-- --   {
--     "type": "food",
--     "foods": [
--       {
--         "name": "pineapple",
--         "category": "unknown",
--         "compliance_status": "unknown"
--       },
--       {
--         "name": "salmon",
--         "category": "protein",
--         "compliance_status": "included"
--       },
--       {
--         "name": "eggplant",
--         "category": "vegetable",
--         "compliance_status": "avoid_for_now"
--       },
--       {
--         "name": "grapefruit",
--         "category": "unknown",
--         "compliance_status": "unknown"
--       }
--     ],
--     "notes": "",
--     "original_content": "pineapple, salmon, eggplant, grapefruit"
--   }

-- JSONB Column: user_preferences.preferences
-- Sample structures:
-- --   {
--     "protocols": [
--       "a80be547-6db1-4722-a5a4-60930143a2d9"
--     ],
--     "quick_detox": [],
--     "quick_foods": [],
--     "quick_symptoms": [],
--     "setup_complete": true,
--     "quick_medications": [],
--     "quick_supplements": []
--   }
-- --   {
--     "protocols": [
--       "46de08fb-03bf-4032-b507-122bb934ecb9"
--     ],
--     "quick_detox": [],
--     "quick_foods": [],
--     "quick_symptoms": [],
--     "setup_complete": true,
--     "quick_medications": [],
--     "quick_supplements": []
--   }

-- JSONB Column: users.custom_food_overrides
-- Sample structures:
-- --   {}
-- --   {}

-- JSONB Column: users.settings
-- Sample structures:
-- --   {}
-- --   {}

-- =====================================================
-- SCHEMA GENERATION COMPLETE
-- Generated: 2025-07-13T22:57:08.482Z
-- Total Objects: 57 
-- =====================================================
