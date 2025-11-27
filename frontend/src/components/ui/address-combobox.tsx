import { useState, useEffect, useCallback } from "react";
import { Check, ChevronsUpDown, Loader2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { nominatimApi } from "@/lib/api/nominatim";
import type { NominatimLocation } from "@/lib/types/nominatim";

interface AddressComboboxProps {
  value?: string;
  latitude?: number;
  longitude?: number;
  onSelect: (location: {
    address: string;
    latitude: number;
    longitude: number;
  }) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function AddressCombobox({
  value,
  onSelect,
  placeholder = "Search for your address...",
  disabled = false,
}: AddressComboboxProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value || "");
  const [options, setOptions] = useState<NominatimLocation[]>([]);
  const [loading, setLoading] = useState(false);

  const searchAddresses = useCallback(async (query: string) => {
    if (query.trim().length < 5) {
      setOptions([]);
      return;
    }

    setLoading(true);
    try {
      const results = await nominatimApi.searchAddresses(query);
      setOptions(results);
    } catch (error) {
      console.error("Search failed:", error);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      searchAddresses(inputValue);
    }, 1000);

    return () => clearTimeout(timer);
  }, [inputValue, searchAddresses]);

  useEffect(() => {
    if (value !== undefined) {
      setInputValue(value);
    }
  }, [value]);

  const handleSelect = (location: NominatimLocation) => {
    setInputValue(location.address);
    setOpen(false);
    onSelect({
      address: location.address,
      latitude: location.latitude,
      longitude: location.longitude,
    });
  };

  const processAddress = (address: string, desicion: string = "main") => {
    const addressParts = address.split(",").map((part) => part.trim());
    if (desicion === "country") {
      let country = "";
      if (addressParts.length >= 1) {
        country = addressParts.slice(-3).join(", ");
      } else {
        country = address;
      }
      return country;
    }
    let mainAddress = "";
    if (addressParts.length >= 3) {
      mainAddress = addressParts.slice(0, -3).join(", ");
    } else {
      mainAddress = address;
    }

    return mainAddress;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between overflow-hidden"
          disabled={disabled}
        >
          <span className="truncate min-w-0">{inputValue || placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-1" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Type to search (min 5 characters)..."
            value={inputValue}
            onValueChange={setInputValue}
          />
          <CommandList>
            {loading && (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm text-muted-foreground">
                  Searching...
                </span>
              </div>
            )}

            {!loading && inputValue.length > 0 && inputValue.length < 5 && (
              <CommandEmpty>Type at least 5 characters to search</CommandEmpty>
            )}

            {!loading && inputValue.length >= 5 && options.length === 0 && (
              <CommandEmpty>
                No locations found. Try a different search.
              </CommandEmpty>
            )}

            {!loading && options.length > 0 && (
              <CommandGroup>
                {options.map((location, index) => (
                  <CommandItem
                    key={`${location.latitude}-${location.longitude}-${index}`}
                    value={location.address}
                    onSelect={() => handleSelect(location)}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        inputValue === location.address
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                    <div className="flex flex-col">
                      <span className="text-sm">
                        {processAddress(location.address)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {processAddress(location.address, "country")}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
