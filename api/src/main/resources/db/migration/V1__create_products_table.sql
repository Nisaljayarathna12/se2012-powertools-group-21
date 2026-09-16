-- ============================================================
-- PowerTools Database Schema - Flyway Migration V1
-- Matches EER Diagram from README.md Section 7.2
-- ============================================================

-- USER (superclass for Customer and Admin)
CREATE TABLE USER (
    user_id    INT          AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(255) NOT NULL,
    email      VARCHAR(255) NOT NULL UNIQUE,
    password   VARCHAR(255) NOT NULL,
    role       VARCHAR(20)  NOT NULL
);

-- CATEGORY
CREATE TABLE category (
    category_id          CHAR(36)     PRIMARY KEY,
    category_name        VARCHAR(255) NOT NULL,
    category_description TEXT
);

-- PRODUCT
CREATE TABLE PRODUCT (
    product_id  INT            AUTO_INCREMENT PRIMARY KEY,
    category_id CHAR(36),
    name        VARCHAR(255)   NOT NULL,
    price       DECIMAL(10, 2) NOT NULL,
    stock_qty   INT            NOT NULL DEFAULT 0,
    image_url   VARCHAR(500),
    CONSTRAINT fk_product_category FOREIGN KEY (category_id)
        REFERENCES category (category_id)
);

-- CART
CREATE TABLE CART (
    cart_id      INT  AUTO_INCREMENT PRIMARY KEY,
    user_id      INT  NOT NULL,
    created_date DATE NOT NULL,
    CONSTRAINT fk_cart_user FOREIGN KEY (user_id)
        REFERENCES USER (user_id)
);

-- CART_ITEM
CREATE TABLE CART_ITEM (
    cart_item_id INT AUTO_INCREMENT PRIMARY KEY,
    cart_id      INT NOT NULL,
    product_id   INT NOT NULL,
    quantity     INT NOT NULL DEFAULT 1,
    CONSTRAINT fk_cartitem_cart FOREIGN KEY (cart_id)
        REFERENCES CART (cart_id),
    CONSTRAINT fk_cartitem_product FOREIGN KEY (product_id)
        REFERENCES PRODUCT (product_id)
);

-- ORDER_ENTITY (named ORDER_ENTITY to avoid MySQL reserved word)
CREATE TABLE ORDER_ENTITY (
    order_id          INT            AUTO_INCREMENT PRIMARY KEY,
    user_id           INT            NOT NULL,
    order_date        DATE           NOT NULL,
    total_amount      DECIMAL(10, 2) NOT NULL,
    status            VARCHAR(50)    NOT NULL,
    shipping_address  VARCHAR(500)   NOT NULL,
    CONSTRAINT fk_order_user FOREIGN KEY (user_id)
        REFERENCES USER (user_id)
);

-- ORDER_ITEM
CREATE TABLE ORDER_ITEM (
    order_item_id INT            AUTO_INCREMENT PRIMARY KEY,
    order_id      INT            NOT NULL,
    product_id    INT            NOT NULL,
    quantity      INT            NOT NULL DEFAULT 1,
    unit_price    DECIMAL(10, 2) NOT NULL,
    CONSTRAINT fk_orderitem_order FOREIGN KEY (order_id)
        REFERENCES ORDER_ENTITY (order_id),
    CONSTRAINT fk_orderitem_product FOREIGN KEY (product_id)
        REFERENCES PRODUCT (product_id)
);

-- PAYMENT
CREATE TABLE PAYMENT (
    payment_id        INT            AUTO_INCREMENT PRIMARY KEY,
    order_id          INT            NOT NULL,
    amount            DECIMAL(10, 2) NOT NULL,
    method            VARCHAR(50)    NOT NULL,
    status            VARCHAR(50)    NOT NULL,
    transaction_date  DATE           NOT NULL,
    CONSTRAINT fk_payment_order FOREIGN KEY (order_id)
        REFERENCES ORDER_ENTITY (order_id)
);
