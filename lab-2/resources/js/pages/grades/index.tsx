import { Head, useForm, router } from '@inertiajs/react';
import { Search, TrendingUp } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import type { BreadcrumbItem } from '@/types';
import { useState } from 'react';

type Student = { id: number; name: string; student_number: string | null };
type Course = { id: number; name: string; code: string; units: number };
type Grade = { id: number; grade: string; remarks: string | null; semester: string; academic_year: string; letter_grade: string };
type Enrollment = {
    id: number;
    student: Student;
    course: Course;
    grade: Grade | null;
    status: string;
};

export default function GradesIndex({ enrollments, students }: { enrollments: Enrollment[]; students: Student[] }) {
    const [search, setSearch] = useState('');
    const [gradeOpen, setGradeOpen] = useState(false);
    const [selected, setSelected] = useState<Enrollment | null>(null);
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Grade Management', href: '/grades' },
    ];

    const form = useForm({
        enrollment_id: 0,
        grade: '',
        remarks: '',
        semester: '1st',
        academic_year: '2025-2026',
    });

    const openGrade = (e: Enrollment) => {
        setSelected(e);
        form.setData({
            enrollment_id: e.id,
            grade: e.grade?.grade ?? '',
            remarks: e.grade?.remarks ?? '',
            semester: e.grade?.semester ?? '1st',
            academic_year: e.grade?.academic_year ?? '2025-2026',
        });
        setGradeOpen(true);
    };

    const submit = (ev: React.FormEvent) => {
        ev.preventDefault();
        form.post('/grades', {
            onSuccess: () => setGradeOpen(false),
        });
    };

    const filtered = enrollments.filter((e) => {
        const q = search.toLowerCase();
        return (
            e.student.name.toLowerCase().includes(q) ||
            (e.student.student_number && e.student.student_number.toLowerCase().includes(q)) ||
            e.course.code.toLowerCase().includes(q) ||
            e.course.name.toLowerCase().includes(q)
        );
    });

    const gradeColor = (g: number) => {
        if (g <= 1.5) return 'text-green-600 dark:text-green-400';
        if (g <= 2.5) return 'text-blue-600 dark:text-blue-400';
        if (g <= 3.0) return 'text-yellow-600 dark:text-yellow-400';
        return 'text-red-600 dark:text-red-400';
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Grade Management" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <TrendingUp className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold">Grade Management</h1>
                            <p className="text-sm text-muted-foreground">{enrollments.length} enrollment records</p>
                        </div>
                    </div>
                </div>

                <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Search by student or course..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                </div>

                <div className="overflow-hidden rounded-xl border">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-muted/50">
                                <th className="w-12 p-3 text-left font-medium text-muted-foreground">#</th>
                                <th className="p-3 text-left font-medium text-muted-foreground">Student</th>
                                <th className="p-3 text-left font-medium text-muted-foreground">Course</th>
                                <th className="p-3 text-center font-medium text-muted-foreground">Units</th>
                                <th className="p-3 text-center font-medium text-muted-foreground">Grade</th>
                                <th className="p-3 text-left font-medium text-muted-foreground">Description</th>
                                <th className="p-3 text-left font-medium text-muted-foreground">Semester</th>
                                <th className="p-3 text-center font-medium text-muted-foreground">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 && (
                                <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">No enrollment records found.</td></tr>
                            )}
                            {filtered.map((e, i) => (
                                <tr key={e.id} className="border-b hover:bg-muted/50">
                                    <td className="p-3 text-muted-foreground">{i + 1}</td>
                                    <td className="p-3">
                                        <p className="font-medium">{e.student.name}</p>
                                        <p className="text-xs text-muted-foreground">{e.student.student_number}</p>
                                    </td>
                                    <td className="p-3">
                                        <span className="mr-1 inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-blue-700/10 ring-inset dark:bg-blue-500/10 dark:text-blue-400">{e.course.code}</span>
                                        <span className="text-muted-foreground">{e.course.name}</span>
                                    </td>
                                    <td className="p-3 text-center">{e.course.units}</td>
                                    <td className="p-3 text-center">
                                        {e.grade ? (
                                            <span className={`font-bold ${gradeColor(parseFloat(e.grade.grade))}`}>{parseFloat(e.grade.grade).toFixed(2)}</span>
                                        ) : (
                                            <span className="text-muted-foreground">—</span>
                                        )}
                                    </td>
                                    <td className="p-3 text-muted-foreground">{e.grade?.letter_grade || '—'}</td>
                                    <td className="p-3 text-muted-foreground">{e.grade ? `${e.grade.semester} · ${e.grade.academic_year}` : '—'}</td>
                                    <td className="p-3 text-center">
                                        <Button size="sm" variant="outline" onClick={() => openGrade(e)}>
                                            {e.grade ? 'Edit' : 'Add'}
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Grade Dialog */}
            <Dialog open={gradeOpen} onOpenChange={setGradeOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{selected?.grade ? 'Edit Grade' : 'Add Grade'}</DialogTitle>
                    </DialogHeader>
                    {selected && (
                        <form onSubmit={submit} className="space-y-4">
                            <div className="rounded-lg border p-3 text-sm">
                                <p className="font-medium">{selected.student.name}</p>
                                <p className="text-muted-foreground">{selected.course.code} — {selected.course.name}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="grade">Grade (1.00 - 5.00)</Label>
                                    <Input id="grade" type="number" step="0.25" min="1" max="5" value={form.data.grade} onChange={(e) => form.setData('grade', e.target.value)} required />
                                    {form.errors.grade && <p className="text-xs text-red-500">{form.errors.grade}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="semester">Semester</Label>
                                    <select id="semester" className="flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm" value={form.data.semester} onChange={(e) => form.setData('semester', e.target.value)}>
                                        <option value="1st">1st Semester</option>
                                        <option value="2nd">2nd Semester</option>
                                        <option value="Summer">Summer</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="academic_year">Academic Year</Label>
                                <Input id="academic_year" value={form.data.academic_year} onChange={(e) => form.setData('academic_year', e.target.value)} required />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="remarks">Remarks</Label>
                                <Input id="remarks" value={form.data.remarks} onChange={(e) => form.setData('remarks', e.target.value)} placeholder="Optional" />
                            </div>
                            <DialogFooter>
                                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                                <Button type="submit" disabled={form.processing}>Save Grade</Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
