import { Head, useForm, router } from '@inertiajs/react';
import { ClipboardCheck, Search, Check, X, Clock, AlertCircle } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { BreadcrumbItem } from '@/types';
import { useState, useEffect } from 'react';

type Course = { id: number; name: string; code: string };
type Student = { id: number; name: string; student_number: string | null };
type EnrollmentForAttendance = { id: number; student: Student };
type Attendance = {
    id: number;
    date: string;
    status: string;
    remarks: string | null;
    enrollment: {
        student: Student;
        course: Course;
    };
};

type AttendanceRecord = { enrollment_id: number; status: string; remarks: string };

export default function AttendanceIndex({ courses, students, recentAttendance }: { courses: Course[]; students: Student[]; recentAttendance: Attendance[] }) {
    const [selectedCourse, setSelectedCourse] = useState<number | ''>('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [enrollments, setEnrollments] = useState<EnrollmentForAttendance[]>([]);
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Attendance Tracking', href: '/attendance' },
    ];

    useEffect(() => {
        if (!selectedCourse) {
            setEnrollments([]);
            setRecords([]);
            return;
        }
        setLoading(true);
        fetch(`/attendance/enrollments/${selectedCourse}`, { headers: { Accept: 'application/json' } })
            .then((r) => r.json())
            .then((data: EnrollmentForAttendance[]) => {
                setEnrollments(data);
                setRecords(data.map((e) => ({ enrollment_id: e.id, status: 'PRESENT', remarks: '' })));
            })
            .finally(() => setLoading(false));
    }, [selectedCourse]);

    const updateRecord = (idx: number, field: keyof AttendanceRecord, value: string) => {
        setRecords((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
    };

    const markAll = (status: string) => {
        setRecords((prev) => prev.map((r) => ({ ...r, status })));
    };

    const submit = (ev: React.FormEvent) => {
        ev.preventDefault();
        if (!selectedCourse || records.length === 0) return;
        setSubmitting(true);
        router.post('/attendance', { course_id: selectedCourse, date, records }, {
            onFinish: () => setSubmitting(false),
        });
    };

    const statusIcon = (status: string) => {
        switch (status) {
            case 'PRESENT': return <Check className="h-3.5 w-3.5 text-green-500" />;
            case 'ABSENT': return <X className="h-3.5 w-3.5 text-red-500" />;
            case 'LATE': return <Clock className="h-3.5 w-3.5 text-yellow-500" />;
            case 'EXCUSED': return <AlertCircle className="h-3.5 w-3.5 text-blue-500" />;
            default: return null;
        }
    };

    const statusBadge = (status: string) => {
        const colors: Record<string, string> = {
            PRESENT: 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-500/10 dark:text-green-400',
            ABSENT: 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400',
            LATE: 'bg-yellow-50 text-yellow-700 ring-yellow-600/20 dark:bg-yellow-500/10 dark:text-yellow-400',
            EXCUSED: 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400',
        };
        return (
            <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${colors[status] || 'bg-muted'}`}>
                {statusIcon(status)} {status}
            </span>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Attendance Tracking" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <ClipboardCheck className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold">Attendance Tracking</h1>
                        <p className="text-sm text-muted-foreground">Record and monitor student attendance</p>
                    </div>
                </div>

                {/* Record Attendance */}
                <form onSubmit={submit} className="rounded-xl border p-5">
                    <h2 className="mb-4 font-semibold">Record Attendance</h2>
                    <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="space-y-1.5">
                            <Label>Course</Label>
                            <select className="flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm" value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value ? Number(e.target.value) : '')}>
                                <option value="">Select a course...</option>
                                {courses.map((c) => (
                                    <option key={c.id} value={c.id}>{c.code} — {c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Date</Label>
                            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                        </div>
                        <div className="flex items-end gap-2">
                            <Button type="button" size="sm" variant="outline" onClick={() => markAll('PRESENT')}>All Present</Button>
                            <Button type="button" size="sm" variant="outline" onClick={() => markAll('ABSENT')}>All Absent</Button>
                        </div>
                    </div>

                    {loading && <p className="py-4 text-center text-sm text-muted-foreground">Loading students...</p>}

                    {!loading && enrollments.length > 0 && (
                        <div className="overflow-hidden rounded-lg border">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b bg-muted/50">
                                        <th className="w-12 p-3 text-left font-medium text-muted-foreground">#</th>
                                        <th className="p-3 text-left font-medium text-muted-foreground">Student</th>
                                        <th className="p-3 text-left font-medium text-muted-foreground">Status</th>
                                        <th className="p-3 text-left font-medium text-muted-foreground">Remarks</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {enrollments.map((e, i) => (
                                        <tr key={e.id} className="border-b">
                                            <td className="p-3 text-muted-foreground">{i + 1}</td>
                                            <td className="p-3">
                                                <p className="font-medium">{e.student.name}</p>
                                                <p className="text-xs text-muted-foreground">{e.student.student_number}</p>
                                            </td>
                                            <td className="p-3">
                                                <select className="flex h-8 rounded-md border bg-transparent px-2 text-sm" value={records[i]?.status || 'PRESENT'} onChange={(ev) => updateRecord(i, 'status', ev.target.value)}>
                                                    <option value="PRESENT">Present</option>
                                                    <option value="ABSENT">Absent</option>
                                                    <option value="LATE">Late</option>
                                                    <option value="EXCUSED">Excused</option>
                                                </select>
                                            </td>
                                            <td className="p-3">
                                                <Input className="h-8" placeholder="Optional" value={records[i]?.remarks || ''} onChange={(ev) => updateRecord(i, 'remarks', ev.target.value)} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {!loading && enrollments.length > 0 && (
                        <div className="mt-4 flex justify-end">
                            <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Save Attendance'}</Button>
                        </div>
                    )}

                    {!loading && selectedCourse && enrollments.length === 0 && (
                        <p className="py-4 text-center text-sm text-muted-foreground">No enrolled students for this course.</p>
                    )}
                </form>

                {/* Recent Attendance Records */}
                <div className="rounded-xl border p-5">
                    <h2 className="mb-4 font-semibold">Recent Attendance Records</h2>
                    <div className="overflow-hidden rounded-lg border">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/50">
                                    <th className="p-3 text-left font-medium text-muted-foreground">Date</th>
                                    <th className="p-3 text-left font-medium text-muted-foreground">Student</th>
                                    <th className="p-3 text-left font-medium text-muted-foreground">Course</th>
                                    <th className="p-3 text-center font-medium text-muted-foreground">Status</th>
                                    <th className="p-3 text-left font-medium text-muted-foreground">Remarks</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentAttendance.length === 0 && (
                                    <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No attendance records yet.</td></tr>
                                )}
                                {recentAttendance.map((a) => (
                                    <tr key={a.id} className="border-b hover:bg-muted/50">
                                        <td className="p-3 text-muted-foreground">{new Date(a.date).toLocaleDateString()}</td>
                                        <td className="p-3 font-medium">{a.enrollment.student.name}</td>
                                        <td className="p-3">
                                            <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-blue-700/10 ring-inset dark:bg-blue-500/10 dark:text-blue-400">{a.enrollment.course.code}</span>
                                        </td>
                                        <td className="p-3 text-center">{statusBadge(a.status)}</td>
                                        <td className="p-3 text-sm text-muted-foreground">{a.remarks || '—'}</td>
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
