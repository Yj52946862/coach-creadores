// ============================================================================
// imagen.ts — Leer y redimensionar una imagen en el navegador.
//
// Compartido por las herramientas que aceptan una imagen (ImagenesCanal para la
// referencia, y el revisor visual). Reduce la imagen a máx 1024px y la devuelve
// en base64 (JPEG) para mandarla ligera a la IA. Solo se usa en el cliente.
// ============================================================================

export type Referencia = { dataUrl: string; base64: string; mediaType: string };

export function leerImagenRedimensionada(file: File): Promise<Referencia> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const max = 1024;
      let { width, height } = img;
      if (width > max || height > max) {
        const r = Math.min(max / width, max / height);
        width = Math.round(width * r);
        height = Math.round(height * r);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("No se pudo procesar la imagen."));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
      URL.revokeObjectURL(url);
      resolve({
        dataUrl,
        mediaType: "image/jpeg",
        base64: dataUrl.split(",")[1] ?? "",
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo leer la imagen."));
    };
    img.src = url;
  });
}
