# Price Tracker

Price Tracker is a small inventory and cost management app for tracking products, purchase details, and calculated pricing values in one place. It is built with a Node.js/Express backend, SQLite for storage, and a React-based UI served directly from an HTML file.

The project is designed for teams that need to record product cost data, search existing entries quickly, import or export spreadsheets, and keep pricing calculations consistent across records.

## What the app does

- Add individual products with brand, product name, barcode, packing details, carton counts, cost price, shipping cost, custom duty, and purchase date.
- Automatically calculate derived values such as total amount, cost per piece, and packing style.
- Search products by brand, product name, or barcode.
- Edit and delete single records.
- Select multiple rows and delete them in bulk.
- Import products from Excel spreadsheets.
- Export the current product list back to Excel.
- Preload dropdown values for packing units and packing types.

## Why this project exists

This app helps standardize price tracking for products that are bought in cartons or packed units. Instead of keeping calculations in separate spreadsheets, the application stores the source values and computes the important totals for you.

It is especially useful when you need:

- A lightweight internal tracker for product purchasing data.
- A searchable record of products and pricing history.
- Spreadsheet import/export without losing the app’s data structure.
- Consistent calculations for total amount and cost per piece.

## Main features

### Product management

Products are stored in SQLite and can be created, updated, viewed, and deleted through the API and UI.

### Search and filtering

The app supports text search across brand name, product name, and barcode, making it easier to locate a product quickly.

### Excel import/export

The frontend can read `.xlsx` files, detect column mappings, and import multiple rows at once. It can also export the stored product list to Excel for reporting or backup.

### Bulk operations

Multiple products can be selected from the table and deleted together.

### Auto-calculated fields

The app calculates and stores:

- `packingStyle`
- `totalAmount`
- `costPerPiece`

These values are updated when products are created or edited.

### Dropdown seeding

The backend seeds common packing unit and packing type options on startup, so the UI has predictable dropdown values.

## Tech stack

- Backend: Node.js, Express
- Database: SQLite
- Frontend: React 18 via CDN, Babel in-browser, plain HTML/CSS
- File handling: XLSX library for spreadsheet import and export

## Project structure

- `server.js` - Express server, API routes, and static page delivery
- `database.js` - SQLite schema, product CRUD, dropdown seed data, and derived value calculations
- `react.html` - Single-file React UI for product entry, search, editing, import, and export

## Data model

Each product record includes fields such as:

- brand
- productName
- barcode
- packing
- weightUnit
- packingType
- pcsPerCtn
- noOfCtns
- costPriceCTN
- shippingCost
- customDuty
- totalAmount
- costPerPiece
- packingStyle
- datePurchased

## API overview

Base path: `/api`

- `GET /products` - Get all products, or search when `q` or `search` is provided.
- `GET /products/search` - Search products by query.
- `GET /products/:id` - Get a single product.
- `POST /products` - Add a product.
- `PUT /products/:id` - Update a product.
- `DELETE /products/:id` - Delete a product.
- `POST /import` - Bulk import an array of products.
- `GET /dropdowns/:category` - Load dropdown options for a category.
- `GET /health` - Simple server health check.

## How it works

1. The server starts and initializes the SQLite database.
2. Default dropdown options are inserted if they do not already exist.
3. The React UI loads the product list from the API.
4. When a product is added or edited, the backend normalizes the data and computes derived values.
5. The UI displays records in a searchable table and lets the user import or export Excel files.

## Setup

This repository currently contains the application source files only. To run it locally, you need a Node.js environment with the required dependencies installed:

- `express`
- `cors`
- `body-parser`
- `sqlite3`

If your project does not already have a `package.json`, create one and install the dependencies first.

### Example startup flow

1. Install dependencies.
2. Make sure Node is configured to support ES modules for `server.js`.
3. Run the server.
4. Open the app in your browser at the server address shown in the console.

## Notes

- The frontend is served from `react.html` and does not require a separate build step.
- Product data is stored in `price_tracker.db` in the project root.
- Excel import expects the user to map columns before import completes.

## Purpose in one sentence

This project is a lightweight price tracking system for storing product purchase data, calculating costs, and managing records through a searchable web interface.