import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import {
    ArrowLeft,
    BookOpen,
    CalendarCheck,
    Clock,
    FileText,
    GraduationCap,
    Mail,
    MapPin,
    Pencil,
    Phone,
    TrendingUp,
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import type { BreadcrumbItem } from '@/types';

type Grade = {
    grade: string | null;
    remarks: string | null;
    semester: string;
    academic_year: string;
    letter_grade: string;
};

type Enrollment = {
    id: number;
    status: string;
    course: {
        id: number;
        name: string;
        code: string;
        units: number;
        schedule_day: string | null;
        schedule_time: string | null;
        room: string | null;
    };
    grade: Grade | null;
    attendances: { status: string }[];
};

type Student = {
    id: number;
    student_number: string | null;
    name: string;
    email: string;
    phone: string | null;
    address: string | null;
    date_of_birth: string | null;
    year_level: number;
    program: string | null;
    status: string;
    created_at: string;
    enrollments: Enrollment[];
};

type AttendanceSummary = {
    total: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
    rate: number;
};

function StatusBadge({ status, type = 'student' }: { status: string; type?: string }) {
    const studentColors: Record<string, string> = {
        ACTIVE: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400',
        INACTIVE: 'bg-gray-50 text-gray-700 ring-gray-600/20 dark:bg-gray-500/10 dark:text-gray-400',
        GRADUATED: 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400',
        DROPPED: 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400',
    };
    const enrollColors: Record<string, string> = {
        ENROLLED: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400',
        DROPPED: 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400',
        COMPLETED: 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400',
    };
    const colors = type === 'student' ? studentColors : enrollColors;
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${colors[status] || ''}`}>
            {status}
        </span>
    );
}

function gradeColor(g: number) {
    if (g <= 1.5) return 'text-green-600 dark:text-green-400';
    if (g <= 2.5) return 'text-blue-600 dark:text-blue-400';
    if (g <= 3.0) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const dayColors: Record<string, string> = {
    Monday: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
    Tuesday: 'bg-green-500/10 text-green-700 dark:text-green-400',
    Wednesday: 'bg-purple-500/10 text-purple-700 dark:text-purple-400',
    Thursday: 'bg-orange-500/10 text-orange-700 dark:text-orange-400',
    Friday: 'bg-pink-500/10 text-pink-700 dark:text-pink-400',
    Saturday: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
};

export default function StudentShow({ student, gpa, attendanceSummary }: { student: Student; gpa: number | null; attendanceSummary: AttendanceSummary }) {
    const [editOpen, setEditOpen] = useState(false);
    const form = useForm({
        name: student.name,
        email: student.email,
        phone: student.phone || '',
        address: student.address || '',
        date_of_birth: student.date_of_birth ? student.date_of_birth.split('T')[0] : '',
        year_level: String(student.year_level),
        program: student.program || '',
        status: student.status,
    });

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Students', href: '/students' },
        { title: student.name, href: `/students/${student.id}` },
    ];

    function handleUpdate(e: FormEvent) {
        e.preventDefault();
        form.put(`/students/${student.id}`, {
            onSuccess: () => setEditOpen(false),
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={student.name} />
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                {/* Back + Actions */}
                <div className="flex items-center justify-between">
                    <Link href="/students">
                        <Button variant="ghost" size="sm"><ArrowLeft className="mr-2 h-4 w-4" />Back to Students</Button>
                    </Link>
                    <div className="flex gap-2">
                        <Link href={`/students/${student.id}/transcript`}>
                            <Button variant="outline" size="sm"><FileText className="mr-2 h-4 w-4" />Transcript</Button>
                        </Link>
                        <Dialog open={editOpen} onOpenChange={setEditOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm"><Pencil className="mr-2 h-4 w-4" />Edit Profile</Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-lg">
                                <DialogHeader>
                                    <DialogTitle>Edit Student Profile</DialogTitle>
                                    <DialogDescription>Update student information.</DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleUpdate} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2 space-y-2">
                                            <Label>Full Name</Label>
                                            <Input value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} />
                                            {form.errors.name && <p className="text-sm text-destructive">{form.errors.name}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Email</Label>
                                            <Input type="email" value={form.data.email} onChange={(e) => form.setData('email', e.target.value)} />
                                            {form.errors.email && <p className="text-sm text-destructive">{form.errors.email}</p>}
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Phone</Label>
                                            <Input value={form.data.phone} onChange={(e) => form.setData('phone', e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Date of Birth</Label>
                                            <Input type="date" value={form.data.date_of_birth} onChange={(e) => form.setData('date_of_birth', e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Year Level</Label>
                                            <Select value={form.data.year_level} onValueChange={(v) => form.setData('year_level', v)}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    {[1, 2, 3, 4].map((y) => (
                                                        <SelectItem key={y} value={String(y)}>{y}{y === 1 ? 'st' : y === 2 ? 'nd' : y === 3 ? 'rd' : 'th'} Year</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="col-span-2 space-y-2">
                                            <Label>Program</Label>
                                            <Input value={form.data.program} onChange={(e) => form.setData('program', e.target.value)} />
                                        </div>
                                        <div className="col-span-2 space-y-2">
                                            <Label>Address</Label>
                                            <Input value={form.data.address} onChange={(e) => form.setData('address', e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Status</Label>
                                            <Select value={form.data.status} onValueChange={(v) => form.setData('status', v)}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    {['ACTIVE', 'INACTIVE', 'GRADUATED', 'DROPPED'].map((s) => (
                                                        <SelectItem key={s} value={s}>{s}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
                                        <Button type="submit" disabled={form.processing}>{form.processing ? 'Saving...' : 'Save Changes'}</Button>
                                    </div>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {/* Profile Header */}
                <div className="flex items-start gap-6 rounded-xl border p-6">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
                        {student.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-semibold">{student.name}</h1>
                            <StatusBadge status={student.status} />
                        </div>
                        <p className="text-sm text-muted-foreground">{student.student_number || 'No student number'}</p>
                        <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1"><Mail className="h-4 w-4" />{student.email}</span>
                            {student.phone && <span className="flex items-center gap-1"><Phone className="h-4 w-4" />{student.phone}</span>}
                            {student.address && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{student.address}</span>}
                            {student.date_of_birth && <span className="flex items-center gap-1"><CalendarCheck className="h-4 w-4" />{new Date(student.date_of_birth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
                            <span>Year Level: <strong className="text-foreground">{student.year_level}</strong></span>
                            <span>Program: <strong className="text-foreground">{student.program || 'N/A'}</strong></span>
                            <span>Member since: <strong className="text-foreground">{new Date(student.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong></span>
                        </div>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-xl border p-4">
                        <p className="text-sm text-muted-foreground">Program</p>
                        <p className="text-lg font-semibold">{student.program || 'N/A'}</p>
                        <p className="text-xs text-muted-foreground">Year {student.year_level}</p>
                    </div>
                    <div className="rounded-xl border p-4">
                        <p className="text-sm text-muted-foreground">Enrolled Courses</p>
                        <p className="text-lg font-semibold">{student.enrollments.length}</p>
                        <p className="text-xs text-muted-foreground">{student.enrollments.reduce((sum, e) => sum + (e.course.units || 0), 0)} total units</p>
                    </div>
                    <div className="rounded-xl border p-4">
                        <p className="text-sm text-muted-foreground">GPA</p>
                        <p className="text-lg font-semibold">{gpa !== null ? gpa.toFixed(2) : 'N/A'}</p>
                        <p className="text-xs text-muted-foreground">Cumulative</p>
                    </div>
                    <div className="rounded-xl border p-4">
                        <p className="text-sm text-muted-foreground">Attendance Rate</p>
                        <p className="text-lg font-semibold">{attendanceSummary.rate}%</p>
                        <p className="text-xs text-muted-foreground">{attendanceSummary.present}P · {attendanceSummary.absent}A · {attendanceSummary.late}L</p>
                    </div>
                </div>

                {/* ====== ENROLLED COURSES ====== */}
                <div className="rounded-xl border p-5">
                    <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                            <BookOpen className="h-4 w-4 text-blue-500" />
                        </div>
                        <h2 className="font-semibold">Enrolled Courses ({student.enrollments.length})</h2>
                        <span className="ml-auto text-sm text-muted-foreground">{student.enrollments.reduce((s, e) => s + (e.course.units || 0), 0)} total units</span>
                    </div>
                    <div className="overflow-hidden rounded-lg border">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/50">
                                    <th className="w-12 p-3 text-left font-medium text-muted-foreground">#</th>
                                    <th className="p-3 text-left font-medium text-muted-foreground">Code</th>
                                    <th className="p-3 text-left font-medium text-muted-foreground">Course Name</th>
                                    <th className="p-3 text-center font-medium text-muted-foreground">Units</th>
                                    <th className="p-3 text-center font-medium text-muted-foreground">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {student.enrollments.length === 0 && (
                                    <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Not enrolled in any courses yet.</td></tr>
                                )}
                                {student.enrollments.map((e, i) => (
                                    <tr key={e.id} className="border-b hover:bg-muted/50">
                                        <td className="p-3 text-muted-foreground">{i + 1}</td>
                                        <td className="p-3">
                                            <Link href={`/courses/${e.course.id}`}>
                                                <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-700/10 ring-inset hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/20">
                                                    {e.course.code}
                                                </span>
                                            </Link>
                                        </td>
                                        <td className="p-3 font-medium">{e.course.name}</td>
                                        <td className="p-3 text-center text-muted-foreground">{e.course.units}</td>
                                        <td className="p-3 text-center"><StatusBadge status={e.status} type="enrollment" /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ====== CLASS SCHEDULE ====== */}
                <div className="rounded-xl border p-5">
                    <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10">
                            <Clock className="h-4 w-4 text-purple-500" />
                        </div>
                        <h2 className="font-semibold">Class Schedule</h2>
                    </div>
                    {(() => {
                        const scheduled = student.enrollments.filter((e) => e.status === 'ENROLLED' && e.course.schedule_day);
                        const grouped: Record<string, Enrollment[]> = {};
                        for (const e of scheduled) {
                            const day = e.course.schedule_day || 'TBA';
                            if (!grouped[day]) grouped[day] = [];
                            grouped[day].push(e);
                        }
                        const unscheduled = student.enrollments.filter((e) => e.status === 'ENROLLED' && !e.course.schedule_day);

                        if (scheduled.length === 0 && unscheduled.length === 0) {
                            return <p className="py-4 text-center text-sm text-muted-foreground">No active schedule. Enroll in courses to see the timetable.</p>;
                        }

                        return (
                            <div className="space-y-3">
                                {DAYS.filter((d) => grouped[d]).map((day) => (
                                    <div key={day} className="overflow-hidden rounded-lg border">
                                        <div className={`px-4 py-2 text-sm font-semibold ${dayColors[day] || 'bg-muted'}`}>{day}</div>
                                        <div className="divide-y">
                                            {grouped[day].map((e) => (
                                                <div key={e.id} className="flex items-center gap-4 px-4 py-2.5">
                                                    <div className="flex-1">
                                                        <span className="mr-2 inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-blue-700/10 ring-inset dark:bg-blue-500/10 dark:text-blue-400">{e.course.code}</span>
                                                        <span className="text-sm font-medium">{e.course.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                        {e.course.schedule_time && <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{e.course.schedule_time}</span>}
                                                        {e.course.room && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{e.course.room}</span>}
                                                        <span className="w-14 text-right text-xs">{e.course.units} units</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                {unscheduled.length > 0 && (
                                    <div className="overflow-hidden rounded-lg border">
                                        <div className="bg-muted px-4 py-2 text-sm font-semibold">To Be Announced</div>
                                        <div className="divide-y">
                                            {unscheduled.map((e) => (
                                                <div key={e.id} className="flex items-center gap-4 px-4 py-2.5">
                                                    <span className="mr-2 inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-blue-700/10 ring-inset dark:bg-blue-500/10 dark:text-blue-400">{e.course.code}</span>
                                                    <span className="text-sm font-medium">{e.course.name}</span>
                                                    <span className="ml-auto text-sm text-muted-foreground">{e.course.units} units</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })()}
                </div>

                {/* ====== GRADES ====== */}
                <div className="rounded-xl border p-5">
                    <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                            <TrendingUp className="h-4 w-4 text-emerald-500" />
                        </div>
                        <h2 className="font-semibold">Grades</h2>
                        <span className="ml-auto text-sm font-medium">
                            GPA: <span className={gpa !== null ? gradeColor(gpa) : ''}>{gpa !== null ? gpa.toFixed(2) : 'N/A'}</span>
                        </span>
                    </div>
                    <div className="overflow-hidden rounded-lg border">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/50">
                                    <th className="p-3 text-left font-medium text-muted-foreground">Code</th>
                                    <th className="p-3 text-left font-medium text-muted-foreground">Course</th>
                                    <th className="p-3 text-center font-medium text-muted-foreground">Units</th>
                                    <th className="p-3 text-center font-medium text-muted-foreground">Grade</th>
                                    <th className="p-3 text-left font-medium text-muted-foreground">Description</th>
                                    <th className="p-3 text-left font-medium text-muted-foreground">Semester</th>
                                    <th className="p-3 text-left font-medium text-muted-foreground">Remarks</th>
                                </tr>
                            </thead>
                            <tbody>
                                {student.enrollments.length === 0 && (
                                    <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">No grade records available.</td></tr>
                                )}
                                {student.enrollments.map((e) => {
                                    const g = e.grade;
                                    const numGrade = g?.grade !== null && g?.grade !== undefined ? parseFloat(String(g.grade)) : null;
                                    return (
                                        <tr key={e.id} className="border-b hover:bg-muted/50">
                                            <td className="p-3">
                                                <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-blue-700/10 ring-inset dark:bg-blue-500/10 dark:text-blue-400">{e.course.code}</span>
                                            </td>
                                            <td className="p-3 font-medium">{e.course.name}</td>
                                            <td className="p-3 text-center text-muted-foreground">{e.course.units}</td>
                                            <td className="p-3 text-center">
                                                {numGrade !== null ? (
                                                    <span className={`text-lg font-bold ${gradeColor(numGrade)}`}>{numGrade.toFixed(2)}</span>
                                                ) : (
                                                    <span className="text-muted-foreground">—</span>
                                                )}
                                            </td>
                                            <td className="p-3 text-muted-foreground">{g?.letter_grade || '—'}</td>
                                            <td className="p-3 text-muted-foreground">{g ? `${g.semester} · ${g.academic_year}` : '—'}</td>
                                            <td className="p-3 text-muted-foreground">{g?.remarks || '—'}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ====== ATTENDANCE SUMMARY ====== */}
                <div className="rounded-xl border p-5">
                    <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
                            <CalendarCheck className="h-4 w-4 text-amber-500" />
                        </div>
                        <h2 className="font-semibold">Attendance Summary</h2>
                        <span className="ml-auto text-sm font-medium">{attendanceSummary.rate}% attendance rate</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
                        {([
                            ['Present', attendanceSummary.present, 'text-emerald-600 dark:text-emerald-400', 'bg-emerald-50 dark:bg-emerald-500/10'],
                            ['Absent', attendanceSummary.absent, 'text-red-600 dark:text-red-400', 'bg-red-50 dark:bg-red-500/10'],
                            ['Late', attendanceSummary.late, 'text-amber-600 dark:text-amber-400', 'bg-amber-50 dark:bg-amber-500/10'],
                            ['Excused', attendanceSummary.excused, 'text-blue-600 dark:text-blue-400', 'bg-blue-50 dark:bg-blue-500/10'],
                            ['Total', attendanceSummary.total, 'text-foreground', 'bg-muted'],
                        ] as const).map(([label, value, textColor, bgColor]) => (
                            <div key={label} className={`rounded-lg p-3 text-center ${bgColor}`}>
                                <p className={`text-2xl font-bold ${textColor}`}>{value}</p>
                                <p className="text-xs text-muted-foreground">{label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
