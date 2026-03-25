import { Head, Link, useForm, router } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import { ClipboardList, Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
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
    DialogFooter,
    DialogClose,
} from '@/components/ui/dialog';
import type { BreadcrumbItem } from '@/types';

type Student = { id: number; name: string; email: string };
type Course = { id: number; name: string; code: string };
type Enrollment = {
    id: number;
    student_id: number;
    course_id: number;
    status: string;
    created_at: string;
    student: Student;
    course: Course;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Enrollments', href: '/enrollments' },
];

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
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${colors[status] || colors['ENROLLED']}`}
        >
            {status}
        </span>
    );
}

export default function EnrollmentsIndex({
    enrollments,
    students,
    courses,
}: {
    enrollments: Enrollment[];
    students: Student[];
    courses: Course[];
}) {
    const [open, setOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [selected, setSelected] = useState<Enrollment | null>(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        student_id: '',
        course_id: '',
    });

    const editForm = useForm({ status: 'ENROLLED' });

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        post('/enrollments', {
            onSuccess: () => {
                reset();
                setOpen(false);
            },
        });
    }

    function openEdit(enrollment: Enrollment) {
        setSelected(enrollment);
        editForm.setData('status', enrollment.status);
        setEditOpen(true);
    }

    function handleEdit(e: FormEvent) {
        e.preventDefault();
        if (!selected) return;
        editForm.put(`/enrollments/${selected.id}`, {
            onSuccess: () => setEditOpen(false),
        });
    }

    function openDelete(enrollment: Enrollment) {
        setSelected(enrollment);
        setDeleteOpen(true);
    }

    function handleDelete() {
        if (!selected) return;
        router.delete(`/enrollments/${selected.id}`, {
            onSuccess: () => setDeleteOpen(false),
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Enrollments" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
                            <ClipboardList className="h-5 w-5 text-violet-500" />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold">Enrollment Management</h1>
                            <p className="text-sm text-muted-foreground">Manage student course enrollments</p>
                        </div>
                    </div>
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                New Enrollment
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Enroll Student</DialogTitle>
                                <DialogDescription>Select a student and a course to create an enrollment.</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Student</Label>
                                    <Select value={data.student_id} onValueChange={(v) => setData('student_id', v)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a student" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {students.map((s) => (
                                                <SelectItem key={s.id} value={String(s.id)}>
                                                    {s.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.student_id && <p className="text-sm text-destructive">{errors.student_id}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label>Course</Label>
                                    <Select value={data.course_id} onValueChange={(v) => setData('course_id', v)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a course" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {courses.map((c) => (
                                                <SelectItem key={c.id} value={String(c.id)}>
                                                    {c.code} — {c.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.course_id && <p className="text-sm text-destructive">{errors.course_id}</p>}
                                </div>
                                <div className="flex justify-end gap-2">
                                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={processing}>
                                        {processing ? 'Enrolling...' : 'Enroll Student'}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Grid View Tabs */}
                <div className="flex items-center gap-1 border-b">
                    <button className="flex items-center gap-2 border-b-2 border-primary px-4 py-2 text-sm font-medium text-primary">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 6h18M3 14h18M3 18h18" /></svg>
                        Grid View
                    </button>
                </div>

                {/* Table */}
                <div className="overflow-hidden rounded-lg border">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-muted/50">
                                <th className="w-12 p-3 text-left font-medium text-muted-foreground">#</th>
                                <th className="p-3 text-left font-medium text-muted-foreground">Student</th>
                                <th className="p-3 text-left font-medium text-muted-foreground">Course</th>
                                <th className="p-3 text-left font-medium text-muted-foreground">Date Enrolled</th>
                                <th className="p-3 text-left font-medium text-muted-foreground">Status</th>
                                <th className="w-32 p-3 text-left font-medium text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {enrollments.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                                        No enrollments found. Click "New Enrollment" to add one.
                                    </td>
                                </tr>
                            )}
                            {enrollments.map((enrollment, index) => (
                                <tr key={enrollment.id} className="border-b transition-colors hover:bg-muted/50">
                                    <td className="p-3 text-muted-foreground">{index + 1}</td>
                                    <td className="p-3 font-medium">{enrollment.student.name}</td>
                                    <td className="p-3">
                                        <span className="text-muted-foreground">{enrollment.course.code}</span>
                                        <span className="mx-1">—</span>
                                        {enrollment.course.name}
                                    </td>
                                    <td className="p-3 text-muted-foreground">
                                        {new Date(enrollment.created_at).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                        })}
                                    </td>
                                    <td className="p-3">
                                        <StatusBadge status={enrollment.status} />
                                    </td>
                                    <td className="p-3">
                                        <div className="flex items-center gap-1">
                                            <Link href={`/enrollments/${enrollment.id}`}>
                                                <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                                            </Link>
                                            <Button variant="ghost" size="sm" onClick={() => openEdit(enrollment)}><Pencil className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => openDelete(enrollment)}><Trash2 className="h-4 w-4" /></Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Enrollment Status Dialog */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Update Enrollment Status</DialogTitle>
                        <DialogDescription>
                            {selected && `${selected.student.name} — ${selected.course.code} ${selected.course.name}`}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleEdit} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select value={editForm.data.status} onValueChange={(v) => editForm.setData('status', v)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ENROLLED">Enrolled</SelectItem>
                                    <SelectItem value="DROPPED">Dropped</SelectItem>
                                    <SelectItem value="COMPLETED">Completed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={editForm.processing}>{editForm.processing ? 'Saving...' : 'Update Status'}</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Enrollment Dialog */}
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Enrollment</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this enrollment{selected ? ` for ${selected.student.name} in ${selected.course.code}` : ''}? Associated grades and attendance records will also be deleted. This cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                        <Button variant="destructive" onClick={handleDelete}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
