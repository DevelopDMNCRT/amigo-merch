import { reactive, computed } from 'vue';

export const cartState = reactive({
  items: [],
  isOpen: false,
  baseShippingCost: 0,
  shippingAvailable: false
});

export const cartGetters = {
  totalItems: computed(() => cartState.items.reduce((total, item) => total + item.quantity, 0)),
  totalPrice: computed(() => cartState.items.reduce((total, item) => total + (item.price * item.quantity), 0)),
  // Envío: 
  // 1. Si algún item tiene envío gratis (0), es gratis.
  // 2. Si no, si hay items con envío especial, cobramos el menor de los envíos especiales.
  // 3. Si ninguno tiene envío especial, cobramos el baseShippingCost evaluado por país/estado.
  shippingCost: computed(() => {
    if (cartState.items.length === 0) return cartState.baseShippingCost;
    
    let cost = cartState.baseShippingCost;
    let hasSpecial = false;

    for (const item of cartState.items) {
      if (item.envioEspecial === 0) return 0; // Gratis siempre gana
      if (item.envioEspecial !== null && item.envioEspecial !== undefined) {
        if (!hasSpecial) {
          cost = item.envioEspecial;
          hasSpecial = true;
        } else {
          cost = Math.min(cost, item.envioEspecial);
        }
      }
    }
    return cost;
  }),
};

const PRODUCTOS_ENVIO_GRATIS_HARDCODED = [449];

export const cartActions = {
  addItem(product, size, quantity) {
    const isFreeShippingProduct = PRODUCTOS_ENVIO_GRATIS_HARDCODED.includes(Number(product.id));
    const envioEspecialCalculado = isFreeShippingProduct
      ? 0
      : (product.envio_especial !== undefined && product.envio_especial !== null
          ? Number(product.envio_especial)
          : null);

    const existingItem = cartState.items.find(
      item => item.id === product.id && item.size === size
    );
    if (existingItem) {
      existingItem.quantity += quantity;
      existingItem.price = Number(product.precio ?? product.price ?? 0);
      existingItem.envioEspecial = envioEspecialCalculado;
    } else {
      cartState.items.push({
        id: product.id,
        name: product.nombre ?? product.name,
        image: product.imagen_url ?? product.image,
        price: Number(product.precio ?? product.price ?? 0),
        tienda: product.tienda ?? product.artist,
        envioEspecial: envioEspecialCalculado,
        size,
        quantity,
        cartItemId: Date.now() + Math.random().toString(36).substr(2, 9)
      });
    }
    cartState.isOpen = true;
  },
  removeItem(cartItemId) {
    cartState.items = cartState.items.filter(item => item.cartItemId !== cartItemId);
  },
  updateQuantity(cartItemId, quantity) {
    const item = cartState.items.find(item => item.cartItemId === cartItemId);
    if (item && quantity > 0) {
      item.quantity = quantity;
    }
  },
  toggleCart() {
    cartState.isOpen = !cartState.isOpen;
  },
  openCart() {
    cartState.isOpen = true;
  },
  closeCart() {
    cartState.isOpen = false;
  },
  clearCart() {
    cartState.items = [];
  }
};
