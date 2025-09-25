# Trial Embeds Documentation

## Overview

Trial embeds are configurable widgets that allow creators to offer "try before you buy" experiences to their customers. These embeds automatically expire after a set period and display call-to-action messages to encourage subscriptions.

## Features

- **Configurable trial duration** - Set how long the trial lasts
- **Automatic expiration detection** - Embeds automatically detect when trials have expired
- **Dynamic UI states** - Different visual themes for active vs expired trials
- **Customizable call-to-action** - Configure messaging and buttons for expired trials
- **Feature highlighting** - Show what's included in the trial

## Usage

### Basic Implementation

```html
<!-- Container for the trial embed -->
<div id="paylift-embed-trial_embed-your-trial-id"></div>

<!-- Embed script -->
<script
  data-creator-id="your-creator-id"
  data-embed-type="trial_embed"
  data-embed-id="your-trial-id"
  src="https://your-domain.com/static/embed.js">
</script>
```

### Configuration Options

The trial embed behavior is configured via the API endpoint that returns trial data. You can customize:

#### Trial Features
```javascript
{
  "trialFeatures": [
    "Full access to all features",
    "24/7 customer support", 
    "Advanced analytics dashboard",
    "No credit card required",
    "Cancel anytime"
  ]
}
```

#### Expired State Configuration
```javascript
{
  "expiredConfig": {
    "title": "Free Trial Has Ended",
    "description": "Thanks for trying our platform! Subscribe now to unlock all features.",
    "buttonText": "Get Full Access",
    "subscriptionUrl": "/pricing"
  }
}
```

## Visual States

### Active Trial
- Green color theme
- Shows days remaining
- Lists trial features
- Displays "FREE TRIAL ACTIVE" badge
- Shows trial terms (no credit card required, etc.)

### Expired Trial  
- Yellow/orange color theme
- Shows timer icon
- Displays expiration message
- Shows call-to-action button
- Links to subscription/pricing page

## API Endpoint

Trial embed data is served from:
```
GET /api/embed/trial/[creatorId]/[embedId]
```

### Response Format
```javascript
{
  "creator": {
    "id": "creator-id",
    "business_name": "Creator Business",
    "brand_color": "#3b82f6"
  },
  "embedData": {
    "isExpired": false,
    "daysRemaining": 7,
    "trialStartDate": "2024-01-01T00:00:00Z",
    "trialEndDate": "2024-01-08T00:00:00Z", 
    "trialFeatures": [...],
    "expiredConfig": {...}
  }
}
```

## Integration with Existing Systems

Trial embeds integrate with:
- **Creator Profile System** - Uses creator branding and configuration
- **Trial Management** - Leverages existing trial configuration logic
- **Embed System** - Uses the same embed.js infrastructure as other embed types

## Implementation Details

### File Structure
- `src/features/creator/types/embed-assets.ts` - Type definitions
- `src/features/creator/services/trial-embed-service.ts` - Trial logic service
- `src/app/api/embed/trial/[creatorId]/[embedId]/route.ts` - API endpoint
- `public/static/embed.js` - Frontend rendering logic

### Key Functions
- `renderTrialEmbed()` - Renders the trial embed UI
- `TrialEmbedService.getTrialEmbedData()` - Calculates trial status
- `TrialEmbedService.createDefaultExpiredConfig()` - Generates default expired state

## Customization

### Styling
Trial embeds use inline styles for maximum compatibility across different websites. The styling adapts to the creator's brand color automatically.

### Features List
Customize the features shown in active trials by configuring the `trialFeatures` array in the API response.

### Expiration Messaging
Customize expired trial messaging by configuring the `expiredConfig` object with your own titles, descriptions, and call-to-action text.

## Best Practices

1. **Clear Value Proposition** - Make sure trial features clearly communicate value
2. **Appropriate Duration** - Set trial duration based on your product's complexity
3. **Compelling CTA** - Use action-oriented language in expired state buttons
4. **Brand Consistency** - Ensure trial embeds match your overall brand experience
5. **Mobile Friendly** - Test embeds on mobile devices for optimal experience

## Troubleshooting

### Common Issues

**Embed not loading**
- Check that the target div ID matches the expected format: `paylift-embed-trial_embed-{embedId}`
- Verify the API endpoint returns valid data
- Check browser console for JavaScript errors

**Styling issues**
- Trial embeds use scoped CSS to prevent conflicts
- Brand colors are automatically applied from creator profile
- Responsive design adapts to container width

**API errors**
- Ensure creator ID and embed ID are valid
- Check that the API endpoint is accessible
- Verify proper CORS headers for cross-domain embedding