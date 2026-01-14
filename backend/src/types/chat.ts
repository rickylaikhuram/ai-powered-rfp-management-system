import { RFPStatus } from "../generated/prisma/enums";

export interface UpdateData {
  status: RFPStatus;
  title?: string;
  description?: string;
}