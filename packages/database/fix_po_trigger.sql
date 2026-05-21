CREATE OR REPLACE FUNCTION update_mac_on_purchase_complete()
RETURNS TRIGGER AS $$
DECLARE
  item RECORD;
  current_global_qty INT;
  current_cost_price DECIMAL(12,2);
  new_cost_price DECIMAL(12,2);
BEGIN
  -- Chỉ chạy logic khi trạng thái đơn nhập vừa được chuyển sang 'completed'
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    
    FOR item IN SELECT * FROM purchase_order_items WHERE purchase_order_id = NEW.id
    LOOP
      IF item.variant_id IS NOT NULL THEN
        -- Cập nhật giá vốn mới nhất (giá nhập gần nhất)
        new_cost_price := item.unit_cost;

        UPDATE product_variants
        SET cost_price = new_cost_price
        WHERE id = item.variant_id;
        
      ELSE
        -- Nếu không có variant, cập nhật trực tiếp vào bảng products
        new_cost_price := item.unit_cost;

        UPDATE products
        SET cost_price = new_cost_price
        WHERE id = item.product_id;
      END IF;
      
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
