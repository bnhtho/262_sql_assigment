// ============================================================================
// MONGODB SCRIPT (MONGOSH): CƠ SỞ DỮ LIỆU QUẢN LÝ CỬA HÀNG VĂN PHÒNG PHẨM
// Tương đương 1-1 với file MSSQL/stationery_store_mssql.sql (StationeryStoreDB)
// Được thiết kế chuẩn theo bảng Ánh xạ EERD -> MongoDB của nhóm:
//   • categories: 5 documents
//   • brands: 10 documents
//   • units: 7 documents
//   • suppliers: 5 documents
//   • customers: 50 documents (name: { ho, ten }, fullName)
//   • employees: 10 documents (đa hình theo role: WAREHOUSE_STAFF, CASHIER, MANAGER)
//   • products: 30 documents (nhúng tên hiển thị categoryName, brandName, unitName)
//   • inventories: 30 documents (quan hệ 1:1 với products qua productId UNIQUE)
//   • purchaseReceipts: 10 documents (nhúng mảng items[] gồm 40 dòng chi tiết nhập)
//   • salesInvoices: 10 documents (nhúng mảng items[] gồm 25 dòng chi tiết bán)
//   • stockMovements: 80 documents (40 IN + 25 OUT + 15 ADJUST)
// ============================================================================

db = db.getSiblingDB("StationeryStoreDB");

// Xóa dữ liệu cũ nếu chạy lại script để tránh trùng lặp _id
db.categories.drop();
db.brands.drop();
db.units.drop();
db.suppliers.drop();
db.customers.drop();
db.employees.drop();
db.products.drop();
db.inventories.drop();
db.purchaseReceipts.drop();
db.salesInvoices.drop();
db.stockMovements.drop();

// 1. Categories (5 danh mục)
db.categories.insertMany([
  {
    "_id": 1,
    "categoryName": "Bút viết các loại",
    "description": "Bút bi, bút gel, bút lông bảng, bút dạ quang, bút chì",
    "status": "ACTIVE"
  },
  {
    "_id": 2,
    "categoryName": "Giấy in & Sổ tập",
    "description": "Giấy in văn phòng A4/A5, sổ tay, tập vở, giấy ghi chú",
    "status": "ACTIVE"
  },
  {
    "_id": 3,
    "categoryName": "File hồ sơ & Lưu trữ",
    "description": "Bìa còng, bìa lá, bìa nút, hộp đựng hồ sơ, kẹp tài liệu",
    "status": "ACTIVE"
  },
  {
    "_id": 4,
    "categoryName": "Dụng cụ văn phòng",
    "description": "Bấm kim, kim bấm, kẹp bướm, kéo, dao rọc giấy, băng keo",
    "status": "ACTIVE"
  },
  {
    "_id": 5,
    "categoryName": "Thiết bị & Phụ kiện VP",
    "description": "Máy tính bỏ túi, pin, ruy băng, bảng từ, khay cắm bút",
    "status": "ACTIVE"
  }
]);

// 2. Brands (10 thương hiệu)
db.brands.insertMany([
  {
    "_id": 1,
    "brandName": "Thiên Long",
    "origin": "Việt Nam"
  },
  {
    "_id": 2,
    "brandName": "Double A",
    "origin": "Thái Lan"
  },
  {
    "_id": 3,
    "brandName": "Plus",
    "origin": "Nhật Bản"
  },
  {
    "_id": 4,
    "brandName": "Deli",
    "origin": "Trung Quốc"
  },
  {
    "_id": 5,
    "brandName": "Pentel",
    "origin": "Nhật Bản"
  },
  {
    "_id": 6,
    "brandName": "King Jim",
    "origin": "Nhật Bản"
  },
  {
    "_id": 7,
    "brandName": "Casio",
    "origin": "Nhật Bản"
  },
  {
    "_id": 8,
    "brandName": "IK Plus",
    "origin": "Indonesia"
  },
  {
    "_id": 9,
    "brandName": "Kokuyo",
    "origin": "Nhật Bản"
  },
  {
    "_id": 10,
    "brandName": "Hồng Hà",
    "origin": "Việt Nam"
  }
]);

// 3. Units (7 đơn vị tính)
db.units.insertMany([
  {
    "_id": 1,
    "unitName": "Cây",
    "symbol": "cây"
  },
  {
    "_id": 2,
    "unitName": "Hộp",
    "symbol": "hộp"
  },
  {
    "_id": 3,
    "unitName": "Ream",
    "symbol": "ream"
  },
  {
    "_id": 4,
    "unitName": "Cuốn",
    "symbol": "cuốn"
  },
  {
    "_id": 5,
    "unitName": "Cái",
    "symbol": "cái"
  },
  {
    "_id": 6,
    "unitName": "Xấp",
    "symbol": "xấp"
  },
  {
    "_id": 7,
    "unitName": "Cuộn",
    "symbol": "cuộn"
  }
]);

// 4. Suppliers (5 nhà cung cấp)
db.suppliers.insertMany([
  {
    "_id": 1,
    "supplierName": "Công ty CP Tập đoàn Thiên Long",
    "taxCode": "0301464830",
    "contactPerson": "Nguyễn Minh Tuấn",
    "phone": "02837505555",
    "email": "sales@thienlonggroup.com",
    "address": "Tầng 10, Sofic Tower, Khu đô thị Sala, TP. Thủ Đức, TP.HCM"
  },
  {
    "_id": 2,
    "supplierName": "Công ty TNHH Quốc Tế Văn Phòng Phẩm Plus Việt Nam",
    "taxCode": "3600254891",
    "contactPerson": "Trần Thị Ngọc Mai",
    "phone": "02513836555",
    "email": "contact@plus-vietnam.com",
    "address": "Đường số 7, KCN Biên Hòa 2, TP. Biên Hòa, Đồng Nai"
  },
  {
    "_id": 3,
    "supplierName": "Công ty TNHH Thương Mại Giấy & VPP Á Châu",
    "taxCode": "0304829104",
    "contactPerson": "Lê Hoàng Nam",
    "phone": "02838123456",
    "email": "kinhdoanh@giayachau.vn",
    "address": "128 Cộng Hòa, Phường 4, Quận Tân Bình, TP.HCM"
  },
  {
    "_id": 4,
    "supplierName": "Công ty CP Phân Phối Văn Phòng Phẩm Deli Miền Nam",
    "taxCode": "0312589632",
    "contactPerson": "Phạm Quốc Hưng",
    "phone": "02839256789",
    "email": "order@delivietnam.vn",
    "address": "456 Nguyễn Thị Minh Khai, Phường 5, Quận 3, TP.HCM"
  },
  {
    "_id": 5,
    "supplierName": "Công ty CP Xuất Nhập Khẩu Thiết Bị Văn Phòng Sao Khuê",
    "taxCode": "0309876543",
    "contactPerson": "Võ Thị Thanh Thảo",
    "phone": "02838445566",
    "email": "info@saokhueoffice.vn",
    "address": "88 Hoàng Văn Thụ, Phường 9, Quận Phú Nhuận, TP.HCM"
  }
]);

// 5. Customers (50 khách hàng thành viên VIP)
db.customers.insertMany([
  {
    "_id": 1,
    "name": {
      "ho": "Nguyễn Văn",
      "ten": "An"
    },
    "fullName": "Nguyễn Văn An",
    "phone": "0900000001",
    "email": "khachhang01@vppclient.vn",
    "address": "Số 8 Nguyễn Huệ, Quận 1, TP.HCM",
    "memberCode": "VIP-0001"
  },
  {
    "_id": 2,
    "name": {
      "ho": "Trần Thị",
      "ten": "Bình"
    },
    "fullName": "Trần Thị Bình",
    "phone": "0900000002",
    "email": "khachhang02@vppclient.vn",
    "address": "Số 11 Lê Lợi, Quận 3, TP.HCM",
    "memberCode": "VIP-0002"
  },
  {
    "_id": 3,
    "name": {
      "ho": "Lê Hoàng",
      "ten": "Châu"
    },
    "fullName": "Lê Hoàng Châu",
    "phone": "0900000003",
    "email": "khachhang03@vppclient.vn",
    "address": "Số 14 Hai Bà Trưng, Quận 4, TP.HCM",
    "memberCode": "VIP-0003"
  },
  {
    "_id": 4,
    "name": {
      "ho": "Phạm Minh",
      "ten": "Dũng"
    },
    "fullName": "Phạm Minh Dũng",
    "phone": "0900000004",
    "email": "khachhang04@vppclient.vn",
    "address": "Số 17 Nam Kỳ Khởi Nghĩa, Quận 5, TP.HCM",
    "memberCode": "VIP-0004"
  },
  {
    "_id": 5,
    "name": {
      "ho": "Hoàng Gia",
      "ten": "Giang"
    },
    "fullName": "Hoàng Gia Giang",
    "phone": "0900000005",
    "email": "khachhang05@vppclient.vn",
    "address": "Số 20 Điện Biên Phủ, Quận 7, TP.HCM",
    "memberCode": "VIP-0005"
  },
  {
    "_id": 6,
    "name": {
      "ho": "Huỳnh Ngọc",
      "ten": "Hà"
    },
    "fullName": "Huỳnh Ngọc Hà",
    "phone": "0900000006",
    "email": "khachhang06@vppclient.vn",
    "address": "Số 23 Cách Mạng Tháng Tám, Quận 10, TP.HCM",
    "memberCode": "VIP-0006"
  },
  {
    "_id": 7,
    "name": {
      "ho": "Phan Thanh",
      "ten": "Hải"
    },
    "fullName": "Phan Thanh Hải",
    "phone": "0900000007",
    "email": "khachhang07@vppclient.vn",
    "address": "Số 26 Nguyễn Thị Minh Khai, Quận Bình Thạnh, TP.HCM",
    "memberCode": "VIP-0007"
  },
  {
    "_id": 8,
    "name": {
      "ho": "Vũ Đình",
      "ten": "Hạnh"
    },
    "fullName": "Vũ Đình Hạnh",
    "phone": "0900000008",
    "email": "khachhang08@vppclient.vn",
    "address": "Số 29 Phan Xích Long, Quận Phú Nhuận, TP.HCM",
    "memberCode": "VIP-0008"
  },
  {
    "_id": 9,
    "name": {
      "ho": "Võ Thị",
      "ten": "Hiếu"
    },
    "fullName": "Võ Thị Hiếu",
    "phone": "0900000009",
    "email": "khachhang09@vppclient.vn",
    "address": "Số 32 Hoàng Văn Thụ, Quận Tân Bình, TP.HCM",
    "memberCode": "VIP-0009"
  },
  {
    "_id": 10,
    "name": {
      "ho": "Đặng Quốc",
      "ten": "Hoàng"
    },
    "fullName": "Đặng Quốc Hoàng",
    "phone": "0900000010",
    "email": "khachhang10@vppclient.vn",
    "address": "Số 35 Võ Văn Ngân, TP. Thủ Đức, TP.HCM",
    "memberCode": "VIP-0010"
  },
  {
    "_id": 11,
    "name": {
      "ho": "Nguyễn Văn",
      "ten": "Hùng"
    },
    "fullName": "Nguyễn Văn Hùng",
    "phone": "0900000011",
    "email": "khachhang11@vppclient.vn",
    "address": "Số 38 Nguyễn Huệ, Quận 1, TP.HCM",
    "memberCode": "VIP-0011"
  },
  {
    "_id": 12,
    "name": {
      "ho": "Trần Thị",
      "ten": "Hương"
    },
    "fullName": "Trần Thị Hương",
    "phone": "0900000012",
    "email": "khachhang12@vppclient.vn",
    "address": "Số 41 Lê Lợi, Quận 3, TP.HCM",
    "memberCode": "VIP-0012"
  },
  {
    "_id": 13,
    "name": {
      "ho": "Lê Hoàng",
      "ten": "Khánh"
    },
    "fullName": "Lê Hoàng Khánh",
    "phone": "0900000013",
    "email": "khachhang13@vppclient.vn",
    "address": "Số 44 Hai Bà Trưng, Quận 4, TP.HCM",
    "memberCode": "VIP-0013"
  },
  {
    "_id": 14,
    "name": {
      "ho": "Phạm Minh",
      "ten": "Khoa"
    },
    "fullName": "Phạm Minh Khoa",
    "phone": "0900000014",
    "email": "khachhang14@vppclient.vn",
    "address": "Số 47 Nam Kỳ Khởi Nghĩa, Quận 5, TP.HCM",
    "memberCode": "VIP-0014"
  },
  {
    "_id": 15,
    "name": {
      "ho": "Hoàng Gia",
      "ten": "Khôi"
    },
    "fullName": "Hoàng Gia Khôi",
    "phone": "0900000015",
    "email": "khachhang15@vppclient.vn",
    "address": "Số 50 Điện Biên Phủ, Quận 7, TP.HCM",
    "memberCode": "VIP-0015"
  },
  {
    "_id": 16,
    "name": {
      "ho": "Huỳnh Ngọc",
      "ten": "Lâm"
    },
    "fullName": "Huỳnh Ngọc Lâm",
    "phone": "0900000016",
    "email": "khachhang16@vppclient.vn",
    "address": "Số 53 Cách Mạng Tháng Tám, Quận 10, TP.HCM",
    "memberCode": "VIP-0016"
  },
  {
    "_id": 17,
    "name": {
      "ho": "Phan Thanh",
      "ten": "Lan"
    },
    "fullName": "Phan Thanh Lan",
    "phone": "0900000017",
    "email": "khachhang17@vppclient.vn",
    "address": "Số 56 Nguyễn Thị Minh Khai, Quận Bình Thạnh, TP.HCM",
    "memberCode": "VIP-0017"
  },
  {
    "_id": 18,
    "name": {
      "ho": "Vũ Đình",
      "ten": "Linh"
    },
    "fullName": "Vũ Đình Linh",
    "phone": "0900000018",
    "email": "khachhang18@vppclient.vn",
    "address": "Số 59 Phan Xích Long, Quận Phú Nhuận, TP.HCM",
    "memberCode": "VIP-0018"
  },
  {
    "_id": 19,
    "name": {
      "ho": "Võ Thị",
      "ten": "Long"
    },
    "fullName": "Võ Thị Long",
    "phone": "0900000019",
    "email": "khachhang19@vppclient.vn",
    "address": "Số 62 Hoàng Văn Thụ, Quận Tân Bình, TP.HCM",
    "memberCode": "VIP-0019"
  },
  {
    "_id": 20,
    "name": {
      "ho": "Đặng Quốc",
      "ten": "Mai"
    },
    "fullName": "Đặng Quốc Mai",
    "phone": "0900000020",
    "email": "khachhang20@vppclient.vn",
    "address": "Số 65 Võ Văn Ngân, TP. Thủ Đức, TP.HCM",
    "memberCode": "VIP-0020"
  },
  {
    "_id": 21,
    "name": {
      "ho": "Nguyễn Văn",
      "ten": "Minh"
    },
    "fullName": "Nguyễn Văn Minh",
    "phone": "0900000021",
    "email": "khachhang21@vppclient.vn",
    "address": "Số 68 Nguyễn Huệ, Quận 1, TP.HCM",
    "memberCode": "VIP-0021"
  },
  {
    "_id": 22,
    "name": {
      "ho": "Trần Thị",
      "ten": "My"
    },
    "fullName": "Trần Thị My",
    "phone": "0900000022",
    "email": "khachhang22@vppclient.vn",
    "address": "Số 71 Lê Lợi, Quận 3, TP.HCM",
    "memberCode": "VIP-0022"
  },
  {
    "_id": 23,
    "name": {
      "ho": "Lê Hoàng",
      "ten": "Nam"
    },
    "fullName": "Lê Hoàng Nam",
    "phone": "0900000023",
    "email": "khachhang23@vppclient.vn",
    "address": "Số 74 Hai Bà Trưng, Quận 4, TP.HCM",
    "memberCode": "VIP-0023"
  },
  {
    "_id": 24,
    "name": {
      "ho": "Phạm Minh",
      "ten": "Nga"
    },
    "fullName": "Phạm Minh Nga",
    "phone": "0900000024",
    "email": "khachhang24@vppclient.vn",
    "address": "Số 77 Nam Kỳ Khởi Nghĩa, Quận 5, TP.HCM",
    "memberCode": "VIP-0024"
  },
  {
    "_id": 25,
    "name": {
      "ho": "Hoàng Gia",
      "ten": "Ngân"
    },
    "fullName": "Hoàng Gia Ngân",
    "phone": "0900000025",
    "email": "khachhang25@vppclient.vn",
    "address": "Số 80 Điện Biên Phủ, Quận 7, TP.HCM",
    "memberCode": "VIP-0025"
  },
  {
    "_id": 26,
    "name": {
      "ho": "Huỳnh Ngọc",
      "ten": "Ngọc"
    },
    "fullName": "Huỳnh Ngọc Ngọc",
    "phone": "0900000026",
    "email": "khachhang26@vppclient.vn",
    "address": "Số 83 Cách Mạng Tháng Tám, Quận 10, TP.HCM",
    "memberCode": "VIP-0026"
  },
  {
    "_id": 27,
    "name": {
      "ho": "Phan Thanh",
      "ten": "Nhung"
    },
    "fullName": "Phan Thanh Nhung",
    "phone": "0900000027",
    "email": "khachhang27@vppclient.vn",
    "address": "Số 86 Nguyễn Thị Minh Khai, Quận Bình Thạnh, TP.HCM",
    "memberCode": "VIP-0027"
  },
  {
    "_id": 28,
    "name": {
      "ho": "Vũ Đình",
      "ten": "Oanh"
    },
    "fullName": "Vũ Đình Oanh",
    "phone": "0900000028",
    "email": "khachhang28@vppclient.vn",
    "address": "Số 89 Phan Xích Long, Quận Phú Nhuận, TP.HCM",
    "memberCode": "VIP-0028"
  },
  {
    "_id": 29,
    "name": {
      "ho": "Võ Thị",
      "ten": "Phong"
    },
    "fullName": "Võ Thị Phong",
    "phone": "0900000029",
    "email": "khachhang29@vppclient.vn",
    "address": "Số 92 Hoàng Văn Thụ, Quận Tân Bình, TP.HCM",
    "memberCode": "VIP-0029"
  },
  {
    "_id": 30,
    "name": {
      "ho": "Đặng Quốc",
      "ten": "Phúc"
    },
    "fullName": "Đặng Quốc Phúc",
    "phone": "0900000030",
    "email": "khachhang30@vppclient.vn",
    "address": "Số 95 Võ Văn Ngân, TP. Thủ Đức, TP.HCM",
    "memberCode": "VIP-0030"
  },
  {
    "_id": 31,
    "name": {
      "ho": "Nguyễn Văn",
      "ten": "Phương"
    },
    "fullName": "Nguyễn Văn Phương",
    "phone": "0900000031",
    "email": "khachhang31@vppclient.vn",
    "address": "Số 98 Nguyễn Huệ, Quận 1, TP.HCM",
    "memberCode": "VIP-0031"
  },
  {
    "_id": 32,
    "name": {
      "ho": "Trần Thị",
      "ten": "Quân"
    },
    "fullName": "Trần Thị Quân",
    "phone": "0900000032",
    "email": "khachhang32@vppclient.vn",
    "address": "Số 101 Lê Lợi, Quận 3, TP.HCM",
    "memberCode": "VIP-0032"
  },
  {
    "_id": 33,
    "name": {
      "ho": "Lê Hoàng",
      "ten": "Quang"
    },
    "fullName": "Lê Hoàng Quang",
    "phone": "0900000033",
    "email": "khachhang33@vppclient.vn",
    "address": "Số 104 Hai Bà Trưng, Quận 4, TP.HCM",
    "memberCode": "VIP-0033"
  },
  {
    "_id": 34,
    "name": {
      "ho": "Phạm Minh",
      "ten": "Quỳnh"
    },
    "fullName": "Phạm Minh Quỳnh",
    "phone": "0900000034",
    "email": "khachhang34@vppclient.vn",
    "address": "Số 107 Nam Kỳ Khởi Nghĩa, Quận 5, TP.HCM",
    "memberCode": "VIP-0034"
  },
  {
    "_id": 35,
    "name": {
      "ho": "Hoàng Gia",
      "ten": "Sơn"
    },
    "fullName": "Hoàng Gia Sơn",
    "phone": "0900000035",
    "email": "khachhang35@vppclient.vn",
    "address": "Số 110 Điện Biên Phủ, Quận 7, TP.HCM",
    "memberCode": "VIP-0035"
  },
  {
    "_id": 36,
    "name": {
      "ho": "Huỳnh Ngọc",
      "ten": "Tâm"
    },
    "fullName": "Huỳnh Ngọc Tâm",
    "phone": "0900000036",
    "email": "khachhang36@vppclient.vn",
    "address": "Số 113 Cách Mạng Tháng Tám, Quận 10, TP.HCM",
    "memberCode": "VIP-0036"
  },
  {
    "_id": 37,
    "name": {
      "ho": "Phan Thanh",
      "ten": "Tân"
    },
    "fullName": "Phan Thanh Tân",
    "phone": "0900000037",
    "email": "khachhang37@vppclient.vn",
    "address": "Số 116 Nguyễn Thị Minh Khai, Quận Bình Thạnh, TP.HCM",
    "memberCode": "VIP-0037"
  },
  {
    "_id": 38,
    "name": {
      "ho": "Vũ Đình",
      "ten": "Thảo"
    },
    "fullName": "Vũ Đình Thảo",
    "phone": "0900000038",
    "email": "khachhang38@vppclient.vn",
    "address": "Số 119 Phan Xích Long, Quận Phú Nhuận, TP.HCM",
    "memberCode": "VIP-0038"
  },
  {
    "_id": 39,
    "name": {
      "ho": "Võ Thị",
      "ten": "Thắng"
    },
    "fullName": "Võ Thị Thắng",
    "phone": "0900000039",
    "email": "khachhang39@vppclient.vn",
    "address": "Số 122 Hoàng Văn Thụ, Quận Tân Bình, TP.HCM",
    "memberCode": "VIP-0039"
  },
  {
    "_id": 40,
    "name": {
      "ho": "Đặng Quốc",
      "ten": "Thịnh"
    },
    "fullName": "Đặng Quốc Thịnh",
    "phone": "0900000040",
    "email": "khachhang40@vppclient.vn",
    "address": "Số 125 Võ Văn Ngân, TP. Thủ Đức, TP.HCM",
    "memberCode": "VIP-0040"
  },
  {
    "_id": 41,
    "name": {
      "ho": "Nguyễn Văn",
      "ten": "Thu"
    },
    "fullName": "Nguyễn Văn Thu",
    "phone": "0900000041",
    "email": "khachhang41@vppclient.vn",
    "address": "Số 128 Nguyễn Huệ, Quận 1, TP.HCM",
    "memberCode": "VIP-0041"
  },
  {
    "_id": 42,
    "name": {
      "ho": "Trần Thị",
      "ten": "Thủy"
    },
    "fullName": "Trần Thị Thủy",
    "phone": "0900000042",
    "email": "khachhang42@vppclient.vn",
    "address": "Số 131 Lê Lợi, Quận 3, TP.HCM",
    "memberCode": "VIP-0042"
  },
  {
    "_id": 43,
    "name": {
      "ho": "Lê Hoàng",
      "ten": "Trang"
    },
    "fullName": "Lê Hoàng Trang",
    "phone": "0900000043",
    "email": "khachhang43@vppclient.vn",
    "address": "Số 134 Hai Bà Trưng, Quận 4, TP.HCM",
    "memberCode": "VIP-0043"
  },
  {
    "_id": 44,
    "name": {
      "ho": "Phạm Minh",
      "ten": "Trinh"
    },
    "fullName": "Phạm Minh Trinh",
    "phone": "0900000044",
    "email": "khachhang44@vppclient.vn",
    "address": "Số 137 Nam Kỳ Khởi Nghĩa, Quận 5, TP.HCM",
    "memberCode": "VIP-0044"
  },
  {
    "_id": 45,
    "name": {
      "ho": "Hoàng Gia",
      "ten": "Trung"
    },
    "fullName": "Hoàng Gia Trung",
    "phone": "0900000045",
    "email": "khachhang45@vppclient.vn",
    "address": "Số 140 Điện Biên Phủ, Quận 7, TP.HCM",
    "memberCode": "VIP-0045"
  },
  {
    "_id": 46,
    "name": {
      "ho": "Huỳnh Ngọc",
      "ten": "Tú"
    },
    "fullName": "Huỳnh Ngọc Tú",
    "phone": "0900000046",
    "email": "khachhang46@vppclient.vn",
    "address": "Số 143 Cách Mạng Tháng Tám, Quận 10, TP.HCM",
    "memberCode": "VIP-0046"
  },
  {
    "_id": 47,
    "name": {
      "ho": "Phan Thanh",
      "ten": "Tuấn"
    },
    "fullName": "Phan Thanh Tuấn",
    "phone": "0900000047",
    "email": "khachhang47@vppclient.vn",
    "address": "Số 146 Nguyễn Thị Minh Khai, Quận Bình Thạnh, TP.HCM",
    "memberCode": "VIP-0047"
  },
  {
    "_id": 48,
    "name": {
      "ho": "Vũ Đình",
      "ten": "Tùng"
    },
    "fullName": "Vũ Đình Tùng",
    "phone": "0900000048",
    "email": "khachhang48@vppclient.vn",
    "address": "Số 149 Phan Xích Long, Quận Phú Nhuận, TP.HCM",
    "memberCode": "VIP-0048"
  },
  {
    "_id": 49,
    "name": {
      "ho": "Võ Thị",
      "ten": "Uyên"
    },
    "fullName": "Võ Thị Uyên",
    "phone": "0900000049",
    "email": "khachhang49@vppclient.vn",
    "address": "Số 152 Hoàng Văn Thụ, Quận Tân Bình, TP.HCM",
    "memberCode": "VIP-0049"
  },
  {
    "_id": 50,
    "name": {
      "ho": "Đặng Quốc",
      "ten": "Vy"
    },
    "fullName": "Đặng Quốc Vy",
    "phone": "0900000050",
    "email": "khachhang50@vppclient.vn",
    "address": "Số 155 Võ Văn Ngân, TP. Thủ Đức, TP.HCM",
    "memberCode": "VIP-0050"
  }
]);

// 6. Employees (10 nhân viên: 4 Nhân viên kho, 4 Thu ngân, 2 Quản lý)
db.employees.insertMany([
  {
    "_id": 1,
    "name": {
      "ho": "Võ Thành",
      "ten": "Long"
    },
    "fullName": "Võ Thành Long",
    "phone": "0988111001",
    "email": "long.vo@stationery.vn",
    "role": "WAREHOUSE_STAFF",
    "hireDate": new Date("2024-01-15"),
    "status": "ACTIVE",
    "assignedArea": "Kho Bút Viết & Dụng Cụ - Khu A1"
  },
  {
    "_id": 2,
    "name": {
      "ho": "Trần Quốc",
      "ten": "Tuấn"
    },
    "fullName": "Trần Quốc Tuấn",
    "phone": "0988111002",
    "email": "tuan.tran@stationery.vn",
    "role": "WAREHOUSE_STAFF",
    "hireDate": new Date("2024-02-10"),
    "status": "ACTIVE",
    "assignedArea": "Kho Giấy In & Sổ Tập - Khu A2"
  },
  {
    "_id": 3,
    "name": {
      "ho": "Lê Minh",
      "ten": "Tâm"
    },
    "fullName": "Lê Minh Tâm",
    "phone": "0988111003",
    "email": "tam.le@stationery.vn",
    "role": "WAREHOUSE_STAFF",
    "hireDate": new Date("2024-03-05"),
    "status": "ACTIVE",
    "assignedArea": "Kho Bìa Hồ Sơ & Lưu Trữ - Khu B1"
  },
  {
    "_id": 4,
    "name": {
      "ho": "Phạm Hồng",
      "ten": "Phúc"
    },
    "fullName": "Phạm Hồng Phúc",
    "phone": "0988111004",
    "email": "phuc.pham@stationery.vn",
    "role": "WAREHOUSE_STAFF",
    "hireDate": new Date("2024-04-12"),
    "status": "ACTIVE",
    "assignedArea": "Kho Thiết Bị Văn Phòng - Khu B2"
  },
  {
    "_id": 5,
    "name": {
      "ho": "Đặng Ngọc",
      "ten": "Lan"
    },
    "fullName": "Đặng Ngọc Lan",
    "phone": "0988222005",
    "email": "lan.dang@stationery.vn",
    "role": "CASHIER",
    "hireDate": new Date("2024-01-20"),
    "status": "ACTIVE",
    "workShift": "Ca Sáng (07:30 - 15:30)"
  },
  {
    "_id": 6,
    "name": {
      "ho": "Nguyễn Thu",
      "ten": "Hương"
    },
    "fullName": "Nguyễn Thu Hương",
    "phone": "0988222006",
    "email": "huong.nguyen@stationery.vn",
    "role": "CASHIER",
    "hireDate": new Date("2024-02-18"),
    "status": "ACTIVE",
    "workShift": "Ca Chiều (14:00 - 22:00)"
  },
  {
    "_id": 7,
    "name": {
      "ho": "Bùi Thanh",
      "ten": "Trúc"
    },
    "fullName": "Bùi Thanh Trúc",
    "phone": "0988222007",
    "email": "truc.bui@stationery.vn",
    "role": "CASHIER",
    "hireDate": new Date("2024-03-22"),
    "status": "ACTIVE",
    "workShift": "Ca Sáng (07:30 - 15:30)"
  },
  {
    "_id": 8,
    "name": {
      "ho": "Đỗ Gia",
      "ten": "Hân"
    },
    "fullName": "Đỗ Gia Hân",
    "phone": "0988222008",
    "email": "han.do@stationery.vn",
    "role": "CASHIER",
    "hireDate": new Date("2024-05-02"),
    "status": "ACTIVE",
    "workShift": "Ca Chiều (14:00 - 22:00)"
  },
  {
    "_id": 9,
    "name": {
      "ho": "Hoàng Gia",
      "ten": "Bảo"
    },
    "fullName": "Hoàng Gia Bảo",
    "phone": "0988333009",
    "email": "bao.hoang@stationery.vn",
    "role": "MANAGER",
    "hireDate": new Date("2023-06-01"),
    "status": "ACTIVE"
  },
  {
    "_id": 10,
    "name": {
      "ho": "Lý Thanh",
      "ten": "Thảo"
    },
    "fullName": "Lý Thanh Thảo",
    "phone": "0988333010",
    "email": "thao.ly@stationery.vn",
    "role": "MANAGER",
    "hireDate": new Date("2023-08-15"),
    "status": "ACTIVE"
  }
]);

// 7. Products (30 sản phẩm văn phòng phẩm)
db.products.insertMany([
  {
    "_id": 1,
    "sku": "SKU-TL-001",
    "barcode": "8935001800011",
    "productName": "Bút bi Thiên Long TL-027 Xanh",
    "specification": "Hộp 20 cây, ngòi 0.5mm",
    "salePrice": 90000,
    "reorderLevel": 20,
    "status": "ACTIVE",
    "description": "Bút bi truyền thống mực xanh viết trơn êm",
    "categoryId": 1,
    "categoryName": "Bút viết các loại",
    "brandId": 1,
    "brandName": "Thiên Long",
    "brandOrigin": "Việt Nam",
    "unitId": 2,
    "unitName": "Hộp",
    "unitSymbol": "hộp"
  },
  {
    "_id": 2,
    "sku": "SKU-TL-002",
    "barcode": "8935001800028",
    "productName": "Bút gel Thiên Long Gel-08 Đen",
    "specification": "Hộp 10 cây, ngòi 0.5mm",
    "salePrice": 85000,
    "reorderLevel": 15,
    "status": "ACTIVE",
    "description": "Bút gel mực nước đậm đều màu",
    "categoryId": 1,
    "categoryName": "Bút viết các loại",
    "brandId": 1,
    "brandName": "Thiên Long",
    "brandOrigin": "Việt Nam",
    "unitId": 2,
    "unitName": "Hộp",
    "unitSymbol": "hộp"
  },
  {
    "_id": 3,
    "sku": "SKU-TL-003",
    "barcode": "8935001800035",
    "productName": "Bút lông bảng Thiên Long WB-03 Xanh",
    "specification": "Hộp 12 cây",
    "salePrice": 108000,
    "reorderLevel": 15,
    "status": "ACTIVE",
    "description": "Bút viết bảng trắng dễ xóa không để lại bóng mực",
    "categoryId": 1,
    "categoryName": "Bút viết các loại",
    "brandId": 1,
    "brandName": "Thiên Long",
    "brandOrigin": "Việt Nam",
    "unitId": 2,
    "unitName": "Hộp",
    "unitSymbol": "hộp"
  },
  {
    "_id": 4,
    "sku": "SKU-TL-004",
    "barcode": "8935001800042",
    "productName": "Bút dạ quang Thiên Long HL-03 Vàng",
    "specification": "Hộp 10 cây, 2 đầu",
    "salePrice": 95000,
    "reorderLevel": 15,
    "status": "ACTIVE",
    "description": "Bút nhớ dòng màu vàng tươi sáng",
    "categoryId": 1,
    "categoryName": "Bút viết các loại",
    "brandId": 1,
    "brandName": "Thiên Long",
    "brandOrigin": "Việt Nam",
    "unitId": 2,
    "unitName": "Hộp",
    "unitSymbol": "hộp"
  },
  {
    "_id": 5,
    "sku": "SKU-PT-001",
    "barcode": "8935001800059",
    "productName": "Bút ký cao cấp Pentel EnerGel BLN75",
    "specification": "Cây, ngòi 0.5mm",
    "salePrice": 42000,
    "reorderLevel": 25,
    "status": "ACTIVE",
    "description": "Bút gel ký tên khô nhanh không lem",
    "categoryId": 1,
    "categoryName": "Bút viết các loại",
    "brandId": 5,
    "brandName": "Pentel",
    "brandOrigin": "Nhật Bản",
    "unitId": 1,
    "unitName": "Cây",
    "unitSymbol": "cây"
  },
  {
    "_id": 6,
    "sku": "SKU-PT-002",
    "barcode": "8935001800066",
    "productName": "Bút chì bấm Pentel Fiesta AX105",
    "specification": "Cây, ngòi 0.5mm",
    "salePrice": 25000,
    "reorderLevel": 30,
    "status": "ACTIVE",
    "description": "Bút chì kim thân nhựa bền đẹp",
    "categoryId": 1,
    "categoryName": "Bút viết các loại",
    "brandId": 5,
    "brandName": "Pentel",
    "brandOrigin": "Nhật Bản",
    "unitId": 1,
    "unitName": "Cây",
    "unitSymbol": "cây"
  },
  {
    "_id": 7,
    "sku": "SKU-DL-001",
    "barcode": "8935001800073",
    "productName": "Bút chì gỗ Deli 2B Có Tẩy",
    "specification": "Hộp 12 cây",
    "salePrice": 48000,
    "reorderLevel": 20,
    "status": "ACTIVE",
    "description": "Bút chì gỗ 2B chuyên dụng viết và tô trắc nghiệm",
    "categoryId": 1,
    "categoryName": "Bút viết các loại",
    "brandId": 4,
    "brandName": "Deli",
    "brandOrigin": "Trung Quốc",
    "unitId": 2,
    "unitName": "Hộp",
    "unitSymbol": "hộp"
  },
  {
    "_id": 8,
    "sku": "SKU-DA-001",
    "barcode": "8935001800080",
    "productName": "Giấy in văn phòng Double A A4 80gsm",
    "specification": "Ream 500 tờ",
    "salePrice": 92000,
    "reorderLevel": 40,
    "status": "ACTIVE",
    "description": "Giấy in A4 độ trắng cao chống kẹt giấy",
    "categoryId": 2,
    "categoryName": "Giấy in & Sổ tập",
    "brandId": 2,
    "brandName": "Double A",
    "brandOrigin": "Thái Lan",
    "unitId": 3,
    "unitName": "Ream",
    "unitSymbol": "ream"
  },
  {
    "_id": 9,
    "sku": "SKU-DA-002",
    "barcode": "8935001800097",
    "productName": "Giấy in văn phòng Double A A4 70gsm",
    "specification": "Ream 500 tờ",
    "salePrice": 82000,
    "reorderLevel": 40,
    "status": "ACTIVE",
    "description": "Giấy in A4 70gsm tiết kiệm chi phí văn phòng",
    "categoryId": 2,
    "categoryName": "Giấy in & Sổ tập",
    "brandId": 2,
    "brandName": "Double A",
    "brandOrigin": "Thái Lan",
    "unitId": 3,
    "unitName": "Ream",
    "unitSymbol": "ream"
  },
  {
    "_id": 10,
    "sku": "SKU-IK-001",
    "barcode": "8935001800103",
    "productName": "Giấy in IK Plus A4 70gsm",
    "specification": "Ream 500 tờ",
    "salePrice": 78000,
    "reorderLevel": 40,
    "status": "ACTIVE",
    "description": "Giấy in nhập khẩu Indonesia láng mịn",
    "categoryId": 2,
    "categoryName": "Giấy in & Sổ tập",
    "brandId": 8,
    "brandName": "IK Plus",
    "brandOrigin": "Indonesia",
    "unitId": 3,
    "unitName": "Ream",
    "unitSymbol": "ream"
  },
  {
    "_id": 11,
    "sku": "SKU-IK-002",
    "barcode": "8935001800110",
    "productName": "Giấy in IK Plus A5 70gsm",
    "specification": "Ream 500 tờ",
    "salePrice": 42000,
    "reorderLevel": 25,
    "status": "ACTIVE",
    "description": "Giấy in khổ A5 dùng in phiếu thu chi hóa đơn",
    "categoryId": 2,
    "categoryName": "Giấy in & Sổ tập",
    "brandId": 8,
    "brandName": "IK Plus",
    "brandOrigin": "Indonesia",
    "unitId": 3,
    "unitName": "Ream",
    "unitSymbol": "ream"
  },
  {
    "_id": 12,
    "sku": "SKU-HH-001",
    "barcode": "8935001800127",
    "productName": "Sổ lò xo Hồng Hà B5 120 trang",
    "specification": "Cuốn, định lượng 70gsm",
    "salePrice": 28000,
    "reorderLevel": 30,
    "status": "ACTIVE",
    "description": "Sổ lò xo ghi chép cuộc họp tiện lợi",
    "categoryId": 2,
    "categoryName": "Giấy in & Sổ tập",
    "brandId": 10,
    "brandName": "Hồng Hà",
    "brandOrigin": "Việt Nam",
    "unitId": 4,
    "unitName": "Cuốn",
    "unitSymbol": "cuốn"
  },
  {
    "_id": 13,
    "sku": "SKU-HH-002",
    "barcode": "8935001800134",
    "productName": "Sổ bìa da Hồng Hà A5 200 trang",
    "specification": "Cuốn bìa cứng",
    "salePrice": 55000,
    "reorderLevel": 20,
    "status": "ACTIVE",
    "description": "Sổ tay bìa da sang trọng cho nhân viên văn phòng",
    "categoryId": 2,
    "categoryName": "Giấy in & Sổ tập",
    "brandId": 10,
    "brandName": "Hồng Hà",
    "brandOrigin": "Việt Nam",
    "unitId": 4,
    "unitName": "Cuốn",
    "unitSymbol": "cuốn"
  },
  {
    "_id": 14,
    "sku": "SKU-PL-001",
    "barcode": "8935001800141",
    "productName": "Giấy ghi chú Plus 3x3 inch Vàng",
    "specification": "Xấp 100 tờ",
    "salePrice": 15000,
    "reorderLevel": 50,
    "status": "ACTIVE",
    "description": "Giấy note tự dính bám chắc dễ bóc",
    "categoryId": 2,
    "categoryName": "Giấy in & Sổ tập",
    "brandId": 3,
    "brandName": "Plus",
    "brandOrigin": "Nhật Bản",
    "unitId": 6,
    "unitName": "Xấp",
    "unitSymbol": "xấp"
  },
  {
    "_id": 15,
    "sku": "SKU-KJ-001",
    "barcode": "8935001800158",
    "productName": "Bìa còng King Jim A4 5F (5cm)",
    "specification": "Cái, bìa simili xanh",
    "salePrice": 65000,
    "reorderLevel": 25,
    "status": "ACTIVE",
    "description": "Bìa còng bật lưu trữ tới 500 tờ A4",
    "categoryId": 3,
    "categoryName": "File hồ sơ & Lưu trữ",
    "brandId": 6,
    "brandName": "King Jim",
    "brandOrigin": "Nhật Bản",
    "unitId": 5,
    "unitName": "Cái",
    "unitSymbol": "cái"
  },
  {
    "_id": 16,
    "sku": "SKU-KJ-002",
    "barcode": "8935001800165",
    "productName": "Bìa còng King Jim A4 7F (7cm)",
    "specification": "Cái, bìa simili xanh",
    "salePrice": 68000,
    "reorderLevel": 25,
    "status": "ACTIVE",
    "description": "Bìa còng lớn lưu trữ chứng từ kế toán",
    "categoryId": 3,
    "categoryName": "File hồ sơ & Lưu trữ",
    "brandId": 6,
    "brandName": "King Jim",
    "brandOrigin": "Nhật Bản",
    "unitId": 5,
    "unitName": "Cái",
    "unitSymbol": "cái"
  },
  {
    "_id": 17,
    "sku": "SKU-TL-005",
    "barcode": "8935001800172",
    "productName": "Bìa nút Thiên Long FO-CBF01 A4",
    "specification": "Xấp 12 cái, nhựa trong",
    "salePrice": 42000,
    "reorderLevel": 30,
    "status": "ACTIVE",
    "description": "Bìa nút nhựa PP bền dẻo đựng tài liệu",
    "categoryId": 3,
    "categoryName": "File hồ sơ & Lưu trữ",
    "brandId": 1,
    "brandName": "Thiên Long",
    "brandOrigin": "Việt Nam",
    "unitId": 6,
    "unitName": "Xấp",
    "unitSymbol": "xấp"
  },
  {
    "_id": 18,
    "sku": "SKU-TL-006",
    "barcode": "8935001800189",
    "productName": "Bìa lá Thiên Long FO-CH01 A4",
    "specification": "Xấp 12 cái",
    "salePrice": 36000,
    "reorderLevel": 30,
    "status": "ACTIVE",
    "description": "Bìa lá trong suốt kẹp nhanh hồ sơ",
    "categoryId": 3,
    "categoryName": "File hồ sơ & Lưu trữ",
    "brandId": 1,
    "brandName": "Thiên Long",
    "brandOrigin": "Việt Nam",
    "unitId": 6,
    "unitName": "Xấp",
    "unitSymbol": "xấp"
  },
  {
    "_id": 19,
    "sku": "SKU-KK-001",
    "barcode": "8935001800196",
    "productName": "Bìa trình ký đơn Kokuyo A4",
    "specification": "Cái, nhựa cứng cao cấp",
    "salePrice": 45000,
    "reorderLevel": 20,
    "status": "ACTIVE",
    "description": "Bìa trình ký kẹp inox chắc chắn",
    "categoryId": 3,
    "categoryName": "File hồ sơ & Lưu trữ",
    "brandId": 9,
    "brandName": "Kokuyo",
    "brandOrigin": "Nhật Bản",
    "unitId": 5,
    "unitName": "Cái",
    "unitSymbol": "cái"
  },
  {
    "_id": 20,
    "sku": "SKU-DL-002",
    "barcode": "8935001800202",
    "productName": "Khay kệ hồ sơ 3 tầng Deli 9181",
    "specification": "Cái, lưới sắt sơn tĩnh điện",
    "salePrice": 145000,
    "reorderLevel": 10,
    "status": "ACTIVE",
    "description": "Kệ tài liệu 3 tầng để bàn gọn gàng",
    "categoryId": 3,
    "categoryName": "File hồ sơ & Lưu trữ",
    "brandId": 4,
    "brandName": "Deli",
    "brandOrigin": "Trung Quốc",
    "unitId": 5,
    "unitName": "Cái",
    "unitSymbol": "cái"
  },
  {
    "_id": 21,
    "sku": "SKU-PL-002",
    "barcode": "8935001800219",
    "productName": "Bấm kim số 10 Plus ST-010E",
    "specification": "Cái, kèm gỡ kim",
    "salePrice": 38000,
    "reorderLevel": 25,
    "status": "ACTIVE",
    "description": "Bấm kim trợ lực nhẹ nhàng bấm tối đa 20 tờ",
    "categoryId": 4,
    "categoryName": "Dụng cụ văn phòng",
    "brandId": 3,
    "brandName": "Plus",
    "brandOrigin": "Nhật Bản",
    "unitId": 5,
    "unitName": "Cái",
    "unitSymbol": "cái"
  },
  {
    "_id": 22,
    "sku": "SKU-PL-003",
    "barcode": "8935001800226",
    "productName": "Kim bấm số 10 Plus",
    "specification": "Hộp lớn 20 hộp nhỏ",
    "salePrice": 60000,
    "reorderLevel": 20,
    "status": "ACTIVE",
    "description": "Kim bấm thép không gỉ sắc bén",
    "categoryId": 4,
    "categoryName": "Dụng cụ văn phòng",
    "brandId": 3,
    "brandName": "Plus",
    "brandOrigin": "Nhật Bản",
    "unitId": 2,
    "unitName": "Hộp",
    "unitSymbol": "hộp"
  },
  {
    "_id": 23,
    "sku": "SKU-DL-003",
    "barcode": "8935001800233",
    "productName": "Kẹp bướm Deli 19mm (Hộp 12 cái)",
    "specification": "Hộp 12 cái",
    "salePrice": 16000,
    "reorderLevel": 40,
    "status": "ACTIVE",
    "description": "Kẹp sắt đàn hồi tốt giữ chặt giấy tờ",
    "categoryId": 4,
    "categoryName": "Dụng cụ văn phòng",
    "brandId": 4,
    "brandName": "Deli",
    "brandOrigin": "Trung Quốc",
    "unitId": 2,
    "unitName": "Hộp",
    "unitSymbol": "hộp"
  },
  {
    "_id": 24,
    "sku": "SKU-DL-004",
    "barcode": "8935001800240",
    "productName": "Kéo văn phòng Deli 6027 (170mm)",
    "specification": "Cái, lưỡi thép không gỉ",
    "salePrice": 26000,
    "reorderLevel": 25,
    "status": "ACTIVE",
    "description": "Kéo cắt giấy sắc bén tay cầm êm",
    "categoryId": 4,
    "categoryName": "Dụng cụ văn phòng",
    "brandId": 4,
    "brandName": "Deli",
    "brandOrigin": "Trung Quốc",
    "unitId": 5,
    "unitName": "Cái",
    "unitSymbol": "cái"
  },
  {
    "_id": 25,
    "sku": "SKU-PL-004",
    "barcode": "8935001800257",
    "productName": "Băng xóa kéo Plus WH-605 (5mm x 6m)",
    "specification": "Cái",
    "salePrice": 29000,
    "reorderLevel": 30,
    "status": "ACTIVE",
    "description": "Bút xóa kéo đè lên viết ngay không lem",
    "categoryId": 4,
    "categoryName": "Dụng cụ văn phòng",
    "brandId": 3,
    "brandName": "Plus",
    "brandOrigin": "Nhật Bản",
    "unitId": 5,
    "unitName": "Cái",
    "unitSymbol": "cái"
  },
  {
    "_id": 26,
    "sku": "SKU-DL-005",
    "barcode": "8935001800264",
    "productName": "Dao rọc giấy Deli 2034 Lưỡi 9mm",
    "specification": "Cái, khóa tự động",
    "salePrice": 18000,
    "reorderLevel": 30,
    "status": "ACTIVE",
    "description": "Dao rọc giấy nhỏ gọn an toàn",
    "categoryId": 4,
    "categoryName": "Dụng cụ văn phòng",
    "brandId": 4,
    "brandName": "Deli",
    "brandOrigin": "Trung Quốc",
    "unitId": 5,
    "unitName": "Cái",
    "unitSymbol": "cái"
  },
  {
    "_id": 27,
    "sku": "SKU-TL-007",
    "barcode": "8935001800271",
    "productName": "Băng keo trong văn phòng 1.8cm",
    "specification": "Cuộn nhỏ",
    "salePrice": 8000,
    "reorderLevel": 50,
    "status": "ACTIVE",
    "description": "Băng keo dán giấy trong suốt độ dính cao",
    "categoryId": 4,
    "categoryName": "Dụng cụ văn phòng",
    "brandId": 1,
    "brandName": "Thiên Long",
    "brandOrigin": "Việt Nam",
    "unitId": 7,
    "unitName": "Cuộn",
    "unitSymbol": "cuộn"
  },
  {
    "_id": 28,
    "sku": "SKU-CS-001",
    "barcode": "8935001800288",
    "productName": "Máy tính để bàn Casio AX-120B (12 số)",
    "specification": "Cái, màn hình nghiêng",
    "salePrice": 295000,
    "reorderLevel": 10,
    "status": "ACTIVE",
    "description": "Máy tính văn phòng kế toán chính hãng",
    "categoryId": 5,
    "categoryName": "Thiết bị & Phụ kiện VP",
    "brandId": 7,
    "brandName": "Casio",
    "brandOrigin": "Nhật Bản",
    "unitId": 5,
    "unitName": "Cái",
    "unitSymbol": "cái"
  },
  {
    "_id": 29,
    "sku": "SKU-DL-006",
    "barcode": "8935001800295",
    "productName": "Máy bấm lỗ giấy Deli 0102 (12 tờ)",
    "specification": "Cái, 2 lỗ tiêu chuẩn",
    "salePrice": 52000,
    "reorderLevel": 15,
    "status": "ACTIVE",
    "description": "Đục lỗ giấy lưu bìa còng chính xác",
    "categoryId": 5,
    "categoryName": "Thiết bị & Phụ kiện VP",
    "brandId": 4,
    "brandName": "Deli",
    "brandOrigin": "Trung Quốc",
    "unitId": 5,
    "unitName": "Cái",
    "unitSymbol": "cái"
  },
  {
    "_id": 30,
    "sku": "SKU-KK-002",
    "barcode": "8935001800301",
    "productName": "Hộp cắm bút để bàn Kokuyo Đa Năng",
    "specification": "Cái, nhựa ABS",
    "salePrice": 75000,
    "reorderLevel": 15,
    "status": "ACTIVE",
    "description": "Ống cắm bút chia ngăn tiện lợi",
    "categoryId": 5,
    "categoryName": "Thiết bị & Phụ kiện VP",
    "brandId": 9,
    "brandName": "Kokuyo",
    "brandOrigin": "Nhật Bản",
    "unitId": 5,
    "unitName": "Cái",
    "unitSymbol": "cái"
  }
]);

// 8. Inventories (30 bản ghi tồn kho 1:1 với sản phẩm)
db.inventories.insertMany([
  {
    "_id": 1,
    "productId": 1,
    "quantityOnHand": 168,
    "lastUpdated": new Date("2026-10-30T18:00:00Z")
  },
  {
    "_id": 2,
    "productId": 2,
    "quantityOnHand": 151,
    "lastUpdated": new Date("2026-10-30T18:00:00Z")
  },
  {
    "_id": 3,
    "productId": 3,
    "quantityOnHand": 120,
    "lastUpdated": new Date("2026-10-30T18:00:00Z")
  },
  {
    "_id": 4,
    "productId": 4,
    "quantityOnHand": 142,
    "lastUpdated": new Date("2026-10-30T18:00:00Z")
  },
  {
    "_id": 5,
    "productId": 5,
    "quantityOnHand": 80,
    "lastUpdated": new Date("2026-10-30T18:00:00Z")
  },
  {
    "_id": 6,
    "productId": 6,
    "quantityOnHand": 107,
    "lastUpdated": new Date("2026-10-30T18:00:00Z")
  },
  {
    "_id": 7,
    "productId": 7,
    "quantityOnHand": 88,
    "lastUpdated": new Date("2026-10-30T18:00:00Z")
  },
  {
    "_id": 8,
    "productId": 8,
    "quantityOnHand": 216,
    "lastUpdated": new Date("2026-10-30T18:00:00Z")
  },
  {
    "_id": 9,
    "productId": 9,
    "quantityOnHand": 209,
    "lastUpdated": new Date("2026-10-30T18:00:00Z")
  },
  {
    "_id": 10,
    "productId": 10,
    "quantityOnHand": 201,
    "lastUpdated": new Date("2026-10-30T18:00:00Z")
  },
  {
    "_id": 11,
    "productId": 11,
    "quantityOnHand": 98,
    "lastUpdated": new Date("2026-10-30T18:00:00Z")
  },
  {
    "_id": 12,
    "productId": 12,
    "quantityOnHand": 92,
    "lastUpdated": new Date("2026-10-30T18:00:00Z")
  },
  {
    "_id": 13,
    "productId": 13,
    "quantityOnHand": 75,
    "lastUpdated": new Date("2026-10-30T18:00:00Z")
  },
  {
    "_id": 14,
    "productId": 14,
    "quantityOnHand": 220,
    "lastUpdated": new Date("2026-10-30T18:00:00Z")
  },
  {
    "_id": 15,
    "productId": 15,
    "quantityOnHand": 119,
    "lastUpdated": new Date("2026-10-30T18:00:00Z")
  },
  {
    "_id": 16,
    "productId": 16,
    "quantityOnHand": 70,
    "lastUpdated": new Date("2026-10-30T18:00:00Z")
  },
  {
    "_id": 17,
    "productId": 17,
    "quantityOnHand": 88,
    "lastUpdated": new Date("2026-10-30T18:00:00Z")
  },
  {
    "_id": 18,
    "productId": 18,
    "quantityOnHand": 85,
    "lastUpdated": new Date("2026-10-30T18:00:00Z")
  },
  {
    "_id": 19,
    "productId": 19,
    "quantityOnHand": 67,
    "lastUpdated": new Date("2026-10-30T18:00:00Z")
  },
  {
    "_id": 20,
    "productId": 20,
    "quantityOnHand": 46,
    "lastUpdated": new Date("2026-10-30T18:00:00Z")
  },
  {
    "_id": 21,
    "productId": 21,
    "quantityOnHand": 83,
    "lastUpdated": new Date("2026-10-30T18:00:00Z")
  },
  {
    "_id": 22,
    "productId": 22,
    "quantityOnHand": 87,
    "lastUpdated": new Date("2026-10-30T18:00:00Z")
  },
  {
    "_id": 23,
    "productId": 23,
    "quantityOnHand": 185,
    "lastUpdated": new Date("2026-10-30T18:00:00Z")
  },
  {
    "_id": 24,
    "productId": 24,
    "quantityOnHand": 82,
    "lastUpdated": new Date("2026-10-30T18:00:00Z")
  },
  {
    "_id": 25,
    "productId": 25,
    "quantityOnHand": 98,
    "lastUpdated": new Date("2026-10-30T18:00:00Z")
  },
  {
    "_id": 26,
    "productId": 26,
    "quantityOnHand": 108,
    "lastUpdated": new Date("2026-10-30T18:00:00Z")
  },
  {
    "_id": 27,
    "productId": 27,
    "quantityOnHand": 180,
    "lastUpdated": new Date("2026-10-30T18:00:00Z")
  },
  {
    "_id": 28,
    "productId": 28,
    "quantityOnHand": 43,
    "lastUpdated": new Date("2026-10-30T18:00:00Z")
  },
  {
    "_id": 29,
    "productId": 29,
    "quantityOnHand": 59,
    "lastUpdated": new Date("2026-10-30T18:00:00Z")
  },
  {
    "_id": 30,
    "productId": 30,
    "quantityOnHand": 55,
    "lastUpdated": new Date("2026-10-30T18:00:00Z")
  }
]);

// 9. Purchase Receipts (10 phiếu nhập kho kèm 40 dòng chi tiết nhúng trong items[])
db.purchaseReceipts.insertMany([
  {
    "_id": 1,
    "purchaseDate": new Date("2026-10-01T08:30:00Z"),
    "status": "CONFIRMED",
    "note": "Nhập lô bút Thiên Long đầu tháng 10",
    "supplierId": 1,
    "supplierName": "Công ty CP Tập đoàn Thiên Long",
    "createdBy": 1,
    "createdByName": "Võ Thành Long",
    "totalAmount": 28060000,
    "items": [
      {
        "productId": 1,
        "sku": "SKU-TL-001",
        "productName": "Bút bi Thiên Long TL-027 Xanh",
        "quantity": 120,
        "unitPrice": 68000,
        "lineTotal": 8160000
      },
      {
        "productId": 2,
        "sku": "SKU-TL-002",
        "productName": "Bút gel Thiên Long Gel-08 Đen",
        "quantity": 100,
        "unitPrice": 62000,
        "lineTotal": 6200000
      },
      {
        "productId": 3,
        "sku": "SKU-TL-003",
        "productName": "Bút lông bảng Thiên Long WB-03 Xanh",
        "quantity": 80,
        "unitPrice": 80000,
        "lineTotal": 6400000
      },
      {
        "productId": 4,
        "sku": "SKU-TL-004",
        "productName": "Bút dạ quang Thiên Long HL-03 Vàng",
        "quantity": 90,
        "unitPrice": 70000,
        "lineTotal": 6300000
      },
      {
        "productId": 27,
        "sku": "SKU-TL-007",
        "productName": "Băng keo trong văn phòng 1.8cm",
        "quantity": 200,
        "unitPrice": 5000,
        "lineTotal": 1000000
      }
    ]
  },
  {
    "_id": 2,
    "purchaseDate": new Date("2026-10-03T09:15:00Z"),
    "status": "CONFIRMED",
    "note": "Nhập giấy in Double A và IK Plus",
    "supplierId": 3,
    "supplierName": "Công ty TNHH Thương Mại Giấy & VPP Á Châu",
    "createdBy": 2,
    "createdByName": "Trần Quốc Tuấn",
    "totalAmount": 33990000,
    "items": [
      {
        "productId": 8,
        "sku": "SKU-DA-001",
        "productName": "Giấy in văn phòng Double A A4 80gsm",
        "quantity": 150,
        "unitPrice": 75000,
        "lineTotal": 11250000
      },
      {
        "productId": 9,
        "sku": "SKU-DA-002",
        "productName": "Giấy in văn phòng Double A A4 70gsm",
        "quantity": 150,
        "unitPrice": 66000,
        "lineTotal": 9900000
      },
      {
        "productId": 10,
        "sku": "SKU-IK-001",
        "productName": "Giấy in IK Plus A4 70gsm",
        "quantity": 120,
        "unitPrice": 62000,
        "lineTotal": 7440000
      },
      {
        "productId": 11,
        "sku": "SKU-IK-002",
        "productName": "Giấy in IK Plus A5 70gsm",
        "quantity": 100,
        "unitPrice": 32000,
        "lineTotal": 3200000
      },
      {
        "productId": 12,
        "sku": "SKU-HH-001",
        "productName": "Sổ lò xo Hồng Hà B5 120 trang",
        "quantity": 110,
        "unitPrice": 20000,
        "lineTotal": 2200000
      }
    ]
  },
  {
    "_id": 3,
    "purchaseDate": new Date("2026-10-06T10:00:00Z"),
    "status": "CONFIRMED",
    "note": "Nhập văn phòng phẩm Plus và King Jim",
    "supplierId": 2,
    "supplierName": "Công ty TNHH Quốc Tế Văn Phòng Phẩm Plus Việt Nam",
    "createdBy": 3,
    "createdByName": "Lê Minh Tâm",
    "totalAmount": 11870000,
    "items": [
      {
        "productId": 14,
        "sku": "SKU-PL-001",
        "productName": "Giấy ghi chú Plus 3x3 inch Vàng",
        "quantity": 160,
        "unitPrice": 10000,
        "lineTotal": 1600000
      },
      {
        "productId": 15,
        "sku": "SKU-KJ-001",
        "productName": "Bìa còng King Jim A4 5F (5cm)",
        "quantity": 80,
        "unitPrice": 48000,
        "lineTotal": 3840000
      },
      {
        "productId": 16,
        "sku": "SKU-KJ-002",
        "productName": "Bìa còng King Jim A4 7F (7cm)",
        "quantity": 80,
        "unitPrice": 50000,
        "lineTotal": 4000000
      },
      {
        "productId": 21,
        "sku": "SKU-PL-002",
        "productName": "Bấm kim số 10 Plus ST-010E",
        "quantity": 90,
        "unitPrice": 27000,
        "lineTotal": 2430000
      }
    ]
  },
  {
    "_id": 4,
    "purchaseDate": new Date("2026-10-09T14:20:00Z"),
    "status": "CONFIRMED",
    "note": "Nhập dụng cụ văn phòng Deli đợt 1",
    "supplierId": 4,
    "supplierName": "Công ty CP Phân Phối Văn Phòng Phẩm Deli Miền Nam",
    "createdBy": 1,
    "createdByName": "Võ Thành Long",
    "totalAmount": 7880000,
    "items": [
      {
        "productId": 7,
        "sku": "SKU-DL-001",
        "productName": "Bút chì gỗ Deli 2B Có Tẩy",
        "quantity": 100,
        "unitPrice": 34000,
        "lineTotal": 3400000
      },
      {
        "productId": 23,
        "sku": "SKU-DL-003",
        "productName": "Kẹp bướm Deli 19mm (Hộp 12 cái)",
        "quantity": 140,
        "unitPrice": 11000,
        "lineTotal": 1540000
      },
      {
        "productId": 24,
        "sku": "SKU-DL-004",
        "productName": "Kéo văn phòng Deli 6027 (170mm)",
        "quantity": 90,
        "unitPrice": 18000,
        "lineTotal": 1620000
      },
      {
        "productId": 26,
        "sku": "SKU-DL-005",
        "productName": "Dao rọc giấy Deli 2034 Lưỡi 9mm",
        "quantity": 110,
        "unitPrice": 12000,
        "lineTotal": 1320000
      }
    ]
  },
  {
    "_id": 5,
    "purchaseDate": new Date("2026-10-12T08:45:00Z"),
    "status": "CONFIRMED",
    "note": "Nhập thiết bị Casio, bút ký Pentel và Kokuyo",
    "supplierId": 5,
    "supplierName": "Công ty CP Xuất Nhập Khẩu Thiết Bị Văn Phòng Sao Khuê",
    "createdBy": 4,
    "createdByName": "Phạm Hồng Phúc",
    "totalAmount": 17205000,
    "items": [
      {
        "productId": 5,
        "sku": "SKU-PT-001",
        "productName": "Bút ký cao cấp Pentel EnerGel BLN75",
        "quantity": 90,
        "unitPrice": 30000,
        "lineTotal": 2700000
      },
      {
        "productId": 6,
        "sku": "SKU-PT-002",
        "productName": "Bút chì bấm Pentel Fiesta AX105",
        "quantity": 110,
        "unitPrice": 18000,
        "lineTotal": 1980000
      },
      {
        "productId": 19,
        "sku": "SKU-KK-001",
        "productName": "Bìa trình ký đơn Kokuyo A4",
        "quantity": 75,
        "unitPrice": 32000,
        "lineTotal": 2400000
      },
      {
        "productId": 28,
        "sku": "SKU-CS-001",
        "productName": "Máy tính để bàn Casio AX-120B (12 số)",
        "quantity": 45,
        "unitPrice": 225000,
        "lineTotal": 10125000
      }
    ]
  },
  {
    "_id": 6,
    "purchaseDate": new Date("2026-10-15T11:10:00Z"),
    "status": "CONFIRMED",
    "note": "Nhập sổ tập Hồng Hà và giấy in A5",
    "supplierId": 3,
    "supplierName": "Công ty TNHH Thương Mại Giấy & VPP Á Châu",
    "createdBy": 2,
    "createdByName": "Trần Quốc Tuấn",
    "totalAmount": 17480000,
    "items": [
      {
        "productId": 13,
        "sku": "SKU-HH-002",
        "productName": "Sổ bìa da Hồng Hà A5 200 trang",
        "quantity": 85,
        "unitPrice": 40000,
        "lineTotal": 3400000
      },
      {
        "productId": 30,
        "sku": "SKU-KK-002",
        "productName": "Hộp cắm bút để bàn Kokuyo Đa Năng",
        "quantity": 60,
        "unitPrice": 52000,
        "lineTotal": 3120000
      },
      {
        "productId": 8,
        "sku": "SKU-DA-001",
        "productName": "Giấy in văn phòng Double A A4 80gsm",
        "quantity": 80,
        "unitPrice": 75000,
        "lineTotal": 6000000
      },
      {
        "productId": 10,
        "sku": "SKU-IK-001",
        "productName": "Giấy in IK Plus A4 70gsm",
        "quantity": 80,
        "unitPrice": 62000,
        "lineTotal": 4960000
      }
    ]
  },
  {
    "_id": 7,
    "purchaseDate": new Date("2026-10-18T15:30:00Z"),
    "status": "CONFIRMED",
    "note": "Nhập bổ sung bìa hồ sơ Thiên Long",
    "supplierId": 1,
    "supplierName": "Công ty CP Tập đoàn Thiên Long",
    "createdBy": 3,
    "createdByName": "Lê Minh Tâm",
    "totalAmount": 13400000,
    "items": [
      {
        "productId": 17,
        "sku": "SKU-TL-005",
        "productName": "Bìa nút Thiên Long FO-CBF01 A4",
        "quantity": 100,
        "unitPrice": 30000,
        "lineTotal": 3000000
      },
      {
        "productId": 18,
        "sku": "SKU-TL-006",
        "productName": "Bìa lá Thiên Long FO-CH01 A4",
        "quantity": 100,
        "unitPrice": 26000,
        "lineTotal": 2600000
      },
      {
        "productId": 1,
        "sku": "SKU-TL-001",
        "productName": "Bút bi Thiên Long TL-027 Xanh",
        "quantity": 60,
        "unitPrice": 68000,
        "lineTotal": 4080000
      },
      {
        "productId": 2,
        "sku": "SKU-TL-002",
        "productName": "Bút gel Thiên Long Gel-08 Đen",
        "quantity": 60,
        "unitPrice": 62000,
        "lineTotal": 3720000
      }
    ]
  },
  {
    "_id": 8,
    "purchaseDate": new Date("2026-10-21T09:00:00Z"),
    "status": "CONFIRMED",
    "note": "Nhập bổ sung bấm kim, xóa kéo Plus",
    "supplierId": 2,
    "supplierName": "Công ty TNHH Quốc Tế Văn Phòng Phẩm Plus Việt Nam",
    "createdBy": 1,
    "createdByName": "Võ Thành Long",
    "totalAmount": 9580000,
    "items": [
      {
        "productId": 22,
        "sku": "SKU-PL-003",
        "productName": "Kim bấm số 10 Plus",
        "quantity": 95,
        "unitPrice": 44000,
        "lineTotal": 4180000
      },
      {
        "productId": 25,
        "sku": "SKU-PL-004",
        "productName": "Băng xóa kéo Plus WH-605 (5mm x 6m)",
        "quantity": 110,
        "unitPrice": 20000,
        "lineTotal": 2200000
      },
      {
        "productId": 14,
        "sku": "SKU-PL-001",
        "productName": "Giấy ghi chú Plus 3x3 inch Vàng",
        "quantity": 80,
        "unitPrice": 10000,
        "lineTotal": 800000
      },
      {
        "productId": 15,
        "sku": "SKU-KJ-001",
        "productName": "Bìa còng King Jim A4 5F (5cm)",
        "quantity": 50,
        "unitPrice": 48000,
        "lineTotal": 2400000
      }
    ]
  },
  {
    "_id": 9,
    "purchaseDate": new Date("2026-10-25T13:45:00Z"),
    "status": "CONFIRMED",
    "note": "Nhập khay kệ hồ sơ và máy bấm lỗ Deli",
    "supplierId": 4,
    "supplierName": "Công ty CP Phân Phối Văn Phòng Phẩm Deli Miền Nam",
    "createdBy": 4,
    "createdByName": "Phạm Hồng Phúc",
    "totalAmount": 8315000,
    "items": [
      {
        "productId": 20,
        "sku": "SKU-DL-002",
        "productName": "Khay kệ hồ sơ 3 tầng Deli 9181",
        "quantity": 50,
        "unitPrice": 105000,
        "lineTotal": 5250000
      },
      {
        "productId": 29,
        "sku": "SKU-DL-006",
        "productName": "Máy bấm lỗ giấy Deli 0102 (12 tờ)",
        "quantity": 65,
        "unitPrice": 37000,
        "lineTotal": 2405000
      },
      {
        "productId": 23,
        "sku": "SKU-DL-003",
        "productName": "Kẹp bướm Deli 19mm (Hộp 12 cái)",
        "quantity": 60,
        "unitPrice": 11000,
        "lineTotal": 660000
      }
    ]
  },
  {
    "_id": 10,
    "purchaseDate": new Date("2026-10-28T16:00:00Z"),
    "status": "CONFIRMED",
    "note": "Nhập bổ sung giấy in và bút viết cuối tháng",
    "supplierId": 1,
    "supplierName": "Công ty CP Tập đoàn Thiên Long",
    "createdBy": 2,
    "createdByName": "Trần Quốc Tuấn",
    "totalAmount": 12120000,
    "items": [
      {
        "productId": 3,
        "sku": "SKU-TL-003",
        "productName": "Bút lông bảng Thiên Long WB-03 Xanh",
        "quantity": 50,
        "unitPrice": 80000,
        "lineTotal": 4000000
      },
      {
        "productId": 4,
        "sku": "SKU-TL-004",
        "productName": "Bút dạ quang Thiên Long HL-03 Vàng",
        "quantity": 50,
        "unitPrice": 70000,
        "lineTotal": 3500000
      },
      {
        "productId": 9,
        "sku": "SKU-DA-002",
        "productName": "Giấy in văn phòng Double A A4 70gsm",
        "quantity": 70,
        "unitPrice": 66000,
        "lineTotal": 4620000
      }
    ]
  }
]);

// 10. Sales Invoices (10 hóa đơn bán kèm 25 dòng chi tiết nhúng trong items[])
db.salesInvoices.insertMany([
  {
    "_id": 1,
    "createdAt": new Date("2026-10-02T10:15:00Z"),
    "status": "CONFIRMED",
    "paymentMethod": "CASH",
    "discount": 0,
    "customerId": 1,
    "customerName": "Nguyễn Văn An",
    "cashierId": 5,
    "cashierName": "Đặng Ngọc Lan",
    "subtotalAmount": 1700000,
    "totalAmount": 1700000,
    "items": [
      {
        "productId": 1,
        "sku": "SKU-TL-001",
        "productName": "Bút bi Thiên Long TL-027 Xanh",
        "quantity": 10,
        "unitPrice": 90000,
        "lineDiscount": 0,
        "lineTotal": 900000
      },
      {
        "productId": 2,
        "sku": "SKU-TL-002",
        "productName": "Bút gel Thiên Long Gel-08 Đen",
        "quantity": 8,
        "unitPrice": 85000,
        "lineDiscount": 0,
        "lineTotal": 680000
      },
      {
        "productId": 27,
        "sku": "SKU-TL-007",
        "productName": "Băng keo trong văn phòng 1.8cm",
        "quantity": 15,
        "unitPrice": 8000,
        "lineDiscount": 0,
        "lineTotal": 120000
      }
    ]
  },
  {
    "_id": 2,
    "createdAt": new Date("2026-10-04T14:30:00Z"),
    "status": "CONFIRMED",
    "paymentMethod": "BANK_TRANSFER",
    "discount": 15000,
    "customerId": 2,
    "customerName": "Trần Thị Bình",
    "cashierId": 6,
    "cashierName": "Nguyễn Thu Hương",
    "subtotalAmount": 2329000,
    "totalAmount": 2314000,
    "items": [
      {
        "productId": 8,
        "sku": "SKU-DA-001",
        "productName": "Giấy in văn phòng Double A A4 80gsm",
        "quantity": 12,
        "unitPrice": 92000,
        "lineDiscount": 10000,
        "lineTotal": 1094000
      },
      {
        "productId": 9,
        "sku": "SKU-DA-002",
        "productName": "Giấy in văn phòng Double A A4 70gsm",
        "quantity": 10,
        "unitPrice": 82000,
        "lineDiscount": 5000,
        "lineTotal": 815000
      },
      {
        "productId": 12,
        "sku": "SKU-HH-001",
        "productName": "Sổ lò xo Hồng Hà B5 120 trang",
        "quantity": 15,
        "unitPrice": 28000,
        "lineDiscount": 0,
        "lineTotal": 420000
      }
    ]
  },
  {
    "_id": 3,
    "createdAt": new Date("2026-10-07T09:45:00Z"),
    "status": "CONFIRMED",
    "paymentMethod": "CARD",
    "discount": 10000,
    "customerId": 3,
    "customerName": "Lê Hoàng Châu",
    "cashierId": 7,
    "cashierName": "Bùi Thanh Trúc",
    "subtotalAmount": 1173000,
    "totalAmount": 1163000,
    "items": [
      {
        "productId": 14,
        "sku": "SKU-PL-001",
        "productName": "Giấy ghi chú Plus 3x3 inch Vàng",
        "quantity": 20,
        "unitPrice": 15000,
        "lineDiscount": 0,
        "lineTotal": 300000
      },
      {
        "productId": 15,
        "sku": "SKU-KJ-001",
        "productName": "Bìa còng King Jim A4 5F (5cm)",
        "quantity": 10,
        "unitPrice": 65000,
        "lineDiscount": 5000,
        "lineTotal": 645000
      },
      {
        "productId": 21,
        "sku": "SKU-PL-002",
        "productName": "Bấm kim số 10 Plus ST-010E",
        "quantity": 6,
        "unitPrice": 38000,
        "lineDiscount": 0,
        "lineTotal": 228000
      }
    ]
  },
  {
    "_id": 4,
    "createdAt": new Date("2026-10-10T16:10:00Z"),
    "status": "CONFIRMED",
    "paymentMethod": "CASH",
    "discount": 0,
    "customerId": 4,
    "customerName": "Phạm Minh Dũng",
    "cashierId": 8,
    "cashierName": "Đỗ Gia Hân",
    "subtotalAmount": 1024000,
    "totalAmount": 1024000,
    "items": [
      {
        "productId": 7,
        "sku": "SKU-DL-001",
        "productName": "Bút chì gỗ Deli 2B Có Tẩy",
        "quantity": 12,
        "unitPrice": 48000,
        "lineDiscount": 0,
        "lineTotal": 576000
      },
      {
        "productId": 23,
        "sku": "SKU-DL-003",
        "productName": "Kẹp bướm Deli 19mm (Hộp 12 cái)",
        "quantity": 15,
        "unitPrice": 16000,
        "lineDiscount": 0,
        "lineTotal": 240000
      },
      {
        "productId": 24,
        "sku": "SKU-DL-004",
        "productName": "Kéo văn phòng Deli 6027 (170mm)",
        "quantity": 8,
        "unitPrice": 26000,
        "lineDiscount": 0,
        "lineTotal": 208000
      }
    ]
  },
  {
    "_id": 5,
    "createdAt": new Date("2026-10-13T11:20:00Z"),
    "status": "CONFIRMED",
    "paymentMethod": "BANK_TRANSFER",
    "discount": 25000,
    "customerId": 5,
    "customerName": "Hoàng Gia Giang",
    "cashierId": 5,
    "cashierName": "Đặng Ngọc Lan",
    "subtotalAmount": 1645000,
    "totalAmount": 1620000,
    "items": [
      {
        "productId": 5,
        "sku": "SKU-PT-001",
        "productName": "Bút ký cao cấp Pentel EnerGel BLN75",
        "quantity": 10,
        "unitPrice": 42000,
        "lineDiscount": 5000,
        "lineTotal": 415000
      },
      {
        "productId": 28,
        "sku": "SKU-CS-001",
        "productName": "Máy tính để bàn Casio AX-120B (12 số)",
        "quantity": 3,
        "unitPrice": 295000,
        "lineDiscount": 15000,
        "lineTotal": 870000
      },
      {
        "productId": 19,
        "sku": "SKU-KK-001",
        "productName": "Bìa trình ký đơn Kokuyo A4",
        "quantity": 8,
        "unitPrice": 45000,
        "lineDiscount": 0,
        "lineTotal": 360000
      }
    ]
  },
  {
    "_id": 6,
    "createdAt": new Date("2026-10-16T15:05:00Z"),
    "status": "CONFIRMED",
    "paymentMethod": "CASH",
    "discount": 0,
    "customerId": 6,
    "customerName": "Huỳnh Ngọc Hà",
    "cashierId": 6,
    "cashierName": "Nguyễn Thu Hương",
    "subtotalAmount": 925000,
    "totalAmount": 925000,
    "items": [
      {
        "productId": 13,
        "sku": "SKU-HH-002",
        "productName": "Sổ bìa da Hồng Hà A5 200 trang",
        "quantity": 10,
        "unitPrice": 55000,
        "lineDiscount": 0,
        "lineTotal": 550000
      },
      {
        "productId": 30,
        "sku": "SKU-KK-002",
        "productName": "Hộp cắm bút để bàn Kokuyo Đa Năng",
        "quantity": 5,
        "unitPrice": 75000,
        "lineDiscount": 0,
        "lineTotal": 375000
      }
    ]
  },
  {
    "_id": 7,
    "createdAt": new Date("2026-10-19T10:50:00Z"),
    "status": "CONFIRMED",
    "paymentMethod": "CARD",
    "discount": 20000,
    "customerId": 7,
    "customerName": "Phan Thanh Hải",
    "cashierId": 7,
    "cashierName": "Bùi Thanh Trúc",
    "subtotalAmount": 1170000,
    "totalAmount": 1150000,
    "items": [
      {
        "productId": 17,
        "sku": "SKU-TL-005",
        "productName": "Bìa nút Thiên Long FO-CBF01 A4",
        "quantity": 15,
        "unitPrice": 42000,
        "lineDiscount": 0,
        "lineTotal": 630000
      },
      {
        "productId": 18,
        "sku": "SKU-TL-006",
        "productName": "Bìa lá Thiên Long FO-CH01 A4",
        "quantity": 15,
        "unitPrice": 36000,
        "lineDiscount": 0,
        "lineTotal": 540000
      }
    ]
  },
  {
    "_id": 8,
    "createdAt": new Date("2026-10-22T13:40:00Z"),
    "status": "CONFIRMED",
    "paymentMethod": "CASH",
    "discount": 5000,
    "customerId": 8,
    "customerName": "Vũ Đình Hạnh",
    "cashierId": 8,
    "cashierName": "Đỗ Gia Hân",
    "subtotalAmount": 828000,
    "totalAmount": 823000,
    "items": [
      {
        "productId": 22,
        "sku": "SKU-PL-003",
        "productName": "Kim bấm số 10 Plus",
        "quantity": 8,
        "unitPrice": 60000,
        "lineDiscount": 0,
        "lineTotal": 480000
      },
      {
        "productId": 25,
        "sku": "SKU-PL-004",
        "productName": "Băng xóa kéo Plus WH-605 (5mm x 6m)",
        "quantity": 12,
        "unitPrice": 29000,
        "lineDiscount": 0,
        "lineTotal": 348000
      }
    ]
  },
  {
    "_id": 9,
    "createdAt": new Date("2026-10-26T17:15:00Z"),
    "status": "CONFIRMED",
    "paymentMethod": "BANK_TRANSFER",
    "discount": 30000,
    "customerId": 9,
    "customerName": "Võ Thị Hiếu",
    "cashierId": 5,
    "cashierName": "Đặng Ngọc Lan",
    "subtotalAmount": 882000,
    "totalAmount": 852000,
    "items": [
      {
        "productId": 20,
        "sku": "SKU-DL-002",
        "productName": "Khay kệ hồ sơ 3 tầng Deli 9181",
        "quantity": 4,
        "unitPrice": 145000,
        "lineDiscount": 10000,
        "lineTotal": 570000
      },
      {
        "productId": 29,
        "sku": "SKU-DL-006",
        "productName": "Máy bấm lỗ giấy Deli 0102 (12 tờ)",
        "quantity": 6,
        "unitPrice": 52000,
        "lineDiscount": 0,
        "lineTotal": 312000
      }
    ]
  },
  {
    "_id": 10,
    "createdAt": new Date("2026-10-29T09:30:00Z"),
    "status": "CONFIRMED",
    "paymentMethod": "CARD",
    "discount": 10000,
    "customerId": 10,
    "customerName": "Đặng Quốc Hoàng",
    "cashierId": 6,
    "cashierName": "Nguyễn Thu Hương",
    "subtotalAmount": 1755000,
    "totalAmount": 1745000,
    "items": [
      {
        "productId": 3,
        "sku": "SKU-TL-003",
        "productName": "Bút lông bảng Thiên Long WB-03 Xanh",
        "quantity": 10,
        "unitPrice": 108000,
        "lineDiscount": 0,
        "lineTotal": 1080000
      },
      {
        "productId": 16,
        "sku": "SKU-KJ-002",
        "productName": "Bìa còng King Jim A4 7F (7cm)",
        "quantity": 10,
        "unitPrice": 68000,
        "lineDiscount": 5000,
        "lineTotal": 675000
      }
    ]
  }
]);

// 11. Stock Movements (80 biến động kho: 40 IN, 25 OUT, 15 ADJUST)
db.stockMovements.insertMany([
  {
    "_id": 1,
    "productId": 1,
    "movementType": "IN",
    "quantityChange": 120,
    "createdAt": new Date("2026-10-01T08:30:00Z"),
    "note": "Nhập kho theo phiếu nhập #1",
    "purchaseId": 1,
    "invoiceId": null,
    "adjustedBy": null
  },
  {
    "_id": 2,
    "productId": 2,
    "movementType": "IN",
    "quantityChange": 100,
    "createdAt": new Date("2026-10-01T08:30:00Z"),
    "note": "Nhập kho theo phiếu nhập #1",
    "purchaseId": 1,
    "invoiceId": null,
    "adjustedBy": null
  },
  {
    "_id": 3,
    "productId": 3,
    "movementType": "IN",
    "quantityChange": 80,
    "createdAt": new Date("2026-10-01T08:30:00Z"),
    "note": "Nhập kho theo phiếu nhập #1",
    "purchaseId": 1,
    "invoiceId": null,
    "adjustedBy": null
  },
  {
    "_id": 4,
    "productId": 4,
    "movementType": "IN",
    "quantityChange": 90,
    "createdAt": new Date("2026-10-01T08:30:00Z"),
    "note": "Nhập kho theo phiếu nhập #1",
    "purchaseId": 1,
    "invoiceId": null,
    "adjustedBy": null
  },
  {
    "_id": 5,
    "productId": 27,
    "movementType": "IN",
    "quantityChange": 200,
    "createdAt": new Date("2026-10-01T08:30:00Z"),
    "note": "Nhập kho theo phiếu nhập #1",
    "purchaseId": 1,
    "invoiceId": null,
    "adjustedBy": null
  },
  {
    "_id": 6,
    "productId": 8,
    "movementType": "IN",
    "quantityChange": 150,
    "createdAt": new Date("2026-10-03T09:15:00Z"),
    "note": "Nhập kho theo phiếu nhập #2",
    "purchaseId": 2,
    "invoiceId": null,
    "adjustedBy": null
  },
  {
    "_id": 7,
    "productId": 9,
    "movementType": "IN",
    "quantityChange": 150,
    "createdAt": new Date("2026-10-03T09:15:00Z"),
    "note": "Nhập kho theo phiếu nhập #2",
    "purchaseId": 2,
    "invoiceId": null,
    "adjustedBy": null
  },
  {
    "_id": 8,
    "productId": 10,
    "movementType": "IN",
    "quantityChange": 120,
    "createdAt": new Date("2026-10-03T09:15:00Z"),
    "note": "Nhập kho theo phiếu nhập #2",
    "purchaseId": 2,
    "invoiceId": null,
    "adjustedBy": null
  },
  {
    "_id": 9,
    "productId": 11,
    "movementType": "IN",
    "quantityChange": 100,
    "createdAt": new Date("2026-10-03T09:15:00Z"),
    "note": "Nhập kho theo phiếu nhập #2",
    "purchaseId": 2,
    "invoiceId": null,
    "adjustedBy": null
  },
  {
    "_id": 10,
    "productId": 12,
    "movementType": "IN",
    "quantityChange": 110,
    "createdAt": new Date("2026-10-03T09:15:00Z"),
    "note": "Nhập kho theo phiếu nhập #2",
    "purchaseId": 2,
    "invoiceId": null,
    "adjustedBy": null
  },
  {
    "_id": 11,
    "productId": 14,
    "movementType": "IN",
    "quantityChange": 160,
    "createdAt": new Date("2026-10-06T10:00:00Z"),
    "note": "Nhập kho theo phiếu nhập #3",
    "purchaseId": 3,
    "invoiceId": null,
    "adjustedBy": null
  },
  {
    "_id": 12,
    "productId": 15,
    "movementType": "IN",
    "quantityChange": 80,
    "createdAt": new Date("2026-10-06T10:00:00Z"),
    "note": "Nhập kho theo phiếu nhập #3",
    "purchaseId": 3,
    "invoiceId": null,
    "adjustedBy": null
  },
  {
    "_id": 13,
    "productId": 16,
    "movementType": "IN",
    "quantityChange": 80,
    "createdAt": new Date("2026-10-06T10:00:00Z"),
    "note": "Nhập kho theo phiếu nhập #3",
    "purchaseId": 3,
    "invoiceId": null,
    "adjustedBy": null
  },
  {
    "_id": 14,
    "productId": 21,
    "movementType": "IN",
    "quantityChange": 90,
    "createdAt": new Date("2026-10-06T10:00:00Z"),
    "note": "Nhập kho theo phiếu nhập #3",
    "purchaseId": 3,
    "invoiceId": null,
    "adjustedBy": null
  },
  {
    "_id": 15,
    "productId": 7,
    "movementType": "IN",
    "quantityChange": 100,
    "createdAt": new Date("2026-10-09T14:20:00Z"),
    "note": "Nhập kho theo phiếu nhập #4",
    "purchaseId": 4,
    "invoiceId": null,
    "adjustedBy": null
  },
  {
    "_id": 16,
    "productId": 23,
    "movementType": "IN",
    "quantityChange": 140,
    "createdAt": new Date("2026-10-09T14:20:00Z"),
    "note": "Nhập kho theo phiếu nhập #4",
    "purchaseId": 4,
    "invoiceId": null,
    "adjustedBy": null
  },
  {
    "_id": 17,
    "productId": 24,
    "movementType": "IN",
    "quantityChange": 90,
    "createdAt": new Date("2026-10-09T14:20:00Z"),
    "note": "Nhập kho theo phiếu nhập #4",
    "purchaseId": 4,
    "invoiceId": null,
    "adjustedBy": null
  },
  {
    "_id": 18,
    "productId": 26,
    "movementType": "IN",
    "quantityChange": 110,
    "createdAt": new Date("2026-10-09T14:20:00Z"),
    "note": "Nhập kho theo phiếu nhập #4",
    "purchaseId": 4,
    "invoiceId": null,
    "adjustedBy": null
  },
  {
    "_id": 19,
    "productId": 5,
    "movementType": "IN",
    "quantityChange": 90,
    "createdAt": new Date("2026-10-12T08:45:00Z"),
    "note": "Nhập kho theo phiếu nhập #5",
    "purchaseId": 5,
    "invoiceId": null,
    "adjustedBy": null
  },
  {
    "_id": 20,
    "productId": 6,
    "movementType": "IN",
    "quantityChange": 110,
    "createdAt": new Date("2026-10-12T08:45:00Z"),
    "note": "Nhập kho theo phiếu nhập #5",
    "purchaseId": 5,
    "invoiceId": null,
    "adjustedBy": null
  },
  {
    "_id": 21,
    "productId": 19,
    "movementType": "IN",
    "quantityChange": 75,
    "createdAt": new Date("2026-10-12T08:45:00Z"),
    "note": "Nhập kho theo phiếu nhập #5",
    "purchaseId": 5,
    "invoiceId": null,
    "adjustedBy": null
  },
  {
    "_id": 22,
    "productId": 28,
    "movementType": "IN",
    "quantityChange": 45,
    "createdAt": new Date("2026-10-12T08:45:00Z"),
    "note": "Nhập kho theo phiếu nhập #5",
    "purchaseId": 5,
    "invoiceId": null,
    "adjustedBy": null
  },
  {
    "_id": 23,
    "productId": 13,
    "movementType": "IN",
    "quantityChange": 85,
    "createdAt": new Date("2026-10-15T11:10:00Z"),
    "note": "Nhập kho theo phiếu nhập #6",
    "purchaseId": 6,
    "invoiceId": null,
    "adjustedBy": null
  },
  {
    "_id": 24,
    "productId": 30,
    "movementType": "IN",
    "quantityChange": 60,
    "createdAt": new Date("2026-10-15T11:10:00Z"),
    "note": "Nhập kho theo phiếu nhập #6",
    "purchaseId": 6,
    "invoiceId": null,
    "adjustedBy": null
  },
  {
    "_id": 25,
    "productId": 8,
    "movementType": "IN",
    "quantityChange": 80,
    "createdAt": new Date("2026-10-15T11:10:00Z"),
    "note": "Nhập kho theo phiếu nhập #6",
    "purchaseId": 6,
    "invoiceId": null,
    "adjustedBy": null
  },
  {
    "_id": 26,
    "productId": 10,
    "movementType": "IN",
    "quantityChange": 80,
    "createdAt": new Date("2026-10-15T11:10:00Z"),
    "note": "Nhập kho theo phiếu nhập #6",
    "purchaseId": 6,
    "invoiceId": null,
    "adjustedBy": null
  },
  {
    "_id": 27,
    "productId": 17,
    "movementType": "IN",
    "quantityChange": 100,
    "createdAt": new Date("2026-10-18T15:30:00Z"),
    "note": "Nhập kho theo phiếu nhập #7",
    "purchaseId": 7,
    "invoiceId": null,
    "adjustedBy": null
  },
  {
    "_id": 28,
    "productId": 18,
    "movementType": "IN",
    "quantityChange": 100,
    "createdAt": new Date("2026-10-18T15:30:00Z"),
    "note": "Nhập kho theo phiếu nhập #7",
    "purchaseId": 7,
    "invoiceId": null,
    "adjustedBy": null
  },
  {
    "_id": 29,
    "productId": 1,
    "movementType": "IN",
    "quantityChange": 60,
    "createdAt": new Date("2026-10-18T15:30:00Z"),
    "note": "Nhập kho theo phiếu nhập #7",
    "purchaseId": 7,
    "invoiceId": null,
    "adjustedBy": null
  },
  {
    "_id": 30,
    "productId": 2,
    "movementType": "IN",
    "quantityChange": 60,
    "createdAt": new Date("2026-10-18T15:30:00Z"),
    "note": "Nhập kho theo phiếu nhập #7",
    "purchaseId": 7,
    "invoiceId": null,
    "adjustedBy": null
  },
  {
    "_id": 31,
    "productId": 22,
    "movementType": "IN",
    "quantityChange": 95,
    "createdAt": new Date("2026-10-21T09:00:00Z"),
    "note": "Nhập kho theo phiếu nhập #8",
    "purchaseId": 8,
    "invoiceId": null,
    "adjustedBy": null
  },
  {
    "_id": 32,
    "productId": 25,
    "movementType": "IN",
    "quantityChange": 110,
    "createdAt": new Date("2026-10-21T09:00:00Z"),
    "note": "Nhập kho theo phiếu nhập #8",
    "purchaseId": 8,
    "invoiceId": null,
    "adjustedBy": null
  },
  {
    "_id": 33,
    "productId": 14,
    "movementType": "IN",
    "quantityChange": 80,
    "createdAt": new Date("2026-10-21T09:00:00Z"),
    "note": "Nhập kho theo phiếu nhập #8",
    "purchaseId": 8,
    "invoiceId": null,
    "adjustedBy": null
  },
  {
    "_id": 34,
    "productId": 15,
    "movementType": "IN",
    "quantityChange": 50,
    "createdAt": new Date("2026-10-21T09:00:00Z"),
    "note": "Nhập kho theo phiếu nhập #8",
    "purchaseId": 8,
    "invoiceId": null,
    "adjustedBy": null
  },
  {
    "_id": 35,
    "productId": 20,
    "movementType": "IN",
    "quantityChange": 50,
    "createdAt": new Date("2026-10-25T13:45:00Z"),
    "note": "Nhập kho theo phiếu nhập #9",
    "purchaseId": 9,
    "invoiceId": null,
    "adjustedBy": null
  },
  {
    "_id": 36,
    "productId": 29,
    "movementType": "IN",
    "quantityChange": 65,
    "createdAt": new Date("2026-10-25T13:45:00Z"),
    "note": "Nhập kho theo phiếu nhập #9",
    "purchaseId": 9,
    "invoiceId": null,
    "adjustedBy": null
  },
  {
    "_id": 37,
    "productId": 23,
    "movementType": "IN",
    "quantityChange": 60,
    "createdAt": new Date("2026-10-25T13:45:00Z"),
    "note": "Nhập kho theo phiếu nhập #9",
    "purchaseId": 9,
    "invoiceId": null,
    "adjustedBy": null
  },
  {
    "_id": 38,
    "productId": 3,
    "movementType": "IN",
    "quantityChange": 50,
    "createdAt": new Date("2026-10-28T16:00:00Z"),
    "note": "Nhập kho theo phiếu nhập #10",
    "purchaseId": 10,
    "invoiceId": null,
    "adjustedBy": null
  },
  {
    "_id": 39,
    "productId": 4,
    "movementType": "IN",
    "quantityChange": 50,
    "createdAt": new Date("2026-10-28T16:00:00Z"),
    "note": "Nhập kho theo phiếu nhập #10",
    "purchaseId": 10,
    "invoiceId": null,
    "adjustedBy": null
  },
  {
    "_id": 40,
    "productId": 9,
    "movementType": "IN",
    "quantityChange": 70,
    "createdAt": new Date("2026-10-28T16:00:00Z"),
    "note": "Nhập kho theo phiếu nhập #10",
    "purchaseId": 10,
    "invoiceId": null,
    "adjustedBy": null
  },
  {
    "_id": 41,
    "productId": 1,
    "movementType": "OUT",
    "quantityChange": -10,
    "createdAt": new Date("2026-10-02T10:15:00Z"),
    "note": "Xuất bán theo hóa đơn #1",
    "purchaseId": null,
    "invoiceId": 1,
    "adjustedBy": null
  },
  {
    "_id": 42,
    "productId": 2,
    "movementType": "OUT",
    "quantityChange": -8,
    "createdAt": new Date("2026-10-02T10:15:00Z"),
    "note": "Xuất bán theo hóa đơn #1",
    "purchaseId": null,
    "invoiceId": 1,
    "adjustedBy": null
  },
  {
    "_id": 43,
    "productId": 27,
    "movementType": "OUT",
    "quantityChange": -15,
    "createdAt": new Date("2026-10-02T10:15:00Z"),
    "note": "Xuất bán theo hóa đơn #1",
    "purchaseId": null,
    "invoiceId": 1,
    "adjustedBy": null
  },
  {
    "_id": 44,
    "productId": 8,
    "movementType": "OUT",
    "quantityChange": -12,
    "createdAt": new Date("2026-10-04T14:30:00Z"),
    "note": "Xuất bán theo hóa đơn #2",
    "purchaseId": null,
    "invoiceId": 2,
    "adjustedBy": null
  },
  {
    "_id": 45,
    "productId": 9,
    "movementType": "OUT",
    "quantityChange": -10,
    "createdAt": new Date("2026-10-04T14:30:00Z"),
    "note": "Xuất bán theo hóa đơn #2",
    "purchaseId": null,
    "invoiceId": 2,
    "adjustedBy": null
  },
  {
    "_id": 46,
    "productId": 12,
    "movementType": "OUT",
    "quantityChange": -15,
    "createdAt": new Date("2026-10-04T14:30:00Z"),
    "note": "Xuất bán theo hóa đơn #2",
    "purchaseId": null,
    "invoiceId": 2,
    "adjustedBy": null
  },
  {
    "_id": 47,
    "productId": 14,
    "movementType": "OUT",
    "quantityChange": -20,
    "createdAt": new Date("2026-10-07T09:45:00Z"),
    "note": "Xuất bán theo hóa đơn #3",
    "purchaseId": null,
    "invoiceId": 3,
    "adjustedBy": null
  },
  {
    "_id": 48,
    "productId": 15,
    "movementType": "OUT",
    "quantityChange": -10,
    "createdAt": new Date("2026-10-07T09:45:00Z"),
    "note": "Xuất bán theo hóa đơn #3",
    "purchaseId": null,
    "invoiceId": 3,
    "adjustedBy": null
  },
  {
    "_id": 49,
    "productId": 21,
    "movementType": "OUT",
    "quantityChange": -6,
    "createdAt": new Date("2026-10-07T09:45:00Z"),
    "note": "Xuất bán theo hóa đơn #3",
    "purchaseId": null,
    "invoiceId": 3,
    "adjustedBy": null
  },
  {
    "_id": 50,
    "productId": 7,
    "movementType": "OUT",
    "quantityChange": -12,
    "createdAt": new Date("2026-10-10T16:10:00Z"),
    "note": "Xuất bán theo hóa đơn #4",
    "purchaseId": null,
    "invoiceId": 4,
    "adjustedBy": null
  },
  {
    "_id": 51,
    "productId": 23,
    "movementType": "OUT",
    "quantityChange": -15,
    "createdAt": new Date("2026-10-10T16:10:00Z"),
    "note": "Xuất bán theo hóa đơn #4",
    "purchaseId": null,
    "invoiceId": 4,
    "adjustedBy": null
  },
  {
    "_id": 52,
    "productId": 24,
    "movementType": "OUT",
    "quantityChange": -8,
    "createdAt": new Date("2026-10-10T16:10:00Z"),
    "note": "Xuất bán theo hóa đơn #4",
    "purchaseId": null,
    "invoiceId": 4,
    "adjustedBy": null
  },
  {
    "_id": 53,
    "productId": 5,
    "movementType": "OUT",
    "quantityChange": -10,
    "createdAt": new Date("2026-10-13T11:20:00Z"),
    "note": "Xuất bán theo hóa đơn #5",
    "purchaseId": null,
    "invoiceId": 5,
    "adjustedBy": null
  },
  {
    "_id": 54,
    "productId": 28,
    "movementType": "OUT",
    "quantityChange": -3,
    "createdAt": new Date("2026-10-13T11:20:00Z"),
    "note": "Xuất bán theo hóa đơn #5",
    "purchaseId": null,
    "invoiceId": 5,
    "adjustedBy": null
  },
  {
    "_id": 55,
    "productId": 19,
    "movementType": "OUT",
    "quantityChange": -8,
    "createdAt": new Date("2026-10-13T11:20:00Z"),
    "note": "Xuất bán theo hóa đơn #5",
    "purchaseId": null,
    "invoiceId": 5,
    "adjustedBy": null
  },
  {
    "_id": 56,
    "productId": 13,
    "movementType": "OUT",
    "quantityChange": -10,
    "createdAt": new Date("2026-10-16T15:05:00Z"),
    "note": "Xuất bán theo hóa đơn #6",
    "purchaseId": null,
    "invoiceId": 6,
    "adjustedBy": null
  },
  {
    "_id": 57,
    "productId": 30,
    "movementType": "OUT",
    "quantityChange": -5,
    "createdAt": new Date("2026-10-16T15:05:00Z"),
    "note": "Xuất bán theo hóa đơn #6",
    "purchaseId": null,
    "invoiceId": 6,
    "adjustedBy": null
  },
  {
    "_id": 58,
    "productId": 17,
    "movementType": "OUT",
    "quantityChange": -15,
    "createdAt": new Date("2026-10-19T10:50:00Z"),
    "note": "Xuất bán theo hóa đơn #7",
    "purchaseId": null,
    "invoiceId": 7,
    "adjustedBy": null
  },
  {
    "_id": 59,
    "productId": 18,
    "movementType": "OUT",
    "quantityChange": -15,
    "createdAt": new Date("2026-10-19T10:50:00Z"),
    "note": "Xuất bán theo hóa đơn #7",
    "purchaseId": null,
    "invoiceId": 7,
    "adjustedBy": null
  },
  {
    "_id": 60,
    "productId": 22,
    "movementType": "OUT",
    "quantityChange": -8,
    "createdAt": new Date("2026-10-22T13:40:00Z"),
    "note": "Xuất bán theo hóa đơn #8",
    "purchaseId": null,
    "invoiceId": 8,
    "adjustedBy": null
  },
  {
    "_id": 61,
    "productId": 25,
    "movementType": "OUT",
    "quantityChange": -12,
    "createdAt": new Date("2026-10-22T13:40:00Z"),
    "note": "Xuất bán theo hóa đơn #8",
    "purchaseId": null,
    "invoiceId": 8,
    "adjustedBy": null
  },
  {
    "_id": 62,
    "productId": 20,
    "movementType": "OUT",
    "quantityChange": -4,
    "createdAt": new Date("2026-10-26T17:15:00Z"),
    "note": "Xuất bán theo hóa đơn #9",
    "purchaseId": null,
    "invoiceId": 9,
    "adjustedBy": null
  },
  {
    "_id": 63,
    "productId": 29,
    "movementType": "OUT",
    "quantityChange": -6,
    "createdAt": new Date("2026-10-26T17:15:00Z"),
    "note": "Xuất bán theo hóa đơn #9",
    "purchaseId": null,
    "invoiceId": 9,
    "adjustedBy": null
  },
  {
    "_id": 64,
    "productId": 3,
    "movementType": "OUT",
    "quantityChange": -10,
    "createdAt": new Date("2026-10-29T09:30:00Z"),
    "note": "Xuất bán theo hóa đơn #10",
    "purchaseId": null,
    "invoiceId": 10,
    "adjustedBy": null
  },
  {
    "_id": 65,
    "productId": 16,
    "movementType": "OUT",
    "quantityChange": -10,
    "createdAt": new Date("2026-10-29T09:30:00Z"),
    "note": "Xuất bán theo hóa đơn #10",
    "purchaseId": null,
    "invoiceId": 10,
    "adjustedBy": null
  },
  {
    "_id": 66,
    "productId": 1,
    "movementType": "ADJUST",
    "quantityChange": -2,
    "createdAt": new Date("2026-10-05T17:00:00Z"),
    "note": "Kiểm kê định kỳ: hao hụt 2 hộp bút bi do móp vỏ hộp",
    "purchaseId": null,
    "invoiceId": null,
    "adjustedBy": 1
  },
  {
    "_id": 67,
    "productId": 2,
    "movementType": "ADJUST",
    "quantityChange": -1,
    "createdAt": new Date("2026-10-05T17:10:00Z"),
    "note": "Kiểm kê định kỳ: xuất mẫu thử tại quầy 1 hộp bút gel",
    "purchaseId": null,
    "invoiceId": null,
    "adjustedBy": 1
  },
  {
    "_id": 68,
    "productId": 4,
    "movementType": "ADJUST",
    "quantityChange": 2,
    "createdAt": new Date("2026-10-08T17:00:00Z"),
    "note": "Kiểm kê định kỳ: thừa 2 hộp bút dạ quang so với sổ sách",
    "purchaseId": null,
    "invoiceId": null,
    "adjustedBy": 1
  },
  {
    "_id": 69,
    "productId": 6,
    "movementType": "ADJUST",
    "quantityChange": -3,
    "createdAt": new Date("2026-10-11T17:00:00Z"),
    "note": "Kiểm kê định kỳ: loại bỏ 3 cây bút chì bấm gãy ngòi",
    "purchaseId": null,
    "invoiceId": null,
    "adjustedBy": 1
  },
  {
    "_id": 70,
    "productId": 8,
    "movementType": "ADJUST",
    "quantityChange": -2,
    "createdAt": new Date("2026-10-14T17:00:00Z"),
    "note": "Kiểm kê định kỳ: rách bao bì 2 ream giấy Double A A4 80gsm",
    "purchaseId": null,
    "invoiceId": null,
    "adjustedBy": 2
  },
  {
    "_id": 71,
    "productId": 9,
    "movementType": "ADJUST",
    "quantityChange": -1,
    "createdAt": new Date("2026-10-14T17:15:00Z"),
    "note": "Kiểm kê định kỳ: xuất nội bộ văn phòng dùng 1 ream giấy A4 70gsm",
    "purchaseId": null,
    "invoiceId": null,
    "adjustedBy": 2
  },
  {
    "_id": 72,
    "productId": 10,
    "movementType": "ADJUST",
    "quantityChange": 1,
    "createdAt": new Date("2026-10-17T17:00:00Z"),
    "note": "Kiểm kê định kỳ: điều chỉnh tăng 1 ream giấy IK Plus A4",
    "purchaseId": null,
    "invoiceId": null,
    "adjustedBy": 2
  },
  {
    "_id": 73,
    "productId": 11,
    "movementType": "ADJUST",
    "quantityChange": -2,
    "createdAt": new Date("2026-10-17T17:20:00Z"),
    "note": "Kiểm kê định kỳ: xuất quầy thu ngân in hóa đơn 2 ream A5",
    "purchaseId": null,
    "invoiceId": null,
    "adjustedBy": 2
  },
  {
    "_id": 74,
    "productId": 12,
    "movementType": "ADJUST",
    "quantityChange": -3,
    "createdAt": new Date("2026-10-20T17:00:00Z"),
    "note": "Kiểm kê định kỳ: cong lò xo 3 cuốn sổ B5 khi vận chuyển",
    "purchaseId": null,
    "invoiceId": null,
    "adjustedBy": 2
  },
  {
    "_id": 75,
    "productId": 15,
    "movementType": "ADJUST",
    "quantityChange": -1,
    "createdAt": new Date("2026-10-23T17:00:00Z"),
    "note": "Kiểm kê định kỳ: hỏng còng 1 bìa King Jim 5F",
    "purchaseId": null,
    "invoiceId": null,
    "adjustedBy": 3
  },
  {
    "_id": 76,
    "productId": 17,
    "movementType": "ADJUST",
    "quantityChange": 3,
    "createdAt": new Date("2026-10-23T17:15:00Z"),
    "note": "Kiểm kê định kỳ: kiểm đếm thực tế dư 3 xấp bìa nút A4",
    "purchaseId": null,
    "invoiceId": null,
    "adjustedBy": 3
  },
  {
    "_id": 77,
    "productId": 21,
    "movementType": "ADJUST",
    "quantityChange": -1,
    "createdAt": new Date("2026-10-27T17:00:00Z"),
    "note": "Kiểm kê định kỳ: xuất 1 bấm kim Plus dùng tại kho",
    "purchaseId": null,
    "invoiceId": null,
    "adjustedBy": 3
  },
  {
    "_id": 78,
    "productId": 26,
    "movementType": "ADJUST",
    "quantityChange": -2,
    "createdAt": new Date("2026-10-27T17:15:00Z"),
    "note": "Kiểm kê định kỳ: xuất 2 dao rọc giấy cho bộ phận đóng gói",
    "purchaseId": null,
    "invoiceId": null,
    "adjustedBy": 4
  },
  {
    "_id": 79,
    "productId": 27,
    "movementType": "ADJUST",
    "quantityChange": -5,
    "createdAt": new Date("2026-10-30T17:00:00Z"),
    "note": "Kiểm kê định kỳ: xuất 5 cuộn băng keo dùng dán thùng kho",
    "purchaseId": null,
    "invoiceId": null,
    "adjustedBy": 4
  },
  {
    "_id": 80,
    "productId": 28,
    "movementType": "ADJUST",
    "quantityChange": 1,
    "createdAt": new Date("2026-10-30T17:20:00Z"),
    "note": "Kiểm kê định kỳ: đối soát thừa 1 máy tính Casio từ lô khuyến mãi",
    "purchaseId": null,
    "invoiceId": null,
    "adjustedBy": 4
  }
]);

// ============================================================================
// PHẦN 2: TẠO INDEXES TƯƠNG ĐƯƠNG VỚI MSSQL
// ============================================================================
db.products.createIndex({ sku: 1 }, { unique: true, name: "UQ_product_sku" });
db.products.createIndex({ barcode: 1 }, { unique: true, name: "UQ_product_barcode" });
db.products.createIndex({ categoryId: 1, salePrice: 1 }, { name: "IX_product_category_price" });
db.inventories.createIndex({ productId: 1 }, { unique: true, name: "UQ_inventory_product" });
db.customers.createIndex({ phone: 1 }, { unique: true, name: "UQ_customer_phone" });
db.employees.createIndex({ email: 1 }, { unique: true, name: "UQ_employee_email" });
db.purchaseReceipts.createIndex({ supplierId: 1, purchaseDate: -1 }, { name: "IX_purchase_receipt_supplier" });
db.salesInvoices.createIndex({ customerId: 1, createdAt: -1 }, { name: "IX_sales_invoice_customer_date" });
db.stockMovements.createIndex({ productId: 1, createdAt: -1 }, { name: "IX_stock_movement_product_date" });

print("=== ĐÃ KHỞI TẠO XONG DATABASE StationeryStoreDB TRÊN MONGODB ===");
