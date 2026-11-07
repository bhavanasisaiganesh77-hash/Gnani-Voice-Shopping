from typing import Literal, Optional

from pydantic import BaseModel, Field


# CUSTOMER: Create an order
class OrderItemCreate(BaseModel):
    product_id: str
    quantity: int = Field(gt=0)


class OrderCreate(BaseModel):
    lines: list[OrderItemCreate]
    payment_method: Literal["upi", "cash"]
    customer_phone: str


# WORKER: Update order preparation
class OrderStatusUpdate(BaseModel):
    status: Literal[
        "accepted",
        "preparing",
        "packed",
        "rejected",
        "rack_assigned",
        "ready_for_pickup",
        "collected",
    ]


# SHOPKEEPER: Verify customer payment
class PaymentStatusUpdate(BaseModel):
    payment_status: Literal["paid"]
    payment_reference: Optional[str] = Field(
        default=None,
        max_length=100,
    )


# SHELF STOCKER: Assign a rack
class RackAssignmentUpdate(BaseModel):
    rack_number: str = Field(
        min_length=1,
        max_length=30,
    )


class ProductCreate(BaseModel):
    name: str = Field(min_length=1, max_length=150)

    name_en: Optional[str] = Field(default=None, max_length=150)
    name_te: Optional[str] = Field(default=None, max_length=150)
    name_ta: Optional[str] = Field(default=None, max_length=150)

    brand: Optional[str] = Field(default=None, max_length=100)
    category: Optional[str] = Field(default=None, max_length=100)

    price: float = Field(gt=0)
    unit: Optional[str] = Field(default="1 unit", max_length=50)

    stock: int = Field(ge=0)
    low_stock_threshold: int = Field(default=5, ge=0)


# WORKER: Update product quantity
class StockUpdate(BaseModel):
    quantity: int = Field(ge=0)


# STAFF: Login
class StaffLogin(BaseModel):
    username: str
    password: str


# SHOPKEEPER: Create staff accounts

class StaffCreate(BaseModel):
    full_name: str = Field(min_length=1, max_length=150)
    username: str = Field(min_length=3, max_length=100)
    password: str = Field(min_length=8)
    role: Literal[
        "inventory_manager",
        "worker",
        "shelf_stocker",
    ]