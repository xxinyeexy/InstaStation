import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import { type BreadcrumbItem } from '@/types';
import { type ReactNode } from 'react';

interface AppLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
    headerAction?: ReactNode;
}

export default ({ children, breadcrumbs, headerAction, ...props }: AppLayoutProps) => (
    <AppLayoutTemplate breadcrumbs={breadcrumbs} headerAction={headerAction} {...props}>
        {children}
    </AppLayoutTemplate>
);
