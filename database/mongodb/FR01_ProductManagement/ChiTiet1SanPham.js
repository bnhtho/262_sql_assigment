// ============================================================================
// [FR01 - 2] Xem chi tiết đầy đủ của 1 sản phẩm (kèm Giá nhập gần nhất, Giá nhập bình quân & NCC gần nhất)
// Tương đương file: MSSQL/FR01_ProductManagement/ChiTiet1SanPham.sql
// ============================================================================
db = db.getSiblingDB("StationeryStoreDB");

db.products.aggregate([
  { $match: { _id: 1 } },
  {
    $lookup: {
      from: "inventories",
      localField: "_id",
      foreignField: "productId",
      as: "inv"
    }
  },
  { $unwind: { path: "$inv", preserveNullAndEmptyArrays: true } },
  {
    $lookup: {
      from: "purchaseReceipts",
      let: { pid: "$_id" },
      pipeline: [
        { $match: { status: "CONFIRMED", $expr: { $in: ["$$pid", "$items.productId"] } } },
        { $unwind: "$items" },
        { $match: { $expr: { $eq: ["$items.productId", "$$pid"] } } },
        { $sort: { purchaseDate: -1, _id: -1 } },
        { $limit: 1 },
        {
          $project: {
            _id: 0,
            latestImportPrice: "$items.unitPrice",
            latestImportDate: "$purchaseDate",
            lastSupplierName: "$supplierName"
          }
        }
      ],
      as: "impLatest"
    }
  },
  { $unwind: { path: "$impLatest", preserveNullAndEmptyArrays: true } },
  {
    $lookup: {
      from: "purchaseReceipts",
      let: { pid: "$_id" },
      pipeline: [
        { $match: { status: "CONFIRMED", $expr: { $in: ["$$pid", "$items.productId"] } } },
        { $unwind: "$items" },
        { $match: { $expr: { $eq: ["$items.productId", "$$pid"] } } },
        {
          $group: {
            _id: null,
            totalCost: { $sum: "$items.lineTotal" },
            totalQty: { $sum: "$items.quantity" }
          }
        },
        {
          $project: {
            _id: 0,
            avgImportPrice: { $round: [{ $divide: ["$totalCost", "$totalQty"] }, 2] }
          }
        }
      ],
      as: "impAvg"
    }
  },
  { $unwind: { path: "$impAvg", preserveNullAndEmptyArrays: true } },
  {
    $project: {
      _id: 0,
      product_id: "$_id",
      sku: 1,
      barcode: 1,
      product_name: "$productName",
      specification: 1,
      category_name: "$categoryName",
      brand_name: "$brandName",
      brand_origin: "$brandOrigin",
      unit_name: "$unitName",
      latest_import_price: "$impLatest.latestImportPrice",
      avg_import_price: "$impAvg.avgImportPrice",
      sale_price: "$salePrice",
      profit_per_unit: { $subtract: ["$salePrice", "$impLatest.latestImportPrice"] },
      last_supplier_name: "$impLatest.lastSupplierName",
      latest_import_date: "$impLatest.latestImportDate",
      quantity_on_hand: "$inv.quantityOnHand",
      reorder_level: "$reorderLevel",
      status: 1,
      description: 1
    }
  }
]);
