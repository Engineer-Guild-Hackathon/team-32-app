export async function compressImage(
  file: File | Blob,
  maxWidth: number = 1024,
  maxHeight: number = 1024,
  quality: number = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // アスペクト比を保ちながらリサイズ
      if (width > maxWidth || height > maxHeight) {
        const aspectRatio = width / height;

        if (width > height) {
          width = maxWidth;
          height = width / aspectRatio;
        } else {
          height = maxHeight;
          width = height * aspectRatio;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // 画像を描画
      ctx.drawImage(img, 0, 0, width, height);

      // 圧縮してDataURLとして出力
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = reject;

    // FileまたはBlobからURLを作成
    if (file instanceof File || file instanceof Blob) {
      img.src = URL.createObjectURL(file);
    } else {
      reject(new Error('Invalid input: must be File or Blob'));
    }
  });
}

export async function compressDataUrl(
  dataUrl: string,
  maxWidth: number = 1024,
  maxHeight: number = 1024,
  quality: number = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // アスペクト比を保ちながらリサイズ
      if (width > maxWidth || height > maxHeight) {
        const aspectRatio = width / height;

        if (width > height) {
          width = maxWidth;
          height = width / aspectRatio;
        } else {
          height = maxHeight;
          width = height * aspectRatio;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // 画像を描画
      ctx.drawImage(img, 0, 0, width, height);

      // 圧縮してDataURLとして出力
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedDataUrl);
    };

    img.onerror = reject;
    img.src = dataUrl;
  });
}

export function getDataUrlSize(dataUrl: string): number {
  // Base64エンコードされたデータの実際のバイトサイズを計算
  const base64 = dataUrl.split(',')[1];
  if (!base64) return 0;

  // Base64の文字数から実際のバイト数を計算
  // Base64は3バイトを4文字で表現するので、(文字数 * 3) / 4
  // パディング文字（=）を考慮
  const padding = (base64.match(/=/g) || []).length;
  return Math.floor((base64.length * 3) / 4) - padding;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}