// ============================================================================
// [FR08 - 2] LOẠI TRUY VẤN AGGREGATE: Thống kê tổng số mặt hàng, tổng lượng tồn và tổng giá trị tồn kho theo Danh mục
// Tương đương file: MSSQL/FR08_InventoryMonitoring/AggregateTongMatHang&TongTonKho&TongGiaTriTonKho.sql
// Đã sửa lỗi: dùng $isNumber thay vì $ifNull(..., false) để không bỏ sót sản phẩm hết hàng (quantityOnHand = 0).
// ============================================================================
db = db.getSiblingDB("StationeryStoreDB");

db.categories.aggregate([
  {
    $lookup: {
      from: "products",
      localField: "_id",
      foreignField: "categoryId",
      as: "prods"
    }
  },
  { $unwind: { path: "$prods", preserveNullAndEmptyArrays: true } },
  {
    $lookup: {
      from: "inventories",
      localField: "prods._id",
      foreignField: "productId",
      as: "inv"
    }
  },
  { $unwind: { path: "$inv", preserveNullAndEmptyArrays: true } },
  {
    $group: {
      _id: "$_id",
      category_name: { $first: "$categoryName" },
      total_products: {
        $sum: { $cond: [{ $isNumber: "$prods._id" }, 1, 0] }
      },
      total_stock_units: { $sum: { $ifNull: ["$inv.quantityOnHand", 0] } },
      total_stock_value: {
        $sum: {
          $multiply: [
            { $ifNull: ["$inv.quantityOnHand", 0] },
            { $ifNull: ["$prods.salePrice", 0] }
          ]
        }
      },
      low_or_out_of_stock_count: {
        $sum: {
          $cond: [
            {
              $and: [
                { $isNumber: "$inv.quantityOnHand" },
                { $lte: ["$inv.quantityOnHand", "$prods.reorderLevel"] }
              ]
            },
            1,
            0
          ]
        }
      }
    }
  },
  {
    $project: {
      _id: 0,
      category_id: "$_id",
      category_name: 1,
      total_products: 1,
      total_stock_units: 1,
      total_stock_value: 1,
      low_or_out_of_stock_count: 1
    }
  },
  { $sort: { total_stock_value: -1 } }
]);
