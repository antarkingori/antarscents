'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { LayoutDashboard, Package, ShoppingCart, Users, DollarSign, Settings, LogOut, Bell, Tag } from 'lucide-react';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/categories', label: 'Categories', icon: Tag },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/admin/customers', label: 'Customers', icon: Users },
  { href: '/admin/finances', label: 'Finances', icon: DollarSign },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === '/admin/login';

  // All hooks must run unconditionally — conditional return comes after
  useEffect(() => {
    if (isLoginPage) return;
    if (!user) { router.push('/admin/login'); return; }
    if (user.role !== 'admin') { router.push('/admin/login'); }
  }, [user, router, isLoginPage]);

  // Login page renders standalone with no shell and no auth check
  if (isLoginPage) return <>{children}</>;

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-56 bg-[#0D0D0D] border-r border-[#1A1A1A] fixed h-full z-30">
        <div className="p-5 border-b border-[#1A1A1A]">
          <Link href="/" className="font-playfair text-lg font-bold gold-text tracking-widest">ANTAR SCENTS</Link>
          <p className="text-gray-500 text-xs mt-1">Admin Panel</p>
        </div>
        <nav className="flex-1 py-4 overflow-y-auto">
          {NAV.map(item => (
            <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-5 py-3 text-sm font-medium transition-colors ${pathname === item.href ? 'bg-gold/10 text-gold border-r-2 border-gold' : 'text-gray-400 hover:text-white hover:bg-[#1A1A1A]'}`}>
              <item.icon size={17} /> {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-[#1A1A1A]">
          <button onClick={() => { logout(); router.push('/admin/login'); }} className="flex items-center gap-3 text-gray-500 hover:text-red-400 text-sm w-full transition-colors">
            <LogOut size={17} /> Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 md:ml-56 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="h-14 bg-[#0D0D0D] border-b border-[#1A1A1A] flex items-center justify-between px-6 sticky top-0 z-20">
          <h1 className="text-sm font-medium text-gray-300 capitalize">{NAV.find(n => n.href === pathname)?.label || 'Admin'}</h1>
          <div className="flex items-center gap-3">
            <button className="p-1.5 hover:text-gold transition-colors relative"><Bell size={18} /></button>
            <div className="w-8 h-8 bg-gold/20 rounded-full flex items-center justify-center text-gold text-sm font-bold">{user.full_name?.[0] || 'A'}</div>
          </div>
        </header>

        {/* Mobile nav */}
        <div className="md:hidden bg-[#0D0D0D] border-b border-[#1A1A1A] overflow-x-auto">
          <div className="flex gap-1 px-4 py-2">
            {NAV.map(item => (
              <Link key={item.href} href={item.href} className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${pathname === item.href ? 'bg-gold/10 text-gold' : 'text-gray-400 hover:text-white'}`}>
                <item.icon size={14} /> {item.label}
              </Link>
            ))}
          </div>
        </div>

        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
