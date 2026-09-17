#!/usr/bin/env python3
import sys
import json
import requests
from urllib.parse import urlparse

API_BASE = "https://docs-api.cn-beijing.volces.com/api/v1/doc"
REQUEST_TIMEOUT = 15  # 15-second timeout to avoid hanging forever
UNIVERSAL_AI_SEARCH_SERVICE_CODE = "Universal AI Search"
UNIVERSAL_AI_SEARCH_SERVICE_CODE_NORMALIZED = UNIVERSAL_AI_SEARCH_SERVICE_CODE.lower()
ALLOWED_DOC_HOST = "www.volcengine.com"
ALLOWED_DOC_PREFIX = "/docs/85296"

# Negative keyword filtering has been removed; all queries are allowed by default


def configure_utf8_stdout():
    """Emit Unicode JSON consistently on Windows and POSIX terminals."""
    reconfigure = getattr(sys.stdout, "reconfigure", None)
    if callable(reconfigure):
        reconfigure(encoding="utf-8")


def normalize_service_codes(service_codes):
    if not service_codes:
        return [UNIVERSAL_AI_SEARCH_SERVICE_CODE]
    normalized = []
    for code in service_codes:
        trimmed = code.strip()
        if trimmed:
            normalized.append(trimmed)
    return normalized or [UNIVERSAL_AI_SEARCH_SERVICE_CODE]


def is_allowed_universal_ai_search_url(doc_url):
    parsed = urlparse(doc_url)
    return parsed.scheme in {"http", "https"} and parsed.netloc == ALLOWED_DOC_HOST and parsed.path.startswith(ALLOWED_DOC_PREFIX)


def filter_universal_ai_search_doc_list(doc_list):
    filtered = []
    for doc in doc_list:
        if not isinstance(doc, dict):
            continue
        url = doc.get("Url")
        service_codes = [str(code).lower() for code in doc.get("ServiceCodes", []) if isinstance(code, str)]
        if isinstance(url, str) and is_allowed_universal_ai_search_url(url) and UNIVERSAL_AI_SEARCH_SERVICE_CODE_NORMALIZED in service_codes:
            filtered.append(doc)
    return filtered

def search(query, limit=10, service_codes=None):
    """Search Volcengine official documentation."""
    normalized_service_codes = normalize_service_codes(service_codes)
    if normalized_service_codes != [UNIVERSAL_AI_SEARCH_SERVICE_CODE]:
        return {"error": "Only ServiceCodes=\"Universal AI Search\" is allowed for Viking AI Search documentation lookup"}

    url = f"{API_BASE}/search"
    payload = {
        "Query": query,
        "Limit": limit,
        "ServiceCodes": [UNIVERSAL_AI_SEARCH_SERVICE_CODE]
    }

    headers = {
        "Content-Type": "application/json"
    }
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        result = response.json()
        doc_list = (
            result.get("Result", {}).get("DocList", [])
            if isinstance(result, dict) and isinstance(result.get("Result"), dict)
            else []
        )
        filtered = filter_universal_ai_search_doc_list(doc_list)
        if isinstance(result, dict) and isinstance(result.get("Result"), dict):
            result["Result"]["DocList"] = filtered
            result["Result"]["FilteredBy"] = {
                "ServiceCodes": [UNIVERSAL_AI_SEARCH_SERVICE_CODE],
                "UrlPrefix": f"https://{ALLOWED_DOC_HOST}{ALLOWED_DOC_PREFIX}"
            }
        return result
    except Exception as e:
        return {"error": f"Search request failed: {str(e)}"}

def fetch(doc_url):
    """Fetch full documentation content and strip query parameters automatically."""
    parsed = urlparse(doc_url)
    # Strip query parameters and fragments so the request always uses a clean page URL.
    clean_url = f"{parsed.scheme}://{parsed.netloc}{parsed.path}"
    if not is_allowed_universal_ai_search_url(clean_url):
        return {"error": f"Fetch is only allowed for URLs under https://{ALLOWED_DOC_HOST}{ALLOWED_DOC_PREFIX}"}
    
    url = f"{API_BASE}/fetch"
    payload = {
        "Url": clean_url
    }
    headers = {
        "Content-Type": "application/json"
    }
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        result = response.json()
        # Always return the clean URL so callers can cite a stable page link.
        if "Result" in result:
            result["Result"]["CleanUrl"] = clean_url
        return result
    except Exception as e:
        return {"error": f"Fetch request failed: {str(e)}"}

def print_help():
    help_info = {
        "name": "volcengine-docs documentation helper",
        "usage": [
            {
                "action": "search",
                "desc": "Search Volcengine documentation",
                "params": "<query> [limit] [service_code_1,service_code_2...]",
                "example": 'python volcengine_docs.py search "what is Viking AI Search scene" 3 "Universal AI Search"'
            },
            {
                "action": "fetch",
                "desc": "Fetch full page content from a Volcengine documentation URL",
                "params": "<volcengine_documentation_url>",
                "example": 'python volcengine_docs.py fetch "https://www.volcengine.com/docs/85296/1544972?lang=zh"'
            }
        ],
        "constraints": {
            "service_code": UNIVERSAL_AI_SEARCH_SERVICE_CODE,
            "url_prefix": f"https://{ALLOWED_DOC_HOST}{ALLOWED_DOC_PREFIX}"
        }
    }
    print(json.dumps(help_info, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    configure_utf8_stdout()
    if len(sys.argv) < 2:
        print_help()
        sys.exit(1)
    
    action = sys.argv[1]
    result = {}
    
    if action == "search":
        if len(sys.argv) < 3:
            result = {"error": "Missing query", "help": "Usage: python volcengine_docs.py search <query> [limit] [service_code_1,service_code_2...]; use \"Universal AI Search\" only"}
        else:
            query = sys.argv[2]
            limit = 10
            service_codes = [UNIVERSAL_AI_SEARCH_SERVICE_CODE]
            if len(sys.argv) >=4:
                try:
                    limit = int(sys.argv[3])
                except ValueError:
                    result = {"error": "Limit must be a number"}
            if len(sys.argv) >=5:
                service_codes = sys.argv[4].split(",")
            
            if "error" not in result:
                result = search(query, limit, service_codes)
    
    elif action == "fetch":
        if len(sys.argv) < 3:
            result = {"error": "Missing document URL", "help": "Usage: python volcengine_docs.py fetch <volcengine_documentation_url>; URL must stay under https://www.volcengine.com/docs/85296"}
        else:
            doc_url = sys.argv[2]
            result = fetch(doc_url)
    
    else:
        result = {"error": f"Unknown action: {action}", "help": "Supported actions: search, fetch"}
    
    print(json.dumps(result, ensure_ascii=False, indent=2))
    if "error" in result:
        sys.exit(1)
