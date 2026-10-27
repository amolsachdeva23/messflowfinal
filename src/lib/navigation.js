import {
  BarChart3,
  ClipboardList,
  LayoutDashboard,
  Package,
  Settings,
  Users,
  UtensilsCrossed,
} from 'lucide-react';

export const NAV_ITEMS = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/queue', label: 'Live Queue', icon: Users },
  { to: '/planning', label: 'Food Planning', icon: ClipboardList },
  { to: '/menu', label: 'Menu & Timings', icon: UtensilsCrossed },
  { to: '/inventory', label: 'Inventory & Leftovers', icon: Package },
  { to: '/analytics', label: 'Analytics & Reports', icon: BarChart3 },
];

export const SECONDARY_NAV_ITEMS = [{ to: '/settings', label: 'Settings', icon: Settings }];

export function crumbForPath(pathname) {
  const all = [...NAV_ITEMS, ...SECONDARY_NAV_ITEMS];
  if (pathname.startsWith('/student')) {
    const sub = pathname.replace('/student', '').replace('/', '');
    const map = { '': 'Student home', menu: 'Menu', queue: 'Queue', notices: 'Notices' };
    return ['Student portal', map[sub] || 'Student home'];
  }
  const match = all.find((item) => (item.end ? pathname === item.to : pathname.startsWith(item.to)));
  return ['MessFlow', match ? match.label : 'Overview'];
}