import { getOrderStatusColor, getPaymentStatusColor } from '@/lib/utils';

interface BadgeProps {
  label: string;
  className?: string;
}

export function OrderStatusBadge({ label }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getOrderStatusColor(label)}`}>
      {label}
    </span>
  );
}

export function PaymentStatusBadge({ label }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getPaymentStatusColor(label)}`}>
      {label}
    </span>
  );
}

export function Badge({ label, className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}
