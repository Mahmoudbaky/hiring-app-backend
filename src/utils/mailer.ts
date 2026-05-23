import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendOtpEmail(opts: {
  to: string;
  userName: string;
  otp: string;
  companyName: string;
}) {
  const { to, userName, otp, companyName } = opts;

  await transporter.sendMail({
    from: `"${process.env.SMTP_FROM_NAME ?? "ضم"}" <${process.env.SMTP_FROM_EMAIL}>`,
    to,
    subject: `رمز تأكيد البريد — ${companyName}`,
    html: `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Tahoma,Arial,sans-serif;direction:rtl;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.07);">
        <tr>
          <td style="background:linear-gradient(135deg,#1a0a00 0%,#3d1500 100%);padding:32px 40px;">
            <div style="font-size:26px;font-weight:800;color:#ffffff;">ضم</div>
            <div style="font-size:12px;color:rgba(255,255,255,0.6);margin-top:2px;">منصة إدارة التوظيف</div>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px 28px;">
            <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#e07b39;text-transform:uppercase;letter-spacing:1px;">تأكيد البريد الإلكتروني</p>
            <h1 style="margin:0 0 14px;font-size:22px;font-weight:800;color:#111827;">مرحباً، ${userName}</h1>
            <p style="margin:0 0 28px;font-size:14px;line-height:1.7;color:#4b5563;">
              أدخل الرمز أدناه لتأكيد بريد شركة <strong style="color:#111827;">${companyName}</strong> وتفعيل الحساب.
              صلاحية الرمز <strong>10 دقائق</strong>.
            </p>
            <div style="background:#faf5f0;border:2px dashed #e07b39;border-radius:10px;padding:24px;text-align:center;margin-bottom:28px;">
              <div style="font-size:40px;font-weight:800;color:#c2410c;letter-spacing:12px;font-family:'Courier New',monospace;">${otp}</div>
            </div>
            <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
              إذا لم تطلب هذا الرمز، يمكنك تجاهل هذه الرسالة.<br/>
              © 2026 ضم — جميع الحقوق محفوظة.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim(),
  });
}

export async function sendWelcomeEmail(opts: {
  to: string;
  userName: string;
  companyName: string;
  uniqueCode: string;
}) {
  const { to, userName, companyName, uniqueCode } = opts;

  await transporter.sendMail({
    from: `"${process.env.SMTP_FROM_NAME ?? "ضم"}" <${process.env.SMTP_FROM_EMAIL}>`,
    to,
    subject: `مرحباً بك في ضم — ${companyName}`,
    html: `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>مرحباً بك في ضم</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Tahoma,Arial,sans-serif;direction:rtl;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.07);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a0a00 0%,#3d1500 100%);padding:40px 48px;text-align:right;">
              <div style="font-size:28px;font-weight:800;color:#000000;letter-spacing:-0.5px;">ضم</div>
              <div style="font-size:13px;color:#000000;margin-top:4px;">منصة إدارة التوظيف</div>
            </td>
          </tr>

          <!-- Hero -->
          <tr>
            <td style="padding:40px 48px 32px;text-align:right;">
              <div style="font-size:13px;font-weight:600;color:#e07b39;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;">
                حساب جديد
              </div>
              <h1 style="margin:0 0 12px;font-size:26px;font-weight:800;color:#111827;line-height:1.25;">
                مرحباً بك، ${userName} 👋
              </h1>
              <p style="margin:0;font-size:15px;line-height:1.7;color:#4b5563;">
                تم إنشاء حساب شركة <strong style="color:#111827;">${companyName}</strong> بنجاح على منصة ضم.
                يمكنك الآن نشر الوظائف ومراجعة المتقدمين وإدارة طلبات التوظيف من مكان واحد.
              </p>
            </td>
          </tr>

          <!-- Company code card -->
          <tr>
            <td style="padding:0 48px 32px;">
              <div style="background:#faf5f0;border:1.5px dashed #e07b39;border-radius:10px;padding:20px 24px;text-align:center;">
                <div style="font-size:12px;color:#9ca3af;margin-bottom:8px;text-transform:uppercase;letter-spacing:1px;">كود الشركة الخاص بك</div>
                <div style="font-size:32px;font-weight:800;color:#c2410c;letter-spacing:6px;font-family:'Courier New',monospace;">${uniqueCode}</div>
                <div style="font-size:12px;color:#6b7280;margin-top:8px;">شارك هذا الكود مع المتقدمين لتقديم طلباتهم مباشرة</div>
              </div>
            </td>
          </tr>

          <!-- Features -->
          <tr>
            <td style="padding:0 48px 36px;">
              <p style="margin:0 0 16px;font-size:14px;font-weight:600;color:#111827;">ما يمكنك فعله الآن:</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;">
                    <span style="color:#e07b39;font-size:16px;margin-left:10px;">✦</span>
                    <span style="font-size:14px;color:#374151;">نشر إعلانات الوظائف وتحديد المتطلبات</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;">
                    <span style="color:#e07b39;font-size:16px;margin-left:10px;">✦</span>
                    <span style="font-size:14px;color:#374151;">مراجعة طلبات المتقدمين وتصنيفها</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;">
                    <span style="color:#e07b39;font-size:16px;margin-left:10px;">✦</span>
                    <span style="font-size:14px;color:#374151;">تتبع حالة كل مرشح من المراجعة حتى التوظيف</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:0 48px 40px;text-align:center;">
              <a href="${process.env.FRONTEND_URL ?? "http://localhost:5173"}/login"
                 style="display:inline-block;background:#c2410c;color:#ffffff;font-size:15px;font-weight:700;padding:14px 36px;border-radius:8px;text-decoration:none;letter-spacing:0.3px;">
                ابدأ الآن
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:24px 48px;border-top:1px solid #f3f4f6;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
                تلقيت هذا البريد لأنك سجّلت على منصة ضم.<br/>
                © 2026 ضم — جميع الحقوق محفوظة.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
    `.trim(),
  });
}
