import { Head, Link, useForm, router } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import { BookOpen, Eye, Pencil, Plus, Trash2 } from 'lucide-react';
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

type Prerequisite = { id: number; name: string; code: string };

type Course = {
    id: number;
    name: string;
    code: string;
    description: string | null;
    units: number;
    schedule_day: string | null;
    schedule_time: string | null;
    room: string | null;
    enrollments_count: number;
    prerequisites: Prerequisite[];
    created_at: string;
};

type AllCourse = { id: number; name: string; code: string };

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Course Catalog', href: '/courses' },
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function CoursesIndex({ courses, allCourses }: { courses: Course[]; allCourses: AllCourse[] }) {
    const [createOpen, setCreateOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [selected, setSelected] = useState<Course | null>(null);

    const createForm = useForm({
        name: '',
        code: '',
        description: '',
        units: '3',
        schedule_day: '',
        schedule_time: '',
        room: '',
        prerequisite_ids: [] as string[],
    });

    const editForm = useForm({
        name: '',
        code: '',
        description: '',
        units: '3',
        schedule_day: '',
        schedule_time: '',
        room: '',
        prerequisite_ids: [] as string[],
    });

    function handleCreate(e: FormEvent) {
        e.preventDefault();
        createForm.post('/courses', {
            onSuccess: () => { createForm.reset(); setCreateOpen(false); },
        });
    }

    function openEdit(course: Course) {
        setSelected(course);
        editForm.setData({
            name: course.name,
            code: course.code,
            description: course.description || '',
            units: String(course.units),
            schedule_day: course.schedule_day || '',
            schedule_time: course.schedule_time || '',
            room: course.room || '',
            prerequisite_ids: course.prerequisites.map((p) => String(p.id)),
        });
        setEditOpen(true);
    }

    function handleEdit(e: FormEvent) {
        e.preventDefault();
        if (!selected) return;
        editForm.put(`/courses/${selected.id}`, {
            onSuccess: () => setEditOpen(false),
        });
    }

    function openDelete(course: Course) {
        setSelected(course);
        setDeleteOpen(true);
    }

    function handleDelete() {
        if (!selected) return;
        router.delete(`/courses/${selected.id}`, {
            onSuccess: () => setDeleteOpen(false),
        });
    }

    function CourseFormFields({ form, excludeId }: { form: typeof createForm; excludeId?: number }) {
        return (
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Course Code</Label>
                        <Input value={form.data.code} onChange={(e) => form.setData('code', e.target.value)} placeholder="CS101" />
                        {form.errors.code && <p className="text-sm text-destructive">{form.errors.code}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label>Units</Label>
                        <Input type="number" min="1" max="10" value={form.data.units} onChange={(e) => form.setData('units', e.target.value)} />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label>Course Name</Label>
                    <Input value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} placeholder="Introduction to Computer Science" />
                    {form.errors.name && <p className="text-sm text-destructive">{form.errors.name}</p>}
                </div>
                <div className="space-y-2">
                    <Label>Description</Label>
                    <Input value={form.data.description} onChange={(e) => form.setData('description', e.target.value)} placeholder="Course description..." />
                </div>
                <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label>Schedule Day</Label>
                        <Select value={form.data.schedule_day} onValueChange={(v) => form.setData('schedule_day', v)}>
                            <SelectTrigger><SelectValue placeholder="Select day" /></SelectTrigger>
                            <SelectContent>
                                {DAYS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Schedule Time</Label>
                        <Input value={form.data.schedule_time} onChange={(e) => form.setData('schedule_time', e.target.value)} placeholder="8:00 AM - 9:30 AM" />
                    </div>
                    <div className="space-y-2">
                        <Label>Room</Label>
                        <Input value={form.data.room} onChange={(e) => form.setData('room', e.target.value)} placeholder="Room 101" />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label>Prerequisites</Label>
                    <div className="max-h-32 overflow-y-auto rounded-md border p-2">
                        {allCourses.filter((c) => c.id !== excludeId).map((c) => (
                            <label key={c.id} className="flex items-center gap-2 rounded px-2 py-1 hover:bg-muted/50">
                                <input
                                    type="checkbox"
                                    checked={form.data.prerequisite_ids.includes(String(c.id))}
                                    onChange={(e) => {
                                        const id = String(c.id);
                                        form.setData('prerequisite_ids', e.target.checked
                                            ? [...form.data.prerequisite_ids, id]
                                            : form.data.prerequisite_ids.filter((x) => x !== id));
                                    }}
                                    className="rounded"
                                />
                                <span className="text-sm">{c.code} — {c.name}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Course Catalog" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                            <BookOpen className="h-5 w-5 text-blue-500" />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold">Course Catalog</h1>
                            <p className="text-sm text-muted-foreground">Manage courses with descriptions, units, prerequisites, and schedules</p>
                        </div>
                    </div>
                    <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                        <DialogTrigger asChild>
                            <Button><Plus className="mr-2 h-4 w-4" />Add Course</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                            <DialogHeader>
                                <DialogTitle>Add New Course</DialogTitle>
                                <DialogDescription>Enter course details below.</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleCreate}>
                                <CourseFormFields form={createForm} />
                                <div className="mt-4 flex justify-end gap-2">
                                    <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                                    <Button type="submit" disabled={createForm.processing}>{createForm.processing ? 'Saving...' : 'Save Course'}</Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Table */}
                <div className="overflow-hidden rounded-lg border">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b bg-muted/50">
                                <th className="w-12 p-3 text-left font-medium text-muted-foreground">#</th>
                                <th className="p-3 text-left font-medium text-muted-foreground">Code</th>
                                <th className="p-3 text-left font-medium text-muted-foreground">Name</th>
                                <th className="p-3 text-left font-medium text-muted-foreground">Units</th>
                                <th className="p-3 text-left font-medium text-muted-foreground">Schedule</th>
                                <th className="p-3 text-left font-medium text-muted-foreground">Room</th>
                                <th className="p-3 text-left font-medium text-muted-foreground">Prerequisites</th>
                                <th className="p-3 text-left font-medium text-muted-foreground">Enrolled</th>
                                <th className="w-32 p-3 text-left font-medium text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {courses.length === 0 && (
                                <tr><td colSpan={9} className="p-8 text-center text-muted-foreground">No courses found. Click "Add Course" to create one.</td></tr>
                            )}
                            {courses.map((course, index) => (
                                <tr key={course.id} className="border-b transition-colors hover:bg-muted/50">
                                    <td className="p-3 text-muted-foreground">{index + 1}</td>
                                    <td className="p-3">
                                        <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-700/10 ring-inset dark:bg-blue-500/10 dark:text-blue-400 dark:ring-blue-500/20">
                                            {course.code}
                                        </span>
                                    </td>
                                    <td className="p-3 font-medium">{course.name}</td>
                                    <td className="p-3 text-muted-foreground">{course.units}</td>
                                    <td className="p-3 text-muted-foreground">
                                        {course.schedule_day && course.schedule_time ? `${course.schedule_day} ${course.schedule_time}` : '—'}
                                    </td>
                                    <td className="p-3 text-muted-foreground">{course.room || '—'}</td>
                                    <td className="p-3">
                                        {course.prerequisites.length > 0
                                            ? course.prerequisites.map((p) => (
                                                <span key={p.id} className="mr-1 inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-amber-700/10 ring-inset dark:bg-amber-500/10 dark:text-amber-400">
                                                    {p.code}
                                                </span>
                                            ))
                                            : <span className="text-muted-foreground">None</span>}
                                    </td>
                                    <td className="p-3">
                                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                                            {course.enrollments_count}
                                        </span>
                                    </td>
                                    <td className="p-3">
                                        <div className="flex items-center gap-1">
                                            <Link href={`/courses/${course.id}`}>
                                                <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                                            </Link>
                                            <Button variant="ghost" size="sm" onClick={() => openEdit(course)}><Pencil className="h-4 w-4" /></Button>
                                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => openDelete(course)}><Trash2 className="h-4 w-4" /></Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Dialog */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Edit Course</DialogTitle>
                        <DialogDescription>Update course details.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleEdit}>
                        <CourseFormFields form={editForm} excludeId={selected?.id} />
                        <div className="mt-4 flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={editForm.processing}>{editForm.processing ? 'Saving...' : 'Update Course'}</Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Course</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete <strong>{selected?.code} — {selected?.name}</strong>? This will also remove all related enrollments. This action cannot be undone.
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
