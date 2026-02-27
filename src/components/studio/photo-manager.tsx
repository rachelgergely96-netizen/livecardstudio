'use client';

import type { CardTier } from '@prisma/client';
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Cropper, { type Area } from 'react-easy-crop';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const HEIC_BRANDS = ['heic', 'heix', 'hevc', 'hevx', 'mif1', 'msf1'];

export type PhotoItem = {
  id: string;
  caption: string | null;
  sortOrder: number;
  base64Data: string | null;
  processedUrl: string | null;
  originalUrl: string;
};

type PhotoManagerProps = {
  photos: PhotoItem[];
  onPhotosChange: (photos: PhotoItem[]) => void;
  cardId?: string;
  ensureCardExists: () => Promise<string>;
  userPlan: 'FREE' | 'PREMIUM' | 'PRO';
  tier: CardTier;
  onUpgradeRequired?: () => void;
  onStatus: (message: string) => void;
  onBusyChange: (busy: boolean) => void;
};

type SortablePhotoCardProps = {
  photo: PhotoItem;
  imageSrc: string;
  onCaptionChange: (caption: string) => void;
  onCaptionSave: () => void;
  onRemove: () => void;
  onCrop: () => void;
};

function SortablePhotoCard({
  photo,
  imageSrc,
  onCaptionChange,
  onCaptionSave,
  onRemove,
  onCrop
}: SortablePhotoCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: photo.id
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      className="rounded-xl border border-[var(--color-border-medium)] bg-[var(--color-surface-elevated)] p-2"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imageSrc} alt="Uploaded memory" className="h-28 w-full rounded-lg object-cover" />

      <div className="mt-2 flex items-center justify-between gap-2">
        <button
          type="button"
          className="cursor-grab rounded-full border border-[var(--color-border-strong)] px-2 py-1 text-xs text-brand-muted active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          Drag
        </button>
        <div className="flex gap-1">
          <button
            type="button"
            className="rounded-full border px-2 py-1 text-xs"
            onClick={onCrop}
          >
            Crop
          </button>
          <button
            type="button"
            className="rounded-full border border-red-300 px-2 py-1 text-xs text-red-600"
            onClick={onRemove}
          >
            Remove
          </button>
        </div>
      </div>

      <div className="mt-2">
        <Input
          value={photo.caption || ''}
          onChange={(event) => onCaptionChange(event.target.value)}
          onBlur={onCaptionSave}
          placeholder="Add a caption"
          className="text-xs"
        />
      </div>
    </article>
  );
}

function photoSrc(photo: PhotoItem) {
  return photo.base64Data || photo.processedUrl || photo.originalUrl;
}

function normalizeOrder(photos: PhotoItem[]) {
  return photos.map((photo, index) => ({ ...photo, sortOrder: index }));
}

function extOf(file: File) {
  const name = file.name || '';
  const parts = name.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

async function detectLikelyHeic(file: File) {
  const ext = extOf(file);
  if (ext === 'heic' || ext === 'heif') return true;

  const mimeType = (file.type || '').toLowerCase();
  if (mimeType.includes('heic') || mimeType.includes('heif')) return true;

  try {
    const header = await file.slice(0, 16).arrayBuffer();
    const bytes = new Uint8Array(header);
    if (bytes.length >= 12) {
      const brand = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]).toLowerCase();
      return HEIC_BRANDS.includes(brand);
    }
  } catch {
    return false;
  }

  return false;
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Could not read image for cropping.'));
    image.src = src;
  });
}

async function cropImageToBlob(imageSrc: string, cropPixels: Area) {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(cropPixels.width));
  canvas.height = Math.max(1, Math.round(cropPixels.height));
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Could not open crop canvas.');
  }

  context.drawImage(
    image,
    cropPixels.x,
    cropPixels.y,
    cropPixels.width,
    cropPixels.height,
    0,
    0,
    canvas.width,
    canvas.height
  );

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Could not export cropped image.'));
          return;
        }
        resolve(blob);
      },
      'image/jpeg',
      0.92
    );
  });
}

export function PhotoManager({
  photos,
  onPhotosChange,
  cardId,
  ensureCardExists,
  userPlan,
  tier,
  onUpgradeRequired,
  onStatus,
  onBusyChange
}: PhotoManagerProps) {
  const [activeCropPhotoId, setActiveCropPhotoId] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const sortedPhotos = useMemo(
    () => photos.slice().sort((a, b) => a.sortOrder - b.sortOrder),
    [photos]
  );

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  async function uploadPhotos(fileList: FileList | null) {
    if (!fileList?.length) return;

    try {
      onBusyChange(true);
      onStatus('');

      const files = Array.from(fileList);
      const heicChecks = await Promise.all(files.map((file) => detectLikelyHeic(file)));
      if (heicChecks.some(Boolean)) {
        onStatus('HEIC file detected. Converting for compatibility...');
      }

      const tierCap = tier === 'QUICK' ? 1 : userPlan === 'FREE' ? 4 : 12;
      if (sortedPhotos.length + files.length > tierCap) {
        if (userPlan === 'FREE' && tier !== 'QUICK') {
          onUpgradeRequired?.();
          onStatus('Free plans include up to 4 photos. Upgrade to add more.');
          return;
        }

        onStatus(`Photo limit exceeded. This card supports up to ${tierCap} photos.`);
        return;
      }

      const resolvedCardId = cardId || (await ensureCardExists());
      const formData = new FormData();
      files.forEach((file) => formData.append('photos', file));

      const response = await fetch(`/api/cards/${resolvedCardId}/photos`, {
        method: 'POST',
        body: formData
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Could not upload photos.');
      }

      const next = normalizeOrder([...sortedPhotos, ...(payload.photos || [])]);
      onPhotosChange(next);
      onStatus(`${payload.photos.length} photo(s) uploaded.`);
    } catch (error) {
      onStatus(error instanceof Error ? error.message : 'Upload failed.');
    } finally {
      onBusyChange(false);
    }
  }

  async function reorderPhotos(nextOrder: PhotoItem[]) {
    const normalized = normalizeOrder(nextOrder);
    const previous = sortedPhotos;
    onPhotosChange(normalized);

    try {
      const resolvedCardId = cardId || (await ensureCardExists());
      const response = await fetch(`/api/cards/${resolvedCardId}/photos/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoIds: normalized.map((photo) => photo.id) })
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error || 'Could not reorder photos.');
      }
    } catch (error) {
      onPhotosChange(previous);
      onStatus(error instanceof Error ? error.message : 'Could not reorder photos.');
    }
  }

  async function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sortedPhotos.findIndex((photo) => photo.id === String(active.id));
    const newIndex = sortedPhotos.findIndex((photo) => photo.id === String(over.id));

    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(sortedPhotos, oldIndex, newIndex);
    await reorderPhotos(next);
  }

  function setCaptionLocal(photoId: string, caption: string) {
    const next = sortedPhotos.map((photo) => (photo.id === photoId ? { ...photo, caption } : photo));
    onPhotosChange(next);
  }

  async function saveCaption(photoId: string) {
    const photo = sortedPhotos.find((item) => item.id === photoId);
    if (!photo) return;

    try {
      const resolvedCardId = cardId || (await ensureCardExists());
      const response = await fetch(`/api/cards/${resolvedCardId}/photos/${photoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caption: photo.caption || '' })
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Could not save caption.');
      }

      const next = sortedPhotos.map((item) => (item.id === photoId ? payload.photo : item));
      onPhotosChange(normalizeOrder(next));
    } catch (error) {
      onStatus(error instanceof Error ? error.message : 'Could not save caption.');
    }
  }

  async function removePhoto(photoId: string) {
    try {
      const resolvedCardId = cardId || (await ensureCardExists());
      const response = await fetch(`/api/cards/${resolvedCardId}/photos/${photoId}`, {
        method: 'DELETE'
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Could not remove photo.');
      }

      const next = normalizeOrder(sortedPhotos.filter((photo) => photo.id !== photoId));
      onPhotosChange(next);
    } catch (error) {
      onStatus(error instanceof Error ? error.message : 'Could not remove photo.');
    }
  }

  function openCrop(photoId: string) {
    setActiveCropPhotoId(photoId);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  }

  function closeCrop() {
    setActiveCropPhotoId(null);
    setCroppedAreaPixels(null);
  }

  async function saveCrop() {
    const photo = sortedPhotos.find((item) => item.id === activeCropPhotoId);
    if (!photo || !croppedAreaPixels) {
      closeCrop();
      return;
    }

    try {
      onBusyChange(true);
      onStatus('');

      const source = photoSrc(photo);
      const blob = await cropImageToBlob(source, croppedAreaPixels);
      const file = new File([blob], `${photo.id}-crop.jpg`, { type: 'image/jpeg' });
      const resolvedCardId = cardId || (await ensureCardExists());

      const formData = new FormData();
      formData.append('photo', file);
      formData.append('caption', photo.caption || '');

      const response = await fetch(`/api/cards/${resolvedCardId}/photos/${photo.id}`, {
        method: 'PUT',
        body: formData
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Could not apply crop.');
      }

      const next = sortedPhotos.map((item) => (item.id === photo.id ? payload.photo : item));
      onPhotosChange(normalizeOrder(next));
      onStatus('Photo crop saved.');
      closeCrop();
    } catch (error) {
      onStatus(error instanceof Error ? error.message : 'Could not crop photo.');
    } finally {
      onBusyChange(false);
    }
  }

  const activeCropPhoto = activeCropPhotoId
    ? sortedPhotos.find((photo) => photo.id === activeCropPhotoId) || null
    : null;

  return (
    <div className="space-y-4">
      <label className="ui-label">Upload photos</label>
      <label className="flex min-h-40 cursor-pointer items-center justify-center rounded-2xl border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-elevated)] p-6 text-center">
        <input
          type="file"
          className="hidden"
          multiple
          accept="image/jpeg,image/png,image/heic,image/heif,image/*"
          onChange={(event) => uploadPhotos(event.target.files)}
        />
        <div>
          <p className="text-lg text-brand-charcoal">Drop your favorite memories here</p>
          <p className="mt-1 text-sm text-brand-muted">JPG, PNG, HEIC. Up to 12 photos.</p>
          <p className="mt-1 text-xs text-brand-muted">Drag cards to reorder. Edit captions inline. Crop any photo.</p>
          {userPlan === 'FREE' ? (
            <p className="mt-2 text-xs text-brand-copper">Free tier includes up to 4 photos.</p>
          ) : null}
        </div>
      </label>

      {!sortedPhotos.length ? (
        <p className="text-sm text-brand-muted">Add at least one photo to continue.</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={sortedPhotos.map((photo) => photo.id)} strategy={rectSortingStrategy}>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {sortedPhotos.map((photo) => (
                <SortablePhotoCard
                  key={photo.id}
                  photo={photo}
                  imageSrc={photoSrc(photo)}
                  onCaptionChange={(caption) => setCaptionLocal(photo.id, caption)}
                  onCaptionSave={() => void saveCaption(photo.id)}
                  onRemove={() => void removePhoto(photo.id)}
                  onCrop={() => openCrop(photo.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {activeCropPhoto ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-3xl rounded-2xl border border-[var(--color-border-medium)] bg-[var(--color-surface-solid)] p-4">
            <p className="ui-label">Crop Photo</p>
            <div className="relative mt-3 h-[55vh] rounded-xl bg-[#2a2a2a]">
              <Cropper
                image={photoSrc(activeCropPhoto)}
                crop={crop}
                zoom={zoom}
                aspect={4 / 5}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, croppedPixels) => setCroppedAreaPixels(croppedPixels)}
              />
            </div>
            <div className="mt-3">
              <label className="ui-label">Zoom</label>
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(event) => setZoom(Number(event.target.value))}
                className="w-full"
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button tone="secondary" type="button" onClick={closeCrop}>
                Cancel
              </Button>
              <Button type="button" onClick={() => void saveCrop()}>
                Apply Crop
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
