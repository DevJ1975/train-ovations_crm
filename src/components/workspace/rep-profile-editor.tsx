'use client';

import { useRef, useState, useTransition } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  TVButton,
  TVCard,
  TVCardDescription,
  TVCardTitle,
  TVInput,
  TVTextarea,
} from '@/components/trainovations';

function initialsFromName(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

interface RepProfileEditorProps {
  profile: {
    id: string;
    firstName: string;
    lastName: string;
    displayName: string;
    title: string;
    bio: string;
    email: string;
    phone: string | null;
    website: string | null;
    location: string | null;
    photoUrl: string | null;
    slug: string;
  };
  updateAction: (formData: FormData) => Promise<void>;
}

export function RepProfileEditor({ profile, updateAction }: RepProfileEditorProps) {
  const [photoUrl, setPhotoUrl] = useState(profile.photoUrl);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, startSave] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const res = await fetch('/api/workspace/avatar', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? 'Upload failed');
        return;
      }

      setPhotoUrl(data.photoUrl);
      toast.success('Profile photo updated');
    } catch {
      toast.error('Upload failed — please try again');
    } finally {
      setIsUploading(false);
      // Reset so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function handleSave(formData: FormData) {
    startSave(async () => {
      try {
        await updateAction(formData);
        toast.success('Profile saved');
      } catch {
        toast.error('Failed to save profile');
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* ── Avatar upload ── */}
      <TVCard className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <div className="relative shrink-0">
          {photoUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              alt={profile.displayName}
              className="h-24 w-24 rounded-full border-2 border-primary/20 object-cover shadow-md"
              src={photoUrl}
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-primary/20 bg-surface-muted text-2xl font-semibold text-primary shadow-md">
              {initialsFromName(profile.displayName)}
            </div>
          )}
          <button
            aria-label="Upload profile photo"
            className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-primary text-white shadow-md transition-colors hover:bg-primary/90 disabled:opacity-60"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            type="button"
          >
            {isUploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Camera className="h-3.5 w-3.5" />
            )}
          </button>
          <input
            ref={fileInputRef}
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleFileChange}
            type="file"
          />
        </div>
        <div className="text-center sm:text-left">
          <TVCardTitle>{profile.displayName}</TVCardTitle>
          <TVCardDescription className="mt-1">{profile.title}</TVCardDescription>
          <p className="mt-2 text-xs text-muted-foreground">
            Click the camera icon to upload a new photo. JPEG, PNG, WebP, or GIF · max 5 MB.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Public page: <span className="font-mono">/rep/{profile.slug}</span>
          </p>
        </div>
      </TVCard>

      {/* ── Profile form ── */}
      <TVCard>
        <form action={handleSave} className="space-y-5">
          <div>
            <TVCardTitle>Profile details</TVCardTitle>
            <TVCardDescription className="mt-1">
              All fields appear on your public landing page.
            </TVCardDescription>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-label text-foreground" htmlFor="firstName">
                First name
              </label>
              <TVInput
                defaultValue={profile.firstName}
                id="firstName"
                name="firstName"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-label text-foreground" htmlFor="lastName">
                Last name
              </label>
              <TVInput
                defaultValue={profile.lastName}
                id="lastName"
                name="lastName"
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-label text-foreground" htmlFor="displayName">
                Display name
              </label>
              <TVInput
                defaultValue={profile.displayName}
                id="displayName"
                name="displayName"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-label text-foreground" htmlFor="title">
                Title
              </label>
              <TVInput
                defaultValue={profile.title}
                id="title"
                name="title"
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-label text-foreground" htmlFor="email">
                Email
              </label>
              <TVInput
                defaultValue={profile.email}
                id="email"
                name="email"
                required
                type="email"
              />
            </div>
            <div className="space-y-2">
              <label className="text-label text-foreground" htmlFor="phone">
                Phone
              </label>
              <TVInput
                defaultValue={profile.phone ?? ''}
                id="phone"
                name="phone"
                type="tel"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-label text-foreground" htmlFor="website">
                Website
              </label>
              <TVInput
                defaultValue={profile.website ?? ''}
                id="website"
                name="website"
                placeholder="https://..."
                type="url"
              />
            </div>
            <div className="space-y-2">
              <label className="text-label text-foreground" htmlFor="location">
                Location
              </label>
              <TVInput
                defaultValue={profile.location ?? ''}
                id="location"
                name="location"
                placeholder="City, State"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-label text-foreground" htmlFor="bio">
              Bio
            </label>
            <TVTextarea
              defaultValue={profile.bio}
              id="bio"
              name="bio"
              required
              rows={5}
            />
            <p className="text-xs text-muted-foreground">
              Minimum 20 characters. This appears directly on your landing page.
            </p>
          </div>

          <div className="flex justify-end">
            <TVButton disabled={isSaving} type="submit">
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                'Save Changes'
              )}
            </TVButton>
          </div>
        </form>
      </TVCard>
    </div>
  );
}
