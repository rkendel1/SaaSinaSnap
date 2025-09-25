# AI Rules for SaaSinaSnap Application Development

This document outlines the technical stack and guidelines for developing features within the SaaSinaSnap application. Adhering to these rules ensures consistency, maintainability, and leverages the strengths of our chosen technologies.

## Tech Stack Overview

SaaSinaSnap is built on a modern, robust, and scalable tech stack:

*   **Next.js 15 (App Router):** The primary React framework for building server-rendered and client-side applications, utilizing the App Router for routing and data fetching.
*   **TypeScript:** All new code must be written in TypeScript for type safety and improved developer experience.
*   **Tailwind CSS:** The utility-first CSS framework for all styling. Prioritize Tailwind utility classes for responsive and consistent designs.
*   **shadcn/ui & Radix UI:** A collection of accessible and customizable UI components built on Radix UI and styled with Tailwind CSS.
*   **Supabase:** Our backend-as-a-service for PostgreSQL database, authentication, and real-time capabilities.
*   **Stripe:** Integrated for all payment processing, including subscriptions, one-time payments, and Stripe Connect for creator payouts.
*   **React Email & Resend:** Used for building and sending beautiful, responsive transactional emails.
*   **Lucide React & React Icons:** Our icon libraries for a wide range of vector icons.
*   **Zod:** A TypeScript-first schema declaration and validation library for robust data validation.
*   **Vercel Analytics:** For tracking application performance and user behavior.

## Library Usage Guidelines

To maintain consistency and efficiency, please follow these guidelines when using specific libraries:

*   **Next.js:**
    *   Use Next.js App Router for all routing, server components, and server actions.
    *   Leverage `next/image` for image optimization.
*   **TypeScript:**
    *   Always use TypeScript for new files and features.
    *   Define clear interfaces and types for data structures.
*   **Tailwind CSS:**
    *   Apply styling exclusively using Tailwind utility classes.
    *   Avoid custom CSS files unless absolutely necessary for complex, non-utility-based styles (e.g., specific animations or very custom layouts not achievable with utilities).
    *   Use `cn` (from `src/utils/cn.ts`) for combining and conditionally applying Tailwind classes.
*   **shadcn/ui:**
    *   Utilize components from `src/components/ui` for standard UI elements (e.g., `Button`, `Input`, `Sheet`, `Dialog`, `DropdownMenu`, `Tabs`, `Progress`, `Toast`).
    *   **Do not modify files within `src/components/ui` directly.** If a component needs customization beyond its props, create a new component that wraps or extends the shadcn/ui component.
*   **Supabase:**
    *   For server-side database interactions in Server Components or Server Actions, use `src/libs/supabase/supabase-server-client.ts`.
    *   For admin-level operations (e.g., webhooks, background jobs that require service role key), use `src/libs/supabase/supabase-admin.ts`.
    *   For client-side interactions, ensure proper RLS is in place.
*   **Stripe:**
    *   All server-side interactions with the Stripe API must use the `stripeAdmin` client from `src/libs/stripe/stripe-admin.ts`.
    *   For client-side Stripe integrations (e.g., Stripe.js for Checkout), use the `@stripe/stripe-js` library.
*   **React Email & Resend:**
    *   All transactional emails should be built using React Email components (from `@react-email/components`).
    *   Emails are sent via the `resendClient` from `src/libs/resend/resend-client.ts`.
*   **Icons:**
    *   Prefer `lucide-react` for general-purpose icons.
    *   Use `react-icons` (specifically `io5` for Ionicons) for brand-specific logos (e.g., GitHub, Google) or if a specific icon is not available in Lucide.
*   **Zod:**
    *   Implement Zod schemas for all form validations, API request/response validations, and data parsing (e.g., `productMetadataSchema`).
*   **`clsx` and `tailwind-merge`:**
    *   Always use the `cn` utility (which wraps `clsx` and `tailwind-merge`) for combining CSS classes to avoid conflicts and ensure correct application of Tailwind styles.