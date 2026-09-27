/**
 * Calculate the total price of an order with an optional percentage discount.
 *
 * Each item must have a numeric `price` and `quantity`. The subtotal is the
 * sum of price * quantity for every item. The discount is applied as a
 * percentage of the subtotal, then the result is rounded to whole cents
 * (two decimal places) using banker-safe rounding at the cent level.
 *
 * @param {Array<{price: number, quantity: number, name?: string}>} items
 * @param {number} [discountPercent=0] - 0..100
 * @returns {number} Total price rounded to 2 decimals (cents).
 */
export function calcPrice(items, discountPercent = 0) {
  if (!Array.isArray(items)) {
    throw new TypeError("items must be an array");
  }

  if (typeof discountPercent !== "number" || Number.isNaN(discountPercent)) {
    throw new TypeError("discountPercent must be a number");
  }

  if (discountPercent < 0 || discountPercent > 100) {
    throw new RangeError("discountPercent must be between 0 and 100");
  }

  let subtotalCents = 0;

  for (let i = 0; i < items.length; i++) {
    const it = items[i];

    if (it == null || typeof it !== "object") {
      throw new TypeError(`items[${i}] must be an object`);
    }

    const { price, quantity } = it;

    if (typeof price !== "number" || Number.isNaN(price) || !Number.isFinite(price)) {
      throw new TypeError(`items[${i}].price must be a finite number`);
    }
    if (price < 0) {
      throw new RangeError(`items[${i}].price must be >= 0`);
    }

    if (typeof quantity !== "number" || Number.isNaN(quantity) || !Number.isFinite(quantity)) {
      throw new TypeError(`items[${i}].quantity must be a finite number`);
    }
    if (quantity < 0) {
      throw new RangeError(`items[${i}].quantity must be >= 0`);
    }
    if (!Number.isInteger(quantity)) {
      throw new RangeError(`items[${i}].quantity must be an integer`);
    }

    // Work in cents to avoid floating-point drift on the subtotal side.
    // price may itself have sub-cent noise (e.g. 0.1 + 0.2), so round each
    // line to the nearest cent before summing.
    const lineCents = Math.round(price * quantity * 100);
    subtotalCents += lineCents;
  }

  const discounted = (subtotalCents * (100 - discountPercent)) / 100;
  const totalCents = Math.round(discounted);

  return totalCents / 100;
}

export default calcPrice;
