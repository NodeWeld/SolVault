import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function NFTSkeleton() {
  return (
    <Card className="overflow-hidden border-border-subtle">
      <Skeleton className="aspect-square w-full rounded-none" />
      <CardContent className="space-y-2 p-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </CardContent>
    </Card>
  );
}
