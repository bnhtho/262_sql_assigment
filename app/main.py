import hmac
import os
from pathlib import Path

from fastapi import FastAPI, Form, Request
from fastapi.responses import RedirectResponse
from fastapi.templating import Jinja2Templates
from dotenv import load_dotenv
from starlette.middleware.sessions import SessionMiddleware

project_root = Path(__file__).resolve().parent.parent
load_dotenv(project_root / ".env")

session_secret = os.getenv("SESSION_SECRET")
if not session_secret:
    raise RuntimeError("SESSION_SECRET must be set before starting the application.")

admin_password = os.getenv("ADMIN_PASSWORD")
if not admin_password:
    raise RuntimeError("ADMIN_PASSWORD must be set before starting the application.")

app = FastAPI(title="Quản lý cửa hàng văn phòng phẩm")
app.add_middleware(
    SessionMiddleware,
    secret_key=session_secret,
    same_site="lax",
    https_only=os.getenv("COOKIE_HTTPS_ONLY", "false").lower() == "true",
)

templates = Jinja2Templates(
    directory=str(Path(__file__).parent / "frontend" / "templates")
)

stats = [
    {"label": "Doanh thu hôm nay", "value": "2.450.000 ₫", "note": "+12,5% so với hôm qua"},
    {"label": "Đơn hàng hôm nay", "value": "38", "note": "Đơn đã tạo"},
    {"label": "Sản phẩm", "value": "256", "note": "Đang kinh doanh"},
    {"label": "Sắp hết hàng", "value": "7", "note": "Cần nhập thêm"},
]

products = [
    {"sku": "VP001", "name": "Vở kẻ ngang 200 trang", "category": "Vở & sổ", "price": "18.000 ₫", "stock": 120, "status": "Còn hàng", "status_class": "available"},
    {"sku": "VP002", "name": "Bút bi Thiên Long TL-045", "category": "Bút viết", "price": "5.000 ₫", "stock": 8, "status": "Sắp hết", "status_class": "low"},
    {"sku": "VP003", "name": "Giấy in A4 Double A 70gsm", "category": "Giấy & vật tư in", "price": "78.000 ₫", "stock": 0, "status": "Hết hàng", "status_class": "empty"},
    {"sku": "VP004", "name": "Bút chì gỗ 2B", "category": "Bút viết", "price": "4.000 ₫", "stock": 48, "status": "Còn hàng", "status_class": "available"},
    {"sku": "VP005", "name": "Bìa hồ sơ nút A4", "category": "Lưu trữ hồ sơ", "price": "7.000 ₫", "stock": 5, "status": "Sắp hết", "status_class": "low"},
    {"sku": "VP006", "name": "Kéo văn phòng 18cm", "category": "Dụng cụ văn phòng", "price": "22.000 ₫", "stock": 16, "status": "Còn hàng", "status_class": "available"},
]


@app.get("/")
def login_page(request: Request):
    if request.session.get("authenticated"):
        return RedirectResponse(url="/home", status_code=303)
    return templates.TemplateResponse(
        request=request,
        name="index.html",
        context={"error": None},
    )


@app.post("/login")
def login(request: Request, password: str = Form()):
    if not hmac.compare_digest(password, admin_password):
        return templates.TemplateResponse(
            request=request,
            name="index.html",
            context={"error": "Mật khẩu không chính xác."},
            status_code=401,
        )

    request.session.clear()
    request.session["authenticated"] = True
    return RedirectResponse(url="/home", status_code=303)


@app.get("/home")
def home(request: Request):
    if not request.session.get("authenticated"):
        return RedirectResponse(url="/", status_code=303)
    return templates.TemplateResponse(
        request=request,
        name="home.html",
        context={"stats": stats, "products": products},
    )


@app.post("/logout")
def logout(request: Request):
    request.session.clear()
    return RedirectResponse(url="/", status_code=303)
