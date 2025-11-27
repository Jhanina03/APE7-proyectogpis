import { Link } from "react-router-dom";
import { CATEGORIES } from "@/lib/constants/categories";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CategoryNavProps {
  className?: string;
}

export function CategoryNav({ className }: CategoryNavProps) {
  return (
    <div className={cn("border-b bg-background", className)}>
      <div className="container overflow-x-auto">
        <div className="flex justify-start items-center w-full gap-2 py-3 lg:justify-center">
          {CATEGORIES.slice(0, 8).map((category) => (
            <Link
              key={category.id}
              to={`/products/${category.id}`}
              className="flex-shrink-0"
            >
              <Button
                variant="ghost"
                size="sm"
                className="h-auto flex-col gap-1 px-3 py-2"
              >
                <span className="text-xl">{category.icon}</span>
                <span className="text-xs whitespace-nowrap">
                  {category.name}
                </span>
              </Button>
            </Link>
          ))}
          <Link to="/products" className="flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="h-auto flex-col gap-1 px-3 py-2"
            >
              <span className="text-xl">🔍</span>
              <span className="text-xs">View All</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
