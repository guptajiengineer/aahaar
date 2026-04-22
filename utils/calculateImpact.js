/**
 * Estimate the number of meals from a donation's quantity.
 * A standard meal is approximately 0.35 kg of food.
 */
const MEALS_PER_KG = 2.85; // ~350g per meal
const CO2_PER_KG = 2.5;    // kg of CO2 saved per kg of food redistributed

/**
 * Calculate estimated meals from a listing.
 * @param {number} quantity
 * @param {string} unit - 'kg' | 'litres' | 'portions' | 'packets' | 'boxes' | 'items'
 * @returns {number} estimated number of meals
 */
const calculateMeals = (quantity, unit) => {
  switch (unit) {
    case 'kg':
    case 'litres':
      return Math.round(quantity * MEALS_PER_KG);
    case 'portions':
      return quantity;
    case 'packets':
      return quantity * 2; // Assume ~2 portions per packet
    case 'boxes':
      return quantity * 4; // Assume ~4 portions per box
    case 'items':
      return Math.ceil(quantity / 2);
    default:
      return quantity;
  }
};

/**
 * Calculate CO2 saved in kg from a food weight.
 * @param {number} weightKg
 * @returns {number}
 */
const calculateCO2Saved = (weightKg) => {
  return Math.round(weightKg * CO2_PER_KG * 10) / 10;
};

module.exports = { calculateMeals, calculateCO2Saved };
