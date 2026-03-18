import { render } from '@react-email/render';

import { EmailTemplateService } from './email-template-service';

function RepInviteEmail({
  adminName,
  repName,
  temporaryPassword,
  appUrl,
}: {
  adminName: string;
  repName: string;
  temporaryPassword: string;
  appUrl: string;
}) {
  return (
    <html>
      <body style={{ fontFamily: 'Arial, sans-serif', color: '#111827', lineHeight: 1.5 }}>
        <h1 style={{ fontSize: '20px' }}>You&apos;re invited to Trainovations CRM</h1>
        <p>{adminName} created your rep account.</p>
        <p>
          Sign in at <a href={appUrl}>{appUrl}</a> with your email address and this temporary
          password:
        </p>
        <p
          style={{
            fontSize: '18px',
            fontWeight: 700,
            background: '#f3f4f6',
            padding: '12px 16px',
            borderRadius: '8px',
            display: 'inline-block',
          }}
        >
          {temporaryPassword}
        </p>
        <p>
          You&apos;ll be asked to change your password immediately after your first sign-in.
        </p>
        <p>Welcome aboard, {repName}.</p>
      </body>
    </html>
  );
}

export async function sendRepInviteEmail(input: {
  to: string;
  adminName: string;
  repName: string;
  temporaryPassword: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.AUTH_URL ??
    process.env.NEXTAUTH_URL ??
    'http://localhost:3004/login';

  if (!apiKey || !fromEmail) {
    return {
      delivered: false,
      reason: 'missing_email_configuration' as const,
    };
  }

  const resend = EmailTemplateService.createResendClient(apiKey);

  await resend.emails.send({
    from: fromEmail,
    to: input.to,
    subject: 'Your Trainovations CRM invite',
    html: await render(
      <RepInviteEmail
        adminName={input.adminName}
        appUrl={appUrl}
        repName={input.repName}
        temporaryPassword={input.temporaryPassword}
      />,
    ),
  });

  return {
    delivered: true,
  };
}
