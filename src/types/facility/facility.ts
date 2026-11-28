import { VariantProps } from "class-variance-authority";

import { IconName } from "@/CAREUI/icons/CareIcon";

import { badgeVariants } from "@/components/ui/badge";

import { Code } from "@/types/base/code/code";
import {
  DiscountConfiguration,
  MonetaryComponentRead,
} from "@/types/base/monetaryComponent/monetaryComponent";
import { FacilityPermissions } from "@/types/emr/permission/permission";
import { PrintTemplate } from "@/types/facility/printTemplate";
import { Organization } from "@/types/organization/organization";
import { PatientIdentifierConfig } from "@/types/patient/patientIdentifierConfig/patientIdentifierConfig";
import { SpecialtyRead } from "@/types/specialty/specialty";

export interface FacilityBareMinimum {
  id: string;
  name: string;
}

export interface FacilityBase extends FacilityBareMinimum {
  description: string;
  address: string;
  phone_number: string;
  facility_type: string;
  is_public: boolean;
  latitude?: string;
  longitude?: string;
  middleware_address?: string;
  pincode?: number;
}

export interface FacilityPublicRead extends FacilityBase {
  features: number[];
  read_cover_image_url?: string;
  cover_image_url?: string;
  geo_organization: Organization;
}

export interface FacilityRead extends FacilityBase, FacilityPermissions {
  classification: string | null;
  read_cover_image_url?: string;
  cover_image_url?: string;
  created_date?: string;
  modified_date?: string;
  geo_organization: Organization;
  instance_discount_codes: Code[];
  instance_discount_monetary_components: MonetaryComponentRead[];
  instance_informational_codes: Code[];
  instance_tax_codes: Code[];
  instance_tax_monetary_components: MonetaryComponentRead[];
  invoice_number_expression: string;
  discount_codes: Code[];
  discount_monetary_components: MonetaryComponentRead[];
  discount_configuration: DiscountConfiguration | null;
  patient_instance_identifier_configs: PatientIdentifierConfig[];
  patient_facility_identifier_configs: PatientIdentifierConfig[];
  features: number[];
  print_templates: PrintTemplate[];
  specialties: SpecialtyRead[];
}

export type FacilityListRead = Omit<
  FacilityRead,
  | "permissions"
  | "root_org_permissions"
  | "child_org_permissions"
  | "print_templates"
>;

export interface FacilityCreate extends Omit<FacilityBase, "id"> {
  classification?: string | null;
  geo_organization: string;
  features: number[];
  print_templates?: PrintTemplate[];
  // Omitted key keeps the existing M2M; an explicit [] clears it.
  specialties?: string[];
}

export const FACILITY_FEATURE_TYPES: {
  id: number;
  name: string;
  icon: IconName;
  variant: VariantProps<typeof badgeVariants>["variant"];
}[] = [
  {
    id: 1,
    name: "CT Scan",
    icon: "l-compact-disc",
    variant: "blue",
  },
  {
    id: 2,
    name: "Maternity Care",
    icon: "l-baby-carriage",
    variant: "pink",
  },
  {
    id: 3,
    name: "X-Ray",
    icon: "l-clipboard-alt",
    variant: "blue",
  },
  {
    id: 4,
    name: "Neonatal Care",
    icon: "l-baby-carriage",
    variant: "pink",
  },
  {
    id: 5,
    name: "Operation Theater",
    icon: "l-syringe",
    variant: "orange",
  },
  {
    id: 6,
    name: "Blood Bank",
    icon: "l-medical-drip",
    variant: "purple",
  },
  {
    id: 7,
    name: "Emergency Services",
    icon: "l-ambulance",
    variant: "destructive",
  },
  {
    id: 8,
    name: "Inpatient Services",
    icon: "l-hospital",
    variant: "orange",
  },
  {
    id: 9,
    name: "Outpatient Services",
    icon: "l-hospital",
    variant: "indigo",
  },
  {
    id: 10,
    name: "Intensive Care Units (ICU)",
    icon: "l-hospital",
    variant: "destructive",
  },
  {
    id: 11,
    name: "Pharmacy",
    icon: "l-hospital",
    variant: "indigo",
  },
  {
    id: 12,
    name: "Rehabilitation Services",
    icon: "l-hospital",
    variant: "teal",
  },
  {
    id: 13,
    name: "Home Care Services",
    icon: "l-hospital",
    variant: "teal",
  },
  {
    id: 14,
    name: "Psychosocial Support",
    icon: "l-hospital",
    variant: "purple",
  },
  {
    id: 15,
    name: "Respite Care",
    icon: "l-hospital",
    variant: "destructive",
  },
  {
    id: 16,
    name: "Daycare Programs",
    icon: "l-hospital",
    variant: "yellow",
  },
];

export type FacilityType = {
  id: number;
  text: string;
};

export type ChoiceOption = { id: number; text: string };

export const FACILITY_CLASSIFICATIONS: Array<ChoiceOption> = [
  { id: 1, text: "Tipo I" },
  { id: 2, text: "Tipo II" },
  { id: 3, text: "Tipo III" },
  { id: 4, text: "Tipo IV" },
];

// Must match CLASSIFIED_FACILITY_TYPES in care/care/facility/models/facility.py
export const CLASSIFIED_FACILITY_TYPE_IDS = new Set([
  2, 6, 804, 830, 860, 870, 900, 920, 1100, 1200, 1300, 1400, 1600,
]);

export const FACILITY_TYPES: Array<FacilityType> = [
  // Must match FACILITY_TYPES in care/care/facility/models/facility.py —
  // the backend validates by label, not by id.
  { id: 1, text: "Instituto de Educación Médica" },
  { id: 2, text: "Hospital Privado" },
  { id: 3, text: "Otro" },
  { id: 4, text: "Consulta / Consultorio" },
  { id: 5, text: "Clínica Privada" },
  { id: 6, text: "Hospital Penitenciario" },
  { id: 7, text: "TeleMedicina" },
  { id: 9, text: "Laboratorio Público" },
  { id: 10, text: "Laboratorio Privado" },
  { id: 800, text: "Ambulatorio Rural" },
  { id: 802, text: "Centro de Salud Sexual y Reproductiva" },
  { id: 803, text: "Ambulatorio Urbano" },
  { id: 804, text: "Consultorio Popular (CPT)" },
  { id: 805, text: "Consultorio Odontológico Popular (COP)" },
  { id: 806, text: "Clínica Popular (CP)" },
  { id: 807, text: "Óptica Popular (OP)" },
  { id: 830, text: "Hospital Municipal" },
  { id: 840, text: "Casa de la Mujer" },
  { id: 860, text: "Hospital Regional" },
  { id: 870, text: "Hospital Universitario" },
  { id: 900, text: "Hospital General" },
  { id: 910, text: "Instituto Autónomo Hospitalario" },
  { id: 920, text: "Hospital" },
  { id: 1010, text: "Centro de Diagnóstico Integral (CDI)" },
  { id: 1020, text: "Centro de Alta Tecnología (CAT)" },
  { id: 1100, text: "Hospital de Especialidades" },
  { id: 1200, text: "Hospital Pediátrico" },
  { id: 1300, text: "Hospital Gineco-Obstétrico" },
  { id: 1400, text: "Hospital Mental" },
  { id: 1500, text: "Sala de Rehabilitación Integral (SRI)" },
  { id: 1510, text: "Policlínico" },
  { id: 1600, text: "Hospital Militar" },
  { id: 3000, text: "Organización No Gubernamental Clínica" },
  { id: 3001, text: "Organización No Gubernamental No Clínica" },
  { id: 4000, text: "Organización Comunitaria" },

  // { id: 8, text: "Govt Hospital" },
  // { id: 801, text: "24x7 Public Health Centres" },
  // { id: 820, text: "Urban Primary Health Center" },
  // { id: 831, text: "Taluk Headquarters Hospitals" },
  // { id: 850, text: "General hospitals" },

  // { id: 900, text: "Co-operative hospitals" },

  // { id: 950, text: "Corona Testing Labs" },
  // { id: 1000, text: "Corona Care Centre" },

  // { id: 1010, text: "COVID-19 Domiciliary Care Center" },
  // { id: 1100, text: "First Line Treatment Centre" },
  // { id: 1200, text: "Second Line Treatment Center" },
  // { id: 1400, text: "Covid Management Center" },
  // { id: 1600, text: "District War Room" },
  { id: 3000, text: "Clinical Non Governmental Organization" },
  { id: 3001, text: "Non Clinical Non Governmental Organization" },
  { id: 4000, text: "Community Based Organization" },
];
