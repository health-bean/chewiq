# Database Guide

This document provides comprehensive information about the Health Platform database architecture, schema, and best practices.

## 🗄️ Database Overview

The Health Platform uses **PostgreSQL 14+** with **JSONB** for flexible, structured health data storage.

### Key Features
- **JSONB-First Design**: Flexible schema for health data
- **GIN Indexes**: Optimized JSONB queries
- **ACID Compliance**: Reliable transactions
- **Audit Logging**: Complete data access tracking
- **Encryption**: Data encrypted at rest and in transit

## 📊 Database Schema

### Core Tables

#### **users**
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    user_type VARCHAR(20) DEFAULT 'patient',
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);
```

#### **journal_entries** (Reflection Data)
```sql
CREATE TABLE journal_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    entry_date DATE NOT NULL,
    reflection_data JSONB DEFAULT '{}',
    consent_to_anonymize BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now(),
    
    UNIQUE(user_id, entry_date)
);

-- Indexes for performance
CREATE INDEX idx_journal_entries_user_date ON journal_entries(user_id, entry_date);
CREATE INDEX idx_journal_reflection_data_gin ON journal_entries USING gin(reflection_data);
```

#### **timeline_entries** (Event Data)
```sql
CREATE TABLE timeline_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    journal_entry_id UUID REFERENCES journal_entries(id),
    user_id UUID REFERENCES users(id),
    entry_time TIME NOT NULL,
    entry_type VARCHAR(50) NOT NULL,
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    structured_content JSONB,
    created_at TIMESTAMP DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_timeline_entries_user_date ON timeline_entries(user_id, entry_date);
CREATE INDEX idx_timeline_structured_content_gin ON timeline_entries USING gin(structured_content);
CREATE INDEX idx_timeline_structured_content_type ON timeline_entries((structured_content ->> 'type'));
```

## 🏗️ JSONB Data Structures

### Journal Entry Reflection Data
```json
{
  "sleep": {
    "bedtime": "22:30",
    "wake_time": "07:00",
    "sleep_quality": "good",
    "sleep_symptoms": ["back pain", "restless"]
  },
  "wellness": {
    "energy_level": 8,
    "mood_level": 7,
    "physical_comfort": 6,
    "stress_level": 4
  },
  "activity": {
    "activity_level": "moderate"
  },
  "meditation": {
    "meditation_duration": 15,
    "meditation_practice": true
  },
  "cycle": {
    "cycle_day": "5",
    "ovulation": false
  },
  "notes": {
    "personal_reflection": "Feeling good today, energy was high after morning walk."
  }
}
```

### Timeline Entry Structured Content

#### Food Entry
```json
{
  "type": "food",
  "entry_source": "timed_entry",
  "foods": [{
    "name": "grilled chicken",
    "food_id": "uuid-here",
    "category": "protein",
    "compliance_status": "included",
    "protocol_allowed": true
  }],
  "notes": "Lunch - felt good after eating"
}
```

#### Symptom Entry
```json
{
  "type": "symptom",
  "entry_source": "timed_entry",
  "symptom": {
    "name": "headache",
    "severity": 6,
    "duration_minutes": 120
  },
  "notes": "Started after lunch, mild throbbing"
}
```

#### Medication Entry
```json
{
  "type": "medication",
  "entry_source": "timed_entry",
  "medication": {
    "name": "ibuprofen",
    "dosage": "200mg",
    "reason": "headache relief"
  },
  "notes": "Took with food"
}
```

## 🔍 Query Examples

### Basic JSONB Queries

#### Get User's Sleep Data
```sql
SELECT 
    entry_date,
    reflection_data->'sleep'->>'bedtime' as bedtime,
    reflection_data->'sleep'->>'wake_time' as wake_time,
    reflection_data->'sleep'->>'sleep_quality' as sleep_quality
FROM journal_entries 
WHERE user_id = $1 
    AND entry_date >= $2 
    AND reflection_data->'sleep' IS NOT NULL
ORDER BY entry_date DESC;
```

#### Get Energy Levels Over Time
```sql
SELECT 
    entry_date,
    (reflection_data->'wellness'->>'energy_level')::int as energy_level,
    (reflection_data->'wellness'->>'mood_level')::int as mood_level
FROM journal_entries 
WHERE user_id = $1 
    AND reflection_data->'wellness'->>'energy_level' IS NOT NULL
ORDER BY entry_date DESC
LIMIT 30;
```

#### Find Food Entries by Type
```sql
SELECT 
    entry_date,
    entry_time,
    structured_content->'foods' as foods
FROM timeline_entries 
WHERE user_id = $1 
    AND entry_type = 'food'
    AND structured_content->'foods' @> '[{"category": "protein"}]'
ORDER BY entry_date DESC, entry_time DESC;
```

### Advanced JSONB Queries

#### Search Within JSONB Arrays
```sql
-- Find entries with specific symptoms
SELECT entry_date, structured_content
FROM timeline_entries 
WHERE user_id = $1 
    AND entry_type = 'symptom'
    AND structured_content->'symptom'->>'name' ILIKE '%headache%';
```

#### Aggregate JSONB Data
```sql
-- Average energy levels by week
SELECT 
    DATE_TRUNC('week', entry_date) as week,
    AVG((reflection_data->'wellness'->>'energy_level')::int) as avg_energy
FROM journal_entries 
WHERE user_id = $1 
    AND reflection_data->'wellness'->>'energy_level' IS NOT NULL
GROUP BY DATE_TRUNC('week', entry_date)
ORDER BY week DESC;
```

## 🚀 Performance Optimization

### Indexes

#### GIN Indexes for JSONB
```sql
-- General JSONB search
CREATE INDEX idx_journal_reflection_data_gin 
ON journal_entries USING gin(reflection_data);

CREATE INDEX idx_timeline_structured_content_gin 
ON timeline_entries USING gin(structured_content);

-- Specific path indexes for common queries
CREATE INDEX idx_timeline_content_type 
ON timeline_entries((structured_content ->> 'type'));

CREATE INDEX idx_journal_energy_level 
ON journal_entries((reflection_data->'wellness'->>'energy_level'));
```

#### Composite Indexes
```sql
-- User + date queries (most common)
CREATE INDEX idx_journal_entries_user_date 
ON journal_entries(user_id, entry_date);

CREATE INDEX idx_timeline_entries_user_date_type 
ON timeline_entries(user_id, entry_date, entry_type);
```

### Query Performance Tips

1. **Use Specific Paths**: `reflection_data->'sleep'->>'bedtime'` is faster than searching entire JSONB
2. **Index Common Paths**: Create indexes for frequently queried JSONB paths
3. **Limit Results**: Always use LIMIT for large datasets
4. **Use EXISTS**: For checking JSONB key existence, use `reflection_data ? 'sleep'`

## 🔧 Database Operations

### Migrations

#### Adding New JSONB Fields
```sql
-- No schema migration needed for JSONB!
-- Just start using new fields in application code

-- Example: Adding stress tracking
UPDATE journal_entries 
SET reflection_data = reflection_data || '{"wellness": {"stress_level": 5}}'::jsonb
WHERE reflection_data->'wellness' IS NOT NULL;
```

#### Creating New Indexes
```sql
-- Add index for new query patterns
CREATE INDEX CONCURRENTLY idx_journal_stress_level 
ON journal_entries((reflection_data->'wellness'->>'stress_level'));
```

### Backup and Recovery

#### Automated Backups
```bash
# Daily backup with JSONB compression
pg_dump --format=custom --compress=9 --file=backup_$(date +%Y%m%d).dump healthplatform_db

# Restore from backup
pg_restore --clean --if-exists --create --dbname=healthplatform_db backup_20250715.dump
```

#### Point-in-Time Recovery
```sql
-- Enable WAL archiving for PITR
archive_mode = on
archive_command = 'cp %p /backup/archive/%f'
wal_level = replica
```

## 🔒 Security & Compliance

### Data Encryption
- **At Rest**: PostgreSQL transparent data encryption
- **In Transit**: SSL/TLS for all connections
- **Application Level**: Sensitive fields can be encrypted before JSONB storage

### Access Control
```sql
-- Role-based access
CREATE ROLE app_user;
GRANT SELECT, INSERT, UPDATE ON journal_entries TO app_user;
GRANT SELECT, INSERT, UPDATE ON timeline_entries TO app_user;

-- Read-only analytics role
CREATE ROLE analytics_user;
GRANT SELECT ON journal_entries TO analytics_user;
GRANT SELECT ON timeline_entries TO analytics_user;
```

### Audit Logging
```sql
-- Enable audit logging for compliance
CREATE EXTENSION IF NOT EXISTS pgaudit;
ALTER SYSTEM SET pgaudit.log = 'write';
ALTER SYSTEM SET pgaudit.log_catalog = off;
```

## 📈 Monitoring & Maintenance

### Performance Monitoring
```sql
-- Check JSONB query performance
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows
FROM pg_stat_statements 
WHERE query LIKE '%reflection_data%' 
ORDER BY total_time DESC;

-- Index usage statistics
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE tablename IN ('journal_entries', 'timeline_entries');
```

### Maintenance Tasks
```sql
-- Regular VACUUM for JSONB tables
VACUUM ANALYZE journal_entries;
VACUUM ANALYZE timeline_entries;

-- Reindex GIN indexes periodically
REINDEX INDEX CONCURRENTLY idx_journal_reflection_data_gin;
REINDEX INDEX CONCURRENTLY idx_timeline_structured_content_gin;
```

## 🛠️ Development Tools

### Useful JSONB Functions
```sql
-- Check if key exists
SELECT * FROM journal_entries WHERE reflection_data ? 'sleep';

-- Get all keys at top level
SELECT jsonb_object_keys(reflection_data) FROM journal_entries LIMIT 1;

-- Pretty print JSONB
SELECT jsonb_pretty(reflection_data) FROM journal_entries LIMIT 1;

-- Remove a key
UPDATE journal_entries SET reflection_data = reflection_data - 'old_key';

-- Update nested value
UPDATE journal_entries 
SET reflection_data = jsonb_set(reflection_data, '{sleep,bedtime}', '"23:00"');
```

### Data Validation
```sql
-- Validate JSONB structure
SELECT entry_date, reflection_data
FROM journal_entries 
WHERE NOT (
    reflection_data ? 'sleep' AND 
    reflection_data ? 'wellness' AND
    jsonb_typeof(reflection_data->'wellness'->'energy_level') = 'number'
);
```

## 📋 Best Practices

### JSONB Design
1. **Consistent Structure**: Use the same JSONB schema across entries
2. **Avoid Deep Nesting**: Keep JSONB structure relatively flat (2-3 levels max)
3. **Use Appropriate Types**: Store numbers as numbers, not strings
4. **Index Common Paths**: Create indexes for frequently queried JSONB paths

### Performance
1. **Use Specific Queries**: Query specific JSONB paths rather than entire documents
2. **Limit Results**: Always use LIMIT for user-facing queries
3. **Monitor Query Performance**: Use pg_stat_statements to identify slow queries
4. **Regular Maintenance**: VACUUM and ANALYZE JSONB tables regularly

### Security
1. **Validate Input**: Always validate JSONB data before insertion
2. **Use Parameterized Queries**: Prevent JSONB injection attacks
3. **Audit Access**: Log all access to sensitive health data
4. **Encrypt Sensitive Data**: Consider application-level encryption for PII

---

**Last Updated**: July 15, 2025  
**Database Version**: PostgreSQL 14+ with JSONB  
**Schema Version**: 2.0 (Post-JSONB Migration)  
**Next Review**: August 15, 2025