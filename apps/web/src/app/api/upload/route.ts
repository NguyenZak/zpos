import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'Không tìm thấy tệp tin ảnh!' },
        { status: 400 }
      );
    }

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dii0v6bou';
    const apiKey = process.env.CLOUDINARY_API_KEY || '396781122947378';
    const apiSecret = process.env.CLOUDINARY_API_SECRET || '8LAwgyHbiU_GuytKpG8WR8LvoWM';

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique timestamp for secure Cloudinary signature
    const timestamp = Math.round(new Date().getTime() / 1000);
    
    // Sort parameters alphabetically to sign
    const signatureStr = `timestamp=${timestamp}${apiSecret}`;
    const signature = crypto
      .createHash('sha1')
      .update(signatureStr)
      .digest('hex');

    // Create standard FormData for Cloudinary Upload Endpoint
    const uploadForm = new FormData();
    const fileBlob = new Blob([buffer], { type: file.type });
    uploadForm.append('file', fileBlob, file.name);
    uploadForm.append('api_key', apiKey);
    uploadForm.append('timestamp', String(timestamp));
    uploadForm.append('signature', signature);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: uploadForm,
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error('Cloudinary API internal error:', result);
      return NextResponse.json(
        { error: result.error?.message || 'Lỗi từ dịch vụ Cloudinary!' },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      url: result.secure_url || result.url,
      public_id: result.public_id,
    });
  } catch (error: any) {
    console.error('Failed to upload image to Cloudinary:', error);
    return NextResponse.json(
      { error: error.message || 'Lỗi hệ thống khi xử lý tải ảnh!' },
      { status: 500 }
    );
  }
}
