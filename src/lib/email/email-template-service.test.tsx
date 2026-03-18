import { describe, expect, it } from 'vitest';

import { EmailTemplateService } from './email-template-service';

describe('EmailTemplateService', () => {
  it('renders outreach draft HTML from React Email components', async () => {
    const html = await EmailTemplateService.renderOutreachDraft({
      previewText: 'Preview',
      recipientName: 'Jordan',
      repName: 'Jay Jones',
      companyName: 'Trainovations',
      bodyText: 'Thanks for the time today.',
    });

    expect(html).toContain('Trainovations Draft Preview');
    expect(html).toContain('Thanks for the time today.');
  });

  it('creates a Resend client wrapper', () => {
    expect(EmailTemplateService.createResendClient('re_test')).toBeDefined();
  });
});
