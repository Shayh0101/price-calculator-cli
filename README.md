# Price Calculator

A tiny, zero-dependency Node.js library and CLI that calculates the total price
of an order with an optional percentage discount. All arithmetic is performed
in cents so the result is always rounded correctly and free of floating-point
drift.

## Requirements

- Node.js **18 or later** (uses the built-in `node:test` runner and ES modules).

## Installation

Clone the project and install locally — there are no runtime dependencies, so
`npm install` is only needed to register the `price-calc` bin.

```bash
git clone <this-repo>
cd price-calculator-cli
npm install    # optional; the project has no external dependencies
```

## Library usage

```js
import { calcPrice } from "./src/calcPrice.js";

const items = [
  { name: "Coffee beans 250g", price: 12.50, quantity: 2 },
  { name: "Ceramic mug",       price:  8.99, quantity: 1 },
  { name: "Chocolate bar",     price:  3.30, quantity: 3 },
];

calcPrice(items, 10); // -> 39.5 (i.e. 39.50 after a 10% discount)
```

### `calcPrice(items, discountPercent = 0)`

| Argument          | Type                                         | Notes                                    |
| ----------------- | -------------------------------------------- | ---------------------------------------- |
| `items`           | `Array<{ price: number, quantity: number }>` | Each item is a line in the order.        |
| `discountPercent` | `number` (0–100)                             | Percentage discount applied to subtotal. |

Returns a `number` rounded to two decimal places. Throws `TypeError` /
`RangeError` for malformed input (see `src/calcPrice.js`).

## CLI usage

```bash
node bin/cli.js <items.json> [--discount <percent>]
```

The input file can be either a plain array of items or an object of the shape
`{ "items": [...], "discount": N }`. See `examples/order.json`.

Examples:

```bash
node bin/cli.js examples/order.json
# Items:     3
# Discount:  10%
# Total:     39.50

node bin/cli.js examples/order.json --discount 0
# Items:     3
# Discount:  0%
# Total:     43.89
```

`--discount` on the command line always wins over the value baked into the JSON
file.

## Running the tests

```bash
npm test
```

This runs `node --test`, which discovers every `*.test.js` file under `test/`.
There are no external testing dependencies — everything is powered by the
built-in `node:test` module.

## Project layout

```
.
├── bin/
│   └── cli.js              # CLI entry point
├── src/
│   └── calcPrice.js        # Core calcPrice() function
├── test/
│   └── calcPrice.test.js   # Unit + CLI integration tests
├── examples/
│   └── order.json          # Example input file
├── package.json
└── README.md
```

## License

MIT.
