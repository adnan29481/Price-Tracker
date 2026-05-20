import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./price_tracker.db');

function normalizeProductData(productData) {
  return {
    brand: productData.brand,
    productName: productData.productName ?? productData.name,
    barcode: productData.barcode ?? null,
    packing: productData.packing ?? null,
    weightUnit: productData.weightUnit ?? productData.weight_unit,
    packingType: productData.packingType ?? productData.packing_type,
    pcsPerCtn: productData.pcsPerCtn ?? productData.unitsPerCtn ?? productData.units_per_ctn,
    noOfCtns: productData.noOfCtns ?? productData.no_of_ctns,
    costPriceCTN: productData.costPriceCTN ?? productData.cost,
    shippingCost: productData.shippingCost ?? productData.shipping,
    customDuty: productData.customDuty ?? productData.duty,
    totalAmount: productData.totalAmount ?? productData.total_amount,
    costPerPiece: productData.costPerPiece ?? productData.cost_per_piece,
    packingStyle: productData.packingStyle ?? productData.packing_style,
    datePurchased: productData.datePurchased ?? productData.date_purchased ?? null
  };
}

// Function to compute derived values safely
function calculateDerivedValues(product) {
  const p = normalizeProductData(product);
  
  const packingStyle = `${p.packing || 0} ${p.weightUnit || ''} X ${p.pcsPerCtn || 0} ${p.packingType || ''}`.trim();
  const totalAmount = (Number(p.costPriceCTN) || 0) * (Number(p.noOfCtns) || 0);
  
  const pcs = Number(p.pcsPerCtn) || 0;
  const cost = Number(p.costPriceCTN) || 0;
  const shipping = Number(p.shippingCost) || 0;
  const duty = Number(p.customDuty) || 0;
  const costPerPiece = pcs > 0 ? (cost + shipping + duty) / pcs : 0;

  return { ...p, packingStyle, totalAmount, costPerPiece };
}

// Initialize database with tables
export async function initDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(`
        CREATE TABLE IF NOT EXISTS products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          brand TEXT,
          productName TEXT,
          barcode TEXT,
          packing REAL,
          weightUnit TEXT,
          packingType TEXT,
          pcsPerCtn REAL,
          noOfCtns REAL,
          costPriceCTN REAL,
          shippingCost REAL,
          customDuty REAL,
          totalAmount REAL,
          costPerPiece REAL,
          packingStyle TEXT,
          datePurchased TEXT
        )
      `, (err) => {
        if (err) {
          reject(err);
          return;
        }

        db.run(`
          CREATE TABLE IF NOT EXISTS dropdown_options (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT NOT NULL,
            label TEXT NOT NULL,
            value TEXT NOT NULL,
            UNIQUE(category, value)
          )
        `, (dropdownErr) => {
          if (dropdownErr) {
            reject(dropdownErr);
          } else {
            resolve();
          }
        });
      });
    });
  });
}

// Add Single Product Fix
export async function addProduct(productData) {
  const p = calculateDerivedValues(productData);

  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO products (
        brand, productName, barcode, packing, weightUnit, packingType, 
        pcsPerCtn, noOfCtns, costPriceCTN, shippingCost, customDuty, 
        totalAmount, costPerPiece, packingStyle, datePurchased
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        p.brand, p.productName, p.barcode, p.packing, p.weightUnit, p.packingType,
        p.pcsPerCtn, p.noOfCtns, p.costPriceCTN, p.shippingCost, p.customDuty,
        p.totalAmount, p.costPerPiece, p.packingStyle, p.datePurchased
      ],
      function (err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, ...p });
      }
    );
  });
}

// Get all products
export async function getAllProducts() {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM products ORDER BY id DESC', (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows || []);
      }
    });
  });
}

// Search products
export async function searchProducts(query) {
  return new Promise((resolve, reject) => {
    const searchTerm = `%${query}%`;
    const sql = `
      SELECT *
      FROM products
      WHERE brand LIKE ?
         OR productName LIKE ?
         OR barcode LIKE ?
      ORDER BY id DESC
    `;

    db.all(sql, [searchTerm, searchTerm, searchTerm], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows || []);
      }
    });
  });
}

// Get product by ID
export async function getProductById(id) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM products WHERE id = ?', [id], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

// Update product
export async function updateProduct(id, productData) {
  const {
    brand,
    productName,
    barcode,
    packing,
    weightUnit,
    packingType,
    pcsPerCtn,
    noOfCtns,
    costPriceCTN,
    shippingCost = 0,
    customDuty = 0,
    datePurchased
  } = normalizeProductData(productData);

  return new Promise((resolve, reject) => {
    const packingValue = Number(packing || 0);
    const pcsPerCtnValue = Math.max(1, Number(pcsPerCtn || 1)); // Prevent division by zero
    const noOfCtnsValue = Number(noOfCtns || 0);
    const costPriceValue = Number(costPriceCTN || 0);
    const shippingValue = Number(shippingCost || 0);
    const dutyValue = Number(customDuty || 0);
    
    // Calculations matching client Excel formulas exactly
    const computedTotalAmount = costPriceValue * noOfCtnsValue;
    const computedCostPerPiece = costPriceValue / pcsPerCtnValue;
    
    const packingStyleValue = `${packingValue} ${weightUnit || ''} X ${pcsPerCtnValue} ${packingType || ''}`.trim();

    const query = `
      UPDATE products
      SET brand = ?, productName = ?, barcode = ?, packing = ?, weightUnit = ?, packingType = ?,
          pcsPerCtn = ?, noOfCtns = ?, costPriceCTN = ?, shippingCost = ?, customDuty = ?,
          totalAmount = ?, costPerPiece = ?, packingStyle = ?, datePurchased = ?
      WHERE id = ?
    `;

    db.run(
      query,
      [brand, productName, barcode, packingValue, weightUnit, packingType, pcsPerCtnValue, noOfCtnsValue, costPriceValue, shippingValue, dutyValue, computedTotalAmount, computedCostPerPiece, packingStyleValue, datePurchased, id],
      (err) => {
        if (err) {
          reject(err);
        } else {
          resolve({ success: true });
        }
      }
    );
  });
}

// Delete product
export async function deleteProduct(id) {
  return new Promise((resolve, reject) => {
    db.run('DELETE FROM products WHERE id = ?', [id], (err) => {
      if (err) {
        reject(err);
      } else {
        resolve({ success: true });
      }
    });
  });
}

// Get dropdown options by category
export async function getDropdownOptions(category) {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT label, value FROM dropdown_options WHERE category = ? ORDER BY label',
      [category],
      (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      }
    );
  });
}

// Seed initial dropdown options matching client's exact Drop Down Sheet values
export async function seedDropdownOptions() {
  // Exact values from client's Excel Drop Down sheet
  const options = [
    ['Packing Unit', 'GMS', 'GMS'],
    ['Packing Unit', 'KG', 'KG'],
    ["Packing Unit", "LB'S", "LB'S"],
    ['Packing Unit', 'LTR', 'LTR'],
    ['Packing Unit', 'ML', 'ML'],
    ['Packing Type', 'CAN', 'CAN'],
    ['Packing Type', 'BTL', 'BTL'],
    ['Packing Type', 'PKT', 'PKT'],
    ['Packing Type', 'TIN', 'TIN'],
    ['Packing Type', 'JAR', 'JAR']
  ];

  for (const [category, label, value] of options) {
    await new Promise((resolve, reject) => {
      db.run(
        'INSERT OR IGNORE INTO dropdown_options (category, label, value) VALUES (?, ?, ?)',
        [category, label, value],
        (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }
}

// Bulk Insert Fix
export async function bulkInsertProducts(productsArray) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      
      const stmt = db.prepare(`
        INSERT INTO products (
          brand, productName, barcode, packing, weightUnit, packingType, 
          pcsPerCtn, noOfCtns, costPriceCTN, shippingCost, customDuty, 
          totalAmount, costPerPiece, packingStyle, datePurchased
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      try {
        let count = 0;
        for (const item of productsArray) {
          const p = calculateDerivedValues(item);
          stmt.run([
            p.brand, p.productName, p.barcode, p.packing, p.weightUnit, p.packingType,
            p.pcsPerCtn, p.noOfCtns, p.costPriceCTN, p.shippingCost, p.customDuty,
            p.totalAmount, p.costPerPiece, p.packingStyle, p.datePurchased
          ]);
          count++;
        }
        stmt.finalize();
        db.run('COMMIT', (err) => {
          if (err) reject(err);
          else resolve(count);
        });
      } catch (err) {
        db.run('ROLLBACK');
        reject(err);
      }
    });
  });
}

export default db;