import { HttpMethod, PaginatedResponse, Type } from "@/Utils/request/types";

import { SpecialtyCreate, SpecialtyRead } from "./specialty";

export default {
  list: {
    path: "/api/v1/specialty/",
    method: HttpMethod.GET,
    TRes: Type<PaginatedResponse<SpecialtyRead>>(),
  },
  create: {
    path: "/api/v1/specialty/",
    method: HttpMethod.POST,
    TRes: Type<SpecialtyRead>(),
    TBody: Type<SpecialtyCreate>(),
  },
} as const;
