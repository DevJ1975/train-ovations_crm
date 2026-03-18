import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { PublicRepLandingPage } from '@/components/public/rep-landing-page';
import { getPublicRepLandingPageData } from '@/lib/public/rep-landing';

interface RepLandingPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({
  params,
}: RepLandingPageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPublicRepLandingPageData(slug);

  if (!data) {
    return {
      title: 'Rep Not Found | Trainovations',
    };
  }

  return {
    title: data.metaTitle ?? data.landingPageTitle,
    description:
      data.metaDescription ??
      `Connect with ${data.rep.name} at Trainovations.`,
  };
}

export default async function RepLandingPage({ params }: RepLandingPageProps) {
  const { slug } = await params;
  const data = await getPublicRepLandingPageData(slug);

  if (!data) {
    notFound();
  }

  return <PublicRepLandingPage data={data} />;
}
