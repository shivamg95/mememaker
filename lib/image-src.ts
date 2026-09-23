export function isLocalSrc(src: string) {
  return (
    src.startsWith("data:") ||
    src.startsWith("blob:") ||
    src.startsWith("/") ||
    src.startsWith("http://localhost") ||
    src.startsWith("https://localhost")
  );
}

export function resolveSrc(src: string | null | undefined) {
  if (!src) return "";
  if (isLocalSrc(src)) return src;
  return `/api/proxy-image?url=${encodeURIComponent(src)}&v=2`;
}

export function loadHtmlImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    if (!src.startsWith("data:") && !src.startsWith("blob:")) {
      img.crossOrigin = "anonymous";
    }
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load image"));
    img.src = src;
  });
}

export function readImageFile(file: File) {
  return new Promise<{
    src: string;
    width: number;
    height: number;
    name: string;
  }>((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Please choose an image file"));
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      reject(new Error("Image must be under 15MB"));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.onload = () => {
      const src = String(reader.result);
      const img = new Image();
      img.onload = () =>
        resolve({
          src,
          width: img.naturalWidth,
          height: img.naturalHeight,
          name: file.name.replace(/\.[^.]+$/, ""),
        });
      img.onerror = () => reject(new Error("Could not read image"));
      img.src = src;
    };
    reader.readAsDataURL(file);
  });
}
