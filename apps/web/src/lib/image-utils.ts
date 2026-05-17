/**
 * Converts any image file to WebP format on the client side using HTML5 Canvas
 * @param file The original image File object
 * @param quality Quality compression ratio from 0.1 to 1.0 (default 0.8)
 * @returns A Promise resolving to a new File object in WebP format
 */
export const convertToWebP = (file: File, quality = 0.8): Promise<File> => {
  return new Promise((resolve, reject) => {
    // If it's already a WebP, skip conversion
    if (file.type === "image/webp") {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Create an offscreen HTML5 Canvas
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Không thể khởi tạo Canvas 2D context"));
          return;
        }

        // Draw original image into Canvas
        ctx.drawImage(img, 0, 0);

        // Compress and encode into WebP Blob via hardware acceleration
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Lỗi chuyển đổi ảnh sang WebP Blob"));
              return;
            }
            
            // Build new File object in WebP format
            const originalName = file.name.substring(0, file.name.lastIndexOf(".")) || file.name;
            const webpFile = new File([blob], `${originalName}.webp`, {
              type: "image/webp",
              lastModified: Date.now()
            });
            
            resolve(webpFile);
          },
          "image/webp",
          quality
        );
      };
      img.onerror = () => reject(new Error("Lỗi khi tải ảnh vào thẻ Image HTML"));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Lỗi khi đọc tệp tin hình ảnh"));
    reader.readAsDataURL(file);
  });
};
