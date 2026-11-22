// ============================================================================
// [FR03 - 1] Danh sách toàn bộ nhà cung cấp văn phòng phẩm
// Tương đương file: MSSQL/FR03_SupplierManagement/DanhSachNhaCungCap.sql
// ============================================================================
db = db.getSiblingDB("StationeryStoreDB");

db.suppliers.find(
  {},
  {
    _id: 0,
    supplier_id: "$_id",
    supplier_name: "$supplierName",
    tax_code: "$taxCode",
    contact_person: "$contactPerson",
    phone: 1,
    email: 1,
    address: 1
  }
).sort({ _id: 1 });
