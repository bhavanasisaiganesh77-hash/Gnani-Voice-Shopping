from sqlalchemy import (
    Column,
    Integer,
    String,
    Numeric,
    ForeignKey,
    DateTime,
    Boolean,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database import Base


class StaffUser(Base):
    __tablename__ = "staff_users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(150), nullable=False)
    username = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(30), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, server_default=func.now())


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)

    # Multilingual product names
    name = Column(String(150), nullable=False)
    name_en = Column(String(150), nullable=True)
    name_te = Column(String(150), nullable=True)
    name_ta = Column(String(150), nullable=True)

    brand = Column(String(100))
    category = Column(String(100))
    price = Column(Numeric(10, 2), nullable=False)
    unit = Column(String(50))

    stock = Column(Integer, default=0)
    reserved_stock = Column(Integer, default=0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    low_stock_threshold = Column(Integer, default=5, nullable=False)


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)

    # Final number is assigned after payment verification
    order_number = Column(String(50), unique=True, nullable=True)
    temporary_reference = Column(String(50), unique=True, nullable=True)

    # Customer mobile number for order tracking
    customer_phone = Column(String(15), nullable=True, index=True)

    total_amount = Column(Numeric(10, 2), nullable=False)
    status = Column(String(30), default="pending")

    payment_method = Column(String(20), nullable=False, default="cash")
    payment_status = Column(String(30), nullable=False, default="pending")

    stock_reserved = Column(Boolean, default=False, nullable=False)

    payment_verified_at = Column(DateTime, nullable=True)
    payment_reference = Column(String(100), nullable=True)
    payment_verified_by_staff_id = Column(
        Integer, ForeignKey("staff_users.id"), nullable=True
    )

    packed_at = Column(DateTime, nullable=True)
    packed_by_staff_id = Column(
        Integer, ForeignKey("staff_users.id"), nullable=True
    )

    # Shelf Stocker details
    rack_number = Column(String(30), nullable=True)
    rack_assigned_at = Column(DateTime, nullable=True)
    shelf_stocker_id = Column(
        Integer, ForeignKey("staff_users.id"), nullable=True
    )

    collected_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, server_default=func.now())

    items = relationship(
        "OrderItem",
        back_populates="order",
        cascade="all, delete-orphan"
    )


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    product_id = Column(Integer, ForeignKey("products.id"))

    product_name = Column(String(150), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)

    order = relationship("Order", back_populates="items")