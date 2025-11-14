import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { useAppearance } from '@/hooks/use-appearance';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { BookOpen, ContactRound, Folder, LayoutGrid, Megaphone, MessageCircleQuestion, PackageOpen, WalletCards } from 'lucide-react';
import { useEffect } from 'react';
import AppLogo from './app-logo';

type AuthUser = { type?: string; department?: string };
type AuthProps = { user?: AuthUser };

export function AppSidebar() {
    const { auth } = usePage<{ auth?: AuthProps }>().props;
    const isStaff = auth?.user?.type === 'staff';
    const userRole: 'student' | 'staff' = isStaff ? 'staff' : 'student';
    const staffDepartment = auth?.user?.department;
    const { updateRole } = useAppearance();

    // Debug logging
    console.log('Sidebar Debug:', {
        isStaff,
        staffDepartment,
        staffDepartmentTrimmed: staffDepartment?.trim(),
        isGeneral: staffDepartment?.trim() === 'Operations - General',
        isAdmin: staffDepartment?.trim() === 'Operations - Admin',
        userType: auth?.user?.type,
        fullUser: auth?.user,
    });

    // Ensure the HTML data-role reflects the authenticated user's role
    useEffect(() => {
        updateRole(userRole);
    }, [userRole, updateRole]);

    const mainNavItems: NavItem[] = [
        { title: 'My Parcel', href: '/student/parcel', icon: PackageOpen },
        { title: 'Payment', href: '/student/payment', icon: WalletCards },
        { title: 'History', href: '/student/history', icon: ContactRound },
        { title: 'FAQs', href: '/student/faq', icon: MessageCircleQuestion },
    ];

    // Operations - General staff: Dashboard, Parcel, Payment
    const staffGeneralNavItems: NavItem[] = [
        { title: 'Dashboard', href: '/staff/dashboard', icon: LayoutGrid },
        { title: 'Parcel', href: '/staff/parcel', icon: PackageOpen },
        { title: 'Payment', href: '/staff/payments', icon: WalletCards },
    ];

    // Operations - Admin staff: Dashboard, Users, Announcements, FAQs
    const staffAdminNavItems: NavItem[] = [
        { title: 'Dashboard', href: '/staff/dashboard', icon: LayoutGrid },
        { title: 'Users', href: '/staff/manage-user', icon: ContactRound },
        { title: 'Announcements', href: '/staff/announcements', icon: Megaphone },
        { title: 'FAQs', href: '/staff/manage-faq', icon: MessageCircleQuestion },
    ];

    // Determine which nav items to show based on role and department
    let roleBasedNavItems: NavItem[];
    if (isStaff) {
        // Trim and compare department to handle any whitespace issues
        const department = staffDepartment?.trim();

        // Check for both "General" and "Operations - General" formats
        if (department === 'Operations - General' || department === 'General') {
            roleBasedNavItems = staffGeneralNavItems;
        } else if (department === 'Operations - Admin' || department === 'Admin') {
            roleBasedNavItems = staffAdminNavItems;
        } else {
            // For other departments or undefined, default to General operations
            roleBasedNavItems = staffGeneralNavItems;
        }
    } else {
        roleBasedNavItems = mainNavItems;
    }

    const footerNavItems: NavItem[] = [
        { title: 'Repository', href: 'https://github.com/laravel/react-starter-kit', icon: Folder },
        { title: 'Documentation', href: 'https://laravel.com/docs/starter-kits#react', icon: BookOpen },
    ];

    return (
        <Sidebar collapsible="icon" variant="inset" className="sidebar" data-role={userRole}>
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
