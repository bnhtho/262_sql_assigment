# Quản lý shop bán tạp hoá

Dự án bài tập lớn môn Database SQL, xây dựng API bằng **FastAPI** và sử dụng **SQL Server**.

## Cấu trúc thư mục

```text
sql/
├── database/
│   └── sqlserver/
│       ├── schema/       # Script tạo bảng
│       ├── procedures/   # Stored procedures
│       └── triggers/     # Triggers
├── docs/                 # Tài liệu dự án
├── requirements.txt      # Danh sách thư viện
└── docker-compose.yml    # Cấu hình Docker (nếu sử dụng)
```

## Cài đặt môi trường

### 1. Cài `uv`

- [Hướng dẫn cài uv](https://docs.astral.sh/uv/getting-started/installation/)
- Windows (PowerShell):

  ```powershell
  powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
  ```

- macOS/Linux:

  ```bash
  curl -LsSf https://astral.sh/uv/install.sh | sh
  ```

### 2. Cài Python 3 và tạo môi trường ảo

Nếu máy chưa có Python 3, có thể cài bằng `uv`:

```bash
uv python install 3.12
```

Tạo môi trường `.venv` bằng Python 3.12:

```bash
uv venv --python 3.12 .venv
```

### 3. Cài FastAPI và Uvicorn vào `.venv`

```bash
uv pip install --python .venv/bin/python fastapi "uvicorn[standard]"
```

Trên Windows, dùng:

```powershell
uv pip install --python .venv\Scripts\python.exe fastapi "uvicorn[standard]"
```

### 4. Kích hoạt môi trường `.venv`

```bash
# macOS/Linux
source .venv/bin/activate

# Windows PowerShell
.venv\Scripts\Activate.ps1
```

## Tạo và chạy ứng dụng

Tạo file `app/main.py`:

```python
from fastapi import FastAPI

app = FastAPI(title="Quản lý shop bán tạp hoá")


@app.get("/")
def home():
    return {"message": "API đang hoạt động"}
```

Chạy API từ thư mục dự án:

```bash
uvicorn app.main:app --reload
```

Mở [Swagger UI](http://127.0.0.1:8000/docs) để xem và thử API.

## Tài liệu tham khảo

- [Tài liệu uv](https://docs.astral.sh/uv/)
- [Quản lý project và môi trường với uv](https://docs.astral.sh/uv/guides/projects/)
- [Tài liệu FastAPI](https://fastapi.tiangolo.com/)
- [Hướng dẫn FastAPI](https://fastapi.tiangolo.com/tutorial/)
