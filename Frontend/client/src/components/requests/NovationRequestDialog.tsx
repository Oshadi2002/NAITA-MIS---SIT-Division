import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
        const data = Object.fromEntries(formData.entries());

        try {
            await axios.post('/api/novation-requests/', {
                student: student.id,
                ...data
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
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Request Novation (Change Placement)</DialogTitle>
                    <DialogDescription>
                        Request a change of placement for {student.full_name} ({student.student_reg_no}).
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={onSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Training Phase</Label>
                        <Select name="training_phase" required defaultValue="PHASE_1">
                            <SelectTrigger>
                                <SelectValue placeholder="Select Phase" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="PHASE_1">Phase 1</SelectItem>
                                <SelectItem value="PHASE_2">Phase 2</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2 col-span-2">
                            <Label>New Training Establishment Name</Label>
                            <Input name="requested_work_site" required placeholder="Name of the new establishment" />
                        </div>
                        <div className="space-y-2 col-span-2">
                            <Label>New Training Address</Label>
                            <Input name="new_training_address" required />
                        </div>
                        <div className="space-y-2">
                            <Label>New Training District</Label>
                            <Input name="new_training_district" required />
                        </div>
                        <div className="space-y-2">
                            <Label>New Divisional Secretariat</Label>
                            <Input name="new_divisional_secretariat" required />
                        </div>
                        <div className="space-y-2">
                            <Label>New Officer In Charge (OIC)</Label>
                            <Input name="new_officer_in_charge" required />
                        </div>
                        <div className="space-y-2">
                            <Label>New OIC Contact</Label>
                            <Input name="new_officer_in_charge_contact" />
                        </div>
                        <div className="space-y-2">
                            <Label>New Start Date</Label>
                            <Input name="new_training_start_date" type="date" required />
                        </div>
                        <div className="space-y-2">
                            <Label>New End Date</Label>
                            <Input name="new_training_end_date" type="date" required />
                        </div>
                        <div className="space-y-2">
                            <Label>New Duration</Label>
                            <Input name="new_training_duration" required placeholder="e.g. 6 Months" />
                        </div>
                        <div className="space-y-2">
                            <Label>New Field of Training</Label>
                            <Input name="new_field_of_training" required />
                        </div>
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
