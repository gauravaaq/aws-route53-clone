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

        print("Seeding hosted zones with authentic AWS Route53 patterns...")
        # Zone 1: gauravyadav.com. (Public Zone)
        zone1 = HostedZone(
            name="gauravyadav.com.",
            type="public",
            comment="Production domain hosted on AWS CloudFront and ALB",
            record_count=9
        )
        db.add(zone1)
        
        # Zone 2: internal.corp. (Private Zone)
        zone2 = HostedZone(
            name="internal.corp.",
            type="private",
            comment="Corporate intranet resources (Internal VPC Route53)",
            record_count=7
        )
        db.add(zone2)

        # Zone 3: staging.gauravyadav.com. (Public Zone)
        zone3 = HostedZone(
            name="staging.gauravyadav.com.",
            type="public",
            comment="Staging environment for QA testing",
            record_count=5
        )
        db.add(zone3)
        
        # Zone 4: mycoolstartup.io. (Public Zone)
        zone4 = HostedZone(
            name="mycoolstartup.io.",
            type="public",
            comment="SaaS Startup main landing domain with Cloudflare routing",
            record_count=5
        )
        db.add(zone4)

        # Zone 5: devops-sandbox.net. (Public Zone)
        zone5 = HostedZone(
            name="devops-sandbox.net.",
            type="public",
            comment="Sandbox playground environment for Terraform experiments",
            record_count=4
        )
        db.add(zone5)

        db.flush()

        # Helper to create events
        def log_event(zone_id, event_type, desc):
            evt = ZoneEvent(zone_id=zone_id, event_type=event_type, description=desc)
            db.add(evt)

        # Log zone creations
        log_event(zone1.id, "ZONE_CREATED", "Hosted zone 'gauravyadav.com.' (public) was created.")
        log_event(zone2.id, "ZONE_CREATED", "Hosted zone 'internal.corp.' (private) was created.")
        log_event(zone3.id, "ZONE_CREATED", "Hosted zone 'staging.gauravyadav.com.' (public) was created.")
        log_event(zone4.id, "ZONE_CREATED", "Hosted zone 'mycoolstartup.io.' (public) was created.")
        log_event(zone5.id, "ZONE_CREATED", "Hosted zone 'devops-sandbox.net.' (public) was created.")

        print("Seeding authentic AWS DNS records...")
        
        # Zone 1 (gauravyadav.com.) - Standard AWS 4-Name-Servers block for high-availability
        soa1 = DNSRecord(
            zone_id=zone1.id, name="gauravyadav.com.", type="SOA", ttl=900,
            value="ns-1536.awsdns-00.co.uk. awsdns-hostmaster.amazon.com. 1 7200 900 1209600 86400"
        )
        ns1 = DNSRecord(
            zone_id=zone1.id, name="gauravyadav.com.", type="NS", ttl=172800,
            value="ns-1536.awsdns-00.co.uk.\nns-0.awsdns-00.com.\nns-1024.awsdns-00.org.\nns-512.awsdns-00.net."
        )
        db.add(soa1)
        db.add(ns1)

        # Zone 1 User records (A, AAAA, CNAME, TXT, MX, CAA, SRV)
        a1 = DNSRecord(
            zone_id=zone1.id, name="gauravyadav.com.", type="A", ttl=60,
            value="13.224.29.89"  # S3/CloudFront Endpoint IP
        )
        a1_www = DNSRecord(
            zone_id=zone1.id, name="www.gauravyadav.com.", type="A", ttl=60,
            value="13.224.29.42"  # S3/CloudFront Endpoint IP
        )
        cname1 = DNSRecord(
            zone_id=zone1.id, name="api.gauravyadav.com.", type="CNAME", ttl=300,
            value="gauravyadav-alb-1984210.us-east-1.elb.amazonaws.com."  # AWS ALB Domain
        )
        txt1 = DNSRecord(
            zone_id=zone1.id, name="gauravyadav.com.", type="TXT", ttl=3600,
            value='"v=spf1 include:amazonses.com include:_spf.google.com ~all"'  # Enterprise SPF
        )
        txt1_ses = DNSRecord(
            zone_id=zone1.id, name="gauravyadav.com.", type="TXT", ttl=3600,
            value='"amazonses:vQ82H9Jn0kFwLp7+mN4yR/9x1bA1d8234z="'  # AWS SES Verification Key
        )
        mx1 = DNSRecord(
            zone_id=zone1.id, name="gauravyadav.com.", type="MX", ttl=300,
            extra_json=json.dumps({"priority": 10, "mail_server": "inbound-smtp.us-east-1.amazonaws.com."})  # AWS WorkMail
        )
        caa1 = DNSRecord(
            zone_id=zone1.id, name="gauravyadav.com.", type="CAA", ttl=86400,
            extra_json=json.dumps({"flag": 0, "tag": "issue", "value": "amazon.com"})  # AWS ACM CAA Rule
        )
        db.add_all([a1, a1_www, cname1, txt1, txt1_ses, mx1, caa1])
        
        # Log record additions for zone 1
        for rec in [a1, a1_www, cname1, txt1, txt1_ses, mx1, caa1]:
            log_event(zone1.id, "RECORD_CREATED", f"Created {rec.type} record for '{rec.name}'.")

        # Zone 2 (internal.corp.) Private corporate DNS
        soa2 = DNSRecord(
            zone_id=zone2.id, name="internal.corp.", type="SOA", ttl=900,
            value="ns-1536.awsdns-00.co.uk. awsdns-hostmaster.amazon.com. 1 7200 900 1209600 86400"
        )
        ns2 = DNSRecord(
            zone_id=zone2.id, name="internal.corp.", type="NS", ttl=172800,
            value="ns-1536.awsdns-00.co.uk.\nns-0.awsdns-00.com.\nns-1024.awsdns-00.org.\nns-512.awsdns-00.net."
        )
        db.add(soa2)
        db.add(ns2)

        # Zone 2 Corporate Private endpoints (Wiki, Database, Portal)
        a2_bastion = DNSRecord(
            zone_id=zone2.id, name="bastion.internal.corp.", type="A", ttl=300,
            value="10.0.1.25"  # Internal Bastion IP
        )
        a2_db = DNSRecord(
            zone_id=zone2.id, name="database.internal.corp.", type="A", ttl=60,
            value="10.0.2.14"  # Private RDS Postgres Instance
        )
        a2_portal = DNSRecord(
            zone_id=zone2.id, name="portal.internal.corp.", type="A", ttl=300,
            value="10.0.1.10"
        )
        cname2 = DNSRecord(
            zone_id=zone2.id, name="docs.internal.corp.", type="CNAME", ttl=300,
            value="wiki.internal.corp."
        )
        a2_wiki = DNSRecord(
            zone_id=zone2.id, name="wiki.internal.corp.", type="A", ttl=300,
            value="10.0.1.5"
        )
        db.add_all([a2_bastion, a2_db, a2_portal, cname2, a2_wiki])
        
        # Log record additions for zone 2
        for rec in [a2_bastion, a2_db, a2_portal, cname2, a2_wiki]:
            log_event(zone2.id, "RECORD_CREATED", f"Created {rec.type} record for '{rec.name}'.")

        # Zone 3 (staging.gauravyadav.com.) Staging Public DNS
        soa3 = DNSRecord(
            zone_id=zone3.id, name="staging.gauravyadav.com.", type="SOA", ttl=900,
            value="ns-1536.awsdns-00.co.uk. awsdns-hostmaster.amazon.com. 1 7200 900 1209600 86400"
        )
        ns3 = DNSRecord(
            zone_id=zone3.id, name="staging.gauravyadav.com.", type="NS", ttl=172800,
            value="ns-1536.awsdns-00.co.uk.\nns-0.awsdns-00.com.\nns-1024.awsdns-00.org.\nns-512.awsdns-00.net."
        )
        db.add(soa3)
        db.add(ns3)

        # Zone 3 Staging endpoints
        a3_api = DNSRecord(
            zone_id=zone3.id, name="api.staging.gauravyadav.com.", type="A", ttl=60,
            value="34.22.89.155"  # Staging Backend IP
        )
        a3_web = DNSRecord(
            zone_id=zone3.id, name="web.staging.gauravyadav.com.", type="A", ttl=60,
            value="34.22.89.156"  # Staging Web App IP
        )
        cname3 = DNSRecord(
            zone_id=zone3.id, name="auth.staging.gauravyadav.com.", type="CNAME", ttl=300,
            value="cognito-idp.us-east-1.amazonaws.com."  # AWS Cognito Identity Pool Endpoint
        )
        db.add_all([a3_api, a3_web, cname3])
        
        # Log record additions for zone 3
        for rec in [a3_api, a3_web, cname3]:
            log_event(zone3.id, "RECORD_CREATED", f"Created {rec.type} record for '{rec.name}'.")

        # Zone 4 (mycoolstartup.io.)
        soa4 = DNSRecord(
            zone_id=zone4.id, name="mycoolstartup.io.", type="SOA", ttl=900,
            value="ns-1536.awsdns-00.co.uk. awsdns-hostmaster.amazon.com. 1 7200 900 1209600 86400"
        )
        ns4 = DNSRecord(
            zone_id=zone4.id, name="mycoolstartup.io.", type="NS", ttl=172800,
            value="ns-1536.awsdns-00.co.uk.\nns-0.awsdns-00.com.\nns-1024.awsdns-00.org.\nns-512.awsdns-00.net."
        )
        a4 = DNSRecord(
            zone_id=zone4.id, name="mycoolstartup.io.", type="A", ttl=300,
            value="185.199.108.153"  # GitHub Pages IP
        )
        cname4 = DNSRecord(
            zone_id=zone4.id, name="app.mycoolstartup.io.", type="CNAME", ttl=300,
            value="mycoolstartup-production.herokuapp.com."
        )
        txt4 = DNSRecord(
            zone_id=zone4.id, name="mycoolstartup.io.", type="TXT", ttl=3600,
            value='"google-site-verification=some_random_hash_12345"'
        )
        db.add_all([soa4, ns4, a4, cname4, txt4])
        for rec in [a4, cname4, txt4]:
            log_event(zone4.id, "RECORD_CREATED", f"Created {rec.type} record for '{rec.name}'.")

        # Zone 5 (devops-sandbox.net.)
        soa5 = DNSRecord(
            zone_id=zone5.id, name="devops-sandbox.net.", type="SOA", ttl=900,
            value="ns-1536.awsdns-00.co.uk. awsdns-hostmaster.amazon.com. 1 7200 900 1209600 86400"
        )
        ns5 = DNSRecord(
            zone_id=zone5.id, name="devops-sandbox.net.", type="NS", ttl=172800,
            value="ns-1536.awsdns-00.co.uk.\nns-0.awsdns-00.com.\nns-1024.awsdns-00.org.\nns-512.awsdns-00.net."
        )
        a5_k8s = DNSRecord(
            zone_id=zone5.id, name="k8s.devops-sandbox.net.", type="A", ttl=60,
            value="52.204.18.92"  # AWS EKS Ingress Controller IP
        )
        txt5_testing = DNSRecord(
            zone_id=zone5.id, name="test.devops-sandbox.net.", type="TXT", ttl=300,
            value='"environment=sandbox"'
        )
        db.add_all([soa5, ns5, a5_k8s, txt5_testing])
        for rec in [a5_k8s, txt5_testing]:
            log_event(zone5.id, "RECORD_CREATED", f"Created {rec.type} record for '{rec.name}'.")

        db.commit()
        print("Database seeded with authentic AWS Route53 patterns successfully! 🎉")
        
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
