import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, BookOpen, GraduationCap, CalendarDays } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import type { BreadcrumbItem } from '@/types';

type Enrollment = {
    id: number;
    student_id: number;
    course_id: number;
    status: string;
    created_at: string;
    student: { id: number; name: string; email: string };
    course: { id: number; name: string; code: string; description: string | null };
};

function StatusBadge({ status }: { status: string }) {
    const colors: Record<string, string> = {
        ENROLLED:
            'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20',
        PENDING:
            'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20',
        DROPPED:
            'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20',
    };

    return (
        <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ring-1 ring-inset ${colors[status] || colors['ENROLLED']}`}
        >
            {status}
        </span>
    );
}

export default function EnrollmentShow({ enrollment }: { enrollment: Enrollment }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Enrollments', href: '/enrollments' },
        { title: `Enrollment #${enrollment.id}`, href: `/enrollments/${enrollment.id}` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Enrollment #${enrollment.id}`} />
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                {/* Back button */}
                <div>
                    <Link href="/enrollments">
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Enrollments
                        </Button>
                    </Link>
                </div>

                {/* Enrollment Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Enrollment #{enrollment.id}</h1>
                        <p className="text-sm text-muted-foreground">
                            Created on{' '}
                            {new Date(enrollment.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                            })}
                        </p>
                    </div>
                    <StatusBadge status={enrollment.status} />
                </div>

                {/* Detail Cards */}
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Student Card */}
                    <div className="rounded-lg border p-6">
                        <div className="mb-4 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                <GraduationCap className="h-5 w-5 text-primary" />
                            </div>
                            <h2 className="text-lg font-semibold">Student Information</h2>
                        </div>
                        <dl className="space-y-3">
                            <div>
                                <dt className="text-sm font-medium text-muted-foreground">Name</dt>
                                <dd className="text-sm">{enrollment.student.name}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-muted-foreground">Email</dt>
                                <dd className="text-sm">{enrollment.student.email}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-muted-foreground">Student ID</dt>
                                <dd className="text-sm">#{enrollment.student.id}</dd>
                            </div>
                        </dl>
                    </div>

                    {/* Course Card */}
                    <div className="rounded-lg border p-6">
                        <div className="mb-4 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                                <BookOpen className="h-5 w-5 text-blue-500" />
                            </div>
                            <h2 className="text-lg font-semibold">Course Information</h2>
                        </div>
                        <dl className="space-y-3">
                            <div>
                                <dt className="text-sm font-medium text-muted-foreground">Course Code</dt>
                                <dd className="text-sm">
                                    <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-700/10 ring-inset dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/20">
                                        {enrollment.course.code}
                                    </span>
                                </dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-muted-foreground">Course Name</dt>
                                <dd className="text-sm">{enrollment.course.name}</dd>
                            </div>
                            {enrollment.course.description && (
                                <div>
                                    <dt className="text-sm font-medium text-muted-foreground">Description</dt>
                                    <dd className="text-sm">{enrollment.course.description}</dd>
                                </div>
                            )}
                        </dl>
                    </div>
                </div>

                {/* Enrollment Details */}
                <div className="rounded-lg border p-6">
                    <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
                            <CalendarDays className="h-5 w-5 text-violet-500" />
                        </div>
                        <h2 className="text-lg font-semibold">Enrollment Details</h2>
                    </div>
                    <div className="overflow-hidden rounded-lg border">
                        <table className="w-full text-sm">
                            <tbody>
                                <tr className="border-b">
                                    <td className="bg-muted/50 p-3 font-medium text-muted-foreground">Enrollment ID</td>
                                    <td className="p-3">#{enrollment.id}</td>
                                </tr>
                                <tr className="border-b">
                                    <td className="bg-muted/50 p-3 font-medium text-muted-foreground">Student</td>
                                    <td className="p-3">{enrollment.student.name}</td>
                                </tr>
                                <tr className="border-b">
                                    <td className="bg-muted/50 p-3 font-medium text-muted-foreground">Course</td>
                                    <td className="p-3">{enrollment.course.code} — {enrollment.course.name}</td>
                                </tr>
                                <tr className="border-b">
                                    <td className="bg-muted/50 p-3 font-medium text-muted-foreground">Status</td>
                                    <td className="p-3"><StatusBadge status={enrollment.status} /></td>
                                </tr>
                                <tr>
                                    <td className="bg-muted/50 p-3 font-medium text-muted-foreground">Date Enrolled</td>
                                    <td className="p-3">
                                        {new Date(enrollment.created_at).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                        })}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
