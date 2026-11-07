USE gnani_voice_shopping;

-- 1. Create staff table only if it does not already exist
CREATE TABLE IF NOT EXISTS staff_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Product inventory fields
ALTER TABLE products
    ADD COLUMN reserved_stock INT NOT NULL DEFAULT 0,
    ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN low_stock_threshold INT NOT NULL DEFAULT 5;

-- 3. Allow final order number to be assigned after payment
ALTER TABLE orders
    MODIFY COLUMN order_number VARCHAR(50) NULL;

-- 4. Add order workflow fields
ALTER TABLE orders
    ADD COLUMN temporary_reference VARCHAR(50) NULL,
    ADD UNIQUE KEY uq_orders_temporary_reference (temporary_reference),
    ADD COLUMN stock_reserved BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN payment_verified_at DATETIME NULL,
    ADD COLUMN payment_reference VARCHAR(100) NULL,
    ADD COLUMN payment_verified_by_staff_id INT NULL,
    ADD COLUMN packed_at DATETIME NULL,
    ADD COLUMN packed_by_staff_id INT NULL,
    ADD COLUMN rack_number VARCHAR(30) NULL,
    ADD COLUMN rack_assigned_at DATETIME NULL,
    ADD COLUMN shelf_stocker_id INT NULL,
    ADD COLUMN collected_at DATETIME NULL;

-- 5. Add staff references
ALTER TABLE orders
    ADD CONSTRAINT fk_orders_payment_staff
        FOREIGN KEY (payment_verified_by_staff_id)
        REFERENCES staff_users(id),
    ADD CONSTRAINT fk_orders_worker_staff
        FOREIGN KEY (packed_by_staff_id)
        REFERENCES staff_users(id),
    ADD CONSTRAINT fk_orders_shelf_staff
        FOREIGN KEY (shelf_stocker_id)
        REFERENCES staff_users(id);