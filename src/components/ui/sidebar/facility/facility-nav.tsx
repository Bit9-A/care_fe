import { TFunction } from "i18next";
import { useTranslation } from "react-i18next";

import {
  Boxes,
  CalendarDays,
  LayoutDashboard,
  ListOrdered,
  Receipt,
  Settings2,
  Stethoscope,
  Users,
  UsersRound,
} from "lucide-react";

import { NavigationLink, NavMain } from "@/components/ui/sidebar/nav-main";

import { useCareApps } from "@/hooks/useCareApps";

import { getPermissions } from "@/common/Permissions";

import { usePermissions } from "@/context/PermissionContext";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import { FacilityBareMinimum } from "@/types/facility/facility";
import careConfig from "@careConfig";

interface FacilityNavProps {
  selectedFacility: FacilityBareMinimum | null;
}

function generateFacilityLinks(
  selectedFacility: FacilityBareMinimum | null,
  t: TFunction,
  permissions: {
    canViewAppointments: boolean;
    canListEncounters: boolean;
    canWriteAppointment: boolean;
    canCreateEncounter: boolean;
    canReadEncounter: boolean;
    canListTokenCategories: boolean;
    canReadPatientIdentifierConfig: boolean;
    canListTemplate: boolean;
  },
  pluginLinks: NavigationLink[],
  pluginBillingLinks: NavigationLink[],
) {
  if (!selectedFacility) return [];

  const encounterClasses = careConfig.encounterClasses;

  const baseUrl = `/facility/${selectedFacility.id}`;

  const links: NavigationLink[] = [
    {
      name: t("overview"),
      url: `${baseUrl}/overview`,
      section: t("nav_section_care"),
      icon: <LayoutDashboard className="size-4" />,
    },
    {
      name: t("appointments"),
      url: `${baseUrl}/appointments`,
      section: t("nav_section_care"),
      icon: <CalendarDays className="size-4" />,
      visibility: permissions.canViewAppointments,
    },
    {
      name: t("queues"),
      url: `${baseUrl}/queues`,
      section: t("nav_section_care"),
      icon: <ListOrdered className="size-4" />,
      visibility: permissions.canViewAppointments,
    },
    {
      name: t("patients"),
      url: `${baseUrl}/patients`,
      section: t("nav_section_care"),
      icon: <Users className="size-4" />,
      visibility:
        permissions.canWriteAppointment ||
        permissions.canListEncounters ||
        permissions.canCreateEncounter,
      children: [
        {
          name: t("search_patients"),
          url: `${baseUrl}/patients`,
        },
        {
          name: t("all_encounters"),
          url: `${baseUrl}/encounters/patients/all`,
          visibility: encounterClasses.length > 1,
        },
        ...encounterClasses.map((encounterClass) => ({
          name: t(`encounter_class_encounters`, {
            encounterClassName: t(`encounter_class__${encounterClass}`),
          }),
          url: `${baseUrl}/encounters/patients/${encounterClass}`,
        })),
        {
          name: t("locations"),
          url: `${baseUrl}/encounters/locations`,
        },
      ],
    },
    {
      name: t("services"),
      url: `${baseUrl}/services`,
      section: t("nav_section_catalogs"),
      icon: <Stethoscope className="size-4" />,
    },
    {
      name: t("resource"),
      url: `${baseUrl}/resource`,
      section: t("nav_section_catalogs"),
      icon: <Boxes className="size-4" />,
    },
    {
      name: t("users"),
      url: `${baseUrl}/users`,
      section: t("nav_section_catalogs"),
      icon: <UsersRound className="size-4" />,
    },
    {
      name: t("billing"),
      url: `${baseUrl}/billing`,
      section: t("nav_section_admin"),
      icon: <Receipt className="size-4" />,
      children: [
        {
          name: t("accounts"),
          url: `${baseUrl}/billing/account`,
        },
        {
          name: t("invoices"),
          url: `${baseUrl}/billing/invoices`,
        },
        {
          name: t("payments"),
          url: `${baseUrl}/billing/payments`,
        },
        ...pluginBillingLinks.map((l) => ({
          ...l,
          url: `${baseUrl}${l.url}`,
        })),
      ],
    },
    {
      name: t("settings"),
      url: `${baseUrl}/settings/general`,
      section: t("nav_section_admin"),
      icon: <Settings2 className="size-4" />,
      children: [
        {
          name: t("general"),
          url: `${baseUrl}/settings/general`,
        },
        {
          name: t("departments"),
          url: `${baseUrl}/settings/departments`,
        },
        {
          name: t("locations"),
          url: `${baseUrl}/settings/locations`,
        },
        {
          name: t("devices"),
          url: `${baseUrl}/settings/devices`,
        },
        {
          name: t("specimen_definitions"),
          url: `${baseUrl}/settings/specimen_definitions`,
        },
        {
          name: t("observation_definitions"),
          url: `${baseUrl}/settings/observation_definitions`,
        },
        {
          name: t("activity_definitions"),
          url: `${baseUrl}/settings/activity_definitions`,
        },
        {
          name: t("billing"),
          url: `${baseUrl}/settings/billing`,
        },
        {
          name: t("charge_item_definitions"),
          url: `${baseUrl}/settings/charge_item_definitions`,
        },
        {
          name: t("healthcare_services"),
          url: `${baseUrl}/settings/healthcare_services`,
        },
        {
          name: t("product_knowledge"),
          url: `${baseUrl}/settings/product_knowledge`,
        },
        {
          name: t("product"),
          url: `${baseUrl}/settings/product`,
        },
        {
          name: t("token_category"),
          url: `${baseUrl}/settings/token_category`,
          visibility: permissions.canListTokenCategories,
        },
        {
          name: t("patient_identifier_config"),
          url: `${baseUrl}/settings/patient_identifier_config`,
          visibility: permissions.canReadPatientIdentifierConfig,
        },
        {
          name: t("tag_config"),
          url: `${baseUrl}/settings/tag_config`,
        },
        {
          name: t("templates"),
          url: `${baseUrl}/template`,
          visibility: permissions.canListTemplate,
        },
      ],
    },
  ];

  return [
    ...links,
    ...pluginLinks.map((l) => ({
      ...l,
      url: `${baseUrl}/${l.url}`,
    })),
  ];
}

export function FacilityNav({ selectedFacility }: FacilityNavProps) {
  const { t } = useTranslation();
  const { hasPermission } = usePermissions();
  const careApps = useCareApps();
  const pluginNavItems = careApps.flatMap((c) =>
    !c.isLoading && c.navItems ? c.navItems : [],
  ) as NavigationLink[];

  const pluginBillingNavItems = careApps.flatMap((c) =>
    !c.isLoading && c.billingNavItems ? c.billingNavItems : [],
  ) as NavigationLink[];

  const { facility } = useCurrentFacility();

  const {
    canViewAppointments,
    canListEncounters,
    canWriteAppointment,
    canCreateEncounter,
    canReadEncounter,
    canListTokenCategories,
    canReadPatientIdentifierConfig,
    canListTemplate,
  } = getPermissions(hasPermission, facility?.permissions ?? []);
  const permissions = {
    canViewAppointments,
    canListEncounters,
    canWriteAppointment,
    canCreateEncounter,
    canReadEncounter,
    canListTokenCategories,
    canReadPatientIdentifierConfig,
    canListTemplate,
  };
  return (
    <NavMain
      links={generateFacilityLinks(
        selectedFacility,
        t,
        permissions,
        pluginNavItems,
        pluginBillingNavItems,
      )}
    />
  );
}
