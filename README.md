# Quản lý cửa hàng văn phòng phẩm

Bài tập lớn môn Database SQL. Backend sử dụng FastAPI, database dự kiến sử dụng Microsoft SQL Server.

## 1. Cấu trúc thư mục

```text
.
|-- README.md
|-- .env.example
|-- app
|   |-- main.py
|   |-- backend
|   `-- frontend
|       `-- templates
|           |-- index.html
|           `-- home.html
|-- database
|   `-- sqlserver
|       |-- procedures
|       |-- schema
|       `-- triggers
|-- docker-compose.yml
|-- docs
`-- requirements.txt
```

## 2. Clone repository và vào thư mục

```bash
git clone https://github.com/bnhtho/262_sql_assigment.git
cd 262_sql_assigment
```

## 3. Tạo môi trường và cài dependencies

Cài `uv` nếu máy chưa có: [hướng dẫn cài uv](https://docs.astral.sh/uv/getting-started/installation/).

```bash
uv python install 3.12
uv venv --python 3.12 .venv
```

Kích hoạt môi trường:

```bash
# macOS/Linux
source .venv/bin/activate

# Windows PowerShell
.\.venv\Scripts\Activate.ps1
```

Cài FastAPI và Uvicorn Standard từ `requirements.txt`:

```bash
uv pip install -r requirements.txt
```

## 4. Cấu hình đăng nhập và chạy ứng dụng

Tạo file `.env` từ mẫu:

```bash
# macOS/Linux
cp .env.example .env
```

```powershell
# Windows PowerShell
Copy-Item .env.example .env
```

Trong `.env`, đặt mật khẩu quản trị và thay `SESSION_SECRET` bằng chuỗi ngẫu nhiên. Có thể tạo chuỗi bằng lệnh:

```powershell
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Khởi chạy từ thư mục repository (ứng dụng tự đọc `.env`):

```bash
uvicorn app.main:app --reload
```

Mở <http://127.0.0.1:8000/> để đăng nhập. Sau khi xác thực, dashboard ở <http://127.0.0.1:8000/home>. API docs: <http://127.0.0.1:8000/docs>.

`SESSION_SECRET` nên được tạo mới và giữ bí mật; không commit mật khẩu hoặc secret vào Git. Thiết lập `COOKIE_HTTPS_ONLY=true` khi chạy sau HTTPS trên môi trường triển khai.


## 6. Tài liệu tham khảo

- [Cài đặt `uv`](https://docs.astral.sh/uv/getting-started/installation/)
- [Quản lý Python với `uv`](https://docs.astral.sh/uv/guides/install-python/)
- [Môi trường và packages với `uv`](https://docs.astral.sh/uv/pip/environments/)
- [FastAPI Tutorial](https://fastapi.tiangolo.com/tutorial/)
- [Uvicorn](https://www.uvicorn.org/)
- [Python virtual environments](https://docs.python.org/3/library/venv.html)
