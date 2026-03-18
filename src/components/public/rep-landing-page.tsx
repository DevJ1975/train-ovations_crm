import Link from 'next/link';
import {
  ArrowRight,
  Building2,
  Globe,
  Mail,
  MapPin,
  Phone,
  QrCode,
} from 'lucide-react';

import { LeadCaptureDialog } from '@/components/public/lead-capture-dialog';
import {
  TVBadge,
  TVButton,
  TVCard,
  TVCardDescription,
  TVCardTitle,
  TVSectionHeader,
} from '@/components/trainovations';
import type { PublicRepLandingPageData } from '@/lib/public/rep-landing';

function initialsFromName(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function PublicRepLandingPage({
  data,
}: {
  data: PublicRepLandingPageData;
}) {
  return (
    <main className="tv-shell">
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-10">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="tv-stagger space-y-6">
            <TVCard className="overflow-hidden p-0">
              <div className="border-b bg-surface px-6 py-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-label uppercase tracking-[0.22em] text-primary">
                      Trainovations
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Enterprise safety technology platform
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <TVButton asChild size="sm" variant="ghost">
                      <Link href="/login?callbackUrl=%2Fadmin">Admin login</Link>
                    </TVButton>
                    <TVBadge variant="primary">Digital Business Card</TVBadge>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 px-6 py-8 sm:grid-cols-[152px_1fr] sm:px-8 sm:py-10">
                <div className="flex justify-center sm:justify-start">
                  {data.rep.photoUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      alt={data.rep.name}
                      className="h-32 w-32 rounded-full border-4 border-white object-cover shadow-lg ring-2 ring-primary/15 sm:h-36 sm:w-36"
                      src={data.rep.photoUrl}
                    />
                  ) : (
                    <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-white bg-surface-muted text-4xl font-semibold text-primary shadow-lg ring-2 ring-primary/15 sm:h-36 sm:w-36">
                      {initialsFromName(data.rep.name)}
                    </div>
                  )}
                </div>

                <div className="space-y-5">
                  <div className="space-y-3">
                    <TVBadge>{data.signature?.companyName ?? 'Trainovations'}</TVBadge>
                    <div>
                      <h1 className="text-hero text-foreground">{data.rep.name}</h1>
                      <p className="mt-2 text-xl text-muted-foreground">
                        {data.rep.title}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      {data.rep.location ? (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-primary" />
                          <span>{data.rep.location}</span>
                        </div>
                      ) : null}
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-primary" />
                        <span>{data.signature?.companyName ?? 'Trainovations'}</span>
                      </div>
                    </div>
                  </div>

                  <p className="max-w-2xl text-body text-muted-foreground">
                    {data.rep.bio}
                  </p>

                  <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    {data.callHref ? (
                      <TVButton asChild size="lg">
                        <a href={data.callHref}>
                          <Phone className="mr-2 h-4 w-4" />
                          Call
                        </a>
                      </TVButton>
                    ) : null}
                    <TVButton asChild size="lg" variant="secondary">
                      <a href={data.emailHref}>
                        <Mail className="mr-2 h-4 w-4" />
                        Email
                      </a>
                    </TVButton>
                    {data.websiteHref ? (
                      <TVButton asChild size="lg" variant="secondary">
                        <a href={data.websiteHref} rel="noreferrer" target="_blank">
                          <Globe className="mr-2 h-4 w-4" />
                          Website
                        </a>
                      </TVButton>
                    ) : null}
                    <TVButton asChild size="lg" variant="accent">
                      <a href={data.saveContactHref}>
                        <QrCode className="mr-2 h-4 w-4" />
                        Save Contact
                      </a>
                    </TVButton>
                  </div>
                </div>
              </div>
            </TVCard>

            <TVCard className="space-y-6">
              <TVSectionHeader
                eyebrow="Overview"
                title={data.headline}
                description={
                  data.subheadline ??
                  `${data.rep.firstName} works with teams that need a trusted, modern path for safety training and operational readiness.`
                }
              />
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border bg-surface-muted p-5">
                  <p className="text-label text-foreground">What Trainovations provides</p>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">
                    Enterprise-ready training delivery, communication, and
                    accountability workflows for safety-focused organizations.
                  </p>
                </div>
                <div className="rounded-xl border bg-surface-muted p-5">
                  <p className="text-label text-foreground">Best first step</p>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">
                    Start with a quick introduction and contact exchange, then
                    request a deeper product conversation if it fits your team.
                  </p>
                </div>
              </div>
            </TVCard>
          </div>

          <div className="tv-stagger space-y-6">
            <TVCard className="space-y-4">
              <TVCardTitle>Connect with {data.rep.firstName}</TVCardTitle>
              <TVCardDescription>
                Choose the channel that fits your workflow. This page is designed
                for quick QR and NFC follow-up in the field.
              </TVCardDescription>
              <div className="tv-stagger-fast space-y-3">
                {data.socialLinks.map((link) => (
                  <Link
                    key={link.id}
                    className="flex items-center justify-between rounded-xl border bg-surface-muted px-4 py-4 text-sm text-foreground transition-colors hover:border-primary hover:bg-surface"
                    href={link.href}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <span>{link.displayLabel}</span>
                    <ArrowRight className="h-4 w-4 text-primary" />
                  </Link>
                ))}
              </div>
            </TVCard>

            <TVCard className="space-y-4">
              <TVCardTitle>Next step</TVCardTitle>
              <TVCardDescription>
                Share a few details to start a Trainovations follow-up without
                interrupting the contact-card experience.
              </TVCardDescription>
              <LeadCaptureDialog
                endpoint={data.leadCaptureHref}
                landingPageId={data.landingPageId}
                repSlug={data.rep.slug}
                repFirstName={data.rep.firstName}
                triggerLabel={data.leadCtaLabel}
              />
            </TVCard>

            <TVCard className="space-y-4">
              <TVCardTitle>Contact details</TVCardTitle>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p>{data.rep.email}</p>
                {data.signature?.primaryPhone ? <p>{data.signature.primaryPhone}</p> : null}
                {data.signature?.address ? <p>{data.signature.address}</p> : null}
              </div>
            </TVCard>
          </div>
        </div>

        <footer className="mt-10 rounded-2xl border bg-surface px-6 py-5 text-sm text-muted-foreground shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p>
              {data.signature?.companyName ?? 'Trainovations'} · Trusted digital rep
              experience for enterprise outreach.
            </p>
            <p>{data.landingPageTitle}</p>
          </div>
        </footer>
      </section>
    </main>
  );
}
