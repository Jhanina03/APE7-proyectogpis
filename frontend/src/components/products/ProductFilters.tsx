import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CATEGORIES } from "@/lib/constants/categories";
import type {
  ProductFilters as Filters,
  ProductType,
  Category,
} from "@/lib/types/product";
import { cn } from "@/lib/utils";

interface ProductFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  className?: string;
  hideCategoryFilter?: boolean;
}

export function ProductFilters({
  filters,
  onFiltersChange,
  className,
  hideCategoryFilter = false,
}: ProductFiltersProps) {
  const [priceRange, setPriceRange] = useState<[number | null, number | null]>([
    filters.minPrice ?? 0,
    filters.maxPrice ?? 10000,
  ]);
  const [nearbyRadiusInput, setNearbyRadiusInput] = useState<number | null>(
    filters.nearbyRadius ?? 10
  );

  const handleTypeChange = (value: string) => {
    onFiltersChange({
      ...filters,
      type: value as ProductType | "all",
    });
  };

  const handleCategoryChange = (category: Category) => {
    onFiltersChange({
      ...filters,
      category: filters.category === category ? "all" : category,
    });
  };

  const handleAvailabilityChange = () => {
    onFiltersChange({
      ...filters,
      availability: filters.availability ? undefined : true,
    });
  };

  const clearFilters = () => {
    setPriceRange([0, 10000]);
    onFiltersChange({
      category: "all",
      type: "all",
      minPrice: 0,
      maxPrice: 10000,
      availability: undefined,
      nearbyMode: false,
      nearbyRadius: 10,
    });
  };

  const hasActiveFilters =
    filters.category !== "all" ||
    filters.type !== "all" ||
    filters.minPrice !== 0 ||
    filters.maxPrice !== 10000 ||
    filters.availability ||
    filters.nearbyMode;

  return (
    <div className={cn("space-y-6 p-4 sm:p-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Filters</h3>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="mr-1 h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      <Separator />

      {/* Type Filter */}
      <div className="space-y-3">
        <Label>Type</Label>
        <Tabs value={filters.type || "all"} onValueChange={handleTypeChange}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="PRODUCT">Products</TabsTrigger>
            <TabsTrigger value="SERVICE">Services</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Separator />

      {/* Price Range Filter */}
      <div className="space-y-4">
        <Label>Price Range</Label>

        {/* Inputs Manuales */}
        <div className="flex items-center gap-2">
          <div className="w-full">
            <Label className="text-xs text-muted-foreground">Min</Label>
            <input
              type="number"
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Min"
              value={priceRange[0] === null ? "" : priceRange[0]}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "") {
                  setPriceRange([null, priceRange[1]]);
                } else {
                  setPriceRange([Number(val), priceRange[1]]);
                }
              }}
            />
          </div>

          <div className="w-full">
            <Label className="text-xs text-muted-foreground">Max</Label>
            <input
              type="number"
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Max"
              value={priceRange[1] === null ? "" : priceRange[1]}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "") {
                  setPriceRange([priceRange[0], null]);
                } else {
                  setPriceRange([priceRange[0], Number(val)]);
                }
              }}
            />
          </div>
        </div>

        {/* Slider — solo cuando ambos valores existen */}
        <Slider
          value={[priceRange[0] ?? 0, priceRange[1] ?? 10000]}
          onValueChange={(value) => setPriceRange([value[0], value[1]])}
          max={10000}
          step={10}
          className="w-full"
        />

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">${priceRange[0] ?? 0}</span>
          <span className="text-muted-foreground">
            ${priceRange[1] ?? 10000}
          </span>
        </div>

        {(priceRange[0] !== filters.minPrice ||
          priceRange[1] !== filters.maxPrice) && (
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            onClick={() =>
              onFiltersChange({
                ...filters,
                minPrice: priceRange[0] ?? undefined,
                maxPrice: priceRange[1] ?? undefined,
              })
            }
          >
            Apply Price Filter
          </Button>
        )}
      </div>

      <Separator />

      {/* Category Filter - Hidden on CategoryPage */}
      {!hideCategoryFilter && (
        <>
          <div className="space-y-3">
            <Label>Category</Label>

            {/* Lista vertical */}
            <ul className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-2">
              {CATEGORIES.map((category) => (
                <li key={category.id}>
                  <button
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md ${
                      filters.category === category.id
                        ? "bg-primary text-white"
                        : "bg-transparent text-muted-foreground hover:bg-gray-100"
                    }`}
                    onClick={() => handleCategoryChange(category.id)}
                  >
                    <span>{category.icon}</span>
                    {category.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <Separator />
        </>
      )}

      {/* Availability Filter */}
      <div className="space-y-3">
        <Label>Availability</Label>
        <Button
          variant={filters.availability ? "default" : "outline"}
          size="sm"
          className="w-full justify-start"
          onClick={handleAvailabilityChange}
        >
          Show only available items
        </Button>
      </div>

      <Separator />

      {/* Nearby Products Filter */}
      <div className="space-y-3">
        <Label>Nearby Products</Label>
        <div className="space-y-4">
          {/* Toggle Button */}
          <Button
            variant={filters.nearbyMode ? "default" : "outline"}
            size="sm"
            className="w-full justify-start"
            onClick={() =>
              onFiltersChange({
                ...filters,
                nearbyMode: !filters.nearbyMode,
                nearbyRadius: filters.nearbyRadius || 10,
              })
            }
          >
            {filters.nearbyMode
              ? "📍 Showing nearby products"
              : "Show nearby products"}
          </Button>

          {/* Radius Input + Slider */}
          <div className={filters.nearbyMode ? "" : "hidden"}>
            <div className="flex items-center gap-2">
              <div className="w-full">
                <Label className="text-xs text-muted-foreground">
                  Radius (km)
                </Label>
                <input
                  type="number"
                  className="w-full rounded-md border px-3 py-2 text-sm"
                  min={10}
                  max={100}
                  value={nearbyRadiusInput ?? ""}
                  onChange={(e) =>
                    setNearbyRadiusInput(
                      e.target.value === "" ? null : Number(e.target.value)
                    )
                  }
                  onBlur={() =>
                    onFiltersChange({
                      ...filters,
                      nearbyRadius: nearbyRadiusInput ?? 10,
                    })
                  }
                />
              </div>
            </div>

            <Slider
              value={[filters.nearbyRadius ?? 10]}
              onValueChange={(value) => {
                setNearbyRadiusInput(value[0]);
                onFiltersChange({ ...filters, nearbyRadius: value[0] });
              }}
              min={10}
              max={100}
              step={1}
              className="w-full"
            />

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>10km</span>
              <span>100km</span>
            </div>

            <p className="text-xs text-muted-foreground">
              Based on your profile address
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
