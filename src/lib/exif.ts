import exifr from 'exifr';

export interface CameraSettings {
  camera: string | null;
  lens: string | null;
  focalLength: number | null;
  aperture: number | null;
  exposureTime: number | null;
  iso: number | null;
}

function text(value: unknown): string | null {
  const trimmed = typeof value === 'string' ? value.replace(/\0/g, '').trim() : '';
  return trimmed || null;
}

function positive(value: unknown): number | null {
  const n = Array.isArray(value) ? value[0] : value;
  return typeof n === 'number' && Number.isFinite(n) && n > 0 ? n : null;
}

function cameraName(make: string | null, model: string | null): string | null {
  if (!make) return model;
  if (!model) return make;
  const brand = make.split(/\s+/)[0].toLowerCase();
  return model.toLowerCase().startsWith(brand) ? model : `${make} ${model}`;
}

export async function readCameraSettings(original: Buffer): Promise<CameraSettings> {
  const meta = await exifr
    .parse(original, ['Make', 'Model', 'LensModel', 'FocalLength', 'FNumber', 'ExposureTime', 'ISO'])
    .catch(() => undefined);

  return {
    camera: cameraName(text(meta?.Make), text(meta?.Model)),
    lens: text(meta?.LensModel),
    focalLength: positive(meta?.FocalLength),
    aperture: positive(meta?.FNumber),
    exposureTime: positive(meta?.ExposureTime),
    iso: positive(meta?.ISO),
  };
}
