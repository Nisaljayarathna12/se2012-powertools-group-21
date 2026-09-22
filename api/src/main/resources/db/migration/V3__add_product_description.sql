-- ============================================================
-- PowerTools Database Schema - Flyway Migration V3
-- Add description column to PRODUCT (matches Product entity)
-- ============================================================

ALTER TABLE PRODUCT
    ADD COLUMN description TEXT NULL AFTER stock_qty;