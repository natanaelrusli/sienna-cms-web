import { useLocation, useNavigate } from "react-router-dom";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useCallback } from "react";
import { type LucideIcon } from "lucide-react";
import type { Icon } from "@tabler/icons-react";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: LucideIcon | React.ComponentType<{ className?: string }> | Icon;
  }[];
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = useCallback(
    (url: string) => {
      return location.pathname === url;
    },
    [location.pathname]
  );

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                className={`cursor-pointer active:text-primary-foreground active:bg-primary ${
                  isActive(item.url)
                    ? "bg-primary text-primary-foreground hover:text-primary-foreground hover:bg-primary/90"
                    : ""
                }`}
                onClick={() => navigate(item.url)}
                tooltip={item.title}
              >
                {item.icon && <item.icon />}
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
