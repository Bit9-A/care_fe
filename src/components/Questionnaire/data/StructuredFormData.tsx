import i18n from "@/i18n";
import { QuestionnaireRead } from "@/types/questionnaire/questionnaire";

const encounterQuestionnaire: QuestionnaireRead = {
  id: "encounter",
  slug: "encounter",
  version: "0.0.1",
  title: i18n.t("structured_q__encounter"),
  status: "active",
  subject_type: "patient",
  questions: [
    {
      id: "encounter",
      text: i18n.t("structured_q__encounter"),
      type: "structured",
      link_id: "1.1",
      required: true,
      structured_type: "encounter",
    },
  ],
};

const medication_request_questionnaire: QuestionnaireRead = {
  id: "medication_request",
  slug: "medication_request",
  version: "0.0.1",
  title: i18n.t("structured_q__medication_request"),
  status: "active",
  subject_type: "encounter",
  questions: [
    {
      id: "medication_request",
      text: i18n.t("structured_q__medication_request"),
      type: "structured",
      structured_type: "medication_request",
      link_id: "1.1",
      required: true,
    },
  ],
};

const allergy_intolerance_questionnaire: QuestionnaireRead = {
  id: "allergy_intolerance",
  slug: "allergy_intolerance",
  version: "0.0.1",
  title: i18n.t("structured_q__allergy_intolerance"),
  status: "active",
  subject_type: "encounter",
  questions: [
    {
      id: "allergy_intolerance",
      text: i18n.t("structured_q__allergy_intolerance"),
      type: "structured",
      structured_type: "allergy_intolerance",
      link_id: "1.1",
      required: true,
    },
  ],
};

const medication_statement_questionnaire: QuestionnaireRead = {
  id: "medication_statement",
  slug: "medication_statement",
  version: "0.0.1",
  title: i18n.t("structured_q__medication_statement"),
  status: "active",
  subject_type: "encounter",
  questions: [
    {
      id: "medication_statement",
      text: i18n.t("structured_q__medication_statement"),
      type: "structured",
      structured_type: "medication_statement",
      link_id: "1.1",
      required: true,
    },
  ],
};

const service_request_questionnaire: QuestionnaireRead = {
  id: "service_request",
  slug: "service_request",
  version: "0.0.1",
  title: i18n.t("structured_q__service_request"),
  status: "active",
  subject_type: "encounter",
  questions: [
    {
      id: "service_request",
      text: i18n.t("structured_q__service_request"),
      type: "structured",
      structured_type: "service_request",
      link_id: "1.1",
      required: true,
    },
  ],
};

const diagnosis_questionnaire: QuestionnaireRead = {
  id: "diagnosis",
  slug: "diagnosis",
  version: "0.0.1",
  title: i18n.t("structured_q__diagnosis"),
  status: "active",
  subject_type: "encounter",
  questions: [
    {
      id: "diagnosis",
      text: i18n.t("structured_q__diagnosis"),
      type: "structured",
      structured_type: "diagnosis",
      link_id: "1.1",
      required: true,
    },
  ],
};

const symptom_questionnaire: QuestionnaireRead = {
  id: "symptom",
  slug: "symptom",
  version: "0.0.1",
  title: i18n.t("structured_q__symptom"),
  status: "active",
  subject_type: "encounter",
  questions: [
    {
      id: "symptom",
      text: i18n.t("structured_q__symptom"),
      type: "structured",
      structured_type: "symptom",
      link_id: "1.1",
      required: true,
    },
  ],
};

const files_questionnaire: QuestionnaireRead = {
  id: "files",
  slug: "files",
  version: "0.0.1",
  title: i18n.t("structured_q__files"),
  status: "active",
  subject_type: "encounter",
  questions: [
    {
      id: "files",
      text: i18n.t("structured_q__files"),
      type: "structured",
      structured_type: "files",
      link_id: "1.1",
      required: true,
    },
  ],
};

const time_of_death_questionnaire: QuestionnaireRead = {
  id: "time_of_death",
  slug: "time_of_death",
  version: "0.0.1",
  title: i18n.t("structured_q__time_of_death"),
  status: "active",
  subject_type: "patient",
  questions: [
    {
      id: "time_of_death",
      text: i18n.t("structured_q__time_of_death"),
      type: "structured",
      structured_type: "time_of_death",
      link_id: "1.1",
      required: true,
    },
  ],
};

const charge_item_questionnaire: QuestionnaireRead = {
  id: "charge_item",
  slug: "charge_item",
  version: "0.0.1",
  title: i18n.t("structured_q__charge_item"),
  status: "active",
  subject_type: "encounter",
  questions: [
    {
      id: "charge_item",
      text: i18n.t("structured_q__charge_item"),
      type: "structured",
      structured_type: "charge_item",
      link_id: "1.1",
      required: true,
    },
  ],
};

const appointment_questionnaire: QuestionnaireRead = {
  id: "appointment",
  slug: "appointment",
  version: "0.0.1",
  title: i18n.t("structured_q__appointment"),
  status: "active",
  subject_type: "encounter",
  questions: [
    {
      id: "appointment",
      text: i18n.t("structured_q__appointment"),
      type: "structured",
      structured_type: "appointment",
      link_id: "1.1",
      required: true,
    },
  ],
};

export const STRUCTURED_QUESTIONS = [
  {
    value: "allergy_intolerance",
    label: i18n.t("structured_q__allergy_intolerance"),
    questionnaire: allergy_intolerance_questionnaire,
  },
  {
    value: "medication_request",
    label: i18n.t("structured_q__medication_request"),
    questionnaire: medication_request_questionnaire,
  },
  {
    value: "medication_statement",
    label: i18n.t("structured_q__medication_statement"),
    questionnaire: medication_statement_questionnaire,
  },
  {
    value: "symptom",
    label: i18n.t("structured_q__symptom"),
    questionnaire: symptom_questionnaire,
  },
  {
    value: "diagnosis",
    label: i18n.t("structured_q__diagnosis"),
    questionnaire: diagnosis_questionnaire,
  },
  {
    value: "encounter",
    label: i18n.t("structured_q__encounter"),
    questionnaire: encounterQuestionnaire,
  },
  {
    value: "time_of_death",
    label: i18n.t("structured_q__time_of_death"),
    questionnaire: time_of_death_questionnaire,
  },
  {
    value: "files",
    label: i18n.t("structured_q__files"),
    questionnaire: files_questionnaire,
  },
  {
    value: "service_request",
    label: i18n.t("structured_q__service_request"),
    questionnaire: service_request_questionnaire,
  },
  {
    value: "charge_item",
    label: i18n.t("structured_q__charge_item"),
    questionnaire: charge_item_questionnaire,
  },
  {
    value: "appointment",
    label: i18n.t("structured_q__appointment"),
    questionnaire: appointment_questionnaire,
  },
] as const;

export const FIXED_QUESTIONNAIRES: Record<string, QuestionnaireRead> =
  STRUCTURED_QUESTIONS.reduce(
    (acc, question) => {
      if ("questionnaire" in question) {
        acc[question.questionnaire.slug] = question.questionnaire;
      }
      return acc;
    },
    {} as Record<string, QuestionnaireRead>,
  );

export type StructuredQuestionType =
  (typeof STRUCTURED_QUESTIONS)[number]["value"];

export function filterStructuredQuestionnaireSlugs(slug?: string) {
  return slug &&
    STRUCTURED_QUESTIONS.map(
      (question) => question.questionnaire.slug,
    ).includes(slug)
    ? undefined
    : slug;
}
