// ============================================================================
// [FR08 - 1] Danh sách tồn kho hiện tại kèm trạng thái cảnh báo và giá trị tồn kho
// Tương đương file: MSSQL/FR08_InventoryMonitoring/DanhSachTonKhoKemTrangThaiCanhBao.sql
// ============================================================================
db = db.getSiblingDB("StationeryStoreDB");

db.inventories.aggregate([
  {
    $lookup: {
      from: "products",
      localField: "productId",
      foreignField: "_id",
      as: "prod"
    }
  },
  { $unwind: "$prod" },
  { $sort: { quantityOnHand: 1 } },
  {
    $project: {
      _id: 0,
      product_id: "$prod._id",
      sku: "$prod.sku",
      product_name: "$prod.productName",
      category_name: "$prod.categoryName",
      unit_name: "$prod.unitName",
      quantity_on_hand: "$quantityOnHand",
      reorder_level: "$prod.reorderLevel",
      stock_value: { $multiply: ["$quantityOnHand", "$prod.salePrice"] },
      stock_status: {
        $switch: {
          branches: [
            { case: { $eq: ["$quantityOnHand", 0] }, then: "Hết hàng (Out of Stock)" },
            { case: { $lte: ["$quantityOnHand", "$prod.reorderLevel"] }, then: "Sắp hết (Low Stock)" },
            { case: { $lte: ["$quantityOnHand", { $multiply: ["$prod.reorderLevel", 3] }] }, then: "Cần theo dõi (Watch)" }
          ],
          default: "An toàn (Safe)"
        }
      },
      last_updated: "$lastUpdated"
    }
  }
]);
