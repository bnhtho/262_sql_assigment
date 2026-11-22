// ============================================================================
// [FR01 - 3] LOẠI TRUY VẤN SUBQUERY: Các sản phẩm có giá bán cao hơn giá trung bình toàn cửa hàng (63,433.33đ)
// Tương đương file: MSSQL/FR01_ProductManagement/SubqueryGiaCaoHonTrungBinh.sql
// ============================================================================
db = db.getSiblingDB("StationeryStoreDB");

// Cách 1: Thực hiện trong 1 Aggregation Pipeline duy nhất (Dùng $setWindowFields hoặc $group + $unwind)
db.products.aggregate([
  {
    $group: {
      _id: null,
      store_avg_price: { $avg: "$salePrice" },
      products: { $push: "$$ROOT" }
    }
  },
  { $unwind: "$products" },
  {
    $match: {
      $expr: { $gt: ["$products.salePrice", "$store_avg_price"] }
    }
  },
  { $sort: { "products.salePrice": -1 } },
  {
    $project: {
      _id: 0,
      product_id: "$products._id",
      sku: "$products.sku",
      product_name: "$products.productName",
      category_name: "$products.categoryName",
      sale_price: "$products.salePrice",
      store_avg_price: { $round: ["$store_avg_price", 2] }
    }
  }
]);
