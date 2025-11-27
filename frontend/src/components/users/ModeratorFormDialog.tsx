import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCreateModerator } from "@/lib/hooks/useUserManagement";
import { validateCedula } from "@/lib/validations/cedula";
import { AddressCombobox } from "@/components/ui/address-combobox";

// Validation schema for moderator creation
const moderatorSchema = z.object({
  nationalId: z
    .string()
    .min(1, "National ID is required")
    .regex(/^\d{10}$/, "Please enter a valid 10-digit national ID")
    .refine((value) => validateCedula(value),
            'Please enter a valid national ID'),
  firstName: z
    .string()
    .min(1, "First name is required")
    .min(2, "Name must be at least 2 characters"),
  lastName: z
    .string()
    .min(1, "Last name is required")
    .min(2, "Name must be at least 2 characters"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  phone: z
    .string()
    .min(1, "Phone number is required")
    .regex(/^\d{10}$/, "Please enter a valid 10-digit phone number"),
  address: z.string().min(1, "Address is required"),
  gender: z.enum(["Male", "Female", "Other"]),
});

type ModeratorFormData = z.infer<typeof moderatorSchema>;

interface ModeratorFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ModeratorFormDialog({
  open,
  onOpenChange,
}: ModeratorFormDialogProps) {
  const createModeratorMutation = useCreateModerator();
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);

  const form = useForm<ModeratorFormData>({
    resolver: zodResolver(moderatorSchema),
    defaultValues: {
      nationalId: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      gender: undefined,
    },
  });

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      form.reset();
      setCoordinates(null);
    }
  }, [open, form]);

  const onSubmit = async (data: ModeratorFormData) => {
    try {
      await createModeratorMutation.mutateAsync({
        ...data,
        latitude: coordinates?.latitude,
        longitude: coordinates?.longitude,
      });
      onOpenChange(false);
    } catch (error) {
      // Error handling is done in the mutation hook
      console.log("error", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Moderator</DialogTitle>
          <DialogDescription>
            Create a new moderator account. An auto-generated password will be
            sent to their email address.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* National ID */}
            <FormField
              control={form.control}
              name="nationalId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>National ID</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="1234567890"
                      {...field}
                      maxLength={10}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* First Name and Last Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="john.doe@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Phone */}
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="0987654321"
                      {...field}
                      maxLength={10}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Address */}
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <AddressCombobox
                      value={field.value}
                      onSelect={(location) => {
                        field.onChange(location.address);
                        setCoordinates({ latitude: location.latitude, longitude: location.longitude });
                      }}
                      placeholder="Search for address..."
                      disabled={createModeratorMutation.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Gender */}
            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Action buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={createModeratorMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createModeratorMutation.isPending}
              >
                {createModeratorMutation.isPending
                  ? "Creating..."
                  : "Create Moderator"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
