-- ============================================================================
-- InventarioZapas - Esquema para Supabase PostgreSQL
-- Ejecutar esto en el SQL Editor de Supabase
-- ============================================================================

-- 1. ENUMS
-- ============================================================================

CREATE TYPE "Role" AS ENUM ('ADMIN', 'EMPLOYEE');
CREATE TYPE "Category" AS ENUM ('RUNNING', 'CASUAL', 'BASKETBALL', 'FOOTBALL', 'SKATE', 'OTHER');
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PURCHASED', 'IN_TRANSIT', 'CUSTOMS', 'ARRIVED', 'READY_FOR_DELIVERY', 'DELIVERED', 'CANCELLED');
CREATE TYPE "PaymentType" AS ENUM ('ADVANCE', 'EXTRA', 'REMAINING', 'FULL');
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'TRANSFER', 'YAPE', 'PLIN', 'OTHER');
CREATE TYPE "AttachmentType" AS ENUM ('PHOTO', 'RECEIPT', 'OTHER');
CREATE TYPE "ExpenseCategory" AS ENUM ('SHIPPING', 'CUSTOMS', 'STORAGE', 'SUPPLIES', 'TRANSPORT', 'OTHER');

-- 2. TABLES
-- ============================================================================

-- Users
CREATE TABLE "users" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "password" TEXT NOT NULL,
  "role" "Role" NOT NULL DEFAULT 'EMPLOYEE',
  "image" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Clients
CREATE TABLE "clients" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "full_name" TEXT NOT NULL,
  "dni" TEXT,
  "phone" TEXT NOT NULL,
  "whatsapp" TEXT,
  "address" TEXT,
  "city" TEXT,
  "country" TEXT,
  "email" TEXT,
  "notes" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "clients_full_name_idx" ON "clients" ("full_name");
CREATE INDEX IF NOT EXISTS "clients_phone_idx" ON "clients" ("phone");
CREATE INDEX IF NOT EXISTS "clients_email_idx" ON "clients" ("email");

-- Suppliers
CREATE TABLE "suppliers" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name" TEXT NOT NULL,
  "contact" TEXT,
  "phone" TEXT,
  "email" TEXT,
  "country" TEXT,
  "notes" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "suppliers_name_idx" ON "suppliers" ("name");

-- Orders
CREATE TABLE "orders" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "order_number" SERIAL NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "client_id" TEXT NOT NULL,
  "client_name" TEXT NOT NULL,
  "client_phone" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "brand" TEXT NOT NULL,
  "category" "Category" NOT NULL DEFAULT 'OTHER',
  "color" TEXT,
  "size" TEXT,
  "import_country" TEXT NOT NULL,
  "supplier" TEXT NOT NULL,
  "supplier_id" TEXT,
  "import_cost" DECIMAL NOT NULL,
  "sale_price" DECIMAL NOT NULL,
  "advance_payment" DECIMAL NOT NULL DEFAULT 0,
  "extra_payment" DECIMAL NOT NULL DEFAULT 0,
  "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
  "order_date" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "estimated_arrival" TIMESTAMPTZ,
  "delivery_date" TIMESTAMPTZ,
  "notes" TEXT,
  "created_by" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "fk_order_client" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT,
  CONSTRAINT "fk_order_creator" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT,
  CONSTRAINT "fk_order_supplier" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS "orders_order_number_idx" ON "orders" ("order_number");
CREATE INDEX IF NOT EXISTS "orders_client_id_idx" ON "orders" ("client_id");
CREATE INDEX IF NOT EXISTS "orders_status_idx" ON "orders" ("status");
CREATE INDEX IF NOT EXISTS "orders_model_idx" ON "orders" ("model");
CREATE INDEX IF NOT EXISTS "orders_brand_idx" ON "orders" ("brand");
CREATE INDEX IF NOT EXISTS "orders_order_date_idx" ON "orders" ("order_date");

-- Payments
CREATE TABLE "payments" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "order_id" TEXT NOT NULL,
  "amount" DECIMAL NOT NULL,
  "type" "PaymentType" NOT NULL,
  "method" "PaymentMethod" NOT NULL,
  "reference" TEXT,
  "date" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "user_id" TEXT NOT NULL,
  "notes" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "fk_payment_order" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE,
  CONSTRAINT "fk_payment_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS "payments_order_id_idx" ON "payments" ("order_id");

-- Attachments
CREATE TABLE "attachments" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "order_id" TEXT NOT NULL,
  "type" "AttachmentType" NOT NULL,
  "filename" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "fk_attachment_order" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "attachments_order_id_idx" ON "attachments" ("order_id");

-- Order History
CREATE TABLE "order_history" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "order_id" TEXT NOT NULL,
  "status" "OrderStatus" NOT NULL,
  "note" TEXT,
  "user_id" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "fk_history_order" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE,
  CONSTRAINT "fk_history_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS "order_history_order_id_idx" ON "order_history" ("order_id");
CREATE INDEX IF NOT EXISTS "order_history_created_at_idx" ON "order_history" ("created_at");

-- Products
CREATE TABLE "products" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "model" TEXT NOT NULL,
  "brand" TEXT NOT NULL,
  "category" "Category" NOT NULL DEFAULT 'OTHER',
  "description" TEXT,
  "image_url" TEXT,
  "import_cost" DECIMAL,
  "sale_price" DECIMAL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "products_model_brand_idx" ON "products" ("model", "brand");

-- Product Variants
CREATE TABLE "product_variants" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "product_id" TEXT NOT NULL,
  "size" TEXT,
  "color" TEXT,
  "stock" INTEGER NOT NULL DEFAULT 0,
  "price" DECIMAL,

  CONSTRAINT "fk_variant_product" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "product_variants_product_id_idx" ON "product_variants" ("product_id");

-- Expenses
CREATE TABLE "expenses" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "description" TEXT NOT NULL,
  "amount" DECIMAL NOT NULL,
  "category" "ExpenseCategory" NOT NULL,
  "date" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "supplier_id" TEXT,
  "order_id" TEXT,
  "notes" TEXT,
  "created_by" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "fk_expense_supplier" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL,
  CONSTRAINT "fk_expense_order" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL,
  CONSTRAINT "fk_expense_creator" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS "expenses_date_idx" ON "expenses" ("date");

-- Activity Logs
CREATE TABLE "activity_logs" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "user_id" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "entity" TEXT NOT NULL,
  "entity_id" TEXT,
  "details" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT "fk_activity_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS "activity_logs_created_at_idx" ON "activity_logs" ("created_at");
CREATE INDEX IF NOT EXISTS "activity_logs_user_id_idx" ON "activity_logs" ("user_id");

-- 3. SEED DATA - Crear usuarios desde la app o con Prisma seed
-- Ejecutar despues: npx prisma db seed
-- O registrarse desde /register en la app
-- ============================================================================
-- NOTA: Los passwords se hashean con bcrypt, por lo que conviene
-- ejecutar el seed de Prisma en vez de insertar SQL directo:
--   npx prisma db seed
-- (asegurate antes de actualizar DATABASE_URL en .env)
