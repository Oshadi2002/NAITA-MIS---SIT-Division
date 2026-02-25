import { useState, useEffect, useMemo } from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus, Copy, ExternalLink, CheckCircle2, XCircle, Search, Folder, ChevronRight, GraduationCap, MapPin, BookOpen, Calendar, Home, School, Trash2, Eye, FileText, Download } from "lucide-react";
import { useLocation } from "wouter";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { NovationRequestDialog } from "@/components/requests/NovationRequestDialog";

interface FormLink {
    id: string;
    university: string;
    subject: string;
    batch_year: string;
    district: string;
    created_at: string;
}

interface StudentSubmission {
    id: number;
    full_name: string;
    student_reg_no: string;
    nic: string;
    university: string;
    subject: string;
    batch_year: string;
    district: string;
    checked_ok: boolean;
    admin_reg_number: string | null;
    submitted_at: string;
    nic_copy: string | null;
    agreement_form: string | null;
    work_site_form: string | null;
    placement_letter: string | null;
}

// Navigation Levels
type NavLevel = 'years' | 'universities' | 'districts' | 'subjects' | 'list';

export default function StudentDataDashboard() {
    const { currentUser } = useStore();
    const [activeTab, setActiveTab] = useState<'students' | 'links'>('students');
    const [, setLocation] = useLocation();
    const { toast } = useToast();

    // Data
    const [links, setLinks] = useState<FormLink[]>([]);
    const [students, setStudents] = useState<StudentSubmission[]>([]);
    const [loading, setLoading] = useState(false);

    // Navigation State
    const [navPath, setNavPath] = useState<{
        year?: string;
        university?: string;
        district?: string;
        subject?: string;
    }>({});

    // Derived Search State for the final list
    const [search, setSearch] = useState("");

    useEffect(() => {
        if (currentUser?.role) fetchData();
    }, [activeTab, currentUser]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'links' && (currentUser?.role === 'ADMIN' || currentUser?.role === 'UNIVERSITY_COORDINATOR')) {
                const res = await axios.get('/api/student-links/');
                setLinks(res.data);
            } else {
                const res = await axios.get('/api/student-submissions/');
                setStudents(res.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const copyLink = (id: string) => {
        const url = `${window.location.origin}/collect-data/${id}`;
        navigator.clipboard.writeText(url);
        toast({ title: "Link Copied", description: "URL copied to clipboard." });
    };

    const toggleChecked = async (student: StudentSubmission) => {
        if (currentUser?.role !== 'ADMIN') return;

        try {
            const newVal = !student.checked_ok;
            await axios.patch(`/api/student-submissions/${student.id}/`, { checked_ok: newVal });
            setStudents(prev => prev.map(s => s.id === student.id ? { ...s, checked_ok: newVal } : s));
            toast({ title: newVal ? "Marked as Checked" : "Marked as Pending", variant: "default" });
        } catch (error) {
            toast({ title: "Update Failed", variant: "destructive" });
        }
    };

    const updateRegNo = async (student: StudentSubmission, val: string) => {
        if (currentUser?.role !== 'ADMIN') return;
        try {
            await axios.patch(`/api/student-submissions/${student.id}/`, { admin_reg_number: val });
            toast({ title: "Reg No Updated" });
        } catch (error) {
            toast({ title: "Update Failed", variant: "destructive" });
        }
    }

    // --- Drill Down Logic ---

    // 1. Filter students based on current path
    const filteredStudents = useMemo(() => {
        return students.filter(s => {
            if (navPath.year && s.batch_year !== navPath.year) return false;
            if (navPath.university && s.university !== navPath.university) return false;
            if (navPath.district && s.district !== navPath.district) return false;
            if (navPath.subject && s.subject !== navPath.subject) return false;
            return true;
        });
    }, [students, navPath]);

    // 2. Determine Current View Level
    const currentLevel: NavLevel = useMemo(() => {
        if (!navPath.year) return 'years';
        if (!navPath.university) return 'universities';
        if (!navPath.district) return 'districts';
        if (!navPath.subject) return 'subjects';
        return 'list';
    }, [navPath]);

    // 3. Get Items for the Card Grid
    const gridItems = useMemo(() => {
        const items = new Map<string, number>(); // Name -> Count
        if (currentLevel === 'list') return [];

        filteredStudents.forEach(s => {
            let key = "";
            if (currentLevel === 'years') key = s.batch_year;
            else if (currentLevel === 'universities') key = s.university;
            else if (currentLevel === 'districts') key = s.district;
            else if (currentLevel === 'subjects') key = s.subject;

            if (key) items.set(key, (items.get(key) || 0) + 1);
        });

        return Array.from(items.entries()).map(([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name));
    }, [filteredStudents, currentLevel]);

    // Handlers
    const handleDrill = (itemName: string) => {
        if (currentLevel === 'years') setNavPath({ ...navPath, year: itemName });
        else if (currentLevel === 'universities') setNavPath({ ...navPath, university: itemName });
        else if (currentLevel === 'districts') setNavPath({ ...navPath, district: itemName });
        else if (currentLevel === 'subjects') setNavPath({ ...navPath, subject: itemName });
    };

    const handleBreadcrumbClick = (level: NavLevel) => {
        if (level === 'years') setNavPath({});
        if (level === 'universities') setNavPath({ year: navPath.year });
        if (level === 'districts') setNavPath({ year: navPath.year, university: navPath.university });
        if (level === 'subjects') setNavPath({ year: navPath.year, university: navPath.university, district: navPath.district });
    };

    const LinkManagementView = () => (
        <div className="space-y-4">
            <div className="flex justify-end">
                {currentUser?.role === 'ADMIN' && <CreateLinkDialog onCreated={fetchData} />}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {links.map((link: {
                    is_active: boolean;
                    google_form_url?: string;
                    university: string;
                    subject: string;
                    batch_year: string;
                    district: string;
                    id: string;
                }) => (
                    <Card key={link.id} className={`hover:shadow-md transition-shadow ${link.google_form_url ? 'border-l-4 border-l-blue-500' : ''}`}>
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-base font-bold">{link.university}</CardTitle>
                                    {link.google_form_url && <Badge variant="secondary" className="mt-1 text-xs">Google Form</Badge>}
                                </div>
                                <Badge variant="outline">{link.batch_year}</Badge>
                            </div>
                            <CardDescription>{link.subject}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm text-muted-foreground mb-4">District: <span className="font-medium text-foreground">{link.district}</span></div>
                            <div className="flex gap-2 mt-2">
                                <Button size="sm" variant="outline" className="w-full" onClick={() => {
                                    const url = link.google_form_url || `${window.location.origin}/collect-data/${link.id}`;
                                    navigator.clipboard.writeText(url);
                                    toast({ title: "Link Copied", description: "URL copied to clipboard." });
                                }}>
                                    <Copy className="h-3 w-3 mr-2" /> Copy URL
                                </Button>
                                <Button size="sm" variant="ghost" className="px-2" onClick={() => window.open(link.google_form_url || `/collect-data/${link.id}`, '_blank')}>
                                    <ExternalLink className="h-3 w-3" />
                                </Button>
                            </div>
                            {!link.google_form_url && (
                                <p className="text-xs text-muted-foreground mt-2 text-center select-all font-mono">
                                    {link.id}
                                </p>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );

    const StudentListView = ({ openEdit, openNovation }: { openEdit: (s: StudentSubmission) => void, openNovation: (s: StudentSubmission) => void }) => {
        // Final Search Filter inside the list view
        const displayStudents = filteredStudents.filter(s =>
            s.full_name.toLowerCase().includes(search.toLowerCase()) ||
            s.nic.toLowerCase().includes(search.toLowerCase()) ||
            s.student_reg_no.toLowerCase().includes(search.toLowerCase())
        );

        return (
            <Card className="min-h-[600px]">
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
                        <div>
                            <CardTitle>Student Details</CardTitle>
                            <CardDescription>
                                {navPath.year} / {navPath.university} / {navPath.district} / {navPath.subject}
                            </CardDescription>
                        </div>
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search Name, NIC..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Student</TableHead>
                                <TableHead>Details</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Checked</TableHead>
                                <TableHead>Reg No</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {displayStudents.map(student => (
                                <TableRow key={student.id}>
                                    <TableCell>
                                        <div className="font-medium">{student.full_name}</div>
                                        <div className="text-xs text-muted-foreground">{student.nic} | {student.student_reg_no}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm">{student.university}</div>
                                        <div className="text-xs text-muted-foreground">{student.subject} ({student.batch_year})</div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={student.checked_ok ? "default" : "secondary"}>
                                            {student.checked_ok ? "Verified" : "Pending"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => toggleChecked(student)}
                                            disabled={currentUser?.role !== 'ADMIN'}
                                            className={student.checked_ok ? "text-green-600" : "text-muted-foreground"}
                                        >
                                            {student.checked_ok ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                                        </Button>
                                    </TableCell>
                                    <TableCell>
                                        {currentUser?.role === 'ADMIN' ? (
                                            <Input
                                                className="h-8 w-32 font-mono text-center"
                                                defaultValue={student.admin_reg_number || ''}
                                                onBlur={(e) => updateRegNo(student, e.target.value)}
                                                placeholder="-"
                                            />
                                        ) : (
                                            <span className="text-sm font-mono">{student.admin_reg_number || '-'}</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right flex justify-end gap-2">
                                        {currentUser?.role === 'UNIVERSITY_COORDINATOR' && (
                                            <Button variant="outline" size="sm" onClick={() => openNovation(student)}>
                                                Req. Novation
                                            </Button>
                                        )}
                                        <Button variant="ghost" size="sm" onClick={() => openEdit(student)}>
                                            {currentUser?.role === 'ADMIN' ? 'Edit' : 'View'}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {displayStudents.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                        No students found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        );
    };

    const [editingStudent, setEditingStudent] = useState<StudentSubmission | null>(null);
    const [novationStudent, setNovationStudent] = useState<StudentSubmission | null>(null);

    return (
        <div className="space-y-6 animate-in fade-in pb-12">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => setLocation("/")}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h2 className="text-3xl font-serif font-bold tracking-tight text-primary">Student Data Management</h2>
                        <p className="text-muted-foreground">Manage student submissions and generated links.</p>
                    </div>
                </div>
                {(currentUser?.role === 'ADMIN' || currentUser?.role === 'UNIVERSITY_COORDINATOR') && (
                    <div className="flex gap-2">
                        <Button
                            variant={activeTab === 'links' ? "default" : "outline"}
                            onClick={() => setActiveTab('links')}
                        >
                            Manage Links
                        </Button>
                        <Button
                            variant={activeTab === 'students' ? "default" : "outline"}
                            onClick={() => setActiveTab('students')}
                        >
                            View Students
                        </Button>
                    </div>
                )}
                {activeTab === 'students' && currentUser?.role === 'ADMIN' && (
                    <div className="flex gap-2">
                        {/* CSV Export Removed */}
                        <CreateStudentDialog onCreated={fetchData} />
                    </div>
                )}
            </div>

            {activeTab === 'links' && (currentUser?.role === 'ADMIN' || currentUser?.role === 'UNIVERSITY_COORDINATOR') ? (
                <LinkManagementView />
            ) : (
                <div className="space-y-6">
                    {/* Breadcrumbs */}
                    <nav className="flex items-center text-sm text-muted-foreground bg-muted/30 p-2 px-4 rounded-md w-fit">
                        <button onClick={() => handleBreadcrumbClick('years')} className="hover:text-primary flex items-center gap-1 font-medium">
                            <Home className="w-4 h-4" /> Home
                        </button>

                        {navPath.year && (
                            <>
                                <ChevronRight className="w-4 h-4 mx-2" />
                                <button onClick={() => handleBreadcrumbClick('universities')} className="hover:text-primary font-medium">
                                    {navPath.year}
                                </button>
                            </>
                        )}
                        {navPath.university && (
                            <>
                                <ChevronRight className="w-4 h-4 mx-2" />
                                <button onClick={() => handleBreadcrumbClick('districts')} className="hover:text-primary font-medium">
                                    {navPath.university}
                                </button>
                            </>
                        )}
                        {navPath.district && (
                            <>
                                <ChevronRight className="w-4 h-4 mx-2" />
                                <button onClick={() => handleBreadcrumbClick('subjects')} className="hover:text-primary font-medium">
                                    {navPath.district}
                                </button>
                            </>
                        )}
                        {navPath.subject && (
                            <>
                                <ChevronRight className="w-4 h-4 mx-2" />
                                <span className="text-foreground font-bold">{navPath.subject}</span>
                            </>
                        )}
                    </nav>

                    {/* Drill-down Grid */}
                    {currentLevel !== 'list' && (
                        <div>
                            <h3 className="text-lg font-semibold mb-4 capitalize flex items-center gap-2">
                                {currentLevel === 'years' && <Calendar className="w-5 h-5 text-primary" />}
                                {currentLevel === 'universities' && <School className="w-5 h-5 text-primary" />}
                                {currentLevel === 'districts' && <MapPin className="w-5 h-5 text-primary" />}
                                {currentLevel === 'subjects' && <BookOpen className="w-5 h-5 text-primary" />}
                                Select {currentLevel.slice(0, -1)}
                            </h3>

                            {gridItems.length === 0 ? (
                                <div className="text-center py-12 border-2 border-dashed rounded-lg text-muted-foreground">
                                    No data available at this level.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {gridItems.map(item => (
                                        <Card
                                            key={item.name}
                                            className="cursor-pointer hover:border-primary hover:shadow-md transition-all group"
                                            onClick={() => handleDrill(item.name)}
                                        >
                                            <CardContent className="flex flex-col items-center justify-center p-6 text-center space-y-3">
                                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors text-primary">
                                                    {currentLevel === 'years' && <Calendar className="w-6 h-6" />}
                                                    {currentLevel === 'universities' && <School className="w-6 h-6" />}
                                                    {currentLevel === 'districts' && <MapPin className="w-6 h-6" />}
                                                    {currentLevel === 'subjects' && <BookOpen className="w-6 h-6" />}
                                                </div>
                                                <div className="space-y-1">
                                                    <h4 className="font-bold text-lg leading-tight">{item.name}</h4>
                                                    <p className="text-xs text-muted-foreground">{item.count} {item.count === 1 ? 'Student' : 'Students'}</p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* List View */}
                    {currentLevel === 'list' && (
                        <>
                            <StudentListView
                                openEdit={(s) => setEditingStudent(s)}
                                openNovation={(s) => setNovationStudent(s)}
                            />
                            <EditStudentDialog
                                student={editingStudent}
                                open={!!editingStudent}
                                onOpenChange={(open) => !open && setEditingStudent(null)}
                                onSuccess={() => {
                                    setEditingStudent(null);
                                    fetchData();
                                }}
                            />
                            <NovationRequestDialog
                                student={novationStudent}
                                open={!!novationStudent}
                                onOpenChange={(open) => !open && setNovationStudent(null)}
                                onSuccess={() => {
                                    setNovationStudent(null);
                                    // optional: refresh
                                }}
                            />
                        </>
                    )}
                </div>
            )}
        </div>
    );
}

function StudentListView({ openEdit }: { openEdit: (s: StudentSubmission) => void }) {
    // ... (this needs to be passed down or defined here to use 'filteredStudents' and 'search' from parent scope?)
    // Actually, defining inside component causes re-render issues or prop drilling. 
    // Better to keep StudentListView inline in main component or pass props.
    // Reverting to inline rendering for simplicity in this replace block, 
    // using the parent's `StudentListView` function but modifying it to accept the handler?
    // No, the previous code had `StudentListView` defined INSIDE `StudentDataDashboard`.
    // I will just modify the `StudentListView` definition inside `StudentDataDashboard` in the next replacement chunk if needed,
    // OR simpler: `StudentListView` creates a closure over `filteredStudents` etc.
    // It is defined INSIDE. So I can just use it.
    return null; // Logic handled in main body replacement.
}

function EditStudentDialog({ student, open, onOpenChange, onSuccess }: { student: StudentSubmission | null, open: boolean, onOpenChange: (open: boolean) => void, onSuccess: () => void }) {
    const { currentUser } = useStore();
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    if (!student) return null;

    const isAdmin = currentUser?.role === 'ADMIN';

    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!isAdmin) return;

        setLoading(true);
        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());

        try {
            await axios.patch(`/api/student-submissions/${student.id}/`, data);
            toast({ title: "Student Updated", description: "Changes saved successfully." });
            onSuccess();
        } catch (error) {
            console.error(error);
            toast({ title: "Update Failed", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const onDelete = async () => {
        if (!confirm("Are you sure you want to delete this student record? This action cannot be undone.")) return;

        setLoading(true);
        try {
            await axios.delete(`/api/student-submissions/${student.id}/`);
            toast({ title: "Student Deleted", description: "Record removed successfully." });
            onOpenChange(false);
            onSuccess();
        } catch (error) {
            console.error(error);
            toast({ title: "Delete Failed", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const FileLink = ({ label, fileUrl }: { label: string, fileUrl: string | null }) => {
        if (!fileUrl) return null;
        return (
            <div className="flex items-center justify-between p-3 border rounded-md bg-muted/20">
                <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium">{label}</span>
                </div>
                <Button variant="outline" size="sm" onClick={() => window.open(fileUrl, '_blank')}>
                    <Eye className="h-4 w-4 mr-2" /> View
                </Button>
            </div>
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isAdmin ? "Edit Student Details" : "Student Details"}</DialogTitle>
                    <DialogDescription>
                        {isAdmin ? "Make changes to the student's submission." : "View student submission details."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={onSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Full Name</Label>
                            <Input name="full_name" defaultValue={student.full_name} readOnly={!isAdmin} required />
                        </div>
                        <div className="space-y-2">
                            <Label>NIC</Label>
                            <Input name="nic" defaultValue={student.nic} readOnly={!isAdmin} required />
                        </div>
                        <div className="space-y-2">
                            <Label>Student Reg No</Label>
                            <Input name="student_reg_no" defaultValue={student.student_reg_no} readOnly={!isAdmin} required />
                        </div>
                        <div className="space-y-2">
                            <Label>Admin Reg No</Label>
                            <Input name="admin_reg_number" defaultValue={student.admin_reg_number || ''} readOnly={!isAdmin} placeholder="-" />
                        </div>
                        <div className="space-y-2">
                            <Label>University</Label>
                            <Input name="university" defaultValue={student.university} readOnly={!isAdmin} required />
                        </div>
                        <div className="space-y-2">
                            <Label>Subject</Label>
                            <Input name="subject" defaultValue={student.subject} readOnly={!isAdmin} required />
                        </div>
                        <div className="space-y-2">
                            <Label>Batch Year</Label>
                            <Input name="batch_year" defaultValue={student.batch_year} readOnly={!isAdmin} required />
                        </div>
                        <div className="space-y-2">
                            <Label>District</Label>
                            <Input name="district" defaultValue={student.district} readOnly={!isAdmin} required />
                        </div>
                    </div>

                    <div className="border-t pt-4">
                        <Label className="mb-3 block text-base">Uploaded Documents</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <FileLink label="NIC Copy" fileUrl={student.nic_copy} />
                            <FileLink label="Agreement Form" fileUrl={student.agreement_form} />
                            <FileLink label="Work Site Form" fileUrl={student.work_site_form} />
                            <FileLink label="Placement Letter" fileUrl={student.placement_letter} />
                            {(!student.nic_copy && !student.agreement_form && !student.work_site_form && !student.placement_letter) && (
                                <p className="text-sm text-muted-foreground col-span-2">No documents uploaded.</p>
                            )}
                        </div>
                    </div>

                    <DialogFooter className="flex justify-between sm:justify-between items-center gap-2">
                        {isAdmin ? (
                            <Button type="button" variant="destructive" size="sm" onClick={onDelete} disabled={loading}>
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </Button>
                        ) : <div />}

                        <div className="flex gap-2">
                            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Close</Button>
                            {isAdmin && <Button type="submit" disabled={loading}>Save Changes</Button>}
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function CreateLinkDialog({ onCreated }: { onCreated: () => void }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState<any[]>([]);
    const { toast } = useToast();
    const [useGoogleForm, setUseGoogleForm] = useState(false);

    // Fetch users (coordinators)
    useEffect(() => {
        if (open) {
            axios.get('/api/management/users/').then(res => {
                setUsers(res.data.filter((u: any) => u.role === 'UNIVERSITY_COORDINATOR'));
            }).catch(e => console.error(e));
        }
    }, [open]);

    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        try {
            await axios.post('/api/student-links/', {
                university: formData.get('university'),
                subject: formData.get('subject'),
                batch_year: formData.get('batch_year'),
                district: formData.get('district'),
                assigned_coordinator: formData.get('assigned_coordinator') || null,
                google_form_url: useGoogleForm ? formData.get('google_form_url') : null,
            });
            onCreated();
            setOpen(false);
            toast({ title: "Link Created" });
        } catch (err) {
            console.error(err);
            toast({ title: "Failed to create link", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }

    // Default districs
    const districts = [
        "Colombo", "Gampaha", "Kalutara", "Kandy", "Matale", "Nuwara Eliya", "Galle", "Matara", "Hambantota",
        "Jaffna", "Kilinochchi", "Mannar", "Vavuniya", "Mullaitivu", "Batticaloa", "Ampara", "Trincomalee",
        "Kurunegala", "Puttalam", "Anuradhapura", "Polonnaruwa", "Badulla", "Monaragala", "Ratnapura", "Kegalle"
    ];

    const [selectedUni, setSelectedUni] = useState("");

    const filteredCoordinators = users.filter(u =>
        !selectedUni || u.university?.toLowerCase().includes(selectedUni.toLowerCase())
    );

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button><Plus className="mr-2 h-4 w-4" /> New Form Link</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create Collection Link</DialogTitle>
                    <DialogDescription>Generate a new link or share a Google Form.</DialogDescription>
                </DialogHeader>
                <form onSubmit={onSubmit} className="space-y-4">

                    {/* Link Type Toggle */}
                    <div className="flex items-center space-x-2 pb-2">
                        <div className="flex items-center space-x-2">
                            <Label htmlFor="google-mode">Use Google Form Link</Label>
                            <input
                                id="google-mode"
                                type="checkbox"
                                className="toggle" // using standard checkbox tailored as toggle if available, or just checkbox
                                checked={useGoogleForm}
                                onChange={(e) => setUseGoogleForm(e.target.checked)}
                            />
                            {/* Since we don't have a Switch component imported in this context, using check box or Button toggle */}
                            {/* Better UI: */}
                            <Button
                                type="button"
                                variant={useGoogleForm ? "default" : "outline"}
                                onClick={() => setUseGoogleForm(!useGoogleForm)}
                                size="sm"
                            >
                                {useGoogleForm ? "Enabled" : "Disabled"}
                            </Button>
                        </div>
                    </div>

                    {useGoogleForm && (
                        <div className="space-y-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                            <Label className="text-blue-900">Google Form URL</Label>
                            <Input
                                name="google_form_url"
                                required={useGoogleForm}
                                placeholder="https://docs.google.com/forms/..."
                                className="bg-white"
                            />
                            <p className="text-xs text-blue-700">
                                This link will be shown to the coordinator instead of the standard SIT form.
                            </p>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Batch Year</Label>
                            <Input name="batch_year" required placeholder="e.g. 2024/2025" />
                        </div>
                        <div className="space-y-2">
                            <Label>District</Label>
                            <Select name="district" required defaultValue="Colombo">
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {districts.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>University</Label>
                        <Input
                            name="university"
                            required
                            placeholder="e.g. University of Colombo"
                            onChange={(e) => setSelectedUni(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Subject / Degree</Label>
                        <Input name="subject" required placeholder="e.g. BSc in Computer Science" />
                    </div>

                    <div className="space-y-2">
                        <Label>Assign Coordinator (Optional)</Label>
                        <Select name="assigned_coordinator">
                            <SelectTrigger><SelectValue placeholder="Select Coordinator" /></SelectTrigger>
                            <SelectContent>
                                {filteredCoordinators.map(u => (
                                    <SelectItem key={u.id} value={u.id.toString()}>
                                        {u.name || u.email} ({u.university})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            Listing coordinators matching the university above.
                        </p>
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {useGoogleForm ? "Save Google Link" : "Generate Link"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function CreateStudentDialog({ onCreated }: { onCreated: () => void }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    // Reusing the same schema-like fields but as a simple form for now
    // Ideally we reuse the Zod schema from StudentForm but that's in another file. 
    // We'll create a simple form here.

    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        // Add default values for required fields that might be empty if we want to allow partial creation
        // But backend requires them.

        try {
            await axios.post('/api/student-submissions/', formData);
            toast({ title: "Student Created", description: "New student record added." });
            setOpen(false);
            onCreated();
        } catch (error: any) {
            console.error(error);
            const msg = error.response?.data?.detail || "Failed to create student.";
            toast({ title: "Creation Failed", description: msg, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button><Plus className="mr-2 h-4 w-4" /> Add Student</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add New Student</DialogTitle>
                    <DialogDescription>Manually add a student record.</DialogDescription>
                </DialogHeader>
                <form onSubmit={onSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Full Name (Block Letters)</Label>
                            <Input name="full_name" required placeholder="AMARASINGHE..." />
                        </div>
                        <div className="space-y-2">
                            <Label>Name with Initials</Label>
                            <Input name="initials_name" required placeholder="A.B.C. Perera" />
                        </div>
                        <div className="space-y-2">
                            <Label>NIC</Label>
                            <Input name="nic" required />
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input name="email" type="email" required />
                        </div>
                        <div className="space-y-2">
                            <Label>Contact Number</Label>
                            <Input name="contact_number" required />
                        </div>
                        <div className="space-y-2">
                            <Label>Gender</Label>
                            <Select name="gender" required>
                                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Male">Male</SelectItem>
                                    <SelectItem value="Female">Female</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2 col-span-2">
                            <Label>Permanent Address</Label>
                            <Input name="permanent_address" required />
                        </div>

                        <div className="col-span-2 border-t pt-2 mt-2">
                            <Label className="text-base font-semibold">Academic Context</Label>
                        </div>

                        <div className="space-y-2">
                            <Label>University</Label>
                            <Input name="university" required />
                        </div>
                        <div className="space-y-2">
                            <Label>Subject</Label>
                            <Input name="subject" required />
                        </div>
                        <div className="space-y-2">
                            <Label>Batch Year</Label>
                            <Input name="batch_year" required placeholder="2024/2025" />
                        </div>
                        <div className="space-y-2">
                            <Label>District</Label>
                            <Input name="district" required />
                        </div>

                        <div className="space-y-2">
                            <Label>Student Reg No</Label>
                            <Input name="student_reg_no" required />
                        </div>
                        <div className="space-y-2">
                            <Label>Degree/NVQ Level</Label>
                            <Input name="degree_nvq_level" required defaultValue="Degree" />
                        </div>
                        <div className="space-y-2">
                            <Label>Degree/Diploma Name</Label>
                            <Input name="degree_diploma_name" required />
                        </div>

                        <div className="col-span-2 border-t pt-2 mt-2">
                            <Label className="text-base font-semibold">Training Details</Label>
                        </div>

                        <div className="space-y-2">
                            <Label>Training Establishment</Label>
                            <Input name="training_establishment" required />
                        </div>
                        <div className="space-y-2">
                            <Label>Training Address</Label>
                            <Input name="training_address" required />
                        </div>
                        <div className="space-y-2">
                            <Label>Training District</Label>
                            <Input name="training_district" required />
                        </div>
                        <div className="space-y-2">
                            <Label>Divisional Secretariat</Label>
                            <Input name="divisional_secretariat" required />
                        </div>
                        <div className="space-y-2">
                            <Label>OIC Name</Label>
                            <Input name="officer_in_charge" required />
                        </div>
                        <div className="space-y-2">
                            <Label>Field of Training</Label>
                            <Input name="field_of_training" required />
                        </div>
                        <div className="space-y-2">
                            <Label>Start Date</Label>
                            <Input name="training_start_date" type="date" required />
                        </div>
                        <div className="space-y-2">
                            <Label>End Date</Label>
                            <Input name="training_end_date" type="date" required />
                        </div>
                        <div className="space-y-2">
                            <Label>Duration</Label>
                            <Input name="training_duration" required defaultValue="6 Months" />
                        </div>

                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>Create Student</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
