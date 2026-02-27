import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import { ShoppingCart, Plus, Minus, Trash2, CreditCard, Receipt, Package, Coffee, UtensilsCrossed, ShoppingBag, CheckCircle } from 'lucide-react';

// Category icons mapping
const categoryIcons = {
  ADMISSION: Package,
  FOOD: UtensilsCrossed,
  BEVERAGE: Coffee,
  RETAIL: ShoppingBag,
  ADDON: Plus,
  MEMBERSHIP: CreditCard,
  PARTY_PACKAGE: Package,
};

// Category colors (Peekaboo Playful - POS uses green accent)
const categoryColors = {
  ADMISSION: 'bg-playful-green/10 border-playful-green text-playful-green',
  FOOD: 'bg-playful-orange/10 border-playful-orange text-playful-orange',
  BEVERAGE: 'bg-playful-blue/10 border-playful-blue text-playful-blue',
  RETAIL: 'bg-primary-yellow/10 border-primary-yellow text-yellow-700',
  ADDON: 'bg-gray-100 border-gray-300 text-gray-600',
  MEMBERSHIP: 'bg-primary-yellow/10 border-primary-yellow text-yellow-700',
  PARTY_PACKAGE: 'bg-playful-red/10 border-playful-red text-playful-red',
};

// Category labels in Arabic
const categoryLabels = {
  ADMISSION: 'الدخول',
  FOOD: 'طعام',
  BEVERAGE: 'مشروبات',
  RETAIL: 'منتجات',
  ADDON: 'إضافات',
  MEMBERSHIP: 'اشتراكات',
  PARTY_PACKAGE: 'حفلات',
};

const POS = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [lastOrder, setLastOrder] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);

  // Fetch branches
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await api.get('/branches');
        setBranches(response.data);
        // Auto-select first branch or user's branch
        if (response.data.length > 0) {
          const userBranch = response.data.find(b => b.branch_id === user?.branch_id);
          setSelectedBranch(userBranch || response.data[0]);
        }
      } catch (error) {
        console.error('Error fetching branches:', error);
      }
    };
    fetchBranches();
  }, [user]);

  // Fetch products when branch changes
  useEffect(() => {
    const fetchProducts = async () => {
      if (!selectedBranch) return;
      
      setLoading(true);
      try {
        const response = await api.get('/products', {
          params: { branch_id: selectedBranch.branch_id, active: true }
        });
        setProducts(response.data);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [selectedBranch]);

  // Get unique categories from products
  const categories = ['ALL', ...new Set(products.map(p => p.category))];

  // Filter products by category
  const filteredProducts = selectedCategory === 'ALL' 
    ? products 
    : products.filter(p => p.category === selectedCategory);

  // Add to cart
  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product_id === product.product_id);
      if (existing) {
        return prev.map(item =>
          item.product_id === product.product_id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  // Update cart quantity
  const updateQuantity = (productId, delta) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.product_id === productId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : item;
        }
        return item;
      }).filter(item => item.quantity > 0);
    });
  };

  // Remove from cart
  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.product_id !== productId));
  };

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.15; // 15% VAT
  const total = subtotal + tax;

  // Process checkout
  const handleCheckout = async () => {
    if (!selectedBranch || cart.length === 0) return;

    setProcessing(true);
    try {
      // Create order
      const orderData = {
        branch_id: selectedBranch.branch_id,
        order_source: 'POS',
        items: cart.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity
        }))
      };

      const orderResponse = await api.post('/orders', orderData);
      const order = orderResponse.data;

      // Mark as paid immediately (simplified flow)
      const paidResponse = await api.post(`/orders/${order.order_id}/pay`);
      
      setLastOrder(paidResponse.data);
      setCart([]);
      setShowCheckout(false);
      setShowReceipt(true);
    } catch (error) {
      console.error('Checkout error:', error);
      alert(error.response?.data?.detail || 'حدث خطأ أثناء إتمام الطلب');
    } finally {
      setProcessing(false);
    }
  };

  // Clear cart
  const clearCart = () => {
    setCart([]);
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header with green accent (POS module color) */}
      <div className="bg-white border-b-4 border-playful-green shadow-soft">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-card bg-playful-green/10 flex items-center justify-center">
                <Receipt className="w-6 h-6 text-playful-green" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">نقطة البيع</h1>
                <p className="text-sm text-gray-500">
                  {selectedBranch?.name_ar || 'اختر فرع'}
                </p>
              </div>
            </div>
            
            {/* Branch selector for admin */}
            {user?.role === 'ADMIN' && branches.length > 1 && (
              <select
                value={selectedBranch?.branch_id || ''}
                onChange={(e) => {
                  const branch = branches.find(b => b.branch_id === e.target.value);
                  setSelectedBranch(branch);
                }}
                className="px-4 py-2 rounded-input border-2 border-gray-200 focus:border-playful-blue focus:outline-none"
                data-testid="branch-selector"
              >
                {branches.map(branch => (
                  <option key={branch.branch_id} value={branch.branch_id}>
                    {branch.name_ar}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Products Grid */}
          <div className="lg:col-span-2 space-y-6">
            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {categories.map(category => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory(category)}
                  className={`rounded-pill whitespace-nowrap ${
                    selectedCategory === category 
                      ? 'bg-playful-green text-white hover:bg-playful-green/90' 
                      : 'hover:bg-gray-100'
                  }`}
                  data-testid={`category-${category}`}
                >
                  {category === 'ALL' ? 'الكل' : categoryLabels[category] || category}
                </Button>
              ))}
            </div>

            {/* Products */}
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="h-16 bg-gray-200 rounded-input mb-3"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <Card className="rounded-card">
                <CardContent className="p-12 text-center">
                  <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">لا توجد منتجات</h3>
                  <p className="text-gray-500">لم يتم العثور على منتجات في هذه الفئة</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {filteredProducts.map(product => {
                  const Icon = categoryIcons[product.category] || Package;
                  const colorClass = categoryColors[product.category] || categoryColors.ADDON;
                  const cartItem = cart.find(item => item.product_id === product.product_id);
                  
                  return (
                    <Card
                      key={product.product_id}
                      className="rounded-card border-2 border-gray-200 hover:border-playful-green hover:shadow-card transition-all duration-200 cursor-pointer group"
                      onClick={() => addToCart(product)}
                      data-testid={`product-${product.sku}`}
                    >
                      <CardContent className="p-4">
                        {/* Category badge */}
                        <div className={`w-12 h-12 rounded-button flex items-center justify-center mb-3 border-2 ${colorClass}`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        
                        {/* Product name */}
                        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                          {product.name_ar}
                        </h3>
                        
                        {/* Price */}
                        <div className="flex items-center justify-between">
                          <span className="text-xl font-bold text-playful-green">
                            {product.price.toFixed(2)}
                            <span className="text-sm font-normal text-gray-500 mr-1">ريال</span>
                          </span>
                          
                          {cartItem && (
                            <span className="bg-playful-green text-white text-sm font-bold px-3 py-1 rounded-pill">
                              {cartItem.quantity}
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Cart */}
          <div className="lg:col-span-1">
            <Card className="rounded-card border-2 border-gray-200 sticky top-4">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-playful-green" />
                    <h2 className="text-lg font-bold">السلة</h2>
                  </div>
                  {cart.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearCart}
                      className="text-playful-red hover:bg-playful-red/10"
                      data-testid="clear-cart-btn"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              <CardContent className="p-4">
                {cart.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500">السلة فارغة</p>
                    <p className="text-sm text-gray-400 mt-1">اضغط على المنتج لإضافته</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Cart Items */}
                    <div className="space-y-3 max-h-[40vh] overflow-y-auto">
                      {cart.map(item => (
                        <div
                          key={item.product_id}
                          className="flex items-center gap-3 p-3 bg-gray-50 rounded-input"
                          data-testid={`cart-item-${item.sku}`}
                        >
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 truncate">
                              {item.name_ar}
                            </h4>
                            <p className="text-sm text-gray-500">
                              {item.price.toFixed(2)} ريال
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateQuantity(item.product_id, -1);
                              }}
                              className="w-8 h-8 p-0 rounded-button"
                              data-testid={`decrease-${item.sku}`}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            
                            <span className="w-8 text-center font-bold">
                              {item.quantity}
                            </span>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateQuantity(item.product_id, 1);
                              }}
                              className="w-8 h-8 p-0 rounded-button"
                              data-testid={`increase-${item.sku}`}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeFromCart(item.product_id);
                              }}
                              className="w-8 h-8 p-0 text-playful-red hover:bg-playful-red/10"
                              data-testid={`remove-${item.sku}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Totals */}
                    <div className="border-t border-gray-200 pt-4 space-y-2">
                      <div className="flex justify-between text-gray-600">
                        <span>المجموع الفرعي</span>
                        <span>{subtotal.toFixed(2)} ريال</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>ضريبة القيمة المضافة (15%)</span>
                        <span>{tax.toFixed(2)} ريال</span>
                      </div>
                      <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t border-gray-200">
                        <span>الإجمالي</span>
                        <span className="text-playful-green">{total.toFixed(2)} ريال</span>
                      </div>
                    </div>

                    {/* Checkout Button */}
                    <Button
                      onClick={() => setShowCheckout(true)}
                      className="w-full h-14 text-lg font-bold rounded-button bg-playful-green hover:bg-playful-green/90 text-white"
                      data-testid="checkout-btn"
                    >
                      <CreditCard className="w-5 h-5 ml-2" />
                      إتمام الدفع
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Checkout Dialog */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="rounded-modal max-w-md" dir="rtl" aria-describedby="checkout-description">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-playful-green" />
              تأكيد الدفع
            </DialogTitle>
          </DialogHeader>
          
          <div id="checkout-description" className="space-y-4 py-4">
            {/* Order Summary */}
            <div className="bg-gray-50 rounded-input p-4 space-y-2">
              <h4 className="font-semibold text-gray-900 mb-3">ملخص الطلب</h4>
              {cart.map(item => (
                <div key={item.product_id} className="flex justify-between text-sm">
                  <span>{item.name_ar} × {item.quantity}</span>
                  <span>{(item.price * item.quantity).toFixed(2)} ريال</span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="space-y-2 pt-2">
              <div className="flex justify-between">
                <span className="text-gray-600">المجموع الفرعي</span>
                <span>{subtotal.toFixed(2)} ريال</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">ضريبة القيمة المضافة</span>
                <span>{tax.toFixed(2)} ريال</span>
              </div>
              <div className="flex justify-between text-xl font-bold pt-2 border-t">
                <span>الإجمالي</span>
                <span className="text-playful-green">{total.toFixed(2)} ريال</span>
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowCheckout(false)}
              className="flex-1 rounded-button"
              data-testid="cancel-checkout-btn"
            >
              إلغاء
            </Button>
            <Button
              onClick={handleCheckout}
              disabled={processing}
              className="flex-1 rounded-button bg-playful-green hover:bg-playful-green/90 text-white"
              data-testid="confirm-payment-btn"
            >
              {processing ? 'جاري المعالجة...' : 'تأكيد الدفع'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="rounded-modal max-w-md" dir="rtl" aria-describedby="receipt-description">
          <div id="receipt-description" className="text-center py-6">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-playful-green/10 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-playful-green" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">تم الدفع بنجاح!</h2>
            <p className="text-gray-500 mb-6">رقم الطلب: {lastOrder?.order_number}</p>
            
            {lastOrder && (
              <div className="bg-gray-50 rounded-input p-4 text-right space-y-3">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-500">التاريخ</span>
                  <span>{new Date(lastOrder.created_at).toLocaleString('ar-SA')}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-500">عدد الأصناف</span>
                  <span>{lastOrder.items.length}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-500">المجموع الفرعي</span>
                  <span>{lastOrder.subtotal.toFixed(2)} ريال</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-500">الضريبة</span>
                  <span>{lastOrder.tax_amount.toFixed(2)} ريال</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2">
                  <span>الإجمالي</span>
                  <span className="text-playful-green">{lastOrder.total_amount.toFixed(2)} ريال</span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              onClick={() => setShowReceipt(false)}
              className="w-full rounded-button bg-playful-green hover:bg-playful-green/90 text-white"
              data-testid="close-receipt-btn"
            >
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default POS;
