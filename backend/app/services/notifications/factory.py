from app.core.config import settings
from app.services.notifications.sms_base import SMSProvider
from app.services.notifications.mock_sms import MockSMSProvider


def get_sms_provider() -> SMSProvider:
    # MVP uses MockSMSProvider unless a real provider is configured
    return MockSMSProvider()
