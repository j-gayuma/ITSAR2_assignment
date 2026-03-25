import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, BookOpen, Clock, GraduationCap, MapPin, Users } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import type { BreadcrumbItem } from '@/types';

type Course = {
    id: number;
    name: string;
    code: string;
    description: string | null;
    units: number;
    schedule_day: string | null;
    schedule_time: string | null;
    room: string | null;
    prerequisites: { id: number; name: string; code: string }[];
    required_by: { id: number; name: string; code: string }[];
};

type EnrolledStudent = {
    id: number;
    student: { id: number; name: string; email: string; student_number: string | null; program: string | null };
};

export default function CourseShow({ course, enrolledStudents }: { course: Course; enrolledStudents: EnrolledStudent[] }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Course Catalog', href: '/courses' },
        { title: course.code, href: `/courses/${course.id}` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${course.code} - ${course.name}`} />
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                {/* Back */}
                <Link href="/courses">
                    <Button variant="ghost" size="sm"><ArrowLeft className="mr-2 h-4 w-4" />Back to Catalog</Button>
                </Link>

                {/* Course Header */}
                <div className="flex items-start gap-6 rounded-xl border p-6">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                        <BookOpen className="h-8 w-8 text-blue-500" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-3">
                            <span className="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-1 text-sm font-semibold text-blue-700 ring-1 ring-blue-700/10 ring-inset dark:bg-blue-500/10 dark:text-blue-400">{course.code}</span>
                            <h1 className="text-2xl font-semibold">{course.name}</h1>
                        </div>
                        {course.description && <p className="mt-2 text-muted-foreground">{course.description}</p>}
                        <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1"><BookOpen className="h-4 w-4" />{course.units} units</span>
                            {course.schedule_day && course.schedule_time && (
                                <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{course.schedule_day} {course.schedule_time}</span>
                            )}
                            {course.room && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{course.room}</span>}
                            <span className="flex items-center gap-1"><Users className="h-4 w-4" />{enrolledStudents.length} enrolled</span>
                        </div>
                    </div>
                </div>

                {/* Prerequisites & Required By */}
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl border p-5">
                        <h2 className="mb-3 font-semibold">Prerequisites</h2>
                        {course.prerequisites.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No prerequisites required.</p>
                        ) : (
                            <div className="space-y-2">
                                {course.prerequisites.map((p) => (
                                    <Link key={p.id} href={`/courses/${p.id}`} className="flex items-center gap-2 rounded-lg border p-3 transition-colors hover:bg-muted/50">
                                        <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-amber-700/10 ring-inset dark:bg-amber-500/10 dark:text-amber-400">{p.code}</span>
                                        <span className="text-sm">{p.name}</span>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="rounded-xl border p-5">
                        <h2 className="mb-3 font-semibold">Required By</h2>
                        {course.required_by.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No courses require this as prerequisite.</p>
                        ) : (
                            <div className="space-y-2">
                                {course.required_by.map((p) => (
                                    <Link key={p.id} href={`/courses/${p.id}`} className="flex items-center gap-2 rounded-lg border p-3 transition-colors hover:bg-muted/50">
                                        <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-blue-700/10 ring-inset dark:bg-blue-500/10 dark:text-blue-400">{p.code}</span>
                                        <span className="text-sm">{p.name}</span>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Enrolled Students */}
                <div className="rounded-xl border p-5">
                    <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                            <GraduationCap className="h-4 w-4 text-primary" />
                        </div>
                        <h2 className="font-semibold">Enrolled Students ({enrolledStudents.length})</h2>
                    </div>
                    <div className="overflow-hidden rounded-lg border">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/50">
                                    <th className="w-12 p-3 text-left font-medium text-muted-foreground">#</th>
                                    <th className="p-3 text-left font-medium text-muted-foreground">Student No.</th>
                                    <th className="p-3 text-left font-medium text-muted-foreground">Name</th>
                                    <th className="p-3 text-left font-medium text-muted-foreground">Program</th>
                                </tr>
                            </thead>
                            <tbody>
                                {enrolledStudents.length === 0 && (
                                    <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">No students enrolled.</td></tr>
                                )}
                                {enrolledStudents.map((e, i) => (
                                    <tr key={e.id} className="border-b hover:bg-muted/50">
                                        <td className="p-3 text-muted-foreground">{i + 1}</td>
                                        <td className="p-3 text-muted-foreground">{e.student.student_number || '—'}</td>
                                        <td className="p-3">
                                            <Link href={`/students/${e.student.id}`} className="font-medium text-primary hover:underline">
                                                {e.student.name}
                                            </Link>
                                        </td>
                                        <td className="p-3 text-muted-foreground">{e.student.program || '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
