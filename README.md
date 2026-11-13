# Quản lý shop bán tạp hoá

Bài tập lớn môn Database SQL. Backend sử dụng FastAPI, database dự kiến sử dụng Microsoft SQL Server.

## 1. Cấu trúc thư mục

```text
262_sql_assigment/
├── app/                    # Mã nguồn FastAPI
├── database/
│   └── sqlserver/
│       ├── schema/         # Script tạo bảng
│       ├── procedures/     # Stored procedures
│       └── triggers/       # Triggers
├── docs/                   # Tài liệu dự án
├── requirements.txt        # Python dependencies
└── docker-compose.yml      # Cấu hình Docker
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

Cài FastAPI và Uvicorn:

```bash
uv pip install fastapi "uvicorn[standard]"
```

## 4. Chạy ứng dụng

Từ thư mục repository, chạy:

```bash
uvicorn app.main:app --reload
```

API docs: <http://127.0.0.1:8000/docs>

## 5. Tài liệu tham khảo

- [Cài đặt `uv`](https://docs.astral.sh/uv/getting-started/installation/)
- [Quản lý Python với `uv`](https://docs.astral.sh/uv/guides/install-python/)
- [Môi trường và packages với `uv`](https://docs.astral.sh/uv/pip/environments/)
- [FastAPI Tutorial](https://fastapi.tiangolo.com/tutorial/)
- [Uvicorn](https://www.uvicorn.org/)
- [Python virtual environments](https://docs.python.org/3/library/venv.html)
