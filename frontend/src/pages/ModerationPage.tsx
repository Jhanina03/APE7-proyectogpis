import { Outlet, Link, useLocation } from "react-router-dom";
import {
  Users,
  Shield,
  ShoppingBag,
  ClipboardList,
  EllipsisVertical,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useLogout } from "@/lib/hooks/useAuth";

const navigationItemsAdmin = [
  {
    title: "Products",
    icon: ShoppingBag,
    href: "/moderation/products",
  },
  {
    title: "Reports",
    icon: ClipboardList,
    href: "/moderation/reports",
  },
  {
    title: "Moderators",
    icon: Shield,
    href: "/moderation/moderators",
  },
  {
    title: "Clients",
    icon: Users,
    href: "/moderation/clients",
  },
];

const navigationItemsModerator = [
  {
    title: "Products",
    icon: ShoppingBag,
    href: "/moderation/products",
  },
  {
    title: "Reports",
    icon: ClipboardList,
    href: "/moderation/reports",
  },
  {
    title: "Clients",
    icon: Users,
    href: "/moderation/clients",
  },
];

export default function ModerationPage() {
  const location = useLocation();
  const { user } = useAuth();
  const logoutMutation = useLogout();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const getUserInitials = () => {
    if (!user) return "UN";
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  };
  return (
    <div className="min-h-screen flex flex-col h-svh">
      <SidebarProvider >
        <Sidebar variant="floating">
          <SidebarHeader className="border-b py-2">
            <Link
              to="/"
              className="flex items-center space-x-2"
            >
              <ShoppingBag className="h-6 w-6" />
              <span className="text-xl font-bold tracking-tight font-family-serif">
                SafeTrade
              </span>
            </Link>
          </SidebarHeader>
          <SidebarContent className="w-64">
            <SidebarGroup>
              <SidebarGroupLabel>User Management</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {user?.role === "ADMIN"
                    ? navigationItemsAdmin.map((item) => {
                        const isActive = location.pathname === item.href;
                        return (
                          <SidebarMenuItem key={item.href}>
                            <SidebarMenuButton asChild isActive={isActive}>
                              <Link to={item.href}>
                                <item.icon />
                                <span>{item.title}</span>
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })
                    : navigationItemsModerator.map((item) => {
                        const isActive = location.pathname === item.href;
                        return (
                          <SidebarMenuItem key={item.href}>
                            <SidebarMenuButton asChild isActive={isActive}>
                              <Link to={item.href}>
                                <item.icon />
                                <span>{item.title}</span>
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <div className="border-t py-2">
              <SidebarMenu>
                <SidebarMenuItem>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <SidebarMenuButton
                        size="lg"
                        className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                      >
                        <Avatar className="h-8 w-8 grayscale rounded-full flex items-center justify-center">
                          <AvatarFallback>{getUserInitials()}</AvatarFallback>
                        </Avatar>
                        <div className="grid flex-1 text-left text-sm leading-none ml-2">
                          <span className="truncate font-medium">
                            {user?.firstName + " " + user?.lastName}
                          </span>
                          <span className="text-muted-foreground truncate text-xs">
                            {user?.email}
                          </span>
                        </div>
                        <EllipsisVertical className="ml-auto size-4" />
                      </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      className="w-56"
                      align="end"
                      sideOffset={12}
                      alignOffset={-2}
                    >
                      <DropdownMenuLabel className="p-0 font-normal">
                        <div className="flex items-center gap-2 px-1.5 py-1.5 text-left text-sm">
                          <div className="grid flex-1 text-left text-sm leading-tight">
                            <span className="truncate font-medium">
                              {user?.firstName + " " + user?.lastName}
                            </span>
                            <span className="text-muted-foreground truncate text-xs">
                              {user?.email}
                            </span>
                          </div>
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
                        {logoutMutation.isPending
                          ? `Logging out...`
                          : `Logout`}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SidebarMenuItem>
              </SidebarMenu>
            </div>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <h2 className="text-lg font-semibold">Management</h2>
          </header>

          <div className="flex-1">
            <Outlet />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
