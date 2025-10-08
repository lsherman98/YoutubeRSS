import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { KeyRound, Podcast, Send, Server } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { pb } from "@/lib/pocketbase";

const data = {
  navMain: [
    {
      title: "Podcasts",
      url: "/podcasts",
      icon: Podcast,
    },
    {
      title: "API Keys",
      url: "/keys",
      icon: KeyRound,
    },
    {
      title: "Jobs",
      url: "/jobs",
      icon: Server,
    },
    {
      title: "Webhooks",
      url: "/webhooks",
      icon: Send,
    },
  ],
  navSecondary: [],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const user = pb.authStore.model;
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <Link to="/">
                <span className="text-base font-semibold">Youtube RSS</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser email={user?.email} />
      </SidebarFooter>
    </Sidebar>
  );
}
