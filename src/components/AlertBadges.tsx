import {
  IconAlertTriangle,
  IconFlame,
  IconInfoCircle,
} from "@tabler/icons-react";
import type { StudentAlert } from "@/lib/stats/alerts";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STYLES: Record<StudentAlert["level"], string> = {
  warning:
    "border-loss/30 bg-loss/10 text-loss dark:text-loss",
  positive: "border-win/30 bg-win/10 text-win",
  info: "border-border bg-muted text-muted-foreground",
};

function Icon({ level }: { level: StudentAlert["level"] }) {
  if (level === "warning") return <IconAlertTriangle size={12} />;
  if (level === "positive") return <IconFlame size={12} />;
  return <IconInfoCircle size={12} />;
}

export function AlertBadges({ alerts }: { alerts: StudentAlert[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {alerts.map((a, i) => (
        <Badge
          key={i}
          variant="outline"
          className={cn("gap-1 font-normal", STYLES[a.level])}
        >
          <Icon level={a.level} />
          {a.message}
        </Badge>
      ))}
    </div>
  );
}
