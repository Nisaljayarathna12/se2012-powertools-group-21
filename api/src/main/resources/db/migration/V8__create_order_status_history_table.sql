-- ============================================================
-- PowerTools Database Schema - Flyway Migration V8
-- Audit trail for order status changes. A row is written each
-- time an admin updates an order's status so the change can be
-- traced back to who changed it and when.
-- ============================================================

CREATE TABLE ORDER_STATUS_HISTORY (
    history_id   INT          AUTO_INCREMENT PRIMARY KEY,
    order_id     INT          NOT NULL,
    from_status  VARCHAR(50),
    to_status    VARCHAR(50)  NOT NULL,
    changed_at   DATETIME(6)  NOT NULL,
    changed_by   INT          NOT NULL,
    CONSTRAINT fk_orderhistory_order FOREIGN KEY (order_id)
        REFERENCES ORDER_ENTITY (order_id),
    CONSTRAINT fk_orderhistory_user FOREIGN KEY (changed_by)
        REFERENCES USER (user_id)
);