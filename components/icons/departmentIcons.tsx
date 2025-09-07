import React from 'react';
import { UserGroupIcon } from './UserGroupIcon';
import { CogIcon } from './CogIcon';
import { UserCircleIcon } from './UserCircleIcon';
import { SalesIcon } from './SalesIcon';
import { MarketingIcon } from './MarketingIcon';
import { SupportIcon } from './SupportIcon';
import { FinanceIcon } from './FinanceIcon';
import { ProductIcon } from './ProductIcon';

export const TEAM_ICON_LIST: string[] = [
  'sales', 'marketing', 'engineering', 'hr', 'support', 'finance', 'product', 'default'
];

const ICONS: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {
  sales: SalesIcon,
  marketing: MarketingIcon,
  engineering: CogIcon,
  hr: UserCircleIcon,
  support: SupportIcon,
  finance: FinanceIcon,
  product: ProductIcon,
  default: UserGroupIcon
};

export const TeamIcon: React.FC<{ iconName?: string; className?: string }> = ({ iconName, className }) => {
  const IconComponent = iconName && ICONS[iconName] ? ICONS[iconName] : ICONS['default'];
  return <IconComponent className={className} />;
};

export const getIconForTeamName = (name: string): string => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('sale')) return 'sales';
    if (lowerName.includes('market')) return 'marketing';
    if (lowerName.includes('engine') || lowerName.includes('develop')) return 'engineering';
    if (lowerName.includes('human') || lowerName.includes('hr')) return 'hr';
    if (lowerName.includes('support') || lowerName.includes('service')) return 'support';
    if (lowerName.includes('financ') || lowerName.includes('account')) return 'finance';
    if (lowerName.includes('product')) return 'product';
    return 'default';
};