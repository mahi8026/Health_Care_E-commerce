import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';

export default function Header({ onLoginClick, onRegisterClick, onLogout, onCartClick, onNavigate, onSearchClick }) {
  const { getCartCount } = useCart();
  const { user, isAuthenticated } = useAuth();
  const cartCount = getCartCount();

  return (
    <nav className="bg-[var(--color-background-primary)] border-b-[0.5px] border-[var(--color-border-tertiary)] px-6 flex items-center h-[54px] gap-5">
      <div 
        onClick={() => onNavigate && onNavigate('home')}
        className="font-[family-name:var(--font-lora)] text-[19px] font-semibold text-[#0B2545] flex-shrink-0 cursor-pointer"
      >
        MedCore<sup className="text-[10px] text-[#0E8A6E] font-[family-name:var(--font-plus-jakarta)]">BD</sup>
      </div>
      
      <div className="flex-1 flex gap-1">
        <span 
          onClick={() => onNavigate && onNavigate('home')}
          className="text-[12px] text-[var(--color-text-secondary)] px-[10px] py-[6px] cursor-pointer hover:text-[var(--color-text-primary)]"
        >
          Home
        </span>
        <span 
          onClick={() => onNavigate && onNavigate('product')}
          className="text-[12px] text-[var(--color-text-secondary)] px-[10px] py-[6px] cursor-pointer hover:text-[var(--color-text-primary)]"
        >
          Diagnostics
        </span>
        <span 
          onClick={() => onNavigate && onNavigate('reagent')}
          className="text-[12px] text-[var(--color-text-secondary)] px-[10px] py-[6px] cursor-pointer hover:text-[var(--color-text-primary)]"
        >
          Surgical
        </span>
        <span 
          onClick={() => onNavigate && onNavigate('reagent')}
          className="text-[12px] text-[var(--color-text-secondary)] px-[10px] py-[6px] cursor-pointer hover:text-[var(--color-text-primary)]"
        >
          Reagents
        </span>
        <span 
          onClick={() => onNavigate && onNavigate('product')}
          className="text-[12px] text-[var(--color-text-secondary)] px-[10px] py-[6px] cursor-pointer hover:text-[var(--color-text-primary)]"
        >
          Machines
        </span>
        <span 
          onClick={() => onNavigate && onNavigate('reagent')}
          className="text-[12px] text-[var(--color-text-secondary)] px-[10px] py-[6px] cursor-pointer hover:text-[var(--color-text-primary)]"
        >
          Lab Equipment
        </span>
        <span 
          onClick={() => onNavigate && onNavigate('b2b')}
          className="text-[12px] text-[var(--color-text-secondary)] px-[10px] py-[6px] cursor-pointer hover:text-[var(--color-text-primary)]"
        >
          B2B Portal
        </span>
      </div>
      
      <div className="flex gap-2 items-center ml-auto">
        <button 
          onClick={onSearchClick}
          aria-label="Search"
          className="w-8 h-8 rounded-[7px] border-[0.5px] border-[var(--color-border-tertiary)] bg-[var(--color-background-primary)] flex items-center justify-center cursor-pointer hover:bg-[var(--color-background-secondary)]"
          title="Search"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
        </button>
        
        <button aria-label="Wishlist" className="w-8 h-8 rounded-[7px] border-[0.5px] border-[var(--color-border-tertiary)] bg-[var(--color-background-primary)] flex items-center justify-center cursor-pointer relative hover:bg-[var(--color-background-secondary)]">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
          </svg>
        </button>
        
        <button
          onClick={onCartClick}
          aria-label={cartCount > 0 ? `Shopping cart, ${cartCount} items` : 'Shopping cart'}
          className="w-8 h-8 rounded-[7px] border-[0.5px] border-[var(--color-border-tertiary)] bg-[var(--color-background-primary)] flex items-center justify-center cursor-pointer relative hover:bg-[var(--color-background-secondary)]"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 01-8 0"/>
          </svg>
          {cartCount > 0 && (
            <div aria-hidden="true" className="absolute -top-[5px] -right-[5px] bg-[#E24B4A] text-white text-[8px] w-[14px] h-[14px] rounded-full flex items-center justify-center border-[1.5px] border-[var(--color-background-primary)]">
              {cartCount}
            </div>
          )}
        </button>
        
        <button aria-label="Account" className="w-8 h-8 rounded-[7px] border-[0.5px] border-[var(--color-border-tertiary)] bg-[var(--color-background-primary)] flex items-center justify-center cursor-pointer hover:bg-[var(--color-background-secondary)]">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <circle cx="12" cy="8" r="4"/>
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
          </svg>
        </button>
        
        {isAuthenticated() ? (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[var(--color-text-secondary)]">
              {user?.name}
            </span>
            <button
              onClick={onLogout}
              className="px-[14px] py-[7px] rounded-[7px] border-[0.5px] border-[var(--color-border-secondary)] bg-transparent text-[var(--color-text-primary)] text-[12px] cursor-pointer font-[family-name:var(--font-plus-jakarta)] hover:bg-[var(--color-background-secondary)]"
            >
              Logout
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={onLoginClick}
              className="px-[14px] py-[7px] rounded-[7px] border-[0.5px] border-[var(--color-border-secondary)] bg-transparent text-[var(--color-text-primary)] text-[12px] cursor-pointer font-[family-name:var(--font-plus-jakarta)] hover:bg-[var(--color-background-secondary)]"
            >
              Log in
            </button>
            <button
              onClick={onRegisterClick}
              className="px-[14px] py-[7px] rounded-[7px] border-none bg-[#0B2545] text-white text-[12px] font-medium cursor-pointer font-[family-name:var(--font-plus-jakarta)] hover:bg-[#0d2d52]"
            >
              B2B Portal
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
