import { TFunction } from "i18next";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { NavMain, NavigationLink } from "@/components/ui/sidebar/nav-main";

import { useCareApps } from "@/hooks/useCareApps";

function generateAdminLinks(
  t: TFunction,
  pluginNavItems: NavigationLink[],
): NavigationLink[] {
  const baseUrl = "/admin";
  const links: NavigationLink[] = [
    {
      name: t("questionnaire_one"),
      url: `${baseUrl}/questionnaire`,
      icon: <CareIcon icon="d-book-open" />,
    },
    {
      name: t("valuesets"),
      url: `${baseUrl}/valuesets`,
      icon: <CareIcon icon="l-list-ol-alt" />,
    },
    {
      name: t("patient_identifier_config"),
      url: `${baseUrl}/patient_identifier_config`,
      icon: <CareIcon icon="l-setting" />,
    },
    {
      name: t("tag_config"),
      url: `${baseUrl}/tag_config`,
      icon: <CareIcon icon="l-tag-alt" />,
    },
    {
      name: t("rbac"),
      url: `${baseUrl}/rbac`,
      icon: <CareIcon icon="l-shield-check" />,
      children: [
        {
          name: t("permissions"),
          url: `${baseUrl}/rbac/permissions`,
        },
        {
          name: t("roles"),
          url: `${baseUrl}/rbac/roles`,
        },
      ],
    },
    {
      name: t("organizations"),
      url: `${baseUrl}/organizations`,
      icon: <CareIcon icon="l-building" />,
      children: [
        {
          name: t("governance"),
          url: `${baseUrl}/organizations/govt`,
        },
        {
          name: t("suppliers"),
          url: `${baseUrl}/organizations/product_supplier`,
        },
        {
          name: t("responsibilities"),
          url: `${baseUrl}/organizations/role`,
        },
      ],
    },
    {
      name: t("apps"),
      url: `${baseUrl}/apps`,
      icon: <CareIcon icon="l-apps" />,
    },
    ...pluginNavItems,
  ];

  return links;
}

export function AdminNav() {
  const { t } = useTranslation();

  const careApps = useCareApps();
  const pluginNavItems = careApps.flatMap((c) =>
    !c.isLoading && c.adminNavItems ? c.adminNavItems : [],
  ) as NavigationLink[];

  return <NavMain links={generateAdminLinks(t, pluginNavItems)} />;
}
