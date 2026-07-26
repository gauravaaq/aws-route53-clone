import json
import pytest

def test_unauthenticated_access(client):
    # Hitting a protected endpoint without auth should return 401
    response = client.get("/api/hosted-zones")
    assert response.status_code == 401
    assert "detail" in response.json()

def test_auth_login_logout(client):
    # 1. Login success
    login_resp = client.post(
        "/api/auth/login",
        json={"email": "test@route53.com", "password": "testpassword"}
    )
    assert login_resp.status_code == 200
    user_data = login_resp.json()
    assert user_data["email"] == "test@route53.com"
    assert "access_token" in client.cookies
    
    # 2. Get me
    me_resp = client.get("/api/auth/me")
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == "test@route53.com"
    
    # 3. Logout
    logout_resp = client.post("/api/auth/logout")
    assert logout_resp.status_code == 200
    assert "access_token" not in client.cookies
    
    # Me endpoint should fail now
    me_fail = client.get("/api/auth/me")
    assert me_fail.status_code == 401

def test_hosted_zones_crud(auth_client):
    # 1. Create Zone
    create_resp = auth_client.post(
        "/api/hosted-zones",
        json={"name": "testzone.com", "type": "public", "comment": "Initial test zone"}
    )
    assert create_resp.status_code == 201
    zone = create_resp.json()
    assert zone["name"] == "testzone.com."  # Automatically appended dot
    assert zone["type"] == "public"
    assert zone["record_count"] == 2  # NS + SOA
    
    # 2. Duplicate Zone Block
    dup_resp = auth_client.post(
        "/api/hosted-zones",
        json={"name": "TESTZONE.COM.", "type": "private", "comment": "Duplicate"}
    )
    assert dup_resp.status_code == 409
    
    # 3. List Zones
    list_resp = auth_client.get("/api/hosted-zones")
    assert list_resp.status_code == 200
    res = list_resp.json()
    assert res["meta"]["total"] == 1
    assert res["data"][0]["id"] == zone["id"]
    
    # 4. Get Zone
    get_resp = auth_client.get(f"/api/hosted-zones/{zone['id']}")
    assert get_resp.status_code == 200
    assert get_resp.json()["comment"] == "Initial test zone"
    
    # 5. Update Zone
    update_resp = auth_client.put(
        f"/api/hosted-zones/{zone['id']}",
        json={"comment": "Updated comment"}
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["comment"] == "Updated comment"
    
    # 6. Delete Zone
    del_resp = auth_client.delete(f"/api/hosted-zones/{zone['id']}")
    assert del_resp.status_code == 204
    
    # Get Zone should 404
    get_fail = auth_client.get(f"/api/hosted-zones/{zone['id']}")
    assert get_fail.status_code == 404

def test_dns_records_validation_rules(auth_client):
    # Setup: Create zone
    zone_resp = auth_client.post(
        "/api/hosted-zones",
        json={"name": "dns-test.net", "type": "public", "comment": "DNS tests"}
    )
    zone_id = zone_resp.json()["id"]

    # 1. Valid A record
    r_a = auth_client.post(
        f"/api/hosted-zones/{zone_id}/records",
        json={"name": "www", "type": "A", "ttl": 300, "value": "192.0.2.100"}
    )
    assert r_a.status_code == 201
    assert r_a.json()["name"] == "www.dns-test.net."
    
    # 2. Invalid A Record (IPv4 validation)
    r_a_fail = auth_client.post(
        f"/api/hosted-zones/{zone_id}/records",
        json={"name": "www2", "type": "A", "ttl": 300, "value": "999.0.2.100"}
    )
    assert r_a_fail.status_code == 422
    assert "IPv4" in r_a_fail.json()["detail"]

    # 3. Valid AAAA record
    r_aaaa = auth_client.post(
        f"/api/hosted-zones/{zone_id}/records",
        json={"name": "ipv6", "type": "AAAA", "ttl": 300, "value": "2001:db8::1"}
    )
    assert r_aaaa.status_code == 201
    
    # 4. Invalid AAAA record (IPv6 validation)
    r_aaaa_fail = auth_client.post(
        f"/api/hosted-zones/{zone_id}/records",
        json={"name": "ipv6-2", "type": "AAAA", "ttl": 300, "value": "2001::db8::abc"}
    )
    assert r_aaaa_fail.status_code == 422

    # 5. CNAME at apex block
    r_cname_apex = auth_client.post(
        f"/api/hosted-zones/{zone_id}/records",
        json={"name": "@", "type": "CNAME", "ttl": 300, "value": "target.net."}
    )
    assert r_cname_apex.status_code == 422
    assert "apex" in r_cname_apex.json()["detail"]

    # 6. CNAME exclusivity conflict:
    # A record already exists at "www.dns-test.net."
    # Adding a CNAME at "www" should fail
    r_cname_conflict = auth_client.post(
        f"/api/hosted-zones/{zone_id}/records",
        json={"name": "www", "type": "CNAME", "ttl": 300, "value": "target.net."}
    )
    assert r_cname_conflict.status_code == 409
    
    # Creating a valid CNAME elsewhere
    r_cname_ok = auth_client.post(
        f"/api/hosted-zones/{zone_id}/records",
        json={"name": "alias", "type": "CNAME", "ttl": 300, "value": "target.net."}
    )
    assert r_cname_ok.status_code == 201
    
    # Adding an A record at "alias" where CNAME exists should fail
    r_a_conflict = auth_client.post(
        f"/api/hosted-zones/{zone_id}/records",
        json={"name": "alias", "type": "A", "ttl": 300, "value": "192.0.2.1"}
    )
    assert r_a_conflict.status_code == 409

    # 7. MX validation
    # Missing extra_json
    r_mx_fail = auth_client.post(
        f"/api/hosted-zones/{zone_id}/records",
        json={"name": "@", "type": "MX", "ttl": 300, "value": "10 mail.net."}
    )
    assert r_mx_fail.status_code == 422
    
    # Valid MX
    r_mx = auth_client.post(
        f"/api/hosted-zones/{zone_id}/records",
        json={
            "name": "@",
            "type": "MX",
            "ttl": 300,
            "extra_json": {"priority": 10, "mail_server": "mail.dns-test.net."}
        }
    )
    assert r_mx.status_code == 201

    # Invalid MX priority
    r_mx_bad_pri = auth_client.post(
        f"/api/hosted-zones/{zone_id}/records",
        json={
            "name": "@",
            "type": "MX",
            "ttl": 300,
            "extra_json": {"priority": 70000, "mail_server": "mail.dns-test.net."}
        }
    )
    assert r_mx_bad_pri.status_code == 422

    # 8. SRV validation
    r_srv = auth_client.post(
        f"/api/hosted-zones/{zone_id}/records",
        json={
            "name": "_sip._tcp",
            "type": "SRV",
            "ttl": 300,
            "extra_json": {"priority": 10, "weight": 20, "port": 5060, "target": "sip.dns-test.net."}
        }
    )
    assert r_srv.status_code == 201

    r_srv_bad_port = auth_client.post(
        f"/api/hosted-zones/{zone_id}/records",
        json={
            "name": "_sip._tcp",
            "type": "SRV",
            "ttl": 300,
            "extra_json": {"priority": 10, "weight": 20, "port": 99999, "target": "sip.dns-test.net."}
        }
    )
    assert r_srv_bad_port.status_code == 422

    # 9. CAA validation
    r_caa = auth_client.post(
        f"/api/hosted-zones/{zone_id}/records",
        json={
            "name": "@",
            "type": "CAA",
            "ttl": 3600,
            "extra_json": {"flag": 0, "tag": "issue", "value": "letsencrypt.org"}
        }
    )
    assert r_caa.status_code == 201

    r_caa_bad_tag = auth_client.post(
        f"/api/hosted-zones/{zone_id}/records",
        json={
            "name": "@",
            "type": "CAA",
            "ttl": 3600,
            "extra_json": {"flag": 0, "tag": "badtag", "value": "letsencrypt.org"}
        }
    )
    assert r_caa_bad_tag.status_code == 422

def test_delete_protection_and_cascade(auth_client):
    # Setup: Create zone
    zone_resp = auth_client.post(
        "/api/hosted-zones",
        json={"name": "protected-test.org", "type": "public"}
    )
    zone_id = zone_resp.json()["id"]

    # Try listing default records (NS and SOA should be present)
    recs_resp = auth_client.get(f"/api/hosted-zones/{zone_id}/records")
    data = recs_resp.json()["data"]
    assert len(data) == 2
    
    soa_rec = next(r for r in data if r["type"] == "SOA")
    ns_rec = next(r for r in data if r["type"] == "NS")

    # 1. Try to delete system-required SOA at apex -> should fail 400
    del_soa = auth_client.delete(f"/api/hosted-zones/{zone_id}/records/{soa_rec['id']}")
    assert del_soa.status_code == 400
    
    # 2. Try to delete system-required NS at apex -> should fail 400
    del_ns = auth_client.delete(f"/api/hosted-zones/{zone_id}/records/{ns_rec['id']}")
    assert del_ns.status_code == 400

    # 3. Add custom A record and delete it -> should succeed
    custom_a = auth_client.post(
        f"/api/hosted-zones/{zone_id}/records",
        json={"name": "test", "type": "A", "value": "1.1.1.1"}
    )
    a_id = custom_a.json()["id"]
    
    # Record count of zone should be 3 now
    z_details = auth_client.get(f"/api/hosted-zones/{zone_id}")
    assert z_details.json()["record_count"] == 3

    del_a = auth_client.delete(f"/api/hosted-zones/{zone_id}/records/{a_id}")
    assert del_a.status_code == 204

    # Record count of zone should be back to 2
    z_details_2 = auth_client.get(f"/api/hosted-zones/{zone_id}")
    assert z_details_2.json()["record_count"] == 2

    # 4. Delete the zone -> verifying records cascade delete (implicitly checked by database cleanup)
    del_z = auth_client.delete(f"/api/hosted-zones/{zone_id}")
    assert del_z.status_code == 204
