"use client";

import React, { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { 
  X, 
  Camera, 
  RefreshCw, 
  Volume2, 
  VolumeX, 
  AlertCircle,
  Barcode as BarcodeIcon,
  Sparkles,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface BarcodeScannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: any[];
  onScanSuccess: (product: any) => void;
}

export function BarcodeScannerDialog({
  open,
  onOpenChange,
  products,
  onScanSuccess,
}: BarcodeScannerDialogProps) {
  const [cameras, setCameras] = useState<any[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");
  const [isScanning, setIsScanning] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [manualBarcode, setManualBarcode] = useState("");
  
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const regionId = "barcode-scanner-video-region";

  // ------------------------------------------
  // SOUND EFFECTS GENERATOR (Web Audio API - 100% Offline)
  // ------------------------------------------
  const playBeep = () => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(950, ctx.currentTime); // Standard high-pitch scanner beep

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.12);

      // Mobile Haptic Feedback
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(80);
      }
    } catch (e) {
      console.warn("Audio Context failed to play beep:", e);
    }
  };

  const playErrorBeep = () => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sawtooth"; // Buzzing error sound
      osc.frequency.setValueAtTime(160, ctx.currentTime);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.35);

      // Double vibration for error
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
    } catch (e) {
      console.warn("Audio Context failed to play error beep:", e);
    }
  };

  // ------------------------------------------
  // CAMERA SCANNING ENGINE
  // ------------------------------------------
  useEffect(() => {
    if (open) {
      requestCameraPermissions();
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [open]);

  const requestCameraPermissions = async () => {
    try {
      const devices = await Html5Qrcode.getCameras();
      setHasCameraPermission(true);
      setCameras(devices);
      
      if (devices.length > 0) {
        // Prefer back camera ("environment") for mobile scanning by default
        const backCam = devices.find((d) => 
          d.label.toLowerCase().includes("back") || 
          d.label.toLowerCase().includes("environment") || 
          d.label.toLowerCase().includes("sau")
        );
        const activeCamId = backCam ? backCam.id : devices[0].id;
        setSelectedCameraId(activeCamId);
        startScanner(activeCamId);
      } else {
        toast.error("Không tìm thấy camera trên thiết bị");
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setHasCameraPermission(false);
      toast.error("Vui lòng cấp quyền truy cập camera để quét mã vạch.");
    }
  };

  const startScanner = async (cameraId: string) => {
    // Stop any running scanner first
    await stopScanner();

    try {
      const formats = [
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.QR_CODE
      ];

      const html5QrCode = new Html5Qrcode(regionId, {
        formatsToSupport: formats,
        useBarCodeDetectorIfSupported: true,
        verbose: false
      });
      scannerRef.current = html5QrCode;
      setIsScanning(true);

      await html5QrCode.start(
        cameraId,
        {
          fps: 24, // Higher frame rate for fluid scanning and fast frame capture
          qrbox: (width, height) => {
            // Wider scan window to capture complete long 1D barcodes
            const boxWidth = Math.min(width * 0.9, 380);
            const boxHeight = Math.min(height * 0.5, 180);
            return { width: boxWidth, height: boxHeight };
          },
          aspectRatio: 1.777778, // 16:9 widescreen
          videoConstraints: {
            // Request high resolution so that barcode lines don't blur into each other
            width: { min: 640, ideal: 1280, max: 1920 },
            height: { min: 480, ideal: 720, max: 1080 }
          }
        },
        (decodedText) => {
          handleBarcodeScanned(decodedText);
        },
        () => {
          // Failure callback is ignored as it triggers constantly during camera frames
        }
      );
    } catch (err) {
      console.error("Failed to start barcode scanner:", err);
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
    }
    scannerRef.current = null;
    setIsScanning(false);
  };

  const handleCameraChange = (newCameraId: string) => {
    setSelectedCameraId(newCameraId);
    if (open) {
      startScanner(newCameraId);
    }
  };

  // ------------------------------------------
  // BARCODE PROCESSING
  // ------------------------------------------
  const handleBarcodeScanned = (code: string) => {
    const cleanedCode = code.trim();
    if (!cleanedCode) return;

    // Temporal throttle to prevent rapid double-scanning of the same item
    const lastScanned = (window as any).lastScannedCode;
    const lastTime = (window as any).lastScannedTime || 0;
    const now = Date.now();

    if (lastScanned === cleanedCode && now - lastTime < 1800) {
      return; // Ignore repetitive scans within 1.8s
    }

    (window as any).lastScannedCode = cleanedCode;
    (window as any).lastScannedTime = now;

    // Search product by barcode
    const matchedProduct = products.find(
      (p) => p.barcode && p.barcode.toString().trim() === cleanedCode
    );

    if (matchedProduct) {
      playBeep();
      onScanSuccess(matchedProduct);
      toast.success(
        <div className="flex flex-col gap-1">
          <span className="font-bold text-xs text-green-600 dark:text-green-400">Đã quét thành công</span>
          <span className="font-semibold text-sm">{matchedProduct.name}</span>
          <span className="text-[10px] text-muted-foreground">Mã vạch: {cleanedCode}</span>
        </div>,
        { duration: 2500 }
      );
    } else {
      playErrorBeep();
      toast.error(
        <div className="flex flex-col gap-1.5">
          <span className="font-bold text-xs text-red-600 dark:text-red-400">Mã vạch không khớp</span>
          <span className="text-sm">Không tìm thấy sản phẩm có mã vạch: <strong className="font-mono">{cleanedCode}</strong></span>
        </div>,
        { duration: 4000 }
      );
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualBarcode.trim()) return;
    handleBarcodeScanned(manualBarcode);
    setManualBarcode("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border border-white/10 bg-zinc-950 p-6 text-white backdrop-blur-2xl">
        <DialogHeader className="flex flex-row items-center justify-between pb-2 border-b border-white/5">
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold tracking-wide text-zinc-100">
            <BarcodeIcon className="h-5 w-5 text-purple-400 animate-pulse" />
            <span>Quét Mã Vạch Sản Phẩm</span>
          </DialogTitle>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-full p-1 text-zinc-400 hover:bg-white/10 hover:text-white transition-all"
          >
            <X className="h-4 w-4" />
          </button>
        </DialogHeader>

        <div className="my-4 flex flex-col gap-4">
          {/* Audio toggle & Camera Selector toolbar */}
          <div className="flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 text-zinc-300 hover:bg-white/5"
                onClick={() => setSoundEnabled(!soundEnabled)}
              >
                {soundEnabled ? (
                  <>
                    <Volume2 className="h-4 w-4 text-emerald-400" />
                    <span>Âm thanh: Bật</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="h-4 w-4 text-zinc-500" />
                    <span>Âm thanh: Tắt</span>
                  </>
                )}
              </Button>
            </div>

            {cameras.length > 1 && (
              <div className="flex items-center gap-1.5">
                <Camera className="h-3.5 w-3.5 text-purple-400" />
                <select
                  value={selectedCameraId}
                  onChange={(e) => handleCameraChange(e.target.value)}
                  className="rounded-md border border-white/10 bg-zinc-900 px-2 py-1 text-xs text-zinc-200 outline-none focus:border-purple-500"
                >
                  {cameras.map((cam) => (
                    <option key={cam.id} value={cam.id}>
                      {cam.label || `Camera ${cameras.indexOf(cam) + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Camera Scan Region Viewport */}
          <div className="relative overflow-hidden rounded-xl border border-white/5 bg-zinc-900 shadow-2xl aspect-[1.777778]">
            <div id={regionId} className="w-full h-full object-cover [&>video]:object-cover" />
            
            {/* Dark glass overlay viewport helper */}
            {isScanning && (
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                {/* Visual Scanner Target Box */}
                <div className="relative w-[80%] h-[45%] rounded-lg border-2 border-dashed border-purple-500/40 bg-purple-500/[0.02]">
                  {/* Glowing Laser Scanline */}
                  <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-purple-400 to-transparent shadow-[0_0_10px_#c084fc] animate-scanner-laser" />
                  
                  {/* Corner brackets */}
                  <div className="absolute -left-1 -top-1 h-3 w-3 border-t-2 border-l-2 border-purple-400" />
                  <div className="absolute -right-1 -top-1 h-3 w-3 border-t-2 border-r-2 border-purple-400" />
                  <div className="absolute -left-1 -bottom-1 h-3 w-3 border-b-2 border-l-2 border-purple-400" />
                  <div className="absolute -right-1 -bottom-1 h-3 w-3 border-b-2 border-r-2 border-purple-400" />
                </div>
                
                <span className="mt-3 text-[10px] font-medium uppercase tracking-wider text-purple-400/80 animate-pulse">
                  Đặt mã vạch vào giữa khung hình để quét
                </span>
              </div>
            )}

            {/* Error/Unavailable message */}
            {hasCameraPermission === false && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-zinc-950/90 text-zinc-400">
                <AlertCircle className="h-10 w-10 text-red-500 mb-2 animate-bounce" />
                <span className="font-semibold text-white text-sm mb-1">Không thể khởi động Camera</span>
                <span className="text-xs max-w-[280px]">Hãy kiểm tra quyền cấp phép camera trên trình duyệt hoặc đổi thiết bị quét.</span>
                <Button 
                  size="sm" 
                  className="mt-3 bg-purple-600 hover:bg-purple-700 text-white font-medium"
                  onClick={requestCameraPermissions}
                >
                  Cấp Quyền Lại
                </Button>
              </div>
            )}
            
            {hasCameraPermission === null && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950 text-zinc-400">
                <RefreshCw className="h-8 w-8 text-purple-500 animate-spin mb-2" />
                <span className="text-xs">Đang kiểm tra kết nối camera...</span>
              </div>
            )}
          </div>

          {/* Manual Input Fallback */}
          <form onSubmit={handleManualSubmit} className="flex flex-col gap-2 mt-2">
            <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
              <Search className="h-3 w-3" />
              Nhập mã vạch thủ công
            </label>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Nhập mã vạch (ví dụ: 123456789)"
                value={manualBarcode}
                onChange={(e) => setManualBarcode(e.target.value)}
                className="flex-1 bg-zinc-900 border-white/10 text-white placeholder-zinc-500 h-9 text-sm focus-visible:ring-purple-500 focus-visible:ring-1"
              />
              <Button 
                type="submit" 
                className="bg-purple-600 hover:bg-purple-700 text-white h-9 px-4 text-xs font-semibold shrink-0"
              >
                Nhập
              </Button>
            </div>
          </form>

          {/* Connected hardware scanner tip */}
          <div className="rounded-lg border border-white/5 bg-white/[0.01] p-3 text-[11px] text-zinc-400 leading-relaxed flex items-start gap-2.5">
            <Sparkles className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <p>
              <b>Mẹo:</b> Hệ thống POS đã tích hợp sẵn tính năng tự động nhận diện từ súng quét mã vạch USB/Bluetooth. 
              Bạn chỉ cần cắm máy quét và bóp cò ở bất cứ đâu trên màn hình, sản phẩm sẽ tự thêm vào giỏ hàng ngay lập tức!
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
