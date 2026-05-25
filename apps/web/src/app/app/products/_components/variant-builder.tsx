"use client";

import React, { useEffect, useMemo, useRef } from "react";

import { Image as ImageIcon, Loader2, Plus, Trash2, Wand2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { convertToWebP } from "@/lib/image-utils";

export type AttributeDef = {
  id: string;
  name: string;
  values: string[];
};

export type VariantRow = {
  id?: string;
  key: string;
  attributes: Record<string, string>;
  name: string;
  sku: string;
  barcode: string;
  barcode_type: string;
  price: string;
  cost_price: string;
  stock: string;
  image: string;
};

interface VariantBuilderProps {
  attributes: AttributeDef[];
  onAttributesChange: (defs: AttributeDef[]) => void;
  variants: VariantRow[];
  onVariantsChange: (rows: VariantRow[]) => void;
  parentName?: string;
  defaultPrice?: string;
  defaultCostPrice?: string;
  defaultStock?: string;
  skuPrefix?: string;
}

const ATTRIBUTE_SUGGESTIONS = ["Màu sắc", "Size", "Chất liệu", "Kiểu dáng"];

export function buildVariantKey(attrs: Record<string, string>): string {
  return Object.keys(attrs)
    .sort()
    .map((k) => `${k}:${attrs[k]}`)
    .join("|");
}

function cartesianProduct(attrs: AttributeDef[]): Record<string, string>[] {
  const valid = attrs.filter((a) => a?.name?.trim?.() && a.values?.some((v) => v?.trim?.()));
  if (valid.length === 0) return [];

  return valid.reduce<Record<string, string>[]>(
    (acc, attr) => {
      const cleanValues = attr.values.map((v) => v?.trim?.()).filter(Boolean);
      const next: Record<string, string>[] = [];
      for (const row of acc) {
        for (const val of cleanValues) {
          next.push({ ...row, [attr.name.trim()]: val as string });
        }
      }
      return next;
    },
    [{}],
  );
}

function getInitials(name: string): string {
  if (!name) return "";
  const cleaned = name.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").trim();

  const words = cleaned.split(/[^a-zA-Z0-9]+/).filter(Boolean);
  if (words.length === 1) {
    return words[0].toUpperCase();
  }
  return words
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function slugifySku(value: string): string {
  if (!value) return "";
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^a-zA-Z0-9]+/g, "")
    .toUpperCase();
}

function buildVariantSku(productName: string, attrs: Record<string, string>): string {
  const productPart = getInitials(productName);
  if (!productPart) return "";

  let colorValue = "";
  let sizeValue = "";
  const otherValues: string[] = [];

  for (const [key, val] of Object.entries(attrs)) {
    const lowerKey = key.toLowerCase();
    if (lowerKey.includes("màu") || lowerKey.includes("color")) {
      colorValue = val.replace(/^màu\s+/i, "").replace(/^color\s+/i, "");
    } else if (lowerKey.includes("size") || lowerKey.includes("kích") || lowerKey.includes("cỡ")) {
      sizeValue = val.replace(/^size\s+/i, "");
    } else {
      otherValues.push(val);
    }
  }

  const parts = [productPart];
  if (colorValue) parts.push(slugifySku(colorValue));
  if (sizeValue) parts.push(slugifySku(sizeValue));

  otherValues.forEach((val) => {
    if (val) parts.push(slugifySku(val));
  });

  return parts.filter(Boolean).join("-");
}

export function VariantBuilder({
  attributes,
  onAttributesChange,
  variants,
  onVariantsChange,
  parentName = "",
  defaultPrice = "",
  defaultCostPrice = "",
  defaultStock = "0",
  skuPrefix = "",
}: VariantBuilderProps) {
  // Latest variants/onVariantsChange via refs so the regenerate effect can read
  // them without subscribing (would otherwise cause infinite update loops).
  const variantsRef = useRef(variants);
  const onChangeRef = useRef(onVariantsChange);
  variantsRef.current = variants;
  onChangeRef.current = onVariantsChange;

  // Whenever attributes change, regenerate the matrix while preserving existing rows
  useEffect(() => {
    const combinations = cartesianProduct(attributes);
    const current = variantsRef.current;
    const emit = onChangeRef.current;
    if (combinations.length === 0) {
      if (current.length > 0) emit([]);
      return;
    }

    const existingByKey = new Map(current.map((v) => [v.key, v]));
    const next: VariantRow[] = combinations.map((combo) => {
      const key = buildVariantKey(combo);
      const prev = existingByKey.get(key);
      const variantName = Object.values(combo).join(" / ");
      const expectedSku = buildVariantSku(parentName, combo);

      if (prev) {
        // Only update sku if it's empty, otherwise keep user edits
        return {
          ...prev,
          attributes: combo,
          key,
          name: variantName || prev.name,
          sku: prev.sku || expectedSku,
        };
      }
      return {
        key,
        attributes: combo,
        name: variantName,
        sku: expectedSku,
        barcode: "",
        barcode_type: "CODE128",
        price: defaultPrice,
        cost_price: defaultCostPrice,
        stock: defaultStock,
        image: "",
      };
    });

    const sameLength = next.length === current.length;
    const sameKeys = sameLength && next.every((n, i) => n.key === current[i].key);
    if (!sameKeys) emit(next);
  }, [attributes, defaultPrice, defaultCostPrice, defaultStock, skuPrefix, parentName]);

  const attributeNamesUsed = useMemo(
    () => attributes.map((a) => a?.name?.trim?.() || "").filter(Boolean),
    [attributes],
  );

  const addAttribute = (specificName?: string | any) => {
    if (attributes.length >= 3) {
      toast.info("Tối đa 3 thuộc tính cho mỗi sản phẩm.");
      return;
    }
    const nameStr = typeof specificName === "string" ? specificName : undefined;
    const suggestion = nameStr || ATTRIBUTE_SUGGESTIONS.find((s) => !attributeNamesUsed.includes(s)) || "";
    onAttributesChange([...attributes, { id: crypto.randomUUID(), name: suggestion, values: [] }]);
  };

  const removeAttribute = (id: string) => {
    onAttributesChange(attributes.filter((a) => a.id !== id));
  };

  const updateAttribute = (id: string, patch: Partial<AttributeDef>) => {
    onAttributesChange(attributes.map((a) => (a.id === id ? { ...a, ...patch } : a)));
  };

  const addValue = (id: string, value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const attr = attributes.find((a) => a.id === id);
    if (!attr) return;
    if (attr.values.includes(trimmed)) return;
    updateAttribute(id, { values: [...attr.values, trimmed] });
  };

  const removeValue = (id: string, value: string) => {
    const attr = attributes.find((a) => a.id === id);
    if (!attr) return;
    updateAttribute(id, { values: attr.values.filter((v) => v !== value) });
  };

  const updateVariantRow = (key: string, patch: Partial<VariantRow>) => {
    onVariantsChange(variants.map((v) => (v.key === key ? { ...v, ...patch } : v)));
  };

  const applyBulkPrice = (price: string) => {
    if (!price.trim()) return;
    onVariantsChange(variants.map((v) => ({ ...v, price })));
    toast.success(`Đã áp dụng giá bán ${formatCurrency(price)}₫ cho ${variants.length} biến thể.`);
  };

  const applyBulkCostPrice = (cost_price: string) => {
    if (!cost_price.trim()) return;
    onVariantsChange(variants.map((v) => ({ ...v, cost_price })));
    toast.success(`Đã áp dụng giá nhập ${formatCurrency(cost_price)}₫ cho ${variants.length} biến thể.`);
  };

  const applyBulkStock = (stock: string) => {
    if (stock === "") return;
    onVariantsChange(variants.map((v) => ({ ...v, stock })));
    toast.success(`Đã áp dụng tồn kho ${stock} cho ${variants.length} biến thể.`);
  };

  const generateAllSKUs = () => {
    const productSource = parentName;
    onVariantsChange(
      variants.map((v) => ({
        ...v,
        sku: buildVariantSku(productSource, v.attributes), // Overwrite to ensure formula
      })),
    );
    toast.success("Đã sinh SKU tự động theo công thức [Sản phẩm]-[Màu]-[Size].");
  };

  // Áp dụng ảnh của variant nguồn cho mọi biến thể có chung giá trị 1 thuộc tính
  // (vd: copy ảnh sang mọi size cùng màu "Đỏ").
  const applyImageToGroup = (sourceKey: string, imageUrl: string, attrName: string, attrValue: string) => {
    if (!imageUrl) return;
    let count = 0;
    onVariantsChange(
      variants.map((v) => {
        if (v.key === sourceKey) return v;
        if (String(v.attributes[attrName] ?? "") === attrValue) {
          count += 1;
          return { ...v, image: imageUrl };
        }
        return v;
      }),
    );
    if (count > 0) {
      toast.success(`Đã áp dụng ảnh cho ${count} biến thể cùng ${attrName} "${attrValue}".`);
    } else {
      toast.info("Không có biến thể nào khác cùng giá trị này.");
    }
  };

  const generateAllBarcodes = () => {
    onVariantsChange(
      variants.map((v) => {
        if (v.barcode) return v;
        const code = String(Date.now()).slice(-8) + String(Math.floor(Math.random() * 1000)).padStart(3, "0");
        return { ...v, barcode: code, barcode_type: v.barcode_type || "CODE128" };
      }),
    );
    toast.success("Đã sinh mã vạch tự động cho các biến thể còn trống.");
  };

  return (
    <div className="space-y-4">
      {/* Attributes editor */}
      <div className="space-y-3 rounded-2xl border bg-muted/20 p-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-bold uppercase text-muted-foreground">Thuộc tính</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 gap-1 rounded-lg text-xs"
            onClick={() => addAttribute()}
          >
            <Plus className="h-3 w-3" />
            Thêm thuộc tính
          </Button>
        </div>

        {attributes.length === 0 && (
          <p className="text-xs italic text-muted-foreground">
            Chưa có thuộc tính. Nhấn "Thêm thuộc tính" để bắt đầu (vd: Màu sắc, Size).
          </p>
        )}

        {attributes.map((attr) => (
          <AttributeEditor
            key={attr.id}
            attr={attr}
            usedNames={attributeNamesUsed.filter((n) => n !== attr.name.trim())}
            onChangeName={(name) => updateAttribute(attr.id, { name })}
            onAddValue={(val) => addValue(attr.id, val)}
            onRemoveValue={(val) => removeValue(attr.id, val)}
            onRemove={() => removeAttribute(attr.id)}
          />
        ))}

        {attributes.length < 3 && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] text-muted-foreground uppercase font-semibold">Gợi ý nhanh:</span>
            {ATTRIBUTE_SUGGESTIONS.filter((s) => !attributeNamesUsed.includes(s)).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => addAttribute(s)}
                className="rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-[11px] font-medium text-primary transition-colors hover:bg-primary/10"
              >
                + {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Variants matrix */}
      {variants.length > 0 && (
        <div className="space-y-3 rounded-2xl border bg-background p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <Label className="text-xs font-bold uppercase text-muted-foreground">
                Bảng biến thể ({variants.length})
              </Label>
              <p className="text-[11px] text-muted-foreground">
                Mỗi dòng là 1 phiên bản bán hàng riêng. Điền giá, tồn kho, barcode.
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 gap-1 rounded-lg text-[11px]"
                onClick={generateAllSKUs}
              >
                <Wand2 className="h-3 w-3" />
                SKU tự động
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 gap-1 rounded-lg text-[11px]"
                onClick={generateAllBarcodes}
              >
                <Wand2 className="h-3 w-3" />
                Barcode tự động
              </Button>
            </div>
          </div>

          {/* Bulk apply row */}
          <BulkApplyRow
            onApplyPrice={applyBulkPrice}
            onApplyCostPrice={applyBulkCostPrice}
            onApplyStock={applyBulkStock}
          />

          {/* Matrix table */}
          <div className="overflow-x-auto -mx-1">
            <table className="w-full min-w-[640px] border-separate border-spacing-0 text-xs">
              <thead>
                <tr className="text-left text-[10px] uppercase text-muted-foreground">
                  <th className="px-2 py-1.5 font-bold">Ảnh</th>
                  <th className="px-2 py-1.5 font-bold">Biến thể</th>
                  <th className="px-2 py-1.5 font-bold">SKU</th>
                  <th className="px-2 py-1.5 font-bold">Barcode</th>
                  <th className="px-2 py-1.5 font-bold">Giá bán (₫)</th>
                  <th className="px-2 py-1.5 font-bold">Giá vốn (₫)</th>
                  <th className="px-2 py-1.5 font-bold">Tồn</th>
                </tr>
              </thead>
              <tbody>
                {variants.map((v) => (
                  <tr key={v.key} className="border-t">
                    <td className="px-2 py-1.5 align-middle">
                      <VariantImageCell
                        value={v.image}
                        onChange={(url) => updateVariantRow(v.key, { image: url })}
                        onApplyToGroup={(url, key, val) => applyImageToGroup(v.key, url, key, val)}
                        groupChoices={Object.entries(v.attributes).map(([k, val]) => ({ key: k, value: val }))}
                      />
                    </td>
                    <td className="px-2 py-1.5 align-middle">
                      <span className="inline-block rounded-md bg-primary/10 px-2 py-0.5 font-semibold text-primary">
                        {v.name}
                      </span>
                    </td>
                    <td className="px-2 py-1.5 align-middle">
                      <Input
                        value={v.sku}
                        onChange={(e) => updateVariantRow(v.key, { sku: e.target.value })}
                        className="h-7 rounded-md text-xs uppercase"
                        placeholder="SKU"
                      />
                    </td>
                    <td className="px-2 py-1.5 align-middle">
                      <Input
                        value={v.barcode}
                        onChange={(e) => updateVariantRow(v.key, { barcode: e.target.value })}
                        className="h-7 rounded-md text-xs"
                        placeholder="Mã vạch"
                      />
                    </td>
                    <td className="px-2 py-1.5 align-middle">
                      <Input
                        value={formatCurrency(v.price)}
                        onChange={(e) => updateVariantRow(v.key, { price: parseCurrency(e.target.value) })}
                        className="h-7 w-28 rounded-md text-xs"
                        placeholder="0"
                      />
                    </td>
                    <td className="px-2 py-1.5 align-middle">
                      <Input
                        value={formatCurrency(v.cost_price)}
                        onChange={(e) => updateVariantRow(v.key, { cost_price: parseCurrency(e.target.value) })}
                        className="h-7 w-24 rounded-md text-xs"
                        placeholder="0"
                      />
                    </td>
                    <td className="px-2 py-1.5 align-middle">
                      <Input
                        type="number"
                        value={v.stock}
                        onChange={(e) => updateVariantRow(v.key, { stock: e.target.value })}
                        className="h-7 w-16 rounded-md text-xs"
                        placeholder="0"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function VariantImageCell({
  value,
  onChange,
  onApplyToGroup,
  groupChoices,
}: {
  value: string;
  onChange: (url: string) => void;
  onApplyToGroup: (url: string, attrName: string, attrValue: string) => void;
  groupChoices: { key: string; value: string }[];
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const file = input.files?.[0];
    if (!file) return;
    const isImage = file.type.startsWith("image/") || /\.(heic|heif|jpe?g|png|webp)$/i.test(file.name);
    if (!isImage) {
      toast.error("Vui lòng chọn tệp ảnh hợp lệ.");
      input.value = "";
      return;
    }

    setUploading(true);
    const toastId = toast.loading("Đang tải ảnh biến thể...");
    try {
      let uploadFile = file;
      try {
        uploadFile = await convertToWebP(file, 0.8);
      } catch {
        // Fallback to original on devices that can't convert
      }
      const form = new FormData();
      form.append("file", uploadFile);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Tải ảnh thất bại");
      onChange(json.url);
      toast.success("Đã tải ảnh biến thể.", { id: toastId });
    } catch (err: any) {
      toast.error(err.message || "Tải ảnh thất bại", { id: toastId });
    } finally {
      setUploading(false);
      input.value = "";
    }
  };

  return (
    <div className="relative">
      <input ref={inputRef} type="file" className="hidden" accept="image/*,.heic,.heif" onChange={handleUpload} />
      <button
        type="button"
        onClick={() => {
          if (value && groupChoices.length > 0) {
            setMenuOpen((o) => !o);
          } else {
            inputRef.current?.click();
          }
        }}
        className="group relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-md border border-dashed border-muted-foreground/30 bg-muted/40 transition-all hover:border-primary/50 hover:bg-primary/5"
        title={value ? "Click để xem tùy chọn" : "Tải ảnh biến thể"}
      >
        {uploading ? (
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        ) : value ? (
          <img src={value} alt="" className="h-full w-full object-cover" />
        ) : (
          <ImageIcon className="h-4 w-4 text-muted-foreground/50" />
        )}
      </button>

      {menuOpen && value && (
        <div className="absolute left-0 top-11 z-20 w-56 rounded-lg border bg-background p-1 text-xs shadow-lg">
          <button
            type="button"
            className="block w-full rounded-md px-2 py-1.5 text-left hover:bg-muted"
            onClick={() => {
              setMenuOpen(false);
              inputRef.current?.click();
            }}
          >
            Đổi ảnh khác
          </button>
          <button
            type="button"
            className="block w-full rounded-md px-2 py-1.5 text-left text-destructive hover:bg-destructive/10"
            onClick={() => {
              setMenuOpen(false);
              onChange("");
            }}
          >
            Xóa ảnh
          </button>
          {groupChoices.length > 0 && (
            <>
              <div className="my-1 border-t" />
              <div className="px-2 pb-1 pt-0.5 text-[10px] font-bold uppercase text-muted-foreground">
                Áp dụng cho mọi biến thể cùng
              </div>
              {groupChoices.map((c) => (
                <button
                  key={`${c.key}-${c.value}`}
                  type="button"
                  className="block w-full rounded-md px-2 py-1.5 text-left hover:bg-primary/5 hover:text-primary"
                  onClick={() => {
                    setMenuOpen(false);
                    onApplyToGroup(value, c.key, c.value);
                  }}
                >
                  {c.key}: <span className="font-semibold">{c.value}</span>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function AttributeEditor({
  attr,
  usedNames,
  onChangeName,
  onAddValue,
  onRemoveValue,
  onRemove,
}: {
  attr: AttributeDef;
  usedNames: string[];
  onChangeName: (name: string) => void;
  onAddValue: (val: string) => void;
  onRemoveValue: (val: string) => void;
  onRemove: () => void;
}) {
  const [inputValue, setInputValue] = React.useState("");

  const commitValue = () => {
    if (!inputValue.trim()) return;
    // Allow comma-separated bulk input
    inputValue
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach(onAddValue);
    setInputValue("");
  };

  return (
    <div className="grid gap-2 rounded-xl border bg-background p-2.5">
      <div className="flex items-center gap-2">
        <Input
          value={attr.name}
          onChange={(e) => onChangeName(e.target.value)}
          placeholder="Tên thuộc tính (vd: Màu sắc)"
          className="h-8 flex-1 rounded-lg text-xs"
          list={`attr-suggestions-${attr.id}`}
        />
        <datalist id={`attr-suggestions-${attr.id}`}>
          {ATTRIBUTE_SUGGESTIONS.filter((s) => !usedNames.includes(s)).map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-destructive hover:bg-destructive/10"
          onClick={onRemove}
          title="Xóa thuộc tính"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {attr.values.map((val) => (
          <span
            key={val}
            className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
          >
            {val}
            <button
              type="button"
              onClick={() => onRemoveValue(val)}
              className="text-primary/60 hover:text-primary"
              aria-label={`Xóa ${val}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              commitValue();
            }
          }}
          onBlur={commitValue}
          placeholder={
            attr.values.length === 0 ? "Nhập giá trị, Enter để thêm (vd: Đỏ, Xanh, Trắng)" : "Thêm giá trị..."
          }
          className="h-7 min-w-[160px] flex-1 rounded-md text-xs"
        />
      </div>
    </div>
  );
}

function BulkApplyRow({
  onApplyPrice,
  onApplyCostPrice,
  onApplyStock,
}: {
  onApplyPrice: (val: string) => void;
  onApplyCostPrice: (val: string) => void;
  onApplyStock: (val: string) => void;
}) {
  const [bulkPrice, setBulkPrice] = React.useState("");
  const [bulkCostPrice, setBulkCostPrice] = React.useState("");
  const [bulkStock, setBulkStock] = React.useState("");

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed bg-muted/30 p-2 text-xs">
      <span className="font-bold uppercase text-muted-foreground">Áp dụng nhanh:</span>
      <div className="flex items-center gap-1">
        <Input
          value={formatCurrency(bulkPrice)}
          onChange={(e) => setBulkPrice(parseCurrency(e.target.value))}
          placeholder="Giá bán"
          className="h-7 w-28 rounded-md text-xs"
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="h-7 rounded-md text-[11px]"
          onClick={() => {
            onApplyPrice(bulkPrice);
            setBulkPrice("");
          }}
        >
          Áp giá bán
        </Button>
      </div>
      <div className="flex items-center gap-1">
        <Input
          value={formatCurrency(bulkCostPrice)}
          onChange={(e) => setBulkCostPrice(parseCurrency(e.target.value))}
          placeholder="Giá nhập"
          className="h-7 w-28 rounded-md text-xs"
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="h-7 rounded-md text-[11px]"
          onClick={() => {
            onApplyCostPrice(bulkCostPrice);
            setBulkCostPrice("");
          }}
        >
          Áp giá nhập
        </Button>
      </div>
      <div className="flex items-center gap-1">
        <Input
          type="number"
          value={bulkStock}
          onChange={(e) => setBulkStock(e.target.value)}
          placeholder="Tồn"
          className="h-7 w-20 rounded-md text-xs"
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="h-7 rounded-md text-[11px]"
          onClick={() => {
            onApplyStock(bulkStock);
            setBulkStock("");
          }}
        >
          Áp tồn
        </Button>
      </div>
    </div>
  );
}

function formatCurrency(value: string | number): string {
  if (value === "" || value === null || value === undefined) return "";
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function parseCurrency(value: string): string {
  return value.replace(/[^\d]/g, "");
}
