import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import Alert from '@/components/ui/alert';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { type PropsWithChildren, useState, useEffect } from 'react';
import ProductTour from '@/components/product-tour';

export default function AppSidebarLayout({ children, breadcrumbs = [], headerAction }: PropsWithChildren<{ breadcrumbs?: BreadcrumbItem[], headerAction?: React.ReactNode }>) {
    const { auth, ...props } = usePage<SharedData>().props;
    const flash = (props as any).flash || {};
    const [isTourOpen, setIsTourOpen] = useState(false);

    useEffect(() => {
        if (auth.user && !auth.user.has_completed_tour) {
            setIsTourOpen(true);
        }
    }, [auth.user]);

    return (
        <AppShell variant="sidebar">
            <ProductTour isOpen={isTourOpen} onClose={() => setIsTourOpen(false)} />
            <AppSidebar />
            <AppContent variant="sidebar" className="overflow-x-hidden">
                <AppSidebarHeader breadcrumbs={breadcrumbs}>
                    {headerAction}
                </AppSidebarHeader>
                {children}
                {flash.success && !window.location.pathname.includes('/staff/payments') && !window.location.pathname.includes('/student/payment') && (
                    <div className="fixed right-6 bottom-6 z-50">
                        <Alert type="success" message={flash.success} duration={3000} />
                    </div>
                )}
            </AppContent>
        </AppShell>
    );
}
