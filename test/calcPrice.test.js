import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { calcPrice } from "../src/calcPrice.js";

test("calcPrice: sums items without discount and returns cents-accurate total", () => {
  const items = [
    { price: 12.5, quantity: 2 }, // 25.00
    { price: 8.99, quantity: 1 }, //  8.99
    { price: 3.3,  quantity: 3 }, //  9.90
  ];
  assert.equal(calcPrice(items, 0), 43.89);
});

test("calcPrice: applies percentage discount and rounds to cents", () => {
  const items = [
    { price: 12.5, quantity: 2 },
    { price: 8.99, quantity: 1 },
    { price: 3.3,  quantity: 3 },
  ];
  // 43.89 - 10% = 39.501 -> rounds up to 39.50 (banker-agnostic Math.round)
  assert.equal(calcPrice(items, 10), 39.5);
});

test("calcPrice: avoids floating-point drift (0.1 + 0.2 case)", () => {
  const items = [
    { price: 0.1, quantity: 1 },
    { price: 0.2, quantity: 1 },
  ];
  // Naive sum would be 0.30000000000000004; we must get exactly 0.3.
  assert.equal(calcPrice(items, 0), 0.3);
});

test("calcPrice: empty items list returns 0", () => {
  assert.equal(calcPrice([], 25), 0);
});

test("calcPrice: rejects invalid input", () => {
  assert.throws(() => calcPrice("nope", 0), TypeError);
  assert.throws(() => calcPrice([{ price: -1, quantity: 1 }], 0), RangeError);
  assert.throws(() => calcPrice([{ price: 1, quantity: 1.5 }], 0), RangeError);
  assert.throws(() => calcPrice([{ price: 1, quantity: 1 }], 150), RangeError);
  assert.throws(() => calcPrice([{ price: 1, quantity: 1 }], "10"), TypeError);
});

test("CLI: reads a JSON file and prints the correct total", () => {
  const dir = mkdtempSync(join(tmpdir(), "price-calc-"));
  const orderPath = join(dir, "order.json");
  writeFileSync(
    orderPath,
    JSON.stringify({
      items: [
        { price: 12.5, quantity: 2 },
        { price: 8.99, quantity: 1 },
        { price: 3.3,  quantity: 3 },
      ],
      discount: 10,
    })
  );

  try {
    const cliPath = new URL("../bin/cli.js", import.meta.url);
    const result = spawnSync(process.execPath, [cliPath.pathname.replace(/^\/([A-Za-z]:)/, "$1"), orderPath], {
      encoding: "utf8",
    });

    assert.equal(result.status, 0, `CLI exited with ${result.status}. stderr: ${result.stderr}`);
    assert.match(result.stdout, /Total:\s+39\.50/);
    assert.match(result.stdout, /Discount:\s+10%/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
