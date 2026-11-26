import { HeartPulse, Stethoscope } from "lucide-react";
import { Link } from "raviger";
import React from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import {
  AllergyIcon,
  HealthWorkerIcon,
  MedicineIcon,
  TestTubeIcon,
} from "@/CAREUI/icons/CustomIcons";

import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";

import { FormDialog } from "./FormsDialog";

export const QuickActions = (props: React.ComponentProps<"div">) => {
  const { t } = useTranslation();

  return (
    <div
      {...props}
      className={cn("grid grid-cols-2 sm:grid-cols-4 gap-3", props.className)}
    >
      <QuickAction
        icon={<AllergyIcon className="text-red-700" />}
        title={t("allergy")}
        actionId="add-allergy"
        href={`questionnaire/allergy_intolerance`}
      />
      <QuickAction
        icon={<TestTubeIcon className="text-pink-700 size-8" />}
        title={t("service_request")}
        actionId="add-service-request"
        href={`questionnaire/service_request`}
      />
      <QuickAction
        icon={<MedicineIcon className="text-blue-800 size-8" />}
        title={t("add_medication")}
        href={`questionnaire/medication_request`}
        actionId="add-medication-request"
      />
      <QuickAction
        icon={<HeartPulse className="text-orange-700 size-8" />}
        title={t("add_symptom")}
        href={`questionnaire/symptom`}
        actionId="add-symptoms"
        hidden
      />
      <QuickAction
        icon={<Stethoscope className="text-purple-700 size-8" />}
        title={t("add_diagnosis")}
        href={`questionnaire/diagnosis`}
        actionId="add-diagnosis"
        hidden
      />
      <FormDialog
        subjectType="encounter"
        trigger={
          <QuickAction
            icon={<HealthWorkerIcon className="text-teal-700" />}
            title={t("forms")}
            actionId="add-questionnaire"
          />
        }
      />
    </div>
  );
};

export function QuickAction({
  icon,
  title,
  actionId,
  href,
  basePath,
  onClick,
  hidden,
  layout = "vertical",
  ...props
}: {
  icon: React.ReactNode;
  title: string;
  /** `horizontal` is for narrow containers where stacking the icon looks cramped. */
  layout?: "vertical" | "horizontal";
  actionId?: string;
  href?: string;
  basePath?: string;
  onClick?: () => void;
  hidden?: boolean;
} & React.ComponentProps<"button">) {
  const className = cn(
    "group flex flex-1 flex-row items-center gap-3 rounded-xl border border-slate-200/80 bg-white p-3 text-left shadow-[0_1px_3px_rgba(15,23,42,0.05)] transition-all duration-150 hover:-translate-y-0.5 hover:border-[#00a3ff]/40 hover:shadow-[0_12px_26px_-16px_rgba(0,163,255,0.65)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00a3ff]/50",
    layout === "vertical" && "md:flex-col md:gap-2 md:p-4 md:text-center",
    hidden && "hidden",
  );

  if (href) {
    return (
      <Link basePath={basePath} href={href} className={className}>
        <QuickActionContent icon={icon} title={title} actionId={actionId} />
      </Link>
    );
  }

  return (
    <button className={className} {...props} onClick={onClick}>
      <QuickActionContent icon={icon} title={title} actionId={actionId} />
    </button>
  );
}

const QuickActionContent = ({
  icon,
  title,
  actionId,
}: {
  icon: React.ReactNode;
  title: string;
  actionId?: string;
}) => {
  return (
    <>
      <div className="relative flex items-center justify-center">
        {actionId && <ShortcutBadge actionId={actionId} position="top-right" />}
        <div className="flex items-center rounded-xl bg-slate-50 p-2.5 transition-colors group-hover:bg-[#00a3ff]/10 md:p-3">
          {icon}
        </div>
      </div>
      <div className="flex items-center justify-center">
        <span className="text-sm font-semibold leading-tight text-slate-700 group-hover:text-slate-900">
          {title}
        </span>
      </div>
    </>
  );
};
