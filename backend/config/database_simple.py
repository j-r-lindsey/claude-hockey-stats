import os
import requests
from typing import Dict, Any, List, Optional

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

class SimpleSupabaseClient:
    def __init__(self, url: str, key: str):
        self.url = url.rstrip('/')
        self.key = key
        self.headers = {
            'apikey': key,
            'Authorization': f'Bearer {key}',
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        }
    
    def table(self, table_name: str):
        return SimpleTable(self.url, self.headers, table_name)

class SimpleTable:
    def __init__(self, base_url: str, headers: Dict, table_name: str):
        self.base_url = base_url
        self.headers = headers
        self.table_name = table_name
        self.url = f"{base_url}/rest/v1/{table_name}"
        self._filters = []
        self._select_fields = "*"
    
    def select(self, fields: str = "*"):
        new_table = SimpleTable(self.base_url, self.headers, self.table_name)
        new_table._filters = self._filters.copy()
        new_table._select_fields = fields
        return new_table
    
    def eq(self, column: str, value: Any):
        new_table = SimpleTable(self.base_url, self.headers, self.table_name)
        new_table._filters = self._filters.copy()
        new_table._select_fields = self._select_fields
        new_table._filters.append(f"{column}=eq.{value}")
        return new_table
    
    def ilike(self, column: str, pattern: str):
        new_table = SimpleTable(self.base_url, self.headers, self.table_name)
        new_table._filters = self._filters.copy()
        new_table._select_fields = self._select_fields
        new_table._filters.append(f"{column}=ilike.{pattern}")
        return new_table
    
    def in_(self, column: str, values: List[Any]):
        new_table = SimpleTable(self.base_url, self.headers, self.table_name)
        new_table._filters = self._filters.copy()
        new_table._select_fields = self._select_fields
        values_str = ",".join(str(v) for v in values)
        new_table._filters.append(f"{column}=in.({values_str})")
        return new_table
    
    def execute(self):
        params = {"select": self._select_fields}
        if self._filters:
            for filter_str in self._filters:
                key, value = filter_str.split("=", 1)
                params[key] = value
        
        response = requests.get(self.url, headers=self.headers, params=params)
        response.raise_for_status()
        return SimpleResponse(response.json())
    
    def insert(self, data: Dict[str, Any]):
        response = requests.post(self.url, headers=self.headers, json=data)
        response.raise_for_status()
        return SimpleResponse(response.json())
    
    def update(self, data: Dict[str, Any]):
        url = self.url
        if self._filters:
            params = {}
            for filter_str in self._filters:
                key, value = filter_str.split("=", 1)
                params[key] = value
            # Add filters as query params
            filter_params = "&".join(f"{k}={v}" for k, v in params.items())
            url += f"?{filter_params}"
        
        response = requests.patch(url, headers=self.headers, json=data)
        response.raise_for_status()
        return SimpleResponse(response.json())
    
    def delete(self):
        url = self.url
        if self._filters:
            params = {}
            for filter_str in self._filters:
                key, value = filter_str.split("=", 1)
                params[key] = value
            # Add filters as query params
            filter_params = "&".join(f"{k}={v}" for k, v in params.items())
            url += f"?{filter_params}"
        
        response = requests.delete(url, headers=self.headers)
        response.raise_for_status()
        return SimpleResponse([])

class SimpleResponse:
    def __init__(self, data):
        self.data = data if isinstance(data, list) else [data] if data else []

# Create client instances
supabase = SimpleSupabaseClient(SUPABASE_URL, SUPABASE_KEY)
supabase_admin = SimpleSupabaseClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)