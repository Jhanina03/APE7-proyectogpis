import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AlertCircle, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { ProductIncidents } from "@/lib/types/product";
import { useAppealIncident } from "@/lib/hooks/useModerationMutations";

// Form validation schema
const appealFormSchema = z.object({
  reason: z
    .string()
    .min(10, "Appeal reason must be at least 10 characters")
    .max(500, "Appeal reason must be less than 500 characters"),
});

type AppealFormValues = z.infer<typeof appealFormSchema>;

interface AppealIncidentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  incident: ProductIncidents;
  productName: string;
}

export function AppealIncidentDialog({
  open,
  onOpenChange,
  incident,
  productName,
}: AppealIncidentDialogProps) {
  const appealMutation = useAppealIncident();

  const form = useForm<AppealFormValues>({
    resolver: zodResolver(appealFormSchema),
    defaultValues: {
      reason: "",
    },
  });

  const watchedReason = form.watch("reason");
  const characterCount = watchedReason?.length || 0;

  const onSubmit = async (values: AppealFormValues) => {
    try {
      await appealMutation.mutateAsync({
        incidentId: incident.id,
        reason: values.reason,
      });
      onOpenChange(false);
      form.reset();
    } catch (error) {
      // Error handling is done in the mutation hook
      console.error("Failed to submit appeal:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "PENDING":
      case "PENGING": // Handle typo
        return "bg-amber-500";
      case "ACCEPTED":
        return "bg-green-500";
      case "REJECTED":
        return "bg-red-500";
      case "APPEALED":
        return "bg-purple-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Appeal Incident Report</DialogTitle>
          <DialogDescription>
            Explain why you believe this report is incorrect or unfair
          </DialogDescription>
        </DialogHeader>

        {/* Incident Info */}
        <div className="rounded-lg border p-4 bg-muted/50 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">{productName}</p>
            </div>
            <Badge className={getStatusColor(incident.status)}>
              {incident.status}
            </Badge>
          </div>

          {incident.comment && (
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground mb-1">
                Report Reason:
              </p>
              <p className="text-sm">{incident.comment}</p>
            </div>
          )}

          {incident.dateReported && (
            <div className="text-xs text-muted-foreground">
              Reported on {new Date(incident.dateReported).toLocaleDateString()}
            </div>
          )}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Appeal Reason */}
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Appeal Reason <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Explain why this report is incorrect. For example: 'This product does not contain any dangerous materials. It is a standard household item...'"
                      rows={6}
                      {...field}
                      // Ensure the value is properly controlled
                      value={field.value || ""}
                      onChange={(e) => {
                        field.onChange(e);
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    <div className="flex items-center justify-between">
                      <span>
                        Provide a detailed explanation for your appeal
                      </span>
                      <span
                        className={
                          characterCount < 10
                            ? "text-destructive"
                            : "text-muted-foreground"
                        }
                      >
                      </span>
                    </div>
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Warning Alert */}
            {incident.status === "APPEALED" ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  This incident has already been appealed. Submitting another
                  appeal will replace the previous one.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle className="text-sm font-medium">
                  Appeal Review Process
                </AlertTitle>
                <AlertDescription className="text-xs">
                  Your appeal will be reviewed by our moderation team. This
                  process may take 24-48 hours. You will be notified of the
                  decision.
                </AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={appealMutation.isPending}>
                {appealMutation.isPending ? "Submitting..." : "Submit Appeal"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
