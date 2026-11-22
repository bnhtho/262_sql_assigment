// ============================================================================
// [FR04 - 2] LOẠI TRUY VẤN AGGREGATE: Thống kê tổng số phiếu nhập, tổng số lượng và tổng tiền nhập theo Nhà cung cấp
// Tương đương file: MSSQL/FR04_PurchaseReceipt/AggregateTongNhapTheoNhaCungCap.sql
// ============================================================================
db = db.getSiblingDB("StationeryStoreDB");

db.suppliers.aggregate([
  {
    $lookup: {
      from: "purchaseReceipts",
      let: { sid: "$_id" },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ["$supplierId", "$$sid"] },
                { $eq: ["$status", "CONFIRMED"] }
              ]
            }
          }
        }
      ],
      as: "receipts"
    }
  },
  {
    $project: {
      _id: 0,
      supplier_id: "$_id",
      supplier_name: "$supplierName",
      total_receipts: { $size: "$receipts" },
      total_items_imported: {
        $sum: {
          $map: {
            input: "$receipts",
            as: "r",
            in: { $sum: "$$r.items.quantity" }
          }
        }
      },
      total_import_amount: { $sum: "$receipts.totalAmount" }
    }
  },
  { $sort: { total_import_amount: -1 } }
]);
