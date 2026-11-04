import jsQR from "jsqr";

type Detector = { detect: (v: CanvasImageSource) => Promise<{ rawValue: string }[]> };
type DetectorCtor = new (o: { formats: string[] }) => Detector;

/**
 * Liga a câmera traseira e devolve uma função que lê os QR codes visíveis no momento.
 * Usa o BarcodeDetector nativo quando existe; senão, jsQR sobre o quadro do vídeo.
 * (Depende de câmera real: validado no teste de campo e no e2e, não nos testes de unidade.)
 */
export async function abrirCamera(video: HTMLVideoElement): Promise<{ detectar: () => Promise<string[]>; fechar: () => void }> {
  const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
  video.srcObject = stream;
  video.setAttribute("playsinline", "true");
  await video.play();
  const Ctor = (window as unknown as { BarcodeDetector?: DetectorCtor }).BarcodeDetector;
  const nativo = Ctor ? new Ctor({ formats: ["qr_code"] }) : null;
  const canvas = document.createElement("canvas");
  const detectar = async (): Promise<string[]> => {
    if (nativo) return (await nativo.detect(video)).map((r) => r.rawValue);
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx || !canvas.width) return [];
    ctx.drawImage(video, 0, 0);
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const r = jsQR(img.data, img.width, img.height);
    return r ? [r.data] : [];
  };
  return { detectar, fechar: () => stream.getTracks().forEach((t) => t.stop()) };
}
