// ============================================================================
// [FR09 - 1] Danh sách khách hàng thành viên (Phân trang 20 khách/trang)
// Tương đương file: MSSQL/FR09_CustomerManagement/DanhSachThanhVienPhanTrang20Khach.sql
// ============================================================================
db = db.getSiblingDB("StationeryStoreDB");

db.customers.find(
  {},
  {
    _id: 0,
    customer_id: "$_id",
    member_code: "$memberCode",
    ho: "$name.ho",
    ten: "$name.ten",
    full_name: "$fullName",
    phone: 1,
    email: 1,
    address: 1
  }
).sort({ _id: 1 }).skip(0).limit(20);
