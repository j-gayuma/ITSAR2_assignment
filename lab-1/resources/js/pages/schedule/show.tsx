import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, CalendarCheck, Clock, MapPin } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import type { BreadcrumbItem } from '@/types';

type ScheduleItem = {
    id: number;
    course_code: string;
    course_name: string;
    day: string | null;
    time: string | null;
    room: string | null;
    units: number;
};

type Student = { id: number; name: string; student_number: string | null; program: string | null };

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const dayColors: Record<string, string> = {
    Monday: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
    Tuesday: 'bg-green-500/10 text-green-700 dark:text-green-400',
    Wednesday: 'bg-purple-500/10 text-purple-700 dark:text-purple-400',
    Thursday: 'bg-orange-500/10 text-orange-700 dark:text-orange-400',
    Friday: 'bg-pink-500/10 text-pink-700 dark:text-pink-400',
    Saturday: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
};

export default function ScheduleShow({ student, schedule }: { student: Student; schedule: ScheduleItem[] }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Class Schedule', href: '/schedule' },
        { title: student.name, href: `/schedule/${student.id}` },
    ];

    const grouped: Record<string, ScheduleItem[]> = {};
    for (const item of schedule) {
        const day = item.day || 'TBA';
        if (!grouped[day]) grouped[day] = [];
        grouped[day].push(item);
    }

    const totalUnits = schedule.reduce((sum, s) => sum + s.units, 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Schedule - ${student.name}`} />
            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                <Link href="/schedule">
                    <Button variant="ghost" size="sm"><ArrowLeft className="mr-2 h-4 w-4" />Back to Student List</Button>
                </Link>

                {/* Student Header */}
                <div className="flex items-center gap-4 rounded-xl border p-5">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
                        {student.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                        <h1 className="text-xl font-semibold">{student.name}</h1>
                        <p className="text-sm text-muted-foreground">{student.student_number} {student.program ? `· ${student.program}` : ''}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-bold">{schedule.length}</p>
                        <p className="text-xs text-muted-foreground">courses · {totalUnits} units</p>
                    </div>
                </div>

                {/* Weekly Timetable */}
                {schedule.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border p-12 text-center text-muted-foreground">
                        <CalendarCheck className="mb-3 h-10 w-10" />
                        <p className="font-medium">No schedule yet</p>
                        <p className="text-sm">This student is not enrolled in any courses.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {DAYS.filter((d) => grouped[d]).map((day) => (
                            <div key={day} className="rounded-xl border">
                                <div className={`rounded-t-xl px-5 py-3 font-semibold ${dayColors[day] || 'bg-muted'}`}>{day}</div>
                                <div className="divide-y">
                                    {grouped[day].map((item) => (
                                        <div key={item.id} className="flex items-center gap-4 px-5 py-3">
                                            <div className="flex-1">
                                                <span className="mr-2 inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-blue-700/10 ring-inset dark:bg-blue-500/10 dark:text-blue-400">{item.course_code}</span>
                                                <span className="text-sm font-medium">{item.course_name}</span>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                {item.time && <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{item.time}</span>}
                                                {item.room && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{item.room}</span>}
                                                <span className="w-16 text-right text-xs">{item.units} units</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                        {/* TBA section if any */}
                        {grouped['TBA'] && (
                            <div className="rounded-xl border">
                                <div className="rounded-t-xl bg-muted px-5 py-3 font-semibold">To Be Announced</div>
                                <div className="divide-y">
                                    {grouped['TBA'].map((item) => (
                                        <div key={item.id} className="flex items-center gap-4 px-5 py-3">
                                            <div className="flex-1">
                                                <span className="mr-2 inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-blue-700/10 ring-inset dark:bg-blue-500/10 dark:text-blue-400">{item.course_code}</span>
                                                <span className="text-sm font-medium">{item.course_name}</span>
                                            </div>
                                            <span className="text-sm text-muted-foreground">{item.units} units</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
