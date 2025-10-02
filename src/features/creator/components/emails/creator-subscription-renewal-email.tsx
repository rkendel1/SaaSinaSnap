import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface CreatorSubscriptionRenewalEmailProps {
  creatorName: string;
  creatorLogoUrl?: string;
  customerName: string;
  productName: string;
  brandColor?: string;
  amount: string;
  renewalDate: string;
  manageSubscriptionUrl: string;
}

export default function CreatorSubscriptionRenewalEmail({
  creatorName,
  creatorLogoUrl,
  customerName,
  productName,
  brandColor = '#3b82f6',
  amount,
  renewalDate,
  manageSubscriptionUrl,
}: CreatorSubscriptionRenewalEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your {creatorName} subscription has been renewed</Preview>
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
            Subscription Renewed Successfully
          </Heading>
          
          <Text style={paragraph}>
            Hi {customerName},
          </Text>
          
          <Text style={paragraph}>
            Your subscription to <strong>{productName}</strong> has been successfully renewed!
          </Text>
          
          <Section style={infoBox}>
            <Text style={infoText}>
              <strong>Amount:</strong> {amount}
            </Text>
            <Text style={infoText}>
              <strong>Renewal Date:</strong> {renewalDate}
            </Text>
            <Text style={infoText}>
              <strong>Next Billing Date:</strong> One billing cycle from now
            </Text>
          </Section>
          
          <Text style={paragraph}>
            Thank you for continuing your subscription with us. You have uninterrupted access 
            to all features and benefits.
          </Text>
          
          <Section style={btnContainer}>
            <Button 
              style={{...button, backgroundColor: brandColor}} 
              href={manageSubscriptionUrl}
            >
              Manage Subscription
            </Button>
          </Section>
          
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

const infoBox = {
  backgroundColor: '#f3f4f6',
  borderRadius: '8px',
  padding: '16px',
  margin: '24px 0',
};

const infoText = {
  fontSize: '14px',
  color: '#374151',
  margin: '8px 0',
};

const footer = {
  fontSize: '14px',
  lineHeight: '1.4',
  color: '#6b7280',
  marginTop: '32px',
};
