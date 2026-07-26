import ipaddress
import re
from typing import Any, Dict, List, Optional

# Regex for checking valid DNS labels (alphanumeric and hyphens, max 63 chars, no start/end with hyphen)
DNS_LABEL_REGEX = re.compile(r"^(?![0-9-]+$)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$")
# Relaxed slightly to allow labels that are pure numbers or contain underscores (e.g. _sip, _tcp, _acme-challenge)
DNS_LABEL_REGEX_RELAXED = re.compile(r"^[a-zA-Z0-9_](?:[a-zA-Z0-9_-]{0,61}[a-zA-Z0-9_])?$")

def is_valid_hostname(hostname: str, allow_wildcard: bool = False, allow_root: bool = False) -> bool:
    """
    Validates a hostname according to RFC rules.
    """
    if hostname == "." and allow_root:
        return True
        
    hostname = hostname.strip().lower()
    if not hostname:
        return False
        
    # Remove trailing dot for label checks, but remember it
    if hostname.endswith("."):
        hostname = hostname[:-1]
        
    if not hostname:
        return False

    labels = hostname.split(".")
    
    # Check total length
    if len(hostname) > 253:
        return False

    for i, label in enumerate(labels):
        if not label:
            return False
            
        # Wildcard validation (only allowed as the first label, e.g. *.example.com)
        if label == "*":
            if allow_wildcard and i == 0:
                continue
            return False
            
        if len(label) > 63:
            return False
            
        # Check characters
        if not DNS_LABEL_REGEX_RELAXED.match(label):
            return False
            
    return True

def validate_ipv4(value: str) -> bool:
    try:
        ipaddress.IPv4Address(value.strip())
        return True
    except ValueError:
        return False

def validate_ipv6(value: str) -> bool:
    try:
        ipaddress.IPv6Address(value.strip())
        return True
    except ValueError:
        return False

def validate_record_value(record_type: str, value: Optional[str], extra_json: Optional[Dict[str, Any]]) -> str | None:
    """
    Validates the value or extra_json of a record.
    Returns None if valid, or a string error message if invalid.
    """
    record_type = record_type.upper()
    
    if record_type == "A":
        if not value or not validate_ipv4(value):
            return "Value must be a valid IPv4 address (e.g. 192.0.2.1)"
            
    elif record_type == "AAAA":
        if not value or not validate_ipv6(value):
            return "Value must be a valid IPv6 address (e.g. 2001:db8::1)"
            
    elif record_type == "CNAME":
        if not value or not is_valid_hostname(value, allow_wildcard=True):
            return "Value must be a valid DNS hostname (e.g. lb.provider.com.)"
            
    elif record_type == "TXT":
        if not value or not value.strip():
            return "Value must be a non-empty string"
        # TXT records should not exceed 4096 characters total
        if len(value) > 4096:
            return "TXT record value cannot exceed 4096 characters"
            
    elif record_type == "NS":
        if not value or not is_valid_hostname(value):
            return "Value must be a valid nameserver hostname (e.g. ns-1.awsdns.com.)"
            
    elif record_type == "PTR":
        if not value or not is_valid_hostname(value, allow_wildcard=True):
            return "Value must be a valid pointer target hostname"
            
    elif record_type == "MX":
        if not extra_json:
            return "MX record requires structured extra_json data"
        priority = extra_json.get("priority")
        mail_server = extra_json.get("mail_server")
        if priority is None or not isinstance(priority, int) or priority < 0 or priority > 65535:
            return "MX priority must be an integer between 0 and 65535"
        if not mail_server or not is_valid_hostname(str(mail_server)):
            return "MX mail server must be a valid DNS hostname"
            
    elif record_type == "SRV":
        if not extra_json:
            return "SRV record requires structured extra_json data"
        priority = extra_json.get("priority")
        weight = extra_json.get("weight")
        port = extra_json.get("port")
        target = extra_json.get("target")
        
        for field, name in [(priority, "priority"), (weight, "weight"), (port, "port")]:
            if field is None or not isinstance(field, int) or field < 0 or field > 65535:
                return f"SRV {name} must be an integer between 0 and 65535"
        if not target or not is_valid_hostname(str(target), allow_root=True):
            return "SRV target must be a valid DNS hostname (or '.' to indicate service is unavailable)"
            
    elif record_type == "CAA":
        if not extra_json:
            return "CAA record requires structured extra_json data"
        flag = extra_json.get("flag")
        tag = extra_json.get("tag")
        val = extra_json.get("value")
        
        if flag not in [0, 128]:
            return "CAA flag must be either 0 (non-critical) or 128 (critical)"
        if tag not in ["issue", "issuewild", "iodef"]:
            return "CAA tag must be 'issue', 'issuewild', or 'iodef'"
        if not val or not isinstance(val, str) or not val.strip():
            return "CAA value must be a non-empty string"
            
    return None

def normalize_fqdn(name: str, zone_name: str) -> str:
    """
    Given a record name (which could be relative to zone, '@', or FQDN) and the zone name,
    returns the fully qualified domain name with a trailing dot.
    """
    name = name.strip().lower()
    zone_name = zone_name.strip().lower()
    
    if not zone_name.endswith("."):
        zone_name += "."
        
    if name == "@" or name == "":
        return zone_name
        
    if name.endswith("."):
        # Already fully qualified, verify it matches the zone
        if not name.endswith(zone_name):
            # It's an FQDN, but outside the zone. We allow it or auto-append?
            # Route53: if name matches zone_name suffix, it's fine. Otherwise it appends the zone.
            pass
        return name
        
    # Relative name, append zone
    return f"{name}.{zone_name}"
