import { X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface DateRangeFilterProps {
  fromDate: string;
  toDate: string;
  onFromDateChange: (date: string) => void;
  onToDateChange: (date: string) => void;
  onClear: () => void;
}

export function DateRangeFilter({
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  onClear,
}: DateRangeFilterProps) {
  const hasFilters = fromDate || toDate;

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-end">
      <div className="flex-1">
        <Label htmlFor="from-date" className="text-sm">
          From Date
        </Label>
        <Input
          id="from-date"
          type="date"
          value={fromDate}
          onChange={(e) => onFromDateChange(e.target.value)}
          max={toDate || undefined}
        />
      </div>
      <div className="flex-1">
        <Label htmlFor="to-date" className="text-sm">
          To Date
        </Label>
        <Input
          id="to-date"
          type="date"
          value={toDate}
          onChange={(e) => onToDateChange(e.target.value)}
          min={fromDate || undefined}
        />
      </div>
      {hasFilters && (
        <Button
          variant="outline"
          size="icon"
          onClick={onClear}
          title="Clear date filters"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
