# Database Migration Standards

This document establishes comprehensive database migration standards for the UI-Base ecosystem, covering schema changes, data migrations, version control, rollback procedures, and best practices for database evolution.

## Table of Contents

1. [Migration Philosophy](#migration-philosophy)
2. [Migration Types](#migration-types)
3. [Naming Conventions](#naming-conventions)
4. [Schema Migration Standards](#schema-migration-standards)
5. [Data Migration Standards](#data-migration-standards)
6. [Version Control and Tracking](#version-control-and-tracking)
7. [Rollback Procedures](#rollback-procedures)
8. [Testing Standards](#testing-standards)
9. [Performance Considerations](#performance-considerations)
10. [Production Deployment](#production-deployment)
11. [Monitoring and Validation](#monitoring-and-validation)
12. [Migration Tools and Frameworks](#migration-tools-and-frameworks)

## Migration Philosophy

### Core Principles

1. **Backward Compatibility**: Migrations should maintain compatibility with existing application versions during deployment
2. **Atomic Operations**: Each migration should be atomic and reversible
3. **Zero Downtime**: Production deployments should not require application downtime
4. **Data Integrity**: All migrations must preserve data integrity and consistency
5. **Performance Awareness**: Consider the impact of migrations on database performance
6. **Testability**: All migrations must be thoroughly tested before production deployment

### Migration Strategy

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Development   │───▶│     Staging     │───▶│   Production    │
│                 │    │                 │    │                 │
│ - Local testing │    │ - Integration   │    │ - Blue-green    │
│ - Unit tests    │    │ - Load testing  │    │ - Rollback plan │
│ - Peer review   │    │ - Data validation│    │ - Monitoring    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Change Types and Impact

```javascript
// Migration impact classification
const MIGRATION_TYPES = {
  LOW_RISK: {
    examples: ['Adding nullable columns', 'Adding indexes', 'Adding tables'],
    reviewers: 1,
    testingRequired: 'basic',
    rollbackComplexity: 'simple'
  },
  MEDIUM_RISK: {
    examples: ['Adding constraints', 'Renaming columns', 'Data type changes'],
    reviewers: 2,
    testingRequired: 'comprehensive',
    rollbackComplexity: 'moderate'
  },
  HIGH_RISK: {
    examples: ['Dropping columns', 'Dropping tables', 'Large data migrations'],
    reviewers: 3,
    testingRequired: 'extensive',
    rollbackComplexity: 'complex'
  }
};
```

## Migration Types

### Schema Migrations

Schema migrations modify the database structure:

```sql
-- Adding a new table
CREATE TABLE user_preferences (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    preference_key VARCHAR(100) NOT NULL,
    preference_value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, preference_key)
);

CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX idx_user_preferences_key ON user_preferences(preference_key);

-- Adding a new column (backward compatible)
ALTER TABLE users 
ADD COLUMN email_verified_at TIMESTAMP WITH TIME ZONE;

-- Adding a constraint
ALTER TABLE orders 
ADD CONSTRAINT chk_orders_amount_positive 
CHECK (amount > 0);
```

### Data Migrations

Data migrations modify existing data:

```sql
-- Data transformation migration
UPDATE users 
SET email = LOWER(TRIM(email))
WHERE email IS NOT NULL 
  AND email != LOWER(TRIM(email));

-- Populating new columns with existing data
UPDATE users 
SET full_name = CONCAT(first_name, ' ', last_name)
WHERE full_name IS NULL 
  AND first_name IS NOT NULL 
  AND last_name IS NOT NULL;

-- Complex data migration with batching
DO $$
DECLARE
    batch_size INTEGER := 1000;
    offset_val INTEGER := 0;
    rows_affected INTEGER;
BEGIN
    LOOP
        UPDATE orders 
        SET total_amount = subtotal + tax_amount + shipping_amount
        WHERE id IN (
            SELECT id FROM orders 
            WHERE total_amount IS NULL 
            ORDER BY id 
            LIMIT batch_size OFFSET offset_val
        );
        
        GET DIAGNOSTICS rows_affected = ROW_COUNT;
        EXIT WHEN rows_affected = 0;
        
        offset_val := offset_val + batch_size;
        
        -- Progress logging
        RAISE NOTICE 'Processed % rows, offset: %', rows_affected, offset_val;
        
        -- Pause to avoid blocking
        PERFORM pg_sleep(0.1);
    END LOOP;
END $$;
```

### Structural Migrations

Large structural changes that may require multiple steps:

```sql
-- Step 1: Add new table
CREATE TABLE user_profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bio TEXT,
    avatar_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Migrate data from users table
INSERT INTO user_profiles (user_id, bio, avatar_url, created_at)
SELECT id, bio, avatar_url, created_at 
FROM users 
WHERE bio IS NOT NULL OR avatar_url IS NOT NULL;

-- Step 3: Add foreign key reference (after application deployment)
ALTER TABLE users 
ADD COLUMN profile_id BIGINT REFERENCES user_profiles(id);

-- Step 4: Update users with profile references
UPDATE users 
SET profile_id = up.id
FROM user_profiles up 
WHERE users.id = up.user_id;

-- Step 5: Remove old columns (in subsequent migration)
-- ALTER TABLE users DROP COLUMN bio;
-- ALTER TABLE users DROP COLUMN avatar_url;
```

## Naming Conventions

### Migration File Naming

```bash
# Pattern: YYYYMMDDHHMMSS_descriptive_name.sql
20231201120000_create_user_preferences_table.sql
20231201120100_add_email_verified_at_to_users.sql
20231201120200_migrate_user_bio_to_profiles.sql
20231201120300_add_orders_amount_constraint.sql

# For complex migrations requiring multiple files
20231201120000_user_profile_migration_part_1_create_table.sql
20231201120001_user_profile_migration_part_2_migrate_data.sql
20231201120002_user_profile_migration_part_3_update_references.sql
```

### Migration Metadata

```javascript
// Migration metadata structure
const migrationMetadata = {
  version: '20231201120000',
  name: 'create_user_preferences_table',
  description: 'Create user_preferences table for storing user settings',
  author: 'john.doe@company.com',
  estimatedDuration: '30 seconds',
  riskLevel: 'low',
  reversible: true,
  requiresDowntime: false,
  affectedTables: ['user_preferences'],
  dependencies: ['20231130110000'],
  tags: ['schema', 'new-table', 'user-management']
};
```

### Table and Column Naming

```sql
-- Table naming: snake_case, plural nouns
users
user_preferences
order_items
payment_transactions

-- Column naming: snake_case
user_id
created_at
updated_at
email_verified_at
total_amount_cents

-- Index naming: idx_table_column(s)
idx_users_email
idx_orders_user_id_created_at
idx_user_preferences_user_id_key

-- Constraint naming
pk_users_id              -- Primary key
fk_orders_user_id        -- Foreign key
uk_users_email           -- Unique constraint
chk_orders_amount_positive -- Check constraint
```

## Schema Migration Standards

### Safe Schema Changes

```sql
-- ✅ SAFE: Adding nullable columns
ALTER TABLE users 
ADD COLUMN phone_number VARCHAR(20);

-- ✅ SAFE: Adding indexes (with CONCURRENTLY for PostgreSQL)
CREATE INDEX CONCURRENTLY idx_users_last_login_at 
ON users(last_login_at) 
WHERE last_login_at IS NOT NULL;

-- ✅ SAFE: Adding new tables
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    record_id BIGINT NOT NULL,
    action VARCHAR(10) NOT NULL,
    changes JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ✅ SAFE: Adding check constraints (initially not validated)
ALTER TABLE orders 
ADD CONSTRAINT chk_orders_status_valid 
CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled'))
NOT VALID;

-- Validate constraint in a separate step
ALTER TABLE orders 
VALIDATE CONSTRAINT chk_orders_status_valid;
```

### Risky Schema Changes

```sql
-- ⚠️ RISKY: Dropping columns (use two-phase approach)
-- Phase 1: Stop using the column in application code
-- Phase 2: Drop the column in a subsequent migration
-- ALTER TABLE users DROP COLUMN old_column;

-- ⚠️ RISKY: Renaming columns (use two-phase approach)
-- Phase 1: Add new column and populate it
ALTER TABLE users ADD COLUMN email_address VARCHAR(255);
UPDATE users SET email_address = email WHERE email IS NOT NULL;

-- Phase 2: Update application to use new column
-- Phase 3: Drop old column
-- ALTER TABLE users DROP COLUMN email;

-- ⚠️ RISKY: Changing data types
-- Use a multi-step approach for safety
ALTER TABLE orders ADD COLUMN amount_new DECIMAL(10,2);
UPDATE orders SET amount_new = amount::DECIMAL(10,2);
-- After verifying data integrity:
-- ALTER TABLE orders DROP COLUMN amount;
-- ALTER TABLE orders RENAME COLUMN amount_new TO amount;
```

### Index Management

```sql
-- Creating indexes safely
CREATE INDEX CONCURRENTLY idx_orders_created_at_user_id 
ON orders(created_at, user_id) 
WHERE created_at > '2023-01-01';

-- Dropping indexes safely
DROP INDEX CONCURRENTLY IF EXISTS idx_old_unused_index;

-- Rebuilding indexes for performance
REINDEX INDEX CONCURRENTLY idx_users_email;

-- Partial indexes for better performance
CREATE INDEX CONCURRENTLY idx_active_users_email 
ON users(email) 
WHERE deleted_at IS NULL AND active = true;

-- Expression indexes
CREATE INDEX CONCURRENTLY idx_users_email_lower 
ON users(LOWER(email));
```

## Data Migration Standards

### Batch Processing

```sql
-- Large data migration with proper batching
DO $$
DECLARE
    batch_size INTEGER := 1000;
    processed INTEGER := 0;
    total_rows INTEGER;
    start_time TIMESTAMP;
BEGIN
    -- Get total count for progress tracking
    SELECT COUNT(*) INTO total_rows 
    FROM users 
    WHERE email_normalized IS NULL;
    
    start_time := clock_timestamp();
    
    RAISE NOTICE 'Starting migration of % rows at %', total_rows, start_time;
    
    WHILE processed < total_rows LOOP
        -- Process batch
        WITH batch AS (
            SELECT id, email
            FROM users 
            WHERE email_normalized IS NULL
            ORDER BY id
            LIMIT batch_size
        )
        UPDATE users 
        SET email_normalized = LOWER(TRIM(batch.email)),
            updated_at = NOW()
        FROM batch 
        WHERE users.id = batch.id;
        
        processed := processed + batch_size;
        
        -- Progress logging
        RAISE NOTICE 'Processed %/% rows (%.1f%%) - Elapsed: %', 
            LEAST(processed, total_rows), 
            total_rows,
            (LEAST(processed, total_rows)::FLOAT / total_rows * 100),
            clock_timestamp() - start_time;
        
        -- Prevent long-running transactions
        COMMIT;
        
        -- Brief pause to reduce system load
        PERFORM pg_sleep(0.1);
    END LOOP;
    
    RAISE NOTICE 'Migration completed in %', clock_timestamp() - start_time;
END $$;
```

### Data Validation

```sql
-- Pre-migration validation
DO $$
DECLARE
    invalid_count INTEGER;
BEGIN
    -- Check for invalid email formats
    SELECT COUNT(*) INTO invalid_count
    FROM users 
    WHERE email IS NOT NULL 
      AND email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
    
    IF invalid_count > 0 THEN
        RAISE EXCEPTION 'Found % invalid email addresses. Migration aborted.', invalid_count;
    END IF;
    
    RAISE NOTICE 'Pre-migration validation passed. % valid emails found.', 
        (SELECT COUNT(*) FROM users WHERE email IS NOT NULL);
END $$;

-- Post-migration validation
DO $$
DECLARE
    unmigrated_count INTEGER;
    validation_errors INTEGER := 0;
BEGIN
    -- Check for unmigrated records
    SELECT COUNT(*) INTO unmigrated_count
    FROM users 
    WHERE email IS NOT NULL 
      AND email_normalized IS NULL;
    
    IF unmigrated_count > 0 THEN
        RAISE WARNING 'Found % unmigrated records', unmigrated_count;
        validation_errors := validation_errors + 1;
    END IF;
    
    -- Check data consistency
    SELECT COUNT(*) INTO unmigrated_count
    FROM users 
    WHERE email IS NOT NULL 
      AND email_normalized IS NOT NULL
      AND LOWER(TRIM(email)) != email_normalized;
    
    IF unmigrated_count > 0 THEN
        RAISE WARNING 'Found % records with inconsistent normalization', unmigrated_count;
        validation_errors := validation_errors + 1;
    END IF;
    
    IF validation_errors = 0 THEN
        RAISE NOTICE 'Post-migration validation passed successfully';
    ELSE
        RAISE EXCEPTION 'Post-migration validation failed with % errors', validation_errors;
    END IF;
END $$;
```

### Safe Data Transformations

```javascript
// JavaScript migration helper for complex transformations
const migrateUserData = async (knex) => {
  const batchSize = 1000;
  let offset = 0;
  let processedCount = 0;
  
  // Get total count
  const [{ count }] = await knex('users')
    .count('* as count')
    .where('profile_data', 'is not', null);
  
  console.log(`Starting migration of ${count} users`);
  
  while (offset < count) {
    const users = await knex('users')
      .select('id', 'profile_data')
      .where('profile_data', 'is not', null)
      .whereNull('migrated_at')
      .limit(batchSize)
      .offset(offset);
    
    if (users.length === 0) break;
    
    const updates = users.map(user => {
      try {
        const profileData = JSON.parse(user.profile_data);
        
        return {
          id: user.id,
          first_name: profileData.firstName || null,
          last_name: profileData.lastName || null,
          date_of_birth: profileData.dateOfBirth || null,
          migrated_at: new Date()
        };
      } catch (error) {
        console.error(`Failed to parse profile data for user ${user.id}:`, error);
        return {
          id: user.id,
          migrated_at: new Date(),
          migration_error: error.message
        };
      }
    });
    
    // Batch update
    for (const update of updates) {
      await knex('users')
        .where('id', update.id)
        .update(update);
    }
    
    processedCount += users.length;
    offset += batchSize;
    
    console.log(`Processed ${processedCount}/${count} users (${(processedCount/count*100).toFixed(1)}%)`);
    
    // Brief pause to reduce load
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`Migration completed. Processed ${processedCount} users.`);
};
```

## Version Control and Tracking

### Migration Tracking Table

```sql
-- Migration tracking schema
CREATE TABLE schema_migrations (
    version VARCHAR(20) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    author VARCHAR(100),
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    execution_time_ms INTEGER,
    checksum VARCHAR(64),
    rollback_available BOOLEAN DEFAULT false
);

-- Migration execution log
CREATE TABLE migration_execution_log (
    id BIGSERIAL PRIMARY KEY,
    migration_version VARCHAR(20) NOT NULL,
    action VARCHAR(20) NOT NULL, -- 'apply', 'rollback', 'verify'
    status VARCHAR(20) NOT NULL, -- 'started', 'completed', 'failed'
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    execution_context JSONB
);
```

### Migration State Management

```javascript
// Migration state manager
class MigrationManager {
  constructor(database, options = {}) {
    this.db = database;
    this.migrationTable = options.migrationTable || 'schema_migrations';
    this.logTable = options.logTable || 'migration_execution_log';
  }
  
  async ensureMigrationTables() {
    // Create migration tracking tables if they don't exist
    await this.db.raw(`
      CREATE TABLE IF NOT EXISTS ${this.migrationTable} (
        version VARCHAR(20) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        author VARCHAR(100),
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        execution_time_ms INTEGER,
        checksum VARCHAR(64),
        rollback_available BOOLEAN DEFAULT false
      )
    `);
  }
  
  async getAppliedMigrations() {
    return this.db(this.migrationTable)
      .select('*')
      .orderBy('version');
  }
  
  async getPendingMigrations() {
    const applied = await this.getAppliedMigrations();
    const appliedVersions = new Set(applied.map(m => m.version));
    
    const allMigrations = await this.loadMigrationFiles();
    return allMigrations.filter(m => !appliedVersions.has(m.version));
  }
  
  async applyMigration(migration) {
    const startTime = Date.now();
    const logId = await this.logMigrationStart(migration.version, 'apply');
    
    try {
      // Execute migration in transaction
      await this.db.transaction(async (trx) => {
        await trx.raw(migration.up);
        
        // Record successful migration
        await trx(this.migrationTable).insert({
          version: migration.version,
          name: migration.name,
          description: migration.description,
          author: migration.author,
          execution_time_ms: Date.now() - startTime,
          checksum: this.calculateChecksum(migration.up),
          rollback_available: !!migration.down
        });
      });
      
      await this.logMigrationComplete(logId, 'completed');
      console.log(`✅ Applied migration ${migration.version}: ${migration.name}`);
      
    } catch (error) {
      await this.logMigrationComplete(logId, 'failed', error.message);
      throw new Error(`Failed to apply migration ${migration.version}: ${error.message}`);
    }
  }
  
  async rollbackMigration(version) {
    const migration = await this.loadMigration(version);
    
    if (!migration.down) {
      throw new Error(`Migration ${version} is not reversible`);
    }
    
    const logId = await this.logMigrationStart(version, 'rollback');
    
    try {
      await this.db.transaction(async (trx) => {
        await trx.raw(migration.down);
        await trx(this.migrationTable).where('version', version).del();
      });
      
      await this.logMigrationComplete(logId, 'completed');
      console.log(`↩️ Rolled back migration ${version}`);
      
    } catch (error) {
      await this.logMigrationComplete(logId, 'failed', error.message);
      throw new Error(`Failed to rollback migration ${version}: ${error.message}`);
    }
  }
  
  calculateChecksum(content) {
    return require('crypto')
      .createHash('sha256')
      .update(content)
      .digest('hex');
  }
}
```

## Rollback Procedures

### Automatic Rollback Migration

```sql
-- Migration with automatic rollback
-- Up migration
CREATE TABLE user_sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);

-- Down migration (rollback)
DROP INDEX IF EXISTS idx_user_sessions_expires_at;
DROP INDEX IF EXISTS idx_user_sessions_token;
DROP INDEX IF EXISTS idx_user_sessions_user_id;
DROP TABLE IF EXISTS user_sessions;
```

### Safe Rollback Strategies

```sql
-- Strategy 1: Column addition rollback
-- Up: Add column
ALTER TABLE users ADD COLUMN last_login_ip INET;

-- Down: Remove column
ALTER TABLE users DROP COLUMN IF EXISTS last_login_ip;

-- Strategy 2: Data migration rollback with backup
-- Up: Create backup and migrate data
CREATE TABLE users_email_backup AS 
SELECT id, email FROM users WHERE email IS NOT NULL;

UPDATE users SET email = LOWER(TRIM(email)) WHERE email IS NOT NULL;

-- Down: Restore from backup
UPDATE users 
SET email = backup.email 
FROM users_email_backup backup 
WHERE users.id = backup.id;

DROP TABLE users_email_backup;

-- Strategy 3: Multi-phase rollback
-- Phase 1: Add new structure
-- Phase 2: Migrate data
-- Phase 3: Switch application
-- Phase 4: Remove old structure

-- Rollback reverses these phases
```

### Rollback Validation

```javascript
// Rollback validation script
const validateRollback = async (knex, migrationVersion) => {
  const validations = [];
  
  try {
    // Check if migration was actually rolled back
    const appliedMigration = await knex('schema_migrations')
      .where('version', migrationVersion)
      .first();
    
    if (appliedMigration) {
      validations.push({
        check: 'Migration record removed',
        status: 'FAIL',
        message: 'Migration record still exists in schema_migrations table'
      });
    } else {
      validations.push({
        check: 'Migration record removed',
        status: 'PASS'
      });
    }
    
    // Check table existence (for table creation rollbacks)
    const tableExists = await knex.schema.hasTable('user_sessions');
    if (tableExists) {
      validations.push({
        check: 'Table removal',
        status: 'FAIL',
        message: 'Table user_sessions still exists'
      });
    } else {
      validations.push({
        check: 'Table removal',
        status: 'PASS'
      });
    }
    
    // Check column existence (for column addition rollbacks)
    const columnExists = await knex.schema.hasColumn('users', 'last_login_ip');
    if (columnExists) {
      validations.push({
        check: 'Column removal',
        status: 'FAIL',
        message: 'Column last_login_ip still exists'
      });
    } else {
      validations.push({
        check: 'Column removal',
        status: 'PASS'
      });
    }
    
    // Check data integrity
    const dataIntegrityCheck = await knex('users')
      .whereNotNull('email')
      .andWhere(knex.raw("email != LOWER(TRIM(email))"))
      .count('* as count');
    
    if (dataIntegrityCheck[0].count > 0) {
      validations.push({
        check: 'Data integrity',
        status: 'FAIL',
        message: `Found ${dataIntegrityCheck[0].count} records with non-normalized emails`
      });
    } else {
      validations.push({
        check: 'Data integrity',
        status: 'PASS'
      });
    }
    
  } catch (error) {
    validations.push({
      check: 'Rollback validation',
      status: 'ERROR',
      message: error.message
    });
  }
  
  return validations;
};
```

## Testing Standards

### Migration Testing Framework

```javascript
// Migration test suite
describe('Migration 20231201120000: Create user preferences table', () => {
  let knex;
  
  beforeEach(async () => {
    knex = createTestDatabase();
    await knex.migrate.latest();
  });
  
  afterEach(async () => {
    await knex.destroy();
  });
  
  describe('Up migration', () => {
    it('should create user_preferences table', async () => {
      const tableExists = await knex.schema.hasTable('user_preferences');
      expect(tableExists).toBe(true);
    });
    
    it('should create required indexes', async () => {
      const indexes = await getTableIndexes(knex, 'user_preferences');
      expect(indexes).toContain('idx_user_preferences_user_id');
      expect(indexes).toContain('idx_user_preferences_key');
    });
    
    it('should enforce unique constraint', async () => {
      await knex('users').insert({ email: 'test@example.com' });
      const [user] = await knex('users').where('email', 'test@example.com');
      
      // First insert should succeed
      await knex('user_preferences').insert({
        user_id: user.id,
        preference_key: 'theme',
        preference_value: 'dark'
      });
      
      // Duplicate should fail
      await expect(
        knex('user_preferences').insert({
          user_id: user.id,
          preference_key: 'theme',
          preference_value: 'light'
        })
      ).rejects.toThrow();
    });
    
    it('should cascade delete when user is deleted', async () => {
      await knex('users').insert({ email: 'test@example.com' });
      const [user] = await knex('users').where('email', 'test@example.com');
      
      await knex('user_preferences').insert({
        user_id: user.id,
        preference_key: 'theme',
        preference_value: 'dark'
      });
      
      await knex('users').where('id', user.id).del();
      
      const preferences = await knex('user_preferences')
        .where('user_id', user.id);
      expect(preferences).toHaveLength(0);
    });
  });
  
  describe('Down migration', () => {
    it('should remove user_preferences table', async () => {
      // Apply down migration
      await knex.migrate.rollback();
      
      const tableExists = await knex.schema.hasTable('user_preferences');
      expect(tableExists).toBe(false);
    });
    
    it('should not fail if table does not exist', async () => {
      await knex.migrate.rollback();
      
      // Running rollback again should not fail
      await expect(knex.migrate.rollback()).resolves.not.toThrow();
    });
  });
  
  describe('Performance', () => {
    it('should complete within acceptable time', async () => {
      const startTime = Date.now();
      
      // Create test data
      await seedTestData(knex, 10000);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Migration should complete within 30 seconds for 10k records
      expect(duration).toBeLessThan(30000);
    });
  });
});

// Data migration test
describe('Data Migration: Normalize email addresses', () => {
  beforeEach(async () => {
    // Setup test data with various email formats
    await knex('users').insert([
      { email: 'User@Example.com' },
      { email: '  test@domain.org  ' },
      { email: 'ADMIN@COMPANY.NET' },
      { email: null }
    ]);
  });
  
  it('should normalize all email addresses', async () => {
    await runDataMigration('normalize_emails');
    
    const users = await knex('users').whereNotNull('email');
    
    users.forEach(user => {
      expect(user.email).toBe(user.email.toLowerCase().trim());
    });
  });
  
  it('should not affect null emails', async () => {
    await runDataMigration('normalize_emails');
    
    const nullEmailCount = await knex('users')
      .whereNull('email')
      .count('* as count');
    
    expect(nullEmailCount[0].count).toBe(1);
  });
});
```

### Integration Testing

```javascript
// Integration test for migration deployment
describe('Migration Integration Tests', () => {
  let productionLikeDb;
  
  beforeAll(async () => {
    productionLikeDb = createProductionLikeDatabase();
    await seedProductionLikeData(productionLikeDb);
  });
  
  afterAll(async () => {
    await productionLikeDb.destroy();
  });
  
  it('should migrate production-like dataset successfully', async () => {
    const startTime = Date.now();
    
    // Run migration
    await productionLikeDb.migrate.latest();
    
    const duration = Date.now() - startTime;
    
    // Verify migration completed
    const applied = await productionLikeDb('schema_migrations')
      .where('version', '20231201120000')
      .first();
    
    expect(applied).toBeTruthy();
    expect(duration).toBeLessThan(300000); // 5 minutes max
  });
  
  it('should maintain data integrity during migration', async () => {
    const beforeCount = await productionLikeDb('users').count('* as count');
    
    await productionLikeDb.migrate.latest();
    
    const afterCount = await productionLikeDb('users').count('* as count');
    
    expect(afterCount[0].count).toBe(beforeCount[0].count);
  });
  
  it('should rollback cleanly', async () => {
    await productionLikeDb.migrate.latest();
    
    const snapshotBefore = await createDatabaseSnapshot(productionLikeDb);
    
    await productionLikeDb.migrate.rollback();
    
    const snapshotAfter = await createDatabaseSnapshot(productionLikeDb);
    
    expect(snapshotAfter).toEqual(snapshotBefore);
  });
});
```

## Performance Considerations

### Large Table Migrations

```sql
-- Strategy 1: Online schema change for large tables
-- Use pt-online-schema-change for MySQL or similar tools

-- Strategy 2: Partitioned migration for PostgreSQL
-- Create new table with desired schema
CREATE TABLE users_new (LIKE users INCLUDING ALL);

-- Add new columns
ALTER TABLE users_new ADD COLUMN email_normalized VARCHAR(255);

-- Migrate data in chunks
DO $$
DECLARE
    min_id BIGINT;
    max_id BIGINT;
    chunk_size INTEGER := 10000;
    current_min BIGINT;
    current_max BIGINT;
BEGIN
    SELECT MIN(id), MAX(id) INTO min_id, max_id FROM users;
    current_min := min_id;
    
    WHILE current_min <= max_id LOOP
        current_max := current_min + chunk_size - 1;
        
        INSERT INTO users_new 
        SELECT *, LOWER(TRIM(email)) as email_normalized
        FROM users 
        WHERE id BETWEEN current_min AND current_max;
        
        current_min := current_max + 1;
        
        -- Progress update
        RAISE NOTICE 'Migrated up to ID %', current_max;
        
        -- Brief pause
        PERFORM pg_sleep(0.1);
    END LOOP;
END $$;

-- Strategy 3: Background migration with triggers
-- Create trigger to keep new table in sync during migration
CREATE OR REPLACE FUNCTION sync_users_new()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO users_new VALUES (NEW.*, LOWER(TRIM(NEW.email)));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE users_new 
        SET email = NEW.email, 
            email_normalized = LOWER(TRIM(NEW.email)),
            updated_at = NEW.updated_at
        WHERE id = NEW.id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        DELETE FROM users_new WHERE id = OLD.id;
        RETURN OLD;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_sync_trigger
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION sync_users_new();
```

### Index Creation Strategies

```sql
-- Strategy 1: Concurrent index creation (PostgreSQL)
CREATE INDEX CONCURRENTLY idx_users_email_normalized 
ON users(email_normalized);

-- Strategy 2: Partial index for large tables
CREATE INDEX CONCURRENTLY idx_active_users_email 
ON users(email) 
WHERE deleted_at IS NULL AND active = true;

-- Strategy 3: Multi-column index optimization
-- Instead of multiple single-column indexes
CREATE INDEX CONCURRENTLY idx_orders_user_status_date 
ON orders(user_id, status, created_at);

-- Strategy 4: Expression indexes for computed values
CREATE INDEX CONCURRENTLY idx_users_email_domain 
ON users((SPLIT_PART(email, '@', 2))) 
WHERE email IS NOT NULL;
```

### Performance Monitoring

```javascript
// Migration performance monitoring
class MigrationPerformanceMonitor {
  constructor(database) {
    this.db = database;
    this.metrics = [];
  }
  
  async monitorMigration(migrationFn, migrationName) {
    const startTime = Date.now();
    const startMetrics = await this.collectSystemMetrics();
    
    try {
      await migrationFn();
      
      const endTime = Date.now();
      const endMetrics = await this.collectSystemMetrics();
      
      const performance = {
        migration: migrationName,
        duration: endTime - startTime,
        success: true,
        metrics: {
          before: startMetrics,
          after: endMetrics,
          delta: this.calculateMetricsDelta(startMetrics, endMetrics)
        }
      };
      
      this.metrics.push(performance);
      return performance;
      
    } catch (error) {
      const endTime = Date.now();
      
      const performance = {
        migration: migrationName,
        duration: endTime - startTime,
        success: false,
        error: error.message,
        metrics: {
          before: startMetrics
        }
      };
      
      this.metrics.push(performance);
      throw error;
    }
  }
  
  async collectSystemMetrics() {
    const [dbSize] = await this.db.raw("SELECT pg_database_size(current_database()) as size");
    const [connections] = await this.db.raw("SELECT count(*) as active_connections FROM pg_stat_activity");
    
    return {
      timestamp: new Date(),
      databaseSize: parseInt(dbSize.size),
      activeConnections: parseInt(connections.active_connections),
      memoryUsage: process.memoryUsage()
    };
  }
  
  calculateMetricsDelta(before, after) {
    return {
      sizeDelta: after.databaseSize - before.databaseSize,
      connectionsDelta: after.activeConnections - before.activeConnections,
      memoryDelta: {
        rss: after.memoryUsage.rss - before.memoryUsage.rss,
        heapUsed: after.memoryUsage.heapUsed - before.memoryUsage.heapUsed
      }
    };
  }
}
```

## Production Deployment

### Blue-Green Migration Strategy

```bash
#!/bin/bash
# Blue-green migration deployment script

set -euo pipefail

ENVIRONMENT=${1:-production}
MIGRATION_VERSION=${2}

echo "Starting blue-green migration deployment for environment: $ENVIRONMENT"

# Step 1: Create green database (copy of blue)
echo "Creating green database..."
pg_dump "$BLUE_DATABASE_URL" | psql "$GREEN_DATABASE_URL"

# Step 2: Apply migrations to green database
echo "Applying migrations to green database..."
export DATABASE_URL="$GREEN_DATABASE_URL"
npm run migrate:up

# Step 3: Validate green database
echo "Validating green database..."
npm run migrate:validate

# Step 4: Run application tests against green database
echo "Running tests against green database..."
npm run test:integration

# Step 5: Switch traffic to green database
echo "Switching traffic to green database..."
kubectl patch configmap app-config \
  --patch '{"data":{"DATABASE_URL":"'$GREEN_DATABASE_URL'"}}'

# Step 6: Restart application pods
kubectl rollout restart deployment/ui-base-app

# Step 7: Monitor for issues
echo "Monitoring deployment for 5 minutes..."
sleep 300

# Step 8: Verify successful deployment
HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" https://app.example.com/health)
if [ "$HEALTH_CHECK" != "200" ]; then
    echo "Health check failed. Rolling back..."
    
    # Rollback: Switch back to blue database
    kubectl patch configmap app-config \
      --patch '{"data":{"DATABASE_URL":"'$BLUE_DATABASE_URL'"}}'
    kubectl rollout restart deployment/ui-base-app
    
    exit 1
fi

echo "Migration deployment completed successfully"

# Step 9: Cleanup old blue database (after manual verification)
# This step should be manual to ensure safety
echo "Remember to manually cleanup the old blue database after verification"
```

### Zero-Downtime Migration

```javascript
// Zero-downtime migration strategy
class ZeroDowntimeMigration {
  constructor(oldDb, newDb) {
    this.oldDb = oldDb;
    this.newDb = newDb;
    this.syncEnabled = false;
  }
  
  async performMigration() {
    console.log('Starting zero-downtime migration...');
    
    // Phase 1: Setup new schema in parallel database
    await this.createNewSchema();
    
    // Phase 2: Setup bidirectional sync
    await this.setupBidirectionalSync();
    
    // Phase 3: Backfill historical data
    await this.backfillData();
    
    // Phase 4: Verify data consistency
    await this.verifyConsistency();
    
    // Phase 5: Switch application to new database
    await this.switchApplication();
    
    // Phase 6: Monitor and cleanup
    await this.monitorAndCleanup();
    
    console.log('Zero-downtime migration completed');
  }
  
  async createNewSchema() {
    console.log('Creating new schema...');
    
    await this.newDb.raw(`
      CREATE TABLE users_v2 (
        id BIGSERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        email_normalized VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      CREATE INDEX idx_users_v2_email_normalized ON users_v2(email_normalized);
    `);
  }
  
  async setupBidirectionalSync() {
    console.log('Setting up bidirectional sync...');
    
    // Setup trigger on old database to sync to new
    await this.oldDb.raw(`
      CREATE OR REPLACE FUNCTION sync_to_new_db()
      RETURNS TRIGGER AS $$
      BEGIN
        -- Sync logic would use database link or application-level sync
        -- This is a simplified example
        PERFORM pg_notify('sync_channel', 
          json_build_object('table', TG_TABLE_NAME, 'action', TG_OP, 'data', row_to_json(NEW))::text
        );
        RETURN COALESCE(NEW, OLD);
      END;
      $$ LANGUAGE plpgsql;
      
      CREATE TRIGGER users_sync_trigger
        AFTER INSERT OR UPDATE OR DELETE ON users
        FOR EACH ROW EXECUTE FUNCTION sync_to_new_db();
    `);
    
    this.syncEnabled = true;
  }
  
  async backfillData() {
    console.log('Backfilling historical data...');
    
    const batchSize = 1000;
    let offset = 0;
    
    while (true) {
      const users = await this.oldDb('users')
        .select('*')
        .limit(batchSize)
        .offset(offset);
      
      if (users.length === 0) break;
      
      const transformedUsers = users.map(user => ({
        id: user.id,
        email: user.email,
        email_normalized: user.email?.toLowerCase().trim(),
        first_name: user.first_name,
        last_name: user.last_name,
        created_at: user.created_at,
        updated_at: user.updated_at
      }));
      
      await this.newDb('users_v2').insert(transformedUsers)
        .onConflict('id')
        .merge();
      
      offset += batchSize;
      console.log(`Backfilled ${offset} users`);
    }
  }
  
  async verifyConsistency() {
    console.log('Verifying data consistency...');
    
    const [oldCount] = await this.oldDb('users').count('* as count');
    const [newCount] = await this.newDb('users_v2').count('* as count');
    
    if (oldCount.count !== newCount.count) {
      throw new Error(`Data count mismatch: old=${oldCount.count}, new=${newCount.count}`);
    }
    
    console.log(`Data consistency verified: ${oldCount.count} records`);
  }
  
  async switchApplication() {
    console.log('Switching application to new database...');
    
    // Update configuration
    await this.updateApplicationConfig();
    
    // Graceful restart of application
    await this.restartApplication();
  }
  
  async monitorAndCleanup() {
    console.log('Monitoring new deployment...');
    
    // Monitor for 10 minutes
    await new Promise(resolve => setTimeout(resolve, 600000));
    
    // Cleanup old triggers and functions
    await this.oldDb.raw('DROP TRIGGER IF EXISTS users_sync_trigger ON users');
    await this.oldDb.raw('DROP FUNCTION IF EXISTS sync_to_new_db()');
    
    console.log('Cleanup completed');
  }
}
```

## Migration Tools and Frameworks

### Knex.js Migration Configuration

```javascript
// knexfile.js
module.exports = {
  development: {
    client: 'postgresql',
    connection: {
      host: 'localhost',
      database: 'ui_base_dev',
      user: 'postgres',
      password: 'password'
    },
    migrations: {
      directory: './migrations',
      tableName: 'schema_migrations',
      extension: 'js',
      loadExtensions: ['.js'],
      stub: './migration-template.js'
    },
    seeds: {
      directory: './seeds'
    }
  },
  
  production: {
    client: 'postgresql',
    connection: process.env.DATABASE_URL,
    migrations: {
      directory: './migrations',
      tableName: 'schema_migrations'
    },
    pool: {
      min: 2,
      max: 10
    }
  }
};

// Migration template
// migration-template.js
exports.up = function(knex) {
  // Migration up logic
};

exports.down = function(knex) {
  // Migration down logic (rollback)
};

exports.config = {
  transaction: true,
  disableTransactions: false
};
```

### Flyway Configuration

```sql
-- flyway.conf
flyway.url=jdbc:postgresql://localhost:5432/ui_base
flyway.user=postgres
flyway.password=password
flyway.locations=filesystem:./sql/migrations
flyway.baseline-on-migrate=true
flyway.validate-on-migrate=true
flyway.mixed=false
flyway.group=true
flyway.installed-by=flyway

-- Example migration: V1__Create_users_table.sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
```

### Database Migration CLI Tool

```javascript
#!/usr/bin/env node
// migrate-cli.js

const { Command } = require('commander');
const MigrationManager = require('./lib/migration-manager');

const program = new Command();

program
  .name('db-migrate')
  .description('Database migration CLI tool')
  .version('1.0.0');

program
  .command('status')
  .description('Show migration status')
  .action(async () => {
    const manager = new MigrationManager();
    const status = await manager.getStatus();
    
    console.log('Applied Migrations:');
    status.applied.forEach(m => {
      console.log(`  ✅ ${m.version} - ${m.name}`);
    });
    
    console.log('\nPending Migrations:');
    status.pending.forEach(m => {
      console.log(`  ⏳ ${m.version} - ${m.name}`);
    });
  });

program
  .command('up')
  .description('Apply all pending migrations')
  .option('-s, --single', 'Apply only the next migration')
  .action(async (options) => {
    const manager = new MigrationManager();
    
    if (options.single) {
      await manager.applyNext();
    } else {
      await manager.applyAll();
    }
  });

program
  .command('down')
  .description('Rollback the last migration')
  .option('-t, --to <version>', 'Rollback to specific version')
  .action(async (options) => {
    const manager = new MigrationManager();
    
    if (options.to) {
      await manager.rollbackTo(options.to);
    } else {
      await manager.rollbackLast();
    }
  });

program
  .command('create')
  .description('Create a new migration')
  .argument('<name>', 'Migration name')
  .action(async (name) => {
    const manager = new MigrationManager();
    const migrationFile = await manager.createMigration(name);
    console.log(`Created migration: ${migrationFile}`);
  });

program
  .command('validate')
  .description('Validate migration checksums')
  .action(async () => {
    const manager = new MigrationManager();
    const validation = await manager.validateChecksums();
    
    if (validation.valid) {
      console.log('✅ All migration checksums are valid');
    } else {
      console.log('❌ Migration validation failed:');
      validation.errors.forEach(error => {
        console.log(`  - ${error}`);
      });
      process.exit(1);
    }
  });

program.parse();
```

---

These database migration standards provide comprehensive guidelines for safely evolving database schemas and data in production environments. Regular review and updates ensure alignment with current database management best practices and emerging technologies.