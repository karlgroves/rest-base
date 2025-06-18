# SQL Standards and Design Patterns

> **Navigation:** [📖 Main Documentation](./README.md#documentation-navigation) | [🏗️ Node.js Standards](./node_structure_and_naming_conventions.md) | [📋 Global Rules](./global-rules.md) | [🛡️ Technologies](./technologies.md)

## Introduction

All database development for this system is built for MySQL/MariaDB, but should strive for cross-database compatibility when practical. SQL used in the application should adhere to standard SQL syntax where possible, balancing MySQL's specific features with broader compatibility. Where MySQL doesn't support the standard, the MySQL-specific approach should be used. When writing SQL, aim for compatibility with:

1. MySQL/MariaDB (primary)
2. PostgreSQL
3. Oracle
4. SQLite

This document outlines our SQL design patterns, naming conventions, and best practices for use with Node.js applications.

## ORM vs Raw SQL Decision Matrix

### When to Use Sequelize ORM

**Recommended for:**
- **CRUD Operations**: Standard create, read, update, delete operations
- **Model Relationships**: Managing associations between tables (hasMany, belongsTo, etc.)
- **Schema Migrations**: Database schema changes and version control
- **Data Validation**: Built-in validation rules and type checking
- **Connection Management**: Automatic connection pooling and transaction handling
- **Development Speed**: Rapid prototyping and standard business logic
- **Type Safety**: When using TypeScript with Sequelize models

**Sequelize Example:**
```javascript
// User model with associations
const User = sequelize.define('User', {
  id: { type: DataTypes.UUID, primaryKey: true },
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false }
});

// Simple CRUD operations
const user = await User.findByPk(userId, {
  include: [{ model: Team, through: 'UserTeams' }]
});

const newUser = await User.create({
  id: uuidv4(),
  email: 'user@example.com',
  name: 'John Doe'
});
```

### When to Use Raw SQL

**Recommended for:**
- **Complex Queries**: Multi-table joins with complex conditions
- **Performance-Critical Operations**: Optimized queries for high-traffic endpoints
- **Database-Specific Features**: MySQL-specific functions and optimizations
- **Reporting and Analytics**: Aggregations, window functions, and complex calculations
- **Bulk Operations**: Large data imports, exports, or batch processing
- **Custom Optimization**: Hand-tuned queries for specific performance requirements
- **Legacy Database Integration**: Working with existing database schemas

**Raw SQL Example:**
```javascript
// Complex analytics query
const monthlyStats = await sequelize.query(`
  SELECT 
    DATE_FORMAT(u.created, '%Y-%m') AS month,
    COUNT(DISTINCT u.userId) AS new_users,
    COUNT(DISTINCT l.userId) AS active_users,
    AVG(DATEDIFF(l.lastLogin, u.created)) AS avg_days_to_activation
  FROM users u
  LEFT JOIN userLogins l ON u.userId = l.userId 
    AND l.created >= u.created 
    AND l.created <= DATE_ADD(u.created, INTERVAL 30 DAY)
  WHERE u.created >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
  GROUP BY DATE_FORMAT(u.created, '%Y-%m')
  ORDER BY month DESC
`, { type: QueryTypes.SELECT });
```

### Hybrid Approach Guidelines

**Best Practice Pattern:**
```javascript
// Use Sequelize for model definition and simple operations
const User = sequelize.define('User', { /* ... */ });

// Use raw SQL for complex queries within the same service
class UserAnalyticsService {
  async getUserStats(userId) {
    // Simple operation with Sequelize
    const user = await User.findByPk(userId);
    
    // Complex query with raw SQL
    const stats = await sequelize.query(`
      SELECT 
        COUNT(*) as total_logins,
        MAX(created) as last_login,
        AVG(TIMESTAMPDIFF(SECOND, login_time, logout_time)) as avg_session_duration
      FROM userSessions 
      WHERE userId = :userId
    `, {
      replacements: { userId },
      type: QueryTypes.SELECT
    });
    
    return { user, stats: stats[0] };
  }
}
```

### Performance Considerations

**Sequelize Optimization:**
- Use `attributes` to select only needed columns
- Include associations efficiently with `include`
- Use `raw: true` for read-only operations
- Implement proper indexing on frequently queried fields

**Raw SQL Optimization:**
- Always use parameterized queries to prevent SQL injection
- Implement proper error handling and connection management
- Use database-specific optimizations when appropriate
- Monitor query performance and execution plans

## Table Structures

1. All MySQL databases should use InnoDB as the engine
2. All MySQL databases should use `DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci`;
3. All MySQL databases should have a column, `inc` set to be an auto incrementing integer. This should be an index, but not be used as a referenceable primary key. 
It is rather used to help MySQL indexing.

## Table Naming Conventions

1. **CamelCase for Table Names**: Tables are named using camelCase (e.g., `refreshTokens`, `teamMembers`, `passwordResetHashes`).
2. **Plural Form**: Table names should be in plural form (e.g., `users`, `teams`, `logs`).
3. **Descriptive Names**: Table names must clearly indicate the entity they represent (e.g., `passwordResetHashes`, `userPermissions`).
4. **Avoid Reserved Words**: Never use SQL reserved words for table names.

## Column Naming Conventions

1. **CamelCase for Column Names**: All column names use camelCase (e.g., `userId`, `tokenHash`, `permissionId`).
2. **Primary Keys**:
   - `inc`: Used as an auto-incrementing integer primary key in most tables.
   - Entity-specific IDs: Many tables also include a UUID-based identifier (e.g., `userId`, `teamId`, `logId`).

3. **Common Columns**:
   - `created`: Timestamp column with default `CURRENT_TIMESTAMP`.
   - `updated`: Timestamp column with default `CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`.
   - Entity-related IDs: Foreign key columns typically named as `entityId` (e.g., `userId`, `teamId`).

4. **Boolean Columns**: Use `ENUM('0', '1')` with default `'0'` rather than MySQL's BOOLEAN type (e.g., `confirmed`, `isBanned`).

## SQL Keywords and Formatting

### SQL Keywords Must Be Capitalized

When writing SQL queries, capitalize all SQL keywords (SELECT, FROM, VALUES, AS, etc.) and leave everything else in the relevant case. WHERE clauses should be grouped by parentheses if they get too complex.

### SQL Formatting & Indentation

SQL queries should be formatted for readability, with each clause on a new line and appropriate indentation. For example:

```sql
SELECT
    t1.column_a,
    t2.column_b
FROM
    table1 t1,
    table2 t2
WHERE
    some_condition
    AND 
    some_other_condition
```

### Use Standard SQL Operators

Use standard SQL operators for better cross-database compatibility:
- Use `<>` for "not equals" instead of `!=`
- Avoid MySQL-specific syntax like backticks (`) to enclose identifiers
- Use standard SQL functions when available

## Database Design Patterns

### ID Strategies

1. **Auto-incrementing integers** for primary keys: `MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT`.
2. **UUID strings** (36 characters) for entity identifiers: `VARCHAR(36) NOT NULL`.

### Relationship Patterns

1. **Many-to-Many**: Implemented using junction tables (e.g., `userPermissions` connecting `users` and `permissions`).
2. **One-to-Many**: Implemented using foreign keys (e.g., `teams` to `teamMembers`).

### Index Patterns

1. Primary keys on `inc` columns.
2. Secondary indexes on UUID columns (e.g., `userId`, `teamId`).
3. Indexes on frequently searched string columns (e.g., `event` in `logs` table).
4. Indexes on foreign key columns.

### Index and View Naming Conventions

**Index Naming Standards:**
- **Primary Key Indexes**: Use table name + `_pk` (automatically created, but for reference: `users_pk`)
- **Unique Indexes**: Use `uq_` prefix + table name + column name(s): `uq_users_email`, `uq_teams_name`
- **Foreign Key Indexes**: Use `fk_` prefix + table name + referenced table: `fk_userTeams_users`, `fk_userTeams_teams`
- **Composite Indexes**: Use `idx_` prefix + table name + column names: `idx_users_email_status`, `idx_logs_userId_created`
- **Performance Indexes**: Use `perf_` prefix + table name + purpose: `perf_users_login_lookup`, `perf_logs_recent_activity`

**Index Examples:**
```sql
-- Unique constraint index
CREATE UNIQUE INDEX uq_users_email ON users (email);

-- Foreign key index
CREATE INDEX fk_userPermissions_users ON userPermissions (userId);

-- Composite index for common queries
CREATE INDEX idx_logs_userId_created ON logs (userId, created);

-- Performance index for frequent searches
CREATE INDEX perf_users_active_lookup ON users (isActive, lastLogin) WHERE deletedAt IS NULL;
```

**View Naming Standards:**
- **Simple Views**: Use `v_` prefix + descriptive name: `v_activeUsers`, `v_teamSummary`
- **Aggregate Views**: Use `v_agg_` prefix + purpose: `v_agg_userStatistics`, `v_agg_monthlyMetrics`
- **Reporting Views**: Use `v_rpt_` prefix + report name: `v_rpt_userActivity`, `v_rpt_teamPerformance`
- **Security Views**: Use `v_sec_` prefix + purpose: `v_sec_userPermissions`, `v_sec_auditTrail`

**View Examples:**
```sql
-- Simple view for active users
CREATE VIEW v_activeUsers AS
SELECT userId, email, name, lastLogin
FROM users 
WHERE isActive = '1' AND deletedAt IS NULL;

-- Aggregate view for user statistics
CREATE VIEW v_agg_userStatistics AS
SELECT 
    COUNT(*) as totalUsers,
    COUNT(CASE WHEN isActive = '1' THEN 1 END) as activeUsers,
    COUNT(CASE WHEN created >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as newUsers
FROM users 
WHERE deletedAt IS NULL;

-- Reporting view for team performance
CREATE VIEW v_rpt_teamPerformance AS
SELECT 
    t.teamId,
    t.name as teamName,
    COUNT(tm.userId) as memberCount,
    AVG(u.loginFrequency) as avgLoginFrequency
FROM teams t
LEFT JOIN teamMembers tm ON t.teamId = tm.teamId
LEFT JOIN users u ON tm.userId = u.userId
WHERE t.deletedAt IS NULL
GROUP BY t.teamId, t.name;
```

**Index Maintenance Guidelines:**
- **Monitor Performance**: Regularly analyze slow query logs to identify missing indexes
- **Avoid Over-Indexing**: Each index adds overhead to INSERT/UPDATE operations
- **Composite Index Order**: Place most selective columns first in composite indexes
- **Partial Indexes**: Use WHERE clauses in indexes for filtered queries (MySQL 8.0+)
- **Index Documentation**: Document the purpose and queries each index serves

### Data Types

1. `VARCHAR(36)` for UUID identifiers.
2. `VARCHAR(255)` for names and short descriptions.
3. `TEXT` for longer text fields.
4. `JSON` for structured data (e.g., `metadata`, `permissions`).
5. `ENUM` for fields with a fixed set of possible values (e.g., roles, boolean flags).
6. `DATETIME` for timestamp fields.
7. `MEDIUMINT UNSIGNED` for auto-increment IDs.

### Constraints

1. Foreign Key constraints with `ON DELETE CASCADE ON UPDATE CASCADE`.
2. Unique constraints on fields that should be unique (e.g., permission names).

## SQL Query Best Practices

### Limit Results

Always include a LIMIT clause in your queries, even when you expect only one record to be returned:

```sql
SELECT
    *
FROM
    users
WHERE
    id = ?
LIMIT
    1
```

Limiting queries tells the database to stop looking for more records once the limit is reached, which can improve performance significantly for large tables.

### Parameterize Queries

When using SQL in Node.js applications, always use parameterized queries to prevent SQL injection. Never concatenate user input directly into SQL strings.

**Bad Example (vulnerable to SQL injection):**
```javascript
// DON'T DO THIS
const query = `SELECT * FROM users WHERE id = ${req.params.id}`;
db.query(query);
```

**Good Example (using parameterized queries):**
```javascript
// DO THIS INSTEAD
const query = "SELECT * FROM users WHERE id = ?";
db.query(query, [req.params.id]);
```

With MySQL in Node.js, use the `?` placeholder syntax for parameter substitution, or named parameters with libraries that support them.

### Store Queries in Variables

For complex queries, assign them to variables for better debugging and readability:

```javascript
// Define the query separately
const query = `
    SELECT 
        u.name,
        u.email,
        t.name AS teamName
    FROM
        users u
    JOIN
        teamMembers tm ON u.id = tm.userId
    JOIN
        teams t ON tm.teamId = t.id
    WHERE
        u.id = ?
`;

// Execute the query
try {
    const user = await db.query(query, [userId]);
    // Process results
} catch (error) {
    console.error('Query error:', error);
    console.log('Failed query:', query); // Helpful for debugging
}
```

## Migration Patterns

### Migration Naming

1. Timestamp-prefixed names (e.g., `20230714112440-add-refresh-tokens-up.sql`).
2. Clear description of the change (e.g., `add-refresh-tokens`, `introduce-permissions`).
3. Suffix indicating migration direction (`up` or `down`).

### Migration Types

1. **Schema Creation**: Creating new tables (e.g., `CREATE TABLE refreshTokens`).
2. **Schema Modification**: Altering existing tables (e.g., `ALTER TABLE logs ADD COLUMN resourceId VARCHAR(36)`).
3. **Data Migration**: Inserting or updating data (e.g., permissions data).
4. **Relationship Management**: Adding or removing foreign key constraints.

### Reversibility

Each `up` migration should have a corresponding `down` migration to revert changes.

## Database Engine Settings

### Character Set and Collation

1. UTF-8 character encoding: `DEFAULT CHARACTER SET utf8mb4`.
2. Case-insensitive collation with accent sensitivity: `COLLATE utf8mb4_0900_ai_ci`.

### Storage Engine

InnoDB: Used for all tables to support transactions and foreign key constraints.

### Time Zone Setting

UTC is used as the standard time zone: `SET GLOBAL time_zone = '+0:00'`.

## Security Considerations

### Avoiding SQL Injection

SQL injection vulnerabilities are a serious security risk. In Node.js applications:

1. **Use an ORM or Query Builder**: Sequelize, TypeORM, or Knex.js provide built-in protection against SQL injection.
2. **Parameterized Queries**: Always use parameterized queries with the MySQL driver.
3. **Input Validation**: Validate all input before using it in database queries.

Example with Sequelize ORM:
```javascript
// Safely querying with Sequelize
const user = await User.findOne({
  where: { id: userId }
});
```

Example with MySQL2 driver:
```javascript
// Safely querying with parameterized query
const [rows] = await connection.execute(
  'SELECT * FROM users WHERE id = ?', 
  [userId]
);
```

### Avoid Reserved Words

SQL reserved words should not be used as table or column names to prevent issues with different databases.

A list of MySQL reserved words: [MySQL Reserved Words](http://dev.mysql.com/doc/refman/8.0/en/reserved-words.html)

## Role-Based Authorization Design

### Permission Model

1. Granular permissions stored in a dedicated `permissions` table.
2. Junction table `userPermissions` to assign permissions to users.
3. JSON column `permissions` for storing complex permission structures.

### Role System

Role-based access control implemented via `ENUM` fields:
- User roles: `'superadmin'`, `'admin'`, `'attendee'`
- Team member roles: `'teamMember'`, `'teamAdmin'`

## Data Integrity Patterns

### Soft Deletion

When implementing soft deletion:
```sql
ALTER TABLE users ADD COLUMN deletedAt DATETIME NULL DEFAULT NULL;
```

And in queries:
```sql
SELECT * FROM users WHERE deletedAt IS NULL;
```

### Audit Trailing

1. `logs` table captures events with metadata.
2. `created` and `updated` timestamp columns track record changes.

### Foreign Key Constraints

1. `ON DELETE CASCADE` ensures referential integrity by automatically removing child records.
2. `ON UPDATE CASCADE` propagates identifier changes to related tables.

## Node.js Integration

### ORM Usage

We use Sequelize as our primary ORM. Models should follow the same naming conventions as tables but in singular form and PascalCase:

```javascript
// User model for 'users' table
const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },
  userId: {
    type: DataTypes.STRING(36),
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true
  },
  // Additional fields...
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created',
  updatedAt: 'updated'
});
```

### Transaction Management

Always use transactions for operations that affect multiple tables:

```javascript
const transaction = await sequelize.transaction();

try {
  // Create a team
  const team = await Team.create({
    name: 'New Team',
    teamId: uuidv4()
  }, { transaction });
  
  // Add a member to the team
  await TeamMember.create({
    teamId: team.teamId,
    userId: currentUser.userId,
    role: 'teamAdmin'
  }, { transaction });
  
  await transaction.commit();
} catch (error) {
  await transaction.rollback();
  throw error;
}
```

### Connection Pooling

Configure appropriate connection pooling settings:

```javascript
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
```

## Schema Evolution Patterns

1. **Additive Changes**: Prefer adding new tables or columns rather than modifying existing ones.
2. **Constraint Management**: Add foreign key constraints after table creation.
3. **Data Type Refinement**: Be cautious when changing column types on existing data.

## Conclusion

Following these SQL standards and design patterns will ensure consistency, maintainability, and security in your Node.js applications. The database design supports multi-tenant applications with team-based collaboration, role-based access control, and comprehensive event logging.