"use server"

import nodemailer from "nodemailer";
import { FROM_EMAIL, SERVER_URL } from "./constants";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT || 587,
  secure: false, // 465 の場合は true, 587 の場合は false
  auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
  },
});


export async function sendVerificationEmail({
  email,
  token,
  name,
}: {
  email: string
  token: string
  name: string
}) {
  console.log(`Sending verification email to ${email} with token ${token}`)

  // const verifyLink = `${SERVER_URL}/verify-email/`;

  const mailData = {
    to: email,
    subject: `Verify your email`,
    from: `"No Reply" <${FROM_EMAIL as string}>`,
    html: `
    <h1>Verify your email</h1>
    <p>Hi ${name},</p>
    <p>Verify your email by using the following token.</p>
    <p>${token}</p>
    <p>Token will expire in 1 hour.</p>
    `,
  };
  return transporter.sendMail(mailData, function (err, info) {
    if(err) {
      console.log(err)
      throw new Error('Failed to send email');
    } else {
      console.log(info)
    }
  });
}

export async function sendPasswordResetEmail({
  email,
  token,
  name,
}: {
  email: string
  token: string
  name: string
}) {
  console.log(`Sending password reset email to ${email} with token ${token}`)

  const resetLink = `${SERVER_URL}/reset-password/${token}`;

  const mailData = {
    to: email,
    subject: `Reset your password`,
    from: `"No Reply" <${FROM_EMAIL as string}>`,
    html: `
    <h1>Reset your password</h1>
    <p>Hi ${name},</p>
    <p>Click <a href="${resetLink}">here</a> to reset password.</p>
    <p>This link will expire in 1 hour.</p>
    `,
  };
  return transporter.sendMail(mailData, function (err, info) {
    if(err) {
      console.log(err)
      throw new Error('Failed to send email');
    } else {
      console.log(info)
    }
  });
}

