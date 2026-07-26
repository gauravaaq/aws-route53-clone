from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
import time
from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.hosted_zone import HostedZone
from app.models.dns_record import DNSRecord

router = APIRouter(prefix="/dns-simulator", tags=["DNS Query Simulator"])

def find_best_matching_zone(db: Session, hostname: str) -> HostedZone | None:
    """
    Finds the most specific hosted zone matching the hostname.
    E.g. for 'api.staging.example.com.', zones could be 'example.com.' and 'staging.example.com.'.
    We should return 'staging.example.com.' because it's longer/more specific.
    """
    hostname = hostname.strip().lower()
    if not hostname.endswith("."):
        hostname += "."
        
    zones = db.query(HostedZone).all()
    matching_zones = []
    
    for zone in zones:
        zone_name = zone.name.lower()
        if hostname == zone_name or hostname.endswith("." + zone_name):
            matching_zones.append(zone)
            
    if not matching_zones:
        return None
        
    # Return the one with the longest name (most specific)
    return max(matching_zones, key=lambda z: len(z.name))

def resolve_dns_record(db: Session, hostname: str, record_type: str, visited: set = None) -> dict:
    """
    Simulates DNS resolution including CNAME chasing and wildcard matching.
    """
    if visited is None:
        visited = set()
        
    hostname = hostname.strip().lower()
    if not hostname.endswith("."):
        hostname += "."
        
    record_type = record_type.upper().strip()
    
    # 1. Find matching zone
    zone = find_best_matching_zone(db, hostname)
    if not zone:
        return {"status": "NXDOMAIN", "answers": [], "chain": []}
        
    # Prevent infinite loop in CNAME chasing
    if hostname in visited:
        return {"status": "SERVFAIL", "answers": [], "chain": [{"name": hostname, "type": "ERROR", "value": "CNAME loop detected"}]}
    visited.add(hostname)
    
    answers = []
    chain = []
    
    # 2. Try exact match
    exact_records = db.query(DNSRecord).filter(
        DNSRecord.zone_id == zone.id,
        DNSRecord.name == hostname,
        DNSRecord.type == record_type
    ).all()
    
    if exact_records:
        for r in exact_records:
            answers.append({
                "name": r.name,
                "type": r.type,
                "ttl": r.ttl,
                "value": r.value or r.extra_json
            })
            chain.append({"name": r.name, "type": r.type, "value": r.value or r.extra_json})
        return {"status": "NOERROR", "answers": answers, "chain": chain}
        
    # 3. Try CNAME exact match (except when querying CNAME itself, which exact matches above)
    if record_type != "CNAME":
        cname_records = db.query(DNSRecord).filter(
            DNSRecord.zone_id == zone.id,
            DNSRecord.name == hostname,
            DNSRecord.type == "CNAME"
        ).all()
        
        if cname_records:
            cname_r = cname_records[0]
            chain.append({"name": cname_r.name, "type": "CNAME", "value": cname_r.value})
            answers.append({
                "name": cname_r.name,
                "type": "CNAME",
                "ttl": cname_r.ttl,
                "value": cname_r.value
            })
            
            # Recursive lookup for CNAME target
            sub_res = resolve_dns_record(db, cname_r.value, record_type, visited)
            answers.extend(sub_res["answers"])
            chain.extend(sub_res["chain"])
            return {"status": sub_res["status"], "answers": answers, "chain": chain}
            
    # 4. Try Wildcard Match
    # If hostname is 'www.staging.example.com.', we check '*.staging.example.com.' and '*.example.com.'
    labels = hostname.split(".")[:-1] # Remove trailing empty split
    for i in range(1, len(labels)):
        wildcard_name = "*." + ".".join(labels[i:]) + "."
        # Check if wildcard matches this zone domain
        if not wildcard_name.endswith(zone.name):
            break
            
        wildcard_records = db.query(DNSRecord).filter(
            DNSRecord.zone_id == zone.id,
            DNSRecord.name == wildcard_name,
            DNSRecord.type == record_type
        ).all()
        
        if wildcard_records:
            for r in wildcard_records:
                answers.append({
                    "name": hostname, # DNS reports the queried name
                    "type": r.type,
                    "ttl": r.ttl,
                    "value": r.value or r.extra_json
                })
                chain.append({"name": hostname, "type": r.type, "value": f"*(wildcard match: {r.name}) {r.value or r.extra_json}"})
            return {"status": "NOERROR", "answers": answers, "chain": chain}
            
        # Try CNAME wildcard match
        if record_type != "CNAME":
            c_wildcard = db.query(DNSRecord).filter(
                DNSRecord.zone_id == zone.id,
                DNSRecord.name == wildcard_name,
                DNSRecord.type == "CNAME"
            ).first()
            if c_wildcard:
                chain.append({"name": hostname, "type": "CNAME", "value": f"*(wildcard match: {c_wildcard.name}) {c_wildcard.value}"})
                answers.append({
                    "name": hostname,
                    "type": "CNAME",
                    "ttl": c_wildcard.ttl,
                    "value": c_wildcard.value
                })
                sub_res = resolve_dns_record(db, c_wildcard.value, record_type, visited)
                answers.extend(sub_res["answers"])
                chain.extend(sub_res["chain"])
                return {"status": sub_res["status"], "answers": answers, "chain": chain}
                
    # 5. Check if zone exists but no records match -> NODATA status
    return {"status": "NODATA", "answers": [], "chain": []}

@router.get("/resolve", summary="Simulate local DNS lookup query")
def resolve_query(
    name: str = Query(..., description="Hostname to resolve (e.g. www.example.com)"),
    type: str = Query("A", description="DNS record type to resolve"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    start_time = time.time()
    
    # Clean input
    qname = name.strip().lower()
    if not qname.endswith("."):
        qname += "."
        
    qtype = type.upper().strip()
    
    res = resolve_dns_record(db, qname, qtype)
    duration_ms = round((time.time() - start_time) * 1000, 2)
    
    # Generate DIG formatted output
    dig_lines = [
        f"; <<>> DiG Route53-Clone-Resolver <<>> {qname} {qtype}",
        ";; global options: +cmd",
        ";; Got answer:",
        f";; ->>HEADER<<- opcode: QUERY, status: {res['status']}, id: {int(time.time() * 100) % 65535}",
        f";; flags: qr aa rd; QUERY: 1, ANSWER: {len(res['answers'])}, AUTHORITY: 0, ADDITIONAL: 0",
        "",
        ";; QUESTION SECTION:",
        f";{qname:<24} IN{qtype:>8}",
        ""
    ]
    
    if res["answers"]:
        dig_lines.append(";; ANSWER SECTION:")
        for ans in res["answers"]:
            val_str = str(ans["value"])
            dig_lines.append(f"{ans['name']:<24} {ans['ttl']:<5} IN{ans['type']:>8} {val_str}")
        dig_lines.append("")
        
    dig_lines.extend([
        f";; Query time: {duration_ms} msec",
        f";; SERVER: 127.0.0.1#53(Route53-Clone) (UDP)",
        f";; WHEN: {time.strftime('%a %b %d %H:%M:%S %Z %Y')}",
        f";; MSG SIZE  rcvd: {120 + len(res['answers']) * 40}"
    ])
    
    return {
        "query_name": qname,
        "query_type": qtype,
        "status": res["status"],
        "answers": res["answers"],
        "chain": res["chain"],
        "dig_output": "\n".join(dig_lines),
        "duration_ms": duration_ms
    }
