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

interface CreatorPasswordResetEmailProps {
  creatorName?: string;
  creatorLogoUrl?: string;
  customerName: string;
  brandColor?: string;
  resetUrl: string;
}

export default function CreatorPasswordResetEmail({
  creatorName = 'SaaSinaSnap',
  creatorLogoUrl,
  customerName,
  brandColor = '#3b82f6',
  resetUrl,
}: CreatorPasswordResetEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Reset your {creatorName} password</Preview>
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
            Reset Your Password
          </Heading>
          
          <Text style={paragraph}>
            Hi {customerName},
          </Text>
          
          <Text style={paragraph}>
            We received a request to reset your password for your {creatorName} account. 
            Click the button below to create a new password.
          </Text>
          
          <Section style={btnContainer}>
            <Button 
              style={{...button, backgroundColor: brandColor}} 
              href={resetUrl}
            >
              Reset Password
            </Button>
          </Section>
          
          <Text style={paragraph}>
            If you didn't request a password reset, you can safely ignore this email. 
            Your password will remain unchanged.
          </Text>
          
          <Text style={alertText}>
            <strong>Note:</strong> This link will expire in 24 hours for security reasons.
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

const alertText = {
  fontSize: '14px',
  color: '#92400e',
  marginTop: '16px',
  padding: '12px',
  backgroundColor: '#fef3c7',
  borderRadius: '6px',
};

const footer = {
  fontSize: '14px',
  lineHeight: '1.4',
  color: '#6b7280',
  marginTop: '32px',
};
