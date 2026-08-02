import { useStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import {
  Plus, Search, Shield, UserCog, Trash2, KeyRound,
  Clock, CheckCircle2, XCircle, Mail, Loader2, AlertCircle, MessageSquare
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";

interface PendingRegistration {
  id: number;
  full_name: string;
  email: string;
  university: string;
  faculty: string;
  department: string;
  designation: string;
  phone_number: string;
  submitted_at: string;
  status: string;
  invite_id?: string;
}

export default function UserManagement() {
  const {
    users,
    createUser,
    updateUser,
    resetPassword,
    deleteUser,
    pendingCoordinators,
    fetchPendingCoordinators,
    updatePendingCoordinator,
    approvePending,
    rejectPending,
    createInvite,
    createStaffInvite,
    pendingStaff,
    fetchPendingStaff,
    updatePendingStaff,
    approveStaffPending,
    rejectStaffPending,
    error,
    clearError
  } = useStore();

  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");

  const [isStaffInviteOpen, setIsStaffInviteOpen] = useState(false);
  const [staffInviteEmail, setStaffInviteEmail] = useState("");
  const [staffInviteType, setStaffInviteType] = useState<"ASSESSOR" | "INSPECTOR">("ASSESSOR");

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    role: "",
    password: "",
    university: "",
    faculty: "",
    department: "",
    designation: "",
    phone_number: "",
    whatsapp_number: ""
  });

  // Filter state
  const [filterUniversity, setFilterUniversity] = useState("ALL");
  const [filterFaculty, setFilterFaculty] = useState("ALL");

  // Action states
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [newPassword, setNewPassword] = useState("");
  const [viewUserDialogOpen, setViewUserDialogOpen] = useState(false);
  const [editUserData, setEditUserData] = useState<any>(null);
  const [editUserLoading, setEditUserLoading] = useState(false);

  // ─── Pending Registrations ──────────────────────────────────────────────────
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [selectedPending, setSelectedPending] = useState<PendingRegistration | null>(null);
  const [approveUsername, setApproveUsername] = useState("");
  const [approvePassword, setApprovePassword] = useState("");
  const [rejectNote, setRejectNote] = useState("");
  const [emailSending, setEmailSending] = useState(false);

  const [viewPendingOpen, setViewPendingOpen] = useState(false);
  const [editPendingData, setEditPendingData] = useState<any>(null);
  const [editPendingLoading, setEditPendingLoading] = useState(false);

  // ─── Pending Staff ────────────────────────────────────────────────────────
  const [rejectStaffOpen, setRejectStaffOpen] = useState(false);
  const [selectedStaffPending, setSelectedStaffPending] = useState<any>(null);
  const [rejectStaffNote, setRejectStaffNote] = useState("");
  const [staffActionLoading, setStaffActionLoading] = useState<number | null>(null);

  const [viewStaffPendingOpen, setViewStaffPendingOpen] = useState(false);
  const [editStaffPendingData, setEditStaffPendingData] = useState<any>(null);
  const [editStaffPendingLoading, setEditStaffPendingLoading] = useState(false);

  // Fetch pending coordinators on mount
  useEffect(() => {
    fetchPendingCoordinators();
  }, [fetchPendingCoordinators]);

  // Show error toast when global error occurs
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
      clearError();
    }
  }, [error, toast, clearError]);

  // UPDATED: Use store's approvePending
  const handleApprovePending = async () => {
    if (!selectedPending || !approveUsername || !approvePassword) {
      toast({
        title: "Missing Fields",
        description: "Username and password are required.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setEmailSending(true);

    try {
      const result = await approvePending(
        selectedPending.id,
        approveUsername,
        approvePassword
      );

      if (result.success) {
        toast({
          title: result.emailSent ? "✅ Approved & Email Sent!" : "✅ Approved",
          description: result.emailSent
            ? `${selectedPending.full_name}'s account has been created and credentials sent to their email.`
            : `${selectedPending.full_name}'s account has been created. (Email delivery failed)`,
          variant: result.emailSent ? "default" : "warning",
        });

        setApproveOpen(false);
        setApproveUsername("");
        setApprovePassword("");
        setSelectedPending(null);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to approve coordinator.",
          variant: "destructive"
        });
      }
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message || "Network error.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setEmailSending(false);
    }
  };

  // UPDATED: Use store's rejectPending
  const handleRejectPending = async () => {
    if (!selectedPending) return;

    setLoading(true);
    try {
      const result = await rejectPending(selectedPending.id, rejectNote);

      if (result.success) {
        toast({
          title: "Rejected",
          description: result.message || "Registration request rejected."
        });
        setRejectOpen(false);
        setRejectNote("");
        setSelectedPending(null);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to reject.",
          variant: "destructive"
        });
      }
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message || "Network error.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditPending = async () => {
    if (!editPendingData) return;
    setEditPendingLoading(true);
    const result = await updatePendingCoordinator(editPendingData.id, editPendingData);
    setEditPendingLoading(false);
    if (result.success) {
      toast({ title: "Updated", description: result.message || "Coordinator details updated." });
      setViewPendingOpen(false);
      // optionally refresh UI: `fetchPendingCoordinators()` is already called inside store
    } else {
      toast({ title: "Error", description: result.error || "Failed to update details.", variant: "destructive" });
    }
  };

  // ─── Staff Handlers ─────────────────────────────────────────────────────────
  const handleEditStaffPending = async () => {
    if (!editStaffPendingData) return;
    setEditStaffPendingLoading(true);
    const result = await updatePendingStaff(editStaffPendingData.id, editStaffPendingData);
    setEditStaffPendingLoading(false);
    if (result.success) {
      toast({ title: "Updated", description: result.message || "Staff details updated." });
      setViewStaffPendingOpen(false);
    } else {
      toast({ title: "Error", description: result.error || "Failed to update details.", variant: "destructive" });
    }
  };

  const handleApproveStaff = async (id: number) => {
    setStaffActionLoading(id);
    try {
      const result = await approveStaffPending(id);
      if (result.success) {
        toast({
          title: result.emailSent ? "✅ Approved & Email Sent!" : "✅ Approved",
          description: result.emailSent
            ? `The account has been created and credentials sent to their email.`
            : `The account has been created. (Email delivery failed)`,
          variant: result.emailSent ? "default" : "warning",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to approve staff.",
          variant: "destructive"
        });
      }
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message || "Network error.",
        variant: "destructive"
      });
    } finally {
      setStaffActionLoading(null);
    }
  };

  const handleRejectStaff = async () => {
    if (!selectedStaffPending) return;
    setLoading(true);
    try {
      const result = await rejectStaffPending(selectedStaffPending.id, rejectStaffNote);
      if (result.success) {
        toast({
          title: "Rejected",
          description: result.message || "Staff request rejected."
        });
        setRejectStaffOpen(false);
        setRejectStaffNote("");
        setSelectedStaffPending(null);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to reject.",
          variant: "destructive"
        });
      }
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message || "Network error.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // ─── Existing Users ─────────────────────────────────────────────────────────
  const safeUsers = Array.isArray(users) ? users : [];
  const filteredUsers = safeUsers.filter(u => {
    const matchesSearch =
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.username && u.username.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesUni = filterUniversity === "ALL" || u.university === filterUniversity;
    const matchesFac = filterFaculty === "ALL" || u.faculty === filterFaculty;
    return matchesSearch && matchesUni && matchesFac;
  });

  const universities = Array.from(new Set(safeUsers.map(u => u.university).filter((v): v is string => !!v)));
  const faculties = Array.from(new Set(safeUsers.map(u => u.faculty).filter((v): v is string => !!v)));

  // UPDATED: Use store's createUser with better error handling
  const handleSubmit = async () => {
    if (!formData.name || !formData.email || !formData.role || !formData.password || !formData.username) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const result = await createUser(formData);

      if (result.success) {
        toast({
          title: "Success",
          description: result.message || "User account created successfully."
        });
        setIsOpen(false);
        setFormData({
          name: "", username: "", email: "", role: "", password: "",
          university: "", faculty: "", department: "", designation: "",
          phone_number: "", whatsapp_number: ""
        });
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to create user.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create user.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // UPDATED: Use store's resetPassword
  const handleResetPassword = async () => {
    if (!selectedUser || !newPassword) return;

    setLoading(true);
    try {
      const result = await resetPassword(selectedUser.id, newPassword);

      if (result.success) {
        toast({
          title: "Success",
          description: result.message || "Password reset successfully."
        });
        setResetDialogOpen(false);
        setNewPassword("");
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to reset password.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reset password.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // UPDATED: Use store's deleteUser
  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    setLoading(true);
    try {
      const result = await deleteUser(selectedUser.id);

      if (result.success) {
        toast({
          title: "Success",
          description: result.message || "User deleted successfully."
        });
        setDeleteDialogOpen(false);
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to delete user.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = async () => {
    if (!editUserData) return;
    setEditUserLoading(true);
    const result = await updateUser(editUserData.id, editUserData);
    setEditUserLoading(false);
    if (result.success) {
      toast({ title: "Updated", description: "User details updated successfully." });
      setViewUserDialogOpen(false);
    } else {
      toast({ title: "Error", description: result.error || "Failed to update details.", variant: "destructive" });
    }
  };

  const handleCreateInvite = async () => {
    if (!inviteEmail) {
      toast({
        title: "Validation Error",
        description: "Please enter an email address.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const result = await createInvite(inviteEmail);
      if (result.success) {
        toast({
          title: "Success",
          description: result.message || `Invitation sent to ${inviteEmail}`,
        });
        setIsInviteOpen(false);
        setInviteEmail("");
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to send invitation.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send invitation.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStaffInvite = async () => {
    if (!staffInviteEmail) {
      toast({
        title: "Validation Error",
        description: "Please enter an email address.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const result = await createStaffInvite(staffInviteEmail, staffInviteType);
      if (result.success) {
        toast({
          title: "Success",
          description: result.message || `Invitation sent to ${staffInviteEmail}`,
        });
        setIsStaffInviteOpen(false);
        setStaffInviteEmail("");
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to send invitation.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send invitation.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const openStaffInviteDialog = (type: "ASSESSOR" | "INSPECTOR") => {
    setStaffInviteType(type);
    setStaffInviteEmail("");
    setIsStaffInviteOpen(true);
  };


  return (
    <div className="space-y-6 p-6">
      {/* Header with Create User Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">User Management</h2>

        <div className="flex gap-4 items-center">
          {/* Invite Coordinator Dialog */}
          <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Mail className="h-4 w-4" />
                Invite Coordinator
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Invite University Coordinator</DialogTitle>
                <DialogDescription>
                  Enter the email address of the prospective coordinator. They will receive a link to register.
                </DialogDescription>
              </DialogHeader>

              <div className="py-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="inviteEmail">Email Address</Label>
                  <Input
                    id="inviteEmail"
                    type="email"
                    placeholder="coordinator@university.edu"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsInviteOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateInvite} disabled={loading || !inviteEmail}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Invitation"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Invite Staff Dialog (Assessor / Inspector) */}
          <Dialog open={isStaffInviteOpen} onOpenChange={setIsStaffInviteOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Invite {staffInviteType === 'ASSESSOR' ? 'Assessor' : 'Inspector'}</DialogTitle>
                <DialogDescription>
                  Enter the email address to send them a registration link.
                </DialogDescription>
              </DialogHeader>

              <div className="py-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="staffInviteEmail">Email Address</Label>
                  <Input
                    id="staffInviteEmail"
                    type="email"
                    placeholder="email@example.com"
                    value={staffInviteEmail}
                    onChange={(e) => setStaffInviteEmail(e.target.value)}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsStaffInviteOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateStaffInvite} disabled={loading || !staffInviteEmail}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Invitation"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button variant="outline" className="gap-2 border-blue-200 text-blue-700 hover:bg-blue-50" onClick={() => openStaffInviteDialog("ASSESSOR")}>
            <Mail className="h-4 w-4" /> Invite Assessor
          </Button>
          <Button variant="outline" className="gap-2 border-amber-200 text-amber-700 hover:bg-amber-50" onClick={() => openStaffInviteDialog("INSPECTOR")}>
            <Mail className="h-4 w-4" /> Invite Inspector
          </Button>

          {/* Create User Dialog */}
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="shadow-lg">
                <Plus className="mr-2 h-4 w-4" /> Create User
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
                <DialogDescription>
                  Add a new Administrator or Inspector account.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username *</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={e => setFormData({ ...formData, username: e.target.value })}
                      placeholder="johndoe"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role *</Label>
                  <Select
                    value={formData.role}
                    onValueChange={value => setFormData({ ...formData, role: value })}
                  >
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">Administrator</SelectItem>
                      <SelectItem value="INSPECTOR">Inspector</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Set account password"
                  />
                </div>

                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium mb-3">Optional Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="university">University</Label>
                      <Input
                        id="university"
                        value={formData.university}
                        onChange={e => setFormData({ ...formData, university: e.target.value })}
                        placeholder="University name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="faculty">Faculty</Label>
                      <Input
                        id="faculty"
                        value={formData.faculty}
                        onChange={e => setFormData({ ...formData, faculty: e.target.value })}
                        placeholder="Faculty name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <Input
                        id="department"
                        value={formData.department}
                        onChange={e => setFormData({ ...formData, department: e.target.value })}
                        placeholder="Department"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="designation">Designation</Label>
                      <Input
                        id="designation"
                        value={formData.designation}
                        onChange={e => setFormData({ ...formData, designation: e.target.value })}
                        placeholder="Designation"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={formData.phone_number}
                        onChange={e => setFormData({ ...formData, phone_number: e.target.value })}
                        placeholder="Phone number"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Pending Coordinator Approvals */}
      {pendingCoordinators.length > 0 && (
        <div className="rounded-md border border-amber-200 bg-amber-50 overflow-hidden shadow-sm">
          <div className="flex items-center gap-3 p-4 border-b border-amber-200 bg-amber-100">
            <Clock className="h-5 w-5 text-amber-600" />
            <div>
              <h3 className="font-semibold text-amber-800">Pending Coordinator Approvals</h3>
              <p className="text-xs text-amber-600">
                These coordinators have submitted their details and are waiting for your approval.
              </p>
            </div>
            <Badge className="ml-auto bg-amber-600 text-white">
              {pendingCoordinators.length} Pending
            </Badge>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="bg-amber-50">
                <TableHead>Name</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingCoordinators.map((p: PendingRegistration) => (
                <TableRow key={p.id} className="bg-white">
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{p.full_name}</span>
                      <span className="text-xs text-muted-foreground">{p.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-sm">
                      <span className="font-medium">{p.designation || "-"}</span>
                      <span className="text-xs text-muted-foreground">{p.university || "-"}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {new Date(p.submitted_at).toLocaleDateString()}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditPendingData({ ...p });
                          setViewPendingOpen(true);
                        }}
                      >
                        <Search className="h-4 w-4 mr-1" /> View Details
                      </Button>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => {
                          setSelectedPending(p);
                          // Suggest a username from name
                          setApproveUsername(
                            p.full_name.toLowerCase()
                              .replace(/\s+/g, '.')
                              .replace(/[^a-z.]/g, '')
                          );
                          setApproveOpen(true);
                        }}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          setSelectedPending(p);
                          setRejectOpen(true);
                        }}
                      >
                        <XCircle className="h-4 w-4 mr-1" /> Reject
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* View/Edit Pending Coordinator Dialog */}
      <Dialog open={viewPendingOpen} onOpenChange={setViewPendingOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>View & Edit Details</DialogTitle>
            <DialogDescription>
              View and modify the form details submitted by the coordinator before approval.
            </DialogDescription>
          </DialogHeader>
          {editPendingData && (
            <div className="space-y-4 py-2 mt-2 max-h-[60vh] overflow-y-auto px-1">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={editPendingData.full_name} onChange={e => setEditPendingData({...editPendingData, full_name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={editPendingData.email} onChange={e => setEditPendingData({...editPendingData, email: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input value={editPendingData.phone_number || ''} onChange={e => setEditPendingData({...editPendingData, phone_number: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>WhatsApp</Label>
                  <Input value={editPendingData.whatsapp_number || ''} onChange={e => setEditPendingData({...editPendingData, whatsapp_number: e.target.value})} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Designation</Label>
                <Input value={editPendingData.designation || ''} onChange={e => setEditPendingData({...editPendingData, designation: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>University</Label>
                <Input value={editPendingData.university || ''} onChange={e => setEditPendingData({...editPendingData, university: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Faculty</Label>
                <Input value={editPendingData.faculty || ''} onChange={e => setEditPendingData({...editPendingData, faculty: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Input value={editPendingData.department || ''} onChange={e => setEditPendingData({...editPendingData, department: e.target.value})} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewPendingOpen(false)}>Cancel</Button>
            <Button onClick={handleEditPending} disabled={editPendingLoading}>
              {editPendingLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pending Staff Approvals (Assessors/Inspectors) */}
      {pendingStaff && pendingStaff.length > 0 && (
        <div className="rounded-md border border-blue-200 bg-blue-50 overflow-hidden shadow-sm">
          <div className="flex items-center gap-3 p-4 border-b border-blue-200 bg-blue-100">
            <Clock className="h-5 w-5 text-blue-600" />
            <div>
              <h3 className="font-semibold text-blue-800">Pending Staff Approvals</h3>
              <p className="text-xs text-blue-600">
                These Assessors and Inspectors have submitted their details and are waiting for account creation.
              </p>
            </div>
            <Badge className="ml-auto bg-blue-600 text-white">
              {pendingStaff.length} Pending
            </Badge>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="bg-blue-50 hover:bg-blue-50 hover:border-blue-50">
                <TableHead>Type</TableHead>
                <TableHead>Name & Email</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingStaff.map((p: any) => (
                <TableRow key={p.id} className="bg-white">
                  <TableCell>
                    <Badge variant="outline" className={p.invite_type === 'ASSESSOR' ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-amber-50 text-amber-700 border-amber-200"}>
                      {p.invite_type || "STAFF"}
                    </Badge>
                    {p.is_also_assessor && <Badge variant="outline" className="ml-1 bg-purple-50 text-purple-700 border-purple-200 text-[10px]">+ASSESSOR</Badge>}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{p.full_name}</span>
                      <span className="text-xs text-muted-foreground">{p.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-sm">
                      <span className="font-medium">{p.district || "-"}</span>
                      <span className="text-xs text-muted-foreground">{p.province || "-"}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">{p.phone_number || "-"}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {new Date(p.submitted_at).toLocaleDateString()}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditStaffPendingData({ ...p });
                          setViewStaffPendingOpen(true);
                        }}
                      >
                        <Search className="h-4 w-4 mr-1" /> View Details
                      </Button>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => handleApproveStaff(p.id)}
                        disabled={staffActionLoading === p.id}
                      >
                        {staffActionLoading === p.id ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                        )}
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          setSelectedStaffPending(p);
                          setRejectStaffOpen(true);
                        }}
                        disabled={staffActionLoading === p.id}
                      >
                        <XCircle className="h-4 w-4 mr-1" /> Reject
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* View/Edit Pending Staff Dialog */}
      <Dialog open={viewStaffPendingOpen} onOpenChange={setViewStaffPendingOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>View & Edit Staff Details</DialogTitle>
            <DialogDescription>
              View and modify the form details, including payment accounts, before approval.
            </DialogDescription>
          </DialogHeader>
          {editStaffPendingData && (
            <div className="space-y-6 py-2 mt-2 max-h-[60vh] overflow-y-auto px-1">
              
              {/* Personal details */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-muted-foreground border-b pb-1">Personal Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label>Full Name</Label>
                    <Input value={editStaffPendingData.full_name} onChange={e => setEditStaffPendingData({...editStaffPendingData, full_name: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Initials Name</Label>
                    <Input value={editStaffPendingData.initials_name || ''} onChange={e => setEditStaffPendingData({...editStaffPendingData, initials_name: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" value={editStaffPendingData.email} onChange={e => setEditStaffPendingData({...editStaffPendingData, email: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input value={editStaffPendingData.phone_number || ''} onChange={e => setEditStaffPendingData({...editStaffPendingData, phone_number: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Qualification</Label>
                    <Input value={editStaffPendingData.qualification || ''} onChange={e => setEditStaffPendingData({...editStaffPendingData, qualification: e.target.value})} />
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-muted-foreground border-b pb-1">Location Details</h4>
                <div className="space-y-2">
                  <Label>Permanent Address</Label>
                  <Input value={editStaffPendingData.permanent_address || ''} onChange={e => setEditStaffPendingData({...editStaffPendingData, permanent_address: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Province</Label>
                    <Input value={editStaffPendingData.province || ''} onChange={e => setEditStaffPendingData({...editStaffPendingData, province: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>District</Label>
                    <Input value={editStaffPendingData.district || ''} onChange={e => setEditStaffPendingData({...editStaffPendingData, district: e.target.value})} />
                  </div>
                </div>
              </div>

              {/* Assessor Details / Payment */}
              {(editStaffPendingData.invite_type === 'ASSESSOR' || editStaffPendingData.is_also_assessor) && (
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-muted-foreground border-b pb-1">Assessor / Payment Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 col-span-2">
                      <Label>Account Number</Label>
                      <Input 
                        value={editStaffPendingData.payment_details?.account_number || ''} 
                        onChange={e => setEditStaffPendingData({
                          ...editStaffPendingData, 
                          payment_details: { ...(editStaffPendingData.payment_details || {}), account_number: e.target.value }
                        })} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Bank Name</Label>
                      <Input 
                        value={editStaffPendingData.payment_details?.bank_name || ''} 
                        onChange={e => setEditStaffPendingData({
                          ...editStaffPendingData, 
                          payment_details: { ...(editStaffPendingData.payment_details || {}), bank_name: e.target.value }
                        })} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Branch</Label>
                      <Input 
                        value={editStaffPendingData.payment_details?.branch || ''} 
                        onChange={e => setEditStaffPendingData({
                          ...editStaffPendingData, 
                          payment_details: { ...(editStaffPendingData.payment_details || {}), branch: e.target.value }
                        })} 
                      />
                    </div>
                  </div>
                  
                  {editStaffPendingData.assessment_fields && editStaffPendingData.assessment_fields.length > 0 && (
                     <div className="space-y-2">
                       <Label>Assessment Fields (Read-only)</Label>
                       <div className="flex flex-wrap gap-1">
                         {editStaffPendingData.assessment_fields.map((f: string, i: number) => (
                           <Badge key={i} variant="secondary">{f}</Badge>
                         ))}
                       </div>
                     </div>
                  )}
                </div>
              )}

            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewStaffPendingOpen(false)}>Cancel</Button>
            <Button onClick={handleEditStaffPending} disabled={editStaffPendingLoading}>
              {editStaffPendingLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Staff Dialog */}
      <Dialog open={rejectStaffOpen} onOpenChange={setRejectStaffOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Staff Registration</DialogTitle>
            <DialogDescription>
              Are you sure you want to reject the registration request from {selectedStaffPending?.full_name}?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Rejection Note (Optional)</Label>
              <Input
                placeholder="Reason for rejection..."
                value={rejectStaffNote}
                onChange={(e) => setRejectStaffNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectStaffOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleRejectStaff} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Confirm Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center bg-card p-4 rounded-md border shadow-sm">
        <div className="flex-1 flex items-center gap-2 border rounded-md px-2 bg-background w-full">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            className="border-none focus-visible:ring-0 shadow-none h-8"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <Select value={filterUniversity} onValueChange={setFilterUniversity}>
          <SelectTrigger className="w-[180px] h-9">
            <SelectValue placeholder="University" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Universities</SelectItem>
            {universities.map(u => (
              <SelectItem key={u} value={u}>{u}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterFaculty} onValueChange={setFilterFaculty}>
          <SelectTrigger className="w-[180px] h-9">
            <SelectValue placeholder="Faculty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Faculties</SelectItem>
            {faculties.map(f => (
              <SelectItem key={f} value={f}>{f}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Users Tabs */}
      <Tabs defaultValue="ADMIN" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="ADMIN">Administrators</TabsTrigger>
          <TabsTrigger value="ASSESSOR">Assessors</TabsTrigger>
          <TabsTrigger value="INSPECTOR">Inspectors</TabsTrigger>
          <TabsTrigger value="UNIVERSITY_COORDINATOR">Coordinators</TabsTrigger>
        </TabsList>

        {["ADMIN", "ASSESSOR", "INSPECTOR", "UNIVERSITY_COORDINATOR"].map(roleFilter => {
          const roleUsers = filteredUsers.filter(u => u.role === roleFilter);

          return (
            <TabsContent key={roleFilter} value={roleFilter}>
              {roleUsers.length === 0 ? (
                <div className="text-center py-12 border rounded-md bg-muted/10">
                  <UserCog className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <h3 className="font-medium text-lg">No users found</h3>
                  <p className="text-sm text-muted-foreground">
                    Try adjusting your search or invite a new {roleFilter.replace('_', ' ').toLowerCase()}.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {roleUsers.map(user => (
                    <Card key={user.id} className="shadow-sm">
                      <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
                        <div>
                          <CardTitle className="text-lg font-bold">{user.name}</CardTitle>
                          <CardDescription>@{user.username}</CardDescription>
                        </div>
                        {user.role === 'ADMIN' ? (
                          <Shield className="h-5 w-5 text-primary" />
                        ) : (
                          <UserCog className="h-5 w-5 text-muted-foreground" />
                        )}
                      </CardHeader>
                      <CardContent className="space-y-2 pb-2 text-sm">
                        <div className="flex flex-col">
                          <span className="text-muted-foreground text-xs uppercase font-semibold">Contact</span>
                          <span>{user.email}</span>
                          {user.phone_number && <span>Tel: {user.phone_number}</span>}
                        </div>
                        <div className="flex flex-col pt-2 border-t">
                          <span className="text-muted-foreground text-xs uppercase font-semibold">Details</span>
                          <span>{user.university || "N/A"}</span>
                          {user.faculty && <span>{user.faculty}</span>}
                          {user.department && <span>Dept: {user.department}</span>}
                          {user.designation && <span>{user.designation}</span>}
                        </div>
                      </CardContent>
                      <CardFooter className="pt-2 flex justify-end gap-2 border-t bg-muted/10 flex-wrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user);
                            setEditUserData({ ...user });
                            setViewUserDialogOpen(true);
                          }}
                          title="View Details"
                        >
                          <Search className="h-4 w-4 mr-1" /> View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user);
                            setResetDialogOpen(true);
                          }}
                          title="Reset Password"
                        >
                          <KeyRound className="h-4 w-4 mr-1" /> Reset
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
                          onClick={() => {
                            setSelectedUser(user);
                            setDeleteDialogOpen(true);
                          }}
                          title="Delete User"
                        >
                          <Trash2 className="h-4 w-4 mr-1" /> Delete
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>

      {/* Approve Dialog */}
      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Approve Coordinator — Set Login Credentials</DialogTitle>
            <DialogDescription>
              Approve <strong>{selectedPending?.full_name}</strong> and assign their login credentials.
              These will be sent via email to: <span className="text-primary font-medium">{selectedPending?.email}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="grid grid-cols-2 gap-4 p-3 bg-muted rounded-md text-sm">
              <div>
                <span className="text-muted-foreground">University:</span>
                <br />
                <strong>{selectedPending?.university}</strong>
              </div>
              <div>
                <span className="text-muted-foreground">Faculty:</span>
                <br />
                <strong>{selectedPending?.faculty || "-"}</strong>
              </div>
              <div>
                <span className="text-muted-foreground">Department:</span>
                <br />
                <strong>{selectedPending?.department || "-"}</strong>
              </div>
              <div>
                <span className="text-muted-foreground">Designation:</span>
                <br />
                <strong>{selectedPending?.designation || "-"}</strong>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">
                Username <span className="text-red-500">*</span>
              </Label>
              <Input
                id="username"
                value={approveUsername}
                onChange={e => setApproveUsername(e.target.value)}
                placeholder="e.g. john.doe"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                Password <span className="text-red-500">*</span>
              </Label>
              <Input
                id="password"
                type="text"
                value={approvePassword}
                onChange={e => setApprovePassword(e.target.value)}
                placeholder="Set a password for this coordinator"
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                {emailSending ? (
                  <span className="flex items-center gap-1 text-blue-600">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Sending email via Gmail SMTP...
                  </span>
                ) : (
                  "Credentials will be sent via email to the coordinator"
                )}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setApproveOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApprovePending}
              disabled={loading || !approveUsername || !approvePassword}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {emailSending ? "Sending Email..." : "Approving..."}
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Approve & Send Email
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Reject Registration Request</DialogTitle>
            <DialogDescription>
              Reject the registration request from <strong>{selectedPending?.full_name}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-2">
            <Label htmlFor="rejectNote">Reason (Optional)</Label>
            <Input
              id="rejectNote"
              value={rejectNote}
              onChange={e => setRejectNote(e.target.value)}
              placeholder="e.g. Incomplete information"
              disabled={loading}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectPending}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Rejecting...
                </>
              ) : (
                "Confirm Reject"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Set a new password for {selectedUser?.name}.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              disabled={loading}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setResetDialogOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleResetPassword}
              disabled={loading || !newPassword}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting...
                </>
              ) : (
                "Reset Password"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View User Dialog */}
      <Dialog open={viewUserDialogOpen} onOpenChange={setViewUserDialogOpen}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>View & Edit User Details</DialogTitle>
            <DialogDescription>
              Modify the profile information for this user.
            </DialogDescription>
          </DialogHeader>

          {editUserData && (
            <div className="py-4 space-y-6">
              
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-muted-foreground border-b pb-1">Basic Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2 col-span-2">
                    <Label>Full Name</Label>
                    <Input value={editUserData.name || ''} onChange={e => setEditUserData({...editUserData, name: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Username (Read-only)</Label>
                    <Input value={editUserData.username || ''} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input value={editUserData.email || ''} onChange={e => setEditUserData({...editUserData, email: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input value={editUserData.phone_number || ''} onChange={e => setEditUserData({...editUserData, phone_number: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>WhatsApp Number</Label>
                    <Input value={editUserData.whatsapp_number || ''} onChange={e => setEditUserData({...editUserData, whatsapp_number: e.target.value})} />
                  </div>
                </div>
              </div>

              {(editUserData.role === 'ASSESSOR' || editUserData.role === 'INSPECTOR') && (
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-muted-foreground border-b pb-1">Staff Location / Profile</h4>
                  <div className="space-y-2">
                    <Label>Permanent Address</Label>
                    <Input value={editUserData.permanent_address || ''} onChange={e => setEditUserData({...editUserData, permanent_address: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Province</Label>
                      <Input value={editUserData.province || ''} onChange={e => setEditUserData({...editUserData, province: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>District</Label>
                      <Input value={editUserData.district || ''} onChange={e => setEditUserData({...editUserData, district: e.target.value})} />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label>Qualification</Label>
                      <Input value={editUserData.qualification || ''} onChange={e => setEditUserData({...editUserData, qualification: e.target.value})} />
                    </div>
                  </div>
                </div>
              )}

              {(editUserData.role === 'ASSESSOR' || editUserData.is_also_assessor) && (
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-muted-foreground border-b pb-1">Assessor / Payment Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 col-span-2">
                      <Label>Account Number</Label>
                      <Input 
                        value={editUserData.payment_details?.account_number || ''} 
                        onChange={e => setEditUserData({
                          ...editUserData, 
                          payment_details: { ...(editUserData.payment_details || {}), account_number: e.target.value }
                        })} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Bank Name</Label>
                      <Input 
                        value={editUserData.payment_details?.bank_name || ''} 
                        onChange={e => setEditUserData({
                          ...editUserData, 
                          payment_details: { ...(editUserData.payment_details || {}), bank_name: e.target.value }
                        })} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Branch</Label>
                      <Input 
                        value={editUserData.payment_details?.branch || ''} 
                        onChange={e => setEditUserData({
                          ...editUserData, 
                          payment_details: { ...(editUserData.payment_details || {}), branch: e.target.value }
                        })} 
                      />
                    </div>
                  </div>
                  
                  {editUserData.assessment_fields && editUserData.assessment_fields.length > 0 && (
                     <div className="space-y-2">
                       <Label>Assessment Fields (Read-only)</Label>
                       <div className="flex flex-wrap gap-1">
                         {editUserData.assessment_fields.map((f: string, i: number) => (
                           <Badge key={i} variant="secondary">{f}</Badge>
                         ))}
                       </div>
                     </div>
                  )}
                </div>
              )}

              {['UNIVERSITY_COORDINATOR'].includes(editUserData.role) && (
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-muted-foreground border-b pb-1">University Details</h4>
                  <div className="space-y-2">
                    <Label>University</Label>
                    <Input value={editUserData.university || ''} onChange={e => setEditUserData({...editUserData, university: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Faculty</Label>
                    <Input value={editUserData.faculty || ''} onChange={e => setEditUserData({...editUserData, faculty: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Department</Label>
                    <Input value={editUserData.department || ''} onChange={e => setEditUserData({...editUserData, department: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Designation</Label>
                    <Input value={editUserData.designation || ''} onChange={e => setEditUserData({...editUserData, designation: e.target.value})} />
                  </div>
                </div>
              )}

            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewUserDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleEditUser} disabled={editUserLoading}>
              {editUserLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the user account for <strong>{selectedUser?.name}</strong>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete User"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}