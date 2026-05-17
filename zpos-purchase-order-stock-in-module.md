# ZPOS Purchase Order / Stock In Module

## Overview

The Purchase Order / Stock In module is one of the most important modules in the ZPOS Retail Operating System.

This module handles:

- Purchase orders
- Supplier management
- Inventory receiving
- Inventory cost tracking
- Supplier debt
- Inventory movement
- Payment tracking
- Warehouse operations

---

# 1. Purchase Order Information

## Basic Information

Fields:

```txt
Purchase order code
Supplier
Branch
Warehouse
Created date
Receiving date
Created by
Status
Internal note
External note
```

---

# 2. Purchase Order Status

```txt
draft
ordered
receiving
received
cancelled
```

Description:

```txt
draft      → chưa xác nhận
ordered    → đã gửi nhà cung cấp
receiving  → đang nhập hàng từng phần
received   → đã nhận đủ
cancelled  → đã hủy
```

---

# 3. Product Table

Each purchase order contains multiple products.

## Required Columns

```txt
Product
Variant
SKU
Barcode
Unit
Quantity
Received quantity
Unit cost
Discount
VAT
Total amount
```

---

# 4. Product-Level Advanced Fields

Important for:

- food
- cosmetics
- pharmacy
- agriculture
- warehouse management

Fields:

```txt
Batch number
Lot number
Production date
Expired date
Manufacturing date
Storage note
```

---

# 5. Cost Management

Store all product costs.

Required fields:

```txt
unit_cost
landed_cost
shipping_fee
import_tax
other_fee
discount_amount
vat_amount
```

Purpose:

```txt
- calculate average cost
- calculate COGS
- calculate profit
- inventory valuation
```

---

# 6. Payment Section

Purchase payment information.

Fields:

```txt
Subtotal
Discount
VAT
Shipping fee
Other fee
Grand total
Paid amount
Remaining amount
Payment method
Payment date
Payment note
```

---

# 7. Payment Methods

```txt
cash
bank_transfer
vietqr
momo
zalopay
card
debt
```

---

# 8. Attachments

Allow uploading files.

Supported files:

```txt
Invoice PDF
Invoice image
Supplier receipt
Excel import file
Delivery document
Custom attachment
```

---

# 9. Inventory Actions

After confirming receiving:

```txt
+ increase inventory
+ create inventory movement
+ update average cost
+ update supplier debt
+ create audit logs
```

---

# 10. Inventory Movement

Each receiving action must create:

```txt
movement_type = purchase
```

Required movement fields:

```txt
before_quantity
after_quantity
quantity
reference_type
reference_id
created_by
created_at
```

---

# 11. Purchase Summary Card

UI summary card should contain:

```txt
Subtotal
Discount
VAT
Shipping fee
Other fee
Grand total
Paid amount
Remaining amount
```

---

# 12. Main Actions

Buttons:

```txt
Save draft
Confirm receiving
Print purchase order
Export PDF
Cancel purchase order
Receive partial stock
```

---

# 13. Supplier Debt

Supplier payable tracking.

Required features:

```txt
Supplier debt
Supplier payment history
Supplier balance
Debt report
Payment schedule
```

---

# 14. Partial Receiving

Support partial stock receiving.

Example:

```txt
Ordered: 100
Received: 40
Remaining: 60
```

This is required for real warehouse operations.

---

# 15. Purchase Order Workflow

```txt
Create purchase order
→ Select supplier
→ Add products
→ Enter quantity and cost
→ Calculate totals
→ Save draft
→ Confirm order
→ Receive inventory
→ Update stock
→ Print document
```

---

# 16. Purchase Order UI Structure

## Header

```txt
Supplier
Branch
Warehouse
Status
Created date
Receiving date
```

---

## Product Table

```txt
Product
SKU
Quantity
Received
Unit cost
Discount
VAT
Total
```

---

## Right Summary Panel

```txt
Subtotal
Discount
VAT
Shipping
Other fee
Grand total
Paid
Remaining
```

---

# 17. Required Database Tables

## purchase_orders

Fields:

```txt
id
organization_id
branch_id
supplier_id
warehouse_id
code
status
subtotal
discount_amount
tax_amount
shipping_fee
other_fee
total_amount
paid_amount
remaining_amount
note
created_by
created_at
updated_at
```

---

## purchase_order_items

Fields:

```txt
id
purchase_order_id
product_id
variant_id
sku
barcode
quantity
received_quantity
unit_cost
discount_amount
tax_amount
total_amount
batch_number
lot_number
manufactured_at
expired_at
storage_note
```

---

## supplier_payments

Fields:

```txt
id
purchase_order_id
supplier_id
amount
method
reference
note
paid_by
paid_at
created_at
```

---

# 18. Required Features

## Supplier Features

```txt
Supplier list
Supplier history
Supplier debt
Supplier payments
Supplier analytics
```

---

## Warehouse Features

```txt
Warehouse receiving
Warehouse transfer
Inventory valuation
Inventory movement history
Low stock alert
```

---

## Finance Features

```txt
Purchase cost tracking
Payment tracking
Debt tracking
Profit calculation
Inventory valuation
```

---

# 19. Audit Logs

Every important action must create audit logs.

Examples:

```txt
purchase_order_created
purchase_order_updated
purchase_order_received
purchase_order_cancelled
supplier_payment_created
inventory_updated
```

---

# 20. Realtime Features

Use Supabase realtime.

Realtime events:

```txt
Inventory updated
Purchase order updated
Supplier payment updated
Stock received
Low stock warning
```

---

# 21. Recommended UI Components

Use shadcn/ui.

Components:

```txt
DataTable
Form
Dialog
Drawer
Card
Badge
Tabs
Calendar
DatePicker
Select
Combobox
Textarea
FileUploader
AlertDialog
Toast
```

---

# 22. Advanced Features

## AI Purchasing

Future AI features:

```txt
AI inventory forecasting
AI supplier recommendation
AI abnormal cost detection
AI low stock prediction
AI reorder suggestion
```

---

# 23. F&B / Restaurant Features

Special features for F&B:

```txt
Ingredient inventory
Recipe costing
Unit conversion
kg → g
box → bottle
carton → pack
```

---

# 24. Security Rules

- Every purchase order belongs to organization_id
- Every stock action creates inventory movement
- Every payment creates audit logs
- Role-based permissions required
- Only authorized staff can receive stock
- Only managers can cancel purchase orders
- All forms validate with Zod
- Supabase RLS enabled

---

# 25. Final Goal

Build a professional Purchase Order and Inventory Receiving module similar to:

- KiotViet
- Sapo
- Odoo
- Shopify POS
- Oracle NetSuite
- ERPNext

The module must support real-world warehouse operations, scalable inventory management and enterprise-ready purchasing workflows.
