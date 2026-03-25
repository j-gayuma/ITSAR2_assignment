import { Link } from '@inertiajs/react';
import { BookOpen, CalendarCheck, ClipboardCheck, ClipboardList, GraduationCap, LayoutGrid, TrendingUp } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { NavItem } from '@/types';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutGrid,
    },
    {
        title: 'Students',
        href: '/students',
        icon: GraduationCap,
    },
    {
        title: 'Courses',
        href: '/courses',
        icon: BookOpen,
    },
    {
        title: 'Enrollments',
        href: '/enrollments',
        icon: ClipboardList,
    },
    {
        title: 'Schedule',
        href: '/schedule',
        icon: CalendarCheck,
    },
    {
        title: 'Grades',
        href: '/grades',
        icon: TrendingUp,
    },
    {
        title: 'Attendance',
        href: '/attendance',
        icon: ClipboardCheck,
    },
];


export function AppSidebar() {
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
                <NavMain items={mainNavItems} />
            </SidebarContent>
        </Sidebar>
    );
}
