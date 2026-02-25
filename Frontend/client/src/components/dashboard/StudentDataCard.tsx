import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, GraduationCap, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface StudentDataCardProps {
    totalStudents: number;
    uncheckedCount: number;
    onClick: () => void;
    className?: string;
}

export function StudentDataCard({
    totalStudents,
    uncheckedCount,
    onClick,
    className,
}: StudentDataCardProps) {
    return (
        <Card
            className={cn(
                "flex flex-col h-full border-l-4 border-l-green-600 shadow-sm hover:shadow-md transition-all duration-200",
                className
            )}
        >
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <GraduationCap className="h-5 w-5 text-green-600" />
                        Student Data
                    </CardTitle>
                    {uncheckedCount > 0 && (
                        <Badge className="bg-green-600 hover:bg-green-700 animate-pulse">
                            {uncheckedCount} New
                        </Badge>
                    )}
                </div>
            </CardHeader>

            <CardContent className="flex-1 space-y-4">
                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="bg-muted/30 p-3 rounded-lg border">
                        <p className="text-xs font-medium text-muted-foreground uppercase">Total Students</p>
                        <p className="text-2xl font-bold tracking-tight">{totalStudents}</p>
                    </div>
                    <div className="bg-muted/30 p-3 rounded-lg border">
                        <p className="text-xs font-medium text-muted-foreground uppercase">Unchecked</p>
                        <p className={cn("text-2xl font-bold tracking-tight", uncheckedCount > 0 ? "text-amber-600" : "")}>
                            {uncheckedCount}
                        </p>
                    </div>
                </div>

                <div className="text-xs text-muted-foreground italic pt-2">
                    Manage links and verify student submissions.
                </div>
            </CardContent>

            <CardFooter className="pt-2">
                <Button onClick={onClick} className="w-full group" variant="default" style={{ backgroundColor: '#16a34a' }}> {/* Green-600 */}
                    Manage Student Data
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
            </CardFooter>
        </Card>
    );
}
