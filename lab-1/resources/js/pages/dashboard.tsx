import { Head, Link } from '@inertiajs/react';
import {
    BookOpen,
    CalendarCheck,
    ClipboardList,
    GraduationCap,
    TrendingUp,
    Users,
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type Stats = {
    totalStudents: number;
    totalCourses: number;
    totalEnrollments: number;
    activeStudents: number;
    presentToday: number;
    absentToday: number;
    lateToday: number;
    averageGpa: number | null;
    passedCount: number;
    failedCount: number;
};

type RecentEnrollment = {
    id: number;
    status: string;
    created_at: string;
    student: { id: number; name: string };
    course: { id: number; name: string; code: string };
};

type CourseEnrollment = { name: string; count: number };

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
];

function StatCard({
    title,
    value,
    subtitle,
    icon: Icon,
    color,
    href,
}: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ElementType;
    color: string;
    href?: string;
}) {
    const card = (
        <div className="flex items-start gap-4 rounded-xl border p-5 transition-colors hover:bg-muted/30">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${color}`}>
                <Icon className="h-6 w-6" />
            </div>
            <div className="min-w-0">
                <p className="text-sm font-medium text-muted-foreground">{title}</p>
                <p className="text-2xl font-bold">{value}</p>
                {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
            </div>
        </div>
    );
    return href ? <Link href={href}>{card}</Link> : card;
}

export default function Dashboard({
    stats,
    recentEnrollments,
    courseEnrollments,
}: {
    stats: Stats;
    recentEnrollments: RecentEnrollment[];
    courseEnrollments: CourseEnrollment[];
}) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                {/* Stats Grid */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title="Total Students"
                        value={stats.totalStudents}
                        subtitle={`${stats.activeStudents} active`}
                        icon={GraduationCap}
                        color="bg-primary/10 text-primary"
                        href="/students"
                    />
                    <StatCard
                        title="Total Courses"
                        value={stats.totalCourses}
                        icon={BookOpen}
                        color="bg-blue-500/10 text-blue-500"
                        href="/courses"
                    />
                    <StatCard
                        title="Enrollments"
                        value={stats.totalEnrollments}
                        icon={ClipboardList}
                        color="bg-violet-500/10 text-violet-500"
                        href="/enrollments"
                    />
                    <StatCard
                        title="Average GPA"
                        value={stats.averageGpa ?? 'N/A'}
                        subtitle={`${stats.passedCount} passed · ${stats.failedCount} failed`}
                        icon={TrendingUp}
                        color="bg-emerald-500/10 text-emerald-500"
                        href="/grades"
                    />
                </div>

                {/* Attendance Today + Course Enrollment */}
                <div className="grid gap-4 lg:grid-cols-2">
                    {/* Attendance Summary */}
                    <div className="rounded-xl border p-5">
                        <div className="mb-4 flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
                                <CalendarCheck className="h-4 w-4 text-amber-500" />
                            </div>
                            <h2 className="font-semibold">Today's Attendance</h2>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="rounded-lg bg-emerald-50 p-3 text-center dark:bg-emerald-500/10">
                                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.presentToday}</p>
                                <p className="text-xs text-muted-foreground">Present</p>
                            </div>
                            <div className="rounded-lg bg-red-50 p-3 text-center dark:bg-red-500/10">
                                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.absentToday}</p>
                                <p className="text-xs text-muted-foreground">Absent</p>
                            </div>
                            <div className="rounded-lg bg-amber-50 p-3 text-center dark:bg-amber-500/10">
                                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.lateToday}</p>
                                <p className="text-xs text-muted-foreground">Late</p>
                            </div>
                        </div>
                    </div>

                    {/* Top Courses */}
                    <div className="rounded-xl border p-5">
                        <div className="mb-4 flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                                <Users className="h-4 w-4 text-blue-500" />
                            </div>
                            <h2 className="font-semibold">Top Courses by Enrollment</h2>
                        </div>
                        <div className="space-y-3">
                            {courseEnrollments.length === 0 && (
                                <p className="text-sm text-muted-foreground">No enrollment data yet.</p>
                            )}
                            {courseEnrollments.map((item, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium">
                                            {i + 1}
                                        </span>
                                        <span className="text-sm font-medium">{item.name}</span>
                                    </div>
                                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                                        {item.count} students
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Recent Enrollments */}
                <div className="rounded-xl border p-5">
                    <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
                                <ClipboardList className="h-4 w-4 text-violet-500" />
                            </div>
                            <h2 className="font-semibold">Recent Enrollments</h2>
                        </div>
                        <Link href="/enrollments" className="text-sm text-primary hover:underline">
                            View all
                        </Link>
                    </div>
                    <div className="overflow-hidden rounded-lg border">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/50">
                                    <th className="p-3 text-left font-medium text-muted-foreground">Student</th>
                                    <th className="p-3 text-left font-medium text-muted-foreground">Course</th>
                                    <th className="p-3 text-left font-medium text-muted-foreground">Status</th>
                                    <th className="p-3 text-left font-medium text-muted-foreground">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentEnrollments.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="p-6 text-center text-muted-foreground">
                                            No enrollments yet.
                                        </td>
                                    </tr>
                                )}
                                {recentEnrollments.map((e) => (
                                    <tr key={e.id} className="border-b transition-colors hover:bg-muted/50">
                                        <td className="p-3 font-medium">{e.student.name}</td>
                                        <td className="p-3">
                                            <span className="text-muted-foreground">{e.course.code}</span>{' '}
                                            {e.course.name}
                                        </td>
                                        <td className="p-3">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${
                                                e.status === 'ENROLLED'
                                                    ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400'
                                                    : 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400'
                                            }`}>
                                                {e.status}
                                            </span>
                                        </td>
                                        <td className="p-3 text-muted-foreground">
                                            {new Date(e.created_at).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric',
                                            })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    {[
                        { label: 'Students', href: '/students', icon: GraduationCap, color: 'text-primary' },
                        { label: 'Courses', href: '/courses', icon: BookOpen, color: 'text-blue-500' },
                        { label: 'Schedule', href: '/schedule', icon: CalendarCheck, color: 'text-amber-500' },
                        { label: 'Grades', href: '/grades', icon: TrendingUp, color: 'text-emerald-500' },
                        { label: 'Attendance', href: '/attendance', icon: ClipboardList, color: 'text-violet-500' },
                    ].map((item) => (
                        <Link
                            key={item.label}
                            href={item.href}
                            className="flex items-center gap-3 rounded-xl border p-4 transition-colors hover:bg-muted/50"
                        >
                            <item.icon className={`h-5 w-5 ${item.color}`} />
                            <span className="text-sm font-medium">{item.label}</span>
                        </Link>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}
