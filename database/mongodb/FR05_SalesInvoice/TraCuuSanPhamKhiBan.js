// ============================================================================
// [FR05 - 1] Tra cứu nhanh sản phẩm còn hàng khi thu ngân quét mã hoặc gõ tên tại quầy POS
// Tương đương file: MSSQL/FR05_SalesInvoice/TraCuuSanPhamKhiBan.sql
// ============================================================================
db = db.getSiblingDB("StationeryStoreDB");

db.products.aggregate([
  {
    $match: {
      status: "ACTIVE",
      $or: [
        { barcode: "8935001800011" },
        { sku: "SKU-TL-001" },
        { productName: { $regex: "Thiên Long", $options: "i" } }
      ]
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
  {
    $project: {
      _id: 0,
      product_id: "$_id",
      sku: 1,
      barcode: 1,
      product_name: "$productName",
      unit_name: "$unitName",
      sale_price: "$salePrice",
      quantity_on_hand: "$inv.quantityOnHand"
    }
  }
]);
