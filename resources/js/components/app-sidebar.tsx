import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { BookOpen, Folder, PackageOpen, WalletCards, ContactRound, MessageCircleQuestion, LayoutGrid } from 'lucide-react';
import AppLogo from './app-logo';
import { usePage } from '@inertiajs/react';

type AuthUser = {
    type?: string;
    // add other user properties if needed
};

type AuthProps = {
    user?: AuthUser;
};

export function AppSidebar() {
const { auth } = usePage<{ auth?: AuthProps }>().props;
const userRole = auth?.user?.type || 'student'; // Default to 'student' if no user is authenticated

const mainNavItems: NavItem[] = [
    {
        title: 'Home',
        href: '/student/dashboard',
        icon: LayoutGrid,
    },
    {
        title: 'My Parcel',
        href: '/student/parcel',
        icon: PackageOpen,
    },
    {
        title: 'Payment',
        href: '/student/payment',
        icon: WalletCards,
    },
    {
        title: 'History',
        href: '/student/history',
        icon: ContactRound,
    },
    {
        title: 'FAQs',
        href: '/student/faqs',
        icon: MessageCircleQuestion,
    },
   
];

const staffNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/staff/dashboard',
        icon: LayoutGrid,
    },
    {
        title: 'Parcel',
        href: '/staff/parcel',
        icon: PackageOpen,
    },
    {
        title: 'Payment',
        href: '/staff/payments',
        icon: WalletCards,
    },
    {
        title: 'Users',
        href: '/staff/manage-user',
        icon: ContactRound,
    },
    {
        title: 'FAQs',
        href: '/staff/faqs',
        icon: MessageCircleQuestion,
    },
   
];

let roleBasedNavItems =[...mainNavItems];
if (userRole === 'staff') {
    roleBasedNavItems = [...staffNavItems];
}
const footerNavItems: NavItem[] = [
    {
        title: 'Repository',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: Folder,
    },
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: BookOpen,
    },
];


    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={roleBasedNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
