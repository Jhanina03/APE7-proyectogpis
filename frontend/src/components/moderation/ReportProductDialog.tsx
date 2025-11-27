import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Product } from '@/lib/types/product';
import type { ReportType } from '@/lib/api/moderation';
import { useCreateReport } from '@/lib/hooks/useModerationMutations';
import { useAuth } from '@/contexts/AuthContext';
import { getProductThumbnail } from '@/lib/utils/imageUtils';

// Report options with descriptions
const REPORT_OPTIONS: { value: ReportType; label: string; description: string; icon: string }[] = [
  {
    value: 'DANGEROUS',
    label: 'Dangerous',
    description: 'Weapons, drugs, or harmful items',
    icon: '🚫',
  },
  {
    value: 'FRAUD',
    label: 'Fraud',
    description: 'Scam or misleading product',
    icon: '💸',
  },
  {
    value: 'INAPPROPRIATE',
    label: 'Inappropriate',
    description: 'Offensive or adult content',
    icon: '⚠️',
  },
  {
    value: 'OTHER',
    label: 'Other',
    description: 'Other violations',
    icon: '📦',
  },
];

// Form validation schema
const reportFormSchema = z.object({
  type: z.enum(['DANGEROUS', 'FRAUD', 'INAPPROPRIATE', 'OTHER']),
  comment: z.string().optional(),
});

type ReportFormValues = z.infer<typeof reportFormSchema>;

interface ReportProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product;
}

export function ReportProductDialog({ open, onOpenChange, product }: ReportProductDialogProps) {
  const { user } = useAuth();
  const createReportMutation = useCreateReport();

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: {
      type: undefined,
      comment: '',
    },
  });

  const onSubmit = async (values: ReportFormValues) => {
    if (!user) {
      return;
    }

    try {
      await createReportMutation.mutateAsync({
        reporterId: user.id,
        productId: product.id,
        type: values.type,
        comment: values.comment || undefined,
      });
      onOpenChange(false);
      form.reset();
    } catch (error) {
      // Error handling is done in the mutation hook
      console.error('Failed to submit report:', error);
    }
  };

  const thumbnailUrl = getProductThumbnail(product.images);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Report Product</DialogTitle>
          <DialogDescription>
            Help us keep the marketplace safe by reporting problematic content
          </DialogDescription>
        </DialogHeader>

        {/* Product Info */}
        <div className="flex items-center gap-3 rounded-lg border p-3 bg-muted/50">
          <img
            src={thumbnailUrl}
            alt={product.name}
            className="h-16 w-16 rounded object-cover"
          />
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{product.name}</p>
            <p className="text-sm text-muted-foreground truncate">${product.price}</p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Report Type */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Report Type <span className='text-destructive'>*</span></FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a report type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {REPORT_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <span>{option.icon}</span>
                            <div>
                              <div className="font-medium">{option.label}</div>
                              <div className="text-xs text-muted-foreground">
                                {option.description}
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Optional Comment */}
            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Details (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Provide any additional information that might help us review this report..."
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Warning */}
            <Alert className="flex justify-start items-center gap-2 bg-yellow-50 border-yellow-200 text-yellow-800">
              <AlertTriangle className="h-4 w-4" color='oklch(47.6% 0.114 61.907)' />
              <AlertDescription className="text-sm">
                False reports may result in action against your account. Please only report genuine
                violations.
              </AlertDescription>
            </Alert>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createReportMutation.isPending}>
                {createReportMutation.isPending ? 'Submitting...' : 'Submit Report'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
