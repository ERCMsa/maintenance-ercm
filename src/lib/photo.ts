/** Redimensionne et compresse une image choisie par l'utilisateur en data URL JPEG. */
export async function compresserImage(file: File, maxCote = 900, qualite = 0.72): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Le fichier doit être une image");
  if (file.size > 10 * 1024 * 1024) throw new Error("Image trop lourde (10 Mo max)");

  const bitmap = await createImageBitmap(file);
  const ratio = Math.min(1, maxCote / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * ratio);
  const h = Math.round(bitmap.height * ratio);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Impossible de traiter l'image");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  return canvas.toDataURL("image/jpeg", qualite);
}
