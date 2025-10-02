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

interface CreatorFeatureUpdateEmailProps {
  creatorName: string;
  creatorLogoUrl?: string;
  customerName: string;
  brandColor?: string;
  featureTitle: string;
  featureDescription: string;
  learnMoreUrl: string;
}

export default function CreatorFeatureUpdateEmail({
  creatorName,
  creatorLogoUrl,
  customerName,
  brandColor = '#3b82f6',
  featureTitle,
  featureDescription,
  learnMoreUrl,
}: CreatorFeatureUpdateEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>New feature available: {featureTitle}</Preview>
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
            🎉 New Feature Available!
          </Heading>
          
          <Text style={paragraph}>
            Hi {customerName},
          </Text>
          
          <Text style={paragraph}>
            We're excited to announce a new feature that's now available in your {creatorName} subscription:
          </Text>
          
          <Section style={featureBox}>
            <Heading style={featureTitle}>{featureTitle}</Heading>
            <Text style={featureDescription}>{featureDescription}</Text>
          </Section>
          
          <Section style={btnContainer}>
            <Button 
              style={{...button, backgroundColor: brandColor}} 
              href={learnMoreUrl}
            >
              Learn More & Try It Now
            </Button>
          </Section>
          
          <Text style={paragraph}>
            This new feature is automatically included in your subscription at no additional cost. 
            We hope it helps you get even more value from {creatorName}!
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

const featureBox = {
  backgroundColor: '#f0f9ff',
  border: `2px solid #3b82f6`,
  borderRadius: '12px',
  padding: '24px',
  margin: '24px 0',
};

const featureTitle = {
  fontSize: '20px',
  fontWeight: '700',
  color: '#1e40af',
  margin: '0 0 12px 0',
};

const featureDescription = {
  fontSize: '15px',
  color: '#374151',
  lineHeight: '1.5',
  margin: '0',
};

const footer = {
  fontSize: '14px',
  lineHeight: '1.4',
  color: '#6b7280',
  marginTop: '32px',
};
