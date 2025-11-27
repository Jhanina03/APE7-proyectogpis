import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { X, Upload, ImageUp } from "lucide-react";
import { CATEGORIES } from "@/lib/constants/categories";
import type { Product, ProductImage } from "@/lib/types/product";
import {
  useCreateProduct,
  useUpdateProduct,
} from "@/lib/hooks/useProductMutations";
import { AddressCombobox } from "@/components/ui/address-combobox";

// Form validation schema
const productFormSchema = z.object({
  name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(100, "Name must be less than 100 characters"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(500, "Description must be less than 500 characters"),
  price: z.number().min(0.01, "Price must be greater than 0"),
  type: z.enum(["PRODUCT", "SERVICE"]),
  category: z.string().min(1, "Category is required"),
  address: z.string().min(3, "Address is required"),
  serviceHours: z.string().optional(),
  availability: z.boolean(),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
}

export function ProductFormDialog({
  open,
  onOpenChange,
  product,
}: ProductFormDialogProps) {
  const [newImages, setNewImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<ProductImage[]>([]);
  const [imagesToRemove, setImagesToRemove] = useState<number[]>([]);
  const [coordinates, setCoordinates] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const isEditing = !!product;
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      type: "PRODUCT",
      category: "",
      address: "",
      serviceHours: "",
      availability: true,
    },
  });

  const watchedType = form.watch("type");

  // Load product data when editing
  useEffect(() => {
    if (open) {
      if (product) {
        // Edit mode: populate with product data
        form.reset({
          name: product.name,
          description: product.description,
          price: product.price,
          type: product.type,
          category: product.category,
          address: product.address || "",
          serviceHours: product.serviceHours || "",
          availability: product.availability,
        });
        setExistingImages(product.images || []);
        setImagesToRemove([]);
      } else {
        // Create mode: reset to default values
        form.reset({
          name: "",
          description: "",
          price: 0,
          type: "PRODUCT",
          category: "",
          address: "",
          serviceHours: "",
          availability: true,
        });
        setExistingImages([]);
        setImagesToRemove([]);
      }
      // Clear images when opening dialog
      setNewImages([]);
      setImagePreviews([]);
    }
  }, [product, open, form]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalImages =
      existingImages.length -
      imagesToRemove.length +
      newImages.length +
      files.length;

    if (totalImages > 5) {
      alert("Maximum 5 images allowed");
      return;
    }

    setNewImages((prev) => [...prev, ...files]);

    // Generate previews
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeNewImage = (index: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (imageId: number) => {
    setImagesToRemove((prev) => [...prev, imageId]);
  };

  const restoreExistingImage = (imageId: number) => {
    setImagesToRemove((prev) => prev.filter((id) => id !== imageId));
  };

  const onSubmit = async (values: ProductFormValues) => {
    try {
      if (isEditing && product) {
        await updateMutation.mutateAsync({
          id: product.id!,
          data: {
            ...values,
            latitude: coordinates?.latitude,
            longitude: coordinates?.longitude,
            images: newImages.length > 0 ? newImages : undefined,
            imagesToRemove:
              imagesToRemove.length > 0 ? imagesToRemove : undefined,
          },
        });
      } else {
        await createMutation.mutateAsync({
          ...values,
          latitude: coordinates?.latitude,
          longitude: coordinates?.longitude,
          images: newImages.length > 0 ? newImages : undefined,
        });
      }
      onOpenChange(false);
    } catch (error) {
      // Error handling is done in the mutation hooks
      console.error("Failed to save product:", error);
    }
  };

  const activeExistingImages = existingImages.filter(
    (img) => !imagesToRemove.includes(img.id)
  );
  const totalImages = activeExistingImages.length + newImages.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Product" : "Create New Product"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the details of your product"
              : "Fill in the details to create a new product listing"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Product Name<span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Enter product name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Description <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your product..."
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Type and Category */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Type <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="PRODUCT">Product</SelectItem>
                        <SelectItem value="SERVICE">Service</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Category <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.icon} {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Price and Adress */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Price ($)<span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Address <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <AddressCombobox
                        value={field.value}
                        onSelect={(location) => {
                          field.onChange(location.address);
                          setCoordinates({
                            latitude: location.latitude,
                            longitude: location.longitude,
                          });
                        }}
                        placeholder="Search for address..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Service Hours (conditional) */}
            {watchedType === "SERVICE" && (
              <FormField
                control={form.control}
                name="serviceHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Hours</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Mon-Fri 9AM-5PM" {...field} />
                    </FormControl>
                    <FormDescription>
                      Specify when your service is available
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Availability */}
            <FormField
              control={form.control}
              name="availability"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel htmlFor="availability">Available</FormLabel>
                    <FormDescription>
                      Mark this item as currently available for sale/service
                    </FormDescription>
                  </div>
                  <FormControl>
                    <input
                      id="availability"
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="h-4 w-4"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Images Upload */}
            <div className="space-y-2">
              <FormLabel>Images (Maximum 5)</FormLabel>
              <FormDescription>
                Upload product images. {totalImages}/5 images selected
              </FormDescription>

              {/* Existing Images */}
              {isEditing && existingImages.length > 0 && (
                <div className="grid grid-cols-3 gap-4 mb-4">
                  {existingImages.map((image) => {
                    const isRemoved = imagesToRemove.includes(image.id);
                    return (
                      <div
                        key={image.id}
                        className={`relative aspect-square rounded-md overflow-hidden border-2 ${
                          isRemoved
                            ? "opacity-50 border-red-500"
                            : "border-gray-300"
                        }`}
                      >
                        <img
                          src={image.url}
                          alt="Product"
                          className="w-full h-full object-cover"
                        />
                        <Button
                          type="button"
                          variant={isRemoved ? "default" : "destructive"}
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6"
                          onClick={() =>
                            isRemoved
                              ? restoreExistingImage(image.id)
                              : removeExistingImage(image.id)
                          }
                        >
                          {isRemoved ? (
                            <ImageUp className="h-3 w-3" />
                          ) : (
                            <X className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* New Images Preview */}
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-4 mb-4">
                  {imagePreviews.map((preview, index) => (
                    <div
                      key={index}
                      className="relative aspect-square rounded-md overflow-hidden border-2 border-primary"
                    >
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6"
                        onClick={() => removeNewImage(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Button */}
              {totalImages < 5 && (
                <div>
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                    id="image-upload"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() =>
                      document.getElementById("image-upload")?.click()
                    }
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Images
                  </Button>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "Saving..."
                  : isEditing
                  ? "Update Product"
                  : "Create Product"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
