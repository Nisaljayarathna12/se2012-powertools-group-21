-- ============================================================
-- PowerTools Database Schema - Flyway Migration V7
-- Add a soft-delete flag to PRODUCT so discontinued items can
-- be hidden from the catalogue while preserving order history.
-- ============================================================

ALTER TABLE PRODUCT
    ADD COLUMN active BOOLEAN NOT NULL DEFAULT TRUE;