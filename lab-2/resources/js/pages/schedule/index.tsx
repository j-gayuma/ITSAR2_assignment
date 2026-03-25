import { Head, Link } from '@inertiajs/react';
import { CalendarCheck, GraduationCap, Search } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { BreadcrumbItem } from '@/types';
import { useState } from 'react';

type Student = {
    id: number;
    name: string;
    student_number: string | null;
    program: string | null;
    year_level: number | null;
};

export default function ScheduleIndex({ students }: { students: Student[] }) {
    const [search, setSearch] = useState('');
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Class Schedule', href: '/schedule' },
    ];

    const filtered = students.filter(
        (s) =>
            s.name.toLowerCase().includes(search.toLowerCase()) ||
            (s.student_number && s.student_number.toLowerCase().includes(search.toLowerCase())) ||
            (s.program && s.program.toLowerCase().includes(search.toLowerCase())),
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Class Schedule" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <CalendarCheck className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold">Class Schedule</h1>
                            <p className="text-sm text-muted-foreground">Select a student to view their weekly timetable</p>
                        </div>
                    </div>
                </div>

                <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Search students..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {filtered.length === 0 && (
                        <div className="col-span-full py-12 text-center text-muted-foreground">No active students found.</div>
                    )}
                    {filtered.map((s) => (
                        <Link
                            key={s.id}
                            href={`/schedule/${s.id}`}
                            className="flex items-center gap-4 rounded-xl border p-4 transition-colors hover:bg-muted/50"
                        >
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                                {s.name.charAt(0)}
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <p className="truncate font-medium">{s.name}</p>
                                <p className="truncate text-sm text-muted-foreground">
                                    {s.student_number || '—'} {s.program ? `· ${s.program}` : ''} {s.year_level ? `· Year ${s.year_level}` : ''}
                                </p>
                            </div>
                            <GraduationCap className="h-4 w-4 shrink-0 text-muted-foreground" />
                        </Link>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}
