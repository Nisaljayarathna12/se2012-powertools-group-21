-- ============================================================
-- PowerTools Database Schema - Flyway Migration V6
-- Remove externally hosted product image URLs from PRODUCT.
-- The frontend renders a "No image" placeholder when image_url
-- is NULL, so clearing these values is safe.
-- ============================================================

UPDATE PRODUCT
SET image_url = NULL
WHERE image_url IS NOT NULL
  AND TRIM(image_url) <> ''
  AND (image_url LIKE 'http://%' OR image_url LIKE 'https://%');