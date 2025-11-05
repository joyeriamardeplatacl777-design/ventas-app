import type React from 'react';
import html2canvas from 'html2canvas';

type CaptureOptions = Partial<Parameters<typeof html2canvas>[1]>;

export async function captureElementAsImage(
  ref: React.RefObject<HTMLElement>,
  filename: string,
  options: CaptureOptions = {}
): Promise<void> {
  if (!ref.current) {
    alert('No se encontró el elemento para capturar.');
    return;
  }

  try {
    const canvas = await html2canvas(ref.current, {
      backgroundColor: '#ffffff',
      scale: window.devicePixelRatio > 1 ? 2 : 1.5,
      ...options,
    } as any);

    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename.endsWith('.png') ? filename : `${filename}.png`;
    link.click();
  } catch (error) {
    console.error('Error al capturar imagen:', error);
    alert('No fue posible generar la imagen.');
  }
}

