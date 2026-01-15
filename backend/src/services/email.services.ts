// src/services/emailService.ts
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import imap from "imap-simple";
import { simpleParser } from "mailparser";
import { PDFParse } from "pdf-parse";
import { extractProposalDataWithAI } from "./ai.services";
import { prisma } from "../config/prisma";
import pdfParser from "../lib/pdfParser";
import path from "path";
import fs from "fs";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendRfp(email: string, subject: string, text: string) {
  try {
    await transporter.sendMail({
      from: `"Manager" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: subject,
      text,
    });
    console.log(`email sent to ${email}`);
  } catch (error) {
    console.error(" Failed to send rfp:", error);
    throw error;
  }
}

export async function pollVendorEmails() {
  const config = {
    imap: {
      user: process.env.EMAIL_USER!,
      password: process.env.EMAIL_PASS!,
      host: "imap.gmail.com",
      port: 993,
      tls: true,
      tlsOptions: {
        rejectUnauthorized: false,
      },
      authTimeout: 3000,
    },
  };

  try {
    const connection = await imap.connect(config);
    await connection.openBox("INBOX");

    const searchCriteria = ["UNSEEN"];
    const fetchOptions = { bodies: [""], struct: true };
    const messages = await connection.search(searchCriteria, fetchOptions);

    console.log(`Found ${messages.length} new emails.`);
    console.log(messages);

    for (const message of messages) {
      const all = message.parts.find((part) => part.which === "");
      const id = message.attributes.uid;
      if (!all || !all.body) {
        console.log("Empty message body, skipping...");
        continue; // Skip this message in the loop
      }
      const parsed = await simpleParser(all.body);

      const emailBody = parsed.text || "";
      const emailSubject = parsed.subject || "";
      const emailFrom = parsed.from?.text || "";

      // 1. Locate Tracking IDs
      const rfpMatch = emailBody.match(/\[RFP:(.*?)\]/);
      const vndMatch = emailBody.match(/\[VND:(.*?)\]/);

      if (!rfpMatch || !vndMatch) {
        console.log("Foreign email detected (no tracking tags). Skipping...");

        // OPTIONAL: Mark as read so you don't keep checking this spam
        await connection.addFlags(id, "\\Seen");
        continue;
      }

      const rfpId = rfpMatch[1];
      const vendorId = vndMatch[1];

      // 2. Fetch RFP Context from DB (Crucial for AI accuracy) and checking the vendor also
      const rfp = await prisma.rFP.findUnique({
        where: { id: rfpId },
        select: {
          title: true,
          description: true,
          chatSession: {
            select: {
              id: true,
            },
          },
        },
      });
      const vendor = await prisma.vendor.findUnique({
        where: { id: vendorId },
      });

      if (
        !rfp ||
        !rfp.chatSession ||
        !vendor ||
        !emailFrom.includes(vendor.email)
      )
        continue;

      // 3. Handle Attachments (PDFs)
      let pdfText = "";
      const attachmentsData = [];

      for (const att of parsed.attachments) {
        if (att.contentType === "application/pdf") {
          // extracts the text from pdf
          const extractedPdfText = await pdfParser(att.content);
          pdfText += `\n--- ATTACHMENT: ${att.filename} ---\n${extractedPdfText}`;

          // Note: In a real app, the att.content will be saved to server disk or S3
          attachmentsData.push({
            filename: att.filename || "quote.pdf",
            mimeType: att.contentType,
          });
        }
      }

      // 4. USE GEMINI TO PARSED THE DATA
      // Pass body, pdf text, and the original RFP context
      console.log(`Sending data to Gemini for RFP: ${rfp.title}...`);
      const aiResponse = await extractProposalDataWithAI(emailBody, pdfText, {
        title: rfp.title,
        description: rfp.description,
      });

      // 5. Upsert to Database
      await prisma.proposal.upsert({
        where: { rfpId_vendorId: { rfpId, vendorId } },
        update: {
          price: aiResponse.price,
          deliveryDays: aiResponse.deliveryDays,
          warranty: aiResponse.warranty,
          paymentTerms: aiResponse.paymentTerms,
          aiSummary: aiResponse.aiSummary,
          aiScore: aiResponse.aiScore,
          notes: aiResponse.notes,
          rawEmailBody: emailBody,
          status: "RECEIVED",
        },
        create: {
          rfpId,
          vendorId,
          price: aiResponse.price,
          deliveryDays: aiResponse.deliveryDays,
          warranty: aiResponse.warranty,
          paymentTerms: aiResponse.paymentTerms,
          aiSummary: aiResponse.aiSummary,
          aiScore: aiResponse.aiScore,
          notes: aiResponse.notes,
          rawEmailBody: emailBody,
          emailFrom,
          emailSubject,
          attachments: { create: attachmentsData },
        },
      });
      const systemMsg = `Got Reply from:\n${vendor.name}`;
      await prisma.chatMessage.create({
        data: {
          content: systemMsg,
          role: "SYSTEM",
          chatSessionId: rfp.chatSession.id,
        },
      });
      // 6. Mark as Read
      await connection.addFlags(id, "\\Seen");
      console.log(`Successfully processed proposal from ${emailFrom}`);
    }

    connection.end();
  } catch (err) {
    console.error("Polling Error:", err);
  }
}
