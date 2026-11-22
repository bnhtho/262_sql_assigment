-- ============================================================================
-- T-SQL SCRIPT: CƠ SỞ DỮ LIỆU QUẢN LÝ CỬA HÀNG VĂN PHÒNG PHẨM (MS SQL SERVER)
-- Được sinh từ sơ đồ EERD tổng quan, bảng Ánh xạ và 8 loại truy vấn
-- Quy mô dữ liệu Seed:
--   • Category (Danh mục): 5 bản ghi
--   • Brand (Thương hiệu): 10 bản ghi
--   • Unit (Đơn vị tính): 7 bản ghi
--   • Supplier (Nhà cung cấp): 5 bản ghi
--   • Customer (Khách hàng): 50 bản ghi
--   • Employee (Nhân viên): 10 bản ghi (4 Nhân viên kho, 4 Thu ngân, 2 Quản lý)
--   • Product (Sản phẩm): 30 bản ghi văn phòng phẩm
--   • Inventory (Tồn kho 1:1): 30 bản ghi (khớp tuyệt đối với tổng biến động kho)
--   • Purchase Receipt (Phiếu nhập): 10 phiếu (mỗi phiếu từ 3 đến 5 dòng chi tiết, tổng 40 chi tiết)
--   • Sales Invoice (Hóa đơn bán): 10 hóa đơn (mỗi hóa đơn từ 2 đến 3 dòng chi tiết, tổng 25 chi tiết)
--   • Stock Movement (Biến động kho): 80 bản ghi (40 IN + 25 OUT + 15 ADJUST)
-- ============================================================================

USE master;
GO

IF DB_ID(N'StationeryStoreDB') IS NOT NULL
BEGIN
    ALTER DATABASE StationeryStoreDB SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE StationeryStoreDB;
END
GO

CREATE DATABASE StationeryStoreDB;
GO

USE StationeryStoreDB;
GO

-- ============================================================================
-- PHẦN 1: DDL - ĐỊNH NGHĨA BẢNG & RÀNG BUỘC
-- ============================================================================

-- 1. Bảng Danh mục (Category) - Phụ trách: TV1
CREATE TABLE dbo.category (
    category_id INT IDENTITY(1,1) CONSTRAINT PK_category PRIMARY KEY,
    category_name NVARCHAR(150) NOT NULL CONSTRAINT UQ_category_name UNIQUE,
    description NVARCHAR(500) NULL,
    status VARCHAR(20) NOT NULL CONSTRAINT DF_category_status DEFAULT 'ACTIVE',
    CONSTRAINT CK_category_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
);
GO

-- 2. Bảng Thương hiệu (Brand) - Phụ trách: TV1
CREATE TABLE dbo.brand (
    brand_id INT IDENTITY(1,1) CONSTRAINT PK_brand PRIMARY KEY,
    brand_name NVARCHAR(150) NOT NULL CONSTRAINT UQ_brand_name UNIQUE,
    origin NVARCHAR(100) NULL
);
GO

-- 3. Bảng Đơn vị tính (Unit of Measure) - Phụ trách: TV1
CREATE TABLE dbo.unit (
    unit_id INT IDENTITY(1,1) CONSTRAINT PK_unit PRIMARY KEY,
    unit_name NVARCHAR(100) NOT NULL CONSTRAINT UQ_unit_name UNIQUE,
    symbol NVARCHAR(30) NOT NULL
);
GO

-- 4. Bảng Sản phẩm (Product) - Phụ trách: TV1
CREATE TABLE dbo.product (
    product_id INT IDENTITY(1,1) CONSTRAINT PK_product PRIMARY KEY,
    sku VARCHAR(50) NOT NULL CONSTRAINT UQ_product_sku UNIQUE,
    barcode VARCHAR(50) NOT NULL CONSTRAINT UQ_product_barcode UNIQUE,
    product_name NVARCHAR(250) NOT NULL,
    specification NVARCHAR(200) NULL,
    sale_price DECIMAL(18,2) NOT NULL CONSTRAINT CK_product_sale_price CHECK (sale_price >= 0),
    reorder_level INT NOT NULL CONSTRAINT DF_product_reorder DEFAULT 10 CONSTRAINT CK_product_reorder CHECK (reorder_level >= 0),
    status VARCHAR(20) NOT NULL CONSTRAINT DF_product_status DEFAULT 'ACTIVE',
    description NVARCHAR(1000) NULL,
    category_id INT NOT NULL,
    brand_id INT NULL,
    unit_id INT NOT NULL,
    CONSTRAINT CK_product_status CHECK (status IN ('ACTIVE', 'INACTIVE')),
    CONSTRAINT FK_product_category FOREIGN KEY (category_id) REFERENCES dbo.category(category_id),
    CONSTRAINT FK_product_brand FOREIGN KEY (brand_id) REFERENCES dbo.brand(brand_id),
    CONSTRAINT FK_product_unit FOREIGN KEY (unit_id) REFERENCES dbo.unit(unit_id)
);
GO

-- 5. Bảng Tồn kho (Inventory) - Phụ trách: TV4
-- Quan hệ 1:1 toàn phần với Sản phẩm (product_id UNIQUE NOT NULL)
CREATE TABLE dbo.inventory (
    inventory_id INT IDENTITY(1,1) CONSTRAINT PK_inventory PRIMARY KEY,
    product_id INT NOT NULL CONSTRAINT UQ_inventory_product UNIQUE,
    quantity_on_hand INT NOT NULL CONSTRAINT DF_inventory_qty DEFAULT 0 CONSTRAINT CK_inventory_qty CHECK (quantity_on_hand >= 0),
    last_updated DATETIME2 NOT NULL CONSTRAINT DF_inventory_updated DEFAULT SYSDATETIME(),
    CONSTRAINT FK_inventory_product FOREIGN KEY (product_id) REFERENCES dbo.product(product_id)
);
GO

-- 6. Bảng Nhà cung cấp (Supplier) - Phụ trách: TV2
CREATE TABLE dbo.supplier (
    supplier_id INT IDENTITY(1,1) CONSTRAINT PK_supplier PRIMARY KEY,
    supplier_name NVARCHAR(250) NOT NULL,
    tax_code VARCHAR(30) NULL CONSTRAINT UQ_supplier_tax_code UNIQUE,
    contact_person NVARCHAR(150) NULL,
    phone VARCHAR(20) NULL,
    email VARCHAR(150) NULL,
    address NVARCHAR(500) NULL
);
GO

-- 7. Bảng Khách hàng (Customer) - Phụ trách: TV3
-- Thuộc tính ghép Họ và tên được tách thành 2 cột ho, ten kèm cột tính toán full_name
CREATE TABLE dbo.customer (
    customer_id INT IDENTITY(1,1) CONSTRAINT PK_customer PRIMARY KEY,
    ho NVARCHAR(100) NOT NULL,
    ten NVARCHAR(50) NOT NULL,
    full_name AS (RTRIM(ho) + N' ' + LTRIM(ten)),
    phone VARCHAR(20) NULL CONSTRAINT UQ_customer_phone UNIQUE,
    email VARCHAR(150) NULL,
    address NVARCHAR(500) NULL,
    member_code VARCHAR(50) NULL
);
GO

-- 8. Bảng Nhân viên (Employee) - Dùng chung
-- Chuyên biệt hóa bán phần, rời nhau (d): WAREHOUSE_STAFF, CASHIER, MANAGER
CREATE TABLE dbo.employee (
    employee_id INT IDENTITY(1,1) CONSTRAINT PK_employee PRIMARY KEY,
    ho NVARCHAR(100) NOT NULL,
    ten NVARCHAR(50) NOT NULL,
    full_name AS (RTRIM(ho) + N' ' + LTRIM(ten)),
    phone VARCHAR(20) NULL,
    email VARCHAR(150) NULL CONSTRAINT UQ_employee_email UNIQUE,
    role VARCHAR(30) NOT NULL,
    hire_date DATE NOT NULL CONSTRAINT DF_employee_hire_date DEFAULT CAST(SYSDATETIME() AS DATE),
    status VARCHAR(20) NOT NULL CONSTRAINT DF_employee_status DEFAULT 'ACTIVE',
    assigned_area NVARCHAR(150) NULL,
    work_shift NVARCHAR(50) NULL,
    CONSTRAINT CK_employee_role CHECK (role IN ('WAREHOUSE_STAFF', 'CASHIER', 'MANAGER')),
    CONSTRAINT CK_employee_status CHECK (status IN ('ACTIVE', 'INACTIVE')),
    CONSTRAINT CK_employee_specialization CHECK (
        (role = 'WAREHOUSE_STAFF' AND assigned_area IS NOT NULL AND work_shift IS NULL) OR
        (role = 'CASHIER'         AND work_shift IS NOT NULL AND assigned_area IS NULL) OR
        (role = 'MANAGER'         AND assigned_area IS NULL AND work_shift IS NULL)
    )
);
GO

-- 9. Bảng Phiếu nhập (Purchase Receipt) - Phụ trách: TV2
CREATE TABLE dbo.purchase_receipt (
    purchase_id INT IDENTITY(1,1) CONSTRAINT PK_purchase_receipt PRIMARY KEY,
    purchase_date DATETIME2 NOT NULL CONSTRAINT DF_purchase_date DEFAULT SYSDATETIME(),
    status VARCHAR(20) NOT NULL CONSTRAINT DF_purchase_status DEFAULT 'CONFIRMED',
    note NVARCHAR(500) NULL,
    supplier_id INT NOT NULL,
    created_by INT NOT NULL,
    CONSTRAINT CK_purchase_status CHECK (status IN ('DRAFT', 'CONFIRMED', 'CANCELLED')),
    CONSTRAINT FK_purchase_supplier FOREIGN KEY (supplier_id) REFERENCES dbo.supplier(supplier_id),
    CONSTRAINT FK_purchase_employee FOREIGN KEY (created_by) REFERENCES dbo.employee(employee_id)
);
GO

-- 10. Bảng Chi tiết phiếu nhập (Purchase Detail - Quan hệ N:M "Gồm") - Phụ trách: TV2
CREATE TABLE dbo.purchase_detail (
    purchase_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL CONSTRAINT CK_purchase_detail_qty CHECK (quantity > 0),
    unit_price DECIMAL(18,2) NOT NULL CONSTRAINT CK_purchase_detail_price CHECK (unit_price >= 0),
    line_total AS (CAST(quantity * unit_price AS DECIMAL(18,2))) PERSISTED,
    CONSTRAINT PK_purchase_detail PRIMARY KEY (purchase_id, product_id),
    CONSTRAINT FK_purchase_detail_receipt FOREIGN KEY (purchase_id) REFERENCES dbo.purchase_receipt(purchase_id) ON DELETE CASCADE,
    CONSTRAINT FK_purchase_detail_product FOREIGN KEY (product_id) REFERENCES dbo.product(product_id)
);
GO

-- 11. Bảng Hóa đơn bán (Sales Invoice) - Phụ trách: TV3
CREATE TABLE dbo.sales_invoice (
    invoice_id INT IDENTITY(1,1) CONSTRAINT PK_sales_invoice PRIMARY KEY,
    created_at DATETIME2 NOT NULL CONSTRAINT DF_sales_created_at DEFAULT SYSDATETIME(),
    status VARCHAR(20) NOT NULL CONSTRAINT DF_sales_status DEFAULT 'CONFIRMED',
    payment_method NVARCHAR(50) NOT NULL CONSTRAINT DF_sales_payment DEFAULT N'CASH',
    discount DECIMAL(18,2) NOT NULL CONSTRAINT DF_sales_discount DEFAULT 0 CONSTRAINT CK_sales_discount CHECK (discount >= 0),
    customer_id INT NULL,
    cashier_id INT NOT NULL,
    CONSTRAINT CK_sales_status CHECK (status IN ('DRAFT', 'CONFIRMED', 'CANCELLED')),
    CONSTRAINT FK_sales_customer FOREIGN KEY (customer_id) REFERENCES dbo.customer(customer_id),
    CONSTRAINT FK_sales_cashier FOREIGN KEY (cashier_id) REFERENCES dbo.employee(employee_id)
);
GO

-- 12. Bảng Chi tiết hóa đơn bán (Sales Detail - Quan hệ N:M "Bán") - Phụ trách: TV3
CREATE TABLE dbo.sales_detail (
    invoice_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL CONSTRAINT CK_sales_detail_qty CHECK (quantity > 0),
    unit_price DECIMAL(18,2) NOT NULL CONSTRAINT CK_sales_detail_price CHECK (unit_price >= 0),
    line_discount DECIMAL(18,2) NOT NULL CONSTRAINT DF_sales_detail_discount DEFAULT 0 CONSTRAINT CK_sales_detail_discount CHECK (line_discount >= 0),
    line_total AS (CAST(quantity * unit_price - line_discount AS DECIMAL(18,2))) PERSISTED,
    CONSTRAINT PK_sales_detail PRIMARY KEY (invoice_id, product_id),
    CONSTRAINT CK_sales_detail_valid_total CHECK (quantity * unit_price >= line_discount),
    CONSTRAINT FK_sales_detail_invoice FOREIGN KEY (invoice_id) REFERENCES dbo.sales_invoice(invoice_id) ON DELETE CASCADE,
    CONSTRAINT FK_sales_detail_product FOREIGN KEY (product_id) REFERENCES dbo.product(product_id)
);
GO

-- 13. Bảng Biến động kho (Stock Movement) - Phụ trách: TV4
-- Chuyên biệt hóa toàn phần, rời nhau (d) theo movement_type ('IN', 'OUT', 'ADJUST')
CREATE TABLE dbo.stock_movement (
    movement_id INT IDENTITY(1,1) CONSTRAINT PK_stock_movement PRIMARY KEY,
    product_id INT NOT NULL,
    movement_type VARCHAR(10) NOT NULL,
    quantity_change INT NOT NULL CONSTRAINT CK_movement_qty_nonzero CHECK (quantity_change <> 0),
    created_at DATETIME2 NOT NULL CONSTRAINT DF_movement_created_at DEFAULT SYSDATETIME(),
    note NVARCHAR(500) NULL,
    purchase_id INT NULL,
    invoice_id INT NULL,
    adjusted_by INT NULL,
    CONSTRAINT CK_movement_type CHECK (movement_type IN ('IN', 'OUT', 'ADJUST')),
    CONSTRAINT CK_movement_specialization CHECK (
        (movement_type = 'IN'     AND purchase_id IS NOT NULL AND invoice_id IS NULL     AND adjusted_by IS NULL     AND quantity_change > 0) OR
        (movement_type = 'OUT'    AND invoice_id IS NOT NULL  AND purchase_id IS NULL    AND adjusted_by IS NULL     AND quantity_change < 0) OR
        (movement_type = 'ADJUST' AND adjusted_by IS NOT NULL AND purchase_id IS NULL    AND invoice_id IS NULL)
    ),
    CONSTRAINT FK_movement_product FOREIGN KEY (product_id) REFERENCES dbo.product(product_id),
    CONSTRAINT FK_movement_purchase FOREIGN KEY (purchase_id) REFERENCES dbo.purchase_receipt(purchase_id),
    CONSTRAINT FK_movement_invoice FOREIGN KEY (invoice_id) REFERENCES dbo.sales_invoice(invoice_id),
    CONSTRAINT FK_movement_employee FOREIGN KEY (adjusted_by) REFERENCES dbo.employee(employee_id)
);
GO

-- ============================================================================
-- PHẦN 2: INDEXES & VIEWS
-- ============================================================================
CREATE NONCLUSTERED INDEX IX_product_category_price ON dbo.product(category_id, sale_price) INCLUDE (sku, barcode, product_name, status);
CREATE NONCLUSTERED INDEX IX_purchase_receipt_supplier ON dbo.purchase_receipt(supplier_id, purchase_date);
CREATE NONCLUSTERED INDEX IX_sales_invoice_customer_date ON dbo.sales_invoice(customer_id, created_at);
CREATE NONCLUSTERED INDEX IX_stock_movement_product_date ON dbo.stock_movement(product_id, created_at);
GO

CREATE VIEW dbo.vw_purchase_receipt_summary
AS
SELECT
    pr.purchase_id,
    pr.purchase_date,
    pr.status,
    pr.note,
    pr.supplier_id,
    s.supplier_name,
    pr.created_by,
    e.full_name AS created_by_name,
    ISNULL(SUM(pd.line_total), 0) AS total_amount
FROM dbo.purchase_receipt pr
INNER JOIN dbo.supplier s ON pr.supplier_id = s.supplier_id
INNER JOIN dbo.employee e ON pr.created_by = e.employee_id
LEFT JOIN dbo.purchase_detail pd ON pr.purchase_id = pd.purchase_id
GROUP BY
    pr.purchase_id, pr.purchase_date, pr.status, pr.note,
    pr.supplier_id, s.supplier_name, pr.created_by, e.full_name;
GO

CREATE VIEW dbo.vw_sales_invoice_summary
AS
SELECT
    si.invoice_id,
    si.created_at,
    si.status,
    si.payment_method,
    si.discount,
    si.customer_id,
    c.full_name AS customer_name,
    si.cashier_id,
    e.full_name AS cashier_name,
    ISNULL(SUM(sd.line_total), 0) AS subtotal_amount,
    ISNULL(SUM(sd.line_total), 0) - si.discount AS total_amount
FROM dbo.sales_invoice si
LEFT JOIN dbo.customer c ON si.customer_id = c.customer_id
INNER JOIN dbo.employee e ON si.cashier_id = e.employee_id
LEFT JOIN dbo.sales_detail sd ON si.invoice_id = sd.invoice_id
GROUP BY
    si.invoice_id, si.created_at, si.status, si.payment_method,
    si.discount, si.customer_id, c.full_name, si.cashier_id, e.full_name;
GO

-- ============================================================================
-- PHẦN 3: SEED DATA CHO CỬA HÀNG VĂN PHÒNG PHẨM
-- ============================================================================

-- 3.1. Danh mục văn phòng phẩm (5 danh mục: 3 cũ + 2 mới)
SET IDENTITY_INSERT dbo.category ON;
INSERT INTO dbo.category (category_id, category_name, description, status) VALUES
(1, N'Bút viết các loại', N'Bút bi, bút gel, bút lông bảng, bút dạ quang, bút chì', 'ACTIVE'),
(2, N'Giấy in & Sổ tập', N'Giấy in văn phòng A4/A5, sổ tay, tập vở, giấy ghi chú', 'ACTIVE'),
(3, N'File hồ sơ & Lưu trữ', N'Bìa còng, bìa lá, bìa nút, hộp đựng hồ sơ, kẹp tài liệu', 'ACTIVE'),
(4, N'Dụng cụ văn phòng', N'Bấm kim, kim bấm, kẹp bướm, kéo, dao rọc giấy, băng keo', 'ACTIVE'),
(5, N'Thiết bị & Phụ kiện VP', N'Máy tính bỏ túi, pin, ruy băng, bảng từ, khay cắm bút', 'ACTIVE');
SET IDENTITY_INSERT dbo.category OFF;
GO

-- 3.2. Thương hiệu văn phòng phẩm (10 thương hiệu: 3 cũ + 7 mới)
SET IDENTITY_INSERT dbo.brand ON;
INSERT INTO dbo.brand (brand_id, brand_name, origin) VALUES
(1, N'Thiên Long', N'Việt Nam'),
(2, N'Double A', N'Thái Lan'),
(3, N'Plus', N'Nhật Bản'),
(4, N'Deli', N'Trung Quốc'),
(5, N'Pentel', N'Nhật Bản'),
(6, N'King Jim', N'Nhật Bản'),
(7, N'Casio', N'Nhật Bản'),
(8, N'IK Plus', N'Indonesia'),
(9, N'Kokuyo', N'Nhật Bản'),
(10, N'Hồng Hà', N'Việt Nam');
SET IDENTITY_INSERT dbo.brand OFF;
GO

-- 3.3. Đơn vị tính (7 đơn vị)
SET IDENTITY_INSERT dbo.unit ON;
INSERT INTO dbo.unit (unit_id, unit_name, symbol) VALUES
(1, N'Cây', N'cây'),
(2, N'Hộp', N'hộp'),
(3, N'Ream', N'ream'),
(4, N'Cuốn', N'cuốn'),
(5, N'Cái', N'cái'),
(6, N'Xấp', N'xấp'),
(7, N'Cuộn', N'cuộn');
SET IDENTITY_INSERT dbo.unit OFF;
GO

-- 3.4. Nhà cung cấp văn phòng phẩm (5 nhà cung cấp: 2 cũ + 3 mới)
SET IDENTITY_INSERT dbo.supplier ON;
INSERT INTO dbo.supplier (supplier_id, supplier_name, tax_code, contact_person, phone, email, address) VALUES
(1, N'Công ty CP Tập đoàn Thiên Long', '0301464830', N'Nguyễn Minh Tuấn', '02837505555', 'sales@thienlonggroup.com', N'Tầng 10, Sofic Tower, Khu đô thị Sala, TP. Thủ Đức, TP.HCM'),
(2, N'Công ty TNHH Quốc Tế Văn Phòng Phẩm Plus Việt Nam', '3600254891', N'Trần Thị Ngọc Mai', '02513836555', 'contact@plus-vietnam.com', N'Đường số 7, KCN Biên Hòa 2, TP. Biên Hòa, Đồng Nai'),
(3, N'Công ty TNHH Thương Mại Giấy & VPP Á Châu', '0304829104', N'Lê Hoàng Nam', '02838123456', 'kinhdoanh@giayachau.vn', N'128 Cộng Hòa, Phường 4, Quận Tân Bình, TP.HCM'),
(4, N'Công ty CP Phân Phối Văn Phòng Phẩm Deli Miền Nam', '0312589632', N'Phạm Quốc Hưng', '02839256789', 'order@delivietnam.vn', N'456 Nguyễn Thị Minh Khai, Phường 5, Quận 3, TP.HCM'),
(5, N'Công ty CP Xuất Nhập Khẩu Thiết Bị Văn Phòng Sao Khuê', '0309876543', N'Võ Thị Thanh Thảo', '02838445566', 'info@saokhueoffice.vn', N'88 Hoàng Văn Thụ, Phường 9, Quận Phú Nhuận, TP.HCM');
SET IDENTITY_INSERT dbo.supplier OFF;
GO

-- 3.5. Khách hàng (50 khách hàng: 2 cũ + 48 mới)
SET IDENTITY_INSERT dbo.customer ON;
INSERT INTO dbo.customer (customer_id, ho, ten, phone, email, address, member_code) VALUES
(1, N'Nguyễn Văn', N'An', '0900000001', 'khachhang01@vppclient.vn', N'Số 8 Nguyễn Huệ, Quận 1, TP.HCM', 'VIP-0001'),
(2, N'Trần Thị', N'Bình', '0900000002', 'khachhang02@vppclient.vn', N'Số 11 Lê Lợi, Quận 3, TP.HCM', 'VIP-0002'),
(3, N'Lê Hoàng', N'Châu', '0900000003', 'khachhang03@vppclient.vn', N'Số 14 Hai Bà Trưng, Quận 4, TP.HCM', 'VIP-0003'),
(4, N'Phạm Minh', N'Dũng', '0900000004', 'khachhang04@vppclient.vn', N'Số 17 Nam Kỳ Khởi Nghĩa, Quận 5, TP.HCM', 'VIP-0004'),
(5, N'Hoàng Gia', N'Giang', '0900000005', 'khachhang05@vppclient.vn', N'Số 20 Điện Biên Phủ, Quận 7, TP.HCM', 'VIP-0005'),
(6, N'Huỳnh Ngọc', N'Hà', '0900000006', 'khachhang06@vppclient.vn', N'Số 23 Cách Mạng Tháng Tám, Quận 10, TP.HCM', 'VIP-0006'),
(7, N'Phan Thanh', N'Hải', '0900000007', 'khachhang07@vppclient.vn', N'Số 26 Nguyễn Thị Minh Khai, Quận Bình Thạnh, TP.HCM', 'VIP-0007'),
(8, N'Vũ Đình', N'Hạnh', '0900000008', 'khachhang08@vppclient.vn', N'Số 29 Phan Xích Long, Quận Phú Nhuận, TP.HCM', 'VIP-0008'),
(9, N'Võ Thị', N'Hiếu', '0900000009', 'khachhang09@vppclient.vn', N'Số 32 Hoàng Văn Thụ, Quận Tân Bình, TP.HCM', 'VIP-0009'),
(10, N'Đặng Quốc', N'Hoàng', '0900000010', 'khachhang10@vppclient.vn', N'Số 35 Võ Văn Ngân, TP. Thủ Đức, TP.HCM', 'VIP-0010'),
(11, N'Nguyễn Văn', N'Hùng', '0900000011', 'khachhang11@vppclient.vn', N'Số 38 Nguyễn Huệ, Quận 1, TP.HCM', 'VIP-0011'),
(12, N'Trần Thị', N'Hương', '0900000012', 'khachhang12@vppclient.vn', N'Số 41 Lê Lợi, Quận 3, TP.HCM', 'VIP-0012'),
(13, N'Lê Hoàng', N'Khánh', '0900000013', 'khachhang13@vppclient.vn', N'Số 44 Hai Bà Trưng, Quận 4, TP.HCM', 'VIP-0013'),
(14, N'Phạm Minh', N'Khoa', '0900000014', 'khachhang14@vppclient.vn', N'Số 47 Nam Kỳ Khởi Nghĩa, Quận 5, TP.HCM', 'VIP-0014'),
(15, N'Hoàng Gia', N'Khôi', '0900000015', 'khachhang15@vppclient.vn', N'Số 50 Điện Biên Phủ, Quận 7, TP.HCM', 'VIP-0015'),
(16, N'Huỳnh Ngọc', N'Lâm', '0900000016', 'khachhang16@vppclient.vn', N'Số 53 Cách Mạng Tháng Tám, Quận 10, TP.HCM', 'VIP-0016'),
(17, N'Phan Thanh', N'Lan', '0900000017', 'khachhang17@vppclient.vn', N'Số 56 Nguyễn Thị Minh Khai, Quận Bình Thạnh, TP.HCM', 'VIP-0017'),
(18, N'Vũ Đình', N'Linh', '0900000018', 'khachhang18@vppclient.vn', N'Số 59 Phan Xích Long, Quận Phú Nhuận, TP.HCM', 'VIP-0018'),
(19, N'Võ Thị', N'Long', '0900000019', 'khachhang19@vppclient.vn', N'Số 62 Hoàng Văn Thụ, Quận Tân Bình, TP.HCM', 'VIP-0019'),
(20, N'Đặng Quốc', N'Mai', '0900000020', 'khachhang20@vppclient.vn', N'Số 65 Võ Văn Ngân, TP. Thủ Đức, TP.HCM', 'VIP-0020'),
(21, N'Nguyễn Văn', N'Minh', '0900000021', 'khachhang21@vppclient.vn', N'Số 68 Nguyễn Huệ, Quận 1, TP.HCM', 'VIP-0021'),
(22, N'Trần Thị', N'My', '0900000022', 'khachhang22@vppclient.vn', N'Số 71 Lê Lợi, Quận 3, TP.HCM', 'VIP-0022'),
(23, N'Lê Hoàng', N'Nam', '0900000023', 'khachhang23@vppclient.vn', N'Số 74 Hai Bà Trưng, Quận 4, TP.HCM', 'VIP-0023'),
(24, N'Phạm Minh', N'Nga', '0900000024', 'khachhang24@vppclient.vn', N'Số 77 Nam Kỳ Khởi Nghĩa, Quận 5, TP.HCM', 'VIP-0024'),
(25, N'Hoàng Gia', N'Ngân', '0900000025', 'khachhang25@vppclient.vn', N'Số 80 Điện Biên Phủ, Quận 7, TP.HCM', 'VIP-0025'),
(26, N'Huỳnh Ngọc', N'Ngọc', '0900000026', 'khachhang26@vppclient.vn', N'Số 83 Cách Mạng Tháng Tám, Quận 10, TP.HCM', 'VIP-0026'),
(27, N'Phan Thanh', N'Nhung', '0900000027', 'khachhang27@vppclient.vn', N'Số 86 Nguyễn Thị Minh Khai, Quận Bình Thạnh, TP.HCM', 'VIP-0027'),
(28, N'Vũ Đình', N'Oanh', '0900000028', 'khachhang28@vppclient.vn', N'Số 89 Phan Xích Long, Quận Phú Nhuận, TP.HCM', 'VIP-0028'),
(29, N'Võ Thị', N'Phong', '0900000029', 'khachhang29@vppclient.vn', N'Số 92 Hoàng Văn Thụ, Quận Tân Bình, TP.HCM', 'VIP-0029'),
(30, N'Đặng Quốc', N'Phúc', '0900000030', 'khachhang30@vppclient.vn', N'Số 95 Võ Văn Ngân, TP. Thủ Đức, TP.HCM', 'VIP-0030'),
(31, N'Nguyễn Văn', N'Phương', '0900000031', 'khachhang31@vppclient.vn', N'Số 98 Nguyễn Huệ, Quận 1, TP.HCM', 'VIP-0031'),
(32, N'Trần Thị', N'Quân', '0900000032', 'khachhang32@vppclient.vn', N'Số 101 Lê Lợi, Quận 3, TP.HCM', 'VIP-0032'),
(33, N'Lê Hoàng', N'Quang', '0900000033', 'khachhang33@vppclient.vn', N'Số 104 Hai Bà Trưng, Quận 4, TP.HCM', 'VIP-0033'),
(34, N'Phạm Minh', N'Quỳnh', '0900000034', 'khachhang34@vppclient.vn', N'Số 107 Nam Kỳ Khởi Nghĩa, Quận 5, TP.HCM', 'VIP-0034'),
(35, N'Hoàng Gia', N'Sơn', '0900000035', 'khachhang35@vppclient.vn', N'Số 110 Điện Biên Phủ, Quận 7, TP.HCM', 'VIP-0035'),
(36, N'Huỳnh Ngọc', N'Tâm', '0900000036', 'khachhang36@vppclient.vn', N'Số 113 Cách Mạng Tháng Tám, Quận 10, TP.HCM', 'VIP-0036'),
(37, N'Phan Thanh', N'Tân', '0900000037', 'khachhang37@vppclient.vn', N'Số 116 Nguyễn Thị Minh Khai, Quận Bình Thạnh, TP.HCM', 'VIP-0037'),
(38, N'Vũ Đình', N'Thảo', '0900000038', 'khachhang38@vppclient.vn', N'Số 119 Phan Xích Long, Quận Phú Nhuận, TP.HCM', 'VIP-0038'),
(39, N'Võ Thị', N'Thắng', '0900000039', 'khachhang39@vppclient.vn', N'Số 122 Hoàng Văn Thụ, Quận Tân Bình, TP.HCM', 'VIP-0039'),
(40, N'Đặng Quốc', N'Thịnh', '0900000040', 'khachhang40@vppclient.vn', N'Số 125 Võ Văn Ngân, TP. Thủ Đức, TP.HCM', 'VIP-0040'),
(41, N'Nguyễn Văn', N'Thu', '0900000041', 'khachhang41@vppclient.vn', N'Số 128 Nguyễn Huệ, Quận 1, TP.HCM', 'VIP-0041'),
(42, N'Trần Thị', N'Thủy', '0900000042', 'khachhang42@vppclient.vn', N'Số 131 Lê Lợi, Quận 3, TP.HCM', 'VIP-0042'),
(43, N'Lê Hoàng', N'Trang', '0900000043', 'khachhang43@vppclient.vn', N'Số 134 Hai Bà Trưng, Quận 4, TP.HCM', 'VIP-0043'),
(44, N'Phạm Minh', N'Trinh', '0900000044', 'khachhang44@vppclient.vn', N'Số 137 Nam Kỳ Khởi Nghĩa, Quận 5, TP.HCM', 'VIP-0044'),
(45, N'Hoàng Gia', N'Trung', '0900000045', 'khachhang45@vppclient.vn', N'Số 140 Điện Biên Phủ, Quận 7, TP.HCM', 'VIP-0045'),
(46, N'Huỳnh Ngọc', N'Tú', '0900000046', 'khachhang46@vppclient.vn', N'Số 143 Cách Mạng Tháng Tám, Quận 10, TP.HCM', 'VIP-0046'),
(47, N'Phan Thanh', N'Tuấn', '0900000047', 'khachhang47@vppclient.vn', N'Số 146 Nguyễn Thị Minh Khai, Quận Bình Thạnh, TP.HCM', 'VIP-0047'),
(48, N'Vũ Đình', N'Tùng', '0900000048', 'khachhang48@vppclient.vn', N'Số 149 Phan Xích Long, Quận Phú Nhuận, TP.HCM', 'VIP-0048'),
(49, N'Võ Thị', N'Uyên', '0900000049', 'khachhang49@vppclient.vn', N'Số 152 Hoàng Văn Thụ, Quận Tân Bình, TP.HCM', 'VIP-0049'),
(50, N'Đặng Quốc', N'Vy', '0900000050', 'khachhang50@vppclient.vn', N'Số 155 Võ Văn Ngân, TP. Thủ Đức, TP.HCM', 'VIP-0050');
SET IDENTITY_INSERT dbo.customer OFF;
GO

-- 3.6. Nhân viên (10 nhân viên: 3 cũ + 7 mới)
SET IDENTITY_INSERT dbo.employee ON;
INSERT INTO dbo.employee (employee_id, ho, ten, phone, email, role, hire_date, status, assigned_area, work_shift) VALUES
(1, N'Võ Thành', N'Long', '0988111001', 'long.vo@stationery.vn', 'WAREHOUSE_STAFF', '2024-01-15', 'ACTIVE', N'Kho Bút Viết & Dụng Cụ - Khu A1', NULL),
(2, N'Trần Quốc', N'Tuấn', '0988111002', 'tuan.tran@stationery.vn', 'WAREHOUSE_STAFF', '2024-02-10', 'ACTIVE', N'Kho Giấy In & Sổ Tập - Khu A2', NULL),
(3, N'Lê Minh', N'Tâm', '0988111003', 'tam.le@stationery.vn', 'WAREHOUSE_STAFF', '2024-03-05', 'ACTIVE', N'Kho Bìa Hồ Sơ & Lưu Trữ - Khu B1', NULL),
(4, N'Phạm Hồng', N'Phúc', '0988111004', 'phuc.pham@stationery.vn', 'WAREHOUSE_STAFF', '2024-04-12', 'ACTIVE', N'Kho Thiết Bị Văn Phòng - Khu B2', NULL),
(5, N'Đặng Ngọc', N'Lan', '0988222005', 'lan.dang@stationery.vn', 'CASHIER', '2024-01-20', 'ACTIVE', NULL, N'Ca Sáng (07:30 - 15:30)'),
(6, N'Nguyễn Thu', N'Hương', '0988222006', 'huong.nguyen@stationery.vn', 'CASHIER', '2024-02-18', 'ACTIVE', NULL, N'Ca Chiều (14:00 - 22:00)'),
(7, N'Bùi Thanh', N'Trúc', '0988222007', 'truc.bui@stationery.vn', 'CASHIER', '2024-03-22', 'ACTIVE', NULL, N'Ca Sáng (07:30 - 15:30)'),
(8, N'Đỗ Gia', N'Hân', '0988222008', 'han.do@stationery.vn', 'CASHIER', '2024-05-02', 'ACTIVE', NULL, N'Ca Chiều (14:00 - 22:00)'),
(9, N'Hoàng Gia', N'Bảo', '0988333009', 'bao.hoang@stationery.vn', 'MANAGER', '2023-06-01', 'ACTIVE', NULL, NULL),
(10, N'Lý Thanh', N'Thảo', '0988333010', 'thao.ly@stationery.vn', 'MANAGER', '2023-08-15', 'ACTIVE', NULL, NULL);
SET IDENTITY_INSERT dbo.employee OFF;
GO

-- 3.7. Sản phẩm văn phòng phẩm (30 sản phẩm: 4 cũ + 26 mới)
SET IDENTITY_INSERT dbo.product ON;
INSERT INTO dbo.product (product_id, sku, barcode, product_name, specification, sale_price, reorder_level, status, description, category_id, brand_id, unit_id) VALUES
(1, 'SKU-TL-001', '8935001800011', N'Bút bi Thiên Long TL-027 Xanh', N'Hộp 20 cây, ngòi 0.5mm', 90000, 20, 'ACTIVE', N'Bút bi truyền thống mực xanh viết trơn êm', 1, 1, 2),
(2, 'SKU-TL-002', '8935001800028', N'Bút gel Thiên Long Gel-08 Đen', N'Hộp 10 cây, ngòi 0.5mm', 85000, 15, 'ACTIVE', N'Bút gel mực nước đậm đều màu', 1, 1, 2),
(3, 'SKU-TL-003', '8935001800035', N'Bút lông bảng Thiên Long WB-03 Xanh', N'Hộp 12 cây', 108000, 15, 'ACTIVE', N'Bút viết bảng trắng dễ xóa không để lại bóng mực', 1, 1, 2),
(4, 'SKU-TL-004', '8935001800042', N'Bút dạ quang Thiên Long HL-03 Vàng', N'Hộp 10 cây, 2 đầu', 95000, 15, 'ACTIVE', N'Bút nhớ dòng màu vàng tươi sáng', 1, 1, 2),
(5, 'SKU-PT-001', '8935001800059', N'Bút ký cao cấp Pentel EnerGel BLN75', N'Cây, ngòi 0.5mm', 42000, 25, 'ACTIVE', N'Bút gel ký tên khô nhanh không lem', 1, 5, 1),
(6, 'SKU-PT-002', '8935001800066', N'Bút chì bấm Pentel Fiesta AX105', N'Cây, ngòi 0.5mm', 25000, 30, 'ACTIVE', N'Bút chì kim thân nhựa bền đẹp', 1, 5, 1),
(7, 'SKU-DL-001', '8935001800073', N'Bút chì gỗ Deli 2B Có Tẩy', N'Hộp 12 cây', 48000, 20, 'ACTIVE', N'Bút chì gỗ 2B chuyên dụng viết và tô trắc nghiệm', 1, 4, 2),
(8, 'SKU-DA-001', '8935001800080', N'Giấy in văn phòng Double A A4 80gsm', N'Ream 500 tờ', 92000, 40, 'ACTIVE', N'Giấy in A4 độ trắng cao chống kẹt giấy', 2, 2, 3),
(9, 'SKU-DA-002', '8935001800097', N'Giấy in văn phòng Double A A4 70gsm', N'Ream 500 tờ', 82000, 40, 'ACTIVE', N'Giấy in A4 70gsm tiết kiệm chi phí văn phòng', 2, 2, 3),
(10, 'SKU-IK-001', '8935001800103', N'Giấy in IK Plus A4 70gsm', N'Ream 500 tờ', 78000, 40, 'ACTIVE', N'Giấy in nhập khẩu Indonesia láng mịn', 2, 8, 3),
(11, 'SKU-IK-002', '8935001800110', N'Giấy in IK Plus A5 70gsm', N'Ream 500 tờ', 42000, 25, 'ACTIVE', N'Giấy in khổ A5 dùng in phiếu thu chi hóa đơn', 2, 8, 3),
(12, 'SKU-HH-001', '8935001800127', N'Sổ lò xo Hồng Hà B5 120 trang', N'Cuốn, định lượng 70gsm', 28000, 30, 'ACTIVE', N'Sổ lò xo ghi chép cuộc họp tiện lợi', 2, 10, 4),
(13, 'SKU-HH-002', '8935001800134', N'Sổ bìa da Hồng Hà A5 200 trang', N'Cuốn bìa cứng', 55000, 20, 'ACTIVE', N'Sổ tay bìa da sang trọng cho nhân viên văn phòng', 2, 10, 4),
(14, 'SKU-PL-001', '8935001800141', N'Giấy ghi chú Plus 3x3 inch Vàng', N'Xấp 100 tờ', 15000, 50, 'ACTIVE', N'Giấy note tự dính bám chắc dễ bóc', 2, 3, 6),
(15, 'SKU-KJ-001', '8935001800158', N'Bìa còng King Jim A4 5F (5cm)', N'Cái, bìa simili xanh', 65000, 25, 'ACTIVE', N'Bìa còng bật lưu trữ tới 500 tờ A4', 3, 6, 5),
(16, 'SKU-KJ-002', '8935001800165', N'Bìa còng King Jim A4 7F (7cm)', N'Cái, bìa simili xanh', 68000, 25, 'ACTIVE', N'Bìa còng lớn lưu trữ chứng từ kế toán', 3, 6, 5),
(17, 'SKU-TL-005', '8935001800172', N'Bìa nút Thiên Long FO-CBF01 A4', N'Xấp 12 cái, nhựa trong', 42000, 30, 'ACTIVE', N'Bìa nút nhựa PP bền dẻo đựng tài liệu', 3, 1, 6),
(18, 'SKU-TL-006', '8935001800189', N'Bìa lá Thiên Long FO-CH01 A4', N'Xấp 12 cái', 36000, 30, 'ACTIVE', N'Bìa lá trong suốt kẹp nhanh hồ sơ', 3, 1, 6),
(19, 'SKU-KK-001', '8935001800196', N'Bìa trình ký đơn Kokuyo A4', N'Cái, nhựa cứng cao cấp', 45000, 20, 'ACTIVE', N'Bìa trình ký kẹp inox chắc chắn', 3, 9, 5),
(20, 'SKU-DL-002', '8935001800202', N'Khay kệ hồ sơ 3 tầng Deli 9181', N'Cái, lưới sắt sơn tĩnh điện', 145000, 10, 'ACTIVE', N'Kệ tài liệu 3 tầng để bàn gọn gàng', 3, 4, 5),
(21, 'SKU-PL-002', '8935001800219', N'Bấm kim số 10 Plus ST-010E', N'Cái, kèm gỡ kim', 38000, 25, 'ACTIVE', N'Bấm kim trợ lực nhẹ nhàng bấm tối đa 20 tờ', 4, 3, 5),
(22, 'SKU-PL-003', '8935001800226', N'Kim bấm số 10 Plus', N'Hộp lớn 20 hộp nhỏ', 60000, 20, 'ACTIVE', N'Kim bấm thép không gỉ sắc bén', 4, 3, 2),
(23, 'SKU-DL-003', '8935001800233', N'Kẹp bướm Deli 19mm (Hộp 12 cái)', N'Hộp 12 cái', 16000, 40, 'ACTIVE', N'Kẹp sắt đàn hồi tốt giữ chặt giấy tờ', 4, 4, 2),
(24, 'SKU-DL-004', '8935001800240', N'Kéo văn phòng Deli 6027 (170mm)', N'Cái, lưỡi thép không gỉ', 26000, 25, 'ACTIVE', N'Kéo cắt giấy sắc bén tay cầm êm', 4, 4, 5),
(25, 'SKU-PL-004', '8935001800257', N'Băng xóa kéo Plus WH-605 (5mm x 6m)', N'Cái', 29000, 30, 'ACTIVE', N'Bút xóa kéo đè lên viết ngay không lem', 4, 3, 5),
(26, 'SKU-DL-005', '8935001800264', N'Dao rọc giấy Deli 2034 Lưỡi 9mm', N'Cái, khóa tự động', 18000, 30, 'ACTIVE', N'Dao rọc giấy nhỏ gọn an toàn', 4, 4, 5),
(27, 'SKU-TL-007', '8935001800271', N'Băng keo trong văn phòng 1.8cm', N'Cuộn nhỏ', 8000, 50, 'ACTIVE', N'Băng keo dán giấy trong suốt độ dính cao', 4, 1, 7),
(28, 'SKU-CS-001', '8935001800288', N'Máy tính để bàn Casio AX-120B (12 số)', N'Cái, màn hình nghiêng', 295000, 10, 'ACTIVE', N'Máy tính văn phòng kế toán chính hãng', 5, 7, 5),
(29, 'SKU-DL-006', '8935001800295', N'Máy bấm lỗ giấy Deli 0102 (12 tờ)', N'Cái, 2 lỗ tiêu chuẩn', 52000, 15, 'ACTIVE', N'Đục lỗ giấy lưu bìa còng chính xác', 5, 4, 5),
(30, 'SKU-KK-002', '8935001800301', N'Hộp cắm bút để bàn Kokuyo Đa Năng', N'Cái, nhựa ABS', 75000, 15, 'ACTIVE', N'Ống cắm bút chia ngăn tiện lợi', 5, 9, 5);
SET IDENTITY_INSERT dbo.product OFF;
GO

-- 3.8. Tồn kho (30 bản ghi 1:1 với 30 sản phẩm, số lượng tồn đồng bộ với 80 biến động kho bên dưới)
SET IDENTITY_INSERT dbo.inventory ON;
INSERT INTO dbo.inventory (inventory_id, product_id, quantity_on_hand, last_updated) VALUES
(1, 1, 168, '2026-10-30 18:00:00'),
(2, 2, 151, '2026-10-30 18:00:00'),
(3, 3, 120, '2026-10-30 18:00:00'),
(4, 4, 142, '2026-10-30 18:00:00'),
(5, 5, 80, '2026-10-30 18:00:00'),
(6, 6, 107, '2026-10-30 18:00:00'),
(7, 7, 88, '2026-10-30 18:00:00'),
(8, 8, 216, '2026-10-30 18:00:00'),
(9, 9, 209, '2026-10-30 18:00:00'),
(10, 10, 201, '2026-10-30 18:00:00'),
(11, 11, 98, '2026-10-30 18:00:00'),
(12, 12, 92, '2026-10-30 18:00:00'),
(13, 13, 75, '2026-10-30 18:00:00'),
(14, 14, 220, '2026-10-30 18:00:00'),
(15, 15, 119, '2026-10-30 18:00:00'),
(16, 16, 70, '2026-10-30 18:00:00'),
(17, 17, 88, '2026-10-30 18:00:00'),
(18, 18, 85, '2026-10-30 18:00:00'),
(19, 19, 67, '2026-10-30 18:00:00'),
(20, 20, 46, '2026-10-30 18:00:00'),
(21, 21, 83, '2026-10-30 18:00:00'),
(22, 22, 87, '2026-10-30 18:00:00'),
(23, 23, 185, '2026-10-30 18:00:00'),
(24, 24, 82, '2026-10-30 18:00:00'),
(25, 25, 98, '2026-10-30 18:00:00'),
(26, 26, 108, '2026-10-30 18:00:00'),
(27, 27, 180, '2026-10-30 18:00:00'),
(28, 28, 43, '2026-10-30 18:00:00'),
(29, 29, 59, '2026-10-30 18:00:00'),
(30, 30, 55, '2026-10-30 18:00:00');
SET IDENTITY_INSERT dbo.inventory OFF;
GO

-- 3.9. Phiếu nhập kho (10 phiếu: 1 cũ + 9 mới)
SET IDENTITY_INSERT dbo.purchase_receipt ON;
INSERT INTO dbo.purchase_receipt (purchase_id, purchase_date, status, note, supplier_id, created_by) VALUES
(1, '2026-10-01 08:30:00', 'CONFIRMED', N'Nhập lô bút Thiên Long đầu tháng 10', 1, 1),
(2, '2026-10-03 09:15:00', 'CONFIRMED', N'Nhập giấy in Double A và IK Plus', 3, 2),
(3, '2026-10-06 10:00:00', 'CONFIRMED', N'Nhập văn phòng phẩm Plus và King Jim', 2, 3),
(4, '2026-10-09 14:20:00', 'CONFIRMED', N'Nhập dụng cụ văn phòng Deli đợt 1', 4, 1),
(5, '2026-10-12 08:45:00', 'CONFIRMED', N'Nhập thiết bị Casio, bút ký Pentel và Kokuyo', 5, 4),
(6, '2026-10-15 11:10:00', 'CONFIRMED', N'Nhập sổ tập Hồng Hà và giấy in A5', 3, 2),
(7, '2026-10-18 15:30:00', 'CONFIRMED', N'Nhập bổ sung bìa hồ sơ Thiên Long', 1, 3),
(8, '2026-10-21 09:00:00', 'CONFIRMED', N'Nhập bổ sung bấm kim, xóa kéo Plus', 2, 1),
(9, '2026-10-25 13:45:00', 'CONFIRMED', N'Nhập khay kệ hồ sơ và máy bấm lỗ Deli', 4, 4),
(10, '2026-10-28 16:00:00', 'CONFIRMED', N'Nhập bổ sung giấy in và bút viết cuối tháng', 1, 2);
SET IDENTITY_INSERT dbo.purchase_receipt OFF;
GO

-- 3.10. Chi tiết phiếu nhập (40 dòng: mỗi phiếu nhập có từ 3 đến 5 dòng chi tiết)
INSERT INTO dbo.purchase_detail (purchase_id, product_id, quantity, unit_price) VALUES
(1, 1, 120, 68000),
(1, 2, 100, 62000),
(1, 3, 80, 80000),
(1, 4, 90, 70000),
(1, 27, 200, 5000),
(2, 8, 150, 75000),
(2, 9, 150, 66000),
(2, 10, 120, 62000),
(2, 11, 100, 32000),
(2, 12, 110, 20000),
(3, 14, 160, 10000),
(3, 15, 80, 48000),
(3, 16, 80, 50000),
(3, 21, 90, 27000),
(4, 7, 100, 34000),
(4, 23, 140, 11000),
(4, 24, 90, 18000),
(4, 26, 110, 12000),
(5, 5, 90, 30000),
(5, 6, 110, 18000),
(5, 19, 75, 32000),
(5, 28, 45, 225000),
(6, 13, 85, 40000),
(6, 30, 60, 52000),
(6, 8, 80, 75000),
(6, 10, 80, 62000),
(7, 17, 100, 30000),
(7, 18, 100, 26000),
(7, 1, 60, 68000),
(7, 2, 60, 62000),
(8, 22, 95, 44000),
(8, 25, 110, 20000),
(8, 14, 80, 10000),
(8, 15, 50, 48000),
(9, 20, 50, 105000),
(9, 29, 65, 37000),
(9, 23, 60, 11000),
(10, 3, 50, 80000),
(10, 4, 50, 70000),
(10, 9, 70, 66000);
GO

-- 3.11. Hóa đơn bán hàng (10 hóa đơn: 1 cũ + 9 mới)
SET IDENTITY_INSERT dbo.sales_invoice ON;
INSERT INTO dbo.sales_invoice (invoice_id, created_at, status, payment_method, discount, customer_id, cashier_id) VALUES
(1, '2026-10-02 10:15:00', 'CONFIRMED', N'CASH', 0, 1, 5),
(2, '2026-10-04 14:30:00', 'CONFIRMED', N'BANK_TRANSFER', 15000, 2, 6),
(3, '2026-10-07 09:45:00', 'CONFIRMED', N'CARD', 10000, 3, 7),
(4, '2026-10-10 16:10:00', 'CONFIRMED', N'CASH', 0, 4, 8),
(5, '2026-10-13 11:20:00', 'CONFIRMED', N'BANK_TRANSFER', 25000, 5, 5),
(6, '2026-10-16 15:05:00', 'CONFIRMED', N'CASH', 0, 6, 6),
(7, '2026-10-19 10:50:00', 'CONFIRMED', N'CARD', 20000, 7, 7),
(8, '2026-10-22 13:40:00', 'CONFIRMED', N'CASH', 5000, 8, 8),
(9, '2026-10-26 17:15:00', 'CONFIRMED', N'BANK_TRANSFER', 30000, 9, 5),
(10, '2026-10-29 09:30:00', 'CONFIRMED', N'CARD', 10000, 10, 6);
SET IDENTITY_INSERT dbo.sales_invoice OFF;
GO

-- 3.12. Chi tiết hóa đơn bán (25 dòng: mỗi hóa đơn có từ 2 đến 3 dòng chi tiết)
INSERT INTO dbo.sales_detail (invoice_id, product_id, quantity, unit_price, line_discount) VALUES
(1, 1, 10, 90000, 0),
(1, 2, 8, 85000, 0),
(1, 27, 15, 8000, 0),
(2, 8, 12, 92000, 10000),
(2, 9, 10, 82000, 5000),
(2, 12, 15, 28000, 0),
(3, 14, 20, 15000, 0),
(3, 15, 10, 65000, 5000),
(3, 21, 6, 38000, 0),
(4, 7, 12, 48000, 0),
(4, 23, 15, 16000, 0),
(4, 24, 8, 26000, 0),
(5, 5, 10, 42000, 5000),
(5, 28, 3, 295000, 15000),
(5, 19, 8, 45000, 0),
(6, 13, 10, 55000, 0),
(6, 30, 5, 75000, 0),
(7, 17, 15, 42000, 0),
(7, 18, 15, 36000, 0),
(8, 22, 8, 60000, 0),
(8, 25, 12, 29000, 0),
(9, 20, 4, 145000, 10000),
(9, 29, 6, 52000, 0),
(10, 3, 10, 108000, 0),
(10, 16, 10, 68000, 5000);
GO

-- 3.13. Biến động kho (80 bản ghi: 5 cũ + 75 mới, gồm 40 IN, 25 OUT, 15 ADJUST)
SET IDENTITY_INSERT dbo.stock_movement ON;
INSERT INTO dbo.stock_movement (movement_id, product_id, movement_type, quantity_change, created_at, note, purchase_id, invoice_id, adjusted_by) VALUES
(1, 1, 'IN', 120, '2026-10-01 08:30:00', N'Nhập kho theo phiếu nhập #1', 1, NULL, NULL),
(2, 2, 'IN', 100, '2026-10-01 08:30:00', N'Nhập kho theo phiếu nhập #1', 1, NULL, NULL),
(3, 3, 'IN', 80, '2026-10-01 08:30:00', N'Nhập kho theo phiếu nhập #1', 1, NULL, NULL),
(4, 4, 'IN', 90, '2026-10-01 08:30:00', N'Nhập kho theo phiếu nhập #1', 1, NULL, NULL),
(5, 27, 'IN', 200, '2026-10-01 08:30:00', N'Nhập kho theo phiếu nhập #1', 1, NULL, NULL),
(6, 8, 'IN', 150, '2026-10-03 09:15:00', N'Nhập kho theo phiếu nhập #2', 2, NULL, NULL),
(7, 9, 'IN', 150, '2026-10-03 09:15:00', N'Nhập kho theo phiếu nhập #2', 2, NULL, NULL),
(8, 10, 'IN', 120, '2026-10-03 09:15:00', N'Nhập kho theo phiếu nhập #2', 2, NULL, NULL),
(9, 11, 'IN', 100, '2026-10-03 09:15:00', N'Nhập kho theo phiếu nhập #2', 2, NULL, NULL),
(10, 12, 'IN', 110, '2026-10-03 09:15:00', N'Nhập kho theo phiếu nhập #2', 2, NULL, NULL),
(11, 14, 'IN', 160, '2026-10-06 10:00:00', N'Nhập kho theo phiếu nhập #3', 3, NULL, NULL),
(12, 15, 'IN', 80, '2026-10-06 10:00:00', N'Nhập kho theo phiếu nhập #3', 3, NULL, NULL),
(13, 16, 'IN', 80, '2026-10-06 10:00:00', N'Nhập kho theo phiếu nhập #3', 3, NULL, NULL),
(14, 21, 'IN', 90, '2026-10-06 10:00:00', N'Nhập kho theo phiếu nhập #3', 3, NULL, NULL),
(15, 7, 'IN', 100, '2026-10-09 14:20:00', N'Nhập kho theo phiếu nhập #4', 4, NULL, NULL),
(16, 23, 'IN', 140, '2026-10-09 14:20:00', N'Nhập kho theo phiếu nhập #4', 4, NULL, NULL),
(17, 24, 'IN', 90, '2026-10-09 14:20:00', N'Nhập kho theo phiếu nhập #4', 4, NULL, NULL),
(18, 26, 'IN', 110, '2026-10-09 14:20:00', N'Nhập kho theo phiếu nhập #4', 4, NULL, NULL),
(19, 5, 'IN', 90, '2026-10-12 08:45:00', N'Nhập kho theo phiếu nhập #5', 5, NULL, NULL),
(20, 6, 'IN', 110, '2026-10-12 08:45:00', N'Nhập kho theo phiếu nhập #5', 5, NULL, NULL),
(21, 19, 'IN', 75, '2026-10-12 08:45:00', N'Nhập kho theo phiếu nhập #5', 5, NULL, NULL),
(22, 28, 'IN', 45, '2026-10-12 08:45:00', N'Nhập kho theo phiếu nhập #5', 5, NULL, NULL),
(23, 13, 'IN', 85, '2026-10-15 11:10:00', N'Nhập kho theo phiếu nhập #6', 6, NULL, NULL),
(24, 30, 'IN', 60, '2026-10-15 11:10:00', N'Nhập kho theo phiếu nhập #6', 6, NULL, NULL),
(25, 8, 'IN', 80, '2026-10-15 11:10:00', N'Nhập kho theo phiếu nhập #6', 6, NULL, NULL),
(26, 10, 'IN', 80, '2026-10-15 11:10:00', N'Nhập kho theo phiếu nhập #6', 6, NULL, NULL),
(27, 17, 'IN', 100, '2026-10-18 15:30:00', N'Nhập kho theo phiếu nhập #7', 7, NULL, NULL),
(28, 18, 'IN', 100, '2026-10-18 15:30:00', N'Nhập kho theo phiếu nhập #7', 7, NULL, NULL),
(29, 1, 'IN', 60, '2026-10-18 15:30:00', N'Nhập kho theo phiếu nhập #7', 7, NULL, NULL),
(30, 2, 'IN', 60, '2026-10-18 15:30:00', N'Nhập kho theo phiếu nhập #7', 7, NULL, NULL),
(31, 22, 'IN', 95, '2026-10-21 09:00:00', N'Nhập kho theo phiếu nhập #8', 8, NULL, NULL),
(32, 25, 'IN', 110, '2026-10-21 09:00:00', N'Nhập kho theo phiếu nhập #8', 8, NULL, NULL),
(33, 14, 'IN', 80, '2026-10-21 09:00:00', N'Nhập kho theo phiếu nhập #8', 8, NULL, NULL),
(34, 15, 'IN', 50, '2026-10-21 09:00:00', N'Nhập kho theo phiếu nhập #8', 8, NULL, NULL),
(35, 20, 'IN', 50, '2026-10-25 13:45:00', N'Nhập kho theo phiếu nhập #9', 9, NULL, NULL),
(36, 29, 'IN', 65, '2026-10-25 13:45:00', N'Nhập kho theo phiếu nhập #9', 9, NULL, NULL),
(37, 23, 'IN', 60, '2026-10-25 13:45:00', N'Nhập kho theo phiếu nhập #9', 9, NULL, NULL),
(38, 3, 'IN', 50, '2026-10-28 16:00:00', N'Nhập kho theo phiếu nhập #10', 10, NULL, NULL),
(39, 4, 'IN', 50, '2026-10-28 16:00:00', N'Nhập kho theo phiếu nhập #10', 10, NULL, NULL),
(40, 9, 'IN', 70, '2026-10-28 16:00:00', N'Nhập kho theo phiếu nhập #10', 10, NULL, NULL),
(41, 1, 'OUT', -10, '2026-10-02 10:15:00', N'Xuất bán theo hóa đơn #1', NULL, 1, NULL),
(42, 2, 'OUT', -8, '2026-10-02 10:15:00', N'Xuất bán theo hóa đơn #1', NULL, 1, NULL),
(43, 27, 'OUT', -15, '2026-10-02 10:15:00', N'Xuất bán theo hóa đơn #1', NULL, 1, NULL),
(44, 8, 'OUT', -12, '2026-10-04 14:30:00', N'Xuất bán theo hóa đơn #2', NULL, 2, NULL),
(45, 9, 'OUT', -10, '2026-10-04 14:30:00', N'Xuất bán theo hóa đơn #2', NULL, 2, NULL),
(46, 12, 'OUT', -15, '2026-10-04 14:30:00', N'Xuất bán theo hóa đơn #2', NULL, 2, NULL),
(47, 14, 'OUT', -20, '2026-10-07 09:45:00', N'Xuất bán theo hóa đơn #3', NULL, 3, NULL),
(48, 15, 'OUT', -10, '2026-10-07 09:45:00', N'Xuất bán theo hóa đơn #3', NULL, 3, NULL),
(49, 21, 'OUT', -6, '2026-10-07 09:45:00', N'Xuất bán theo hóa đơn #3', NULL, 3, NULL),
(50, 7, 'OUT', -12, '2026-10-10 16:10:00', N'Xuất bán theo hóa đơn #4', NULL, 4, NULL),
(51, 23, 'OUT', -15, '2026-10-10 16:10:00', N'Xuất bán theo hóa đơn #4', NULL, 4, NULL),
(52, 24, 'OUT', -8, '2026-10-10 16:10:00', N'Xuất bán theo hóa đơn #4', NULL, 4, NULL),
(53, 5, 'OUT', -10, '2026-10-13 11:20:00', N'Xuất bán theo hóa đơn #5', NULL, 5, NULL),
(54, 28, 'OUT', -3, '2026-10-13 11:20:00', N'Xuất bán theo hóa đơn #5', NULL, 5, NULL),
(55, 19, 'OUT', -8, '2026-10-13 11:20:00', N'Xuất bán theo hóa đơn #5', NULL, 5, NULL),
(56, 13, 'OUT', -10, '2026-10-16 15:05:00', N'Xuất bán theo hóa đơn #6', NULL, 6, NULL),
(57, 30, 'OUT', -5, '2026-10-16 15:05:00', N'Xuất bán theo hóa đơn #6', NULL, 6, NULL),
(58, 17, 'OUT', -15, '2026-10-19 10:50:00', N'Xuất bán theo hóa đơn #7', NULL, 7, NULL),
(59, 18, 'OUT', -15, '2026-10-19 10:50:00', N'Xuất bán theo hóa đơn #7', NULL, 7, NULL),
(60, 22, 'OUT', -8, '2026-10-22 13:40:00', N'Xuất bán theo hóa đơn #8', NULL, 8, NULL),
(61, 25, 'OUT', -12, '2026-10-22 13:40:00', N'Xuất bán theo hóa đơn #8', NULL, 8, NULL),
(62, 20, 'OUT', -4, '2026-10-26 17:15:00', N'Xuất bán theo hóa đơn #9', NULL, 9, NULL),
(63, 29, 'OUT', -6, '2026-10-26 17:15:00', N'Xuất bán theo hóa đơn #9', NULL, 9, NULL),
(64, 3, 'OUT', -10, '2026-10-29 09:30:00', N'Xuất bán theo hóa đơn #10', NULL, 10, NULL),
(65, 16, 'OUT', -10, '2026-10-29 09:30:00', N'Xuất bán theo hóa đơn #10', NULL, 10, NULL),
(66, 1, 'ADJUST', -2, '2026-10-05 17:00:00', N'Kiểm kê định kỳ: hao hụt 2 hộp bút bi do móp vỏ hộp', NULL, NULL, 1),
(67, 2, 'ADJUST', -1, '2026-10-05 17:10:00', N'Kiểm kê định kỳ: xuất mẫu thử tại quầy 1 hộp bút gel', NULL, NULL, 1),
(68, 4, 'ADJUST', 2, '2026-10-08 17:00:00', N'Kiểm kê định kỳ: thừa 2 hộp bút dạ quang so với sổ sách', NULL, NULL, 1),
(69, 6, 'ADJUST', -3, '2026-10-11 17:00:00', N'Kiểm kê định kỳ: loại bỏ 3 cây bút chì bấm gãy ngòi', NULL, NULL, 1),
(70, 8, 'ADJUST', -2, '2026-10-14 17:00:00', N'Kiểm kê định kỳ: rách bao bì 2 ream giấy Double A A4 80gsm', NULL, NULL, 2),
(71, 9, 'ADJUST', -1, '2026-10-14 17:15:00', N'Kiểm kê định kỳ: xuất nội bộ văn phòng dùng 1 ream giấy A4 70gsm', NULL, NULL, 2),
(72, 10, 'ADJUST', 1, '2026-10-17 17:00:00', N'Kiểm kê định kỳ: điều chỉnh tăng 1 ream giấy IK Plus A4', NULL, NULL, 2),
(73, 11, 'ADJUST', -2, '2026-10-17 17:20:00', N'Kiểm kê định kỳ: xuất quầy thu ngân in hóa đơn 2 ream A5', NULL, NULL, 2),
(74, 12, 'ADJUST', -3, '2026-10-20 17:00:00', N'Kiểm kê định kỳ: cong lò xo 3 cuốn sổ B5 khi vận chuyển', NULL, NULL, 2),
(75, 15, 'ADJUST', -1, '2026-10-23 17:00:00', N'Kiểm kê định kỳ: hỏng còng 1 bìa King Jim 5F', NULL, NULL, 3),
(76, 17, 'ADJUST', 3, '2026-10-23 17:15:00', N'Kiểm kê định kỳ: kiểm đếm thực tế dư 3 xấp bìa nút A4', NULL, NULL, 3),
(77, 21, 'ADJUST', -1, '2026-10-27 17:00:00', N'Kiểm kê định kỳ: xuất 1 bấm kim Plus dùng tại kho', NULL, NULL, 3),
(78, 26, 'ADJUST', -2, '2026-10-27 17:15:00', N'Kiểm kê định kỳ: xuất 2 dao rọc giấy cho bộ phận đóng gói', NULL, NULL, 4),
(79, 27, 'ADJUST', -5, '2026-10-30 17:00:00', N'Kiểm kê định kỳ: xuất 5 cuộn băng keo dùng dán thùng kho', NULL, NULL, 4),
(80, 28, 'ADJUST', 1, '2026-10-30 17:20:00', N'Kiểm kê định kỳ: đối soát thừa 1 máy tính Casio từ lô khuyến mãi', NULL, NULL, 4);
SET IDENTITY_INSERT dbo.stock_movement OFF;
GO

-- ============================================================================
-- PHẦN 4: MINH HỌA 8 LOẠI TRUY VẤN TRÊN CSDL VĂN PHÒNG PHẨM
-- ============================================================================

-- 1. INSERT (Transaction: Tạo hóa đơn mới + chi tiết + kiểm tra & trừ tồn kho + ghi stock_movement)
-- Minh họa qua Stored Procedure bán hàng nguyên tử:
CREATE OR ALTER PROCEDURE dbo.usp_CreateStationeryInvoice
    @CustomerId INT,
    @CashierId INT,
    @PaymentMethod NVARCHAR(50),
    @Discount DECIMAL(18,2),
    @ProductId INT,
    @Quantity INT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        IF EXISTS (SELECT 1 FROM dbo.inventory WHERE product_id = @ProductId AND quantity_on_hand < @Quantity)
            THROW 50001, N'Số lượng tồn kho văn phòng phẩm không đủ để xuất bán!', 1;

        DECLARE @UnitPrice DECIMAL(18,2) = (SELECT sale_price FROM dbo.product WHERE product_id = @ProductId);

        INSERT INTO dbo.sales_invoice (customer_id, cashier_id, payment_method, discount, status)
        VALUES (@CustomerId, @CashierId, @PaymentMethod, @Discount, 'CONFIRMED');

        DECLARE @NewInvoiceId INT = SCOPE_IDENTITY();

        INSERT INTO dbo.sales_detail (invoice_id, product_id, quantity, unit_price, line_discount)
        VALUES (@NewInvoiceId, @ProductId, @Quantity, @UnitPrice, 0);

        UPDATE dbo.inventory
        SET quantity_on_hand = quantity_on_hand - @Quantity,
            last_updated = SYSDATETIME()
        WHERE product_id = @ProductId;

        INSERT INTO dbo.stock_movement (product_id, movement_type, quantity_change, note, invoice_id)
        VALUES (@ProductId, 'OUT', -@Quantity, N'Xuất bán theo hóa đơn #' + CAST(@NewInvoiceId AS NVARCHAR(20)), @NewInvoiceId);

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- 2. DELETE (Xóa bản ghi chưa phát sinh giao dịch; nếu đã có giao dịch thì chuyển status = 'INACTIVE')
CREATE OR ALTER PROCEDURE dbo.usp_SafeDeleteProduct
    @TargetProductId INT
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS (SELECT 1 FROM dbo.purchase_detail WHERE product_id = @TargetProductId)
       AND NOT EXISTS (SELECT 1 FROM dbo.sales_detail WHERE product_id = @TargetProductId)
       AND NOT EXISTS (SELECT 1 FROM dbo.stock_movement WHERE product_id = @TargetProductId)
    BEGIN
        DELETE FROM dbo.inventory WHERE product_id = @TargetProductId;
        DELETE FROM dbo.product WHERE product_id = @TargetProductId;
    END
    ELSE
    BEGIN
        UPDATE dbo.product SET status = 'INACTIVE' WHERE product_id = @TargetProductId;
    END
END;
GO

-- 3. UPDATE (Đổi giá bán sản phẩm; cập nhật nhà cung cấp; điều chỉnh tồn kho kèm INSERT stock_movement)
-- Minh họa qua Stored Procedure điều chỉnh kiểm kê kho:
CREATE OR ALTER PROCEDURE dbo.usp_AdjustInventory
    @ProductId INT,
    @QuantityChange INT,
    @WarehouseStaffId INT,
    @Reason NVARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        UPDATE dbo.inventory
        SET quantity_on_hand = quantity_on_hand + @QuantityChange,
            last_updated = SYSDATETIME()
        WHERE product_id = @ProductId;

        INSERT INTO dbo.stock_movement (product_id, movement_type, quantity_change, note, adjusted_by)
        VALUES (@ProductId, 'ADJUST', @QuantityChange, @Reason, @WarehouseStaffId);

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- 4. ĐIỀU KIỆN ĐƠN: Tìm văn phòng phẩm theo SKU hoặc mã vạch
SELECT product_id, sku, barcode, product_name, specification, sale_price, status
FROM dbo.product
WHERE sku = 'SKU-TL-001' OR barcode = '8935001800080';
GO

-- 5. ĐIỀU KIỆN KẾT HỢP: Lọc sản phẩm thuộc danh mục 'Giấy in & Sổ tập' (category_id = 2), giá từ 20,000 đến 95,000 và tồn kho > 0
SELECT
    p.product_id,
    p.sku,
    p.product_name,
    c.category_name,
    b.brand_name,
    p.sale_price,
    i.quantity_on_hand
FROM dbo.product p
INNER JOIN dbo.category c ON p.category_id = c.category_id
LEFT JOIN dbo.brand b ON p.brand_id = b.brand_id
INNER JOIN dbo.inventory i ON p.product_id = i.product_id
WHERE p.category_id = 2
  AND p.sale_price BETWEEN 20000 AND 95000
  AND i.quantity_on_hand > 0;
GO

-- 6. JOIN: Xem chi tiết các hóa đơn bán văn phòng phẩm
SELECT
    si.invoice_id,
    si.created_at,
    c.full_name AS customer_name,
    e.full_name AS cashier_name,
    p.sku,
    p.product_name,
    sd.quantity,
    sd.unit_price,
    sd.line_discount,
    sd.line_total
FROM dbo.sales_invoice si
INNER JOIN dbo.sales_detail sd ON si.invoice_id = sd.invoice_id
INNER JOIN dbo.product p ON sd.product_id = p.product_id
LEFT JOIN dbo.customer c ON si.customer_id = c.customer_id
INNER JOIN dbo.employee e ON si.cashier_id = e.employee_id
ORDER BY si.invoice_id, p.product_id;
GO

-- 7. SUBQUERY: Danh sách văn phòng phẩm có giá bán cao hơn mức giá trung bình của toàn cửa hàng
SELECT
    product_id,
    sku,
    product_name,
    sale_price
FROM dbo.product
WHERE sale_price > (SELECT AVG(sale_price) FROM dbo.product)
ORDER BY sale_price DESC;
GO

-- 8. AGGREGATE: Thống kê doanh thu theo ngày, số lượng sản phẩm và tổng tồn kho theo danh mục
SELECT
    CAST(si.created_at AS DATE) AS sales_date,
    COUNT(DISTINCT si.invoice_id) AS total_invoices,
    SUM(sd.quantity) AS total_items_sold,
    SUM(sd.line_total) - SUM(si.discount) /* lưu ý: dùng CTE theo invoice_id ở FR10 */ AS net_revenue
FROM dbo.sales_invoice si
INNER JOIN dbo.sales_detail sd ON si.invoice_id = sd.invoice_id
WHERE si.status = 'CONFIRMED'
GROUP BY CAST(si.created_at AS DATE)
ORDER BY sales_date;

SELECT
    c.category_name,
    COUNT(p.product_id) AS total_products,
    ISNULL(SUM(i.quantity_on_hand), 0) AS total_stock_units
FROM dbo.category c
LEFT JOIN dbo.product p ON c.category_id = p.category_id
LEFT JOIN dbo.inventory i ON p.product_id = i.product_id
GROUP BY c.category_name;
GO