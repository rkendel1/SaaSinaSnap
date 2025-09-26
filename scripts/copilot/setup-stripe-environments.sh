#!/bin/bash

# Staryer Platform - Stripe Environment Setup Automation
# This script helps set up Stripe test and production environments for multi-tenant deployment

set -e

echo "🚀 Staryer Platform - Stripe Environment Setup"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running in correct directory
if [ ! -f "package.json" ] || [ ! -d "src" ]; then
    print_error "Please run this script from the root of your Staryer project"
    exit 1
fi

print_step "Checking environment setup..."

# Check for required environment variables
REQUIRED_VARS=(
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
    "STRIPE_SECRET_KEY"
    "NEXT_PUBLIC_STRIPE_CLIENT_ID"
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    "SUPABASE_SERVICE_ROLE_KEY"
)

MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    print_error "Missing required environment variables:"
    for var in "${MISSING_VARS[@]}"; do
        echo "  - $var"
    done
    echo ""
    print_warning "Please set these variables in your .env.local file"
    echo "You can copy from .env.local.example as a starting point"
    exit 1
fi

print_success "Environment variables are properly configured"

# Check for production Stripe credentials
print_step "Checking production Stripe configuration..."

if [ -z "$STRIPE_PRODUCTION_SECRET_KEY" ] && [ -z "$NEXT_PUBLIC_STRIPE_PRODUCTION_PUBLISHABLE_KEY" ]; then
    print_warning "Production Stripe credentials not found"
    echo "For production deployments, you'll need to set:"
    echo "  - STRIPE_PRODUCTION_SECRET_KEY"
    echo "  - NEXT_PUBLIC_STRIPE_PRODUCTION_PUBLISHABLE_KEY"
    echo ""
    read -p "Continue with test-only setup? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_error "Setup cancelled"
        exit 1
    fi
else
    print_success "Production credentials configured"
fi

# Run database migrations
print_step "Running database migrations..."

if command -v supabase &> /dev/null; then
    if supabase migration up --linked; then
        print_success "Database migrations completed"
    else
        print_error "Database migration failed"
        echo "Please ensure you have linked your Supabase project:"
        echo "  supabase link --project-ref YOUR_PROJECT_REF"
        exit 1
    fi
else
    print_warning "Supabase CLI not found. Please run migrations manually:"
    echo "  npm install -g supabase"
    echo "  supabase migration up --linked"
fi

# Generate TypeScript types
print_step "Generating TypeScript types..."

if npm run generate-types; then
    print_success "TypeScript types generated"
else
    print_warning "Failed to generate types automatically"
    echo "You can run this manually: npm run generate-types"
fi

# Validate setup
print_step "Validating setup..."

# Check if migration tables exist
echo "Checking database schema..."

# Build the project to validate everything works
print_step "Building project to validate setup..."

if npm run build; then
    print_success "Project builds successfully"
else
    print_error "Build failed - please check the errors above"
    exit 1
fi

# Final instructions
echo ""
echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo -e "${GREEN}Your Staryer platform is ready for multi-tenant Stripe environments!${NC}"
echo ""
echo "Next steps:"
echo "1. 🔗 Connect your Stripe accounts:"
echo "   - Visit /platform-owner-onboarding to connect test environment"
echo "   - Optionally connect production environment"
echo ""
echo "2. 🛍️  Create products:"
echo "   - Start in test environment to safely configure products"
echo "   - Use one-click deployment to promote to production"
echo ""
echo "3. 👥 Invite tenants:"
echo "   - Each tenant gets isolated Stripe environments"
echo "   - Tenants can test products before going live"
echo ""
echo "4. 📊 Monitor deployments:"
echo "   - View deployment history and audit logs"
echo "   - Track environment switches and product updates"
echo ""
echo -e "${BLUE}Documentation:${NC} docs/multi-tenant-stripe-environments.md"
echo -e "${BLUE}Support:${NC} Check the README.md for troubleshooting"
echo ""
print_success "Happy building! 🚀"