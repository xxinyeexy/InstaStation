import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import Alert from '@/components/ui/alert';
import { type BreadcrumbItem } from '@/types';
import { usePage } from '@inertiajs/react';
import { type PropsWithChildren } from 'react';

export default function AppSidebarLayout({ children, breadcrumbs = [], headerAction }: PropsWithChildren<{ breadcrumbs?: BreadcrumbItem[], headerAction?: React.ReactNode }>) {
    const { props } = usePage();
    const flash = (props as any).flash || {};
    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent variant="sidebar" className="overflow-x-hidden">
                <AppSidebarHeader breadcrumbs={breadcrumbs}>
                    {headerAction}
                </AppSidebarHeader>
                {children}
                {flash.success && (
                    <div className="fixed right-6 bottom-6 z-50">
                        <Alert type="success" message={flash.success} duration={3000} />
                    </div>
                )}
            </AppContent>
        </AppShell>
    );
}
