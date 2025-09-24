import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Img,
  Preview,
  Section,
  Text,
  Heading,
} from '@react-email/components';

interface CreatorPaymentFailedEmailProps {
  creatorName: string;
  creatorLogoUrl?: string;
  customerName: string;
  brandColor?: string;
  updatePaymentUrl: string;
  nextRetryDate: string;
}

export default function CreatorPaymentFailedEmail({
  creatorName,
  creatorLogoUrl,
  customerName,
  brandColor = '#3b82f6',
  updatePaymentUrl,
  nextRetryDate,
}: CreatorPaymentFailedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Action Required: Payment Failed for Your {creatorName} Subscription</Preview>
      <Body style={main}>
        <Container style={container}>
          {creatorLogoUrl && (
            <Section style={logoSection}>
              <Img
                src={creatorLogoUrl}
                width="120"
                height="40"
                alt={`${creatorName} logo`}
                style={logo}
              />
            </Section>
          )}
          
          <Heading style={{...heading, color: brandColor}}>
            Payment Failed - Action Required
          </Heading>
          
          <Text style={paragraph}>
            Hi {customerName},
          </Text>
          
          <Text style={paragraph}>
            We weren't able to process your recent payment for your {creatorName} subscription. 
            This could be due to an expired card, insufficient funds, or your bank declining the charge.
          </Text>
          
          <Section style={alertBox}>
            <Text style={alertText}>
              <strong>Next retry:</strong> {nextRetryDate}
            </Text>
          </Section>
          
          <Section style={btnContainer}>
            <Button 
              style={{...button, backgroundColor: brandColor}} 
              href={updatePaymentUrl}
            >
              Update Payment Method
            </Button>
          </Section>
          
          <Text style={paragraph}>
            To avoid any interruption in your service, please update your payment method as soon as possible.
          </Text>
          
          <Text style={paragraph}>
            If you have any questions or need assistance, please don't hesitate to contact our support team.
          </Text>
          
          <Text style={footer}>
            Best regards,<br />
            The {creatorName} Team
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '560px',
};

const logoSection = {
  textAlign: 'center' as const,
  marginBottom: '32px',
};

const logo = {
  margin: '0 auto',
};

const heading = {
  fontSize: '24px',
  lineHeight: '1.3',
  fontWeight: '700',
  textAlign: 'center' as const,
  letterSpacing: '-1px',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '1.4',
  color: '#374151',
  marginBottom: '16px',
};

const btnContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
  borderRadius: '8px',
  color: '#ffffff',
};

const alertBox = {
  backgroundColor: '#fef3c7',
  border: '1px solid #fbbf24',
  borderRadius: '8px',
  padding: '16px',
  margin: '24px 0',
};

const alertText = {
  fontSize: '14px',
  color: '#92400e',
  margin: '0',
};

const footer = {
  fontSize: '14px',
  lineHeight: '1.4',
  color: '#6b7280',
  marginTop: '32px',
};