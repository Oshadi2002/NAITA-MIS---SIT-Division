import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, ClipboardCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface AssessmentCardProps {
    completedStudents?: number;
    onClick: () => void;
    className?: string;
}

export function AssessmentCard({ onClick, completedStudents = 0, className }: AssessmentCardProps) {
    return (
        <Card
            className={cn(
                "flex flex-col h-full border-l-4 border-l-purple-600 shadow-sm hover:shadow-md transition-all duration-200",
                className
            )}
        >
            <CardHeader className="pb-2">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <ClipboardCheck className="h-5 w-5 text-purple-600" />
                    Assessment
                </CardTitle>
            </CardHeader>

            <CardContent className="flex-1 space-y-4">
                <div className="bg-muted/30 p-3 rounded-lg border mt-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase">Completed Students</p>
                    <p className="text-2xl font-bold tracking-tight">{completedStudents}</p>
                </div>
                <div className="text-xs text-muted-foreground italic pt-2">
                    Review and assess students who have completed their training process.
                </div>
            </CardContent>

            <CardFooter className="pt-2">
                <Button onClick={onClick} className="w-full group" style={{ backgroundColor: '#9333ea' }}>
                    Manage Assessments
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
            </CardFooter>
        </Card>
    );
}
