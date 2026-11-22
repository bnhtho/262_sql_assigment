# Hướng dẫn cài đặt Database & Read/Report API

## 1. Cấu trúc thư mục
- `database/sqlserver/schema/stationery_store_mssql.sql`: Lược đồ 13 bảng, 2 view, 4 index và dữ liệu mẫu `StationeryStoreDB`.
- `database/sqlserver/queries/`: 18 truy vấn đọc/báo cáo (FR01–FR10) và `explain_benchmark.sql` để đo Actual Execution Plan trên SSMS.
- `database/mongodb/`: `stationery_store_mongodb.js`, 18 truy vấn tương đương (FR01–FR10), và `quick_runner.js` (có `explain_5_loai()`).
- `app/backend/db.py` & `app/backend/routers/read_reports.py`: 18 REST API đọc & báo cáo gắn tại prefix `/api/v1`.

## 2. Chạy ứng dụng
1. Chạy `database/sqlserver/schema/stationery_store_mssql.sql` trên MS SQL Server.
2. Cài đặt thư viện: `uv pip install -r requirements.txt`.
3. Tạo `.env` từ `.env.example` và điền thông tin kết nối `MSSQL_*`.
4. Chạy server: `uvicorn app.main:app --reload` và kiểm thử API tại `http://127.0.0.1:8000/docs`.
