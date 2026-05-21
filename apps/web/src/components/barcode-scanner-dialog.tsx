"use client";

import type React from "react";
import { useEffect, useRef, useState } from "react";

import { type CameraDevice, Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import {
  AlertCircle,
  Barcode as BarcodeIcon,
  Camera,
  RefreshCw,
  Search,
  Sparkles,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface BarcodeScannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products?: any[];
  onScanSuccess?: (product: any) => void;
  onRawScan?: (code: string) => void;
}

const CAMERA_BACK_VALUE = "__zpos_camera_back";
const CAMERA_FRONT_VALUE = "__zpos_camera_front";

export function BarcodeScannerDialog({
  open,
  onOpenChange,
  products = [],
  onScanSuccess,
  onRawScan,
}: BarcodeScannerDialogProps) {
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");
  const [isScanning, setIsScanning] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [manualBarcode, setManualBarcode] = useState("");

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const regionId = "barcode-scanner-video-region";

  const backCameraLabelTerms = [
    "back",
    "rear",
    "environment",
    "world",
    "sau",
    "mặt sau",
    "camera sau",
    "0, facing back",
  ];

  const getPreferredBackCamera = (devices: CameraDevice[]) => {
    return devices.find((device) => {
      const label = device.label.toLowerCase();
      return backCameraLabelTerms.some((term) => label.includes(term));
    });
  };

  const getFallbackCamera = (devices: CameraDevice[]) => {
    return getPreferredBackCamera(devices);
  };

  const getScannerCameraTarget = (cameraSelection = CAMERA_BACK_VALUE): string | MediaTrackConstraints => {
    if (cameraSelection === CAMERA_BACK_VALUE) return { facingMode: "environment" };
    if (cameraSelection === CAMERA_FRONT_VALUE) return { facingMode: "user" };
    return cameraSelection;
  };

  const prepareScannerVideoElement = async () => {
    const videoElement = document.querySelector<HTMLVideoElement>(`#${regionId} video`);
    if (!videoElement) return false;

    videoElement.setAttribute("playsinline", "true");
    videoElement.setAttribute("webkit-playsinline", "true");
    videoElement.muted = true;
    videoElement.autoplay = true;
    videoElement.style.width = "100%";
    videoElement.style.height = "100%";
    videoElement.style.objectFit = "cover";

    try {
      await videoElement.play();
    } catch (error) {
      console.warn("Barcode scanner video play() was blocked:", error);
    }

    if (videoElement.videoWidth > 0 && videoElement.videoHeight > 0) return true;

    await new Promise((resolve) => window.setTimeout(resolve, 600));
    return videoElement.videoWidth > 0 && videoElement.videoHeight > 0;
  };

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
  // biome-ignore lint/correctness/useExhaustiveDependencies: scanner lifecycle is intentionally keyed only by dialog visibility.
  useEffect(() => {
    if (open) {
      void requestCameraPermissions();
    } else {
      // If it was closed externally without handleOpenChange
      void stopScanner();
    }

    return () => {
      // Cleanup on unmount
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch((error) => {
          console.warn("Failed to stop barcode scanner during cleanup:", error);
        });
      }
    };
  }, [open]);

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && scannerRef.current && scannerRef.current.isScanning) {
      // Stop scanner first to avoid "play() interrupted" DOM removal errors
      void stopScanner().finally(() => {
        onOpenChange(false);
      });
    } else {
      onOpenChange(newOpen);
    }
  };

  const requestCameraPermissions = async () => {
    try {
      const devices = await Html5Qrcode.getCameras();
      setHasCameraPermission(true);
      setCameras(devices);

      if (devices.length > 0) {
        const backCam = getPreferredBackCamera(devices);
        const preferredCamera = backCam?.id ?? CAMERA_BACK_VALUE;
        setSelectedCameraId(preferredCamera);
        void startScanner(preferredCamera, devices);
      } else {
        toast.error("Không tìm thấy camera trên thiết bị");
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setHasCameraPermission(false);
      toast.error("Vui lòng cấp quyền truy cập camera để quét mã vạch.");
    }
  };

  const startScanner = async (cameraSelection = CAMERA_BACK_VALUE, fallbackDevices: CameraDevice[] = cameras) => {
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
        Html5QrcodeSupportedFormats.QR_CODE,
      ];

      const html5QrCode = new Html5Qrcode(regionId, {
        formatsToSupport: formats,
        useBarCodeDetectorIfSupported: true,
        verbose: false,
      });
      scannerRef.current = html5QrCode;
      setIsScanning(true);

      await html5QrCode.start(
        getScannerCameraTarget(cameraSelection),
        {
          fps: 10,
          qrbox: (width, height) => {
            // Wider scan window to capture complete long 1D barcodes
            const boxWidth = Math.min(width * 0.9, 380);
            const boxHeight = Math.min(height * 0.5, 180);
            return { width: boxWidth, height: boxHeight };
          },
        },
        (decodedText) => {
          handleBarcodeScanned(decodedText);
        },
        () => {
          // Failure callback is ignored as it triggers constantly during camera frames
        },
      );

      const hasVideoFrame = await prepareScannerVideoElement();
      if (!hasVideoFrame && cameraSelection === CAMERA_BACK_VALUE) {
        const fallbackCamera = getFallbackCamera(fallbackDevices);
        if (fallbackCamera?.id) {
          setSelectedCameraId(fallbackCamera.id);
          await startScanner(fallbackCamera.id, fallbackDevices);
          return;
        }
      }

      const activeDeviceId = html5QrCode.getRunningTrackSettings().deviceId;
      if (activeDeviceId && cameraSelection !== CAMERA_BACK_VALUE && cameraSelection !== CAMERA_FRONT_VALUE) {
        setSelectedCameraId(activeDeviceId);
      }

      // Camera labels can be empty before permission on iOS/Android. Refresh after the stream starts.
      Html5Qrcode.getCameras()
        .then((updatedDevices) => {
          if (updatedDevices.length > 0) setCameras(updatedDevices);
        })
        .catch(() => undefined);
    } catch (err) {
      console.error("Failed to start barcode scanner:", err);
      setIsScanning(false);
      if (cameraSelection === CAMERA_BACK_VALUE) {
        const fallbackCamera = getFallbackCamera(fallbackDevices);
        if (fallbackCamera?.id) {
          setSelectedCameraId(fallbackCamera.id);
          await startScanner(fallbackCamera.id, fallbackDevices);
          return;
        }
      }
      toast.error("Không thể mở camera quét mã vạch. Vui lòng thử đổi camera hoặc kiểm tra quyền truy cập.");
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current?.isScanning) {
      try {
        await scannerRef.current.stop();
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
    }
    scannerRef.current = null;
    setIsScanning(false);
  };

  const handleCameraChange = (newCameraSelection: string) => {
    setSelectedCameraId(newCameraSelection);
    if (open) {
      void startScanner(newCameraSelection);
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

    // 1. Raw scan mode (e.g. populating product code fields)
    if (onRawScan) {
      playBeep();
      onRawScan(cleanedCode);
      toast.success(
        <div className="flex flex-col gap-1">
          <span className="font-bold text-green-600 text-xs dark:text-green-400">Đã nhận diện mã vạch</span>
          <span className="font-bold font-mono text-sm">{cleanedCode}</span>
        </div>,
        { duration: 2000 },
      );
      handleOpenChange(false);
      return;
    }

    // 2. POS product matching mode
    if (products && onScanSuccess) {
      const matchedProduct = products.find((p) => p.barcode && p.barcode.toString().trim() === cleanedCode);

      if (matchedProduct) {
        playBeep();
        onScanSuccess(matchedProduct);
        toast.success(
          <div className="flex flex-col gap-1">
            <span className="font-bold text-green-600 text-xs dark:text-green-400">Đã quét thành công</span>
            <span className="font-semibold text-sm">{matchedProduct.name}</span>
            <span className="text-[10px] text-muted-foreground">Mã vạch: {cleanedCode}</span>
          </div>,
          { duration: 2500 },
        );
      } else {
        playErrorBeep();
        toast.error(
          <div className="flex flex-col gap-1.5">
            <span className="font-bold text-red-600 text-xs dark:text-red-400">Mã vạch không khớp</span>
            <span className="text-sm">
              Không tìm thấy sản phẩm có mã vạch: <strong className="font-mono">{cleanedCode}</strong>
            </span>
          </div>,
          { duration: 4000 },
        );
      }
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualBarcode.trim()) return;
    handleBarcodeScanned(manualBarcode);
    setManualBarcode("");
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md border border-white/10 bg-zinc-950 p-6 text-white backdrop-blur-2xl">
        <DialogHeader className="flex flex-row items-center justify-between border-white/5 border-b pb-2">
          <DialogTitle className="flex items-center gap-2 font-semibold text-lg text-zinc-100 tracking-wide">
            <BarcodeIcon className="h-5 w-5 animate-pulse text-purple-400" />
            <span>Quét Mã Vạch Sản Phẩm</span>
          </DialogTitle>
          <button
            type="button"
            onClick={() => handleOpenChange(false)}
            className="rounded-full p-1 text-zinc-400 transition-all hover:bg-white/10 hover:text-white"
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

            {(cameras.length > 0 || selectedCameraId) && (
              <div className="flex items-center gap-1.5">
                <Camera className="h-3.5 w-3.5 text-purple-400" />
                <select
                  value={selectedCameraId}
                  onChange={(e) => handleCameraChange(e.target.value)}
                  className="rounded-md border border-white/10 bg-zinc-900 px-2 py-1 text-xs text-zinc-200 outline-none focus:border-purple-500"
                >
                  <option value={CAMERA_BACK_VALUE}>Camera sau</option>
                  <option value={CAMERA_FRONT_VALUE}>Camera trước</option>
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
          <div className="relative aspect-[1.777778] overflow-hidden rounded-xl border border-white/5 bg-zinc-900 shadow-2xl">
            <div id={regionId} className="h-full w-full object-cover [&>video]:object-cover" />

            {/* Dark glass overlay viewport helper */}
            {isScanning && (
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                {/* Visual Scanner Target Box */}
                <div className="relative h-[45%] w-[80%] rounded-lg border-2 border-purple-500/40 border-dashed bg-purple-500/[0.02]">
                  {/* Glowing Laser Scanline */}
                  <div className="absolute right-0 left-0 h-0.5 animate-scanner-laser bg-gradient-to-r from-transparent via-purple-400 to-transparent shadow-[0_0_10px_#c084fc]" />

                  {/* Corner brackets */}
                  <div className="absolute -top-1 -left-1 h-3 w-3 border-purple-400 border-t-2 border-l-2" />
                  <div className="absolute -top-1 -right-1 h-3 w-3 border-purple-400 border-t-2 border-r-2" />
                  <div className="absolute -bottom-1 -left-1 h-3 w-3 border-purple-400 border-b-2 border-l-2" />
                  <div className="absolute -right-1 -bottom-1 h-3 w-3 border-purple-400 border-r-2 border-b-2" />
                </div>

                <span className="mt-3 animate-pulse font-medium text-[10px] text-purple-400/80 uppercase tracking-wider">
                  Đặt mã vạch vào giữa khung hình để quét
                </span>
              </div>
            )}

            {/* Error/Unavailable message */}
            {hasCameraPermission === false && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/90 p-6 text-center text-zinc-400">
                <AlertCircle className="mb-2 h-10 w-10 animate-bounce text-red-500" />
                <span className="mb-1 font-semibold text-sm text-white">Không thể khởi động Camera</span>
                <span className="max-w-[280px] text-xs">
                  Hãy kiểm tra quyền cấp phép camera trên trình duyệt hoặc đổi thiết bị quét.
                </span>
                <Button
                  size="sm"
                  className="mt-3 bg-purple-600 font-medium text-white hover:bg-purple-700"
                  onClick={() => void requestCameraPermissions()}
                >
                  Cấp Quyền Lại
                </Button>
              </div>
            )}

            {hasCameraPermission === null && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950 text-zinc-400">
                <RefreshCw className="mb-2 h-8 w-8 animate-spin text-purple-500" />
                <span className="text-xs">Đang kiểm tra kết nối camera...</span>
              </div>
            )}
          </div>

          {/* Manual Input Fallback */}
          <form onSubmit={handleManualSubmit} className="mt-2 flex flex-col gap-2">
            <label
              htmlFor="manual-barcode"
              className="flex items-center gap-1 font-semibold text-[11px] text-zinc-400 uppercase tracking-wider"
            >
              <Search className="h-3 w-3" />
              Nhập mã vạch thủ công
            </label>
            <div className="flex gap-2">
              <Input
                id="manual-barcode"
                type="text"
                placeholder="Nhập mã vạch (ví dụ: 123456789)"
                value={manualBarcode}
                onChange={(e) => setManualBarcode(e.target.value)}
                className="h-9 flex-1 border-white/10 bg-zinc-900 text-sm text-white placeholder-zinc-500 focus-visible:ring-1 focus-visible:ring-purple-500"
              />
              <Button
                type="submit"
                className="h-9 shrink-0 bg-purple-600 px-4 font-semibold text-white text-xs hover:bg-purple-700"
              >
                Nhập
              </Button>
            </div>
          </form>

          {/* Connected hardware scanner tip */}
          <div className="flex items-start gap-2.5 rounded-lg border border-white/5 bg-white/[0.01] p-3 text-[11px] text-zinc-400 leading-relaxed">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
            <p>
              <b>Mẹo:</b> Hệ thống POS đã tích hợp sẵn tính năng tự động nhận diện từ súng quét mã vạch USB/Bluetooth.
              Bạn chỉ cần cắm máy quét và bóp cò ở bất cứ đâu trên màn hình, sản phẩm sẽ tự thêm vào giỏ hàng ngay lập
              tức!
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
