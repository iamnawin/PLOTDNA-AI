import smtplib
from email.message import EmailMessage

from app.core.config import settings


def email_delivery_configured() -> bool:
    return bool(settings.EMAIL_SMTP_HOST and settings.EMAIL_SMTP_FROM)


def send_email_otp(*, email: str, name: str | None, otp: str, expires_in_minutes: int) -> None:
    if not email_delivery_configured():
        raise RuntimeError("Email delivery is not configured.")

    recipient_name = name or "PlotDNA user"
    message = EmailMessage()
    message["Subject"] = "Your PlotDNA verification code"
    message["From"] = settings.EMAIL_SMTP_FROM
    message["To"] = email
    message.set_content(
        "\n".join(
            [
                f"Hi {recipient_name},",
                "",
                f"Your PlotDNA verification code is {otp}.",
                f"It expires in {expires_in_minutes} minutes.",
                "",
                "If you did not request this code, you can ignore this email.",
                "",
                "PlotDNA",
            ]
        )
    )

    with smtplib.SMTP(settings.EMAIL_SMTP_HOST, int(settings.EMAIL_SMTP_PORT), timeout=12) as smtp:
        if settings.EMAIL_SMTP_USE_TLS:
            smtp.starttls()
        if settings.EMAIL_SMTP_USERNAME:
            smtp.login(settings.EMAIL_SMTP_USERNAME, settings.EMAIL_SMTP_PASSWORD)
        smtp.send_message(message)
