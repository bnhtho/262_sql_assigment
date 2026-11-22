// ============================================================================
// [FR02 - 1] Danh sách toàn bộ danh mục sản phẩm
// Tương đương file: MSSQL/FR02_CategoryManagement/DanhSachDanhMuc.sql
// ============================================================================
db = db.getSiblingDB("StationeryStoreDB");

db.categories.find(
  {},
  {
    _id: 0,
    category_id: "$_id",
    category_name: "$categoryName",
    description: 1,
    status: 1
  }
).sort({ _id: 1 });
