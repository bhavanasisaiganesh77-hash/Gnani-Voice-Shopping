import os
import secrets
from datetime import datetime
from decimal import Decimal
from urllib.parse import urlencode

import httpx

from fastapi import (
    FastAPI,
    Depends,
    HTTPException,
    UploadFile,
    File,
    Form,
)

from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import engine, Base, get_db

from models import (
    Product,
    Order,
    OrderItem,
    StaffUser,
)

from schemas import (
    OrderCreate,
    OrderStatusUpdate,
    PaymentStatusUpdate,
    RackAssignmentUpdate,
    ProductCreate,
    StockUpdate,
    StaffLogin,
    StaffCreate,
)

from auth import (
    verify_password,
    create_access_token,
    hash_password,
    require_roles,
)


# --------------------------------------------------
# APPLICATION SETUP
# --------------------------------------------------

app = FastAPI(title="GNANI VOICE SHOPPING API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)


# --------------------------------------------------
# HELPER FUNCTIONS
# --------------------------------------------------

def product_slug(name: str) -> str:
    return name.lower().strip().replace(" ", "-")


def order_identifier(order: Order) -> str:
    return (
        order.order_number
        or order.temporary_reference
        or str(order.id)
    )


def generate_upi_payment_link(
    upi_id: str,
    payee_name: str,
    amount: Decimal,
    order_number: str,
):
    params = {
        "pa": upi_id,
        "pn": payee_name,
        "am": f"{amount:.2f}",
        "cu": "INR",
        "tn": f"Gnani Smart Mart Order {order_number}",
        "tr": order_number,
    }

    return "upi://pay?" + urlencode(params)


# --------------------------------------------------
# SAMPLE PRODUCT DATA
# --------------------------------------------------

def add_sample_products():
    db = next(get_db())

    try:
        if db.query(Product).count() == 0:
            products = [
                Product(
                    name="Aashirvaad Atta",
                    name_en="Aashirvaad Atta",
                    brand="Aashirvaad",
                    category="Flour",
                    price=285,
                    unit="5 kg",
                    stock=20,
                ),
                Product(
                    name="Urad Dal",
                    name_en="Urad Dal",
                    brand="Local",
                    category="Pulses",
                    price=145,
                    unit="1 kg",
                    stock=30,
                ),
                Product(
                    name="Upma Rava",
                    name_en="Upma Rava",
                    brand="Local",
                    category="Rice & Rava",
                    price=62,
                    unit="1 kg",
                    stock=25,
                ),
                Product(
                    name="Rice",
                    name_en="Rice",
                    brand="Local",
                    category="Rice & Rava",
                    price=65,
                    unit="1 kg",
                    stock=50,
                ),
                Product(
                    name="Sugar",
                    name_en="Sugar",
                    brand="Local",
                    category="Essentials",
                    price=48,
                    unit="1 kg",
                    stock=40,
                ),
                Product(
                    name="Toor Dal",
                    name_en="Toor Dal",
                    brand="Local",
                    category="Pulses",
                    price=160,
                    unit="1 kg",
                    stock=30,
                ),
            ]

            db.add_all(products)
            db.commit()

    finally:
        db.close()


add_sample_products()


# --------------------------------------------------
# HOME
# --------------------------------------------------

@app.get("/")
def home():
    return {
        "message": "GNANI VOICE SHOPPING API is running!"
    }


# --------------------------------------------------
# HEALTH CHECK
# --------------------------------------------------

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "database": "connected",
    }


# --------------------------------------------------
# STAFF LOGIN
# --------------------------------------------------

# --------------------------------------------------
# SHOPKEEPER: CREATE STAFF ACCOUNTS
# --------------------------------------------------

@app.post("/staff")
def create_staff(
    staff_data: StaffCreate,
    db: Session = Depends(get_db),
    current_staff: StaffUser = Depends(
        require_roles("shopkeeper")
    ),
):
    full_name = staff_data.full_name.strip()
    username = staff_data.username.strip()

    if not full_name or not username:
        raise HTTPException(
            status_code=400,
            detail="Full name and username are required",
        )

    existing_staff = (
        db.query(StaffUser)
        .filter(StaffUser.username == username)
        .first()
    )

    if existing_staff:
        raise HTTPException(
            status_code=409,
            detail="This username already exists",
        )

    new_staff = StaffUser(
        full_name=full_name,
        username=username,
        password_hash=hash_password(staff_data.password),
        role=staff_data.role,
        is_active=True,
    )

    try:
        db.add(new_staff)
        db.commit()
        db.refresh(new_staff)

        return {
            "success": True,
            "message": "Staff account created successfully",
            "staff": {
                "id": new_staff.id,
                "full_name": new_staff.full_name,
                "username": new_staff.username,
                "role": new_staff.role,
            },
            "created_by": current_staff.full_name,
        }

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Unable to create staff account",
        )



@app.post("/staff/login")
def staff_login(
    login_data: StaffLogin,
    db: Session = Depends(get_db),
):
    staff = db.query(StaffUser).filter(
        StaffUser.username == login_data.username
    ).first()

    if not staff or not staff.is_active:
        raise HTTPException(
            status_code=401,
            detail="Invalid username or password",
        )

    allowed_roles = [
        "shopkeeper",
        "worker",
        "shelf_stocker",
        "inventory_manager",
    ]

    if staff.role not in allowed_roles:
        raise HTTPException(
            status_code=403,
            detail="Invalid staff role",
        )

    if not verify_password(
        login_data.password,
        staff.password_hash,
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid username or password",
        )

    access_token = create_access_token(staff)

    return {
        "success": True,
        "message": "Login successful",
        "access_token": access_token,
        "token_type": "bearer",
        "staff": {
            "id": staff.id,
            "full_name": staff.full_name,
            "username": staff.username,
            "role": staff.role,
        },
    }


# --------------------------------------------------
# CUSTOMER: GET PRODUCTS
# --------------------------------------------------

@app.get("/products")
def get_products(
    db: Session = Depends(get_db),
):
    products = (
        db.query(Product)
        .filter(Product.is_active.is_(True))
        .order_by(Product.name.asc())
        .all()
    )

    return [
        {
            "id": product_slug(product.name),
            "productId": product_slug(product.name),

            "name": product.name,
            "name_en": product.name_en or product.name,
            "name_te": product.name_te,
            "name_ta": product.name_ta,

            "brand": product.brand or "Local",
            "category": product.category or "General",
            "price": float(product.price),
            "unit": product.unit or "1 unit",
            "stock": product.stock,
            "available_stock": product.stock,
            "low_stock_threshold": product.low_stock_threshold,
        }
        for product in products
    ]


# --------------------------------------------------
# INVENTORY MANAGER + SHOPKEEPER: ADD PRODUCT
# --------------------------------------------------

@app.post("/products")
def create_product(
    product_data: ProductCreate,
    db: Session = Depends(get_db),
    current_staff: StaffUser = Depends(
        require_roles("inventory_manager", "shopkeeper")
    ),
):
    english_name = (
        product_data.name_en or product_data.name
    ).strip()

    if not english_name:
        raise HTTPException(
            status_code=400,
            detail="English product name is required",
        )

    existing_product = (
        db.query(Product)
        .filter(Product.name.ilike(english_name))
        .first()
    )

    if existing_product:
        raise HTTPException(
            status_code=409,
            detail="This product already exists. Update its stock instead.",
        )

    product = Product(
        name=english_name,
        name_en=english_name,
        name_te=(
            product_data.name_te.strip()
            if product_data.name_te
            else None
        ),
        name_ta=(
            product_data.name_ta.strip()
            if product_data.name_ta
            else None
        ),
        brand=product_data.brand,
        category=product_data.category,
        price=Decimal(str(product_data.price)),
        unit=product_data.unit,
        stock=product_data.stock,
        reserved_stock=0,
        is_active=True,
        low_stock_threshold=product_data.low_stock_threshold,
    )

    try:
        db.add(product)
        db.commit()
        db.refresh(product)

        return {
            "success": True,
            "message": "Product added successfully",
            "product": {
                "id": product.id,
                "name": product.name,
                "name_en": product.name_en,
                "name_te": product.name_te,
                "name_ta": product.name_ta,
                "brand": product.brand,
                "category": product.category,
                "price": float(product.price),
                "unit": product.unit,
                "stock": product.stock,
                "low_stock_threshold": product.low_stock_threshold,
            },
            "added_by": current_staff.full_name,
        }

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Unable to add product",
        )


# --------------------------------------------------
# INVENTORY MANAGER + SHOPKEEPER: EDIT PRODUCT
# --------------------------------------------------

@app.patch("/products/{product_id}")
def edit_product(
    product_id: int,
    product_data: ProductCreate,
    db: Session = Depends(get_db),
    current_staff: StaffUser = Depends(
        require_roles("inventory_manager", "shopkeeper")
    ),
):
    product = (
        db.query(Product)
        .filter(Product.id == product_id)
        .first()
    )

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found",
        )

    english_name = (
        product_data.name_en or product_data.name
    ).strip()

    if not english_name:
        raise HTTPException(
            status_code=400,
            detail="English product name is required",
        )

    duplicate = (
        db.query(Product)
        .filter(
            Product.name.ilike(english_name),
            Product.id != product_id,
        )
        .first()
    )

    if duplicate:
        raise HTTPException(
            status_code=409,
            detail="Another product already uses this English name",
        )

    product.name = english_name
    product.name_en = english_name
    product.name_te = (
        product_data.name_te.strip()
        if product_data.name_te
        else None
    )
    product.name_ta = (
        product_data.name_ta.strip()
        if product_data.name_ta
        else None
    )

    product.brand = product_data.brand
    product.category = product_data.category
    product.price = Decimal(str(product_data.price))
    product.unit = product_data.unit
    product.stock = product_data.stock
    product.low_stock_threshold = (
        product_data.low_stock_threshold
    )

    db.commit()
    db.refresh(product)

    return {
        "success": True,
        "message": "Product updated successfully",
        "product": {
            "id": product.id,
            "name": product.name,
            "name_en": product.name_en,
            "name_te": product.name_te,
            "name_ta": product.name_ta,
            "brand": product.brand,
            "category": product.category,
            "price": float(product.price),
            "unit": product.unit,
            "stock": product.stock,
            "low_stock_threshold": product.low_stock_threshold,
        },
        "updated_by": current_staff.full_name,
    }


# --------------------------------------------------
# INVENTORY MANAGER + SHOPKEEPER: UPDATE STOCK
# --------------------------------------------------

@app.patch("/products/{product_id}/stock")
def update_product_stock(
    product_id: int,
    stock_data: StockUpdate,
    db: Session = Depends(get_db),
    current_staff: StaffUser = Depends(
        require_roles("inventory_manager", "shopkeeper")
    ),
):
    product = (
        db.query(Product)
        .filter(Product.id == product_id)
        .with_for_update()
        .first()
    )

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found",
        )

    product.stock = stock_data.quantity

    db.commit()
    db.refresh(product)

    return {
        "success": True,
        "message": "Product stock updated successfully",
        "product_id": product.id,
        "product_name": product.name,
        "available_stock": product.stock,
        "updated_by": current_staff.full_name,
    }


# --------------------------------------------------
# INVENTORY MANAGER: VIEW INVENTORY
# --------------------------------------------------

@app.get("/inventory")
@app.get("/worker/inventory")
def get_inventory(
    db: Session = Depends(get_db),
    current_staff: StaffUser = Depends(
        require_roles("inventory_manager", "shopkeeper")
    ),
):
    products = (
        db.query(Product)
        .order_by(Product.name.asc())
        .all()
    )

    return [
        {
            "id": product.id,
            "name": product.name,
            "name_en": product.name_en or product.name,
            "name_te": product.name_te,
            "name_ta": product.name_ta,
            "brand": product.brand,
            "category": product.category,
            "price": float(product.price),
            "unit": product.unit,
            "stock": product.stock,
            "is_active": product.is_active,
            "low_stock_threshold": product.low_stock_threshold,
            "low_stock": (
                product.stock <= product.low_stock_threshold
            ),
        }
        for product in products
    ]


# --------------------------------------------------
# CUSTOMER: CREATE ORDER
# --------------------------------------------------

@app.post("/orders")
def create_order(
    order_data: OrderCreate,
    db: Session = Depends(get_db),
):
    try:
        if not order_data.lines:
            raise HTTPException(
                status_code=400,
                detail="Your cart is empty",
            )

        shop_upi_id = os.getenv(
            "SHOP_UPI_ID", ""
        ).strip()

        shop_upi_name = os.getenv(
            "SHOP_UPI_NAME",
            "Gnani Smart Mart",
        ).strip()

        if (
            order_data.payment_method == "upi"
            and not shop_upi_id
        ):
            raise HTTPException(
                status_code=500,
                detail="Shop UPI ID is not configured",
            )

        quantities = {}

        for line in order_data.lines:
            quantities[line.product_id] = (
                quantities.get(line.product_id, 0)
                + line.quantity
            )

        products_by_slug = {}

        products = (
            db.query(Product)
            .filter(Product.is_active.is_(True))
            .with_for_update()
            .all()
        )

        for product in products:
            products_by_slug[
                product_slug(product.name)
            ] = product

        total = Decimal("0.00")
        order_lines = []

        for product_id, quantity in quantities.items():
            product = products_by_slug.get(product_id)

            if not product:
                raise HTTPException(
                    status_code=404,
                    detail=f"Product not found: {product_id}",
                )

            if product.stock < quantity:
                raise HTTPException(
                    status_code=409,
                    detail=f"Insufficient stock for {product.name}",
                )

            price = Decimal(str(product.price))
            total += price * quantity

            order_lines.append({
                "product": product,
                "quantity": quantity,
                "price": price,
            })

        order_number = (
            "GV-" + secrets.token_hex(4).upper()
        )

        upi_payment_uri = None

        if order_data.payment_method == "upi":
            upi_payment_uri = generate_upi_payment_link(
                upi_id=shop_upi_id,
                payee_name=shop_upi_name,
                amount=total,
                order_number=order_number,
            )

        payment_status = (
            "pending_verification"
            if order_data.payment_method == "upi"
            else "pending"
        )

        new_order = Order(
            order_number=order_number,
        customer_phone=order_data.customer_phone.strip(),
            total_amount=total,
            status="pending",
            payment_method=order_data.payment_method,
            payment_status=payment_status,
            stock_reserved=False,
       )

        db.add(new_order)
        db.flush()

        response_lines = []

        for item in order_lines:
            product = item["product"]
            quantity = item["quantity"]
            price = item["price"]

            order_item = OrderItem(
                order_id=new_order.id,
                product_id=product.id,
                product_name=product.name,
                quantity=quantity,
                unit_price=price,
            )

            db.add(order_item)

            product.stock -= quantity

            response_lines.append({
                "productId": product_slug(product.name),
                "name": product.name,
                "name_en": product.name_en or product.name,
                "name_te": product.name_te,
                "name_ta": product.name_ta,
                "brand": product.brand or "Local",
                "unit": product.unit or "1 unit",
                "price": float(price),
                "quantity": quantity,
            })

        db.commit()
        db.refresh(new_order)

        return {
            "id": new_order.order_number,
            "order_number": new_order.order_number,
            "placedAt": (
                new_order.created_at.isoformat()
                if new_order.created_at
                else None
            ),
            "lines": response_lines,
            "subtotal": float(total),
            "total": float(total),
            "payment_method": new_order.payment_method,
            "payment_status": new_order.payment_status,
            "upi_payment_uri": upi_payment_uri,
        }

    except HTTPException:
        db.rollback()
        raise

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Unable to save order. Please try again.",
        )


# --------------------------------------------------
# STAFF: GET ORDERS
# --------------------------------------------------

@app.get("/orders")
def get_all_orders(
    db: Session = Depends(get_db),
    current_staff: StaffUser = Depends(
        require_roles(
            "shopkeeper",
            "worker",
            "shelf_stocker",
        )
    ),
):
    orders = (
        db.query(Order)
        .order_by(Order.created_at.desc())
        .all()
    )

    result = []

    for order in orders:
        items = []

        for item in order.items:
            items.append({
                "product_name": item.product_name,
                "quantity": item.quantity,
                "unit_price": float(item.unit_price),
                "subtotal": float(
                    item.unit_price * item.quantity
                ),
            })

        result.append({
            "id": order_identifier(order),
            "order_number": order.order_number,
            "status": order.status,
            "payment_method": order.payment_method,
            "payment_status": order.payment_status,
            "placedAt": (
                order.created_at.isoformat()
                if order.created_at
                else None
            ),
            "total": float(order.total_amount),
            "total_amount": float(order.total_amount),
            "customer_phone": order.customer_phone,
            "rack_number": order.rack_number,
            "items": items,
        })

    return result
# --------------------------------------------------
# WORKER + SHELF STOCKER: UPDATE ORDER STATUS
# --------------------------------------------------

@app.patch("/orders/{order_number}/status")
def update_order_status(
    order_number: str,
    status_data: OrderStatusUpdate,
    db: Session = Depends(get_db),
    current_staff: StaffUser = Depends(
        require_roles("worker", "shelf_stocker")
    ),
):
    order = (
        db.query(Order)
        .filter(Order.order_number == order_number)
        .with_for_update()
        .first()
    )

    if not order:
        raise HTTPException(
            status_code=404,
            detail="Order not found",
        )

    new_status = status_data.status

    if order.payment_status != "paid":
        raise HTTPException(
            status_code=403,
            detail="Only paid orders can be processed",
        )

    # WORKER PERMISSIONS
    if current_staff.role == "worker":

        allowed_transitions = {
            "pending": ["accepted", "rejected"],
            "accepted": ["preparing"],
            "preparing": ["packed"],
        }

        permitted = allowed_transitions.get(
            order.status, []
        )

        if new_status not in permitted:
            raise HTTPException(
                status_code=403,
                detail="Worker cannot perform this status change",
            )

        order.status = new_status

        if new_status == "packed":
            order.packed_at = datetime.now()
            order.packed_by_staff_id = current_staff.id

    # SHELF STOCKER PERMISSIONS
    elif current_staff.role == "shelf_stocker":

        if new_status == "ready_for_pickup":

            if order.status != "rack_assigned":
                raise HTTPException(
                    status_code=409,
                    detail="Assign a rack before confirming placement",
                )

            if not order.rack_number:
                raise HTTPException(
                    status_code=409,
                    detail="Rack number is missing",
                )

            order.status = "ready_for_pickup"

        elif new_status == "collected":

            if order.status != "ready_for_pickup":
                raise HTTPException(
                    status_code=409,
                    detail="Only ready orders can be handed over",
                )

            order.status = "collected"
            order.collected_at = datetime.now()

        else:
            raise HTTPException(
                status_code=403,
                detail="Shelf Stocker cannot perform this status change",
            )

    db.commit()
    db.refresh(order)

    return {
        "success": True,
        "message": "Order status updated successfully",
        "order_id": order.order_number,
        "status": order.status,
    }


# --------------------------------------------------
# SHELF STOCKER: ASSIGN RACK
# --------------------------------------------------

@app.patch("/orders/{order_number}/rack")
def assign_order_rack(
    order_number: str,
    rack_data: RackAssignmentUpdate,
    db: Session = Depends(get_db),
    current_staff: StaffUser = Depends(
        require_roles("shelf_stocker")
    ),
):
    order = (
        db.query(Order)
        .filter(Order.order_number == order_number)
        .with_for_update()
        .first()
    )

    if not order:
        raise HTTPException(
            status_code=404,
            detail="Order not found",
        )

    if order.payment_status != "paid":
        raise HTTPException(
            status_code=403,
            detail="Unpaid orders cannot be assigned to a rack",
        )

    if order.status != "packed":
        raise HTTPException(
            status_code=409,
            detail="Only packed orders can be assigned to a rack",
        )

    rack_number = rack_data.rack_number.strip()

    if not rack_number:
        raise HTTPException(
            status_code=400,
            detail="Rack number cannot be empty",
        )

    order.rack_number = rack_number
    order.rack_assigned_at = datetime.now()
    order.shelf_stocker_id = current_staff.id
    order.status = "rack_assigned"

    db.commit()
    db.refresh(order)

    return {
        "success": True,
        "message": "Rack assigned successfully",
        "order_number": order.order_number,
        "rack_number": order.rack_number,
        "status": order.status,
        "assigned_by": current_staff.full_name,
    }


# --------------------------------------------------
# SHOPKEEPER: VERIFY PAYMENT
# --------------------------------------------------

@app.patch("/orders/{order_number}/payment")
def update_payment_status(
    order_number: str,
    payment_data: PaymentStatusUpdate,
    db: Session = Depends(get_db),
    current_staff: StaffUser = Depends(
        require_roles("shopkeeper")
    ),
):
    order = (
        db.query(Order)
        .filter(Order.order_number == order_number)
        .with_for_update()
        .first()
    )

    if not order:
        raise HTTPException(
            status_code=404,
            detail="Order not found",
        )

    if order.payment_status == "paid":
        raise HTTPException(
            status_code=409,
            detail="This order is already marked as paid",
        )

    order.payment_status = "paid"
    order.payment_verified_at = datetime.now()
    order.payment_reference = payment_data.payment_reference
    order.payment_verified_by_staff_id = current_staff.id

    db.commit()
    db.refresh(order)

    return {
        "success": True,
        "message": "Payment verified by shopkeeper",
        "order_id": order.order_number,
        "payment_method": order.payment_method,
        "payment_status": order.payment_status,
        "verified_by": current_staff.full_name,
    }


# --------------------------------------------------
# GNANI PRISMA SPEECH-TO-TEXT
# --------------------------------------------------

GNANI_STT_URL = "https://api.vachana.ai/stt/v3"


@app.post("/stt")
async def transcribe_audio(
    audio_file: UploadFile = File(...),
    language_code: str = Form(...),
    preferred_language: str = Form(None),
):
    api_key = os.getenv("GNANI_API_KEY")

    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="Gnani API key is not configured",
        )

    allowed_languages = {
        "en-IN",
        "te-IN",
        "ta-IN",
    }

    if language_code not in allowed_languages:
        raise HTTPException(
            status_code=400,
            detail="Unsupported language",
        )

    try:
        audio_bytes = await audio_file.read()

        if not audio_bytes:
            raise HTTPException(
                status_code=400,
                detail="Uploaded audio file is empty",
            )

        if len(audio_bytes) > 20 * 1024 * 1024:
            raise HTTPException(
                status_code=413,
                detail="Audio file must be smaller than 20 MB",
            )

        files = {
            "audio_file": (
                audio_file.filename or "audio.wav",
                audio_bytes,
                audio_file.content_type or "application/octet-stream",
            )
        }

        data = {
            "language_code": language_code,
            "preferred_language": (
                preferred_language or language_code
            ),
            "format": "transcribe",
            "itn_native_numerals": "true",
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                GNANI_STT_URL,
                headers={
                    "X-API-Key-ID": api_key,
                },
                data=data,
                files=files,
            )

        if response.status_code != 200:
            raise HTTPException(
                status_code=502,
                detail=(
                    "Gnani STT service returned HTTP "
                    f"{response.status_code}"
                ),
            )

        result = response.json()

        return {
            "success": result.get("success", True),
            "transcript": result.get("transcript", ""),
            "request_id": result.get("request_id"),
        }

    except HTTPException:
        raise

    except httpx.RequestError:
        raise HTTPException(
            status_code=502,
            detail="Unable to connect to Gnani STT service",
        )

    except ValueError:
        raise HTTPException(
            status_code=502,
            detail="Invalid response from Gnani STT service",
        )

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Audio transcription failed",
        )

    finally:
        await audio_file.close()