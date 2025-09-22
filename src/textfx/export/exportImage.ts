import { ImageFormat } from '@shopify/react-native-skia';
import RNFS from 'react-native-fs';

export async function exportCanvasToPng(
  pipelineRef: React.RefObject<{ snapshot: () => any } | null>,
  outPath: string,
): Promise<string> {
  const image = pipelineRef.current?.snapshot();
  if (!image) throw new Error('Snapshot failed');

  const base64 = image.encodeToBase64(ImageFormat.PNG, 100);
  const fullPath = outPath.endsWith('.png') ? outPath : `${outPath}.png`;

  await RNFS.writeFile(fullPath, base64, 'base64');
  return fullPath;
}

export async function exportCanvasToJpeg(
  pipelineRef: React.RefObject<{ snapshot: () => any } | null>,
  outPath: string,
  quality: number = 90,
): Promise<string> {
  const image = pipelineRef.current?.snapshot();
  if (!image) throw new Error('Snapshot failed');

  const base64 = image.encodeToBase64(ImageFormat.JPEG, quality);
  const fullPath = outPath.endsWith('.jpg') ? outPath : `${outPath}.jpg`;

  await RNFS.writeFile(fullPath, base64, 'base64');
  return fullPath;
}
