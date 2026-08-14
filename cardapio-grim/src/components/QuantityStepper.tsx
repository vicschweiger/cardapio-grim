import { Minus, Plus, Trash2 } from 'lucide-react';

interface QuantityStepperProps {
  quantity: number;
  itemName: string;
  onIncrement: () => void;
  onDecrement: () => void;
  disabled?: boolean;
  incrementDisabled?: boolean;
  accentColor?: string;
  compact?: boolean;
}

export function QuantityStepper({
  quantity,
  itemName,
  onIncrement,
  onDecrement,
  disabled = false,
  incrementDisabled = false,
  accentColor,
  compact = false,
}: QuantityStepperProps) {
  const buttonSize = compact ? 'h-9 w-9' : 'h-11 w-11';

  return (
    <div
      className="inline-flex items-center overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
      role="group"
      aria-label={`Quantidade de ${itemName}`}
    >
      <button
        type="button"
        onClick={onDecrement}
        disabled={disabled}
        className={`${buttonSize} flex shrink-0 items-center justify-center text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600 active:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40`}
        aria-label={quantity === 1 ? `Remover ${itemName}` : `Diminuir quantidade de ${itemName}`}
      >
        {quantity === 1 ? <Trash2 className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
      </button>
      <output
        className={`${compact ? 'min-w-9' : 'min-w-11'} select-none text-center text-sm font-extrabold text-gray-900`}
        aria-live="polite"
        aria-label={`${quantity} unidades`}
      >
        {quantity}
      </output>
      <button
        type="button"
        onClick={onIncrement}
        disabled={disabled || incrementDisabled}
        style={accentColor ? { color: accentColor } : undefined}
        className={`${buttonSize} flex shrink-0 items-center justify-center text-teal-700 transition-colors hover:bg-gray-50 active:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40`}
        aria-label={`Aumentar quantidade de ${itemName}`}
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
