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

interface CreatorWelcomeEmailProps {
  creatorName: string;
  creatorLogoUrl?: string;
  customerName: string;
  productName: string;
  brandColor?: string;
  accountUrl: string;
}

export default function CreatorWelcomeEmail({
  creatorName,
  creatorLogoUrl,
  customerName,
  productName,
  brandColor = '#3b82f6',
  accountUrl,
}: CreatorWelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to {creatorName} - Your subscription is active!</Preview>
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
            Welcome to {creatorName}!
          </Heading>
          
          <Text style={paragraph}>
            Hi {customerName},
          </Text>
          
          <Text style={paragraph}>
            Thank you for subscribing to <strong>{productName}</strong>! 
            Your subscription is now active and you have full access to all features.
          </Text>
          
          <Section style={btnContainer}>
            <Button 
              style={{...button, backgroundColor: brandColor}} 
              href={accountUrl}
            >
              Access Your Account
            </Button>
          </Section>
          
          <Text style={paragraph}>
            If you have any questions, don't hesitate to reach out to our support team.
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

const footer = {
  fontSize: '14px',
  lineHeight: '1.4',
  color: '#6b7280',
  marginTop: '32px',
};