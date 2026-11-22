// ============================================================================
// [FR07 - 2] LOẠI TRUY VẤN ĐIỀU KIỆN KẾT HỢP: Lọc theo Danh mục AND Khoảng giá AND Còn hàng
// Tương đương file: MSSQL/FR07_ProductSearch&Filter/TruyVanKetHopSanPhamTheoDanhMucVaKhoangGiaVaConHang.sql
// Tận dụng Index: IX_product_category_price ({ categoryId: 1, salePrice: 1 })
// ============================================================================
db = db.getSiblingDB("StationeryStoreDB");

db.products.aggregate([
  {
    $match: {
      categoryId: 2,
      salePrice: { $gte: 20000, $lte: 95000 },
      status: "ACTIVE"
    }
  },
  {
    $lookup: {
      from: "inventories",
      localField: "_id",
      foreignField: "productId",
      as: "inv"
    }
  },
  { $unwind: "$inv" },
  { $match: { "inv.quantityOnHand": { $gt: 0 } } },
  { $sort: { salePrice: 1 } },
  {
    $project: {
      _id: 0,
      product_id: "$_id",
      sku: 1,
      product_name: "$productName",
      category_name: "$categoryName",
      brand_name: "$brandName",
      sale_price: "$salePrice",
      quantity_on_hand: "$inv.quantityOnHand"
    }
  }
]);
