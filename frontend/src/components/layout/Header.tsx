import { Link } from "react-router-dom";
import { Search, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useLogout } from "@/lib/hooks/useAuth";
import { useAuth } from "@/contexts/AuthContext";

export function Header({
  searchIsActive = true,
}: {
  searchIsActive?: boolean;
}) {
  const logoutMutation = useLogout();
  const { user } = useAuth();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const getUserInitials = () => {
    if (!user) return "UN";
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  };

  // Check if user has moderation privileges
  const canModerate = () => {
    if (!user) return false;
    return user.role === "ADMIN" || user.role === "MODERATOR";
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center px-4">
        {/* Logo */}
        <Link to="/" className="mr-6 flex items-center space-x-2">
          <ShoppingBag className="h-6 w-6" />
          <span className="text-xl font-bold tracking-tight font-family-serif">
            SafeTrade
          </span>
        </Link>

        {/* Search Bar - Hidden on mobile and when searchIsActive is false */}
        {searchIsActive && (
          <div className="hidden flex-1 md:flex md:max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search products..."
                className="w-full pl-10"
              />
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="ml-auto flex items-center gap-2">
          {/* Moderation Button - Only visible for ADMIN and MODERATOR */}
          {canModerate() && (
            <Link to="/moderation">
              <Button variant="outline" size="sm" className="flex">
                Moderate
              </Button>
            </Link>
          )}

          {/* Mobile Menu
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" onClick={handleMobileMenu} />
          </Button> */}

          {/* User Menu */}
          {!user ? (
            <Button>
              <Link to="/login"></Link>Login
            </Button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{getUserInitials()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">
                      {user?.firstName + " " + user?.lastName}
                    </span>
                    <span className="text-muted-foreground truncate text-xs">
                      {user?.email}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/saved">Saved Items</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/my-products">My Products</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  disabled={logoutMutation.isPending}
                  className="text-destructive"
                >
                  {logoutMutation.isPending ? "Logging out..." : "Logout"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </nav>
      </div>

      {/* Mobile Search Bar */}
      <div className="border-t p-4 md:hidden">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search products..."
            className="w-full pl-10"
          />
        </div>
      </div>
    </header>
  );
}
