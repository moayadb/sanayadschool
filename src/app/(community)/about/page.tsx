import { Info } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Info className="h-6 w-6" />
          About
        </h1>
      </div>
      <div className="bg-white rounded-lg border p-8 text-center text-muted-foreground">
        <p>About page will be implemented in Phase 8.</p>
        <p className="text-sm mt-2">Group description, cover image, rules, and guidelines.</p>
      </div>
    </div>
  );
}
