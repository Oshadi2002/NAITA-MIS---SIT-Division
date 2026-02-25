import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowRight, LucideIcon } from "lucide-react";

interface DashboardCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  onClick: () => void;
  className?: string;
}

export function DashboardCard({
  title,
  description,
  icon: Icon,
  onClick,
  className,
}: DashboardCardProps) {
  return (
    <Card 
      onClick={onClick}
      className={cn(
        "cursor-pointer group hover:shadow-lg transition-all duration-200 border-l-4 border-l-primary/10 hover:border-l-primary",
        className
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-bold text-primary group-hover:text-primary/80 transition-colors">
          {title}
        </CardTitle>
        <Icon className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          {description}
        </p>
        <div className="flex items-center text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">
          Access Management <ArrowRight className="ml-2 h-4 w-4" />
        </div>
      </CardContent>
    </Card>
  );
}
