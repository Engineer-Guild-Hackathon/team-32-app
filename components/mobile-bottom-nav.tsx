'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plus, User, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  {
    name: 'タイムライン',
    href: '/sns',
    icon: Heart,
  },
  {
    name: '投稿',
    href: '/sns/create',
    icon: Plus,
  },
  {
    name: 'プロフィール',
    href: '/sns/profile',
    icon: User,
  },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-lg">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center px-3 py-2 rounded-lg transition-colors',
                isActive
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              )}
            >
              <Icon className={cn('w-5 h-5', isActive && 'text-blue-600')} />
              <span className={cn(
                'text-xs mt-1 font-medium',
                isActive ? 'text-blue-600' : 'text-gray-600'
              )}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
