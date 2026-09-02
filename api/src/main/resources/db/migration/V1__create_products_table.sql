-- ============================================================
-- PowerTools Database Schema - Flyway Migration V1
-- Matches EER Diagram from README.md Section 7.2
-- ============================================================

-- USER (superclass for Customer and Admin)
CREATE TABLE USER (
    userId    INT          AUTO_INCREMENT PRIMARY KEY,
    name      VARCHAR(255) NOT NULL,
    email     VARCHAR(255) NOT NULL UNIQUE,
    password  VARCHAR(255) NOT NULL,
    role      VARCHAR(20)  NOT NULL
);

-- CATEGORY
CREATE TABLE CATEGORY (
    categoryId   INT          AUTO_INCREMENT PRIMARY KEY,
    categoryName VARCHAR(255) NOT NULL,
    description  TEXT
);

-- PRODUCT
CREATE TABLE PRODUCT (
    productId  INT            AUTO_INCREMENT PRIMARY KEY,
    categoryId INT,
    name       VARCHAR(255)   NOT NULL,
    price      DECIMAL(10, 2) NOT NULL,
    stockQty   INT            NOT NULL DEFAULT 0,
    imageUrl   VARCHAR(500),
    CONSTRAINT fk_product_category FOREIGN KEY (categoryId)
        REFERENCES CATEGORY (categoryId)
);

-- CART
CREATE TABLE CART (
    cartId      INT  AUTO_INCREMENT PRIMARY KEY,
    userId      INT  NOT NULL,
    createdDate DATE NOT NULL,
    CONSTRAINT fk_cart_user FOREIGN KEY (userId)
        REFERENCES USER (userId)
);

-- CART_ITEM
CREATE TABLE CART_ITEM (
    cartItemId INT AUTO_INCREMENT PRIMARY KEY,
    cartId     INT NOT NULL,
    productId  INT NOT NULL,
    quantity   INT NOT NULL DEFAULT 1,
    CONSTRAINT fk_cartitem_cart FOREIGN KEY (cartId)
        REFERENCES CART (cartId),
    CONSTRAINT fk_cartitem_product FOREIGN KEY (productId)
        REFERENCES PRODUCT (productId)
);

-- ORDER_ENTITY (named ORDER_ENTITY to avoid MySQL reserved word)
CREATE TABLE ORDER_ENTITY (
    orderId         INT            AUTO_INCREMENT PRIMARY KEY,
    userId          INT            NOT NULL,
    orderDate       DATE           NOT NULL,
    totalAmount     DECIMAL(10, 2) NOT NULL,
    status          VARCHAR(50)    NOT NULL,
    shippingAddress VARCHAR(500)   NOT NULL,
    CONSTRAINT fk_order_user FOREIGN KEY (userId)
        REFERENCES USER (userId)
);

-- ORDER_ITEM
CREATE TABLE ORDER_ITEM (
    orderItemId INT            AUTO_INCREMENT PRIMARY KEY,
    orderId     INT            NOT NULL,
    productId   INT            NOT NULL,
    quantity    INT            NOT NULL DEFAULT 1,
    unitPrice   DECIMAL(10, 2) NOT NULL,
    CONSTRAINT fk_orderitem_order FOREIGN KEY (orderId)
        REFERENCES ORDER_ENTITY (orderId),
    CONSTRAINT fk_orderitem_product FOREIGN KEY (productId)
        REFERENCES PRODUCT (productId)
);

-- PAYMENT
CREATE TABLE PAYMENT (
    paymentId       INT            AUTO_INCREMENT PRIMARY KEY,
    orderId         INT            NOT NULL,
    amount          DECIMAL(10, 2) NOT NULL,
    method          VARCHAR(50)    NOT NULL,
    status          VARCHAR(50)    NOT NULL,
    transactionDate DATE           NOT NULL,
    CONSTRAINT fk_payment_order FOREIGN KEY (orderId)
        REFERENCES ORDER_ENTITY (orderId)
);
