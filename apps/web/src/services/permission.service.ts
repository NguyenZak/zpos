import { createClient } from "@/utils/supabase/client";

export interface Permission {
  id: string;
  key?: string;
  module?: string;
  action?: string;
  name: string;
  group_name: string;
  description: string;
  sort_order?: number;
}

export interface Role {
  id: string;
  organization_id: string;
  name: string;
  description: string;
  is_system: boolean;
  is_owner?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface RolePermission {
  id: string;
  organization_id: string;
  role_id: string;
  permission_id: string;
}

export interface AuditLog {
  id: string;
  organization_id: string;
  profile_id?: string;
  action: string;
  details: any;
  created_at: string;
  profile?: {
    full_name: string;
    email: string;
  };
}

export const DEFAULT_PERMISSIONS: Permission[] = [
  // ===== Tổng quan =====
  { id: 'dashboard.view', name: 'Xem bảng điều khiển', group_name: 'Tổng quan', description: 'Truy cập trang Dashboard và các thẻ số liệu tổng quan' },
  { id: 'dashboard.revenue.view', name: 'Xem doanh thu trên Dashboard', group_name: 'Tổng quan', description: 'Hiển thị số liệu doanh thu, doanh số trên Dashboard' },
  { id: 'dashboard.profit.view', name: 'Xem lợi nhuận trên Dashboard', group_name: 'Tổng quan', description: 'Hiển thị số liệu lợi nhuận / giá vốn trên Dashboard (quyền nhạy cảm)' },

  // ===== POS / Bán hàng tại quầy =====
  { id: 'pos.access', name: 'Truy cập màn hình POS', group_name: 'POS - Bán hàng', description: 'Mở màn hình bán hàng tại quầy' },
  { id: 'pos.sell', name: 'Tạo đơn & thanh toán', group_name: 'POS - Bán hàng', description: 'Chọn hàng, thanh toán và chốt đơn tại quầy' },
  { id: 'pos.price.override', name: 'Sửa giá bán tại quầy', group_name: 'POS - Bán hàng', description: 'Chỉnh giá bán của sản phẩm ngay trên màn hình POS' },
  { id: 'pos.discount.apply', name: 'Áp dụng giảm giá', group_name: 'POS - Bán hàng', description: 'Áp dụng giảm giá theo % hoặc số tiền cho đơn POS' },
  { id: 'pos.discount.approve', name: 'Duyệt giảm giá vượt ngưỡng', group_name: 'POS - Bán hàng', description: 'Phê duyệt phiếu giảm giá vượt ngưỡng cho phép của thu ngân' },
  { id: 'pos.void_item', name: 'Hủy dòng sản phẩm trong đơn', group_name: 'POS - Bán hàng', description: 'Bỏ một dòng hàng khỏi đơn đang lập' },
  { id: 'pos.cancel_order', name: 'Hủy đơn đang lập', group_name: 'POS - Bán hàng', description: 'Hủy bỏ toàn bộ đơn hàng đang lập tại quầy' },
  { id: 'pos.refund', name: 'Hoàn tiền tại quầy', group_name: 'POS - Bán hàng', description: 'Thực hiện hoàn tiền cho khách ngay tại màn hình POS' },
  { id: 'pos.print_receipt', name: 'In hóa đơn', group_name: 'POS - Bán hàng', description: 'In hoặc xuất hóa đơn cho khách sau khi chốt đơn' },
  { id: 'pos.reprint_receipt', name: 'In lại hóa đơn cũ', group_name: 'POS - Bán hàng', description: 'In lại hóa đơn cho đơn hàng đã hoàn tất' },

  // ===== Ca làm việc & Quầy thu ngân =====
  { id: 'shifts.view', name: 'Xem ca làm việc', group_name: 'Ca làm việc', description: 'Xem danh sách ca làm và lịch sử mở/đóng ca' },
  { id: 'shifts.open', name: 'Mở ca làm việc', group_name: 'Ca làm việc', description: 'Tạo phiên ca mới với số dư đầu ca' },
  { id: 'shifts.close', name: 'Đóng ca làm việc', group_name: 'Ca làm việc', description: 'Chốt số liệu cuối ca và nộp tiền quầy' },
  { id: 'shifts.cash_in', name: 'Thu tiền vào quầy', group_name: 'Ca làm việc', description: 'Ghi nhận thu tiền mặt phát sinh trong ca' },
  { id: 'shifts.cash_out', name: 'Chi tiền từ quầy', group_name: 'Ca làm việc', description: 'Ghi nhận chi tiền mặt phát sinh trong ca' },
  { id: 'shifts.adjust', name: 'Điều chỉnh chênh lệch quỹ', group_name: 'Ca làm việc', description: 'Quyền duyệt chênh lệch số tiền cuối ca (quyền nhạy cảm)' },

  // ===== Sản phẩm =====
  { id: 'products.view', name: 'Xem danh sách sản phẩm', group_name: 'Sản phẩm', description: 'Xem danh sách sản phẩm trong hệ thống' },
  { id: 'products.detail.view', name: 'Xem chi tiết sản phẩm', group_name: 'Sản phẩm', description: 'Xem trang chi tiết của một sản phẩm' },
  { id: 'products.create', name: 'Tạo sản phẩm mới', group_name: 'Sản phẩm', description: 'Thêm sản phẩm mới vào danh mục' },
  { id: 'products.update', name: 'Cập nhật sản phẩm', group_name: 'Sản phẩm', description: 'Chỉnh sửa thông tin sản phẩm có sẵn' },
  { id: 'products.delete', name: 'Xóa sản phẩm', group_name: 'Sản phẩm', description: 'Xóa sản phẩm khỏi hệ thống (quyền nhạy cảm)' },
  { id: 'products.import', name: 'Nhập sản phẩm từ Excel', group_name: 'Sản phẩm', description: 'Tải lên file Excel/CSV để thêm hàng loạt sản phẩm' },
  { id: 'products.export', name: 'Xuất sản phẩm ra Excel', group_name: 'Sản phẩm', description: 'Xuất danh sách sản phẩm ra file Excel/CSV' },
  { id: 'products.price.update', name: 'Cập nhật giá bán', group_name: 'Sản phẩm', description: 'Thay đổi giá bán của sản phẩm' },
  { id: 'products.cost.view', name: 'Xem giá vốn', group_name: 'Sản phẩm', description: 'Xem giá vốn / giá nhập của sản phẩm (quyền nhạy cảm)' },
  { id: 'products.cost.update', name: 'Cập nhật giá vốn', group_name: 'Sản phẩm', description: 'Thay đổi giá vốn / giá nhập của sản phẩm (quyền nhạy cảm)' },
  { id: 'products.barcode.scan', name: 'Quét mã vạch', group_name: 'Sản phẩm', description: 'Quét mã vạch sản phẩm' },
  { id: 'products.barcode.generate', name: 'Tạo mã vạch', group_name: 'Sản phẩm', description: 'Tự động tạo mã vạch cho sản phẩm' },
  { id: 'products.barcode.update', name: 'Cập nhật mã vạch', group_name: 'Sản phẩm', description: 'Cập nhật mã vạch cho sản phẩm / phiên bản' },
  { id: 'products.barcode.print', name: 'In tem mã vạch', group_name: 'Sản phẩm', description: 'In tem nhãn mã vạch cho sản phẩm' },

  // ===== Danh mục =====
  { id: 'categories.view', name: 'Xem danh mục sản phẩm', group_name: 'Danh mục', description: 'Xem danh sách danh mục sản phẩm' },
  { id: 'categories.create', name: 'Tạo danh mục mới', group_name: 'Danh mục', description: 'Thêm danh mục sản phẩm mới' },
  { id: 'categories.update', name: 'Cập nhật danh mục', group_name: 'Danh mục', description: 'Chỉnh sửa tên / cấu trúc danh mục' },
  { id: 'categories.delete', name: 'Xóa danh mục', group_name: 'Danh mục', description: 'Xóa danh mục khỏi hệ thống' },

  // ===== Tồn kho =====
  { id: 'inventory.view', name: 'Xem tồn kho', group_name: 'Tồn kho', description: 'Xem số lượng tồn theo từng chi nhánh' },
  { id: 'inventory.history.view', name: 'Xem lịch sử nhập / xuất kho', group_name: 'Tồn kho', description: 'Xem toàn bộ phát sinh nhập xuất kho' },
  { id: 'inventory.adjust', name: 'Điều chỉnh tồn kho', group_name: 'Tồn kho', description: 'Tăng / giảm tồn thủ công kèm lý do (quyền nhạy cảm)' },
  { id: 'inventory.transfer', name: 'Chuyển kho giữa chi nhánh', group_name: 'Tồn kho', description: 'Tạo phiếu chuyển kho qua lại giữa các chi nhánh' },
  { id: 'inventory.audit', name: 'Kiểm kê kho', group_name: 'Tồn kho', description: 'Tạo phiếu kiểm kê và cân đối tồn' },
  { id: 'inventory.threshold.manage', name: 'Cấu hình tồn kho tối thiểu', group_name: 'Tồn kho', description: 'Thiết lập định mức cảnh báo tồn kho cho từng sản phẩm' },
  { id: 'inventory.import', name: 'Nhập tồn từ file', group_name: 'Tồn kho', description: 'Nhập tồn kho ban đầu từ file Excel/CSV' },
  { id: 'inventory.export', name: 'Xuất tồn kho ra Excel', group_name: 'Tồn kho', description: 'Xuất số liệu tồn kho ra file' },

  // ===== Đơn hàng =====
  { id: 'orders.view', name: 'Xem danh sách hóa đơn', group_name: 'Đơn hàng', description: 'Xem danh sách hóa đơn đã chốt' },
  { id: 'orders.detail.view', name: 'Xem chi tiết hóa đơn', group_name: 'Đơn hàng', description: 'Xem chi tiết dòng hàng / thanh toán của hóa đơn' },
  { id: 'orders.create', name: 'Tạo hóa đơn ngoài quầy', group_name: 'Đơn hàng', description: 'Tạo hóa đơn từ trang quản lý đơn (không qua POS)' },
  { id: 'orders.update', name: 'Cập nhật hóa đơn', group_name: 'Đơn hàng', description: 'Chỉnh sửa thông tin / dòng hàng hóa đơn' },
  { id: 'orders.cancel', name: 'Hủy hóa đơn đã chốt', group_name: 'Đơn hàng', description: 'Hủy hóa đơn sau khi đã chốt (quyền nhạy cảm)' },
  { id: 'orders.delete', name: 'Xóa hóa đơn', group_name: 'Đơn hàng', description: 'Xóa cứng hóa đơn khỏi hệ thống (quyền nhạy cảm)' },
  { id: 'orders.refund', name: 'Hoàn tiền hóa đơn', group_name: 'Đơn hàng', description: 'Tạo phiếu hoàn tiền cho hóa đơn đã chốt' },
  { id: 'orders.discount.approve', name: 'Duyệt giảm giá hóa đơn', group_name: 'Đơn hàng', description: 'Phê duyệt giảm giá vượt ngưỡng trên hóa đơn' },
  { id: 'orders.print', name: 'In / tải hóa đơn', group_name: 'Đơn hàng', description: 'In lại hoặc tải PDF hóa đơn' },
  { id: 'orders.print_temp', name: 'In tạm tính', group_name: 'Đơn hàng', description: 'In hóa đơn tạm tính trước khi thanh toán' },
  { id: 'orders.print_final', name: 'In hóa đơn thanh toán', group_name: 'Đơn hàng', description: 'In hóa đơn chính thức sau thanh toán' },
  { id: 'orders.print_kitchen', name: 'In phiếu bếp', group_name: 'Đơn hàng', description: 'In phiếu yêu cầu chế biến xuống bếp' },
  { id: 'orders.print_bar', name: 'In phiếu bar', group_name: 'Đơn hàng', description: 'In phiếu yêu cầu pha chế xuống quầy bar' },
  { id: 'orders.export', name: 'Xuất danh sách hóa đơn', group_name: 'Đơn hàng', description: 'Xuất hóa đơn ra file Excel/CSV' },

  // ===== Trả hàng =====
  { id: 'returns.view', name: 'Xem phiếu trả hàng', group_name: 'Trả hàng', description: 'Xem danh sách phiếu trả hàng' },
  { id: 'returns.create', name: 'Tạo phiếu trả hàng', group_name: 'Trả hàng', description: 'Khởi tạo phiếu trả hàng từ khách' },
  { id: 'returns.update', name: 'Cập nhật phiếu trả', group_name: 'Trả hàng', description: 'Chỉnh sửa thông tin / dòng hàng trên phiếu trả' },
  { id: 'returns.approve', name: 'Duyệt phiếu trả hàng', group_name: 'Trả hàng', description: 'Phê duyệt phiếu trả hàng' },
  { id: 'returns.refund', name: 'Hoàn tiền cho khách', group_name: 'Trả hàng', description: 'Ghi nhận hoàn tiền cho phiếu trả' },

  // ===== Khách hàng =====
  { id: 'customers.view', name: 'Xem khách hàng', group_name: 'Khách hàng', description: 'Xem danh sách khách hàng' },
  { id: 'customers.detail.view', name: 'Xem chi tiết khách hàng', group_name: 'Khách hàng', description: 'Xem hồ sơ chi tiết của một khách hàng' },
  { id: 'customers.create', name: 'Thêm khách hàng', group_name: 'Khách hàng', description: 'Tạo hồ sơ khách hàng mới' },
  { id: 'customers.update', name: 'Cập nhật khách hàng', group_name: 'Khách hàng', description: 'Chỉnh sửa thông tin khách hàng' },
  { id: 'customers.delete', name: 'Xóa khách hàng', group_name: 'Khách hàng', description: 'Xóa hồ sơ khách hàng khỏi hệ thống' },
  { id: 'customers.merge', name: 'Gộp khách hàng trùng', group_name: 'Khách hàng', description: 'Hợp nhất các hồ sơ khách hàng bị trùng' },
  { id: 'customers.import', name: 'Nhập khách hàng từ Excel', group_name: 'Khách hàng', description: 'Tải lên file để thêm khách hàng hàng loạt' },
  { id: 'customers.export', name: 'Xuất khách hàng ra Excel', group_name: 'Khách hàng', description: 'Xuất danh sách khách hàng ra file' },
  { id: 'customers.debt.view', name: 'Xem công nợ khách hàng', group_name: 'Khách hàng', description: 'Xem số dư công nợ của từng khách hàng' },
  { id: 'customers.debt.collect', name: 'Thu công nợ khách hàng', group_name: 'Khách hàng', description: 'Ghi nhận thu nợ từ khách hàng' },

  // ===== Nhà cung cấp =====
  { id: 'suppliers.view', name: 'Xem nhà cung cấp', group_name: 'Nhà cung cấp', description: 'Xem danh sách nhà cung cấp' },
  { id: 'suppliers.create', name: 'Thêm nhà cung cấp', group_name: 'Nhà cung cấp', description: 'Tạo hồ sơ nhà cung cấp mới' },
  { id: 'suppliers.update', name: 'Cập nhật nhà cung cấp', group_name: 'Nhà cung cấp', description: 'Chỉnh sửa thông tin nhà cung cấp' },
  { id: 'suppliers.delete', name: 'Xóa nhà cung cấp', group_name: 'Nhà cung cấp', description: 'Xóa hồ sơ nhà cung cấp' },
  { id: 'suppliers.debt.view', name: 'Xem công nợ NCC', group_name: 'Nhà cung cấp', description: 'Xem số dư công nợ với nhà cung cấp' },
  { id: 'suppliers.debt.pay', name: 'Thanh toán công nợ NCC', group_name: 'Nhà cung cấp', description: 'Ghi nhận thanh toán cho nhà cung cấp' },

  // ===== Nhập hàng =====
  { id: 'purchases.view', name: 'Xem đơn nhập hàng', group_name: 'Nhập hàng', description: 'Xem danh sách đơn đặt hàng nhập' },
  { id: 'purchases.create', name: 'Tạo đơn nhập hàng', group_name: 'Nhập hàng', description: 'Tạo đơn đặt hàng từ nhà cung cấp' },
  { id: 'purchases.update', name: 'Cập nhật đơn nhập', group_name: 'Nhập hàng', description: 'Chỉnh sửa đơn nhập trước khi nhận hàng' },
  { id: 'purchases.delete', name: 'Xóa đơn nhập', group_name: 'Nhập hàng', description: 'Xóa đơn nhập khỏi hệ thống' },
  { id: 'purchases.receive', name: 'Nhận hàng / nhập kho', group_name: 'Nhập hàng', description: 'Xác nhận đã nhận hàng và nhập vào kho' },
  { id: 'purchases.cancel', name: 'Hủy đơn nhập', group_name: 'Nhập hàng', description: 'Hủy đơn nhập đã tạo' },
  { id: 'purchases.return', name: 'Trả hàng cho NCC', group_name: 'Nhập hàng', description: 'Tạo phiếu trả hàng cho nhà cung cấp' },
  { id: 'purchases.approve', name: 'Duyệt đơn nhập', group_name: 'Nhập hàng', description: 'Phê duyệt đơn nhập trước khi đặt hàng NCC' },

  // ===== Tài chính =====
  { id: 'finance.overview.view', name: 'Xem tổng quan tài chính', group_name: 'Tài chính', description: 'Truy cập trang tổng quan tài chính' },
  { id: 'finance.cashflow.view', name: 'Xem dòng tiền', group_name: 'Tài chính', description: 'Xem báo cáo dòng tiền vào / ra' },
  { id: 'finance.cashflow.create', name: 'Ghi nhận giao dịch dòng tiền', group_name: 'Tài chính', description: 'Tạo bản ghi thu / chi vào dòng tiền' },
  { id: 'finance.expenses.view', name: 'Xem chi phí', group_name: 'Tài chính', description: 'Xem danh sách chi phí của doanh nghiệp' },
  { id: 'finance.expenses.create', name: 'Ghi nhận chi phí', group_name: 'Tài chính', description: 'Thêm chi phí phát sinh mới' },
  { id: 'finance.expenses.delete', name: 'Xóa chi phí', group_name: 'Tài chính', description: 'Xóa bản ghi chi phí (quyền nhạy cảm)' },
  { id: 'finance.recurring.view', name: 'Xem chi phí định kỳ', group_name: 'Tài chính', description: 'Xem các khoản chi phí định kỳ tự động' },
  { id: 'finance.recurring.manage', name: 'Quản lý chi phí định kỳ', group_name: 'Tài chính', description: 'Tạo / cập nhật / xóa khoản chi phí định kỳ' },
  { id: 'finance.profit.view', name: 'Xem lợi nhuận', group_name: 'Tài chính', description: 'Truy cập báo cáo lợi nhuận & lỗ (quyền nhạy cảm)' },
  { id: 'finance.payroll.view', name: 'Xem bảng lương', group_name: 'Tài chính', description: 'Xem bảng lương nhân viên (quyền nhạy cảm)' },
  { id: 'finance.payroll.manage', name: 'Quản lý bảng lương', group_name: 'Tài chính', description: 'Tạo và chốt bảng lương nhân viên' },
  { id: 'finance.bank_accounts.manage', name: 'Quản lý tài khoản ngân hàng', group_name: 'Tài chính', description: 'Thêm / sửa / xóa tài khoản ngân hàng nhận tiền' },

  // ===== Công nợ =====
  { id: 'debt.view', name: 'Xem công nợ', group_name: 'Công nợ', description: 'Truy cập trang quản lý công nợ' },
  { id: 'debt.create', name: 'Ghi nhận công nợ', group_name: 'Công nợ', description: 'Tạo phiếu công nợ mới' },
  { id: 'debt.collect', name: 'Thu công nợ', group_name: 'Công nợ', description: 'Ghi nhận thu / trả công nợ' },
  { id: 'debt.write_off', name: 'Xóa nợ', group_name: 'Công nợ', description: 'Xóa nợ khó đòi (quyền nhạy cảm)' },

  // ===== Hóa đơn điện tử =====
  { id: 'einvoice.view', name: 'Xem hóa đơn điện tử', group_name: 'Hóa đơn điện tử', description: 'Xem danh sách hóa đơn điện tử đã phát hành' },
  { id: 'einvoice.issue', name: 'Phát hành hóa đơn điện tử', group_name: 'Hóa đơn điện tử', description: 'Phát hành hóa đơn điện tử cho khách hàng' },
  { id: 'einvoice.configure', name: 'Cấu hình hóa đơn điện tử', group_name: 'Hóa đơn điện tử', description: 'Cấu hình kết nối nhà cung cấp HĐĐT' },

  // ===== Thanh toán VietQR =====
  { id: 'payments.view', name: 'Xem giao dịch thanh toán', group_name: 'Thanh toán VietQR', description: 'Xem lịch sử giao dịch chuyển khoản / VietQR' },
  { id: 'payments.refund', name: 'Hoàn tiền giao dịch', group_name: 'Thanh toán VietQR', description: 'Ghi nhận hoàn tiền cho giao dịch VietQR' },
  { id: 'payments.configure', name: 'Cấu hình cổng thanh toán', group_name: 'Thanh toán VietQR', description: 'Thiết lập tài khoản nhận VietQR / webhook' },

  // ===== Báo cáo =====
  { id: 'reports.dashboard.view', name: 'Báo cáo tổng quan', group_name: 'Báo cáo', description: 'Báo cáo doanh thu / hoạt động tổng hợp' },
  { id: 'reports.sales.view', name: 'Báo cáo bán hàng', group_name: 'Báo cáo', description: 'Báo cáo chi tiết doanh thu, sản phẩm bán chạy' },
  { id: 'reports.product.view', name: 'Báo cáo sản phẩm', group_name: 'Báo cáo', description: 'Báo cáo tồn kho, sản phẩm theo thời gian' },
  { id: 'reports.inventory.view', name: 'Báo cáo kho', group_name: 'Báo cáo', description: 'Báo cáo nhập / xuất / tồn kho chi tiết' },
  { id: 'reports.staff.view', name: 'Báo cáo nhân viên', group_name: 'Báo cáo', description: 'Báo cáo doanh số theo nhân viên' },
  { id: 'reports.export', name: 'Xuất báo cáo', group_name: 'Báo cáo', description: 'Xuất file PDF / Excel cho mọi báo cáo' },

  // ===== Nhân viên =====
  { id: 'staff.view', name: 'Xem nhân viên', group_name: 'Nhân viên', description: 'Xem danh sách nhân viên trong tổ chức' },
  { id: 'staff.create', name: 'Tạo nhân viên', group_name: 'Nhân viên', description: 'Cấp tài khoản đăng nhập cho nhân viên mới' },
  { id: 'staff.update', name: 'Cập nhật nhân viên', group_name: 'Nhân viên', description: 'Chỉnh sửa thông tin nhân viên' },
  { id: 'staff.deactivate', name: 'Khóa nhân viên', group_name: 'Nhân viên', description: 'Tạm ngưng / khóa tài khoản nhân viên' },
  { id: 'staff.assign_role', name: 'Gán vai trò', group_name: 'Nhân viên', description: 'Gán vai trò truy cập cho nhân viên' },
  { id: 'staff.permissions.manage', name: 'Quản lý phân quyền', group_name: 'Nhân viên', description: 'Tạo vai trò tùy chỉnh và gán quyền hạn (chỉ Owner)' },

  // ===== Vai trò & phân quyền =====
  { id: 'roles.view', name: 'Xem vai trò', group_name: 'Vai trò & Phân quyền', description: 'Xem danh sách vai trò và ma trận quyền' },
  { id: 'roles.create', name: 'Tạo vai trò', group_name: 'Vai trò & Phân quyền', description: 'Tạo vai trò mới cho tổ chức' },
  { id: 'roles.update', name: 'Cập nhật vai trò', group_name: 'Vai trò & Phân quyền', description: 'Đổi tên, mô tả và cấu hình vai trò' },
  { id: 'roles.delete', name: 'Xóa vai trò', group_name: 'Vai trò & Phân quyền', description: 'Xóa vai trò tùy chỉnh khỏi tổ chức' },
  { id: 'roles.manage', name: 'Quản lý ma trận phân quyền', group_name: 'Vai trò & Phân quyền', description: 'Tick/untick và lưu quyền cho các vai trò' },

  // ===== Tích điểm & Loyalty =====
  { id: 'loyalty.view', name: 'Xem cấu hình tích điểm', group_name: 'Tích điểm & Loyalty', description: 'Xem quy tắc tích điểm và lịch sử điểm khách hàng' },
  { id: 'loyalty.configure', name: 'Cấu hình tích điểm', group_name: 'Tích điểm & Loyalty', description: 'Thiết lập quy tắc tích / đổi điểm, hạng thành viên' },
  { id: 'loyalty.redeem', name: 'Đổi điểm thanh toán', group_name: 'Tích điểm & Loyalty', description: 'Áp dụng điểm tích lũy để thanh toán đơn hàng' },
  { id: 'loyalty.adjust', name: 'Điều chỉnh điểm thủ công', group_name: 'Tích điểm & Loyalty', description: 'Cộng / trừ điểm khách hàng thủ công kèm lý do' },
  { id: 'loyalty.campaign.manage', name: 'Quản lý chiến dịch loyalty', group_name: 'Tích điểm & Loyalty', description: 'Tạo và quản lý chiến dịch khuyến mãi tích điểm' },

  // ===== Tin nhắn Zalo =====
  { id: 'zalo.view', name: 'Xem tin nhắn Zalo', group_name: 'Tin nhắn Zalo', description: 'Xem lịch sử tin nhắn với khách qua Zalo' },
  { id: 'zalo.send', name: 'Gửi tin nhắn Zalo', group_name: 'Tin nhắn Zalo', description: 'Gửi tin nhắn chăm sóc khách qua Zalo' },
  { id: 'zalo.configure', name: 'Cấu hình Zalo OA', group_name: 'Tin nhắn Zalo', description: 'Cấu hình kết nối Zalo Official Account' },

  // ===== Trợ lý AI =====
  { id: 'ai.chat', name: 'Sử dụng trợ lý AI Chat', group_name: 'Trợ lý AI', description: 'Trò chuyện với trợ lý AI để hỏi đáp vận hành' },
  { id: 'ai.voice', name: 'Sử dụng trợ lý giọng nói', group_name: 'Trợ lý AI', description: 'Sử dụng AI giọng nói (TTS) trong cửa hàng' },
  { id: 'ai.product_image', name: 'Tạo ảnh sản phẩm bằng AI', group_name: 'Trợ lý AI', description: 'Sinh ảnh sản phẩm tự động bằng AI' },

  // ===== Đồng bộ offline =====
  { id: 'sync.view', name: 'Xem trạng thái đồng bộ', group_name: 'Đồng bộ offline', description: 'Xem trạng thái đồng bộ giữa thiết bị và server' },
  { id: 'sync.manage', name: 'Điều khiển đồng bộ offline', group_name: 'Đồng bộ offline', description: 'Kích hoạt / dừng / xử lý xung đột đồng bộ' },

  // ===== Cài đặt =====
  { id: 'settings.business.view', name: 'Xem thông tin doanh nghiệp', group_name: 'Cài đặt', description: 'Xem thông tin chung của doanh nghiệp / cửa hàng' },
  { id: 'settings.business.update', name: 'Cập nhật thông tin doanh nghiệp', group_name: 'Cài đặt', description: 'Chỉnh sửa thông tin, logo, mã số thuế' },
  { id: 'settings.branches.manage', name: 'Quản lý chi nhánh', group_name: 'Cài đặt', description: 'Tạo / sửa / xóa chi nhánh, quầy thu ngân' },
  { id: 'settings.branch.update', name: 'Cập nhật chi nhánh', group_name: 'Cài đặt', description: 'Cập nhật cấu hình chi nhánh' },
  { id: 'settings.printers.manage', name: 'Cấu hình máy in', group_name: 'Cài đặt', description: 'Cấu hình máy in hóa đơn, máy in bếp' },
  { id: 'settings.printer.update', name: 'Cập nhật máy in', group_name: 'Cài đặt', description: 'Cập nhật cấu hình máy in' },
  { id: 'settings.billing.update', name: 'Cập nhật thanh toán & gói dịch vụ', group_name: 'Cài đặt', description: 'Cập nhật cấu hình thanh toán, hóa đơn và gói dịch vụ' },
  { id: 'settings.tax.manage', name: 'Cấu hình thuế suất', group_name: 'Cài đặt', description: 'Thiết lập thuế suất và quy tắc tính thuế' },
  { id: 'settings.payments.manage', name: 'Cấu hình phương thức thanh toán', group_name: 'Cài đặt', description: 'Thiết lập phương thức thanh toán & ngân hàng' },
  { id: 'settings.security.manage', name: 'Cấu hình bảo mật', group_name: 'Cài đặt', description: 'Cấu hình 2FA, giới hạn IP, chính sách mật khẩu' },
  { id: 'settings.integrations.manage', name: 'Quản lý tích hợp', group_name: 'Cài đặt', description: 'Cấu hình tích hợp với bên thứ ba (Telegram, GHN, GHTK…)' },

  // ===== Nhật ký & Bảo mật =====
  { id: 'audit.view', name: 'Xem nhật ký hoạt động', group_name: 'Nhật ký & Bảo mật', description: 'Xem audit log toàn hệ thống' },
  { id: 'audit.export', name: 'Xuất nhật ký hoạt động', group_name: 'Nhật ký & Bảo mật', description: 'Xuất audit log ra file để báo cáo / compliance' },
  { id: 'security.sessions.manage', name: 'Quản lý phiên đăng nhập', group_name: 'Nhật ký & Bảo mật', description: 'Xem và đóng phiên đăng nhập đang hoạt động' },
];

export const DEFAULT_ROLES_PERMISSIONS: Record<string, string[]> = {
  // Owner: toàn quyền toàn hệ thống
  'Owner': DEFAULT_PERMISSIONS.map(p => p.id),

  // Manager: vận hành toàn bộ cửa hàng nhưng không quản lý phân quyền và không xem bảng lương
  'Manager': [
    'dashboard.view', 'dashboard.revenue.view', 'dashboard.profit.view',
    'pos.access', 'pos.sell', 'pos.price.override', 'pos.discount.apply', 'pos.discount.approve',
    'pos.void_item', 'pos.cancel_order', 'pos.refund', 'pos.print_receipt', 'pos.reprint_receipt',
    'shifts.view', 'shifts.open', 'shifts.close', 'shifts.cash_in', 'shifts.cash_out', 'shifts.adjust',
    'products.view', 'products.detail.view', 'products.create', 'products.update', 'products.import',
    'products.export', 'products.price.update', 'products.cost.view', 'products.cost.update',
    'products.barcode.scan', 'products.barcode.generate', 'products.barcode.update', 'products.barcode.print',
    'categories.view', 'categories.create', 'categories.update', 'categories.delete',
    'inventory.view', 'inventory.history.view', 'inventory.adjust', 'inventory.transfer',
    'inventory.audit', 'inventory.threshold.manage', 'inventory.import', 'inventory.export',
    'orders.view', 'orders.detail.view', 'orders.create', 'orders.update', 'orders.cancel',
    'orders.refund', 'orders.discount.approve', 'orders.print', 'orders.print_temp', 'orders.print_final', 'orders.print_kitchen', 'orders.print_bar', 'orders.export',
    'returns.view', 'returns.create', 'returns.update', 'returns.approve', 'returns.refund',
    'customers.view', 'customers.detail.view', 'customers.create', 'customers.update',
    'customers.merge', 'customers.import', 'customers.export',
    'customers.debt.view', 'customers.debt.collect',
    'suppliers.view', 'suppliers.create', 'suppliers.update',
    'suppliers.debt.view', 'suppliers.debt.pay',
    'purchases.view', 'purchases.create', 'purchases.update', 'purchases.receive',
    'purchases.cancel', 'purchases.return', 'purchases.approve',
    'finance.overview.view', 'finance.cashflow.view', 'finance.cashflow.create',
    'finance.expenses.view', 'finance.expenses.create',
    'finance.recurring.view', 'finance.recurring.manage', 'finance.profit.view',
    'debt.view', 'debt.create', 'debt.collect',
    'einvoice.view', 'einvoice.issue',
    'payments.view', 'payments.refund',
    'reports.dashboard.view', 'reports.sales.view', 'reports.product.view',
    'reports.inventory.view', 'reports.staff.view', 'reports.export',
    'staff.view', 'staff.assign_role',
    'roles.view',
    'loyalty.view', 'loyalty.configure', 'loyalty.redeem', 'loyalty.adjust', 'loyalty.campaign.manage',
    'zalo.view', 'zalo.send',
    'ai.chat', 'ai.voice', 'ai.product_image',
    'sync.view',
    'settings.business.view',
  ],

  // Cashier: bán hàng tại quầy
  'Cashier': [
    'dashboard.view',
    'pos.access', 'pos.sell', 'pos.discount.apply',
    'pos.void_item', 'pos.cancel_order', 'pos.print_receipt', 'pos.reprint_receipt',
    'shifts.view', 'shifts.open', 'shifts.close', 'shifts.cash_in', 'shifts.cash_out',
    'products.view', 'products.detail.view', 'products.barcode.scan', 'products.barcode.print',
    'orders.view', 'orders.detail.view', 'orders.print', 'orders.print_temp', 'orders.print_final', 'orders.print_kitchen', 'orders.print_bar',
    'returns.view', 'returns.create',
    'customers.view', 'customers.detail.view', 'customers.create', 'customers.update',
    'customers.debt.view',
    'loyalty.view', 'loyalty.redeem',
    'ai.chat',
  ],

  // Warehouse Staff: kho và nhập hàng
  'Warehouse Staff': [
    'products.view', 'products.detail.view', 'products.create', 'products.update',
    'products.import', 'products.export', 'products.cost.view',
    'products.barcode.scan', 'products.barcode.generate', 'products.barcode.update', 'products.barcode.print',
    'categories.view', 'categories.create', 'categories.update',
    'inventory.view', 'inventory.history.view', 'inventory.adjust', 'inventory.transfer',
    'inventory.audit', 'inventory.threshold.manage', 'inventory.import', 'inventory.export',
    'suppliers.view', 'suppliers.create', 'suppliers.update',
    'purchases.view', 'purchases.create', 'purchases.update', 'purchases.receive',
    'purchases.cancel', 'purchases.return',
    'reports.product.view', 'reports.inventory.view', 'reports.export',
  ],

  // Accountant: tài chính, kế toán, báo cáo
  'Accountant': [
    'dashboard.view', 'dashboard.revenue.view', 'dashboard.profit.view',
    'orders.view', 'orders.detail.view', 'orders.export',
    'purchases.view',
    'finance.overview.view', 'finance.cashflow.view', 'finance.cashflow.create',
    'finance.expenses.view', 'finance.expenses.create', 'finance.expenses.delete',
    'finance.recurring.view', 'finance.recurring.manage',
    'finance.profit.view', 'finance.payroll.view', 'finance.payroll.manage',
    'finance.bank_accounts.manage',
    'debt.view', 'debt.create', 'debt.collect',
    'customers.debt.view', 'customers.debt.collect',
    'suppliers.debt.view', 'suppliers.debt.pay',
    'einvoice.view', 'einvoice.issue', 'einvoice.configure',
    'payments.view', 'payments.refund',
    'reports.dashboard.view', 'reports.sales.view', 'reports.product.view',
    'reports.inventory.view', 'reports.staff.view', 'reports.export',
    'audit.view', 'audit.export',
  ],
};

// Local storage key prefix
const STORAGE_PREFIX = "zpos_rbac_";

const UNIVERSAL_SUBDOMAINS = ["www", "app", "console", "cms"];
const EMPTY_UUID = '00000000-0000-0000-0000-000000000000';

function getCurrentSubdomain(): string | null {
  if (typeof window === "undefined") return null;

  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") return null;

  if (host.endsWith(".localhost")) {
    const subdomain = host.replace(".localhost", "");
    return subdomain && !UNIVERSAL_SUBDOMAINS.includes(subdomain) ? subdomain : null;
  }

  const mainDomain = host.includes("zpos.vn") ? "zpos.vn" : "zpos.click";
  if (!host.endsWith(`.${mainDomain}`)) return null;

  const subdomain = host.replace(`.${mainDomain}`, "");
  return subdomain && !UNIVERSAL_SUBDOMAINS.includes(subdomain) ? subdomain : null;
}

export const permissionService = {
  async getActiveOrgId(): Promise<string> {
    const supabase = createClient();
    try {
      const subdomain = getCurrentSubdomain();
      if (subdomain) {
        const { data: org } = await supabase.from('organizations').select('id').eq('slug', subdomain).maybeSingle();
        if (org?.id) return org.id;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: member } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('profile_id', user.id)
          .maybeSingle();
        if (member?.organization_id) return member.organization_id;
      }

    } catch {}
    return EMPTY_UUID;
  },

  async getActiveUserId(): Promise<string> {
    const supabase = createClient();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) return user.id;

    } catch {}
    return EMPTY_UUID;
  },

  // Check if table missing error
  isTableMissingError(error: any): boolean {
    return error && (error.code === '42P01' || String(error.message).includes("does not exist") || String(error.message).includes("relation"));
  },

  // 1. Roles management
  async getRoles(): Promise<Role[]> {
    const supabase = createClient();
    const orgId = await this.getActiveOrgId();
    
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .eq('organization_id', orgId);
        
      if (error) {
        if (this.isTableMissingError(error)) return this.getLocalRoles(orgId);
        throw error;
      }
      
      if (!data || data.length === 0) {
        // Automatically seed default roles
        return await this.seedDefaultRoles(orgId);
      }
      
      return data;
    } catch (e) {
      console.warn("Supabase getRoles error, returning local:", e);
      return this.getLocalRoles(orgId);
    }
  },

  async getRole(id: string): Promise<Role | null> {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) {
        if (this.isTableMissingError(error)) return this.getLocalRole(id);
        throw error;
      }
      return data;
    } catch (e) {
      return this.getLocalRole(id);
    }
  },

  async assertCanManageRoles(requestedPermissionIds: string[] = []): Promise<void> {
    const member = await this.getCurrentMemberRoleAndPermissions();
    const isOwner = String(member.role || "").toLowerCase() === "owner";
    const canManage = isOwner || member.permissions.includes("roles.manage") || member.permissions.includes("staff.permissions.manage");
    if (!canManage) {
      throw new Error("Bạn cần quyền roles.manage để quản lý vai trò và phân quyền.");
    }

    if (isOwner || requestedPermissionIds.length === 0) return;

    this.assertPermissionSubset(member.permissions, requestedPermissionIds);
  },

  assertPermissionSubset(ownPermissionIds: string[], requestedPermissionIds: string[]): void {
    const ownPermissions = new Set(ownPermissionIds);
    const denied = requestedPermissionIds.filter((permissionId) => !ownPermissions.has(permissionId));
    if (denied.length > 0) {
      throw new Error(`Không thể cấp quyền cao hơn quyền hiện có: ${denied.slice(0, 5).join(", ")}`);
    }
  },

  async assertCanGrantPermissions(requestedPermissionIds: string[] = []): Promise<void> {
    const member = await this.getCurrentMemberRoleAndPermissions();
    const isOwner = String(member.role || "").toLowerCase() === "owner";
    if (isOwner || requestedPermissionIds.length === 0) return;

    const ownPermissions = new Set(member.permissions);
    const denied = requestedPermissionIds.filter((permissionId) => !ownPermissions.has(permissionId));
    if (denied.length > 0) {
      throw new Error(`Không thể cấp quyền cao hơn quyền hiện có: ${denied.slice(0, 5).join(", ")}`);
    }
  },

  async ensureDefaultPermissionsPersisted(): Promise<void> {
    const supabase = createClient();
    try {
      const payload = this.getNormalizedDefaultPermissions().map((permission, index) => ({
        id: permission.id,
        key: permission.key || permission.id,
        module: permission.module,
        action: permission.action,
        name: permission.name,
        group_name: permission.group_name,
        description: permission.description,
        sort_order: permission.sort_order ?? index + 1,
      }));
      await supabase.from("permissions").upsert(payload, { onConflict: "id" });
    } catch {
      // Older databases may not have the expanded permission columns yet. The UI still has local defaults.
    }
  },

  async createRole(name: string, description: string, permissionIds: string[] = []): Promise<Role> {
    const supabase = createClient();
    const orgId = await this.getActiveOrgId();
    const profileId = await this.getActiveUserId();

    await this.assertCanManageRoles(permissionIds);
    await this.ensureDefaultPermissionsPersisted();

    const rolePayload = {
      organization_id: orgId,
      name,
      description,
      is_system: false,
      is_owner: false
    };

    const persistPermissions = async (roleId: string) => {
      if (!permissionIds.length) return;
      const rpPayloads = permissionIds.map(pId => ({
        organization_id: orgId,
        role_id: roleId,
        permission_id: pId,
      }));
      const { error } = await supabase.from('role_permissions').insert(rpPayloads);
      if (error) {
        if (this.isTableMissingError(error)) {
          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_PREFIX + "role_permissions_" + roleId, JSON.stringify(permissionIds));
          }
          return;
        }
        throw error;
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_PREFIX + "role_permissions_" + roleId, JSON.stringify(permissionIds));
      }
    };

    const { data, error } = await supabase
      .from('roles')
      .insert([rolePayload])
      .select()
      .single();

    if (error) {
      if (this.isTableMissingError(error)) {
        const localRole = this.createLocalRole(rolePayload);
        if (permissionIds.length && typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_PREFIX + "role_permissions_" + localRole.id, JSON.stringify(permissionIds));
        }
        await this.createAuditLog(orgId, profileId, 'role.create', { name, description, role_id: localRole.id, permissions_count: permissionIds.length });
        return localRole;
      }
      throw new Error("Lỗi tạo vai trò: " + (error.message || "unknown"));
    }

    try {
      await persistPermissions(data.id);
    } catch (permErr: any) {
      throw new Error("Đã tạo vai trò nhưng không lưu được phân quyền: " + (permErr?.message || "unknown"));
    }
    await this.createAuditLog(orgId, profileId, 'role.create', { name, description, role_id: data.id, permissions_count: permissionIds.length });
    return data;
  },

  async updateRole(roleId: string, name: string, description: string, permissionIds: string[]): Promise<Role> {
    const supabase = createClient();
    const orgId = await this.getActiveOrgId();
    const profileId = await this.getActiveUserId();

    const role = await this.getRole(roleId);
    if (role?.is_owner || role?.name === 'Owner') {
      // Owner permission check: Owner permissions cannot be modified
      throw new Error("Không thể thay đổi quyền hạn của chủ doanh nghiệp (Owner)");
    }

    await this.assertCanManageRoles(permissionIds);
    await this.ensureDefaultPermissionsPersisted();

    try {
      const { data, error } = await supabase
        .from('roles')
        .update({ name, description, updated_at: new Date().toISOString() })
        .eq('id', roleId)
        .select()
        .single();

      if (error) {
        if (this.isTableMissingError(error)) return this.updateLocalRole(roleId, name, description, permissionIds);
        throw error;
      }

      // Update role permissions
      // First, delete old ones
      const { error: deleteError } = await supabase
        .from('role_permissions')
        .delete()
        .eq('role_id', roleId);
      if (deleteError) {
        if (this.isTableMissingError(deleteError)) return this.updateLocalRole(roleId, name, description, permissionIds);
        throw deleteError;
      }
      // Insert new ones
      if (permissionIds.length > 0) {
        const rpPayloads = permissionIds.map(pId => ({
          organization_id: orgId,
          role_id: roleId,
          permission_id: pId
        }));
        const { error: insertError } = await supabase.from('role_permissions').insert(rpPayloads);
        if (insertError) {
          if (this.isTableMissingError(insertError)) return this.updateLocalRole(roleId, name, description, permissionIds);
          throw insertError;
        }
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_PREFIX + "role_permissions_" + roleId, JSON.stringify(permissionIds));
      }

      await this.createAuditLog(orgId, profileId, 'role.update', { role_id: roleId, name, permissions_count: permissionIds.length });
      return data;
    } catch (e: any) {
      const message = e?.message || e?.error_description || "Không thể lưu vai trò";
      throw new Error("Lỗi lưu phân quyền: " + message);
    }
  },

  async deleteRole(roleId: string): Promise<boolean> {
    const supabase = createClient();
    const orgId = await this.getActiveOrgId();
    const profileId = await this.getActiveUserId();

    const role = await this.getRole(roleId);
    if (role?.is_owner || role?.name === 'Owner') {
      throw new Error("Không thể xóa vai trò Owner.");
    }

    await this.assertCanManageRoles();

    if (role?.is_system) {
      throw new Error("Không thể xóa vai trò hệ thống mặc định");
    }

    try {
      const { error } = await supabase
        .from('roles')
        .delete()
        .eq('id', roleId);
        
      if (error) {
        if (this.isTableMissingError(error)) return this.deleteLocalRole(roleId);
        throw error;
      }

      await this.createAuditLog(orgId, profileId, 'role.delete', { role_id: roleId, name: role?.name });
      return true;
    } catch (e) {
      this.deleteLocalRole(roleId);
      await this.createAuditLog(orgId, profileId, 'role.delete', { role_id: roleId, name: role?.name });
      return true;
    }
  },

  // 2. Permissions management
  async getPermissions(): Promise<Permission[]> {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('permissions')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('group_name', { ascending: true });
        
      if (error) {
        if (this.isTableMissingError(error)) return DEFAULT_PERMISSIONS;
        throw error;
      }
      if (!data || data.length === 0) return this.getNormalizedDefaultPermissions();
      const byId = new Map<string, Permission>();
      for (const permission of this.getNormalizedDefaultPermissions()) byId.set(permission.id, permission);
      for (const permission of data.map((item: any) => this.normalizePermission(item))) byId.set(permission.id, permission);
      return Array.from(byId.values()).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.group_name.localeCompare(b.group_name));
    } catch {
      return this.getNormalizedDefaultPermissions();
    }
  },

  normalizePermission(permission: any): Permission {
    const key = permission.key || permission.id;
    const [module = permission.module || "general", ...actionParts] = String(key).split(".");
    
    let group_name = permission.group_name || permission.module || module;
    
    // Normalize group names from English database seeds to Vietnamese UI groups
    const groupNameMap: Record<string, string> = {
      'Dashboard': 'Tổng quan',
      'POS': 'POS - Bán hàng',
      'Shifts': 'Ca làm việc',
      'shifts': 'Ca làm việc',
      'Products': 'Sản phẩm',
      'Inventory': 'Tồn kho',
      'Orders': 'Đơn hàng',
      'Returns': 'Trả hàng',
      'Customers': 'Khách hàng',
      'Suppliers': 'Nhà cung cấp',
      'Purchases': 'Nhập hàng',
      'Finance': 'Tài chính',
      'Staff': 'Nhân viên',
      'Reports': 'Báo cáo',
      'Settings': 'Cài đặt',
      'AI': 'Trợ lý AI',
      'Loyalty': 'Tích điểm & Loyalty',
      'Zalo': 'Tin nhắn Zalo',
      'Sync': 'Đồng bộ offline',
    };

    if (groupNameMap[group_name]) {
      group_name = groupNameMap[group_name];
    }

    return {
      id: key,
      key,
      module: permission.module || module,
      action: permission.action || actionParts.join(".") || key,
      name: permission.name,
      group_name,
      description: permission.description || "",
      sort_order: permission.sort_order ?? 0,
    };
  },

  getNormalizedDefaultPermissions(): Permission[] {
    return DEFAULT_PERMISSIONS.map((permission, index) => this.normalizePermission({ ...permission, sort_order: index + 1 }));
  },

  async getRolePermissions(roleId: string): Promise<string[]> {
    const supabase = createClient();
    try {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('permission_id')
        .eq('role_id', roleId);
        
      if (error) {
        if (this.isTableMissingError(error)) return this.getLocalRolePermissions(roleId);
        throw error;
      }
      return data.map(item => item.permission_id);
    } catch {
      return this.getLocalRolePermissions(roleId);
    }
  },

  // 3. User Permission Checking & Mapping
  async getCurrentMemberRoleAndPermissions(): Promise<{ role: string; roleId: string | null; permissions: string[] }> {
    const supabase = createClient();
    const orgId = await this.getActiveOrgId();
    
    try {
      // Find current user session from Supabase Auth only.
      let currentUser: any = null;
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        currentUser = user;
      }

      if (!currentUser) {
        // Fallback for anonymous demo session
        return { role: 'owner', roleId: null, permissions: DEFAULT_PERMISSIONS.map(p => p.id) };
      }

      // Live Supabase Organization Membership Query
      const { data: member, error } = await supabase
        .from('organization_members')
        .select('role, role_id')
        .eq('organization_id', orgId)
        .eq('profile_id', currentUser.id)
        .maybeSingle();

      if (error || !member) {
        // Fallback: If they are the first user/owner of organizations
        return { role: 'owner', roleId: null, permissions: DEFAULT_PERMISSIONS.map(p => p.id) };
      }

      let permissions: string[] = [];
      if (member.role_id) {
        permissions = await this.getRolePermissions(member.role_id);
      } else {
        // Map old text roles to default permissions
        const textRole = member.role;
        const matchedDefaultKey = Object.keys(DEFAULT_ROLES_PERMISSIONS).find(
          k => k.toLowerCase() === textRole.toLowerCase()
        ) || 'Owner';
        permissions = DEFAULT_ROLES_PERMISSIONS[matchedDefaultKey];
      }

      return {
        role: member.role,
        roleId: member.role_id,
        permissions
      };
    } catch {
      // Dev fallbacks
      return { role: 'owner', roleId: null, permissions: DEFAULT_PERMISSIONS.map(p => p.id) };
    }
  },

  async hasPermission(permission: string): Promise<boolean> {
    const { role, permissions } = await this.getCurrentMemberRoleAndPermissions();
    if (String(role || "").toLowerCase() === "owner") return true;
    return permissions.includes(permission);
  },

  // Chỉ Owner (hoặc super-admin @zpos.click) mới được vào trang Phân quyền.
  async isCurrentUserOwner(): Promise<boolean> {
    const supabase = createClient();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const email = (user.email || "").toLowerCase();
      if (email.endsWith("@zpos.click")) return true;

      const metaRole = String(
        (user.user_metadata as any)?.role ||
        (user.app_metadata as any)?.role ||
        ""
      ).toLowerCase();
      if (metaRole === "super_admin") return true;

      const { role, roleId } = await this.getCurrentMemberRoleAndPermissions();
      if (String(role || "").toLowerCase() === "owner") return true;
      if (!roleId) return false;
      const roleData = await this.getRole(roleId);
      return Boolean(roleData?.is_owner || roleData?.name === "Owner");
    } catch {
      return false;
    }
  },

  // 4. Staff Role Assignment
  // employeeOrMemberId có thể là employees.id (UI staff) hoặc organization_members.id
  // — hàm tự dò ra organization_members.id đúng để update.
  async assignStaffRole(employeeOrMemberId: string, roleId: string | null): Promise<boolean> {
    const supabase = createClient();
    const orgId = await this.getActiveOrgId();
    const profileId = await this.getActiveUserId();

    // Cho Owner bypass — Owner luôn được gán quyền cho nhân sự
    const isOwner = await this.isCurrentUserOwner();
    if (!isOwner) {
      const canManage = await this.hasPermission('roles.manage') || await this.hasPermission('staff.assign_role') || await this.hasPermission('staff.permissions.manage');
      if (!canManage) {
        throw new Error("Bạn không có quyền gán vai trò nhân sự.");
      }
    }

    // Tên role custom (Cashier, Manager Chi nhánh A…) — chỉ dùng cho audit, không
    // ghi thẳng vào cột organization_members.role vì cột này có CHECK constraint
    // chỉ chấp nhận 4 giá trị 'owner', 'admin', 'manager', 'staff'.
    let roleDisplayName = 'staff';
    let roleTier: 'owner' | 'admin' | 'manager' | 'staff' = 'staff';
    if (roleId) {
      const roleObj = await this.getRole(roleId);
      if (roleObj) {
        const targetPermissions = await this.getRolePermissions(roleObj.id);
        await this.assertCanGrantPermissions(targetPermissions);
        roleDisplayName = roleObj.name;
        const lower = roleObj.name.toLowerCase();
        if (lower === 'owner') roleTier = 'owner';
        else if (lower === 'admin') roleTier = 'admin';
        else if (lower === 'manager' || lower.includes('quản lý')) roleTier = 'manager';
        else roleTier = 'staff';
      }
    }

    // Dò organization_members row tương ứng. Thử các nguồn:
    //  1) employeeOrMemberId là member.id trực tiếp
    //  2) employeeOrMemberId là employees.id → tra profile_id → tìm member
    //  3) Lookup theo email từ employees → tìm profile → tìm member
    const resolveMemberId = async (): Promise<string | null> => {
      try {
        const { data: directMember } = await supabase
          .from('organization_members')
          .select('id')
          .eq('id', employeeOrMemberId)
          .eq('organization_id', orgId)
          .maybeSingle();
        if (directMember?.id) return directMember.id;
      } catch {}

      let candidateProfileId: string | null = null;
      let candidateEmail: string | null = null;
      try {
        const { data: emp } = await supabase
          .from('employees')
          .select('id, profile_id, email')
          .eq('id', employeeOrMemberId)
          .maybeSingle();
        candidateProfileId = (emp as any)?.profile_id || null;
        candidateEmail = emp?.email || null;
      } catch {}

      if (candidateProfileId) {
        const { data: member } = await supabase
          .from('organization_members')
          .select('id')
          .eq('organization_id', orgId)
          .eq('profile_id', candidateProfileId)
          .maybeSingle();
        if (member?.id) return member.id;
      }

      if (candidateEmail) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', candidateEmail.toLowerCase())
          .maybeSingle();
        if (profile?.id) {
          const { data: member } = await supabase
            .from('organization_members')
            .select('id')
            .eq('organization_id', orgId)
            .eq('profile_id', profile.id)
            .maybeSingle();
          if (member?.id) return member.id;
        }
      }

      return null;
    };

    let memberId: string | null = null;
    try {
      memberId = await resolveMemberId();
    } catch {
      memberId = null;
    }

    if (!memberId) {
      throw new Error(
        "Nhân viên này chưa có tài khoản đăng nhập vào hệ thống. Hãy mở thẻ Nhân viên → Thêm nhân viên để cấp email/mật khẩu trước khi gán vai trò."
      );
    }

    try {
      const { error, data } = await supabase
        .from('organization_members')
        .update({
          role_id: roleId,
          role: roleTier,
        })
        .eq('id', memberId)
        .eq('organization_id', orgId)
        .select('id');

      if (error) {
        if (this.isTableMissingError(error)) return this.assignLocalStaffRole(memberId, roleId, roleDisplayName);
        throw error;
      }
      if (!data || data.length === 0) {
        throw new Error("Không cập nhật được vai trò: phiên đăng nhập có thể không có quyền (RLS).");
      }

      // Đồng bộ localStorage để UI staff (đang đọc qua getLocalMemberRole)
      // hiển thị ngay vai trò mới mà không cần reload toàn bộ.
      this.assignLocalStaffRole(employeeOrMemberId, roleId, roleDisplayName);
      this.assignLocalStaffRole(memberId, roleId, roleDisplayName);

      await this.createAuditLog(orgId, profileId, 'member.role_assign', {
        member_id: memberId,
        employee_id: employeeOrMemberId,
        role_id: roleId,
        role_name: roleDisplayName,
        role_tier: roleTier,
      });
      return true;
    } catch (e: any) {
      // Bubble lên cho UI hiển thị — không silently fallback local để tránh giả "thành công"
      throw new Error(e?.message || "Không thể gán vai trò nhân sự.");
    }
  },

  // 5. Audit Log Operations
  async createAuditLog(organizationId: string, profileId: string, action: string, details: any): Promise<void> {
    const supabase = createClient();
    const logPayload = {
      organization_id: organizationId,
      profile_id: profileId === '00000000-0000-0000-0000-000000000000' ? null : profileId,
      action,
      details: typeof details === 'object' ? details : { message: String(details) }
    };

    try {
      await supabase.from('audit_logs').insert([logPayload]);
    } catch {
      this.createLocalAuditLog(logPayload);
    }
  },

  async getAuditLogs(): Promise<AuditLog[]> {
    const supabase = createClient();
    const orgId = await this.getActiveOrgId();
    
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          *,
          profile:profiles(full_name, email)
        `)
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        if (this.isTableMissingError(error)) return this.getLocalAuditLogs(orgId);
        throw error;
      }
      return data;
    } catch {
      return this.getLocalAuditLogs(orgId);
    }
  },

  // ----------------------------------------------------
  // DATABASE SEEDER FOR SUPABASE
  // ----------------------------------------------------
  async seedDefaultRoles(orgId: string): Promise<Role[]> {
    const supabase = createClient();
    const seededRoles: Role[] = [];

    for (const [roleName, permissions] of Object.entries(DEFAULT_ROLES_PERMISSIONS)) {
      try {
        await this.ensureDefaultPermissionsPersisted();
        const { data: role, error: rErr } = await supabase
          .from('roles')
          .insert([{
            organization_id: orgId,
            name: roleName,
        description: `Vai trò mặc định ${roleName}`,
            is_system: true,
            is_owner: roleName === "Owner"
          }])
          .select()
          .single();

        if (rErr || !role) continue;
        seededRoles.push(role);

        // Bind permissions
        const rpPayloads = permissions.map(pId => ({
          organization_id: orgId,
          role_id: role.id,
          permission_id: pId
        }));
        if (rpPayloads.length > 0) {
          await supabase.from('role_permissions').insert(rpPayloads);
        }
      } catch (e) {
        console.error("Seeding error for role: " + roleName, e);
      }
    }
    return seededRoles.length > 0 ? seededRoles : this.getLocalRoles(orgId);
  },

  // ----------------------------------------------------
  // LOCALSTORAGE FALLBACKS (DEV / RESILIENCY LAYER)
  // ----------------------------------------------------
  getLocalRoles(orgId: string): Role[] {
    if (typeof window === 'undefined') return this.getHardcodedRoles(orgId);
    const key = STORAGE_PREFIX + "roles_" + orgId;
    const data = localStorage.getItem(key);
    if (!data) {
      const defaults = this.getHardcodedRoles(orgId);
      localStorage.setItem(key, JSON.stringify(defaults));
      // Seed permissions too
      defaults.forEach(role => {
        const pKey = STORAGE_PREFIX + "role_permissions_" + role.id;
        const matchedKey = Object.keys(DEFAULT_ROLES_PERMISSIONS).find(k => k === role.name) || 'Owner';
        localStorage.setItem(pKey, JSON.stringify(DEFAULT_ROLES_PERMISSIONS[matchedKey]));
      });
      return defaults;
    }
    return JSON.parse(data);
  },

  getHardcodedRoles(orgId: string): Role[] {
    const roleNames = ['Owner', 'Manager', 'Cashier', 'Warehouse Staff', 'Accountant'];
    const ids = ['r-owner', 'r-manager', 'r-cashier', 'r-warehouse', 'r-accountant'];
    return roleNames.map((name, i) => ({
      id: ids[i],
      organization_id: orgId,
      name,
      description: `Vai trò mặc định ${name}`,
      is_system: true,
      is_owner: name === "Owner",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
  },

  getLocalRole(id: string): Role | null {
    if (typeof window === 'undefined') return null;
    const orgId = '00000000-0000-0000-0000-000000000000';
    const roles = this.getLocalRoles(orgId);
    return roles.find(r => r.id === id) || null;
  },

  createLocalRole(roleData: any): Role {
    const orgId = roleData.organization_id;
    const roles = this.getLocalRoles(orgId);
    const newRole: Role = {
      ...roleData,
      id: 'custom-' + Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    roles.push(newRole);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_PREFIX + "roles_" + orgId, JSON.stringify(roles));
    }
    return newRole;
  },

  updateLocalRole(roleId: string, name: string, description: string, permissionIds: string[]): Role {
    const orgId = '00000000-0000-0000-0000-000000000000';
    const roles = this.getLocalRoles(orgId);
    const idx = roles.findIndex(r => r.id === roleId);
    if (idx === -1) throw new Error("Không tìm thấy vai trò.");
    
    roles[idx] = {
      ...roles[idx],
      name,
      description,
      updated_at: new Date().toISOString()
    };
    
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_PREFIX + "roles_" + orgId, JSON.stringify(roles));
      localStorage.setItem(STORAGE_PREFIX + "role_permissions_" + roleId, JSON.stringify(permissionIds));
    }
    return roles[idx];
  },

  deleteLocalRole(roleId: string): boolean {
    const orgId = '00000000-0000-0000-0000-000000000000';
    const roles = this.getLocalRoles(orgId);
    const filtered = roles.filter(r => r.id !== roleId);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_PREFIX + "roles_" + orgId, JSON.stringify(filtered));
      localStorage.removeItem(STORAGE_PREFIX + "role_permissions_" + roleId);
    }
    return true;
  },

  getLocalRolePermissions(roleId: string): string[] {
    if (typeof window === 'undefined') return [];
    const pKey = STORAGE_PREFIX + "role_permissions_" + roleId;
    const data = localStorage.getItem(pKey);
    if (!data) {
      if (roleId === 'r-owner') return DEFAULT_ROLES_PERMISSIONS['Owner'];
      if (roleId === 'r-manager') return DEFAULT_ROLES_PERMISSIONS['Manager'];
      if (roleId === 'r-cashier') return DEFAULT_ROLES_PERMISSIONS['Cashier'];
      if (roleId === 'r-warehouse') return DEFAULT_ROLES_PERMISSIONS['Warehouse Staff'];
      if (roleId === 'r-accountant') return DEFAULT_ROLES_PERMISSIONS['Accountant'];
      return [];
    }
    return JSON.parse(data);
  },

  assignLocalStaffRole(memberId: string, roleId: string | null, roleName: string): boolean {
    if (typeof window === 'undefined') return true;
    localStorage.setItem(STORAGE_PREFIX + "member_role_" + memberId, JSON.stringify({ roleId, roleName }));
    return true;
  },

  getLocalMemberRole(memberId: string): { roleId: string | null; roleName: string } {
    if (typeof window === 'undefined') return { roleId: null, roleName: 'staff' };
    const data = localStorage.getItem(STORAGE_PREFIX + "member_role_" + memberId);
    if (!data) {
      // Default mappings
      if (memberId === '1') return { roleId: 'r-owner', roleName: 'owner' };
      if (memberId === '2') return { roleId: 'r-manager', roleName: 'manager' };
      if (memberId === '3') return { roleId: 'r-warehouse', roleName: 'warehouse' };
      return { roleId: null, roleName: 'staff' };
    }
    return JSON.parse(data);
  },

  createLocalAuditLog(log: any): void {
    if (typeof window === 'undefined') return;
    const logs = this.getLocalAuditLogs(log.organization_id);
    const newLog: AuditLog = {
      ...log,
      id: 'log-' + Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString(),
      profile: {
        full_name: "Hệ thống",
        email: "system@zpos.click"
      }
    };
    logs.unshift(newLog);
    localStorage.setItem(STORAGE_PREFIX + "audit_logs_" + log.organization_id, JSON.stringify(logs.slice(0, 100)));
  },

  getLocalAuditLogs(orgId: string): AuditLog[] {
    if (typeof window === 'undefined') return [];
    const key = STORAGE_PREFIX + "audit_logs_" + orgId;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }
};
