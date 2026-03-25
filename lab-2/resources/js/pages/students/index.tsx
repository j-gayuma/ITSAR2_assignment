import { Head, Link, useForm, router } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import { Eye, GraduationCap, Pencil, Plus, Trash2 } from 'lucide-react';
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
    DialogFooter,
    DialogClose,
} from '@/components/ui/dialog';
import type { BreadcrumbItem } from '@/types';

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
    enrollments_count: number;
    created_at: string;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Students', href: '/students' },
];

function StatusBadge({ status }: { status: string }) {
    const colors: Record<string, string> = {
        ACTIVE: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20',
        INACTIVE: 'bg-gray-50 text-gray-700 ring-gray-600/20 dark:bg-gray-500/10 dark:text-gray-400 dark:ring-gray-500/20',
        GRADUATED: 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/20',
        DROPPED: 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20',
    };
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${colors[status] || colors['ACTIVE']}`}>
            {status}
        </span>
    );
}

export default function StudentsIndex({ students }: { students: Student[] }) {
    const [open, setOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [selected, setSelected] = useState<Student | null>(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        phone: '',
        date_of_birth: '',
        year_level: '1',
        program: '',
    });

    const editForm = useForm({
        name: '',
        email: '',
        phone: '',
        date_of_birth: '',
        year_level: '1',
        program: '',
        status: 'ACTIVE',
    });

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        post('/students', {
            onSuccess: () => {
                reset();
                setOpen(false);
            },
        });
    }

    function openEdit(student: Student) {
        setSelected(student);
        editForm.setData({
            name: student.name,
            email: student.email,
            phone: student.phone || '',
            date_of_birth: student.date_of_birth || '',
            year_level: String(student.year_level),
            program: student.program || '',
            status: student.status,
        });
        setEditOpen(true);
    }

    function handleEdit(e: FormEvent) {
        e.preventDefault();
        if (!selected) return;
        editForm.put(`/students/${selected.id}`, {
            onSuccess: () => setEditOpen(false),
        });
    }

    function openDelete(student: Student) {
        setSelected(student);
        setDeleteOpen(true);
    }

    function handleDelete() {
        if (!selected) return;
        router.delete(`/students/${selected.id}`, {
            onSuccess: () => setDeleteOpen(false),
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Students" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <GraduationCap className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold">Student Management</h1>
                            <p className="text-sm text-muted-foreground">Manage student records and profiles</p>
                        </div>
                    </div>
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                New Student
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                            <DialogHeader>
                                <DialogTitle>Add New Student</DialogTitle>
                                <DialogDescription>Enter student details below.</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2 space-y-2">
                                        <Label htmlFor="name">Full Name</Label>
                                        <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="Juan Dela Cruz" />
                                        {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input id="email" type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} placeholder="juan@email.com" />
                                        {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Phone</Label>
                                        <Input id="phone" value={data.phone} onChange={(e) => setData('phone', e.target.value)} placeholder="09XX-XXX-XXXX" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="dob">Date of Birth</Label>
                                        <Input id="dob" type="date" value={data.date_of_birth} onChange={(e) => setData('date_of_birth', e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Year Level</Label>
                                        <Select value={data.year_level} onValueChange={(v) => setData('year_level', v)}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {[1, 2, 3, 4].map((y) => (
                                                    <SelectItem key={y} value={String(y)}>{y}{y === 1 ? 'st' : y === 2 ? 'nd' : y === 3 ? 'rd' : 'th'} Year</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="col-span-2 space-y-2">
                                        <Label htmlFor="program">Program / Major</Label>
                                        <Input id="program" value={data.program} onChange={(e) => setData('program', e.target.value)} placeholder="BS Computer Science" />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                                    <Button type="submit" disabled={processing}>{processing ? 'Saving...' : 'Save Student'}</Button>
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
                                <th className="p-3 text-left font-medium text-muted-foreground">Student No.</th>
                                <th className="p-3 text-left font-medium text-muted-foreground">Name</th>
                                <th className="p-3 text-left font-medium text-muted-foreground">Program</th>
                                <th className="p-3 text-left font-medium text-muted-foreground">Year</th>
                                <th className="p-3 text-left font-medium text-muted-foreground">Courses</th>
                                <th className="p-3 text-left font-medium text-muted-foreground">Status</th>
                                <th className="w-32 p-3 text-left font-medium text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.length === 0 && (
                                <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">No students found. Click "New Student" to add one.</td></tr>
                            )}
                            {students.map((student, index) => (
                                <tr key={student.id} className="border-b transition-colors hover:bg-muted/50">
                                    <td className="p-3 text-muted-foreground">{index + 1}</td>
                                    <td className="p-3">
                                        <span className="inline-flex items-center rounded-md bg-primary/5 px-2 py-1 text-xs font-medium text-primary ring-1 ring-primary/10 ring-inset">
                                            {student.student_number || '—'}
                                        </span>
                                    </td>
                                    <td className="p-3 font-medium">{student.name}</td>
                                    <td className="p-3 text-muted-foreground">{student.program || '—'}</td>
                                    <td className="p-3 text-muted-foreground">{student.year_level}</td>
                                    <td className="p-3 text-muted-foreground">{student.enrollments_count}</td>
                                    <td className="p-3"><StatusBadge status={student.status} /></td>
                                    <td className="p-3">
                                        <div className="flex items-center gap-1">
                                            <Link href={`/students/${student.id}`}>
                                                <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                                            </Link>
                                            <Button variant="ghost" size="sm" onClick={() => openEdit(student)}><Pencil className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => openDelete(student)}><Trash2 className="h-4 w-4" /></Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Student Dialog */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Edit Student</DialogTitle>
                        <DialogDescription>Update student details.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleEdit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 space-y-2">
                                <Label>Full Name</Label>
                                <Input value={editForm.data.name} onChange={(e) => editForm.setData('name', e.target.value)} />
                                {editForm.errors.name && <p className="text-sm text-destructive">{editForm.errors.name}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input type="email" value={editForm.data.email} onChange={(e) => editForm.setData('email', e.target.value)} />
                                {editForm.errors.email && <p className="text-sm text-destructive">{editForm.errors.email}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label>Phone</Label>
                                <Input value={editForm.data.phone} onChange={(e) => editForm.setData('phone', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Date of Birth</Label>
                                <Input type="date" value={editForm.data.date_of_birth} onChange={(e) => editForm.setData('date_of_birth', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Year Level</Label>
                                <Select value={editForm.data.year_level} onValueChange={(v) => editForm.setData('year_level', v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {[1, 2, 3, 4].map((y) => (
                                            <SelectItem key={y} value={String(y)}>{y}{y === 1 ? 'st' : y === 2 ? 'nd' : y === 3 ? 'rd' : 'th'} Year</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Program</Label>
                                <Input value={editForm.data.program} onChange={(e) => editForm.setData('program', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select value={editForm.data.status} onValueChange={(v) => editForm.setData('status', v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ACTIVE">Active</SelectItem>
                                        <SelectItem value="INACTIVE">Inactive</SelectItem>
                                        <SelectItem value="GRADUATED">Graduated</SelectItem>
                                        <SelectItem value="DROPPED">Dropped</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={editForm.processing}>{editForm.processing ? 'Saving...' : 'Update Student'}</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Student Dialog */}
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Student</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete <strong>{selected?.name}</strong>? This will also remove all their enrollments, grades, and attendance records. This action cannot be undone.
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
