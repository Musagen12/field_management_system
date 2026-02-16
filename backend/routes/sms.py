# top of module, before any requests calls
from urllib3.contrib import pyopenssl
pyopenssl.inject_into_urllib3()

import os
import logging
import requests
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

router = APIRouter(tags=["SMS"])
logger = logging.getLogger(__name__)

# --- Config ---
AT_USERNAME = os.getenv("AFRICASTALKING_USERNAME", "sandbox")
AT_API_KEY = os.getenv(
    "AFRICASTALKING_API_KEY",
    "atsk_398db02bbf4afb3b0be1f838e7acbe244f900abbfd60cef930a1283db34b9565712d6c2d",
)
AT_SENDER_ID = os.getenv("AFRICASTALKING_SENDER_ID", "32578")

AT_BASE_URL = (
    "https://api.africastalking.com/version1/messaging"
    if AT_USERNAME != "sandbox"
    else "https://api.sandbox.africastalking.com/version1/messaging"
)


# --- Core function ---
def send_sms(phone_number: str, message: str) -> dict:
    # Normalize phone number
    normalized = phone_number.strip()
    if not normalized.startswith("+"):
        if normalized.startswith("0"):
            normalized = f"+254{normalized[1:]}"
        elif normalized.startswith("254"):
            normalized = f"+{normalized}"

    headers = {
        "apiKey": AT_API_KEY,
        "Accept": "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
    }
    data = {
        "username": AT_USERNAME,
        "to": normalized,
        "message": message,
    }
    if AT_SENDER_ID:
        data["from"] = AT_SENDER_ID

    try:
        resp = requests.post(AT_BASE_URL, headers=headers, data=data, timeout=15)
        logger.info("AT response: %s %s", resp.status_code, resp.text)

        # Accept 200 or 201 as success
        if resp.status_code not in (200, 201):
            return {
                "status": "failed",
                "error": f"HTTP {resp.status_code}",
                "raw": resp.text,
            }

        res = resp.json()
        recipients = res.get("SMSMessageData", {}).get("Recipients", [])
        return {
            "status": recipients[0].get("status") if recipients else "failed",
            "messageId": recipients[0].get("messageId") if recipients else None,
            "raw": res,
        }
    except Exception as e:
        logger.error("AT error: %s", e)
        raise


# --- Request Model ---
class SMSRequest(BaseModel):
    phone_number: str
    message: str


# --- Endpoint ---
@router.post("/send-sms")
def send_sms_endpoint(req: SMSRequest):
    try:
        result = send_sms(req.phone_number, req.message)
        # Mark as success only if status is not "failed"
        success = result.get("status") != "failed"
        return {"success": success, "result": result}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e)
        )
