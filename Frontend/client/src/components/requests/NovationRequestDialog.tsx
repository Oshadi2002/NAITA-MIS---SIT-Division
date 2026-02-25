import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import { Loader2 } from "lucide-react";

interface StudentSubmission {
    id: number;
    full_name: string;
    student_reg_no: string;
}

interface NovationRequestDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    student: StudentSubmission | null;
    onSuccess: () => void;
}

export function NovationRequestDialog({ open, onOpenChange, student, onSuccess }: NovationRequestDialogProps) {
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    if (!student) return null;

    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);

        try {
            await axios.post('/api/novation-requests/', {
                student: student.id,
                requested_work_site: formData.get('requested_work_site'),
                reason: formData.get('reason'),
            });
            toast({ title: "Request Submitted", description: "Novation request sent to Admin." });
            onOpenChange(false);
            onSuccess();
        } catch (error) {
            console.error(error);
            toast({ title: "Submission Failed", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Request Novation (Change Placement)</DialogTitle>
                    <DialogDescription>
                        Request a change of placement for {student.full_name} ({student.student_reg_no}).
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={onSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Requested Training Work Site</Label>
                        <Input name="requested_work_site" required placeholder="e.g. ABC Technologies, Colombo" />
                    </div>
                    <div className="space-y-2">
                        <Label>Reason for Change</Label>
                        <Textarea name="reason" required placeholder="Please explain why this change is needed..." />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Submit Request
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
