import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface MonitoringCardProps {
    activeMonitors?: number;
    onClick: () => void;
    className?: string;
}

export function MonitoringCard({ onClick, activeMonitors = 0, className }: MonitoringCardProps) {
    return (
        <Card
            className={cn(
                "flex flex-col h-full border-l-4 border-l-orange-500 shadow-sm hover:shadow-md transition-all duration-200",
                className
            )}
        >
            <CardHeader className="pb-2">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Activity className="h-5 w-5 text-orange-500" />
                    Monitoring
                </CardTitle>
            </CardHeader>

            <CardContent className="flex-1 space-y-4">
                <div className="bg-muted/30 p-3 rounded-lg border mt-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase">Active Sessions</p>
                    <p className="text-2xl font-bold tracking-tight">{activeMonitors}</p>
                </div>
                <div className="text-xs text-muted-foreground italic pt-2">
                    Track and manage real-time monitoring of students and inspectors.
                </div>
            </CardContent>

            <CardFooter className="pt-2">
                <Button onClick={onClick} className="w-full group" style={{ backgroundColor: '#f97316' }}>
                    Open Monitoring
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
            </CardFooter>
        </Card>
    );
}
