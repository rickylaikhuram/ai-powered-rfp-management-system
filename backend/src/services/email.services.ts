// src/services/emailService.ts
import nodemailer from "nodemailer";
import dotenv from "dotenv";

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
