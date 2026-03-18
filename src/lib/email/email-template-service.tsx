import { render } from '@react-email/render';
import { Resend } from 'resend';

import { OutreachDraftEmail } from './templates/outreach-draft-email';

export class EmailTemplateService {
  static async renderOutreachDraft(input: {
    previewText: string;
    recipientName: string;
    repName: string;
    companyName?: string;
    bodyText: string;
  }) {
    return render(<OutreachDraftEmail {...input} />);
  }

  static createResendClient(apiKey = process.env.RESEND_API_KEY) {
    return new Resend(apiKey);
  }
}
