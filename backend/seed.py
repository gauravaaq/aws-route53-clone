import json
import os
import sys

# Ensure backend root is in sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal, Base, engine
from app.core.security import get_password_hash
from app.models.user import User
from app.models.hosted_zone import HostedZone
from app.models.dns_record import DNSRecord
from app.models.zone_event import ZoneEvent

def seed_database():
    print("Initializing database...")
    # Drop and recreate tables to ensure clean slate
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db: Session = SessionLocal()
    try:
        print("Seeding demo user...")
        demo_user = User(
            email="admin@route53.com",
            password_hash=get_password_hash("admin123"),
            name="Route53 Admin"
        )
        db.add(demo_user)
        db.flush()

        print("Seeding hosted zones...")
        # Zone 1: example.com. (Public)
        zone1 = HostedZone(
            name="example.com.",
            type="public",
            comment="Main public web domain",
            record_count=10  # 2 auto-created + 8 user records
        )
        db.add(zone1)
        
        # Zone 2: internal.corp. (Private)
        zone2 = HostedZone(
            name="internal.corp.",
            type="private",
            comment="Corporate intranet resources",
            record_count=7  # 2 auto-created + 5 user records
        )
        db.add(zone2)

        # Zone 3: staging.example.com. (Public)
        zone3 = HostedZone(
            name="staging.example.com.",
            type="public",
            comment="Staging environment for web apps",
            record_count=5  # 2 auto-created + 3 user records
        )
        db.add(zone3)
        
        db.flush()

        # Helper to create events
        def log_event(zone_id, event_type, desc):
            evt = ZoneEvent(zone_id=zone_id, event_type=event_type, description=desc)
            db.add(evt)

        # Log zone creations
        log_event(zone1.id, "ZONE_CREATED", "Hosted zone 'example.com.' (public) was created.")
        log_event(zone2.id, "ZONE_CREATED", "Hosted zone 'internal.corp.' (private) was created.")
        log_event(zone3.id, "ZONE_CREATED", "Hosted zone 'staging.example.com.' (public) was created.")

        print("Seeding DNS records...")
        
        # Zone 1 Default NS/SOA
        soa1 = DNSRecord(
            zone_id=zone1.id, name="example.com.", type="SOA", ttl=900,
            value="ns-1.awsdns.com. hostmaster.example.com. 1 7200 900 1209600 86400"
        )
        ns1 = DNSRecord(
            zone_id=zone1.id, name="example.com.", type="NS", ttl=172800,
            value="ns-1.awsdns.com."
        )
        db.add(soa1)
        db.add(ns1)

        # Zone 1 User records (8 records of various types)
        # 1. A Record
        a1 = DNSRecord(
            zone_id=zone1.id, name="www.example.com.", type="A", ttl=300,
            value="93.184.216.34"
        )
        # 2. AAAA Record
        aaaa1 = DNSRecord(
            zone_id=zone1.id, name="ipv6.example.com.", type="AAAA", ttl=300,
            value="2606:2800:220:1:248:1893:25c8:1946"
        )
        # 3. CNAME Record
        cname1 = DNSRecord(
            zone_id=zone1.id, name="blog.example.com.", type="CNAME", ttl=3600,
            value="blog.hosting.com."
        )
        # 4. TXT Record
        txt1 = DNSRecord(
            zone_id=zone1.id, name="example.com.", type="TXT", ttl=600,
            value='"v=spf1 include:_spf.google.com ~all"'
        )
        # 5. MX Record (Compound)
        mx1 = DNSRecord(
            zone_id=zone1.id, name="example.com.", type="MX", ttl=300,
            extra_json=json.dumps({"priority": 10, "mail_server": "mail.example.com."})
        )
        # 6. SRV Record (Compound)
        srv1 = DNSRecord(
            zone_id=zone1.id, name="_sip._tcp.example.com.", type="SRV", ttl=300,
            extra_json=json.dumps({"priority": 10, "weight": 60, "port": 5060, "target": "sip.example.com."})
        )
        # 7. CAA Record (Compound)
        caa1 = DNSRecord(
            zone_id=zone1.id, name="example.com.", type="CAA", ttl=3600,
            extra_json=json.dumps({"flag": 0, "tag": "issue", "value": "letsencrypt.org"})
        )
        # 8. PTR Record (Simple)
        ptr1 = DNSRecord(
            zone_id=zone1.id, name="34.216.184.93.in-addr.arpa.", type="PTR", ttl=300,
            value="www.example.com."
        )
        db.add_all([a1, aaaa1, cname1, txt1, mx1, srv1, caa1, ptr1])
        
        # Log record additions for zone 1
        for rec in [a1, aaaa1, cname1, txt1, mx1, srv1, caa1, ptr1]:
            log_event(zone1.id, "RECORD_CREATED", f"Created {rec.type} record for '{rec.name}'.")

        # Zone 2 Default NS/SOA
        soa2 = DNSRecord(
            zone_id=zone2.id, name="internal.corp.", type="SOA", ttl=900,
            value="ns-2.awsdns.com. hostmaster.internal.corp. 1 7200 900 1209600 86400"
        )
        ns2 = DNSRecord(
            zone_id=zone2.id, name="internal.corp.", type="NS", ttl=172800,
            value="ns-2.awsdns.com."
        )
        db.add(soa2)
        db.add(ns2)

        # Zone 2 User records
        a2_1 = DNSRecord(
            zone_id=zone2.id, name="wiki.internal.corp.", type="A", ttl=300,
            value="10.0.1.5"
        )
        a2_2 = DNSRecord(
            zone_id=zone2.id, name="portal.internal.corp.", type="A", ttl=300,
            value="10.0.1.10"
        )
        a2_3 = DNSRecord(
            zone_id=zone2.id, name="database.internal.corp.", type="A", ttl=60,
            value="10.0.2.50"
        )
        cname2_1 = DNSRecord(
            zone_id=zone2.id, name="docs.internal.corp.", type="CNAME", ttl=300,
            value="wiki.internal.corp."
        )
        txt2_1 = DNSRecord(
            zone_id=zone2.id, name="internal.corp.", type="TXT", ttl=300,
            value='"internal domain verification key"'
        )
        db.add_all([a2_1, a2_2, a2_3, cname2_1, txt2_1])
        
        # Log record additions for zone 2
        for rec in [a2_1, a2_2, a2_3, cname2_1, txt2_1]:
            log_event(zone2.id, "RECORD_CREATED", f"Created {rec.type} record for '{rec.name}'.")

        # Zone 3 Default NS/SOA
        soa3 = DNSRecord(
            zone_id=zone3.id, name="staging.example.com.", type="SOA", ttl=900,
            value="ns-3.awsdns.com. hostmaster.staging.example.com. 1 7200 900 1209600 86400"
        )
        ns3 = DNSRecord(
            zone_id=zone3.id, name="staging.example.com.", type="NS", ttl=172800,
            value="ns-3.awsdns.com."
        )
        db.add(soa3)
        db.add(ns3)

        # Zone 3 User records
        a3_1 = DNSRecord(
            zone_id=zone3.id, name="api.staging.example.com.", type="A", ttl=60,
            value="34.22.89.155"
        )
        a3_2 = DNSRecord(
            zone_id=zone3.id, name="web.staging.example.com.", type="A", ttl=60,
            value="34.22.89.156"
        )
        cname3_1 = DNSRecord(
            zone_id=zone3.id, name="auth.staging.example.com.", type="CNAME", ttl=300,
            value="cognito-identity.amazonaws.com."
        )
        db.add_all([a3_1, a3_2, cname3_1])
        
        # Log record additions for zone 3
        for rec in [a3_1, a3_2, cname3_1]:
            log_event(zone3.id, "RECORD_CREATED", f"Created {rec.type} record for '{rec.name}'.")

        db.commit()
        print("Database seeded successfully! 🎉")
        
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
