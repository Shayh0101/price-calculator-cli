#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { calcPrice } from "../src/calcPrice.js";

const USAGE = `Usage: price-calc <items.json> [--discount <percent>]

Arguments:
  <items.json>        Path to a JSON file containing an array of items or
                      an object of the shape { "items": [...], "discount": N }.
                      Each item must have "price" (number) and "quantity" (integer).

Options:
  --discount <n>      Discount percentage (0..100). Overrides the value
                      found in the JSON file if both are provided.
  -h, --help          Show this help.

Example:
  price-calc ./examples/order.json --discount 10
`;

function parseArgs(argv) {
  const args = { file: null, discount: null, help: false };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "-h" || a === "--help") {
      args.help = true;
    } else if (a === "--discount") {
      const next = argv[i + 1];
      if (next === undefined) {
        throw new Error("--discount requires a value");
      }
      const n = Number(next);
      if (Number.isNaN(n)) {
        throw new Error(`--discount value is not a number: ${next}`);
      }
      args.discount = n;
      i++;
    } else if (a.startsWith("--")) {
      throw new Error(`Unknown option: ${a}`);
    } else if (args.file === null) {
      args.file = a;
    } else {
      throw new Error(`Unexpected argument: ${a}`);
    }
  }

  return args;
}

async function loadOrder(filePath) {
  const abs = resolve(process.cwd(), filePath);
  let raw;
  try {
    raw = await readFile(abs, "utf8");
  } catch (err) {
    if (err.code === "ENOENT") {
      throw new Error(`File not found: ${abs}`);
    }
    throw err;
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    throw new Error(`Invalid JSON in ${abs}: ${err.message}`);
  }

  if (Array.isArray(data)) {
    return { items: data, discount: 0 };
  }
  if (data && typeof data === "object" && Array.isArray(data.items)) {
    return { items: data.items, discount: Number(data.discount) || 0 };
  }
  throw new Error(
    `Unsupported JSON shape in ${abs}: expected an array or { items: [...] }`
  );
}

export async function main(argv = process.argv.slice(2)) {
  let args;
  try {
    args = parseArgs(argv);
  } catch (err) {
    process.stderr.write(`Error: ${err.message}\n\n${USAGE}`);
    process.exitCode = 2;
    return;
  }

  if (args.help || args.file === null) {
    process.stdout.write(USAGE);
    if (args.file === null && !args.help) {
      process.exitCode = 2;
    }
    return;
  }

  try {
    const order = await loadOrder(args.file);
    const discount = args.discount !== null ? args.discount : order.discount;
    const total = calcPrice(order.items, discount);
    process.stdout.write(
      `Items:     ${order.items.length}\n` +
      `Discount:  ${discount}%\n` +
      `Total:     ${total.toFixed(2)}\n`
    );
  } catch (err) {
    process.stderr.write(`Error: ${err.message}\n`);
    process.exitCode = 1;
  }
}

main();
