import { useState } from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import { Loader2, Save, User } from "lucide-react";

export default function CoordinatorProfile() {
    const { currentUser, initialize } = useStore();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: currentUser?.name || "",
        university: currentUser?.university || "",
        faculty: currentUser?.faculty || "",
        department: currentUser?.department || "",
        designation: currentUser?.designation || "",
        phone_number: currentUser?.phone_number || "",
        whatsapp_number: currentUser?.whatsapp_number || ""
    });

    if (!currentUser) return <div>Loading...</div>;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await axios.put('/api/management/update_profile/', formData);
            toast({
                title: "Profile Updated",
                description: "Your information has been saved successfully.",
            });
            // Refresh local user state
            initialize();
        } catch (error: any) {
            toast({
                title: "Update Failed",
                description: error.response?.data?.message || "Could not update profile.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div>
                <h2 className="text-3xl font-serif font-bold tracking-tight text-primary">My Profile</h2>
                <p className="text-muted-foreground">Manage your coordinator details and contact information.</p>
            </div>

            <Card>
                <form onSubmit={handleSubmit}>
                    <CardHeader>
                        <div className="flex items-center gap-4">
                            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                                <User className="h-8 w-8 text-primary" />
                            </div>
                            <div>
                                <CardTitle>{currentUser.name}</CardTitle>
                                <CardDescription>@{currentUser.username}</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">

                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Identity (Read-onlyish or core fields) */}
                            <div className="space-y-2">
                                <Label>Full Name</Label>
                                <Input
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Email Address</Label>
                                <Input value={currentUser.email} disabled className="bg-muted" />
                                <p className="text-xs text-muted-foreground">Contact admin to change email.</p>
                            </div>

                            {/* Institution Details */}
                            <div className="space-y-2">
                                <Label>University</Label>
                                <Input
                                    value={formData.university}
                                    onChange={e => setFormData({ ...formData, university: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Faculty</Label>
                                <Input
                                    value={formData.faculty}
                                    onChange={e => setFormData({ ...formData, faculty: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Department</Label>
                                <Input
                                    value={formData.department}
                                    onChange={e => setFormData({ ...formData, department: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Designation</Label>
                                <Input
                                    value={formData.designation}
                                    onChange={e => setFormData({ ...formData, designation: e.target.value })}
                                    placeholder="e.g. Senior Lecturer"
                                />
                            </div>

                            {/* Contact Info */}
                            <div className="space-y-2">
                                <Label>Phone Number</Label>
                                <Input
                                    value={formData.phone_number}
                                    onChange={e => setFormData({ ...formData, phone_number: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>WhatsApp Number</Label>
                                <Input
                                    value={formData.whatsapp_number}
                                    onChange={e => setFormData({ ...formData, whatsapp_number: e.target.value })}
                                    placeholder="e.g. 0771234567"
                                />
                            </div>
                        </div>

                    </CardContent>
                    <CardFooter className="flex justify-end bg-muted/20 p-6">
                        <Button type="submit" disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Save Changes
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
