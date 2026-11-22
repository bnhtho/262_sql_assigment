// ============================================================================
// [FR07 - 1] LOẠI TRUY VẤN ĐIỀU KIỆN ĐƠN: Tìm chính xác sản phẩm theo mã SKU
// Tương đương file: MSSQL/FR07_ProductSearch&Filter/TruyVanDonSanPhamTheoSKU.sql
// ============================================================================
db = db.getSiblingDB("StationeryStoreDB");

db.products.find(
  { sku: "SKU-TL-001" },
  {
    _id: 0,
    product_id: "$_id",
    sku: 1,
    barcode: 1,
    product_name: "$productName",
    specification: 1,
    sale_price: "$salePrice",
    status: 1
  }
);
