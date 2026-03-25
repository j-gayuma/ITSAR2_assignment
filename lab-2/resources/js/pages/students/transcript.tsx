import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, GraduationCap, Printer } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import type { BreadcrumbItem } from '@/types';

type Enrollment = {
    id: number;
    status: string;
    course: { id: number; name: string; code: string; units: number };
    grade: { grade: number | null; remarks: string | null; semester: string; academic_year: string } | null;
};

type Student = {
    id: number;
    student_number: string | null;
    name: string;
    email: string;
    year_level: number;
    program: string | null;
    enrollments: Enrollment[];
};

function getLetterGrade(grade: number | null): string {
    if (grade === null) return 'N/A';
    if (grade <= 1.25) return 'Excellent';
    if (grade <= 1.50) return 'Very Good';
    if (grade <= 1.75) return 'Good';
    if (grade <= 2.00) return 'Very Satisfactory';
    if (grade <= 2.50) return 'Satisfactory';
    if (grade <= 3.00) return 'Passed';
    return 'Failed';
}

export default function StudentTranscript({ student, gpa }: { student: Student; gpa: number | null }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Students', href: '/students' },
        { title: student.name, href: `/students/${student.id}` },
        { title: 'Transcript', href: `/students/${student.id}/transcript` },
    ];

    const enrollmentsWithGrades = student.enrollments.filter((e) => e.grade);

    const totalUnits = enrollmentsWithGrades.reduce((sum, e) => sum + (e.course.units || 0), 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Transcript - ${student.name}`} />
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                {/* Actions */}
                <div className="flex items-center justify-between">
                    <Link href={`/students/${student.id}`}>
                        <Button variant="ghost" size="sm"><ArrowLeft className="mr-2 h-4 w-4" />Back to Profile</Button>
                    </Link>
                    <Button variant="outline" size="sm" onClick={() => window.print()}>
                        <Printer className="mr-2 h-4 w-4" />Print Transcript
                    </Button>
                </div>

                {/* Transcript */}
                <div className="rounded-xl border bg-white p-8 dark:bg-card" id="transcript">
                    {/* Header */}
                    <div className="mb-8 text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                            <GraduationCap className="h-8 w-8 text-primary" />
                        </div>
                        <h1 className="text-2xl font-bold">Academic Transcript</h1>
                        <p className="text-muted-foreground">Official Student Record</p>
                    </div>

                    {/* Student Info */}
                    <div className="mb-6 grid grid-cols-2 gap-4 rounded-lg border p-4">
                        <div>
                            <p className="text-xs font-medium text-muted-foreground">Student Name</p>
                            <p className="font-semibold">{student.name}</p>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-muted-foreground">Student Number</p>
                            <p className="font-semibold">{student.student_number || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-muted-foreground">Program</p>
                            <p className="font-semibold">{student.program || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-muted-foreground">Year Level</p>
                            <p className="font-semibold">Year {student.year_level}</p>
                        </div>
                    </div>

                    {/* Grades Table */}
                    <div className="mb-6 overflow-hidden rounded-lg border">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/50">
                                    <th className="p-3 text-left font-medium text-muted-foreground">Course Code</th>
                                    <th className="p-3 text-left font-medium text-muted-foreground">Course Name</th>
                                    <th className="p-3 text-center font-medium text-muted-foreground">Units</th>
                                    <th className="p-3 text-center font-medium text-muted-foreground">Grade</th>
                                    <th className="p-3 text-center font-medium text-muted-foreground">Remarks</th>
                                    <th className="p-3 text-center font-medium text-muted-foreground">Semester</th>
                                </tr>
                            </thead>
                            <tbody>
                                {student.enrollments.length === 0 && (
                                    <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No academic records.</td></tr>
                                )}
                                {student.enrollments.map((e) => (
                                    <tr key={e.id} className="border-b">
                                        <td className="p-3">
                                            <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-700/10 ring-inset dark:bg-blue-500/10 dark:text-blue-400">
                                                {e.course.code}
                                            </span>
                                        </td>
                                        <td className="p-3 font-medium">{e.course.name}</td>
                                        <td className="p-3 text-center">{e.course.units}</td>
                                        <td className="p-3 text-center font-semibold">
                                            {e.grade?.grade !== null && e.grade?.grade !== undefined ? Number(e.grade.grade).toFixed(2) : '—'}
                                        </td>
                                        <td className="p-3 text-center">
                                            <span className={`text-xs font-medium ${
                                                e.grade?.grade !== null && e.grade?.grade !== undefined && e.grade.grade <= 3.00
                                                    ? 'text-emerald-600 dark:text-emerald-400'
                                                    : e.grade?.grade !== null && e.grade?.grade !== undefined
                                                        ? 'text-red-600 dark:text-red-400'
                                                        : 'text-muted-foreground'
                                            }`}>
                                                {e.grade?.grade !== null && e.grade?.grade !== undefined ? getLetterGrade(e.grade.grade) : '—'}
                                            </span>
                                        </td>
                                        <td className="p-3 text-center text-muted-foreground">{e.grade?.semester || '—'} {e.grade?.academic_year || ''}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Summary */}
                    <div className="grid grid-cols-3 gap-4 rounded-lg bg-muted/30 p-4">
                        <div className="text-center">
                            <p className="text-xs font-medium text-muted-foreground">Total Units</p>
                            <p className="text-xl font-bold">{totalUnits}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-xs font-medium text-muted-foreground">Cumulative GPA</p>
                            <p className="text-xl font-bold">{gpa !== null ? gpa.toFixed(2) : 'N/A'}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-xs font-medium text-muted-foreground">Standing</p>
                            <p className="text-xl font-bold">{gpa !== null ? getLetterGrade(gpa) : 'N/A'}</p>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
