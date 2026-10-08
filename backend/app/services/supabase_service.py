from supabase import create_client, Client
from app.core.config import settings
from typing import Optional


class SupabaseService:
    def __init__(self):
        self.client: Optional[Client] = None
        if settings.SUPABASE_URL and settings.SUPABASE_ANON_KEY:
            self.client = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
    
    def get_client(self) -> Optional[Client]:
        return self.client
    
    def get_admin_client(self) -> Optional[Client]:
        if settings.SUPABASE_URL and settings.SUPABASE_SERVICE_ROLE_KEY:
            return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
        return None
    
    # Auth helpers
    async def sign_up(self, email: str, password: str, data: dict = None):
        if not self.client:
            raise ValueError("Supabase not configured")
        return self.client.auth.sign_up({"email": email, "password": password, "data": data})
    
    async def sign_in(self, email: str, password: str):
        if not self.client:
            raise ValueError("Supabase not configured")
        return self.client.auth.sign_in_with_password({"email": email, "password": password})
    
    async def sign_out(self):
        if not self.client:
            raise ValueError("Supabase not configured")
        return self.client.auth.sign_out()
    
    async def get_user(self, access_token: str):
        if not self.client:
            raise ValueError("Supabase not configured")
        return self.client.auth.get_user(access_token)
    
    # Database helpers (using Supabase client directly)
    def table(self, table_name: str):
        if not self.client:
            raise ValueError("Supabase not configured")
        return self.client.table(table_name)
    
    # Storage helpers
    def storage(self, bucket_name: str):
        if not self.client:
            raise ValueError("Supabase not configured")
        return self.client.storage.from_(bucket_name)
    
    # Realtime helpers
    def channel(self, channel_name: str):
        if not self.client:
            raise ValueError("Supabase not configured")
        return self.client.channel(channel_name)


supabase_service = SupabaseService()