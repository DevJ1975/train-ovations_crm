import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';

type OutreachDraftEmailProps = {
  previewText: string;
  recipientName: string;
  repName: string;
  companyName?: string;
  bodyText: string;
};

export function OutreachDraftEmail({
  previewText,
  recipientName,
  repName,
  companyName,
  bodyText,
}: OutreachDraftEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={{ backgroundColor: '#f3f6fb', fontFamily: 'Arial, sans-serif' }}>
        <Container
          style={{
            backgroundColor: '#ffffff',
            margin: '24px auto',
            padding: '32px',
            borderRadius: '18px',
            maxWidth: '560px',
          }}
        >
          <Heading style={{ color: '#14213d', fontSize: '24px' }}>
            Trainovations Draft Preview
          </Heading>
          <Text style={{ color: '#334155', lineHeight: '24px' }}>
            Hi {recipientName},
          </Text>
          <Section>
            <Text style={{ color: '#334155', lineHeight: '24px', whiteSpace: 'pre-wrap' }}>
              {bodyText}
            </Text>
          </Section>
          <Text style={{ color: '#334155', lineHeight: '24px' }}>
            Best,
            <br />
            {repName}
            {companyName ? `, ${companyName}` : ''}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
