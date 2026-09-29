-- ============================================================
-- PowerTools Database Schema - Flyway Migration V9
-- Add a brand column to PRODUCT so the admin product form can
-- record the manufacturer (e.g. Bosch, Makita, DeWalt, Ingco).
--
-- Nullable: existing rows predate brands and must keep working.
-- The storefront falls back to its mock attribute module when a
-- row has no brand set.
-- ============================================================

ALTER TABLE PRODUCT
    ADD COLUMN brand VARCHAR(120) NULL AFTER name;
