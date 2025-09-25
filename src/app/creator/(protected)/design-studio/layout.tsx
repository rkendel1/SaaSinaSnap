import { PropsWithChildren } from 'react';

// The SidebarNavigation is already provided by the parent layout (src/app/creator/(protected)/layout.tsx)
// So, we just need to render the children for the Design Studio pages.
export default function DesignStudioLayout({ children }: PropsWithChildren) {
  return (
    <>
      {children}
    </>
  );
}