// ============================================================================
// BỘ ĐIỀU KHIỂN CHẠY NHANH 18 TRUY VẤN MONGODB (FR01 -> FR10)
// Cách dùng:
//   1. Mở MongoDB Compass -> mở cửa sổ >_MONGOSH
//   2. Gõ: load("ĐƯỜNG_DẪN_TỚI_FILE/quick_runner.js")
//      (Hoặc copy-paste file này vào >_MONGOSH đúng 1 lần duy nhất)
//   3. Gõ menu() để xem danh sách lệnh, hoặc gõ trực tiếp:
//      fr01_1(), fr01_2(), fr01_3(), fr04_1(), fr06_2(), fr10_1()...
// ============================================================================

db = db.getSiblingDB("StationeryStoreDB");

function menu() {
  print("\n================ DANH SÁCH LỆNH CHẠY NHANH (MONGODB) ================");
  print("  fr01_1() : [FR01] Danh sách sản phẩm + Giá nhập + Lãi gộp (Phân trang 10)");
  print("  fr01_2() : [FR01] Chi tiết 1 sản phẩm (kèm Giá nhập mới nhất & bình quân)");
  print("  fr01_3() : [FR01 - SUBQUERY] Sản phẩm có giá bán cao hơn trung bình");
  print("  fr02_1() : [FR02] Danh sách danh mục văn phòng phẩm");
  print("  fr03_1() : [FR03] Danh sách nhà cung cấp");
  print("  fr04_1() : [FR04 - JOIN] Lịch sử phiếu nhập kho chi tiết");
  print("  fr04_2() : [FR04 - AGGREGATE] Tổng nhập theo từng nhà cung cấp");
  print("  fr05_1() : [FR05] Tra cứu nhanh sản phẩm khi bán tại quầy POS");
  print("  fr06_1() : [FR06 - KẾT HỢP] Tra cứu hóa đơn theo ngày & PTTT (Thẻ/CK)");
  print("  fr06_2() : [FR06 - JOIN] Lịch sử chi tiết hóa đơn bán hàng");
  print("  fr06_3() : [FR06 - SUBQUERY] Hóa đơn có tổng tiền cao hơn trung bình");
  print("  fr07_1() : [FR07 - ĐƠN] Tìm sản phẩm theo mã SKU ('SKU-TL-001')");
  print("  fr07_2() : [FR07 - KẾT HỢP] Lọc SP theo Danh mục 2 + Giá 20k-95k + Còn hàng");
  print("  fr08_1() : [FR08] Danh sách tồn kho kèm trạng thái cảnh báo");
  print("  fr08_2() : [FR08 - AGGREGATE] Thống kê tổng mặt hàng, tổng tồn & giá trị tồn");
  print("  fr09_1() : [FR09] Danh sách khách hàng VIP (Phân trang 20 khách)");
  print("  fr10_1() : [FR10 - AGGREGATE] Báo cáo doanh thu theo từng ngày");
  print("  fr10_2() : [FR10 - AGGREGATE] Báo cáo doanh thu tổng hợp theo tháng");
  print("-----------------------------------------------------------------------------");
  print("  explain_5_loai() : Xuất Kế hoạch thực thi (Execution Stats) cho 5 loại query");
  print("=============================================================================\n");
}

// --- FR01 ---
function fr01_1() {
  print("\n>>> [FR01 - 1] Danh sách sản phẩm (Phân trang 10 SP đầu):");
  return db.products.aggregate([
    { $sort: { _id: 1 } },
    { $skip: 0 },
    { $limit: 10 },
    { $lookup: { from: "inventories", localField: "_id", foreignField: "productId", as: "inv" } },
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
          { $project: { _id: 0, latestImportPrice: "$items.unitPrice", latestImportDate: "$purchaseDate" } }
        ],
        as: "latestImport"
      }
    },
    { $unwind: { path: "$latestImport", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        product_id: "$_id", sku: 1, barcode: 1, product_name: "$productName",
        category_name: "$categoryName", brand_name: "$brandName", unit_name: "$unitName",
        latest_import_price: "$latestImport.latestImportPrice", sale_price: "$salePrice",
        profit_per_unit: { $subtract: ["$salePrice", "$latestImport.latestImportPrice"] },
        quantity_on_hand: "$inv.quantityOnHand", status: 1
      }
    }
  ]).toArray();
}

function fr01_2(productId = 1) {
  print(`\n>>> [FR01 - 2] Chi tiết sản phẩm #${productId}:`);
  return db.products.aggregate([
    { $match: { _id: productId } },
    { $lookup: { from: "inventories", localField: "_id", foreignField: "productId", as: "inv" } },
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
          { $project: { _id: 0, latestImportPrice: "$items.unitPrice", latestImportDate: "$purchaseDate", lastSupplierName: "$supplierName" } }
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
          { $group: { _id: null, totalCost: { $sum: "$items.lineTotal" }, totalQty: { $sum: "$items.quantity" } } },
          { $project: { _id: 0, avgImportPrice: { $round: [{ $divide: ["$totalCost", "$totalQty"] }, 2] } } }
        ],
        as: "impAvg"
      }
    },
    { $unwind: { path: "$impAvg", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        product_id: "$_id", sku: 1, barcode: 1, product_name: "$productName", specification: 1,
        category_name: "$categoryName", brand_name: "$brandName", brand_origin: "$brandOrigin", unit_name: "$unitName",
        latest_import_price: "$impLatest.latestImportPrice", avg_import_price: "$impAvg.avgImportPrice",
        sale_price: "$salePrice", profit_per_unit: { $subtract: ["$salePrice", "$impLatest.latestImportPrice"] },
        last_supplier_name: "$impLatest.lastSupplierName", latest_import_date: "$impLatest.latestImportDate",
        quantity_on_hand: "$inv.quantityOnHand", reorder_level: "$reorderLevel", status: 1, description: 1
      }
    }
  ]).toArray();
}

function fr01_3() {
  print("\n>>> [FR01 - 3 | SUBQUERY] Sản phẩm có giá bán cao hơn trung bình toàn cửa hàng:");
  return db.products.aggregate([
    { $group: { _id: null, store_avg_price: { $avg: "$salePrice" }, products: { $push: "$$ROOT" } } },
    { $unwind: "$products" },
    { $match: { $expr: { $gt: ["$products.salePrice", "$store_avg_price"] } } },
    { $sort: { "products.salePrice": -1 } },
    {
      $project: {
        _id: 0, product_id: "$products._id", sku: "$products.sku",
        product_name: "$products.productName", category_name: "$products.categoryName",
        sale_price: "$products.salePrice", store_avg_price: { $round: ["$store_avg_price", 2] }
      }
    }
  ]).toArray();
}

// --- FR02 & FR03 ---
function fr02_1() {
  print("\n>>> [FR02 - 1] Danh sách danh mục:");
  return db.categories.find({}, { _id: 0, category_id: "$_id", category_name: "$categoryName", description: 1, status: 1 }).sort({ _id: 1 }).toArray();
}

function fr03_1() {
  print("\n>>> [FR03 - 1] Danh sách nhà cung cấp:");
  return db.suppliers.find({}, { _id: 0, supplier_id: "$_id", supplier_name: "$supplierName", tax_code: "$taxCode", contact_person: "$contactPerson", phone: 1, email: 1, address: 1 }).sort({ _id: 1 }).toArray();
}

// --- FR04 ---
function fr04_1() {
  print("\n>>> [FR04 - 1 | JOIN] Lịch sử chi tiết phiếu nhập kho:");
  return db.purchaseReceipts.aggregate([
    { $sort: { purchaseDate: -1, _id: -1 } },
    { $unwind: "$items" },
    { $lookup: { from: "products", localField: "items.productId", foreignField: "_id", as: "productInfo" } },
    { $unwind: { path: "$productInfo", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0, purchase_id: "$_id", purchase_date: "$purchaseDate", status: 1, note: 1,
        supplier_name: "$supplierName", created_by: "$createdByName",
        sku: "$items.sku", product_name: "$items.productName",
        quantity: "$items.quantity", unit_price: "$items.unitPrice", line_total: "$items.lineTotal"
      }
    }
  ]).toArray();
}

function fr04_2() {
  print("\n>>> [FR04 - 2 | AGGREGATE] Tổng nhập hàng theo từng Nhà cung cấp:");
  return db.suppliers.aggregate([
    {
      $lookup: {
        from: "purchaseReceipts",
        let: { sid: "$_id" },
        pipeline: [
          { $match: { $expr: { $and: [{ $eq: ["$supplierId", "$$sid"] }, { $eq: ["$status", "CONFIRMED"] }] } } }
        ],
        as: "receipts"
      }
    },
    {
      $project: {
        _id: 0, supplier_id: "$_id", supplier_name: "$supplierName",
        total_receipts: { $size: "$receipts" },
        total_items_imported: { $sum: { $map: { input: "$receipts", as: "r", in: { $sum: "$$r.items.quantity" } } } },
        total_import_amount: { $sum: "$receipts.totalAmount" }
      }
    },
    { $sort: { total_import_amount: -1 } }
  ]).toArray();
}

// --- FR05 ---
function fr05_1() {
  print("\n>>> [FR05 - 1] Tra cứu sản phẩm khi bán tại quầy POS:");
  return db.products.aggregate([
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
    { $lookup: { from: "inventories", localField: "_id", foreignField: "productId", as: "inv" } },
    { $unwind: "$inv" },
    { $match: { "inv.quantityOnHand": { $gt: 0 } } },
    {
      $project: {
        _id: 0, product_id: "$_id", sku: 1, barcode: 1,
        product_name: "$productName", unit_name: "$unitName",
        sale_price: "$salePrice", quantity_on_hand: "$inv.quantityOnHand"
      }
    }
  ]).toArray();
}

// --- FR06 ---
function fr06_1() {
  print("\n>>> [FR06 - 1 | ĐIỀU KIỆN KẾT HỢP] Tra cứu hóa đơn theo khoảng ngày & PTTT:");
  return db.salesInvoices.find(
    {
      createdAt: { $gte: new Date("2026-10-01T00:00:00Z"), $lt: new Date("2026-11-01T00:00:00Z") },
      status: "CONFIRMED",
      paymentMethod: { $in: ["BANK_TRANSFER", "CARD"] }
    },
    {
      _id: 0, invoice_id: "$_id", created_at: "$createdAt", status: 1,
      payment_method: "$paymentMethod", customer_name: "$customerName",
      cashier_name: "$cashierName", subtotal_amount: "$subtotalAmount",
      discount: 1, total_amount: "$totalAmount"
    }
  ).sort({ createdAt: -1 }).toArray();
}

function fr06_2() {
  print("\n>>> [FR06 - 2 | JOIN] Lịch sử chi tiết hóa đơn bán:");
  return db.salesInvoices.aggregate([
    { $sort: { createdAt: -1, _id: -1 } },
    { $unwind: "$items" },
    { $lookup: { from: "products", localField: "items.productId", foreignField: "_id", as: "productInfo" } },
    { $unwind: { path: "$productInfo", preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0, invoice_id: "$_id", created_at: "$createdAt", status: 1,
        payment_method: "$paymentMethod", discount: 1,
        customer_name: { $ifNull: ["$customerName", "Khách vãng lai"] },
        cashier_name: "$cashierName", sku: "$items.sku", product_name: "$items.productName",
        quantity: "$items.quantity", unit_price: "$items.unitPrice",
        line_discount: "$items.lineDiscount", line_total: "$items.lineTotal"
      }
    }
  ]).toArray();
}

function fr06_3() {
  print("\n>>> [FR06 - 3 | SUBQUERY] Các hóa đơn có tổng thanh toán cao hơn trung bình:");
  return db.salesInvoices.aggregate([
    { $group: { _id: null, avg_invoice_amount: { $avg: "$totalAmount" }, invoices: { $push: "$$ROOT" } } },
    { $unwind: "$invoices" },
    { $match: { $expr: { $gt: ["$invoices.totalAmount", "$avg_invoice_amount"] } } },
    { $sort: { "invoices.totalAmount": -1 } },
    {
      $project: {
        _id: 0, invoice_id: "$invoices._id", created_at: "$invoices.createdAt",
        customer_name: "$invoices.customerName", cashier_name: "$invoices.cashierName",
        payment_method: "$invoices.paymentMethod", total_amount: "$invoices.totalAmount",
        avg_invoice_amount: { $round: ["$avg_invoice_amount", 2] }
      }
    }
  ]).toArray();
}

// --- FR07 ---
function fr07_1(skuCode = "SKU-TL-001") {
  print(`\n>>> [FR07 - 1 | ĐIỀU KIỆN ĐƠN] Tìm sản phẩm theo SKU = '${skuCode}':`);
  return db.products.find(
    { sku: skuCode },
    { _id: 0, product_id: "$_id", sku: 1, barcode: 1, product_name: "$productName", specification: 1, sale_price: "$salePrice", status: 1 }
  ).toArray();
}

function fr07_2() {
  print("\n>>> [FR07 - 2 | ĐIỀU KIỆN KẾT HỢP] Lọc SP Danh mục 2 + Giá 20k-95k + Còn hàng:");
  return db.products.aggregate([
    { $match: { categoryId: 2, salePrice: { $gte: 20000, $lte: 95000 }, status: "ACTIVE" } },
    { $lookup: { from: "inventories", localField: "_id", foreignField: "productId", as: "inv" } },
    { $unwind: "$inv" },
    { $match: { "inv.quantityOnHand": { $gt: 0 } } },
    { $sort: { salePrice: 1 } },
    {
      $project: {
        _id: 0, product_id: "$_id", sku: 1, product_name: "$productName",
        category_name: "$categoryName", brand_name: "$brandName",
        sale_price: "$salePrice", quantity_on_hand: "$inv.quantityOnHand"
      }
    }
  ]).toArray();
}

// --- FR08 ---
function fr08_1() {
  print("\n>>> [FR08 - 1] Danh sách tồn kho kèm trạng thái cảnh báo:");
  return db.inventories.aggregate([
    { $lookup: { from: "products", localField: "productId", foreignField: "_id", as: "prod" } },
    { $unwind: "$prod" },
    { $sort: { quantityOnHand: 1 } },
    {
      $project: {
        _id: 0, product_id: "$prod._id", sku: "$prod.sku", product_name: "$prod.productName",
        category_name: "$prod.categoryName", unit_name: "$prod.unitName",
        quantity_on_hand: "$quantityOnHand", reorder_level: "$prod.reorderLevel",
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
  ]).toArray();
}

function fr08_2() {
  print("\n>>> [FR08 - 2 | AGGREGATE] Thống kê tồn kho theo Danh mục:");
  return db.categories.aggregate([
    { $lookup: { from: "products", localField: "_id", foreignField: "categoryId", as: "prods" } },
    { $unwind: { path: "$prods", preserveNullAndEmptyArrays: true } },
    { $lookup: { from: "inventories", localField: "prods._id", foreignField: "productId", as: "inv" } },
    { $unwind: { path: "$inv", preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: "$_id",
        category_name: { $first: "$categoryName" },
        total_products: { $sum: { $cond: [{ $isNumber: "$prods._id" }, 1, 0] } },
        total_stock_units: { $sum: { $ifNull: ["$inv.quantityOnHand", 0] } },
        total_stock_value: { $sum: { $multiply: [{ $ifNull: ["$inv.quantityOnHand", 0] }, { $ifNull: ["$prods.salePrice", 0] }] } },
        low_or_out_of_stock_count: {
          $sum: {
            $cond: [
              { $and: [{ $isNumber: "$inv.quantityOnHand" }, { $lte: ["$inv.quantityOnHand", "$prods.reorderLevel"] }] },
              1, 0
            ]
          }
        }
      }
    },
    { $project: { _id: 0, category_id: "$_id", category_name: 1, total_products: 1, total_stock_units: 1, total_stock_value: 1, low_or_out_of_stock_count: 1 } },
    { $sort: { total_stock_value: -1 } }
  ]).toArray();
}

// --- FR09 & FR10 ---
function fr09_1() {
  print("\n>>> [FR09 - 1] Danh sách khách hàng thành viên VIP (Trang 1 - 20 khách):");
  return db.customers.find(
    {},
    { _id: 0, customer_id: "$_id", member_code: "$memberCode", ho: "$name.ho", ten: "$name.ten", full_name: "$fullName", phone: 1, email: 1, address: 1 }
  ).sort({ _id: 1 }).skip(0).limit(20).toArray();
}

function fr10_1() {
  print("\n>>> [FR10 - 1 | AGGREGATE] Báo cáo doanh thu theo từng ngày:");
  return db.salesInvoices.aggregate([
    { $match: { status: "CONFIRMED" } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        total_invoices: { $sum: 1 },
        total_items_sold: { $sum: { $sum: "$items.quantity" } },
        gross_amount: { $sum: "$subtotalAmount" },
        total_invoice_discount: { $sum: "$discount" },
        net_revenue: { $sum: "$totalAmount" }
      }
    },
    { $project: { _id: 0, report_date: "$_id", total_invoices: 1, total_items_sold: 1, gross_amount: 1, total_invoice_discount: 1, net_revenue: 1 } },
    { $sort: { report_date: 1 } }
  ]).toArray();
}

function fr10_2() {
  print("\n>>> [FR10 - 2 | AGGREGATE] Báo cáo doanh thu tổng hợp theo tháng:");
  return db.salesInvoices.aggregate([
    { $match: { status: "CONFIRMED" } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
        total_invoices: { $sum: 1 },
        total_items_sold: { $sum: { $sum: "$items.quantity" } },
        net_revenue: { $sum: "$totalAmount" }
      }
    },
    { $project: { _id: 0, report_month: "$_id", total_invoices: 1, total_items_sold: 1, net_revenue: 1 } },
    { $sort: { report_month: -1 } }
  ]).toArray();
}

// --- HÀM XUẤT KẾ HOẠCH THỰC THI (EXPLAIN PLAN) CHO BÁO CÁO QUERY PROCESSING ---
function explain_5_loai() {
  print("\n=== KẾ HOẠCH THỰC THI (EXECUTION STATS) 5 LOẠI TRUY VẤN ===");

  const q1 = db.products.find({ sku: "SKU-TL-001" }).explain("executionStats");
  print("1. Điều kiện đơn (SKU):", JSON.stringify({
    winningPlan: q1.queryPlanner.winningPlan.stage || q1.queryPlanner.winningPlan.queryPlan?.stage,
    executionTimeMillis: q1.executionStats.executionTimeMillis,
    totalKeysExamined: q1.executionStats.totalKeysExamined,
    totalDocsExamined: q1.executionStats.totalDocsExamined,
    nReturned: q1.executionStats.nReturned
  }, null, 2));

  const q2 = db.products.explain("executionStats").aggregate([
    { $match: { categoryId: 2, salePrice: { $gte: 20000, $lte: 95000 }, status: "ACTIVE" } },
    { $lookup: { from: "inventories", localField: "_id", foreignField: "productId", as: "inv" } },
    { $unwind: "$inv" },
    { $match: { "inv.quantityOnHand": { $gt: 0 } } }
  ]);
  print("2. Điều kiện kết hợp (FR07):", JSON.stringify({
    stagesCount: q2.stages?.length,
    cursorStats: q2.stages?.[0]?.$cursor?.executionStats || q2.executionStats
  }, null, 2));

  const q3 = db.salesInvoices.explain("executionStats").aggregate([
    { $sort: { createdAt: -1, _id: -1 } },
    { $unwind: "$items" },
    { $lookup: { from: "products", localField: "items.productId", foreignField: "_id", as: "productInfo" } }
  ]);
  print("3. JOIN / $lookup (FR06):", JSON.stringify({
    stagesCount: q3.stages?.length,
    cursorStats: q3.stages?.[0]?.$cursor?.executionStats || q3.executionStats
  }, null, 2));

  const q4 = db.products.explain("executionStats").aggregate([
    { $group: { _id: null, store_avg_price: { $avg: "$salePrice" }, products: { $push: "$$ROOT" } } },
    { $unwind: "$products" },
    { $match: { $expr: { $gt: ["$products.salePrice", "$store_avg_price"] } } }
  ]);
  print("4. Subquery tương đương (FR01):", JSON.stringify({
    stagesCount: q4.stages?.length,
    cursorStats: q4.stages?.[0]?.$cursor?.executionStats || q4.executionStats
  }, null, 2));

  const q5 = db.salesInvoices.explain("executionStats").aggregate([
    { $match: { status: "CONFIRMED" } },
    { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } }, total_invoices: { $sum: 1 }, net_revenue: { $sum: "$totalAmount" } } }
  ]);
  print("5. Aggregate doanh thu tháng (FR10):", JSON.stringify({
    stagesCount: q5.stages?.length,
    cursorStats: q5.stages?.[0]?.$cursor?.executionStats || q5.executionStats
  }, null, 2));

  return "Đã xuất thống kê thực thi cho đủ 5 loại truy vấn !";
}

menu();
