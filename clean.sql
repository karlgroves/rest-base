-- Step 1: Create a procedure to drop all foreign key constraints
DELIMITER $$

DROP PROCEDURE IF EXISTS DropAllForeignKeys $$

CREATE PROCEDURE DropAllForeignKeys()
BEGIN
    DECLARE done INT DEFAULT 0;
    DECLARE tableName VARCHAR(255);
    DECLARE fkName VARCHAR(255);
    DECLARE alterStatement VARCHAR(1024);
    DECLARE cur CURSOR FOR
        SELECT TABLE_NAME, CONSTRAINT_NAME
        FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS
        WHERE CONSTRAINT_SCHEMA = DATABASE();

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

    OPEN cur;

    read_loop: LOOP
        FETCH cur INTO tableName, fkName;
        IF done THEN
            LEAVE read_loop;
        END IF;

        SET @alterStatement = CONCAT('ALTER TABLE `', tableName, '` DROP FOREIGN KEY `', fkName, '`;');
        PREPARE stmt FROM @alterStatement;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END LOOP;

    CLOSE cur;
END $$

DELIMITER ;

-- Step 2: Call the procedure to drop all foreign keys
CALL DropAllForeignKeys();

-- Step 3: Drop all tables
SET @tables = NULL;
SELECT GROUP_CONCAT('`', table_name, '`') INTO @tables
FROM information_schema.tables
WHERE table_schema = (SELECT DATABASE());

SET @tables = IFNULL(@tables, 'dummy_table_that_does_not_exist');
SET @dropStatement = CONCAT('DROP TABLE IF EXISTS ', @tables);

PREPARE stmt FROM @dropStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
