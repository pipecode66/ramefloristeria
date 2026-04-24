export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  targetBytes?: number;
  minQuality?: number;
  initialQuality?: number;
}

export interface CompressedImageResult {
  dataUrl: string;
  bytes: number;
  width: number;
  height: number;
  mimeType: string;
}

const DEFAULT_OPTIONS: Required<CompressionOptions> = {
  maxWidth: 1600,
  maxHeight: 1600,
  targetBytes: 260 * 1024,
  minQuality: 0.45,
  initialQuality: 0.82,
};

const WEBP_MIME_TYPE = "image/webp";

const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("No se pudo leer la imagen."));
    reader.readAsDataURL(file);
  });

const loadImageFromSource = (source: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("No se pudo procesar la imagen."));
    if (!source.startsWith("data:") && !source.startsWith("blob:")) {
      image.crossOrigin = "anonymous";
    }
    image.src = source;
  });

const fitInside = (
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number
) => {
  const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  };
};

const canvasToBlob = (
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number
): Promise<Blob> =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("No se pudo comprimir la imagen."));
          return;
        }
        resolve(blob);
      },
      mimeType,
      quality
    );
  });

const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("No se pudo convertir la imagen."));
    reader.readAsDataURL(blob);
  });

const getDataUrlMimeType = (dataUrl: string) =>
  dataUrl.match(/^data:([^;,]+)[;,]/i)?.[1]?.toLowerCase() ?? "";

const getDataUrlBytes = (dataUrl: string) => {
  const commaIndex = dataUrl.indexOf(",");
  if (commaIndex === -1) return 0;
  const payload = dataUrl.slice(commaIndex + 1);
  const isBase64 = dataUrl.slice(0, commaIndex).toLowerCase().includes(";base64");

  if (!isBase64) {
    return new TextEncoder().encode(decodeURIComponent(payload)).length;
  }

  const padding = payload.endsWith("==") ? 2 : payload.endsWith("=") ? 1 : 0;
  return Math.max(0, Math.floor((payload.length * 3) / 4) - padding);
};

export const isStoredImageConvertibleToWebP = (source: string) =>
  /^data:image\/(jpe?g|png|webp);/i.test(source.trim());

export const isStoredImageAlreadyWebP = (source: string) =>
  /^data:image\/webp;/i.test(source.trim());

const encodeCanvasAsWebP = async (
  canvas: HTMLCanvasElement,
  settings: Required<CompressionOptions>
) => {
  let quality = settings.initialQuality;
  const qualityStep = 0.07;
  let bestBlob: Blob | null = null;

  while (quality >= settings.minQuality) {
    const blob = await canvasToBlob(canvas, WEBP_MIME_TYPE, quality);

    if (!blob.type.includes("webp")) {
      throw new Error("Este navegador no pudo convertir la imagen a WebP.");
    }

    if (!bestBlob || blob.size < bestBlob.size) {
      bestBlob = blob;
    }

    if (blob.size <= settings.targetBytes) {
      return blob;
    }

    quality -= qualityStep;
  }

  if (!bestBlob) {
    throw new Error("No se pudo comprimir la imagen.");
  }

  return bestBlob;
};

const compressImageSource = async (
  source: string,
  sourceMimeType: string,
  sourceBytes: number,
  options: CompressionOptions = {}
): Promise<CompressedImageResult> => {
  const settings = { ...DEFAULT_OPTIONS, ...options };
  const image = await loadImageFromSource(source);
  const targetSize = fitInside(
    image.naturalWidth,
    image.naturalHeight,
    settings.maxWidth,
    settings.maxHeight
  );

  if (
    sourceMimeType === WEBP_MIME_TYPE &&
    sourceBytes > 0 &&
    sourceBytes <= settings.targetBytes &&
    targetSize.width === image.naturalWidth &&
    targetSize.height === image.naturalHeight
  ) {
    return {
      dataUrl: source,
      bytes: sourceBytes,
      width: image.naturalWidth,
      height: image.naturalHeight,
      mimeType: WEBP_MIME_TYPE,
    };
  }

  const canvas = document.createElement("canvas");
  canvas.width = targetSize.width;
  canvas.height = targetSize.height;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("No se pudo inicializar el compresor de imagen.");
  }

  try {
    context.drawImage(image, 0, 0, targetSize.width, targetSize.height);
  } catch {
    throw new Error("No se pudo convertir esta imagen. Si es una URL externa, sube el archivo directamente.");
  }

  const blob = await encodeCanvasAsWebP(canvas, settings);
  return {
    dataUrl: await blobToDataUrl(blob),
    bytes: blob.size,
    width: targetSize.width,
    height: targetSize.height,
    mimeType: WEBP_MIME_TYPE,
  };
};

export const compressImageFile = async (
  file: File,
  options: CompressionOptions = {}
): Promise<CompressedImageResult> => {
  if (!file.type.startsWith("image/")) {
    throw new Error("El archivo no es una imagen.");
  }

  const originalDataUrl = await readFileAsDataUrl(file);
  return compressImageSource(originalDataUrl, file.type.toLowerCase(), file.size, options);
};

export const compressStoredImageToWebP = async (
  source: string,
  options: CompressionOptions = {}
): Promise<CompressedImageResult> => {
  const trimmedSource = source.trim();
  if (!isStoredImageConvertibleToWebP(trimmedSource)) {
    throw new Error("Solo se pueden convertir imagenes cargadas como archivo.");
  }

  return compressImageSource(
    trimmedSource,
    getDataUrlMimeType(trimmedSource),
    getDataUrlBytes(trimmedSource),
    options
  );
};

