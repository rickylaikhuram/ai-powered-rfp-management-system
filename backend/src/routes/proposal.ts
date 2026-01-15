import { Router } from "express";
import {
  generateComparisonReport,
  getProposalMails,
  getProposalMailsById,
} from "../controller/proposal.controller";

const router = Router();

// get mail history
router.get("/mails/:sessionId", getProposalMails);

// get details for a specific mail
router.get("/mails/proposal/:proposalId", getProposalMailsById);

// compare proposals of vendors with rfp
router.post("/compare", generateComparisonReport);

export default router;
