"use client";

import React, { useState, useEffect } from 'react';
import { 
  History, 
  User, 
  Shield, 
  Activity, 
  Search,
  Filter,
  Loader2,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';

export default function AuditLogsPage() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    // Mocking audit logs for now
    setTimeout(() => {
      setLogs([
        { id: '1', user: 'Admin', action: 'CREATE_PRODUCT', resource: 'iPhone 15 Pro', timestamp: new Date().toISOString(), status: 'success', ip: '1.1.1.1' },
        { id: '2', user: 'Lê Bán Hàng', action: 'CREATE_ORDER', resource: 'Đơn hàng #ORD-123', timestamp: new Date(Date.now() - 3600000).toISOString(), status: 'success', ip: '1.1.1.2' },
        { id: '3', user: 'Trần Thủ Kho', action: 'UPDATE_STOCK', resource: 'Sản phẩm MacBook M3', timestamp: new Date(Date.now() - 7200000).toISOString(), status: 'success', ip: '1.1.1.3' },
        { id: '4', user: 'Admin', action: 'DELETE_CUSTOMER', resource: 'Khách hàng Nguyễn Văn X', timestamp: new Date(Date.now() - 86400000).toISOString(), status: 'failed', ip: '1.1.1.1' },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl leading-none tracking-tight">Nhật ký hệ thống</h1>
          <p className="text-muted-foreground text-sm">Theo dõi mọi hoạt động thay đổi dữ liệu trên toàn hệ thống.</p>
        </div>
      </div>

      <div className="flex items-center gap-2 py-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input placeholder="Tìm theo tên nhân viên, hành động..." className="pl-10 h-9" />
        </div>
        <Button variant="outline" size="sm">
          <Filter className="mr-2 h-4 w-4" />
          Tất cả hành động
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Thời gian</TableHead>
              <TableHead>Nhân viên</TableHead>
              <TableHead>Hành động</TableHead>
              <TableHead>Đối tượng</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>IP Address</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <span className="text-sm">Đang tải nhật ký...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : logs.map(log => (
              <TableRow key={log.id}>
                <TableCell className="text-xs whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    {new Date(log.timestamp).toLocaleString('vi-VN')}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 font-medium text-sm">
                    <User className="w-4 h-4 text-muted-foreground" />
                    {log.user}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-bold text-[10px]">{log.action}</Badge>
                </TableCell>
                <TableCell className="text-sm">{log.resource}</TableCell>
                <TableCell>
                  <Badge className={log.status === 'success' ? "bg-green-500/10 text-green-600 border-none" : "bg-red-500/10 text-red-600 border-none"}>
                    {log.status === 'success' ? 'Thành công' : 'Thất bại'}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground font-mono">{log.ip}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
