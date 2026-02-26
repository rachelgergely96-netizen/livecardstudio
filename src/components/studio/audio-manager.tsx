'use client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export type AudioTrack = {
  url: string;
  name: string;
  mimeType?: string;
  bytes?: number;
};

type AudioManagerProps = {
  cardId?: string;
  audioTrack: AudioTrack | null;
  ensureCardExists: () => Promise<string>;
  onAudioChange: (audio: AudioTrack | null) => void;
  onStatus: (status: string) => void;
  onBusyChange: (busy: boolean) => void;
};

function toSizeLabel(bytes?: number) {
  if (!bytes || bytes <= 0) {
    return '';
  }

  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

export function AudioManager({
  cardId,
  audioTrack,
  ensureCardExists,
  onAudioChange,
  onStatus,
  onBusyChange
}: AudioManagerProps) {
  async function upload(file: File) {
    try {
      onBusyChange(true);
      onStatus('');

      const resolvedCardId = cardId || (await ensureCardExists());
      const formData = new FormData();
      formData.append('audio', file);

      const response = await fetch(`/api/cards/${resolvedCardId}/audio`, {
        method: 'POST',
        body: formData
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Could not upload audio.');
      }

      onAudioChange(payload.audio || null);
      onStatus('Audio uploaded.');
    } catch (error) {
      onStatus(error instanceof Error ? error.message : 'Could not upload audio.');
    } finally {
      onBusyChange(false);
    }
  }

  async function remove() {
    try {
      onBusyChange(true);
      onStatus('');

      if (!cardId) {
        onAudioChange(null);
        onStatus('Audio removed.');
        return;
      }

      const response = await fetch(`/api/cards/${cardId}/audio`, {
        method: 'DELETE'
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || 'Could not remove audio.');
      }

      onAudioChange(null);
      onStatus('Audio removed.');
    } catch (error) {
      onStatus(error instanceof Error ? error.message : 'Could not remove audio.');
    } finally {
      onBusyChange(false);
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-[rgba(200,160,120,0.28)] bg-white/70 p-4">
      <div className="space-y-2">
        <label className="ui-label">Upload audio file (optional)</label>
        <Input
          type="file"
          accept="audio/*"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              void upload(file);
            }
          }}
        />
        <p className="text-xs text-brand-muted">MP3, WAV, OGG, M4A, AAC, WebM audio. Up to 15 MB.</p>
      </div>

      {audioTrack ? (
        <div className="space-y-2 rounded-xl border border-[rgba(200,160,120,0.24)] bg-[#fffaf3] p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-brand-charcoal">{audioTrack.name}</p>
              {audioTrack.bytes ? <p className="text-xs text-brand-muted">{toSizeLabel(audioTrack.bytes)}</p> : null}
            </div>
            <Button tone="secondary" type="button" onClick={remove} className="px-3 py-1.5 text-xs">
              Remove
            </Button>
          </div>
          <audio src={audioTrack.url} controls className="w-full" />
          <p className="text-xs text-brand-muted">This uploaded track overrides synthesized soundtrack styles.</p>
        </div>
      ) : null}
    </div>
  );
}
