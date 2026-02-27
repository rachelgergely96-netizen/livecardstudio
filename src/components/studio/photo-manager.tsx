'use client';

import type { CardTier } from '@prisma/client';
import {
  DndContext,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
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
import { type DragEvent, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const HEIC_BRANDS = ['heic', 'heix', 'hevc', 'hevx', 'mif1', 'msf1'];

export type PhotoItem = {
  id: string;
  slotType: 'PHOTO' | 'TEXT_PANEL';
  caption: string | null;
  textContent: string | null;
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

type SortableTextPanelCardProps = {
  photo: PhotoItem;
  onTextChange: (text: string) => void;
  onTextSave: () => void;
  onCaptionChange: (caption: string) => void;
  onCaptionSave: () => void;
  onRemove: () => void;
};

function GripIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
      <circle cx="7" cy="4" r="1.5" />
      <circle cx="13" cy="4" r="1.5" />
      <circle cx="7" cy="10" r="1.5" />
      <circle cx="13" cy="10" r="1.5" />
      <circle cx="7" cy="16" r="1.5" />
      <circle cx="13" cy="16" r="1.5" />
    </svg>
  );
}

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
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : ('auto' as const),
    boxShadow: isDragging ? '0 16px 40px rgba(0,0,0,0.3)' : 'none'
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      className="rounded-xl border border-[var(--color-border-medium)] bg-[var(--color-surface-elevated)] p-2 transition-shadow"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imageSrc} alt="Uploaded memory" className="h-44 w-full rounded-lg object-cover" />

      <div className="mt-2 flex items-center justify-between gap-2">
        <button
          type="button"
          className="cursor-grab rounded-lg p-1.5 text-brand-muted transition hover:bg-[var(--color-surface-solid)] hover:text-brand-charcoal active:cursor-grabbing"
          title="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          <GripIcon />
        </button>
        <div className="flex gap-1">
          <button
            type="button"
            className="rounded-full border border-[var(--color-border-medium)] px-2.5 py-1 text-xs text-brand-muted transition hover:bg-[var(--color-surface-solid)] hover:text-brand-charcoal"
            onClick={onCrop}
          >
            Crop
          </button>
          <button
            type="button"
            className="rounded-full border border-red-800/40 px-2.5 py-1 text-xs text-red-400 transition hover:bg-red-900/20"
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

function SortableTextPanelCard({
  photo,
  onTextChange,
  onTextSave,
  onCaptionChange,
  onCaptionSave,
  onRemove
}: SortableTextPanelCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: photo.id
  });
  const [isEditing, setIsEditing] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : ('auto' as const),
    boxShadow: isDragging ? '0 16px 40px rgba(0,0,0,0.3)' : 'none'
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      className="rounded-xl border border-[var(--color-border-medium)] bg-[var(--color-surface-elevated)] p-2 transition-shadow"
    >
      {isEditing ? (
        <div className="p-2">
          <Textarea
            value={photo.textContent || ''}
            onChange={(event) => onTextChange(event.target.value)}
            onBlur={() => {
              onTextSave();
              setIsEditing(false);
            }}
            placeholder="Write something meaningful..."
            className="min-h-36 text-sm"
            autoFocus
          />
          <p className="mt-1 text-right text-xs text-brand-muted">
            {(photo.textContent || '').length}/2000
          </p>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="flex h-44 w-full items-center justify-center rounded-lg bg-[linear-gradient(135deg,rgba(212,168,83,0.12),rgba(42,27,61,0.18))] p-4 text-center"
        >
          <p className="line-clamp-6 text-sm italic text-[var(--color-text-body)]">
            {photo.textContent || 'Click to edit text...'}
          </p>
        </button>
      )}

      <div className="mt-2 flex items-center justify-between gap-2">
        <button
          type="button"
          className="cursor-grab rounded-lg p-1.5 text-brand-muted transition hover:bg-[var(--color-surface-solid)] hover:text-brand-charcoal active:cursor-grabbing"
          title="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          <GripIcon />
        </button>
        <div className="flex gap-1">
          <button
            type="button"
            className="rounded-full border border-[var(--color-border-medium)] px-2.5 py-1 text-xs text-brand-muted transition hover:bg-[var(--color-surface-solid)] hover:text-brand-charcoal"
            onClick={() => setIsEditing(true)}
          >
            Edit
          </button>
          <button
            type="button"
            className="rounded-full border border-red-800/40 px-2.5 py-1 text-xs text-red-400 transition hover:bg-red-900/20"
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
  if (photo.slotType === 'TEXT_PANEL') return '';
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
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [addMode, setAddMode] = useState<'photo' | 'text'>('photo');
  const [textDraft, setTextDraft] = useState('');

  const sortedPhotos = useMemo(
    () => photos.slice().sort((a, b) => a.sortOrder - b.sortOrder),
    [photos]
  );

  const tierCap = tier === 'QUICK' ? 1 : userPlan === 'FREE' ? 4 : 12;

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(true);
  }

  function handleDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
    void uploadPhotos(event.dataTransfer.files);
  }

  async function uploadPhotos(fileList: FileList | null) {
    if (!fileList?.length) return;

    try {
      onBusyChange(true);
      onStatus('');

      const files = Array.from(fileList);
      setUploadingFiles(files.map((f) => f.name));

      const heicChecks = await Promise.all(files.map((file) => detectLikelyHeic(file)));
      if (heicChecks.some(Boolean)) {
        onStatus('HEIC file detected. Converting for compatibility...');
      }

      if (sortedPhotos.length + files.length > tierCap) {
        if (userPlan === 'FREE' && tier !== 'QUICK') {
          onUpgradeRequired?.();
          onStatus('Free plans include up to 4 photos. Upgrade to add more.');
          return;
        }

        onStatus(`Limit exceeded. This card supports up to ${tierCap} item${tierCap > 1 ? 's' : ''}.`);
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
      setUploadingFiles([]);
      onBusyChange(false);
    }
  }

  async function addTextPanel(text: string) {
    try {
      onBusyChange(true);
      onStatus('');

      if (sortedPhotos.length >= tierCap) {
        onStatus(`Limit reached. This card supports up to ${tierCap} item${tierCap > 1 ? 's' : ''}.`);
        return;
      }

      const resolvedCardId = cardId || (await ensureCardExists());
      const response = await fetch(`/api/cards/${resolvedCardId}/text-panels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ textContent: text })
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Could not create text panel.');
      }

      const next = normalizeOrder([...sortedPhotos, payload.panel]);
      onPhotosChange(next);
      setTextDraft('');
      onStatus('Text panel added.');
    } catch (error) {
      onStatus(error instanceof Error ? error.message : 'Could not add text panel.');
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

  function handleSortDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  async function handleSortDragEnd(event: DragEndEvent) {
    setActiveId(null);
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

  function setTextLocal(photoId: string, textContent: string) {
    const next = sortedPhotos.map((photo) => (photo.id === photoId ? { ...photo, textContent } : photo));
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

  async function saveTextContent(photoId: string) {
    const photo = sortedPhotos.find((item) => item.id === photoId);
    if (!photo) return;

    try {
      const resolvedCardId = cardId || (await ensureCardExists());
      const response = await fetch(`/api/cards/${resolvedCardId}/photos/${photoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ textContent: photo.textContent || '' })
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Could not save text panel.');
      }

      const next = sortedPhotos.map((item) => (item.id === photoId ? payload.photo : item));
      onPhotosChange(normalizeOrder(next));
    } catch (error) {
      onStatus(error instanceof Error ? error.message : 'Could not save text panel.');
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

  const activeDragPhoto = activeId
    ? sortedPhotos.find((photo) => photo.id === activeId) || null
    : null;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setAddMode('photo')}
          className={`rounded-full border px-4 py-1.5 text-sm transition ${
            addMode === 'photo'
              ? 'border-brand-copper bg-brand-copper text-white'
              : 'border-[var(--color-border-medium)] text-brand-muted hover:bg-[var(--color-surface-solid)]'
          }`}
        >
          Upload Photo
        </button>
        <button
          type="button"
          onClick={() => setAddMode('text')}
          className={`rounded-full border px-4 py-1.5 text-sm transition ${
            addMode === 'text'
              ? 'border-brand-copper bg-brand-copper text-white'
              : 'border-[var(--color-border-medium)] text-brand-muted hover:bg-[var(--color-surface-solid)]'
          }`}
        >
          Text Panel
        </button>
      </div>

      {addMode === 'photo' ? (
        <label
          className={`flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all ${
            isDragOver
              ? 'border-brand-copper bg-brand-copper/10 scale-[1.01]'
              : 'border-[var(--color-border-strong)] bg-[var(--color-surface-elevated)]'
          }`}
          onDragOver={handleDragOver}
          onDragEnter={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            className="hidden"
            multiple
            accept="image/jpeg,image/png,image/heic,image/heif,image/*"
            onChange={(event) => {
              void uploadPhotos(event.target.files);
              event.target.value = '';
            }}
          />
          <svg
            className={`h-12 w-12 transition ${isDragOver ? 'text-brand-copper' : 'text-brand-muted'}`}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z"
            />
          </svg>
          <p className="mt-3 text-lg font-medium text-brand-charcoal">
            {isDragOver ? 'Drop your photos here' : 'Drop your favorite memories here'}
          </p>
          <p className="mt-1 text-sm text-brand-muted">
            JPG, PNG, HEIC. Up to {tierCap} {tierCap === 1 ? 'item' : 'items'}.
          </p>
          <span className="mt-3 rounded-full border border-brand-copper px-4 py-1.5 text-sm font-medium text-brand-copper">
            Browse files
          </span>
          {userPlan === 'FREE' && tier !== 'QUICK' ? (
            <p className="mt-2 text-xs text-brand-copper">Free tier includes up to 4 photos.</p>
          ) : null}
        </label>
      ) : (
        <div className="rounded-2xl border border-[var(--color-border-strong)] bg-[var(--color-surface-elevated)] p-6">
          <p className="ui-label">Write your text panel</p>
          <p className="mt-1 text-sm text-brand-muted">
            This text will appear in the photo area of your card with elegant styling.
          </p>
          <Textarea
            value={textDraft}
            onChange={(event) => setTextDraft(event.target.value.slice(0, 2000))}
            placeholder="Write something meaningful..."
            className="mt-3 min-h-32 text-base"
          />
          <div className="mt-2 flex items-center justify-between">
            <p className="text-xs text-brand-muted">{textDraft.length}/2000</p>
            <Button
              type="button"
              disabled={!textDraft.trim()}
              onClick={() => void addTextPanel(textDraft.trim())}
            >
              Add Text Panel
            </Button>
          </div>
        </div>
      )}

      {uploadingFiles.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {uploadingFiles.map((name, index) => (
            <div
              key={`uploading-${index}`}
              className="flex h-52 flex-col items-center justify-center rounded-xl border border-dashed border-[var(--color-border-medium)] bg-[var(--color-surface-elevated)]"
            >
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-copper border-t-transparent" />
              <span className="mt-2 max-w-[140px] truncate text-xs text-brand-muted">{name}</span>
            </div>
          ))}
        </div>
      )}

      {!sortedPhotos.length && !uploadingFiles.length ? (
        <p className="text-sm text-brand-muted">Add at least one photo or text panel to continue.</p>
      ) : sortedPhotos.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleSortDragStart}
          onDragEnd={(event) => void handleSortDragEnd(event)}
          onDragCancel={() => setActiveId(null)}
        >
          <SortableContext items={sortedPhotos.map((photo) => photo.id)} strategy={rectSortingStrategy}>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {sortedPhotos.map((photo) =>
                photo.slotType === 'TEXT_PANEL' ? (
                  <SortableTextPanelCard
                    key={photo.id}
                    photo={photo}
                    onTextChange={(text) => setTextLocal(photo.id, text)}
                    onTextSave={() => void saveTextContent(photo.id)}
                    onCaptionChange={(caption) => setCaptionLocal(photo.id, caption)}
                    onCaptionSave={() => void saveCaption(photo.id)}
                    onRemove={() => void removePhoto(photo.id)}
                  />
                ) : (
                  <SortablePhotoCard
                    key={photo.id}
                    photo={photo}
                    imageSrc={photoSrc(photo)}
                    onCaptionChange={(caption) => setCaptionLocal(photo.id, caption)}
                    onCaptionSave={() => void saveCaption(photo.id)}
                    onRemove={() => void removePhoto(photo.id)}
                    onCrop={() => openCrop(photo.id)}
                  />
                )
              )}
            </div>
          </SortableContext>
          <DragOverlay>
            {activeDragPhoto ? (
              <div className="w-64 rounded-xl border-2 border-brand-copper bg-[var(--color-surface-elevated)] p-2 shadow-2xl">
                {activeDragPhoto.slotType === 'TEXT_PANEL' ? (
                  <div className="flex h-44 items-center justify-center rounded-lg bg-[linear-gradient(135deg,rgba(212,168,83,0.12),rgba(42,27,61,0.18))] p-4">
                    <p className="line-clamp-4 text-sm italic text-[var(--color-text-body)]">
                      {activeDragPhoto.textContent || 'Text panel'}
                    </p>
                  </div>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photoSrc(activeDragPhoto)}
                    alt="Dragging"
                    className="h-44 w-full rounded-lg object-cover"
                  />
                )}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : null}

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
