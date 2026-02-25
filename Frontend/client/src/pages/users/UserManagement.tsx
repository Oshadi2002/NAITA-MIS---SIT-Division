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
import { Plus, Search, Shield, UserCog, Trash2, KeyRound, Clock, CheckCircle2, XCircle, Mail } from "lucide-react";
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

interface PendingRegistration {
  id: number;
  full_name: string;
  email: string;
  university: string;
  faculty: string;
  department: string;
  designation: string;
  phone_number: string;
  whatsapp_number: string;
  submitted_at: string;
  status: string;
}

export default function UserManagement() {
  const { users, createUser, resetPassword, deleteUser } = useStore();
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  // Form state
  const [isOpen, setIsOpen] = useState(false);
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

  // ─── Pending Registrations ──────────────────────────────────────────────────
  const [pendingList, setPendingList] = useState<PendingRegistration[]>([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [selectedPending, setSelectedPending] = useState<PendingRegistration | null>(null);
  const [approveUsername, setApproveUsername] = useState("");
  const [approvePassword, setApprovePassword] = useState("");
  const [rejectNote, setRejectNote] = useState("");

  const fetchPending = async () => {
    setPendingLoading(true);
    try {
      const res = await fetch('/api/coordinator-invites/list_pending/', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setPendingList(data);
      }
    } catch (e) {
      // silent
    } finally {
      setPendingLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleApprovePending = async () => {
    if (!selectedPending || !approveUsername || !approvePassword) {
      toast({ title: "Missing Fields", description: "Username and password are required.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/coordinator-invites/${selectedPending.id}/approve_pending/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username: approveUsername, password: approvePassword })
      });
      const data = await res.json();

      if (res.ok) {
        toast({ title: "Approved!", description: `${selectedPending.full_name}'s account has been created.` });

        // Open email client with credentials
        if (selectedPending.email) {
          const subject = encodeURIComponent(`Your University Coordinator Account – Login Credentials`);
          const emailBody = encodeURIComponent(
            `Hello ${selectedPending.full_name},\n\nYour University Coordinator account has been approved!\n\n` +
            `Login Credentials:\nUsername: ${approveUsername}\nPassword: ${approvePassword}\n\n` +
            `Please log in at: ${window.location.origin}/login\n\nThank you.`
          );
          window.open(`mailto:${selectedPending.email}?subject=${subject}&body=${emailBody}`, '_blank');
        }

        setApproveOpen(false);
        setApproveUsername("");
        setApprovePassword("");
        setSelectedPending(null);
        fetchPending();
        // Refresh users list
        window.location.reload();
      } else {
        toast({ title: "Error", description: data.message || "Failed to approve.", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Error", description: "Network error.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleRejectPending = async () => {
    if (!selectedPending) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/coordinator-invites/${selectedPending.id}/reject_pending/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ note: rejectNote })
      });
      if (res.ok) {
        toast({ title: "Rejected", description: "Registration request rejected." });
        setRejectOpen(false);
        setRejectNote("");
        setSelectedPending(null);
        fetchPending();
      } else {
        const data = await res.json();
        toast({ title: "Error", description: data.message, variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Error", description: "Network error.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // ─── Existing Users ─────────────────────────────────────────────────────────
  const filteredUsers = users.filter(u => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.username && u.username.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesUni = filterUniversity === "ALL" || u.university === filterUniversity;
    const matchesFac = filterFaculty === "ALL" || u.faculty === filterFaculty;
    return matchesSearch && matchesUni && matchesFac;
  });

  const universities = Array.from(new Set(users.map(u => u.university).filter((v): v is string => !!v)));
  const faculties = Array.from(new Set(users.map(u => u.faculty).filter((v): v is string => !!v)));

  const handleSubmit = async () => {
    if (!formData.name || !formData.email || !formData.role || !formData.password || !formData.username) {
      toast({ title: "Missing fields", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await createUser(formData);
      toast({ title: "Success", description: "User account created successfully." });
      setIsOpen(false);
      setFormData({ name: "", username: "", email: "", role: "", password: "", university: "", faculty: "", department: "", designation: "", phone_number: "", whatsapp_number: "" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to create user.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser || !newPassword) return;
    setLoading(true);
    try {
      await resetPassword(selectedUser.id, newPassword);
      toast({ title: "Success", description: "Password reset successfully." });
      setResetDialogOpen(false);
      setNewPassword("");
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to reset password.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    setLoading(true);
    try {
      await deleteUser(selectedUser.id);
      toast({ title: "Success", description: "User deleted successfully." });
      setDeleteDialogOpen(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to delete user.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // ─── Invite State ────────────────────────────────────────────────────────────
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLink, setInviteLink] = useState("");

  const handleInvite = async () => {
    if (!inviteEmail) {
      toast({ title: "Email Required", description: "Please enter the coordinator's email address.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/coordinator-invites/create_invite/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: inviteEmail })
      });
      const data = await res.json();
      if (res.ok) {
        const link = `${window.location.origin}/register-coordinator/${data.token}`;
        setInviteLink(link);
        toast({ title: "Invite Link Generated", description: "Share this link with the coordinator via email." });
      } else {
        toast({ title: "Error", description: data.message || "Failed to generate invite.", variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "Error", description: "Network error.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    toast({ title: "Copied", description: "Link copied to clipboard." });
  };

  const shareEmail = () => {
    const subject = encodeURIComponent(`University Coordinator Registration Invitation`);
    const body = encodeURIComponent(
      `Hello,\n\nPlease fill in your University Coordinator registration details using the link below:\n\n${inviteLink}\n\nThis link is unique to you and can only be used once.\n\nThank you.`
    );
    window.open(`mailto:${inviteEmail}?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-serif font-bold tracking-tight text-primary">User Management</h2>
          <p className="text-muted-foreground">Manage institutional accounts and coordinator requests.</p>
        </div>

        <div className="flex gap-2">
          {/* Invite Coordinator Button */}
          <Dialog open={inviteOpen} onOpenChange={v => { setInviteOpen(v); if (!v) { setInviteLink(""); setInviteEmail(""); } }}>
            <DialogTrigger asChild>
              <Button variant="outline"><Mail className="mr-2 h-4 w-4 text-primary" /> Invite Coordinator</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite University Coordinator</DialogTitle>
                <DialogDescription>Generate a registration link and send it to the coordinator via email.</DialogDescription>
              </DialogHeader>

              {!inviteLink ? (
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Coordinator's Email Address</Label>
                    <Input
                      type="email"
                      placeholder="e.g. coordinator@university.edu"
                      value={inviteEmail}
                      onChange={e => setInviteEmail(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">The coordinator will fill their own details via the link. You will review and approve.</p>
                  </div>
                  <Button onClick={handleInvite} disabled={loading} className="w-full">
                    {loading ? "Generating..." : "Generate Invite Link"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 py-4">
                  <p className="text-xs text-muted-foreground">Sending to: <strong>{inviteEmail}</strong></p>
                  <div className="p-4 bg-muted rounded-md break-all text-sm font-mono">{inviteLink}</div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={copyToClipboard}>Copy Link</Button>
                    <Button className="flex-1" onClick={shareEmail}>
                      <Mail className="mr-2 h-4 w-4" /> Send via Email
                    </Button>
                  </div>
                  <Button variant="ghost" className="w-full" onClick={() => { setInviteLink(""); setInviteEmail(""); }}>
                    Generate Another
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Create User (Admin / Inspector) */}
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="shadow-lg"><Plus className="mr-2 h-4 w-4" /> Create User</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
                <DialogDescription>Add a new Administrator or Inspector account.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="John Doe" />
                  </div>
                  <div className="space-y-2">
                    <Label>Username</Label>
                    <Input value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} placeholder="johndoe" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="john@example.com" />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={formData.role} onValueChange={value => setFormData({ ...formData, role: value })}>
                    <SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">Administrator</SelectItem>
                      <SelectItem value="INSPECTOR">Inspector</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} placeholder="Set account password" />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleSubmit} disabled={loading}>{loading ? "Creating..." : "Create Account"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* ── Pending Coordinator Approvals ── */}
      {(pendingList.length > 0 || pendingLoading) && (
        <div className="rounded-md border border-amber-200 bg-amber-50 overflow-hidden shadow-sm">
          <div className="flex items-center gap-3 p-4 border-b border-amber-200 bg-amber-100">
            <Clock className="h-5 w-5 text-amber-600" />
            <div>
              <h3 className="font-semibold text-amber-800">Pending Coordinator Approvals</h3>
              <p className="text-xs text-amber-600">These coordinators have submitted their details and are waiting for your approval.</p>
            </div>
            <Badge className="ml-auto bg-amber-600 text-white">{pendingList.length} Pending</Badge>
          </div>

          {pendingLoading ? (
            <div className="p-6 text-center text-muted-foreground text-sm">Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-amber-50">
                  <TableHead>Name & Email</TableHead>
                  <TableHead>University / Faculty</TableHead>
                  <TableHead>Department / Designation</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingList.map(p => (
                  <TableRow key={p.id} className="bg-white">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{p.full_name}</span>
                        <span className="text-xs text-muted-foreground">{p.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-sm">
                        <span className="font-medium">{p.university || "-"}</span>
                        <span className="text-xs text-muted-foreground">{p.faculty || "-"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-sm">
                        <span>{p.department || "-"}</span>
                        <span className="text-xs text-muted-foreground">{p.designation || "-"}</span>
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
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => {
                            setSelectedPending(p);
                            // Suggest a username from name
                            setApproveUsername(p.full_name.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z.]/g, ''));
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
          )}
        </div>
      )}

      {/* ── Search & Filter ── */}
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
          <SelectTrigger className="w-[180px] h-9"><SelectValue placeholder="University" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Universities</SelectItem>
            {universities.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterFaculty} onValueChange={setFilterFaculty}>
          <SelectTrigger className="w-[180px] h-9"><SelectValue placeholder="Faculty" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Faculties</SelectItem>
            {faculties.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* ── Users Table ── */}
      <div className="rounded-md border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>User / Role</TableHead>
              <TableHead>Contact Info</TableHead>
              <TableHead>Institution</TableHead>
              <TableHead>Department</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map(user => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">{user.name}</span>
                    <span className="text-xs text-muted-foreground">@{user.username}</span>
                    <div className="flex items-center gap-1 mt-1">
                      {user.role === 'ADMIN' ? (
                        <Shield className="h-3 w-3 text-primary" />
                      ) : (
                        <UserCog className="h-3 w-3 text-muted-foreground" />
                      )}
                      <span className="text-xs capitalize">{user.role.replace('_', ' ').toLowerCase()}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col text-sm">
                    <span>{user.email}</span>
                    {user.phone_number && <span className="text-xs text-muted-foreground">Tel: {user.phone_number}</span>}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col text-sm">
                    <span className="font-medium">{user.university || "-"}</span>
                    {user.faculty && <span className="text-xs text-muted-foreground">{user.faculty}</span>}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col text-sm">
                    <span>{user.department || "-"}</span>
                    {user.designation && <span className="text-xs text-muted-foreground">{user.designation}</span>}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm"
                      onClick={() => { setSelectedUser(user); setResetDialogOpen(true); }}
                      title="Reset Password">
                      <KeyRound className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => { setSelectedUser(user); setDeleteDialogOpen(true); }}
                      title="Delete User">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* ── Approve Dialog ── */}
      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Coordinator — Set Login Credentials</DialogTitle>
            <DialogDescription>
              Approve <strong>{selectedPending?.full_name}</strong> and assign their login credentials.
              These will be emailed to: <span className="text-primary font-medium">{selectedPending?.email}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="grid grid-cols-2 gap-4 p-3 bg-muted rounded-md text-sm">
              <div><span className="text-muted-foreground">University:</span><br /><strong>{selectedPending?.university}</strong></div>
              <div><span className="text-muted-foreground">Faculty:</span><br /><strong>{selectedPending?.faculty || "-"}</strong></div>
              <div><span className="text-muted-foreground">Department:</span><br /><strong>{selectedPending?.department || "-"}</strong></div>
              <div><span className="text-muted-foreground">Designation:</span><br /><strong>{selectedPending?.designation || "-"}</strong></div>
            </div>
            <div className="space-y-2">
              <Label>Username <span className="text-red-500">*</span></Label>
              <Input
                value={approveUsername}
                onChange={e => setApproveUsername(e.target.value)}
                placeholder="e.g. john.doe"
              />
            </div>
            <div className="space-y-2">
              <Label>Password <span className="text-red-500">*</span></Label>
              <Input
                type="text"
                value={approvePassword}
                onChange={e => setApprovePassword(e.target.value)}
                placeholder="Set a password for this coordinator"
              />
              <p className="text-xs text-muted-foreground">This will open your email client to send the credentials to the coordinator.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveOpen(false)}>Cancel</Button>
            <Button onClick={handleApprovePending} disabled={loading}>
              <Mail className="mr-2 h-4 w-4" />
              {loading ? "Approving..." : "Approve & Send via Email"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Reject Dialog ── */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Registration Request</DialogTitle>
            <DialogDescription>
              Reject the registration request from <strong>{selectedPending?.full_name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Label>Reason (Optional)</Label>
            <Input
              value={rejectNote}
              onChange={e => setRejectNote(e.target.value)}
              placeholder="e.g. Incomplete information"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleRejectPending} disabled={loading}>
              {loading ? "Rejecting..." : "Confirm Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Reset Password Dialog ── */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>Set a new password for {selectedUser?.name}.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Label>New Password</Label>
            <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Enter new password" />
          </div>
          <DialogFooter>
            <Button onClick={handleResetPassword} disabled={loading}>{loading ? "Resetting..." : "Reset Password"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ── */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the user account for <strong>{selectedUser?.name}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? "Deleting..." : "Delete User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
