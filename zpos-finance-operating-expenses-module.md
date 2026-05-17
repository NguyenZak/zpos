# ZPOS Finance & Operating Expenses Module

## Overview

Build a complete Finance & Operating Expenses module for ZPOS.

This module helps store owners track:

- Operating costs
- Monthly expenses
- Staff salaries
- Rent
- Utilities
- Cashflow
- Profit & loss
- Real business profitability

The goal is to calculate:

```txt
Revenue
- Cost of Goods Sold (COGS)
- Operating Expenses
= Net Profit
```

---

# 1. Main Finance Modules

```txt
Finance Dashboard
Expenses
Recurring Expenses
Payroll
Cashflow
Profit & Loss
Supplier Debt
Payment Tracking
```

---

# 2. Sidebar Structure

```txt
Dashboard
POS
Products
Inventory
Orders
Customers
Suppliers
Purchases
Staff

Finance
├── Overview
├── Expenses
├── Recurring Expenses
├── Payroll
├── Cashflow
├── Profit & Loss

Reports
Settings
```

---

# 3. Finance Routes

```txt
/finance
/finance/expenses
/finance/expenses/new
/finance/expenses/[id]

/finance/recurring
/finance/recurring/new

/finance/payroll
/finance/payroll/[id]

/finance/cashflow

/finance/profit-loss
```

---

# 4. Expense Categories

Default categories:

```txt
Rent
Electricity
Water
Internet
Salary
Bonus
Marketing
Shipping Fee
Software Subscription
Bank Fee
Repair & Maintenance
Office Supplies
Tax
Equipment
Fuel
Cleaning
Security
Insurance
Other
```

---

# 5. Expenses Module

## Create Expense Form

Fields:

```txt
Expense title
Expense category
Amount
Branch
Expense date
Payment method
Supplier / Receiver
Recurring expense
Recurring frequency
Next due date
Attachment
Internal note
Status
Created by
```

---

# 6. Expense Status

```txt
draft
pending
paid
cancelled
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

# 8. Expense Features

Required features:

```txt
Expense CRUD
Category filter
Date filter
Branch filter
Payment method filter
Attachment upload
Receipt image upload
PDF invoice upload
Export Excel
Export PDF
Print expense
Expense approval workflow
```

---

# 9. Recurring Expenses

Very important for real businesses.

Examples:

```txt
Store rent
Electricity bill
Water bill
Internet bill
Software subscription
Staff salary
Security service
```

---

# 10. Recurring Expense Fields

```txt
Recurring title
Category
Amount
Frequency
Start date
End date
Next due date
Auto-create enabled
Reminder days before due
Branch
Note
```

---

# 11. Frequency Types

```txt
daily
weekly
monthly
quarterly
yearly
```

---

# 12. Recurring Features

Required features:

```txt
Auto create expense
Due date reminder
Recurring calendar
Auto notification
Pause recurring
Resume recurring
Duplicate recurring
```

---

# 13. Payroll Module

## Payroll Features

```txt
Salary management
Payroll periods
Employee salary
Bonus
Deduction
Attendance support
Payroll approval
Payroll payment
Payroll history
```

---

# 14. Payroll Fields

```txt
Staff
Branch
Base salary
Bonus
Allowance
Deduction
Final salary
Payment date
Payment status
Note
```

---

# 15. Cashflow Module

## Cashflow Features

```txt
Cash inflow
Cash outflow
Daily cashflow
Monthly cashflow
Branch cashflow
Cash balance
Transaction history
```

---

# 16. Cashflow Transaction Types

```txt
sale
expense
salary
purchase
refund
supplier_payment
customer_payment
other_income
other_expense
```

---

# 17. Profit & Loss Report

## Required Metrics

```txt
Revenue
COGS
Gross Profit
Operating Expenses
Payroll
Rent
Utilities
Marketing Cost
Software Cost
Net Profit
Net Margin
```

---

# 18. Example Profit Calculation

```txt
Revenue: 300,000,000

COGS: 180,000,000
Gross Profit: 120,000,000

Operating Expenses: 70,000,000

Net Profit: 50,000,000
```

---

# 19. Finance Dashboard

Widgets:

```txt
Total revenue
Total expenses
Net profit
Cash balance
Upcoming recurring expenses
Payroll due
Expense breakdown chart
Cashflow chart
Top expense categories
```

---

# 20. Charts

Use Recharts.

Required charts:

```txt
Expense by category
Monthly expenses
Cashflow trend
Profit trend
Revenue vs expenses
Branch profitability
```

---

# 21. Required Database Tables

## expense_categories

Fields:

```txt
id
organization_id
name
icon
color
created_at
```

---

## expenses

Fields:

```txt
id
organization_id
branch_id
category_id
title
amount
payment_method
expense_date
status
attachment_url
note
created_by
created_at
updated_at
```

---

## recurring_expenses

Fields:

```txt
id
organization_id
branch_id
category_id
title
amount
frequency
start_date
end_date
next_due_date
auto_create
reminder_days
status
created_by
created_at
```

---

## payroll

Fields:

```txt
id
organization_id
branch_id
staff_id
base_salary
bonus
allowance
deduction
final_salary
payment_status
payment_date
note
created_at
```

---

## cashflow_transactions

Fields:

```txt
id
organization_id
branch_id
type
reference_type
reference_id
amount
transaction_date
note
created_by
created_at
```

---

# 22. Expense Approval Workflow

Optional enterprise feature.

Workflow:

```txt
Staff creates expense
→ Manager approves
→ Accountant pays
→ Expense marked as paid
```

Statuses:

```txt
draft
pending_approval
approved
rejected
paid
```

---

# 23. Notifications

Required notifications:

```txt
Upcoming rent payment
Salary due
Electricity due
Internet due
Low cash balance
Recurring expense reminder
```

---

# 24. Audit Logs

Every finance action must create logs.

Examples:

```txt
expense_created
expense_updated
expense_deleted
expense_paid
payroll_paid
cashflow_created
```

---

# 25. Security Rules

- All finance data scoped by organization_id
- Branch-level permissions
- Only managers/accountants can approve expenses
- Only owners can access profit reports
- Supabase RLS enabled
- All mutations validated with Zod
- Audit logs required for financial operations

---

# 26. Required UI Components

Use shadcn/ui.

Components:

```txt
DataTable
Card
Tabs
Badge
Dialog
Form
DatePicker
Calendar
Combobox
CurrencyInput
ChartCard
MetricCard
ExpenseChart
CashflowChart
ProfitChart
```

---

# 27. Realtime Features

Use Supabase realtime.

Realtime updates:

```txt
New expense
Expense paid
Payroll updated
Cashflow changed
Profit updated
Recurring reminder
```

---

# 28. AI Finance Features (Future)

Future AI features:

```txt
AI expense prediction
AI cost optimization
AI cashflow forecasting
AI abnormal expense detection
AI profitability analysis
AI branch performance ranking
```

---

# 29. Final Goal

Build a complete Finance & Operating Expense module for ZPOS similar to:

- KiotViet
- Sapo
- Odoo
- ERPNext
- Oracle NetSuite

The system must support real-world store operations, multi-branch finance tracking and accurate business profitability reporting.
