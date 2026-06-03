export type DimensionType = 'WEIGHT' | 'VOLUME' | 'COUNT';
export type UnitType = 'g' | 'kg' | 'mL' | 'L' | 'items';

export const DIMENSION_UNITS: Record<DimensionType, UnitType[]> = {
  WEIGHT: ['g', 'kg'],
  VOLUME: ['mL', 'L'],
  COUNT: ['items'],
};

export const BASE_UNITS: Record<DimensionType, UnitType> = {
  WEIGHT: 'g',
  VOLUME: 'mL',
  COUNT: 'items',
};

/**
 * Converts a quantity from a given unit to its base unit.
 */
export function convertToBaseUnit(quantity: number, unit: UnitType): number {
  switch (unit) {
    case 'kg':
      return quantity * 1000;
    case 'L':
      return quantity * 1000;
    case 'g':
    case 'mL':
    case 'items':
    default:
      return quantity;
  }
}

/**
 * Converts a quantity from the base unit back to the preferred unit.
 */
export function convertFromBaseUnit(quantity: number, unit: UnitType): number {
  switch (unit) {
    case 'kg':
      return quantity / 1000;
    case 'L':
      return quantity / 1000;
    case 'g':
    case 'mL':
    case 'items':
    default:
      return quantity;
  }
}

/**
 * Calculates the price per base unit given the price and the unit.
 * E.g., if price is 5000 INR per kg, the price per base unit (gram) is 5000 / 1000 = 5 INR.
 */
export function calculatePricePerBaseUnit(price: number, unit: UnitType): number {
  switch (unit) {
    case 'kg':
    case 'L':
      return price / 1000;
    case 'g':
    case 'mL':
    case 'items':
    default:
      return price;
  }
}

/**
 * Calculates the price for a display unit given the price per base unit.
 * E.g., if price is 5 INR per gram, the price per kg is 5 * 1000 = 5000 INR.
 */
export function calculatePriceForDisplayUnit(pricePerBaseUnit: number, unit: UnitType): number {
  switch (unit) {
    case 'kg':
    case 'L':
      return pricePerBaseUnit * 1000;
    case 'g':
    case 'mL':
    case 'items':
    default:
      return pricePerBaseUnit;
  }
}

/**
 * Formats currency in INR format (e.g. ₹5,000.00)
 */
export function formatINR(amount: number | string): string {
  const value = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
