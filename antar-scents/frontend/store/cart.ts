import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  product_id: string;
  title: string;
  variant?: string;
  quantity: number;
  unit_price: number;
  image?: string;
  handle: string;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  addItem: (item: CartItem) => void;
  removeItem: (product_id: string, variant?: string) => void;
  updateQuantity: (product_id: string, variant: string | undefined, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  get total(): number;
  get subtotal(): number;
  get count(): number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (item) => {
        set(state => {
          const existing = state.items.find(i => i.product_id === item.product_id && i.variant === item.variant);
          if (existing) {
            return { items: state.items.map(i => i.product_id === item.product_id && i.variant === item.variant ? { ...i, quantity: i.quantity + item.quantity } : i) };
          }
          return { items: [...state.items, item] };
        });
      },

      removeItem: (product_id, variant) => {
        set(state => ({ items: state.items.filter(i => !(i.product_id === product_id && i.variant === variant)) }));
      },

      updateQuantity: (product_id, variant, quantity) => {
        if (quantity <= 0) {
          get().removeItem(product_id, variant);
          return;
        }
        set(state => ({ items: state.items.map(i => i.product_id === product_id && i.variant === variant ? { ...i, quantity } : i) }));
      },

      clearCart: () => set({ items: [] }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set(state => ({ isOpen: !state.isOpen })),

      get total() {
        return get().items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
      },
      get subtotal() {
        return get().items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
      },
      get count() {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      }
    }),
    { name: 'antar-cart' }
  )
);
