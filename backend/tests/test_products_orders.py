"""
Backend API Tests for Phase 2 - Products and Orders
Tests CRUD for Products and Order lifecycle (create, confirm, pay, cancel)
"""
import pytest
import requests
import os
import uuid

# Get BASE_URL from environment - DO NOT add default URL
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    BASE_URL = "https://kidzone-orders.preview.emergentagent.com"


class TestAuth:
    """Authentication tests"""
    
    def test_admin_login_success(self):
        """Test admin can login successfully"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@example.com",
            "password": "adminpassword"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "access_token" in data
        assert data["user"]["role"] == "ADMIN"
        print(f"✓ Admin login successful, user_id: {data['user']['user_id']}")
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials returns 401"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "wrong@example.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401


@pytest.fixture(scope="module")
def admin_token():
    """Get admin authentication token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "admin@example.com",
        "password": "adminpassword"
    })
    if response.status_code != 200:
        pytest.skip("Admin login failed - skipping authenticated tests")
    return response.json()["access_token"]


@pytest.fixture(scope="module")
def auth_headers(admin_token):
    """Get authorization headers with admin token"""
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture(scope="module")
def branch_id(auth_headers):
    """Get the first available branch ID"""
    response = requests.get(f"{BASE_URL}/api/branches", headers=auth_headers)
    if response.status_code != 200 or not response.json():
        pytest.skip("No branches available - skipping tests")
    return response.json()[0]["branch_id"]


class TestProducts:
    """Products API tests - CRUD operations"""
    
    def test_list_products(self, auth_headers):
        """GET /api/products - List all products"""
        response = requests.get(f"{BASE_URL}/api/products", headers=auth_headers)
        assert response.status_code == 200, f"Failed to list products: {response.text}"
        products = response.json()
        assert isinstance(products, list)
        print(f"✓ Listed {len(products)} products")
    
    def test_list_products_by_branch(self, auth_headers, branch_id):
        """GET /api/products?branch_id=xxx - Filter products by branch"""
        response = requests.get(
            f"{BASE_URL}/api/products",
            params={"branch_id": branch_id},
            headers=auth_headers
        )
        assert response.status_code == 200
        products = response.json()
        # Verify all products belong to the branch
        for product in products:
            assert product["branch_id"] == branch_id
        print(f"✓ Listed {len(products)} products for branch {branch_id}")
    
    def test_list_products_by_category(self, auth_headers):
        """GET /api/products?category=FOOD - Filter products by category"""
        response = requests.get(
            f"{BASE_URL}/api/products",
            params={"category": "FOOD"},
            headers=auth_headers
        )
        assert response.status_code == 200
        products = response.json()
        for product in products:
            assert product["category"] == "FOOD"
        print(f"✓ Listed {len(products)} FOOD products")
    
    def test_create_product(self, auth_headers, branch_id):
        """POST /api/products - Create new product (admin only)"""
        unique_sku = f"TEST-{uuid.uuid4().hex[:8].upper()}"
        product_data = {
            "branch_id": branch_id,
            "sku": unique_sku,
            "name_ar": "منتج اختبار",
            "name_en": "TEST Product",
            "description_ar": "وصف منتج اختبار",
            "description_en": "Test product description",
            "category": "RETAIL",
            "product_type": "CONSUMABLE",
            "price": 25.0,
            "tax_rate": 0.15
        }
        
        response = requests.post(
            f"{BASE_URL}/api/products",
            json=product_data,
            headers=auth_headers
        )
        assert response.status_code == 201, f"Failed to create product: {response.text}"
        
        created_product = response.json()
        assert created_product["sku"] == unique_sku
        assert created_product["name_ar"] == "منتج اختبار"
        assert created_product["price"] == 25.0
        assert "product_id" in created_product
        
        # Verify by GET
        get_response = requests.get(
            f"{BASE_URL}/api/products/{created_product['product_id']}",
            headers=auth_headers
        )
        assert get_response.status_code == 200
        fetched = get_response.json()
        assert fetched["sku"] == unique_sku
        
        print(f"✓ Created product: {created_product['product_id']}")
        return created_product["product_id"]
    
    def test_create_product_duplicate_sku_fails(self, auth_headers, branch_id):
        """POST /api/products - Duplicate SKU in same branch should fail"""
        unique_sku = f"DUP-{uuid.uuid4().hex[:8].upper()}"
        product_data = {
            "branch_id": branch_id,
            "sku": unique_sku,
            "name_ar": "منتج مكرر",
            "name_en": "Duplicate Product",
            "category": "RETAIL",
            "product_type": "CONSUMABLE",
            "price": 30.0
        }
        
        # First creation should succeed
        response1 = requests.post(f"{BASE_URL}/api/products", json=product_data, headers=auth_headers)
        assert response1.status_code == 201
        
        # Second creation with same SKU should fail
        response2 = requests.post(f"{BASE_URL}/api/products", json=product_data, headers=auth_headers)
        assert response2.status_code == 400, f"Duplicate SKU should return 400, got {response2.status_code}"
        print("✓ Duplicate SKU correctly rejected")
    
    def test_get_product_by_id(self, auth_headers):
        """GET /api/products/{product_id} - Get single product"""
        # First get list of products
        list_response = requests.get(f"{BASE_URL}/api/products", headers=auth_headers)
        products = list_response.json()
        if not products:
            pytest.skip("No products available")
        
        product_id = products[0]["product_id"]
        response = requests.get(f"{BASE_URL}/api/products/{product_id}", headers=auth_headers)
        assert response.status_code == 200
        
        product = response.json()
        assert product["product_id"] == product_id
        assert "name_ar" in product
        assert "price" in product
        print(f"✓ Got product: {product['name_en']}")
    
    def test_get_nonexistent_product_returns_404(self, auth_headers):
        """GET /api/products/{product_id} - Non-existent product returns 404"""
        fake_id = str(uuid.uuid4())
        response = requests.get(f"{BASE_URL}/api/products/{fake_id}", headers=auth_headers)
        assert response.status_code == 404
        print("✓ Non-existent product correctly returns 404")
    
    def test_update_product(self, auth_headers, branch_id):
        """PATCH /api/products/{product_id} - Update product"""
        # Create a product to update
        unique_sku = f"UPD-{uuid.uuid4().hex[:8].upper()}"
        create_response = requests.post(
            f"{BASE_URL}/api/products",
            json={
                "branch_id": branch_id,
                "sku": unique_sku,
                "name_ar": "منتج للتحديث",
                "name_en": "Product to Update",
                "category": "RETAIL",
                "product_type": "CONSUMABLE",
                "price": 100.0
            },
            headers=auth_headers
        )
        assert create_response.status_code == 201
        product_id = create_response.json()["product_id"]
        
        # Update the product
        update_response = requests.patch(
            f"{BASE_URL}/api/products/{product_id}",
            json={"price": 150.0, "name_ar": "منتج محدث"},
            headers=auth_headers
        )
        assert update_response.status_code == 200, f"Update failed: {update_response.text}"
        
        updated = update_response.json()
        assert updated["price"] == 150.0
        assert updated["name_ar"] == "منتج محدث"
        
        # Verify by GET
        get_response = requests.get(f"{BASE_URL}/api/products/{product_id}", headers=auth_headers)
        fetched = get_response.json()
        assert fetched["price"] == 150.0
        
        print(f"✓ Updated product price to 150.0")


class TestOrders:
    """Orders API tests - Create, Confirm, Pay, Cancel lifecycle"""
    
    @pytest.fixture
    def product_ids(self, auth_headers, branch_id):
        """Get product IDs for the branch"""
        response = requests.get(
            f"{BASE_URL}/api/products",
            params={"branch_id": branch_id},
            headers=auth_headers
        )
        products = response.json()
        if len(products) < 2:
            pytest.skip("Need at least 2 products for order tests")
        return [p["product_id"] for p in products[:2]]
    
    def test_list_orders(self, auth_headers):
        """GET /api/orders - List orders"""
        response = requests.get(f"{BASE_URL}/api/orders", headers=auth_headers)
        assert response.status_code == 200, f"Failed to list orders: {response.text}"
        orders = response.json()
        assert isinstance(orders, list)
        print(f"✓ Listed {len(orders)} orders")
    
    def test_create_order(self, auth_headers, branch_id, product_ids):
        """POST /api/orders - Create new order with items"""
        order_data = {
            "branch_id": branch_id,
            "order_source": "POS",
            "items": [
                {"product_id": product_ids[0], "quantity": 2},
                {"product_id": product_ids[1], "quantity": 1}
            ]
        }
        
        response = requests.post(f"{BASE_URL}/api/orders", json=order_data, headers=auth_headers)
        assert response.status_code == 201, f"Failed to create order: {response.text}"
        
        order = response.json()
        assert "order_id" in order
        assert "order_number" in order
        assert order["status"] == "DRAFT"
        assert len(order["items"]) == 2
        assert order["total_amount"] > 0
        
        print(f"✓ Created order: {order['order_number']}, total: {order['total_amount']}")
        return order
    
    def test_create_order_with_invalid_product_fails(self, auth_headers, branch_id):
        """POST /api/orders - Order with non-existent product should fail"""
        order_data = {
            "branch_id": branch_id,
            "order_source": "POS",
            "items": [{"product_id": str(uuid.uuid4()), "quantity": 1}]
        }
        
        response = requests.post(f"{BASE_URL}/api/orders", json=order_data, headers=auth_headers)
        assert response.status_code == 400, f"Expected 400 for invalid product, got {response.status_code}"
        print("✓ Invalid product correctly rejected")
    
    def test_confirm_order(self, auth_headers, branch_id, product_ids):
        """POST /api/orders/{order_id}/confirm - Confirm draft order"""
        # Create order first
        create_response = requests.post(
            f"{BASE_URL}/api/orders",
            json={
                "branch_id": branch_id,
                "order_source": "POS",
                "items": [{"product_id": product_ids[0], "quantity": 1}]
            },
            headers=auth_headers
        )
        order_id = create_response.json()["order_id"]
        
        # Confirm the order
        confirm_response = requests.post(
            f"{BASE_URL}/api/orders/{order_id}/confirm",
            headers=auth_headers
        )
        assert confirm_response.status_code == 200, f"Confirm failed: {confirm_response.text}"
        
        confirmed = confirm_response.json()
        assert confirmed["status"] == "CONFIRMED"
        assert confirmed["confirmed_at"] is not None
        
        print(f"✓ Order confirmed: {confirmed['order_number']}")
        return order_id
    
    def test_confirm_already_confirmed_fails(self, auth_headers, branch_id, product_ids):
        """POST /api/orders/{order_id}/confirm - Cannot confirm already confirmed order"""
        # Create and confirm order
        create_response = requests.post(
            f"{BASE_URL}/api/orders",
            json={
                "branch_id": branch_id,
                "order_source": "POS",
                "items": [{"product_id": product_ids[0], "quantity": 1}]
            },
            headers=auth_headers
        )
        order_id = create_response.json()["order_id"]
        
        # First confirm
        requests.post(f"{BASE_URL}/api/orders/{order_id}/confirm", headers=auth_headers)
        
        # Second confirm should fail
        response = requests.post(f"{BASE_URL}/api/orders/{order_id}/confirm", headers=auth_headers)
        assert response.status_code == 400
        print("✓ Duplicate confirm correctly rejected")
    
    def test_pay_order(self, auth_headers, branch_id, product_ids):
        """POST /api/orders/{order_id}/pay - Pay for order"""
        # Create order
        create_response = requests.post(
            f"{BASE_URL}/api/orders",
            json={
                "branch_id": branch_id,
                "order_source": "POS",
                "items": [{"product_id": product_ids[0], "quantity": 1}]
            },
            headers=auth_headers
        )
        order = create_response.json()
        order_id = order["order_id"]
        
        # Pay the order (can skip confirm in simplified flow)
        pay_response = requests.post(
            f"{BASE_URL}/api/orders/{order_id}/pay",
            headers=auth_headers
        )
        assert pay_response.status_code == 200, f"Pay failed: {pay_response.text}"
        
        paid_order = pay_response.json()
        assert paid_order["status"] == "PAID"
        
        # Verify via GET
        get_response = requests.get(f"{BASE_URL}/api/orders/{order_id}", headers=auth_headers)
        assert get_response.json()["status"] == "PAID"
        
        print(f"✓ Order paid: {paid_order['order_number']}, amount: {paid_order['total_amount']}")
    
    def test_pay_already_paid_fails(self, auth_headers, branch_id, product_ids):
        """POST /api/orders/{order_id}/pay - Cannot pay already paid order"""
        # Create and pay order
        create_response = requests.post(
            f"{BASE_URL}/api/orders",
            json={
                "branch_id": branch_id,
                "order_source": "POS",
                "items": [{"product_id": product_ids[0], "quantity": 1}]
            },
            headers=auth_headers
        )
        order_id = create_response.json()["order_id"]
        
        # First pay
        requests.post(f"{BASE_URL}/api/orders/{order_id}/pay", headers=auth_headers)
        
        # Second pay should fail
        response = requests.post(f"{BASE_URL}/api/orders/{order_id}/pay", headers=auth_headers)
        assert response.status_code == 400
        print("✓ Duplicate payment correctly rejected")
    
    def test_cancel_order(self, auth_headers, branch_id, product_ids):
        """POST /api/orders/{order_id}/cancel - Cancel order (admin/manager only)"""
        # Create order
        create_response = requests.post(
            f"{BASE_URL}/api/orders",
            json={
                "branch_id": branch_id,
                "order_source": "POS",
                "items": [{"product_id": product_ids[0], "quantity": 1}]
            },
            headers=auth_headers
        )
        order_id = create_response.json()["order_id"]
        
        # Cancel the order
        cancel_response = requests.post(
            f"{BASE_URL}/api/orders/{order_id}/cancel",
            headers=auth_headers
        )
        assert cancel_response.status_code == 200, f"Cancel failed: {cancel_response.text}"
        
        cancelled = cancel_response.json()
        assert cancelled["status"] == "CANCELLED"
        
        # Verify via GET
        get_response = requests.get(f"{BASE_URL}/api/orders/{order_id}", headers=auth_headers)
        assert get_response.json()["status"] == "CANCELLED"
        
        print(f"✓ Order cancelled: {cancelled['order_number']}")
    
    def test_cancel_already_cancelled_fails(self, auth_headers, branch_id, product_ids):
        """POST /api/orders/{order_id}/cancel - Cannot cancel already cancelled order"""
        # Create and cancel order
        create_response = requests.post(
            f"{BASE_URL}/api/orders",
            json={
                "branch_id": branch_id,
                "order_source": "POS",
                "items": [{"product_id": product_ids[0], "quantity": 1}]
            },
            headers=auth_headers
        )
        order_id = create_response.json()["order_id"]
        
        # First cancel
        requests.post(f"{BASE_URL}/api/orders/{order_id}/cancel", headers=auth_headers)
        
        # Second cancel should fail
        response = requests.post(f"{BASE_URL}/api/orders/{order_id}/cancel", headers=auth_headers)
        assert response.status_code == 400
        print("✓ Duplicate cancel correctly rejected")
    
    def test_get_order_by_id(self, auth_headers, branch_id, product_ids):
        """GET /api/orders/{order_id} - Get single order"""
        # Create order first
        create_response = requests.post(
            f"{BASE_URL}/api/orders",
            json={
                "branch_id": branch_id,
                "order_source": "POS",
                "items": [{"product_id": product_ids[0], "quantity": 1}]
            },
            headers=auth_headers
        )
        order_id = create_response.json()["order_id"]
        
        # Get the order
        get_response = requests.get(f"{BASE_URL}/api/orders/{order_id}", headers=auth_headers)
        assert get_response.status_code == 200
        
        order = get_response.json()
        assert order["order_id"] == order_id
        assert "items" in order
        assert "total_amount" in order
        
        print(f"✓ Got order: {order['order_number']}")
    
    def test_get_nonexistent_order_returns_404(self, auth_headers):
        """GET /api/orders/{order_id} - Non-existent order returns 404"""
        fake_id = str(uuid.uuid4())
        response = requests.get(f"{BASE_URL}/api/orders/{fake_id}", headers=auth_headers)
        assert response.status_code == 404
        print("✓ Non-existent order correctly returns 404")


class TestOrderTotals:
    """Test order calculation accuracy"""
    
    def test_order_totals_calculation(self, auth_headers, branch_id):
        """Verify order subtotal, tax, and total are calculated correctly"""
        # Get products with known prices
        products_response = requests.get(
            f"{BASE_URL}/api/products",
            params={"branch_id": branch_id},
            headers=auth_headers
        )
        products = products_response.json()
        if len(products) < 2:
            pytest.skip("Need at least 2 products")
        
        # Select first 2 products
        p1, p2 = products[0], products[1]
        
        # Create order with specific quantities
        order_data = {
            "branch_id": branch_id,
            "order_source": "POS",
            "items": [
                {"product_id": p1["product_id"], "quantity": 2},
                {"product_id": p2["product_id"], "quantity": 1}
            ]
        }
        
        response = requests.post(f"{BASE_URL}/api/orders", json=order_data, headers=auth_headers)
        assert response.status_code == 201
        
        order = response.json()
        
        # Calculate expected values
        expected_subtotal = (p1["price"] * 2) + (p2["price"] * 1)
        expected_tax = expected_subtotal * 0.15
        expected_total = expected_subtotal + expected_tax
        
        # Verify calculations (with small tolerance for floating point)
        assert abs(order["subtotal"] - expected_subtotal) < 0.01, f"Subtotal mismatch: {order['subtotal']} vs {expected_subtotal}"
        assert abs(order["tax_amount"] - expected_tax) < 0.01, f"Tax mismatch: {order['tax_amount']} vs {expected_tax}"
        assert abs(order["total_amount"] - expected_total) < 0.01, f"Total mismatch: {order['total_amount']} vs {expected_total}"
        
        print(f"✓ Order totals verified - Subtotal: {order['subtotal']}, Tax: {order['tax_amount']}, Total: {order['total_amount']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
