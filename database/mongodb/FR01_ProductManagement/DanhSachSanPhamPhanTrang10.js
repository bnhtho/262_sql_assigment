// ============================================================================
// [FR01 - 1] Danh sách sản phẩm kèm Giá nhập gần nhất, Giá bán, Lãi gộp & Tồn kho (Phân trang 10 SP)
// Tương đương file: MSSQL/FR01_ProductManagement/DanhSachSanPhamPhanTrang10.sql
// ============================================================================
db = db.getSiblingDB("StationeryStoreDB");

db.products.aggregate([
  { $sort: { _id: 1 } },
  { $skip: 0 },
  { $limit: 10 },
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
            latestImportDate: "$purchaseDate"
          }
        }
      ],
      as: "latestImport"
    }
  },
  { $unwind: { path: "$latestImport", preserveNullAndEmptyArrays: true } },
  {
    $project: {
      _id: 0,
      product_id: "$_id",
      sku: 1,
      barcode: 1,
      product_name: "$productName",
      category_name: "$categoryName",
      brand_name: "$brandName",
      unit_name: "$unitName",
      latest_import_price: "$latestImport.latestImportPrice",
      sale_price: "$salePrice",
      profit_per_unit: { $subtract: ["$salePrice", "$latestImport.latestImportPrice"] },
      quantity_on_hand: "$inv.quantityOnHand",
      status: 1
    }
  }
]);
