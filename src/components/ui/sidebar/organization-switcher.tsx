import { CaretSortIcon, DashboardIcon } from "@radix-ui/react-icons";
import { Globe } from "lucide-react";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

import { Organization } from "@/types/organization/organization";

interface Props {
  organizations: Organization[];
  selectedOrganization: Organization | undefined;
}

export function OrganizationSwitcher({
  organizations,
  selectedOrganization,
}: Props) {
  const { isMobile } = useSidebar();
  const { t } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:bg-white"
              tooltip={
                selectedOrganization
                  ? t("my_organizations")
                  : t("select_organization")
              }
            >
              <div className="flex aspect-square size-9 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#00a3ff,#0076be)] text-white shadow-[0_6px_16px_-8px_rgba(0,163,255,0.9)]">
                <Globe className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {selectedOrganization
                    ? t("my_organizations")
                    : t("select_organization")}
                </span>
              </div>
              <CaretSortIcon className="ml-auto group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg max-h-screen overflow-y-auto"
        align="start"
        side={isMobile ? "bottom" : "right"}
        sideOffset={4}
      >
        <DropdownMenuItem asChild>
          <Link className="flex items-center gap-2 cursor-pointer" href="/">
            <DashboardIcon className="size-4" />
            {t("view_dashboard")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuLabel>{t("organizations")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {organizations
          .filter((org) => org.org_type === "govt")
          .map((org) => (
            <DropdownMenuItem
              key={org.id}
              asChild
              className={cn(
                "gap-2 p-2",
                org?.id === selectedOrganization?.id &&
                  "bg-primary-500 text-white focus:bg-primary-600 focus:text-white",
              )}
            >
              <Link href={`/organization/${org.id}`}>{org.name}</Link>
            </DropdownMenuItem>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
