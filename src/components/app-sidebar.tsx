import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import { Usage } from "@/components/usage";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Info, KeyRound, Podcast, Send, Server, WalletCards } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { pb } from "@/lib/pocketbase";
import { useGetUsage } from "@/lib/api/queries";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: usage } = useGetUsage();
  const tierLookupKey = usage?.expand?.tier.lookup_key;
  const freeTier = tierLookupKey === "free";

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
        disabled: freeTier,
        badge: freeTier
          ? {
              text: "Upgrade",
              url: "/subscriptions",
            }
          : undefined,
      },
      {
        title: "Webhooks",
        url: "/webhooks",
        icon: Send,
        disabled: freeTier,
        badge: freeTier
          ? {
              text: "Upgrade",
              url: "/subscriptions",
            }
          : undefined,
      },
    ],
    navSecondary: [
      {
        title: "Documentation",
        url: "/docs",
        icon: Info,
      },
      {
        title: "Subscriptions",
        url: "/subscriptions",
        icon: WalletCards,
      },
    ],
  };

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
        <div className="flex-1"></div>
        <Usage />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser email={user?.email} />
      </SidebarFooter>
    </Sidebar>
  );
}
