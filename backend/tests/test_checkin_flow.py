"""
Test suite for Customer Check-In System
Tests: customers registration, card scan, waiver, check-in/out, subscriptions
"""
import pytest
import requests
import os
from datetime import date, timedelta
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "adminpassword"
BRANCH_ID = "35df2b42-c334-41cf-915e-f0e6f551f913"


class TestAuth:
    """Authentication for all tests"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Login and get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "access_token" in data, "No access_token in response"
        return data["access_token"]
    
    @pytest.fixture(scope="class")
    def auth_headers(self, auth_token):
        """Headers with auth token"""
        return {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }


class TestCustomerRegistration(TestAuth):
    """Customer registration (POST /api/customers)"""
    
    def test_register_new_customer_success(self, auth_headers):
        """Register new customer with valid data (child under 4 years)"""
        unique_id = str(uuid.uuid4())[:8]
        card_number = f"TEST-CARD-{unique_id}"
        child_dob = (date.today() - timedelta(days=365*2)).isoformat()  # 2 years old
        
        payload = {
            "card_number": card_number,
            "child_name": f"TEST_Child_{unique_id}",
            "child_dob": child_dob,
            "guardian": {
                "name": f"TEST_Guardian_{unique_id}",
                "phone": "+962791234567"
            },
            "branch_id": BRANCH_ID
        }
        
        response = requests.post(f"{BASE_URL}/api/customers", json=payload, headers=auth_headers)
        assert response.status_code == 201, f"Registration failed: {response.text}"
        
        data = response.json()
        assert data["card_number"] == card_number
        assert data["child_name"] == payload["child_name"]
        assert data["guardian"]["name"] == payload["guardian"]["name"]
        assert data["waiver_accepted"] == False
        assert "customer_id" in data
        
        # Store customer_id for cleanup
        self.__class__.test_customer_id = data["customer_id"]
        self.__class__.test_card_number = card_number
        print(f"Created customer: {data['customer_id']}, card: {card_number}")
        
    def test_register_customer_age_over_4_fails(self, auth_headers):
        """Registration should fail for child over 4 years old"""
        unique_id = str(uuid.uuid4())[:8]
        child_dob = (date.today() - timedelta(days=365*5)).isoformat()  # 5 years old
        
        payload = {
            "card_number": f"TEST-CARD-AGE-{unique_id}",
            "child_name": f"TEST_OldChild_{unique_id}",
            "child_dob": child_dob,
            "guardian": {
                "name": f"TEST_Guardian_{unique_id}"
            },
            "branch_id": BRANCH_ID
        }
        
        response = requests.post(f"{BASE_URL}/api/customers", json=payload, headers=auth_headers)
        assert response.status_code == 400, f"Expected 400 for over-age child, got: {response.status_code}"
        
    def test_register_customer_duplicate_card_fails(self, auth_headers):
        """Registration should fail for duplicate card number"""
        # Try registering with same card number
        if hasattr(self.__class__, 'test_card_number'):
            child_dob = (date.today() - timedelta(days=365*2)).isoformat()
            
            payload = {
                "card_number": self.__class__.test_card_number,
                "child_name": "TEST_Duplicate",
                "child_dob": child_dob,
                "guardian": {"name": "TEST_Guardian"},
                "branch_id": BRANCH_ID
            }
            
            response = requests.post(f"{BASE_URL}/api/customers", json=payload, headers=auth_headers)
            assert response.status_code == 400, f"Expected 400 for duplicate card, got: {response.status_code}"


class TestGetCustomerByCard(TestAuth):
    """Get customer by card number (GET /api/customers/card/{card_number})"""
    
    def test_get_customer_by_card_success(self, auth_headers):
        """Get existing customer by card number"""
        # First create a customer
        unique_id = str(uuid.uuid4())[:8]
        card_number = f"TEST-SCAN-{unique_id}"
        child_dob = (date.today() - timedelta(days=365*3)).isoformat()  # 3 years old
        
        payload = {
            "card_number": card_number,
            "child_name": f"TEST_ScanChild_{unique_id}",
            "child_dob": child_dob,
            "guardian": {"name": f"TEST_Guardian_{unique_id}"},
            "branch_id": BRANCH_ID
        }
        
        create_resp = requests.post(f"{BASE_URL}/api/customers", json=payload, headers=auth_headers)
        assert create_resp.status_code == 201, f"Failed to create customer: {create_resp.text}"
        
        # Now get by card
        response = requests.get(f"{BASE_URL}/api/customers/card/{card_number}", headers=auth_headers)
        assert response.status_code == 200, f"Get by card failed: {response.text}"
        
        data = response.json()
        assert data["card_number"] == card_number
        assert data["child_name"] == payload["child_name"]
        
    def test_get_customer_by_card_not_found(self, auth_headers):
        """Get non-existent card should return 404"""
        response = requests.get(f"{BASE_URL}/api/customers/card/NONEXISTENT-CARD-123", headers=auth_headers)
        assert response.status_code == 404, f"Expected 404, got: {response.status_code}"


class TestWaiverAcceptance(TestAuth):
    """Waiver acceptance (POST /api/customers/{id}/waiver)"""
    
    def test_waiver_acceptance_flow(self, auth_headers):
        """Create customer and accept waiver"""
        # Create customer
        unique_id = str(uuid.uuid4())[:8]
        card_number = f"TEST-WAIVER-{unique_id}"
        child_dob = (date.today() - timedelta(days=365*2)).isoformat()
        
        payload = {
            "card_number": card_number,
            "child_name": f"TEST_WaiverChild_{unique_id}",
            "child_dob": child_dob,
            "guardian": {"name": f"TEST_Guardian_{unique_id}"},
            "branch_id": BRANCH_ID
        }
        
        create_resp = requests.post(f"{BASE_URL}/api/customers", json=payload, headers=auth_headers)
        assert create_resp.status_code == 201
        customer_id = create_resp.json()["customer_id"]
        
        # Accept waiver
        waiver_payload = {
            "customer_id": customer_id,
            "accepted_terms": True
        }
        
        response = requests.post(f"{BASE_URL}/api/customers/{customer_id}/waiver", 
                                json=waiver_payload, headers=auth_headers)
        assert response.status_code == 200, f"Waiver acceptance failed: {response.text}"
        
        data = response.json()
        assert data["waiver_accepted"] == True
        assert data["waiver_accepted_at"] is not None
        
        self.__class__.waiver_customer_id = customer_id
        self.__class__.waiver_card_number = card_number


class TestCardScan(TestAuth):
    """Card scan endpoint (POST /api/checkin/scan)"""
    
    def test_scan_new_card_returns_new_card_status(self, auth_headers):
        """Scanning unregistered card should return NEW_CARD status"""
        unique_id = str(uuid.uuid4())[:8]
        
        response = requests.post(f"{BASE_URL}/api/checkin/scan", json={
            "card_number": f"TEST-UNREGISTERED-{unique_id}",
            "branch_id": BRANCH_ID
        }, headers=auth_headers)
        
        assert response.status_code == 200, f"Scan failed: {response.text}"
        data = response.json()
        assert data["status"] == "NEW_CARD"
        assert data["customer"] is None
        
    def test_scan_registered_card_without_waiver(self, auth_headers):
        """Scanning registered card without waiver should return WAIVER_REQUIRED"""
        # Create customer without waiver
        unique_id = str(uuid.uuid4())[:8]
        card_number = f"TEST-NOWAIVER-{unique_id}"
        child_dob = (date.today() - timedelta(days=365*2)).isoformat()
        
        create_resp = requests.post(f"{BASE_URL}/api/customers", json={
            "card_number": card_number,
            "child_name": f"TEST_NoWaiverChild_{unique_id}",
            "child_dob": child_dob,
            "guardian": {"name": f"TEST_Guardian_{unique_id}"},
            "branch_id": BRANCH_ID
        }, headers=auth_headers)
        assert create_resp.status_code == 201
        
        # Scan the card
        response = requests.post(f"{BASE_URL}/api/checkin/scan", json={
            "card_number": card_number,
            "branch_id": BRANCH_ID
        }, headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "WAIVER_REQUIRED"
        assert data["customer"] is not None
        
    def test_scan_ready_to_checkin(self, auth_headers):
        """Scanning card with waiver should return READY_TO_CHECK_IN"""
        # Create and accept waiver
        unique_id = str(uuid.uuid4())[:8]
        card_number = f"TEST-READY-{unique_id}"
        child_dob = (date.today() - timedelta(days=365*2)).isoformat()
        
        create_resp = requests.post(f"{BASE_URL}/api/customers", json={
            "card_number": card_number,
            "child_name": f"TEST_ReadyChild_{unique_id}",
            "child_dob": child_dob,
            "guardian": {"name": f"TEST_Guardian_{unique_id}"},
            "branch_id": BRANCH_ID
        }, headers=auth_headers)
        assert create_resp.status_code == 201
        customer_id = create_resp.json()["customer_id"]
        
        # Accept waiver
        waiver_resp = requests.post(f"{BASE_URL}/api/customers/{customer_id}/waiver", json={
            "customer_id": customer_id,
            "accepted_terms": True
        }, headers=auth_headers)
        assert waiver_resp.status_code == 200
        
        # Scan the card
        response = requests.post(f"{BASE_URL}/api/checkin/scan", json={
            "card_number": card_number,
            "branch_id": BRANCH_ID
        }, headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "READY_TO_CHECK_IN"
        assert data["customer"]["customer_id"] == customer_id
        
        self.__class__.ready_card = card_number
        self.__class__.ready_customer_id = customer_id


class TestCheckInCheckOut(TestAuth):
    """Check-in and check-out flow (POST /api/checkin, POST /api/checkin/{session_id}/checkout)"""
    
    def test_checkin_hourly_success(self, auth_headers):
        """Check in with hourly payment type"""
        # Setup: Create customer with waiver
        unique_id = str(uuid.uuid4())[:8]
        card_number = f"TEST-CHECKIN-{unique_id}"
        child_dob = (date.today() - timedelta(days=365*2)).isoformat()
        
        create_resp = requests.post(f"{BASE_URL}/api/customers", json={
            "card_number": card_number,
            "child_name": f"TEST_CheckinChild_{unique_id}",
            "child_dob": child_dob,
            "guardian": {"name": f"TEST_Guardian_{unique_id}"},
            "branch_id": BRANCH_ID
        }, headers=auth_headers)
        assert create_resp.status_code == 201
        customer_id = create_resp.json()["customer_id"]
        
        # Accept waiver
        requests.post(f"{BASE_URL}/api/customers/{customer_id}/waiver", json={
            "customer_id": customer_id,
            "accepted_terms": True
        }, headers=auth_headers)
        
        # Check in
        response = requests.post(f"{BASE_URL}/api/checkin?use_subscription=false", json={
            "card_number": card_number,
            "branch_id": BRANCH_ID
        }, headers=auth_headers)
        
        assert response.status_code == 201, f"Check-in failed: {response.text}"
        data = response.json()
        assert data["customer_id"] == customer_id
        assert data["card_number"] == card_number
        assert data["payment_type"] == "HOURLY"
        assert data["status"] == "CHECKED_IN"
        assert "session_id" in data
        
        self.__class__.test_session_id = data["session_id"]
        self.__class__.test_checkin_card = card_number
        
    def test_checkin_already_checked_in_fails(self, auth_headers):
        """Cannot check in if already checked in"""
        if hasattr(self.__class__, 'test_checkin_card'):
            response = requests.post(f"{BASE_URL}/api/checkin?use_subscription=false", json={
                "card_number": self.__class__.test_checkin_card,
                "branch_id": BRANCH_ID
            }, headers=auth_headers)
            
            assert response.status_code == 400, f"Expected 400 for duplicate checkin, got: {response.status_code}"
            
    def test_checkout_success(self, auth_headers):
        """Check out existing session"""
        if hasattr(self.__class__, 'test_session_id'):
            response = requests.post(f"{BASE_URL}/api/checkin/{self.__class__.test_session_id}/checkout", 
                                    headers=auth_headers)
            
            assert response.status_code == 200, f"Check-out failed: {response.text}"
            data = response.json()
            assert data["status"] == "CHECKED_OUT"
            assert data["check_out_time"] is not None
            assert "duration_minutes" in data
            
    def test_checkout_invalid_session_fails(self, auth_headers):
        """Check out non-existent session should fail"""
        response = requests.post(f"{BASE_URL}/api/checkin/invalid-session-id-123/checkout", 
                                headers=auth_headers)
        assert response.status_code == 404


class TestActiveSessions(TestAuth):
    """Active sessions list (GET /api/checkin/active)"""
    
    def test_get_active_sessions(self, auth_headers):
        """Get list of active sessions"""
        response = requests.get(f"{BASE_URL}/api/checkin/active", 
                               params={"branch_id": BRANCH_ID}, headers=auth_headers)
        
        assert response.status_code == 200, f"Get active sessions failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        
        # Each session should have required fields
        for session in data:
            assert "session_id" in session
            assert "customer_id" in session
            assert "check_in_time" in session
            assert session["status"] == "CHECKED_IN"


class TestSubscriptions(TestAuth):
    """Subscription management (POST /api/subscriptions, POST /api/subscriptions/{id}/activate)"""
    
    def test_create_subscription_success(self, auth_headers):
        """Create subscription for customer"""
        # Create customer first
        unique_id = str(uuid.uuid4())[:8]
        card_number = f"TEST-SUB-{unique_id}"
        child_dob = (date.today() - timedelta(days=365*2)).isoformat()
        
        create_resp = requests.post(f"{BASE_URL}/api/customers", json={
            "card_number": card_number,
            "child_name": f"TEST_SubChild_{unique_id}",
            "child_dob": child_dob,
            "guardian": {"name": f"TEST_Guardian_{unique_id}"},
            "branch_id": BRANCH_ID
        }, headers=auth_headers)
        assert create_resp.status_code == 201
        customer_id = create_resp.json()["customer_id"]
        
        # Create subscription
        response = requests.post(f"{BASE_URL}/api/subscriptions", json={
            "customer_id": customer_id,
            "branch_id": BRANCH_ID,
            "subscription_type": "MONTHLY"
        }, headers=auth_headers)
        
        assert response.status_code == 201, f"Create subscription failed: {response.text}"
        data = response.json()
        assert data["customer_id"] == customer_id
        assert data["status"] == "PENDING"
        assert data["subscription_type"] == "MONTHLY"
        assert "subscription_id" in data
        
        self.__class__.test_subscription_id = data["subscription_id"]
        self.__class__.test_sub_customer_id = customer_id
        self.__class__.test_sub_card = card_number
        
    def test_activate_subscription_success(self, auth_headers):
        """Activate pending subscription"""
        if hasattr(self.__class__, 'test_subscription_id'):
            response = requests.post(
                f"{BASE_URL}/api/subscriptions/{self.__class__.test_subscription_id}/activate", 
                headers=auth_headers
            )
            
            assert response.status_code == 200, f"Activate subscription failed: {response.text}"
            data = response.json()
            assert data["status"] == "ACTIVE"
            assert data["activated_at"] is not None
            assert data["expires_at"] is not None
            assert data["is_active"] == True
            assert data["days_remaining"] == 30
            
    def test_create_duplicate_subscription_fails(self, auth_headers):
        """Cannot create subscription if one already exists"""
        if hasattr(self.__class__, 'test_sub_customer_id'):
            response = requests.post(f"{BASE_URL}/api/subscriptions", json={
                "customer_id": self.__class__.test_sub_customer_id,
                "branch_id": BRANCH_ID,
                "subscription_type": "MONTHLY"
            }, headers=auth_headers)
            
            assert response.status_code == 400, f"Expected 400 for duplicate subscription, got: {response.status_code}"


class TestCheckinWithSubscription(TestAuth):
    """Check-in using subscription"""
    
    def test_checkin_with_subscription(self, auth_headers):
        """Check in using active subscription"""
        # Create customer with waiver and subscription
        unique_id = str(uuid.uuid4())[:8]
        card_number = f"TEST-SUBCHECKIN-{unique_id}"
        child_dob = (date.today() - timedelta(days=365*2)).isoformat()
        
        # Create customer
        create_resp = requests.post(f"{BASE_URL}/api/customers", json={
            "card_number": card_number,
            "child_name": f"TEST_SubCheckinChild_{unique_id}",
            "child_dob": child_dob,
            "guardian": {"name": f"TEST_Guardian_{unique_id}"},
            "branch_id": BRANCH_ID
        }, headers=auth_headers)
        assert create_resp.status_code == 201
        customer_id = create_resp.json()["customer_id"]
        
        # Accept waiver
        requests.post(f"{BASE_URL}/api/customers/{customer_id}/waiver", json={
            "customer_id": customer_id,
            "accepted_terms": True
        }, headers=auth_headers)
        
        # Create and activate subscription
        sub_resp = requests.post(f"{BASE_URL}/api/subscriptions", json={
            "customer_id": customer_id,
            "branch_id": BRANCH_ID,
            "subscription_type": "MONTHLY"
        }, headers=auth_headers)
        assert sub_resp.status_code == 201
        subscription_id = sub_resp.json()["subscription_id"]
        
        activate_resp = requests.post(f"{BASE_URL}/api/subscriptions/{subscription_id}/activate", 
                                      headers=auth_headers)
        assert activate_resp.status_code == 200
        
        # Check in with subscription
        response = requests.post(f"{BASE_URL}/api/checkin?use_subscription=true", json={
            "card_number": card_number,
            "branch_id": BRANCH_ID
        }, headers=auth_headers)
        
        assert response.status_code == 201, f"Subscription check-in failed: {response.text}"
        data = response.json()
        assert data["payment_type"] == "SUBSCRIPTION"
        assert data["subscription_id"] == subscription_id
        
        # Checkout for cleanup
        requests.post(f"{BASE_URL}/api/checkin/{data['session_id']}/checkout", headers=auth_headers)


class TestSubscriptionAutoActivation(TestAuth):
    """Test subscription auto-activation on first check-in"""
    
    def test_pending_subscription_auto_activates_on_checkin(self, auth_headers):
        """Pending subscription should auto-activate on first check-in"""
        # Create customer with waiver
        unique_id = str(uuid.uuid4())[:8]
        card_number = f"TEST-AUTOACT-{unique_id}"
        child_dob = (date.today() - timedelta(days=365*2)).isoformat()
        
        # Create customer
        create_resp = requests.post(f"{BASE_URL}/api/customers", json={
            "card_number": card_number,
            "child_name": f"TEST_AutoActChild_{unique_id}",
            "child_dob": child_dob,
            "guardian": {"name": f"TEST_Guardian_{unique_id}"},
            "branch_id": BRANCH_ID
        }, headers=auth_headers)
        assert create_resp.status_code == 201
        customer_id = create_resp.json()["customer_id"]
        
        # Accept waiver
        requests.post(f"{BASE_URL}/api/customers/{customer_id}/waiver", json={
            "customer_id": customer_id,
            "accepted_terms": True
        }, headers=auth_headers)
        
        # Create subscription (stays PENDING)
        sub_resp = requests.post(f"{BASE_URL}/api/subscriptions", json={
            "customer_id": customer_id,
            "branch_id": BRANCH_ID,
            "subscription_type": "MONTHLY"
        }, headers=auth_headers)
        assert sub_resp.status_code == 201
        subscription_id = sub_resp.json()["subscription_id"]
        
        # Verify subscription is PENDING
        get_sub = requests.get(f"{BASE_URL}/api/subscriptions/{subscription_id}", headers=auth_headers)
        assert get_sub.json()["status"] == "PENDING"
        
        # Check in with subscription - should auto-activate
        response = requests.post(f"{BASE_URL}/api/checkin?use_subscription=true", json={
            "card_number": card_number,
            "branch_id": BRANCH_ID
        }, headers=auth_headers)
        
        assert response.status_code == 201, f"Auto-activation check-in failed: {response.text}"
        data = response.json()
        assert data["payment_type"] == "SUBSCRIPTION"
        
        # Verify subscription is now ACTIVE
        get_sub_after = requests.get(f"{BASE_URL}/api/subscriptions/{subscription_id}", headers=auth_headers)
        sub_data = get_sub_after.json()
        assert sub_data["status"] == "ACTIVE"
        assert sub_data["is_active"] == True
        
        # Cleanup
        requests.post(f"{BASE_URL}/api/checkin/{data['session_id']}/checkout", headers=auth_headers)


# Run tests
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
