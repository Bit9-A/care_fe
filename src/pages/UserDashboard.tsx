import {
  ChevronRight,
  LogOut,
  Search,
  SquarePen,
  User2Icon,
} from "lucide-react";
import { Link } from "raviger";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TooltipComponent } from "@/components/ui/tooltip";

import { Avatar } from "@/components/Common/Avatar";

import { useAccessibleRoleOrganizationsList } from "@/hooks/useAccessibleRoleOrganizationsList";
import useAuthUser, { useAuthContext } from "@/hooks/useAuthUser";
import useBreakpoints from "@/hooks/useBreakpoints";

import { formatName } from "@/Utils/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { FacilityBareMinimum } from "@/types/facility/facility";
import { Organization, getOrgLabel } from "@/types/organization/organization";

enum DashboardTabs {
  TAB_FACILITIES = "Facilities",
  TAB_ASSOCIATIONS = "Responsibilities",
  TAB_GOVERNANCE = "Governance",
}

/** Same visual language as the login: institutional blue, navy gradient, Outfit. */
const HEADER_BUTTON =
  "border-white/25 bg-white/10 text-white shadow-none backdrop-blur hover:bg-white/20 hover:text-white focus-visible:ring-white/60";

const TILE =
  "group h-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-0 shadow-[0_2px_12px_-6px_rgba(3,37,76,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#00a3ff]/40 hover:shadow-[0_18px_40px_-18px_rgba(0,163,255,0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00a3ff]/50";

const TILE_CHEVRON =
  "flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors duration-200 group-hover:bg-[#00a3ff] group-hover:text-white";

type TabContentProps = {
  tabId: string;
  tabItems: FacilityBareMinimum[] | Organization[];
  description: string;
  renderChild: (item: FacilityBareMinimum | Organization) => React.ReactNode;
  isLoading?: boolean;
};

export default function UserDashboard() {
  const user = useAuthUser();
  const { signOut } = useAuthContext();
  const facilities = user.facilities || [];
  const { t, i18n } = useTranslation();

  const organizations = user.organizations || [];
  const governance = organizations.filter((org) => org.org_type === "govt");

  // Fetch accessible role organizations from dedicated API (includes user's role per org)
  const { data: accessibleRoleOrgs, isLoading: isLoadingRoleOrgs } =
    useAccessibleRoleOrganizationsList();
  const responsibilityItems = accessibleRoleOrgs?.results || [];
  // Extract organizations for tab items
  const responsibilities = responsibilityItems.map((item) => item.organization);
  // Map org ID → role name for showing designation on cards
  const roleByOrgId = new Map(
    responsibilityItems
      .filter((item) => item.role)
      .map((item) => [item.organization.id, item.role!.name]),
  );

  const tabsData = [
    { id: DashboardTabs.TAB_FACILITIES, items: facilities },
    { id: DashboardTabs.TAB_ASSOCIATIONS, items: responsibilities },
    { id: DashboardTabs.TAB_GOVERNANCE, items: governance },
  ];

  const availableTabs = tabsData
    .filter(
      (tab) =>
        tab.items.length > 0 ||
        (tab.id === DashboardTabs.TAB_ASSOCIATIONS && isLoadingRoleOrgs),
    )
    .map((tab) => tab.id);

  const [activeTab, setActiveTab] = useState<DashboardTabs | null>(
    availableTabs.length > 0 ? availableTabs[0] : null,
  );

  const isMobile = useBreakpoints({ default: true, sm: false });

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 py-5 md:space-y-7 md:p-8">
      {/* Welcome Section */}
      <div className="relative overflow-hidden rounded-2xl bg-[linear-gradient(155deg,#03254c_0%,#006cc7_50%,#00a3ff_100%)] p-5 shadow-[0_24px_60px_-20px_rgba(3,37,76,0.55)] md:p-7">
        <div className="pointer-events-none absolute -right-16 -top-24 size-72 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-10 size-56 rounded-full bg-[#00a3ff]/30 blur-3xl" />
        <div className="relative flex flex-col sm:flex-row gap-4 items-center w-full justify-between">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Avatar
              name={formatName(user, true)}
              imageUrl={user.profile_picture_url}
              className="h-14 w-14 md:h-16 md:w-16 ring-2 ring-white/50 shadow-lg"
            />
            <div className="space-y-1 text-center sm:text-left">
              <h1 className="font-display text-2xl font-bold tracking-tight text-white md:text-3xl">
                {t("hey_user", {
                  user: [user.prefix, user.first_name]
                    .filter(Boolean)
                    .join(" "),
                })}
              </h1>
              <p className="text-sm text-white/75 md:text-base">
                {new Date().toLocaleDateString(i18n.language, {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 w-full sm:flex-row sm:items-center sm:w-auto">
            {user.is_superuser && (
              <Button
                variant="outline"
                size="sm"
                className={`w-auto min-w-max ${HEADER_BUTTON}`}
                asChild
              >
                <Link
                  href="/admin/questionnaire"
                  className="gap-2 text-inherit flex items-center"
                >
                  <User2Icon className="size-4" />
                  {t("admin_dashboard")}
                </Link>
              </Button>
            )}

            {isMobile ? (
              <div className="flex gap-2 w-full">
                <Button
                  variant="outline"
                  size="sm"
                  className={`flex items-center gap-2 flex-1 ${HEADER_BUTTON}`}
                  asChild
                >
                  <Link href={`/users/${user.username}`}>
                    <SquarePen className="size-4" />
                    {t("edit_profile")}
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className={`flex items-center gap-2 flex-1 ${HEADER_BUTTON}`}
                  onClick={signOut}
                >
                  <LogOut className="size-4" />
                  {t("sign_out")}
                </Button>
              </div>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`w-auto ${HEADER_BUTTON}`}
                  >
                    <CareIcon icon="l-ellipsis-v" className="text-inherit" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem
                    asChild
                    className="cursor-pointer flex items-center gap-2 text-xs w-full"
                  >
                    <Link
                      href={`/users/${user.username}`}
                      className="flex items-center gap-2 w-full text-inherit"
                    >
                      <SquarePen className="size-4" />
                      {t("edit_profile")}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer flex items-center gap-2 text-xs w-full"
                    onClick={signOut}
                  >
                    <LogOut className="size-4" />
                    {t("sign_out")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>

      {availableTabs.length > 0 && (
        <div className="w-full">
          <div
            className="inline-flex max-w-full gap-1 overflow-auto rounded-xl border border-slate-200/80 bg-white/70 p-1 shadow-[0_2px_10px_-6px_rgba(3,37,76,0.15)] backdrop-blur"
            role="tablist"
            aria-label={t("dashboard_sections")}
          >
            {availableTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                role="tab"
                id={`${tab.toLowerCase()}-tab`}
                aria-selected={activeTab === tab}
                aria-controls={`${tab.toLowerCase()}-panel`}
                className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00a3ff]/60 ${
                  activeTab === tab
                    ? "bg-[linear-gradient(135deg,#00a3ff,#0076be)] text-white shadow-[0_8px_20px_-8px_rgba(0,163,255,0.8)]"
                    : "text-slate-600 hover:bg-white hover:text-slate-900"
                }`}
              >
                {t(tab.toLowerCase())}
              </button>
            ))}
          </div>

          {/* Tabs Content */}
          <div className="mt-4">
            {activeTab === DashboardTabs.TAB_FACILITIES && (
              <TabContent
                tabId="facilities-panel"
                tabItems={facilities}
                description={t("dashboard_tab_facilities")}
                renderChild={(facility) => {
                  return (
                    <Link
                      key={facility.id}
                      href={`/facility/${facility.id}/overview`}
                    >
                      <Card className={TILE}>
                        <CardContent className="flex items-center gap-3 p-4">
                          <Avatar
                            name={facility.name}
                            className="size-12 md:size-14 ring-1 ring-slate-200"
                          />
                          <div className="flex-1 min-w-0">
                            <TooltipComponent content={facility.name}>
                              <h3 className="font-display font-semibold line-clamp-2 text-sm leading-snug md:text-[15px] text-slate-900">
                                {facility.name}
                              </h3>
                            </TooltipComponent>
                            <p className="mt-0.5 text-xs text-slate-500 truncate">
                              {t("view_facility_details")}
                            </p>
                          </div>
                          <span className={TILE_CHEVRON}>
                            <ChevronRight className="size-4" />
                          </span>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                }}
              />
            )}

            {activeTab === DashboardTabs.TAB_ASSOCIATIONS && (
              <TabContent
                tabId="associations-panel"
                tabItems={responsibilities}
                description={t("dashboard_tab_associations")}
                isLoading={isLoadingRoleOrgs}
                renderChild={(association) => {
                  const roleName = roleByOrgId.get(association.id);
                  return (
                    <Link
                      key={association.id}
                      href={`/responsibilities/${association.id}`}
                      className="h-full"
                    >
                      <Card className={TILE}>
                        <CardContent className="flex h-full items-center gap-3 p-4">
                          <Avatar
                            name={association.name}
                            className="size-12 md:size-14 ring-1 ring-slate-200"
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-display font-semibold line-clamp-2 text-sm leading-snug md:text-[15px] text-slate-900">
                              {association.name}
                            </h3>
                            {roleName && (
                              <p className="mt-0.5 text-xs text-slate-500 truncate">
                                {roleName}
                              </p>
                            )}
                          </div>
                          <span className={TILE_CHEVRON}>
                            <ChevronRight className="size-4" />
                          </span>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                }}
              />
            )}

            {activeTab === DashboardTabs.TAB_GOVERNANCE && (
              <TabContent
                tabId="governance-panel"
                tabItems={governance}
                description={t("dashboard_tab_governance")}
                renderChild={(governanceOrg) => (
                  <Link
                    key={governanceOrg.id}
                    href={`/organization/${governanceOrg.id}`}
                  >
                    <Card className={TILE}>
                      <CardContent className="flex items-center gap-3 p-4">
                        <Avatar
                          name={governanceOrg.name}
                          className="size-12 md:size-14 ring-1 ring-slate-200"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-display font-semibold line-clamp-2 text-sm leading-snug md:text-[15px] text-slate-900">
                            {governanceOrg.name}
                          </h3>
                          <p className="mt-0.5 text-xs text-slate-500 truncate">
                            {"org_type" in governanceOrg &&
                              getOrgLabel(
                                governanceOrg.org_type,
                                governanceOrg.metadata,
                              )}
                          </p>
                        </div>
                        <span className={TILE_CHEVRON}>
                          <ChevronRight className="size-4" />
                        </span>
                      </CardContent>
                    </Card>
                  </Link>
                )}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const TabContent = ({
  tabId,
  tabItems,
  description,
  renderChild,
  isLoading,
}: TabContentProps) => {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const filteredItems = useMemo(() => {
    if (tabItems.length <= 1) return tabItems;
    const query = search.trim().toLowerCase();
    return tabItems.filter((item) => item.name.toLowerCase().includes(query));
  }, [tabItems, search]);
  return (
    <section
      className="space-y-3 md:space-y-4"
      id={tabId}
      role="tabpanel"
      aria-labelledby={tabId}
    >
      <p className="px-1 text-sm text-slate-600">{description}</p>
      {tabItems.length > 1 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder={t("search")}
            aria-label={t("search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 rounded-xl border-slate-200 bg-white pl-9 shadow-xs focus-visible:ring-2 focus-visible:ring-[#00a3ff]/40"
          />
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="rounded-2xl border-slate-200/80">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="size-12 md:size-14 rounded-md bg-gray-100 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
                  <div className="h-3 w-16 bg-gray-100 rounded animate-pulse" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <EmptyState
          icon={<Search className="size-5 text-primary" />}
          title={t("no_results_found")}
          className="border-solid"
        />
      ) : (
        <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          {filteredItems.map((item: FacilityBareMinimum | Organization) => {
            return renderChild(item);
          })}
        </div>
      )}
    </section>
  );
};
