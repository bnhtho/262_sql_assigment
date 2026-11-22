// ============================================================================
// [FR04 - 1] LOẠI TRUY VẤN JOIN: Lịch sử phiếu nhập kèm chi tiết mặt hàng
// Tương đương file: MSSQL/FR04_PurchaseReceipt/PurchaseHistory.sql
// Điểm mạnh MongoDB: items[] đã nhúng sẵn snapshot; $lookup sang products lấy thêm giá bán hiện hành.
// ============================================================================
db = db.getSiblingDB("StationeryStoreDB");

db.purchaseReceipts.aggregate([
  { $sort: { purchaseDate: -1, _id: -1 } },
  { $unwind: "$items" },
  {
    $lookup: {
      from: "products",
      localField: "items.productId",
      foreignField: "_id",
      as: "productInfo"
    }
  },
  { $unwind: { path: "$productInfo", preserveNullAndEmptyArrays: true } },
  {
    $project: {
      _id: 0,
      purchase_id: "$_id",
      purchase_date: "$purchaseDate",
      status: 1,
      note: 1,
      supplier_name: "$supplierName",
      created_by: "$createdByName",
      sku: "$items.sku",
      product_name: "$items.productName",
      quantity: "$items.quantity",
      unit_price: "$items.unitPrice",
      line_total: "$items.lineTotal",
      current_sale_price: "$productInfo.salePrice"
    }
  }
]);
