-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "agents" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "user_id" TEXT,
    "full_name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "document_type_id" TEXT,
    "document_number" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "agents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alert_configs" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "alert_30_days" BOOLEAN NOT NULL DEFAULT true,
    "alert_60_days" BOOLEAN NOT NULL DEFAULT true,
    "alert_90_days" BOOLEAN NOT NULL DEFAULT false,
    "alert_pending_payment" BOOLEAN NOT NULL DEFAULT true,
    "alert_overdue_payment" BOOLEAN NOT NULL DEFAULT true,
    "channel_in_app" BOOLEAN NOT NULL DEFAULT true,
    "channel_email" BOOLEAN NOT NULL DEFAULT false,
    "channel_whatsapp" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alert_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "url" TEXT,
    "active_count" INTEGER NOT NULL DEFAULT 0,
    "pending_count" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menus" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "parent_id" TEXT,
    "label" TEXT NOT NULL,
    "icon" TEXT,
    "path" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_applications" (
    "id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "can_read" BOOLEAN NOT NULL DEFAULT true,
    "can_write" BOOLEAN NOT NULL DEFAULT false,
    "can_delete" BOOLEAN NOT NULL DEFAULT false,
    "can_admin" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "role_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "arquitectura_calendar_events" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "project_id" TEXT,
    "event_type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3),
    "all_day" BOOLEAN NOT NULL DEFAULT false,
    "assigned_agent_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "arquitectura_calendar_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "arquitectura_project_stage_configs" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "arquitectura_project_stage_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "arquitectura_numbering_series" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "series_key" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "last_number" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "arquitectura_numbering_series_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "arquitectura_execution_tasks" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "phase" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "kanban_status" TEXT NOT NULL DEFAULT 'BACKLOG',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "planned_start" DATE,
    "planned_end" DATE,
    "progress_pct" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "arquitectura_execution_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "arquitectura_execution_evidences" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "task_id" TEXT,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "archivo_id" TEXT,
    "captured_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "arquitectura_execution_evidences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "arquitectura_execution_incidents" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "reported_at" TIMESTAMP(3) NOT NULL,
    "closed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "arquitectura_execution_incidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "arquitectura_execution_actual_costs" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "cost_category" TEXT NOT NULL,
    "concept" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "occurred_at" DATE NOT NULL,
    "catalog_material_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "arquitectura_execution_actual_costs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "arquitectura_finance_income_schedules" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "due_date" DATE NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "concept" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "arquitectura_finance_income_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "arquitectura_catalog_materials" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "price" DECIMAL(14,2) NOT NULL,
    "stock" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "technical_sheet_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "arquitectura_catalog_materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "arquitectura_catalog_material_images" (
    "id" TEXT NOT NULL,
    "material_id" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "url" TEXT NOT NULL,

    CONSTRAINT "arquitectura_catalog_material_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "arquitectura_material_suppliers" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "ruc" TEXT NOT NULL,
    "contact_name" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "arquitectura_material_suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "arquitectura_supplier_catalog_links" (
    "id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "catalog_material_id" TEXT NOT NULL,
    "supplier_sku" TEXT,
    "notes" TEXT,

    CONSTRAINT "arquitectura_supplier_catalog_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "arquitectura_material_purchases" (
    "id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "catalog_material_id" TEXT,
    "purchased_at" TIMESTAMP(3) NOT NULL,
    "quantity" DECIMAL(14,4) NOT NULL,
    "unit_price" DECIMAL(14,4) NOT NULL,
    "total_amount" DECIMAL(16,2) NOT NULL,
    "invoice_ref" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "arquitectura_material_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "arquitectura_project_sections" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "arquitectura_project_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "arquitectura_project_line_items" (
    "id" TEXT NOT NULL,
    "section_id" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT NOT NULL,
    "budgeted_cost" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "has_igv" BOOLEAN NOT NULL DEFAULT false,
    "actual_purchase_cost" DECIMAL(14,2),
    "supplier_name" TEXT,
    "supplier_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "arquitectura_project_line_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "arquitectura_line_item_supplier_payments" (
    "id" TEXT NOT NULL,
    "line_item_id" TEXT NOT NULL,
    "payment_number" INTEGER NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "paid_at" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "arquitectura_line_item_supplier_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "arquitectura_projects" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "project_type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "address_line" TEXT,
    "city" TEXT,
    "intervention_level" TEXT,
    "execution_time_note" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'PEN',
    "default_utility_pct" DECIMAL(8,2) NOT NULL DEFAULT 20,
    "default_igv_pct" DECIMAL(8,2) NOT NULL DEFAULT 18,
    "area_sqm" DECIMAL(12,2),
    "levels_count" INTEGER,
    "environments_note" TEXT,
    "start_date" DATE,
    "estimated_end_date" DATE,
    "designer_agent_id" TEXT,
    "architect_jr_agent_id" TEXT,
    "architect_agent_id" TEXT,
    "supervisor_agent_id" TEXT,
    "commercial_agent_id" TEXT,
    "estimated_budget" DECIMAL(14,2),
    "projected_cost" DECIMAL(14,2),
    "expected_margin" DECIMAL(8,2),
    "progress_pct" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "arquitectura_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "arquitectura_project_payments" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "paid_at" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "concept" TEXT NOT NULL,
    "payment_type" TEXT NOT NULL DEFAULT 'OTHER',
    "status" TEXT NOT NULL,
    "schedule_item_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "arquitectura_project_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "arquitectura_project_documents" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "doc_type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "file_url" TEXT,
    "archivo_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "arquitectura_project_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "arquitectura_project_milestones" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "planned_date" DATE NOT NULL,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "arquitectura_project_milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_codes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assigned_by" TEXT,
    "revoked_at" TIMESTAMP(3),
    "revoked_by" TEXT,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "data" JSONB,
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_types" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "length" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "property_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "currencies" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "currencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_financing_channels" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sale_financing_channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "client_type" TEXT NOT NULL,
    "document_type_id" TEXT NOT NULL,
    "document_number" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "legal_representative_name" TEXT,
    "legal_representative_position" TEXT,
    "primary_phone" TEXT NOT NULL,
    "secondary_phone" TEXT,
    "primary_email" TEXT,
    "secondary_email" TEXT,
    "notes" TEXT,
    "sales_status" TEXT,
    "lead_origin" TEXT,
    "assigned_agent_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" TEXT,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "addresses" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "address_type" TEXT NOT NULL,
    "address_line" TEXT NOT NULL,
    "district_id" TEXT NOT NULL,
    "location_custom" JSONB,
    "reference" TEXT,
    "is_primary" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contabilidad_accounts" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "parent_id" TEXT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "account_type" TEXT NOT NULL,
    "is_movement" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "has_movements" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contabilidad_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contabilidad_company_profiles" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "ruc" TEXT NOT NULL DEFAULT '',
    "legal_name" TEXT NOT NULL DEFAULT '',
    "trade_name" TEXT,
    "fiscal_address" TEXT NOT NULL DEFAULT '',
    "district" TEXT NOT NULL DEFAULT '',
    "province" TEXT NOT NULL DEFAULT '',
    "department" TEXT NOT NULL DEFAULT '',
    "ubigeo_code" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contabilidad_company_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contabilidad_app_settings" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "tax_regime" TEXT NOT NULL DEFAULT 'GENERAL',
    "is_detraction_agent" BOOLEAN NOT NULL DEFAULT false,
    "is_retention_agent" BOOLEAN NOT NULL DEFAULT false,
    "is_perception_agent" BOOLEAN NOT NULL DEFAULT false,
    "igv_percent" DECIMAL(5,2) NOT NULL DEFAULT 18,
    "currency_code" TEXT NOT NULL DEFAULT 'PEN',
    "fiscal_year_start_month" INTEGER NOT NULL DEFAULT 1,
    "amount_decimals" INTEGER NOT NULL DEFAULT 2,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contabilidad_app_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contabilidad_document_series" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "series_key" TEXT NOT NULL,
    "sunat_series" TEXT NOT NULL,
    "last_number" INTEGER NOT NULL DEFAULT 0,
    "pad_length" INTEGER NOT NULL DEFAULT 8,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contabilidad_document_series_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contabilidad_cpe_provider_configs" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "legal_entity_id" TEXT NOT NULL,
    "provider_code" TEXT NOT NULL DEFAULT 'MOCK',
    "api_base_url" TEXT,
    "api_token_hint" TEXT,
    "api_token_enc" TEXT,
    "certificate_hint" TEXT,
    "use_sandbox" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contabilidad_cpe_provider_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contabilidad_exchange_rates" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "rate_date" DATE NOT NULL,
    "currency_code" TEXT NOT NULL,
    "buy_rate" DECIMAL(12,6) NOT NULL,
    "sell_rate" DECIMAL(12,6) NOT NULL,
    "source" TEXT DEFAULT 'MANUAL',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contabilidad_exchange_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contabilidad_journal_templates" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contabilidad_journal_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contabilidad_journal_template_lines" (
    "id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "line_number" INTEGER NOT NULL,
    "account_id" TEXT NOT NULL,
    "default_debit" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "default_credit" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "cost_center_id" TEXT,
    "description" TEXT,

    CONSTRAINT "contabilidad_journal_template_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contabilidad_inventory_balance_snapshots" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "period_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "account_code" TEXT NOT NULL,
    "account_name" TEXT NOT NULL,
    "balance" DECIMAL(14,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contabilidad_inventory_balance_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contabilidad_electronic_document_logs" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "legal_entity_id" TEXT,
    "period_id" TEXT,
    "source_type" TEXT,
    "source_id" TEXT,
    "document_kind" TEXT NOT NULL,
    "document_ref" TEXT NOT NULL,
    "sunat_status" TEXT NOT NULL DEFAULT 'DRAFT',
    "sunat_response_code" TEXT,
    "sunat_response_message" TEXT,
    "xml_hash" TEXT,
    "xml_content" TEXT,
    "cdr_reference" TEXT,
    "cdr_content" TEXT,
    "notes" TEXT,
    "sent_at" TIMESTAMP(3),
    "accepted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contabilidad_electronic_document_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contabilidad_income_tax_period_summaries" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "period_id" TEXT NOT NULL,
    "deductible_adjustments" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "non_deductible_adjustments" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "other_income_adjustments" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "other_expense_adjustments" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "advance_payment_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contabilidad_income_tax_period_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contabilidad_ple_export_logs" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "period_id" TEXT NOT NULL,
    "user_id" TEXT,
    "book_codes" TEXT[],
    "file_count" INTEGER NOT NULL,
    "zip_hash" TEXT NOT NULL,
    "error_count" INTEGER NOT NULL DEFAULT 0,
    "warning_count" INTEGER NOT NULL DEFAULT 0,
    "issues_json" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SUCCESS',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contabilidad_ple_export_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contabilidad_inventory_items" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'UN',
    "cost_method" TEXT NOT NULL DEFAULT 'PROMEDIO',
    "quantity_on_hand" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "avg_unit_cost" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contabilidad_inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contabilidad_inventory_movements" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "period_id" TEXT NOT NULL,
    "movement_type" TEXT NOT NULL,
    "movement_date" DATE NOT NULL,
    "quantity" DECIMAL(14,4) NOT NULL,
    "unit_cost" DECIMAL(14,4) NOT NULL,
    "total_amount" DECIMAL(14,2) NOT NULL,
    "offset_type" TEXT,
    "remaining_qty" DECIMAL(14,4),
    "notes" TEXT,
    "journal_entry_id" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contabilidad_inventory_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contabilidad_journal_entries" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "legal_entity_id" TEXT NOT NULL,
    "period_id" TEXT NOT NULL,
    "entry_number" INTEGER NOT NULL,
    "entry_date" DATE NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "total_debit" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "total_credit" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "reversal_of_id" TEXT,
    "created_by" TEXT,
    "posted_by" TEXT,
    "posted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contabilidad_journal_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contabilidad_journal_entry_lines" (
    "id" TEXT NOT NULL,
    "journal_entry_id" TEXT NOT NULL,
    "line_number" INTEGER NOT NULL,
    "account_id" TEXT NOT NULL,
    "debit" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "credit" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "foreign_currency" TEXT,
    "foreign_amount" DECIMAL(14,2),
    "exchange_rate" DECIMAL(12,6),
    "cost_center_id" TEXT,
    "auxiliary_ruc" TEXT,
    "auxiliary_doc" TEXT,
    "description" TEXT,

    CONSTRAINT "contabilidad_journal_entry_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contabilidad_legal_entities" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "ruc" TEXT NOT NULL,
    "legal_name" TEXT NOT NULL,
    "trade_name" TEXT,
    "fiscal_address" TEXT NOT NULL DEFAULT '',
    "district" TEXT NOT NULL DEFAULT '',
    "province" TEXT NOT NULL DEFAULT '',
    "department" TEXT NOT NULL DEFAULT '',
    "ubigeo_code" TEXT NOT NULL DEFAULT '',
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contabilidad_legal_entities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contabilidad_audit_logs" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "legal_entity_id" TEXT,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "action" TEXT NOT NULL,
    "user_id" TEXT,
    "summary" TEXT,
    "payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contabilidad_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contabilidad_periods" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "legal_entity_id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contabilidad_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contabilidad_cost_centers" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "parent_id" TEXT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contabilidad_cost_centers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contabilidad_suppliers" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "ruc" TEXT NOT NULL,
    "business_name" TEXT NOT NULL,
    "country_code" TEXT NOT NULL DEFAULT 'PE',
    "is_non_domiciled" BOOLEAN NOT NULL DEFAULT false,
    "trade_name" TEXT,
    "address" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contabilidad_suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contabilidad_purchase_invoices" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "period_id" TEXT NOT NULL,
    "document_type" TEXT NOT NULL,
    "series" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "issue_date" DATE NOT NULL,
    "due_date" DATE,
    "tax_affectation" TEXT NOT NULL,
    "currency_code" TEXT NOT NULL DEFAULT 'PEN',
    "exchange_rate" DECIMAL(12,6),
    "foreign_taxable_base" DECIMAL(14,2),
    "expense_account_id" TEXT NOT NULL,
    "taxable_base" DECIMAL(14,2) NOT NULL,
    "igv_amount" DECIMAL(14,2) NOT NULL,
    "total_amount" DECIMAL(14,2) NOT NULL,
    "detraccion_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "paid_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "journal_entry_id" TEXT,
    "cancelled_at" TIMESTAMP(3),
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contabilidad_purchase_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contabilidad_purchase_credit_notes" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "invoice_id" TEXT,
    "period_id" TEXT NOT NULL,
    "series" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "issue_date" DATE NOT NULL,
    "taxable_base" DECIMAL(14,2) NOT NULL,
    "igv_amount" DECIMAL(14,2) NOT NULL,
    "total_amount" DECIMAL(14,2) NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "journal_entry_id" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contabilidad_purchase_credit_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contabilidad_purchase_debit_notes" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "invoice_id" TEXT,
    "period_id" TEXT NOT NULL,
    "series" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "issue_date" DATE NOT NULL,
    "taxable_base" DECIMAL(14,2) NOT NULL,
    "igv_amount" DECIMAL(14,2) NOT NULL,
    "total_amount" DECIMAL(14,2) NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "journal_entry_id" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contabilidad_purchase_debit_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contabilidad_purchase_payments" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "period_id" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "payment_date" DATE NOT NULL,
    "description" TEXT NOT NULL,
    "source_type" TEXT NOT NULL,
    "cash_box_id" TEXT,
    "bank_account_id" TEXT,
    "treasury_movement_id" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contabilidad_purchase_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contabilidad_customers" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "ruc" TEXT NOT NULL,
    "business_name" TEXT NOT NULL,
    "trade_name" TEXT,
    "address" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contabilidad_customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contabilidad_sales_invoices" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "period_id" TEXT NOT NULL,
    "document_type" TEXT NOT NULL,
    "series" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "issue_date" DATE NOT NULL,
    "due_date" DATE,
    "tax_affectation" TEXT NOT NULL,
    "currency_code" TEXT NOT NULL DEFAULT 'PEN',
    "exchange_rate" DECIMAL(12,6),
    "foreign_taxable_base" DECIMAL(14,2),
    "income_account_id" TEXT NOT NULL,
    "taxable_base" DECIMAL(14,2) NOT NULL,
    "igv_amount" DECIMAL(14,2) NOT NULL,
    "total_amount" DECIMAL(14,2) NOT NULL,
    "collected_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "electronic_status" TEXT NOT NULL DEFAULT 'NONE',
    "electronic_log_id" TEXT,
    "notes" TEXT,
    "journal_entry_id" TEXT,
    "cancelled_at" TIMESTAMP(3),
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contabilidad_sales_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contabilidad_sales_credit_notes" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "invoice_id" TEXT,
    "period_id" TEXT NOT NULL,
    "series" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "issue_date" DATE NOT NULL,
    "taxable_base" DECIMAL(14,2) NOT NULL,
    "igv_amount" DECIMAL(14,2) NOT NULL,
    "total_amount" DECIMAL(14,2) NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "journal_entry_id" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contabilidad_sales_credit_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contabilidad_sales_debit_notes" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "invoice_id" TEXT,
    "period_id" TEXT NOT NULL,
    "series" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "issue_date" DATE NOT NULL,
    "taxable_base" DECIMAL(14,2) NOT NULL,
    "igv_amount" DECIMAL(14,2) NOT NULL,
    "total_amount" DECIMAL(14,2) NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "journal_entry_id" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contabilidad_sales_debit_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contabilidad_sales_collections" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "period_id" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "collection_date" DATE NOT NULL,
    "description" TEXT NOT NULL,
    "source_type" TEXT NOT NULL,
    "cash_box_id" TEXT,
    "bank_account_id" TEXT,
    "treasury_movement_id" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contabilidad_sales_collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contabilidad_sol_credentials" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "legal_entity_id" TEXT NOT NULL,
    "sol_user" TEXT NOT NULL,
    "sol_password_hint" TEXT,
    "sol_password_enc" TEXT,
    "use_sandbox" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contabilidad_sol_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contabilidad_sunat_declaration_logs" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "legal_entity_id" TEXT NOT NULL,
    "period_id" TEXT NOT NULL,
    "declaration_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PREPARED',
    "sunat_response_code" TEXT,
    "sunat_response_message" TEXT,
    "package_hash" TEXT,
    "package_json" TEXT,
    "submitted_at" TIMESTAMP(3),
    "accepted_at" TIMESTAMP(3),
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contabilidad_sunat_declaration_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contabilidad_detraccion_rates" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "sunat_code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "rate_percent" DECIMAL(5,2) NOT NULL,
    "min_amount" DECIMAL(14,2) NOT NULL DEFAULT 700,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contabilidad_detraccion_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contabilidad_detracciones" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "period_id" TEXT NOT NULL,
    "purchase_invoice_id" TEXT,
    "rate_id" TEXT,
    "supplier_ruc" TEXT NOT NULL,
    "supplier_name" TEXT NOT NULL,
    "certificate_number" TEXT NOT NULL,
    "operation_date" DATE NOT NULL,
    "base_amount" DECIMAL(14,2) NOT NULL,
    "rate_percent" DECIMAL(5,2) NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paid_at" TIMESTAMP(3),
    "treasury_movement_id" TEXT,
    "journal_entry_id" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contabilidad_detracciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contabilidad_retentions" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "period_id" TEXT NOT NULL,
    "retention_type" TEXT NOT NULL,
    "counterparty_ruc" TEXT NOT NULL,
    "counterparty_name" TEXT NOT NULL,
    "document_type" TEXT,
    "document_series" TEXT,
    "document_number" TEXT,
    "issue_date" DATE NOT NULL,
    "taxable_base" DECIMAL(14,2) NOT NULL,
    "rate_percent" DECIMAL(5,2) NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "purchase_invoice_id" TEXT,
    "journal_entry_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contabilidad_retentions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contabilidad_perceptions" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "period_id" TEXT NOT NULL,
    "perception_type" TEXT NOT NULL,
    "customer_ruc" TEXT NOT NULL,
    "customer_name" TEXT NOT NULL,
    "sales_invoice_id" TEXT,
    "issue_date" DATE NOT NULL,
    "taxable_base" DECIMAL(14,2) NOT NULL,
    "rate_percent" DECIMAL(5,2) NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "treasury_movement_id" TEXT,
    "journal_entry_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contabilidad_perceptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contabilidad_cash_boxes" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contabilidad_cash_boxes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contabilidad_bank_accounts" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "bank_name" TEXT NOT NULL,
    "account_number" TEXT NOT NULL,
    "cci" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'PEN',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contabilidad_bank_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contabilidad_treasury_movements" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "period_id" TEXT NOT NULL,
    "movement_type" TEXT NOT NULL,
    "source_type" TEXT NOT NULL,
    "cash_box_id" TEXT,
    "bank_account_id" TEXT,
    "offset_account_id" TEXT,
    "transfer_group_id" TEXT,
    "currency_code" TEXT NOT NULL DEFAULT 'PEN',
    "foreign_amount" DECIMAL(14,2),
    "exchange_rate" DECIMAL(12,6),
    "amount" DECIMAL(14,2) NOT NULL,
    "movement_date" DATE NOT NULL,
    "description" TEXT NOT NULL,
    "journal_entry_id" TEXT,
    "reconciliation_id" TEXT,
    "reconciled_at" TIMESTAMP(3),
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contabilidad_treasury_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contabilidad_bank_reconciliations" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "bank_account_id" TEXT NOT NULL,
    "period_id" TEXT NOT NULL,
    "statement_balance" DECIMAL(14,2) NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "closed_at" TIMESTAMP(3),

    CONSTRAINT "contabilidad_bank_reconciliations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gen_archivos" (
    "id" TEXT NOT NULL,
    "application_id" TEXT,
    "application_slug" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "category" TEXT,
    "bucket" TEXT NOT NULL,
    "object_key" TEXT NOT NULL,
    "original_file_name" TEXT NOT NULL,
    "mime_type" TEXT,
    "size_bytes" INTEGER,
    "legacy_file_path" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "gen_archivos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provinces" (
    "id" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "provinces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "districts" (
    "id" TEXT NOT NULL,
    "province_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "districts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interior_calendar_events" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "project_id" TEXT,
    "event_type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3),
    "all_day" BOOLEAN NOT NULL DEFAULT false,
    "assigned_agent_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interior_calendar_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interiorismo_project_stage_configs" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interiorismo_project_stage_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interiorismo_numbering_series" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "series_key" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "last_number" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interiorismo_numbering_series_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interior_execution_tasks" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "phase" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "kanban_status" TEXT NOT NULL DEFAULT 'BACKLOG',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "planned_start" DATE,
    "planned_end" DATE,
    "progress_pct" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interior_execution_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interior_execution_evidences" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "task_id" TEXT,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "archivo_id" TEXT,
    "captured_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interior_execution_evidences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interior_execution_incidents" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "reported_at" TIMESTAMP(3) NOT NULL,
    "closed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interior_execution_incidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interior_execution_actual_costs" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "cost_category" TEXT NOT NULL,
    "concept" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "occurred_at" DATE NOT NULL,
    "catalog_material_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interior_execution_actual_costs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interior_finance_income_schedules" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "due_date" DATE NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "concept" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interior_finance_income_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interior_catalog_materials" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "price" DECIMAL(14,2) NOT NULL,
    "stock" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "technical_sheet_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interior_catalog_materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interior_catalog_material_images" (
    "id" TEXT NOT NULL,
    "material_id" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "url" TEXT NOT NULL,

    CONSTRAINT "interior_catalog_material_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interior_material_suppliers" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "ruc" TEXT NOT NULL,
    "contact_name" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interior_material_suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interior_supplier_catalog_links" (
    "id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "catalog_material_id" TEXT NOT NULL,
    "supplier_sku" TEXT,
    "notes" TEXT,

    CONSTRAINT "interior_supplier_catalog_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interior_material_purchases" (
    "id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "catalog_material_id" TEXT,
    "purchased_at" TIMESTAMP(3) NOT NULL,
    "quantity" DECIMAL(14,4) NOT NULL,
    "unit_price" DECIMAL(14,4) NOT NULL,
    "total_amount" DECIMAL(16,2) NOT NULL,
    "invoice_ref" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interior_material_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interior_project_sections" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interior_project_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interior_project_line_items" (
    "id" TEXT NOT NULL,
    "section_id" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT NOT NULL,
    "budgeted_cost" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "has_igv" BOOLEAN NOT NULL DEFAULT false,
    "actual_purchase_cost" DECIMAL(14,2),
    "supplier_name" TEXT,
    "supplier_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interior_project_line_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interior_line_item_supplier_payments" (
    "id" TEXT NOT NULL,
    "line_item_id" TEXT NOT NULL,
    "payment_number" INTEGER NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "paid_at" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interior_line_item_supplier_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interior_projects" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "project_type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "address_line" TEXT,
    "city" TEXT,
    "intervention_level" TEXT,
    "execution_time_note" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'PEN',
    "default_utility_pct" DECIMAL(8,2) NOT NULL DEFAULT 20,
    "default_igv_pct" DECIMAL(8,2) NOT NULL DEFAULT 18,
    "area_sqm" DECIMAL(12,2),
    "levels_count" INTEGER,
    "environments_note" TEXT,
    "start_date" DATE,
    "estimated_end_date" DATE,
    "designer_agent_id" TEXT,
    "architect_jr_agent_id" TEXT,
    "architect_agent_id" TEXT,
    "supervisor_agent_id" TEXT,
    "commercial_agent_id" TEXT,
    "estimated_budget" DECIMAL(14,2),
    "projected_cost" DECIMAL(14,2),
    "expected_margin" DECIMAL(8,2),
    "progress_pct" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "interior_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interior_project_materials" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" DECIMAL(12,3),
    "unit" TEXT,
    "estimated_cost" DECIMAL(14,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interior_project_materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interior_project_documents" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "doc_type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "file_url" TEXT,
    "archivo_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interior_project_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interior_project_payments" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "paid_at" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "concept" TEXT NOT NULL,
    "payment_type" TEXT NOT NULL DEFAULT 'OTHER',
    "status" TEXT NOT NULL,
    "schedule_item_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interior_project_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interior_project_activities" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "activity_type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interior_project_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interior_project_milestones" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "planned_date" DATE NOT NULL,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interior_project_milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produccion_app_settings" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "igv_percent" DECIMAL(5,2) NOT NULL DEFAULT 18,
    "wood_waste_percent" DECIMAL(5,2) NOT NULL DEFAULT 10,
    "quotation_valid_days" INTEGER NOT NULL DEFAULT 30,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "produccion_app_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produccion_furniture_category_configs" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "produccion_furniture_category_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produccion_material_category_configs" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "produccion_material_category_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produccion_production_stage_configs" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "stage_key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "produccion_production_stage_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produccion_unit_configs" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "produccion_unit_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produccion_numbering_series" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "series_key" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "last_number" INTEGER NOT NULL DEFAULT 0,
    "pad_length" INTEGER NOT NULL DEFAULT 4,
    "include_year" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "produccion_numbering_series_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produccion_labor_rates" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "hourly_rate" DECIMAL(14,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "produccion_labor_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produccion_extra_cost_catalog" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "default_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "produccion_extra_cost_catalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produccion_furniture_labor_entries" (
    "id" TEXT NOT NULL,
    "furniture_id" TEXT NOT NULL,
    "labor_rate_id" TEXT,
    "description" TEXT NOT NULL,
    "hours" DECIMAL(10,2) NOT NULL,
    "hourly_rate" DECIMAL(14,2) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "produccion_furniture_labor_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produccion_furniture_extra_expenses" (
    "id" TEXT NOT NULL,
    "furniture_id" TEXT NOT NULL,
    "catalog_item_id" TEXT,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "produccion_furniture_extra_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produccion_furniture_cost_snapshots" (
    "id" TEXT NOT NULL,
    "furniture_id" TEXT NOT NULL,
    "label" TEXT,
    "materials_total" DECIMAL(14,2) NOT NULL,
    "labor_total" DECIMAL(14,2) NOT NULL,
    "extras_total" DECIMAL(14,2) NOT NULL,
    "total_cost" DECIMAL(14,2) NOT NULL,
    "reference_price" DECIMAL(14,2) NOT NULL,
    "margin_percent" DECIMAL(8,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "produccion_furniture_cost_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produccion_furniture" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "width_cm" DOUBLE PRECISION,
    "depth_cm" DOUBLE PRECISION,
    "height_cm" DOUBLE PRECISION,
    "reference_price" DECIMAL(14,2) NOT NULL,
    "technical_sheet_url" TEXT,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "produccion_furniture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produccion_furniture_images" (
    "id" TEXT NOT NULL,
    "furniture_id" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "url" TEXT NOT NULL,

    CONSTRAINT "produccion_furniture_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produccion_furniture_bom_lines" (
    "id" TEXT NOT NULL,
    "furniture_id" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "material_name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "quantity" DECIMAL(14,4) NOT NULL,
    "unit_cost" DECIMAL(14,4),
    "notes" TEXT,

    CONSTRAINT "produccion_furniture_bom_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produccion_materials" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "unit_cost" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "min_stock_qty" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "current_stock" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "produccion_materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produccion_stock_movements" (
    "id" TEXT NOT NULL,
    "material_id" TEXT NOT NULL,
    "movement_type" TEXT NOT NULL,
    "quantity" DECIMAL(14,4) NOT NULL,
    "balance_after" DECIMAL(14,4) NOT NULL,
    "unit_cost" DECIMAL(14,4),
    "reference" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "produccion_stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produccion_suppliers" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "ruc" TEXT NOT NULL,
    "contact_name" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "produccion_suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produccion_supplier_material_links" (
    "id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "material_id" TEXT NOT NULL,
    "supplier_sku" TEXT,
    "notes" TEXT,

    CONSTRAINT "produccion_supplier_material_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produccion_purchase_orders" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "ordered_at" TIMESTAMP(3) NOT NULL,
    "expected_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "produccion_purchase_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produccion_purchase_order_lines" (
    "id" TEXT NOT NULL,
    "purchase_order_id" TEXT NOT NULL,
    "material_id" TEXT NOT NULL,
    "quantity_ordered" DECIMAL(14,4) NOT NULL,
    "quantity_received" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "unit_price" DECIMAL(14,4) NOT NULL,

    CONSTRAINT "produccion_purchase_order_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produccion_quotations" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "valid_until" TIMESTAMP(3),
    "sent_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "produccion_quotations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produccion_quotation_lines" (
    "id" TEXT NOT NULL,
    "quotation_id" TEXT NOT NULL,
    "furniture_id" TEXT NOT NULL,
    "quantity" DECIMAL(14,4) NOT NULL,
    "unit_price" DECIMAL(14,2) NOT NULL,
    "notes" TEXT,

    CONSTRAINT "produccion_quotation_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produccion_orders" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "quotation_id" TEXT,
    "work_order_id" TEXT,
    "code" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "ordered_at" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "produccion_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produccion_order_lines" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "furniture_id" TEXT NOT NULL,
    "quantity" DECIMAL(14,4) NOT NULL,
    "unit_price" DECIMAL(14,2) NOT NULL,
    "notes" TEXT,

    CONSTRAINT "produccion_order_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produccion_deliveries" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "scheduled_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "address" TEXT,
    "recipient_name" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "produccion_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produccion_work_orders" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "client_id" TEXT,
    "status" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "current_stage_key" TEXT,
    "progress_percent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "assigned_to" TEXT,
    "scheduled_start" TIMESTAMP(3),
    "scheduled_end" TIMESTAMP(3),
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "produccion_work_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produccion_work_order_lines" (
    "id" TEXT NOT NULL,
    "work_order_id" TEXT NOT NULL,
    "furniture_id" TEXT NOT NULL,
    "quantity" DECIMAL(14,4) NOT NULL DEFAULT 1,
    "notes" TEXT,

    CONSTRAINT "produccion_work_order_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produccion_work_order_stages" (
    "id" TEXT NOT NULL,
    "work_order_id" TEXT NOT NULL,
    "stage_key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "assignee" TEXT,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "produccion_work_order_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produccion_work_order_material_consumptions" (
    "id" TEXT NOT NULL,
    "work_order_id" TEXT NOT NULL,
    "material_id" TEXT NOT NULL,
    "quantity" DECIMAL(14,4) NOT NULL,
    "notes" TEXT,
    "consumed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "produccion_work_order_material_consumptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "properties" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "property_type_id" TEXT NOT NULL,
    "address_line" TEXT NOT NULL,
    "district_id" TEXT NOT NULL,
    "location_custom" JSONB,
    "description" TEXT,
    "area" DOUBLE PRECISION,
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "age_years" INTEGER,
    "floor_level" TEXT,
    "parking_spaces" INTEGER,
    "partida_1" TEXT,
    "partida_2" TEXT,
    "partida_3" TEXT,
    "owner_id" TEXT NOT NULL,
    "monthly_rent" DOUBLE PRECISION,
    "maintenance_amount" DOUBLE PRECISION,
    "deposit_months" INTEGER,
    "sale_price" DOUBLE PRECISION,
    "sale_currency" TEXT NOT NULL DEFAULT 'PEN',
    "project_name" TEXT,
    "media_items" JSONB,
    "listing_status" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" TEXT,

    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "property_owners" (
    "id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "owner_client_id" TEXT NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "property_owners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rentals" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'PEN',
    "monthly_amount" DOUBLE PRECISION NOT NULL,
    "security_deposit" DOUBLE PRECISION,
    "payment_due_day" INTEGER NOT NULL DEFAULT 5,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "enable_expiration_alerts" BOOLEAN NOT NULL DEFAULT true,
    "enable_collection_alerts" BOOLEAN NOT NULL DEFAULT true,
    "last_communication_note" TEXT,
    "last_communication_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,
    "deleted_at" TIMESTAMP(3),
    "deleted_by" TEXT,

    CONSTRAINT "rentals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rental_financial_configs" (
    "id" TEXT NOT NULL,
    "rental_id" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'PEN',
    "base_amount" DOUBLE PRECISION,
    "expense_type" TEXT NOT NULL DEFAULT 'FIXED',
    "expense_value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "expense_detail" TEXT,
    "tax_type" TEXT NOT NULL DEFAULT 'FIXED',
    "tax_value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tax_detail" TEXT,
    "external_agent_id" TEXT,
    "external_agent_type" TEXT NOT NULL DEFAULT 'FIXED',
    "external_agent_value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "external_agent_name" TEXT,
    "internal_agent_id" TEXT,
    "internal_agent_type" TEXT NOT NULL DEFAULT 'FIXED',
    "internal_agent_value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "internal_agent_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rental_financial_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "rental_id" TEXT NOT NULL,
    "period_year" INTEGER NOT NULL,
    "period_month" INTEGER NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'PEN',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paid_date" TIMESTAMP(3),
    "paid_amount" DOUBLE PRECISION,
    "payment_method" TEXT,
    "reference_number" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rental_tenants" (
    "id" TEXT NOT NULL,
    "rental_id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "rental_tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rental_attachments" (
    "id" TEXT NOT NULL,
    "rental_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "archivo_id" TEXT,
    "file_path" TEXT NOT NULL,
    "original_file_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rental_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_compliance_checklists" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "buyer_client_id" TEXT NOT NULL,
    "title_study_checked" BOOLEAN NOT NULL DEFAULT false,
    "cri_checked" BOOLEAN NOT NULL DEFAULT false,
    "no_liens_checked" BOOLEAN NOT NULL DEFAULT false,
    "municipal_tax_clearance_checked" BOOLEAN NOT NULL DEFAULT false,
    "minuta_signed" BOOLEAN NOT NULL DEFAULT false,
    "public_deed_signed" BOOLEAN NOT NULL DEFAULT false,
    "notarial_part_submitted" BOOLEAN NOT NULL DEFAULT false,
    "sunarp_status" TEXT NOT NULL DEFAULT 'PENDING',
    "sunarp_submitted_at" TIMESTAMP(3),
    "sunarp_observed_at" TIMESTAMP(3),
    "sunarp_registered_at" TIMESTAMP(3),
    "sunarp_observation_notes" TEXT,
    "alcabala_applicable" BOOLEAN NOT NULL DEFAULT true,
    "alcabala_amount" DOUBLE PRECISION,
    "alcabala_paid_at" TIMESTAMP(3),
    "rent2_applicable" BOOLEAN NOT NULL DEFAULT false,
    "rent2_amount" DOUBLE PRECISION,
    "rent2_paid_at" TIMESTAMP(3),
    "banked_payment_required" BOOLEAN NOT NULL DEFAULT true,
    "banked_payment_verified" BOOLEAN NOT NULL DEFAULT false,
    "payment_method" TEXT,
    "bank_operation_number" TEXT,
    "bank_name" TEXT,
    "bank_account_holder" TEXT,
    "payment_evidence_path" TEXT,
    "payment_evidence_archivo_id" TEXT,
    "funds_source_declared" BOOLEAN NOT NULL DEFAULT false,
    "beneficial_owner_declared" BOOLEAN NOT NULL DEFAULT false,
    "kyc_risk_level" TEXT NOT NULL DEFAULT 'PENDING',
    "compliance_notes" TEXT,
    "next_action_at" TIMESTAMP(3),
    "last_alert_sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sale_compliance_checklists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_compliance_documents" (
    "id" TEXT NOT NULL,
    "checklist_id" TEXT NOT NULL,
    "doc_type" TEXT NOT NULL,
    "archivo_id" TEXT,
    "file_path" TEXT NOT NULL,
    "issued_at" TIMESTAMP(3),
    "verified_at" TIMESTAMP(3),
    "verified_by" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sale_compliance_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ventas_pipeline_stage_configs" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ventas_pipeline_stage_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ventas_numbering_series" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "series_key" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "last_number" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ventas_numbering_series_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_processes" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "buyer_client_id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "agent_id" TEXT,
    "pipeline_stage" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "lost_reason" TEXT,
    "title" TEXT,
    "financing_channel_id" TEXT,
    "closed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "sale_processes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_process_buyers" (
    "id" TEXT NOT NULL,
    "sale_process_id" TEXT NOT NULL,
    "buyer_client_id" TEXT NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sale_process_buyers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_process_owners" (
    "id" TEXT NOT NULL,
    "sale_process_id" TEXT NOT NULL,
    "owner_client_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sale_process_owners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_process_notes" (
    "id" TEXT NOT NULL,
    "sale_process_id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sale_process_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_process_activities" (
    "id" TEXT NOT NULL,
    "sale_process_id" TEXT NOT NULL,
    "activity_type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "scheduled_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sale_process_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_process_reminders" (
    "id" TEXT NOT NULL,
    "sale_process_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "due_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sale_process_reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_separations" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "sale_process_id" TEXT,
    "property_id" TEXT NOT NULL,
    "buyer_client_id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'PEN',
    "separation_date" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "receipt_file_path" TEXT,
    "receipt_archivo_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sale_separations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_closings" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "sale_process_id" TEXT,
    "sale_separation_id" TEXT,
    "property_id" TEXT NOT NULL,
    "buyer_client_id" TEXT NOT NULL,
    "agent_id" TEXT,
    "final_price" DOUBLE PRECISION NOT NULL,
    "payment_type" TEXT NOT NULL,
    "contract_file_path" TEXT,
    "contract_archivo_id" TEXT,
    "notes" TEXT,
    "closed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sale_closings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_commissions" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "sale_process_id" TEXT,
    "sale_closing_id" TEXT,
    "agent_id" TEXT NOT NULL,
    "calculation_type" TEXT NOT NULL DEFAULT 'PERCENT',
    "amount" DOUBLE PRECISION NOT NULL,
    "percent_applied" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sale_commissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_commission_payment_parts" (
    "id" TEXT NOT NULL,
    "sale_commission_id" TEXT NOT NULL,
    "part_number" INTEGER NOT NULL,
    "label" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "due_date" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sale_commission_payment_parts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_commission_deductibles" (
    "id" TEXT NOT NULL,
    "sale_commission_id" TEXT NOT NULL,
    "deductible_type" TEXT NOT NULL,
    "description" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sale_commission_deductibles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_buyer_payments" (
    "id" TEXT NOT NULL,
    "sale_closing_id" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'PEN',
    "due_date" TIMESTAMP(3) NOT NULL,
    "paid_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sale_buyer_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sale_documentation_costs" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "sale_closing_id" TEXT NOT NULL,
    "cost_type" TEXT NOT NULL,
    "description" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'PEN',
    "expense_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sale_documentation_costs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ventas_agent_commission_profiles" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "commission_percent" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ventas_agent_commission_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "agents_application_id_idx" ON "agents"("application_id");

-- CreateIndex
CREATE INDEX "agents_type_idx" ON "agents"("type");

-- CreateIndex
CREATE INDEX "agents_user_id_idx" ON "agents"("user_id");

-- CreateIndex
CREATE INDEX "agents_deleted_at_idx" ON "agents"("deleted_at");

-- CreateIndex
CREATE INDEX "alert_configs_application_id_idx" ON "alert_configs"("application_id");

-- CreateIndex
CREATE INDEX "alert_configs_user_id_idx" ON "alert_configs"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "alert_configs_application_id_user_id_key" ON "alert_configs"("application_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "applications_slug_key" ON "applications"("slug");

-- CreateIndex
CREATE INDEX "applications_slug_idx" ON "applications"("slug");

-- CreateIndex
CREATE INDEX "applications_is_active_idx" ON "applications"("is_active");

-- CreateIndex
CREATE INDEX "applications_order_idx" ON "applications"("order");

-- CreateIndex
CREATE INDEX "menus_application_id_idx" ON "menus"("application_id");

-- CreateIndex
CREATE INDEX "menus_parent_id_idx" ON "menus"("parent_id");

-- CreateIndex
CREATE INDEX "menus_order_idx" ON "menus"("order");

-- CreateIndex
CREATE INDEX "role_applications_role_id_idx" ON "role_applications"("role_id");

-- CreateIndex
CREATE INDEX "role_applications_application_id_idx" ON "role_applications"("application_id");

-- CreateIndex
CREATE UNIQUE INDEX "role_applications_role_id_application_id_key" ON "role_applications"("role_id", "application_id");

-- CreateIndex
CREATE INDEX "arquitectura_calendar_events_application_id_starts_at_idx" ON "arquitectura_calendar_events"("application_id", "starts_at");

-- CreateIndex
CREATE INDEX "arquitectura_calendar_events_project_id_idx" ON "arquitectura_calendar_events"("project_id");

-- CreateIndex
CREATE INDEX "arquitectura_calendar_events_assigned_agent_id_idx" ON "arquitectura_calendar_events"("assigned_agent_id");

-- CreateIndex
CREATE INDEX "arquitectura_project_stage_configs_application_id_idx" ON "arquitectura_project_stage_configs"("application_id");

-- CreateIndex
CREATE UNIQUE INDEX "arquitectura_project_stage_configs_application_id_code_key" ON "arquitectura_project_stage_configs"("application_id", "code");

-- CreateIndex
CREATE INDEX "arquitectura_numbering_series_application_id_idx" ON "arquitectura_numbering_series"("application_id");

-- CreateIndex
CREATE UNIQUE INDEX "arquitectura_numbering_series_application_id_series_key_key" ON "arquitectura_numbering_series"("application_id", "series_key");

-- CreateIndex
CREATE INDEX "arquitectura_execution_tasks_project_id_idx" ON "arquitectura_execution_tasks"("project_id");

-- CreateIndex
CREATE INDEX "arquitectura_execution_tasks_project_id_phase_idx" ON "arquitectura_execution_tasks"("project_id", "phase");

-- CreateIndex
CREATE INDEX "arquitectura_execution_tasks_project_id_kanban_status_idx" ON "arquitectura_execution_tasks"("project_id", "kanban_status");

-- CreateIndex
CREATE INDEX "arquitectura_execution_evidences_project_id_idx" ON "arquitectura_execution_evidences"("project_id");

-- CreateIndex
CREATE INDEX "arquitectura_execution_evidences_task_id_idx" ON "arquitectura_execution_evidences"("task_id");

-- CreateIndex
CREATE INDEX "arquitectura_execution_evidences_archivo_id_idx" ON "arquitectura_execution_evidences"("archivo_id");

-- CreateIndex
CREATE INDEX "arquitectura_execution_incidents_project_id_idx" ON "arquitectura_execution_incidents"("project_id");

-- CreateIndex
CREATE INDEX "arquitectura_execution_incidents_project_id_status_idx" ON "arquitectura_execution_incidents"("project_id", "status");

-- CreateIndex
CREATE INDEX "arquitectura_execution_actual_costs_project_id_idx" ON "arquitectura_execution_actual_costs"("project_id");

-- CreateIndex
CREATE INDEX "arquitectura_execution_actual_costs_project_id_cost_categor_idx" ON "arquitectura_execution_actual_costs"("project_id", "cost_category");

-- CreateIndex
CREATE INDEX "arquitectura_execution_actual_costs_catalog_material_id_idx" ON "arquitectura_execution_actual_costs"("catalog_material_id");

-- CreateIndex
CREATE INDEX "arquitectura_finance_income_schedules_project_id_idx" ON "arquitectura_finance_income_schedules"("project_id");

-- CreateIndex
CREATE INDEX "arquitectura_finance_income_schedules_project_id_kind_idx" ON "arquitectura_finance_income_schedules"("project_id", "kind");

-- CreateIndex
CREATE INDEX "arquitectura_catalog_materials_application_id_idx" ON "arquitectura_catalog_materials"("application_id");

-- CreateIndex
CREATE INDEX "arquitectura_catalog_materials_category_idx" ON "arquitectura_catalog_materials"("category");

-- CreateIndex
CREATE UNIQUE INDEX "arquitectura_catalog_materials_application_id_code_key" ON "arquitectura_catalog_materials"("application_id", "code");

-- CreateIndex
CREATE INDEX "arquitectura_catalog_material_images_material_id_idx" ON "arquitectura_catalog_material_images"("material_id");

-- CreateIndex
CREATE INDEX "arquitectura_material_suppliers_application_id_idx" ON "arquitectura_material_suppliers"("application_id");

-- CreateIndex
CREATE UNIQUE INDEX "arquitectura_material_suppliers_application_id_ruc_key" ON "arquitectura_material_suppliers"("application_id", "ruc");

-- CreateIndex
CREATE INDEX "arquitectura_supplier_catalog_links_supplier_id_idx" ON "arquitectura_supplier_catalog_links"("supplier_id");

-- CreateIndex
CREATE INDEX "arquitectura_supplier_catalog_links_catalog_material_id_idx" ON "arquitectura_supplier_catalog_links"("catalog_material_id");

-- CreateIndex
CREATE UNIQUE INDEX "arquitectura_supplier_catalog_links_supplier_id_catalog_mat_key" ON "arquitectura_supplier_catalog_links"("supplier_id", "catalog_material_id");

-- CreateIndex
CREATE INDEX "arquitectura_material_purchases_supplier_id_idx" ON "arquitectura_material_purchases"("supplier_id");

-- CreateIndex
CREATE INDEX "arquitectura_material_purchases_catalog_material_id_idx" ON "arquitectura_material_purchases"("catalog_material_id");

-- CreateIndex
CREATE INDEX "arquitectura_material_purchases_purchased_at_idx" ON "arquitectura_material_purchases"("purchased_at");

-- CreateIndex
CREATE INDEX "arquitectura_project_sections_project_id_idx" ON "arquitectura_project_sections"("project_id");

-- CreateIndex
CREATE INDEX "arquitectura_project_line_items_section_id_idx" ON "arquitectura_project_line_items"("section_id");

-- CreateIndex
CREATE INDEX "arquitectura_line_item_supplier_payments_line_item_id_idx" ON "arquitectura_line_item_supplier_payments"("line_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "arquitectura_line_item_supplier_payments_line_item_id_payme_key" ON "arquitectura_line_item_supplier_payments"("line_item_id", "payment_number");

-- CreateIndex
CREATE INDEX "arquitectura_projects_application_id_idx" ON "arquitectura_projects"("application_id");

-- CreateIndex
CREATE INDEX "arquitectura_projects_client_id_idx" ON "arquitectura_projects"("client_id");

-- CreateIndex
CREATE INDEX "arquitectura_projects_status_idx" ON "arquitectura_projects"("status");

-- CreateIndex
CREATE INDEX "arquitectura_projects_project_type_idx" ON "arquitectura_projects"("project_type");

-- CreateIndex
CREATE INDEX "arquitectura_projects_deleted_at_idx" ON "arquitectura_projects"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "arquitectura_projects_application_id_code_key" ON "arquitectura_projects"("application_id", "code");

-- CreateIndex
CREATE INDEX "arquitectura_project_payments_project_id_idx" ON "arquitectura_project_payments"("project_id");

-- CreateIndex
CREATE INDEX "arquitectura_project_payments_schedule_item_id_idx" ON "arquitectura_project_payments"("schedule_item_id");

-- CreateIndex
CREATE INDEX "arquitectura_project_documents_project_id_idx" ON "arquitectura_project_documents"("project_id");

-- CreateIndex
CREATE INDEX "arquitectura_project_documents_archivo_id_idx" ON "arquitectura_project_documents"("archivo_id");

-- CreateIndex
CREATE INDEX "arquitectura_project_milestones_project_id_idx" ON "arquitectura_project_milestones"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_is_active_idx" ON "users"("is_active");

-- CreateIndex
CREATE INDEX "users_deleted_at_idx" ON "users"("deleted_at");

-- CreateIndex
CREATE INDEX "password_reset_codes_user_id_idx" ON "password_reset_codes"("user_id");

-- CreateIndex
CREATE INDEX "password_reset_codes_code_idx" ON "password_reset_codes"("code");

-- CreateIndex
CREATE INDEX "password_reset_codes_expires_at_idx" ON "password_reset_codes"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "roles_code_key" ON "roles"("code");

-- CreateIndex
CREATE INDEX "roles_code_idx" ON "roles"("code");

-- CreateIndex
CREATE INDEX "roles_is_active_idx" ON "roles"("is_active");

-- CreateIndex
CREATE INDEX "user_roles_user_id_idx" ON "user_roles"("user_id");

-- CreateIndex
CREATE INDEX "user_roles_role_id_idx" ON "user_roles"("role_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_user_id_role_id_key" ON "user_roles"("user_id", "role_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "notifications_read_at_idx" ON "notifications"("read_at");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "document_types_code_key" ON "document_types"("code");

-- CreateIndex
CREATE UNIQUE INDEX "property_types_code_key" ON "property_types"("code");

-- CreateIndex
CREATE UNIQUE INDEX "currencies_code_key" ON "currencies"("code");

-- CreateIndex
CREATE UNIQUE INDEX "sale_financing_channels_code_key" ON "sale_financing_channels"("code");

-- CreateIndex
CREATE INDEX "sale_financing_channels_category_idx" ON "sale_financing_channels"("category");

-- CreateIndex
CREATE INDEX "sale_financing_channels_is_active_idx" ON "sale_financing_channels"("is_active");

-- CreateIndex
CREATE INDEX "clients_application_id_idx" ON "clients"("application_id");

-- CreateIndex
CREATE INDEX "clients_document_type_id_idx" ON "clients"("document_type_id");

-- CreateIndex
CREATE INDEX "clients_client_type_idx" ON "clients"("client_type");

-- CreateIndex
CREATE INDEX "clients_sales_status_idx" ON "clients"("sales_status");

-- CreateIndex
CREATE INDEX "clients_assigned_agent_id_idx" ON "clients"("assigned_agent_id");

-- CreateIndex
CREATE INDEX "clients_document_number_idx" ON "clients"("document_number");

-- CreateIndex
CREATE INDEX "clients_deleted_at_idx" ON "clients"("deleted_at");

-- CreateIndex
CREATE INDEX "addresses_client_id_idx" ON "addresses"("client_id");

-- CreateIndex
CREATE INDEX "addresses_district_id_idx" ON "addresses"("district_id");

-- CreateIndex
CREATE INDEX "contabilidad_accounts_application_id_idx" ON "contabilidad_accounts"("application_id");

-- CreateIndex
CREATE INDEX "contabilidad_accounts_parent_id_idx" ON "contabilidad_accounts"("parent_id");

-- CreateIndex
CREATE INDEX "contabilidad_accounts_account_type_idx" ON "contabilidad_accounts"("account_type");

-- CreateIndex
CREATE UNIQUE INDEX "contabilidad_accounts_application_id_code_key" ON "contabilidad_accounts"("application_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "contabilidad_company_profiles_application_id_key" ON "contabilidad_company_profiles"("application_id");

-- CreateIndex
CREATE UNIQUE INDEX "contabilidad_app_settings_application_id_key" ON "contabilidad_app_settings"("application_id");

-- CreateIndex
CREATE INDEX "contabilidad_document_series_application_id_idx" ON "contabilidad_document_series"("application_id");

-- CreateIndex
CREATE UNIQUE INDEX "contabilidad_document_series_application_id_series_key_key" ON "contabilidad_document_series"("application_id", "series_key");

-- CreateIndex
CREATE INDEX "contabilidad_cpe_provider_configs_application_id_idx" ON "contabilidad_cpe_provider_configs"("application_id");

-- CreateIndex
CREATE UNIQUE INDEX "contabilidad_cpe_provider_configs_legal_entity_id_key" ON "contabilidad_cpe_provider_configs"("legal_entity_id");

-- CreateIndex
CREATE INDEX "contabilidad_exchange_rates_application_id_idx" ON "contabilidad_exchange_rates"("application_id");

-- CreateIndex
CREATE UNIQUE INDEX "contabilidad_exchange_rates_application_id_rate_date_curren_key" ON "contabilidad_exchange_rates"("application_id", "rate_date", "currency_code");

-- CreateIndex
CREATE INDEX "contabilidad_journal_templates_application_id_idx" ON "contabilidad_journal_templates"("application_id");

-- CreateIndex
CREATE INDEX "contabilidad_journal_template_lines_template_id_idx" ON "contabilidad_journal_template_lines"("template_id");

-- CreateIndex
CREATE INDEX "contabilidad_inventory_balance_snapshots_application_id_idx" ON "contabilidad_inventory_balance_snapshots"("application_id");

-- CreateIndex
CREATE UNIQUE INDEX "contabilidad_inventory_balance_snapshots_application_id_per_key" ON "contabilidad_inventory_balance_snapshots"("application_id", "period_id", "account_id");

-- CreateIndex
CREATE INDEX "contabilidad_electronic_document_logs_application_id_idx" ON "contabilidad_electronic_document_logs"("application_id");

-- CreateIndex
CREATE INDEX "contabilidad_electronic_document_logs_legal_entity_id_idx" ON "contabilidad_electronic_document_logs"("legal_entity_id");

-- CreateIndex
CREATE INDEX "contabilidad_electronic_document_logs_source_type_source_id_idx" ON "contabilidad_electronic_document_logs"("source_type", "source_id");

-- CreateIndex
CREATE INDEX "contabilidad_electronic_document_logs_document_kind_documen_idx" ON "contabilidad_electronic_document_logs"("document_kind", "document_ref");

-- CreateIndex
CREATE INDEX "contabilidad_income_tax_period_summaries_application_id_idx" ON "contabilidad_income_tax_period_summaries"("application_id");

-- CreateIndex
CREATE UNIQUE INDEX "contabilidad_income_tax_period_summaries_application_id_per_key" ON "contabilidad_income_tax_period_summaries"("application_id", "period_id");

-- CreateIndex
CREATE INDEX "contabilidad_ple_export_logs_application_id_idx" ON "contabilidad_ple_export_logs"("application_id");

-- CreateIndex
CREATE INDEX "contabilidad_ple_export_logs_period_id_idx" ON "contabilidad_ple_export_logs"("period_id");

-- CreateIndex
CREATE INDEX "contabilidad_ple_export_logs_application_id_period_id_idx" ON "contabilidad_ple_export_logs"("application_id", "period_id");

-- CreateIndex
CREATE INDEX "contabilidad_inventory_items_application_id_idx" ON "contabilidad_inventory_items"("application_id");

-- CreateIndex
CREATE INDEX "contabilidad_inventory_items_account_id_idx" ON "contabilidad_inventory_items"("account_id");

-- CreateIndex
CREATE UNIQUE INDEX "contabilidad_inventory_items_application_id_code_key" ON "contabilidad_inventory_items"("application_id", "code");

-- CreateIndex
CREATE INDEX "contabilidad_inventory_movements_application_id_idx" ON "contabilidad_inventory_movements"("application_id");

-- CreateIndex
CREATE INDEX "contabilidad_inventory_movements_item_id_idx" ON "contabilidad_inventory_movements"("item_id");

-- CreateIndex
CREATE INDEX "contabilidad_inventory_movements_period_id_idx" ON "contabilidad_inventory_movements"("period_id");

-- CreateIndex
CREATE INDEX "contabilidad_inventory_movements_movement_date_idx" ON "contabilidad_inventory_movements"("movement_date");

-- CreateIndex
CREATE INDEX "contabilidad_journal_entries_application_id_idx" ON "contabilidad_journal_entries"("application_id");

-- CreateIndex
CREATE INDEX "contabilidad_journal_entries_legal_entity_id_idx" ON "contabilidad_journal_entries"("legal_entity_id");

-- CreateIndex
CREATE INDEX "contabilidad_journal_entries_period_id_idx" ON "contabilidad_journal_entries"("period_id");

-- CreateIndex
CREATE INDEX "contabilidad_journal_entries_application_id_status_idx" ON "contabilidad_journal_entries"("application_id", "status");

-- CreateIndex
CREATE INDEX "contabilidad_journal_entries_entry_date_idx" ON "contabilidad_journal_entries"("entry_date");

-- CreateIndex
CREATE UNIQUE INDEX "contabilidad_journal_entries_legal_entity_id_period_id_entr_key" ON "contabilidad_journal_entries"("legal_entity_id", "period_id", "entry_number");

-- CreateIndex
CREATE INDEX "contabilidad_journal_entry_lines_journal_entry_id_idx" ON "contabilidad_journal_entry_lines"("journal_entry_id");

-- CreateIndex
CREATE INDEX "contabilidad_journal_entry_lines_account_id_idx" ON "contabilidad_journal_entry_lines"("account_id");

-- CreateIndex
CREATE INDEX "contabilidad_journal_entry_lines_cost_center_id_idx" ON "contabilidad_journal_entry_lines"("cost_center_id");

-- CreateIndex
CREATE INDEX "contabilidad_legal_entities_application_id_idx" ON "contabilidad_legal_entities"("application_id");

-- CreateIndex
CREATE UNIQUE INDEX "contabilidad_legal_entities_application_id_code_key" ON "contabilidad_legal_entities"("application_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "contabilidad_legal_entities_application_id_ruc_key" ON "contabilidad_legal_entities"("application_id", "ruc");

-- CreateIndex
CREATE INDEX "contabilidad_audit_logs_application_id_idx" ON "contabilidad_audit_logs"("application_id");

-- CreateIndex
CREATE INDEX "contabilidad_audit_logs_legal_entity_id_idx" ON "contabilidad_audit_logs"("legal_entity_id");

-- CreateIndex
CREATE INDEX "contabilidad_audit_logs_entity_type_idx" ON "contabilidad_audit_logs"("entity_type");

-- CreateIndex
CREATE INDEX "contabilidad_audit_logs_created_at_idx" ON "contabilidad_audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "contabilidad_periods_application_id_idx" ON "contabilidad_periods"("application_id");

-- CreateIndex
CREATE INDEX "contabilidad_periods_legal_entity_id_idx" ON "contabilidad_periods"("legal_entity_id");

-- CreateIndex
CREATE INDEX "contabilidad_periods_application_id_year_idx" ON "contabilidad_periods"("application_id", "year");

-- CreateIndex
CREATE UNIQUE INDEX "contabilidad_periods_legal_entity_id_year_month_key" ON "contabilidad_periods"("legal_entity_id", "year", "month");

-- CreateIndex
CREATE INDEX "contabilidad_cost_centers_application_id_idx" ON "contabilidad_cost_centers"("application_id");

-- CreateIndex
CREATE INDEX "contabilidad_cost_centers_parent_id_idx" ON "contabilidad_cost_centers"("parent_id");

-- CreateIndex
CREATE UNIQUE INDEX "contabilidad_cost_centers_application_id_code_key" ON "contabilidad_cost_centers"("application_id", "code");

-- CreateIndex
CREATE INDEX "contabilidad_suppliers_application_id_idx" ON "contabilidad_suppliers"("application_id");

-- CreateIndex
CREATE UNIQUE INDEX "contabilidad_suppliers_application_id_ruc_key" ON "contabilidad_suppliers"("application_id", "ruc");

-- CreateIndex
CREATE INDEX "contabilidad_purchase_invoices_application_id_idx" ON "contabilidad_purchase_invoices"("application_id");

-- CreateIndex
CREATE INDEX "contabilidad_purchase_invoices_supplier_id_idx" ON "contabilidad_purchase_invoices"("supplier_id");

-- CreateIndex
CREATE INDEX "contabilidad_purchase_invoices_period_id_idx" ON "contabilidad_purchase_invoices"("period_id");

-- CreateIndex
CREATE INDEX "contabilidad_purchase_invoices_status_idx" ON "contabilidad_purchase_invoices"("status");

-- CreateIndex
CREATE UNIQUE INDEX "contabilidad_purchase_invoices_application_id_document_type_key" ON "contabilidad_purchase_invoices"("application_id", "document_type", "series", "number");

-- CreateIndex
CREATE INDEX "contabilidad_purchase_credit_notes_application_id_idx" ON "contabilidad_purchase_credit_notes"("application_id");

-- CreateIndex
CREATE INDEX "contabilidad_purchase_credit_notes_supplier_id_idx" ON "contabilidad_purchase_credit_notes"("supplier_id");

-- CreateIndex
CREATE UNIQUE INDEX "contabilidad_purchase_credit_notes_application_id_series_nu_key" ON "contabilidad_purchase_credit_notes"("application_id", "series", "number");

-- CreateIndex
CREATE INDEX "contabilidad_purchase_debit_notes_application_id_idx" ON "contabilidad_purchase_debit_notes"("application_id");

-- CreateIndex
CREATE INDEX "contabilidad_purchase_debit_notes_supplier_id_idx" ON "contabilidad_purchase_debit_notes"("supplier_id");

-- CreateIndex
CREATE UNIQUE INDEX "contabilidad_purchase_debit_notes_application_id_series_num_key" ON "contabilidad_purchase_debit_notes"("application_id", "series", "number");

-- CreateIndex
CREATE INDEX "contabilidad_purchase_payments_application_id_idx" ON "contabilidad_purchase_payments"("application_id");

-- CreateIndex
CREATE INDEX "contabilidad_purchase_payments_invoice_id_idx" ON "contabilidad_purchase_payments"("invoice_id");

-- CreateIndex
CREATE INDEX "contabilidad_customers_application_id_idx" ON "contabilidad_customers"("application_id");

-- CreateIndex
CREATE UNIQUE INDEX "contabilidad_customers_application_id_ruc_key" ON "contabilidad_customers"("application_id", "ruc");

-- CreateIndex
CREATE UNIQUE INDEX "contabilidad_sales_invoices_electronic_log_id_key" ON "contabilidad_sales_invoices"("electronic_log_id");

-- CreateIndex
CREATE INDEX "contabilidad_sales_invoices_application_id_idx" ON "contabilidad_sales_invoices"("application_id");

-- CreateIndex
CREATE INDEX "contabilidad_sales_invoices_customer_id_idx" ON "contabilidad_sales_invoices"("customer_id");

-- CreateIndex
CREATE INDEX "contabilidad_sales_invoices_period_id_idx" ON "contabilidad_sales_invoices"("period_id");

-- CreateIndex
CREATE INDEX "contabilidad_sales_invoices_document_type_idx" ON "contabilidad_sales_invoices"("document_type");

-- CreateIndex
CREATE INDEX "contabilidad_sales_invoices_status_idx" ON "contabilidad_sales_invoices"("status");

-- CreateIndex
CREATE INDEX "contabilidad_sales_invoices_electronic_status_idx" ON "contabilidad_sales_invoices"("electronic_status");

-- CreateIndex
CREATE UNIQUE INDEX "contabilidad_sales_invoices_application_id_document_type_se_key" ON "contabilidad_sales_invoices"("application_id", "document_type", "series", "number");

-- CreateIndex
CREATE INDEX "contabilidad_sales_credit_notes_application_id_idx" ON "contabilidad_sales_credit_notes"("application_id");

-- CreateIndex
CREATE INDEX "contabilidad_sales_credit_notes_customer_id_idx" ON "contabilidad_sales_credit_notes"("customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "contabilidad_sales_credit_notes_application_id_series_numbe_key" ON "contabilidad_sales_credit_notes"("application_id", "series", "number");

-- CreateIndex
CREATE INDEX "contabilidad_sales_debit_notes_application_id_idx" ON "contabilidad_sales_debit_notes"("application_id");

-- CreateIndex
CREATE INDEX "contabilidad_sales_debit_notes_customer_id_idx" ON "contabilidad_sales_debit_notes"("customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "contabilidad_sales_debit_notes_application_id_series_number_key" ON "contabilidad_sales_debit_notes"("application_id", "series", "number");

-- CreateIndex
CREATE INDEX "contabilidad_sales_collections_application_id_idx" ON "contabilidad_sales_collections"("application_id");

-- CreateIndex
CREATE INDEX "contabilidad_sales_collections_invoice_id_idx" ON "contabilidad_sales_collections"("invoice_id");

-- CreateIndex
CREATE INDEX "contabilidad_sol_credentials_application_id_idx" ON "contabilidad_sol_credentials"("application_id");

-- CreateIndex
CREATE UNIQUE INDEX "contabilidad_sol_credentials_legal_entity_id_key" ON "contabilidad_sol_credentials"("legal_entity_id");

-- CreateIndex
CREATE INDEX "contabilidad_sunat_declaration_logs_application_id_idx" ON "contabilidad_sunat_declaration_logs"("application_id");

-- CreateIndex
CREATE INDEX "contabilidad_sunat_declaration_logs_legal_entity_id_idx" ON "contabilidad_sunat_declaration_logs"("legal_entity_id");

-- CreateIndex
CREATE INDEX "contabilidad_sunat_declaration_logs_period_id_idx" ON "contabilidad_sunat_declaration_logs"("period_id");

-- CreateIndex
CREATE INDEX "contabilidad_sunat_declaration_logs_declaration_type_idx" ON "contabilidad_sunat_declaration_logs"("declaration_type");

-- CreateIndex
CREATE INDEX "contabilidad_sunat_declaration_logs_application_id_period_i_idx" ON "contabilidad_sunat_declaration_logs"("application_id", "period_id", "declaration_type");

-- CreateIndex
CREATE INDEX "contabilidad_detraccion_rates_application_id_idx" ON "contabilidad_detraccion_rates"("application_id");

-- CreateIndex
CREATE UNIQUE INDEX "contabilidad_detraccion_rates_application_id_sunat_code_key" ON "contabilidad_detraccion_rates"("application_id", "sunat_code");

-- CreateIndex
CREATE INDEX "contabilidad_detracciones_application_id_idx" ON "contabilidad_detracciones"("application_id");

-- CreateIndex
CREATE INDEX "contabilidad_detracciones_period_id_idx" ON "contabilidad_detracciones"("period_id");

-- CreateIndex
CREATE INDEX "contabilidad_detracciones_status_idx" ON "contabilidad_detracciones"("status");

-- CreateIndex
CREATE INDEX "contabilidad_retentions_application_id_idx" ON "contabilidad_retentions"("application_id");

-- CreateIndex
CREATE INDEX "contabilidad_retentions_period_id_idx" ON "contabilidad_retentions"("period_id");

-- CreateIndex
CREATE INDEX "contabilidad_perceptions_application_id_idx" ON "contabilidad_perceptions"("application_id");

-- CreateIndex
CREATE INDEX "contabilidad_perceptions_period_id_idx" ON "contabilidad_perceptions"("period_id");

-- CreateIndex
CREATE INDEX "contabilidad_cash_boxes_application_id_idx" ON "contabilidad_cash_boxes"("application_id");

-- CreateIndex
CREATE UNIQUE INDEX "contabilidad_cash_boxes_application_id_code_key" ON "contabilidad_cash_boxes"("application_id", "code");

-- CreateIndex
CREATE INDEX "contabilidad_bank_accounts_application_id_idx" ON "contabilidad_bank_accounts"("application_id");

-- CreateIndex
CREATE UNIQUE INDEX "contabilidad_bank_accounts_application_id_code_key" ON "contabilidad_bank_accounts"("application_id", "code");

-- CreateIndex
CREATE INDEX "contabilidad_treasury_movements_application_id_idx" ON "contabilidad_treasury_movements"("application_id");

-- CreateIndex
CREATE INDEX "contabilidad_treasury_movements_period_id_idx" ON "contabilidad_treasury_movements"("period_id");

-- CreateIndex
CREATE INDEX "contabilidad_treasury_movements_cash_box_id_idx" ON "contabilidad_treasury_movements"("cash_box_id");

-- CreateIndex
CREATE INDEX "contabilidad_treasury_movements_bank_account_id_idx" ON "contabilidad_treasury_movements"("bank_account_id");

-- CreateIndex
CREATE INDEX "contabilidad_treasury_movements_transfer_group_id_idx" ON "contabilidad_treasury_movements"("transfer_group_id");

-- CreateIndex
CREATE INDEX "contabilidad_treasury_movements_movement_date_idx" ON "contabilidad_treasury_movements"("movement_date");

-- CreateIndex
CREATE INDEX "contabilidad_bank_reconciliations_application_id_idx" ON "contabilidad_bank_reconciliations"("application_id");

-- CreateIndex
CREATE UNIQUE INDEX "contabilidad_bank_reconciliations_application_id_bank_accou_key" ON "contabilidad_bank_reconciliations"("application_id", "bank_account_id", "period_id");

-- CreateIndex
CREATE INDEX "gen_archivos_application_slug_idx" ON "gen_archivos"("application_slug");

-- CreateIndex
CREATE INDEX "gen_archivos_application_id_idx" ON "gen_archivos"("application_id");

-- CreateIndex
CREATE INDEX "gen_archivos_module_entity_type_entity_id_idx" ON "gen_archivos"("module", "entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "gen_archivos_deleted_at_idx" ON "gen_archivos"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "gen_archivos_bucket_object_key_key" ON "gen_archivos"("bucket", "object_key");

-- CreateIndex
CREATE INDEX "provinces_department_id_idx" ON "provinces"("department_id");

-- CreateIndex
CREATE INDEX "districts_province_id_idx" ON "districts"("province_id");

-- CreateIndex
CREATE INDEX "interior_calendar_events_application_id_starts_at_idx" ON "interior_calendar_events"("application_id", "starts_at");

-- CreateIndex
CREATE INDEX "interior_calendar_events_project_id_idx" ON "interior_calendar_events"("project_id");

-- CreateIndex
CREATE INDEX "interior_calendar_events_assigned_agent_id_idx" ON "interior_calendar_events"("assigned_agent_id");

-- CreateIndex
CREATE INDEX "interiorismo_project_stage_configs_application_id_idx" ON "interiorismo_project_stage_configs"("application_id");

-- CreateIndex
CREATE UNIQUE INDEX "interiorismo_project_stage_configs_application_id_code_key" ON "interiorismo_project_stage_configs"("application_id", "code");

-- CreateIndex
CREATE INDEX "interiorismo_numbering_series_application_id_idx" ON "interiorismo_numbering_series"("application_id");

-- CreateIndex
CREATE UNIQUE INDEX "interiorismo_numbering_series_application_id_series_key_key" ON "interiorismo_numbering_series"("application_id", "series_key");

-- CreateIndex
CREATE INDEX "interior_execution_tasks_project_id_idx" ON "interior_execution_tasks"("project_id");

-- CreateIndex
CREATE INDEX "interior_execution_tasks_project_id_phase_idx" ON "interior_execution_tasks"("project_id", "phase");

-- CreateIndex
CREATE INDEX "interior_execution_tasks_project_id_kanban_status_idx" ON "interior_execution_tasks"("project_id", "kanban_status");

-- CreateIndex
CREATE INDEX "interior_execution_evidences_project_id_idx" ON "interior_execution_evidences"("project_id");

-- CreateIndex
CREATE INDEX "interior_execution_evidences_task_id_idx" ON "interior_execution_evidences"("task_id");

-- CreateIndex
CREATE INDEX "interior_execution_evidences_archivo_id_idx" ON "interior_execution_evidences"("archivo_id");

-- CreateIndex
CREATE INDEX "interior_execution_incidents_project_id_idx" ON "interior_execution_incidents"("project_id");

-- CreateIndex
CREATE INDEX "interior_execution_incidents_project_id_status_idx" ON "interior_execution_incidents"("project_id", "status");

-- CreateIndex
CREATE INDEX "interior_execution_actual_costs_project_id_idx" ON "interior_execution_actual_costs"("project_id");

-- CreateIndex
CREATE INDEX "interior_execution_actual_costs_project_id_cost_category_idx" ON "interior_execution_actual_costs"("project_id", "cost_category");

-- CreateIndex
CREATE INDEX "interior_execution_actual_costs_catalog_material_id_idx" ON "interior_execution_actual_costs"("catalog_material_id");

-- CreateIndex
CREATE INDEX "interior_finance_income_schedules_project_id_idx" ON "interior_finance_income_schedules"("project_id");

-- CreateIndex
CREATE INDEX "interior_finance_income_schedules_project_id_kind_idx" ON "interior_finance_income_schedules"("project_id", "kind");

-- CreateIndex
CREATE INDEX "interior_catalog_materials_application_id_idx" ON "interior_catalog_materials"("application_id");

-- CreateIndex
CREATE INDEX "interior_catalog_materials_category_idx" ON "interior_catalog_materials"("category");

-- CreateIndex
CREATE UNIQUE INDEX "interior_catalog_materials_application_id_code_key" ON "interior_catalog_materials"("application_id", "code");

-- CreateIndex
CREATE INDEX "interior_catalog_material_images_material_id_idx" ON "interior_catalog_material_images"("material_id");

-- CreateIndex
CREATE INDEX "interior_material_suppliers_application_id_idx" ON "interior_material_suppliers"("application_id");

-- CreateIndex
CREATE UNIQUE INDEX "interior_material_suppliers_application_id_ruc_key" ON "interior_material_suppliers"("application_id", "ruc");

-- CreateIndex
CREATE INDEX "interior_supplier_catalog_links_supplier_id_idx" ON "interior_supplier_catalog_links"("supplier_id");

-- CreateIndex
CREATE INDEX "interior_supplier_catalog_links_catalog_material_id_idx" ON "interior_supplier_catalog_links"("catalog_material_id");

-- CreateIndex
CREATE UNIQUE INDEX "interior_supplier_catalog_links_supplier_id_catalog_materia_key" ON "interior_supplier_catalog_links"("supplier_id", "catalog_material_id");

-- CreateIndex
CREATE INDEX "interior_material_purchases_supplier_id_idx" ON "interior_material_purchases"("supplier_id");

-- CreateIndex
CREATE INDEX "interior_material_purchases_catalog_material_id_idx" ON "interior_material_purchases"("catalog_material_id");

-- CreateIndex
CREATE INDEX "interior_material_purchases_purchased_at_idx" ON "interior_material_purchases"("purchased_at");

-- CreateIndex
CREATE INDEX "interior_project_sections_project_id_idx" ON "interior_project_sections"("project_id");

-- CreateIndex
CREATE INDEX "interior_project_line_items_section_id_idx" ON "interior_project_line_items"("section_id");

-- CreateIndex
CREATE INDEX "interior_project_line_items_supplier_id_idx" ON "interior_project_line_items"("supplier_id");

-- CreateIndex
CREATE INDEX "interior_line_item_supplier_payments_line_item_id_idx" ON "interior_line_item_supplier_payments"("line_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "interior_line_item_supplier_payments_line_item_id_payment_n_key" ON "interior_line_item_supplier_payments"("line_item_id", "payment_number");

-- CreateIndex
CREATE INDEX "interior_projects_application_id_idx" ON "interior_projects"("application_id");

-- CreateIndex
CREATE INDEX "interior_projects_client_id_idx" ON "interior_projects"("client_id");

-- CreateIndex
CREATE INDEX "interior_projects_status_idx" ON "interior_projects"("status");

-- CreateIndex
CREATE INDEX "interior_projects_project_type_idx" ON "interior_projects"("project_type");

-- CreateIndex
CREATE INDEX "interior_projects_deleted_at_idx" ON "interior_projects"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "interior_projects_application_id_code_key" ON "interior_projects"("application_id", "code");

-- CreateIndex
CREATE INDEX "interior_project_materials_project_id_idx" ON "interior_project_materials"("project_id");

-- CreateIndex
CREATE INDEX "interior_project_documents_project_id_idx" ON "interior_project_documents"("project_id");

-- CreateIndex
CREATE INDEX "interior_project_documents_archivo_id_idx" ON "interior_project_documents"("archivo_id");

-- CreateIndex
CREATE INDEX "interior_project_payments_project_id_idx" ON "interior_project_payments"("project_id");

-- CreateIndex
CREATE INDEX "interior_project_payments_schedule_item_id_idx" ON "interior_project_payments"("schedule_item_id");

-- CreateIndex
CREATE INDEX "interior_project_activities_project_id_idx" ON "interior_project_activities"("project_id");

-- CreateIndex
CREATE INDEX "interior_project_activities_occurred_at_idx" ON "interior_project_activities"("occurred_at");

-- CreateIndex
CREATE INDEX "interior_project_milestones_project_id_idx" ON "interior_project_milestones"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "produccion_app_settings_application_id_key" ON "produccion_app_settings"("application_id");

-- CreateIndex
CREATE INDEX "produccion_furniture_category_configs_application_id_idx" ON "produccion_furniture_category_configs"("application_id");

-- CreateIndex
CREATE UNIQUE INDEX "produccion_furniture_category_configs_application_id_code_key" ON "produccion_furniture_category_configs"("application_id", "code");

-- CreateIndex
CREATE INDEX "produccion_material_category_configs_application_id_idx" ON "produccion_material_category_configs"("application_id");

-- CreateIndex
CREATE UNIQUE INDEX "produccion_material_category_configs_application_id_code_key" ON "produccion_material_category_configs"("application_id", "code");

-- CreateIndex
CREATE INDEX "produccion_production_stage_configs_application_id_idx" ON "produccion_production_stage_configs"("application_id");

-- CreateIndex
CREATE UNIQUE INDEX "produccion_production_stage_configs_application_id_stage_ke_key" ON "produccion_production_stage_configs"("application_id", "stage_key");

-- CreateIndex
CREATE INDEX "produccion_unit_configs_application_id_idx" ON "produccion_unit_configs"("application_id");

-- CreateIndex
CREATE UNIQUE INDEX "produccion_unit_configs_application_id_code_key" ON "produccion_unit_configs"("application_id", "code");

-- CreateIndex
CREATE INDEX "produccion_numbering_series_application_id_idx" ON "produccion_numbering_series"("application_id");

-- CreateIndex
CREATE UNIQUE INDEX "produccion_numbering_series_application_id_series_key_key" ON "produccion_numbering_series"("application_id", "series_key");

-- CreateIndex
CREATE INDEX "produccion_labor_rates_application_id_idx" ON "produccion_labor_rates"("application_id");

-- CreateIndex
CREATE INDEX "produccion_labor_rates_is_active_idx" ON "produccion_labor_rates"("is_active");

-- CreateIndex
CREATE INDEX "produccion_extra_cost_catalog_application_id_idx" ON "produccion_extra_cost_catalog"("application_id");

-- CreateIndex
CREATE INDEX "produccion_furniture_labor_entries_furniture_id_idx" ON "produccion_furniture_labor_entries"("furniture_id");

-- CreateIndex
CREATE INDEX "produccion_furniture_extra_expenses_furniture_id_idx" ON "produccion_furniture_extra_expenses"("furniture_id");

-- CreateIndex
CREATE INDEX "produccion_furniture_cost_snapshots_furniture_id_idx" ON "produccion_furniture_cost_snapshots"("furniture_id");

-- CreateIndex
CREATE INDEX "produccion_furniture_application_id_idx" ON "produccion_furniture"("application_id");

-- CreateIndex
CREATE INDEX "produccion_furniture_category_idx" ON "produccion_furniture"("category");

-- CreateIndex
CREATE INDEX "produccion_furniture_is_active_idx" ON "produccion_furniture"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "produccion_furniture_application_id_code_key" ON "produccion_furniture"("application_id", "code");

-- CreateIndex
CREATE INDEX "produccion_furniture_images_furniture_id_idx" ON "produccion_furniture_images"("furniture_id");

-- CreateIndex
CREATE INDEX "produccion_furniture_bom_lines_furniture_id_idx" ON "produccion_furniture_bom_lines"("furniture_id");

-- CreateIndex
CREATE INDEX "produccion_materials_application_id_idx" ON "produccion_materials"("application_id");

-- CreateIndex
CREATE INDEX "produccion_materials_category_idx" ON "produccion_materials"("category");

-- CreateIndex
CREATE INDEX "produccion_materials_is_active_idx" ON "produccion_materials"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "produccion_materials_application_id_code_key" ON "produccion_materials"("application_id", "code");

-- CreateIndex
CREATE INDEX "produccion_stock_movements_material_id_idx" ON "produccion_stock_movements"("material_id");

-- CreateIndex
CREATE INDEX "produccion_stock_movements_movement_type_idx" ON "produccion_stock_movements"("movement_type");

-- CreateIndex
CREATE INDEX "produccion_stock_movements_created_at_idx" ON "produccion_stock_movements"("created_at");

-- CreateIndex
CREATE INDEX "produccion_suppliers_application_id_idx" ON "produccion_suppliers"("application_id");

-- CreateIndex
CREATE INDEX "produccion_suppliers_is_active_idx" ON "produccion_suppliers"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "produccion_suppliers_application_id_ruc_key" ON "produccion_suppliers"("application_id", "ruc");

-- CreateIndex
CREATE INDEX "produccion_supplier_material_links_supplier_id_idx" ON "produccion_supplier_material_links"("supplier_id");

-- CreateIndex
CREATE INDEX "produccion_supplier_material_links_material_id_idx" ON "produccion_supplier_material_links"("material_id");

-- CreateIndex
CREATE UNIQUE INDEX "produccion_supplier_material_links_supplier_id_material_id_key" ON "produccion_supplier_material_links"("supplier_id", "material_id");

-- CreateIndex
CREATE INDEX "produccion_purchase_orders_application_id_idx" ON "produccion_purchase_orders"("application_id");

-- CreateIndex
CREATE INDEX "produccion_purchase_orders_supplier_id_idx" ON "produccion_purchase_orders"("supplier_id");

-- CreateIndex
CREATE INDEX "produccion_purchase_orders_status_idx" ON "produccion_purchase_orders"("status");

-- CreateIndex
CREATE INDEX "produccion_purchase_orders_ordered_at_idx" ON "produccion_purchase_orders"("ordered_at");

-- CreateIndex
CREATE UNIQUE INDEX "produccion_purchase_orders_application_id_code_key" ON "produccion_purchase_orders"("application_id", "code");

-- CreateIndex
CREATE INDEX "produccion_purchase_order_lines_purchase_order_id_idx" ON "produccion_purchase_order_lines"("purchase_order_id");

-- CreateIndex
CREATE INDEX "produccion_purchase_order_lines_material_id_idx" ON "produccion_purchase_order_lines"("material_id");

-- CreateIndex
CREATE INDEX "produccion_quotations_application_id_idx" ON "produccion_quotations"("application_id");

-- CreateIndex
CREATE INDEX "produccion_quotations_client_id_idx" ON "produccion_quotations"("client_id");

-- CreateIndex
CREATE INDEX "produccion_quotations_status_idx" ON "produccion_quotations"("status");

-- CreateIndex
CREATE UNIQUE INDEX "produccion_quotations_application_id_code_key" ON "produccion_quotations"("application_id", "code");

-- CreateIndex
CREATE INDEX "produccion_quotation_lines_quotation_id_idx" ON "produccion_quotation_lines"("quotation_id");

-- CreateIndex
CREATE INDEX "produccion_quotation_lines_furniture_id_idx" ON "produccion_quotation_lines"("furniture_id");

-- CreateIndex
CREATE UNIQUE INDEX "produccion_orders_quotation_id_key" ON "produccion_orders"("quotation_id");

-- CreateIndex
CREATE UNIQUE INDEX "produccion_orders_work_order_id_key" ON "produccion_orders"("work_order_id");

-- CreateIndex
CREATE INDEX "produccion_orders_application_id_idx" ON "produccion_orders"("application_id");

-- CreateIndex
CREATE INDEX "produccion_orders_client_id_idx" ON "produccion_orders"("client_id");

-- CreateIndex
CREATE INDEX "produccion_orders_status_idx" ON "produccion_orders"("status");

-- CreateIndex
CREATE UNIQUE INDEX "produccion_orders_application_id_code_key" ON "produccion_orders"("application_id", "code");

-- CreateIndex
CREATE INDEX "produccion_order_lines_order_id_idx" ON "produccion_order_lines"("order_id");

-- CreateIndex
CREATE INDEX "produccion_order_lines_furniture_id_idx" ON "produccion_order_lines"("furniture_id");

-- CreateIndex
CREATE INDEX "produccion_deliveries_application_id_idx" ON "produccion_deliveries"("application_id");

-- CreateIndex
CREATE INDEX "produccion_deliveries_order_id_idx" ON "produccion_deliveries"("order_id");

-- CreateIndex
CREATE INDEX "produccion_deliveries_status_idx" ON "produccion_deliveries"("status");

-- CreateIndex
CREATE UNIQUE INDEX "produccion_deliveries_application_id_code_key" ON "produccion_deliveries"("application_id", "code");

-- CreateIndex
CREATE INDEX "produccion_work_orders_application_id_idx" ON "produccion_work_orders"("application_id");

-- CreateIndex
CREATE INDEX "produccion_work_orders_client_id_idx" ON "produccion_work_orders"("client_id");

-- CreateIndex
CREATE INDEX "produccion_work_orders_status_idx" ON "produccion_work_orders"("status");

-- CreateIndex
CREATE INDEX "produccion_work_orders_current_stage_key_idx" ON "produccion_work_orders"("current_stage_key");

-- CreateIndex
CREATE INDEX "produccion_work_orders_priority_idx" ON "produccion_work_orders"("priority");

-- CreateIndex
CREATE UNIQUE INDEX "produccion_work_orders_application_id_code_key" ON "produccion_work_orders"("application_id", "code");

-- CreateIndex
CREATE INDEX "produccion_work_order_lines_work_order_id_idx" ON "produccion_work_order_lines"("work_order_id");

-- CreateIndex
CREATE INDEX "produccion_work_order_lines_furniture_id_idx" ON "produccion_work_order_lines"("furniture_id");

-- CreateIndex
CREATE INDEX "produccion_work_order_stages_work_order_id_idx" ON "produccion_work_order_stages"("work_order_id");

-- CreateIndex
CREATE INDEX "produccion_work_order_stages_status_idx" ON "produccion_work_order_stages"("status");

-- CreateIndex
CREATE UNIQUE INDEX "produccion_work_order_stages_work_order_id_stage_key_key" ON "produccion_work_order_stages"("work_order_id", "stage_key");

-- CreateIndex
CREATE INDEX "produccion_work_order_material_consumptions_work_order_id_idx" ON "produccion_work_order_material_consumptions"("work_order_id");

-- CreateIndex
CREATE INDEX "produccion_work_order_material_consumptions_material_id_idx" ON "produccion_work_order_material_consumptions"("material_id");

-- CreateIndex
CREATE INDEX "properties_application_id_idx" ON "properties"("application_id");

-- CreateIndex
CREATE INDEX "properties_property_type_id_idx" ON "properties"("property_type_id");

-- CreateIndex
CREATE INDEX "properties_district_id_idx" ON "properties"("district_id");

-- CreateIndex
CREATE INDEX "properties_owner_id_idx" ON "properties"("owner_id");

-- CreateIndex
CREATE INDEX "properties_deleted_at_idx" ON "properties"("deleted_at");

-- CreateIndex
CREATE INDEX "property_owners_property_id_idx" ON "property_owners"("property_id");

-- CreateIndex
CREATE INDEX "property_owners_owner_client_id_idx" ON "property_owners"("owner_client_id");

-- CreateIndex
CREATE UNIQUE INDEX "property_owners_property_id_owner_client_id_key" ON "property_owners"("property_id", "owner_client_id");

-- CreateIndex
CREATE INDEX "rentals_application_id_idx" ON "rentals"("application_id");

-- CreateIndex
CREATE INDEX "rentals_property_id_idx" ON "rentals"("property_id");

-- CreateIndex
CREATE INDEX "rentals_tenant_id_idx" ON "rentals"("tenant_id");

-- CreateIndex
CREATE INDEX "rentals_status_idx" ON "rentals"("status");

-- CreateIndex
CREATE INDEX "rentals_deleted_at_idx" ON "rentals"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "rental_financial_configs_rental_id_key" ON "rental_financial_configs"("rental_id");

-- CreateIndex
CREATE INDEX "rental_financial_configs_rental_id_idx" ON "rental_financial_configs"("rental_id");

-- CreateIndex
CREATE INDEX "rental_financial_configs_internal_agent_id_idx" ON "rental_financial_configs"("internal_agent_id");

-- CreateIndex
CREATE INDEX "rental_financial_configs_external_agent_id_idx" ON "rental_financial_configs"("external_agent_id");

-- CreateIndex
CREATE INDEX "payments_rental_id_idx" ON "payments"("rental_id");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE INDEX "payments_due_date_idx" ON "payments"("due_date");

-- CreateIndex
CREATE UNIQUE INDEX "payments_rental_id_period_year_period_month_key" ON "payments"("rental_id", "period_year", "period_month");

-- CreateIndex
CREATE INDEX "rental_tenants_rental_id_idx" ON "rental_tenants"("rental_id");

-- CreateIndex
CREATE INDEX "rental_tenants_client_id_idx" ON "rental_tenants"("client_id");

-- CreateIndex
CREATE UNIQUE INDEX "rental_tenants_rental_id_client_id_key" ON "rental_tenants"("rental_id", "client_id");

-- CreateIndex
CREATE INDEX "rental_attachments_rental_id_idx" ON "rental_attachments"("rental_id");

-- CreateIndex
CREATE INDEX "rental_attachments_type_idx" ON "rental_attachments"("type");

-- CreateIndex
CREATE INDEX "rental_attachments_archivo_id_idx" ON "rental_attachments"("archivo_id");

-- CreateIndex
CREATE INDEX "sale_compliance_checklists_application_id_idx" ON "sale_compliance_checklists"("application_id");

-- CreateIndex
CREATE INDEX "sale_compliance_checklists_property_id_idx" ON "sale_compliance_checklists"("property_id");

-- CreateIndex
CREATE INDEX "sale_compliance_checklists_buyer_client_id_idx" ON "sale_compliance_checklists"("buyer_client_id");

-- CreateIndex
CREATE INDEX "sale_compliance_checklists_sunarp_status_idx" ON "sale_compliance_checklists"("sunarp_status");

-- CreateIndex
CREATE INDEX "sale_compliance_checklists_payment_evidence_archivo_id_idx" ON "sale_compliance_checklists"("payment_evidence_archivo_id");

-- CreateIndex
CREATE UNIQUE INDEX "sale_compliance_checklists_application_id_property_id_buyer_key" ON "sale_compliance_checklists"("application_id", "property_id", "buyer_client_id");

-- CreateIndex
CREATE INDEX "sale_compliance_documents_checklist_id_idx" ON "sale_compliance_documents"("checklist_id");

-- CreateIndex
CREATE INDEX "sale_compliance_documents_doc_type_idx" ON "sale_compliance_documents"("doc_type");

-- CreateIndex
CREATE INDEX "sale_compliance_documents_archivo_id_idx" ON "sale_compliance_documents"("archivo_id");

-- CreateIndex
CREATE INDEX "ventas_pipeline_stage_configs_application_id_idx" ON "ventas_pipeline_stage_configs"("application_id");

-- CreateIndex
CREATE UNIQUE INDEX "ventas_pipeline_stage_configs_application_id_code_key" ON "ventas_pipeline_stage_configs"("application_id", "code");

-- CreateIndex
CREATE INDEX "ventas_numbering_series_application_id_idx" ON "ventas_numbering_series"("application_id");

-- CreateIndex
CREATE UNIQUE INDEX "ventas_numbering_series_application_id_series_key_key" ON "ventas_numbering_series"("application_id", "series_key");

-- CreateIndex
CREATE INDEX "sale_processes_application_id_idx" ON "sale_processes"("application_id");

-- CreateIndex
CREATE INDEX "sale_processes_buyer_client_id_idx" ON "sale_processes"("buyer_client_id");

-- CreateIndex
CREATE INDEX "sale_processes_property_id_idx" ON "sale_processes"("property_id");

-- CreateIndex
CREATE INDEX "sale_processes_agent_id_idx" ON "sale_processes"("agent_id");

-- CreateIndex
CREATE INDEX "sale_processes_pipeline_stage_idx" ON "sale_processes"("pipeline_stage");

-- CreateIndex
CREATE INDEX "sale_processes_status_idx" ON "sale_processes"("status");

-- CreateIndex
CREATE UNIQUE INDEX "sale_processes_application_id_code_key" ON "sale_processes"("application_id", "code");

-- CreateIndex
CREATE INDEX "sale_process_buyers_buyer_client_id_idx" ON "sale_process_buyers"("buyer_client_id");

-- CreateIndex
CREATE INDEX "sale_process_buyers_sale_process_id_is_primary_idx" ON "sale_process_buyers"("sale_process_id", "is_primary");

-- CreateIndex
CREATE UNIQUE INDEX "sale_process_buyers_sale_process_id_buyer_client_id_key" ON "sale_process_buyers"("sale_process_id", "buyer_client_id");

-- CreateIndex
CREATE INDEX "sale_process_owners_owner_client_id_idx" ON "sale_process_owners"("owner_client_id");

-- CreateIndex
CREATE UNIQUE INDEX "sale_process_owners_sale_process_id_owner_client_id_key" ON "sale_process_owners"("sale_process_id", "owner_client_id");

-- CreateIndex
CREATE INDEX "sale_process_notes_sale_process_id_idx" ON "sale_process_notes"("sale_process_id");

-- CreateIndex
CREATE INDEX "sale_process_activities_sale_process_id_idx" ON "sale_process_activities"("sale_process_id");

-- CreateIndex
CREATE INDEX "sale_process_reminders_sale_process_id_idx" ON "sale_process_reminders"("sale_process_id");

-- CreateIndex
CREATE INDEX "sale_process_reminders_due_at_idx" ON "sale_process_reminders"("due_at");

-- CreateIndex
CREATE INDEX "sale_separations_application_id_idx" ON "sale_separations"("application_id");

-- CreateIndex
CREATE INDEX "sale_separations_property_id_idx" ON "sale_separations"("property_id");

-- CreateIndex
CREATE INDEX "sale_separations_buyer_client_id_idx" ON "sale_separations"("buyer_client_id");

-- CreateIndex
CREATE INDEX "sale_separations_status_idx" ON "sale_separations"("status");

-- CreateIndex
CREATE UNIQUE INDEX "sale_closings_sale_separation_id_key" ON "sale_closings"("sale_separation_id");

-- CreateIndex
CREATE INDEX "sale_closings_application_id_idx" ON "sale_closings"("application_id");

-- CreateIndex
CREATE INDEX "sale_closings_property_id_idx" ON "sale_closings"("property_id");

-- CreateIndex
CREATE INDEX "sale_closings_buyer_client_id_idx" ON "sale_closings"("buyer_client_id");

-- CreateIndex
CREATE INDEX "sale_commissions_application_id_idx" ON "sale_commissions"("application_id");

-- CreateIndex
CREATE INDEX "sale_commissions_agent_id_idx" ON "sale_commissions"("agent_id");

-- CreateIndex
CREATE INDEX "sale_commissions_status_idx" ON "sale_commissions"("status");

-- CreateIndex
CREATE INDEX "sale_commissions_sale_process_id_idx" ON "sale_commissions"("sale_process_id");

-- CreateIndex
CREATE INDEX "sale_commissions_sale_closing_id_idx" ON "sale_commissions"("sale_closing_id");

-- CreateIndex
CREATE UNIQUE INDEX "sale_commissions_sale_process_id_agent_id_key" ON "sale_commissions"("sale_process_id", "agent_id");

-- CreateIndex
CREATE INDEX "sale_commission_payment_parts_sale_commission_id_idx" ON "sale_commission_payment_parts"("sale_commission_id");

-- CreateIndex
CREATE INDEX "sale_commission_payment_parts_status_idx" ON "sale_commission_payment_parts"("status");

-- CreateIndex
CREATE UNIQUE INDEX "sale_commission_payment_parts_sale_commission_id_part_numbe_key" ON "sale_commission_payment_parts"("sale_commission_id", "part_number");

-- CreateIndex
CREATE INDEX "sale_commission_deductibles_sale_commission_id_idx" ON "sale_commission_deductibles"("sale_commission_id");

-- CreateIndex
CREATE INDEX "sale_buyer_payments_sale_closing_id_idx" ON "sale_buyer_payments"("sale_closing_id");

-- CreateIndex
CREATE INDEX "sale_buyer_payments_status_idx" ON "sale_buyer_payments"("status");

-- CreateIndex
CREATE INDEX "sale_buyer_payments_due_date_idx" ON "sale_buyer_payments"("due_date");

-- CreateIndex
CREATE INDEX "sale_documentation_costs_application_id_idx" ON "sale_documentation_costs"("application_id");

-- CreateIndex
CREATE INDEX "sale_documentation_costs_sale_closing_id_idx" ON "sale_documentation_costs"("sale_closing_id");

-- CreateIndex
CREATE INDEX "ventas_agent_commission_profiles_application_id_idx" ON "ventas_agent_commission_profiles"("application_id");

-- CreateIndex
CREATE INDEX "ventas_agent_commission_profiles_agent_id_idx" ON "ventas_agent_commission_profiles"("agent_id");

-- CreateIndex
CREATE UNIQUE INDEX "ventas_agent_commission_profiles_application_id_agent_id_key" ON "ventas_agent_commission_profiles"("application_id", "agent_id");

-- AddForeignKey
ALTER TABLE "agents" ADD CONSTRAINT "agents_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agents" ADD CONSTRAINT "agents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agents" ADD CONSTRAINT "agents_document_type_id_fkey" FOREIGN KEY ("document_type_id") REFERENCES "document_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_configs" ADD CONSTRAINT "alert_configs_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alert_configs" ADD CONSTRAINT "alert_configs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menus" ADD CONSTRAINT "menus_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menus" ADD CONSTRAINT "menus_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "menus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_applications" ADD CONSTRAINT "role_applications_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_applications" ADD CONSTRAINT "role_applications_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arquitectura_calendar_events" ADD CONSTRAINT "arquitectura_calendar_events_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arquitectura_calendar_events" ADD CONSTRAINT "arquitectura_calendar_events_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "arquitectura_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arquitectura_calendar_events" ADD CONSTRAINT "arquitectura_calendar_events_assigned_agent_id_fkey" FOREIGN KEY ("assigned_agent_id") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arquitectura_project_stage_configs" ADD CONSTRAINT "arquitectura_project_stage_configs_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arquitectura_numbering_series" ADD CONSTRAINT "arquitectura_numbering_series_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arquitectura_execution_tasks" ADD CONSTRAINT "arquitectura_execution_tasks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "arquitectura_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arquitectura_execution_evidences" ADD CONSTRAINT "arquitectura_execution_evidences_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "arquitectura_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arquitectura_execution_evidences" ADD CONSTRAINT "arquitectura_execution_evidences_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "arquitectura_execution_tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arquitectura_execution_evidences" ADD CONSTRAINT "arquitectura_execution_evidences_archivo_id_fkey" FOREIGN KEY ("archivo_id") REFERENCES "gen_archivos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arquitectura_execution_incidents" ADD CONSTRAINT "arquitectura_execution_incidents_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "arquitectura_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arquitectura_execution_actual_costs" ADD CONSTRAINT "arquitectura_execution_actual_costs_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "arquitectura_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arquitectura_execution_actual_costs" ADD CONSTRAINT "arquitectura_execution_actual_costs_catalog_material_id_fkey" FOREIGN KEY ("catalog_material_id") REFERENCES "arquitectura_catalog_materials"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arquitectura_finance_income_schedules" ADD CONSTRAINT "arquitectura_finance_income_schedules_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "arquitectura_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arquitectura_catalog_materials" ADD CONSTRAINT "arquitectura_catalog_materials_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arquitectura_catalog_material_images" ADD CONSTRAINT "arquitectura_catalog_material_images_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "arquitectura_catalog_materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arquitectura_material_suppliers" ADD CONSTRAINT "arquitectura_material_suppliers_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arquitectura_supplier_catalog_links" ADD CONSTRAINT "arquitectura_supplier_catalog_links_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "arquitectura_material_suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arquitectura_supplier_catalog_links" ADD CONSTRAINT "arquitectura_supplier_catalog_links_catalog_material_id_fkey" FOREIGN KEY ("catalog_material_id") REFERENCES "arquitectura_catalog_materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arquitectura_material_purchases" ADD CONSTRAINT "arquitectura_material_purchases_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "arquitectura_material_suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arquitectura_material_purchases" ADD CONSTRAINT "arquitectura_material_purchases_catalog_material_id_fkey" FOREIGN KEY ("catalog_material_id") REFERENCES "arquitectura_catalog_materials"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arquitectura_project_sections" ADD CONSTRAINT "arquitectura_project_sections_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "arquitectura_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arquitectura_project_line_items" ADD CONSTRAINT "arquitectura_project_line_items_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "arquitectura_project_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arquitectura_project_line_items" ADD CONSTRAINT "arquitectura_project_line_items_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "arquitectura_material_suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arquitectura_line_item_supplier_payments" ADD CONSTRAINT "arquitectura_line_item_supplier_payments_line_item_id_fkey" FOREIGN KEY ("line_item_id") REFERENCES "arquitectura_project_line_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arquitectura_projects" ADD CONSTRAINT "arquitectura_projects_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arquitectura_projects" ADD CONSTRAINT "arquitectura_projects_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arquitectura_projects" ADD CONSTRAINT "arquitectura_projects_designer_agent_id_fkey" FOREIGN KEY ("designer_agent_id") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arquitectura_projects" ADD CONSTRAINT "arquitectura_projects_architect_jr_agent_id_fkey" FOREIGN KEY ("architect_jr_agent_id") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arquitectura_projects" ADD CONSTRAINT "arquitectura_projects_architect_agent_id_fkey" FOREIGN KEY ("architect_agent_id") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arquitectura_projects" ADD CONSTRAINT "arquitectura_projects_supervisor_agent_id_fkey" FOREIGN KEY ("supervisor_agent_id") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arquitectura_projects" ADD CONSTRAINT "arquitectura_projects_commercial_agent_id_fkey" FOREIGN KEY ("commercial_agent_id") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arquitectura_project_payments" ADD CONSTRAINT "arquitectura_project_payments_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "arquitectura_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arquitectura_project_payments" ADD CONSTRAINT "arquitectura_project_payments_schedule_item_id_fkey" FOREIGN KEY ("schedule_item_id") REFERENCES "arquitectura_finance_income_schedules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arquitectura_project_documents" ADD CONSTRAINT "arquitectura_project_documents_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "arquitectura_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arquitectura_project_documents" ADD CONSTRAINT "arquitectura_project_documents_archivo_id_fkey" FOREIGN KEY ("archivo_id") REFERENCES "gen_archivos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arquitectura_project_milestones" ADD CONSTRAINT "arquitectura_project_milestones_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "arquitectura_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_codes" ADD CONSTRAINT "password_reset_codes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_document_type_id_fkey" FOREIGN KEY ("document_type_id") REFERENCES "document_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_assigned_agent_id_fkey" FOREIGN KEY ("assigned_agent_id") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_district_id_fkey" FOREIGN KEY ("district_id") REFERENCES "districts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_accounts" ADD CONSTRAINT "contabilidad_accounts_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_accounts" ADD CONSTRAINT "contabilidad_accounts_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "contabilidad_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_company_profiles" ADD CONSTRAINT "contabilidad_company_profiles_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_app_settings" ADD CONSTRAINT "contabilidad_app_settings_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_document_series" ADD CONSTRAINT "contabilidad_document_series_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_cpe_provider_configs" ADD CONSTRAINT "contabilidad_cpe_provider_configs_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_cpe_provider_configs" ADD CONSTRAINT "contabilidad_cpe_provider_configs_legal_entity_id_fkey" FOREIGN KEY ("legal_entity_id") REFERENCES "contabilidad_legal_entities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_exchange_rates" ADD CONSTRAINT "contabilidad_exchange_rates_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_journal_templates" ADD CONSTRAINT "contabilidad_journal_templates_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_journal_template_lines" ADD CONSTRAINT "contabilidad_journal_template_lines_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "contabilidad_journal_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_journal_template_lines" ADD CONSTRAINT "contabilidad_journal_template_lines_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "contabilidad_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_journal_template_lines" ADD CONSTRAINT "contabilidad_journal_template_lines_cost_center_id_fkey" FOREIGN KEY ("cost_center_id") REFERENCES "contabilidad_cost_centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_inventory_balance_snapshots" ADD CONSTRAINT "contabilidad_inventory_balance_snapshots_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_inventory_balance_snapshots" ADD CONSTRAINT "contabilidad_inventory_balance_snapshots_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "contabilidad_periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_inventory_balance_snapshots" ADD CONSTRAINT "contabilidad_inventory_balance_snapshots_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "contabilidad_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_electronic_document_logs" ADD CONSTRAINT "contabilidad_electronic_document_logs_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_electronic_document_logs" ADD CONSTRAINT "contabilidad_electronic_document_logs_legal_entity_id_fkey" FOREIGN KEY ("legal_entity_id") REFERENCES "contabilidad_legal_entities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_electronic_document_logs" ADD CONSTRAINT "contabilidad_electronic_document_logs_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "contabilidad_periods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_income_tax_period_summaries" ADD CONSTRAINT "contabilidad_income_tax_period_summaries_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_income_tax_period_summaries" ADD CONSTRAINT "contabilidad_income_tax_period_summaries_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "contabilidad_periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_ple_export_logs" ADD CONSTRAINT "contabilidad_ple_export_logs_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_ple_export_logs" ADD CONSTRAINT "contabilidad_ple_export_logs_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "contabilidad_periods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_inventory_items" ADD CONSTRAINT "contabilidad_inventory_items_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_inventory_items" ADD CONSTRAINT "contabilidad_inventory_items_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "contabilidad_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_inventory_movements" ADD CONSTRAINT "contabilidad_inventory_movements_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_inventory_movements" ADD CONSTRAINT "contabilidad_inventory_movements_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "contabilidad_inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_inventory_movements" ADD CONSTRAINT "contabilidad_inventory_movements_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "contabilidad_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_inventory_movements" ADD CONSTRAINT "contabilidad_inventory_movements_journal_entry_id_fkey" FOREIGN KEY ("journal_entry_id") REFERENCES "contabilidad_journal_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_journal_entries" ADD CONSTRAINT "contabilidad_journal_entries_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_journal_entries" ADD CONSTRAINT "contabilidad_journal_entries_legal_entity_id_fkey" FOREIGN KEY ("legal_entity_id") REFERENCES "contabilidad_legal_entities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_journal_entries" ADD CONSTRAINT "contabilidad_journal_entries_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "contabilidad_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_journal_entries" ADD CONSTRAINT "contabilidad_journal_entries_reversal_of_id_fkey" FOREIGN KEY ("reversal_of_id") REFERENCES "contabilidad_journal_entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_journal_entry_lines" ADD CONSTRAINT "contabilidad_journal_entry_lines_journal_entry_id_fkey" FOREIGN KEY ("journal_entry_id") REFERENCES "contabilidad_journal_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_journal_entry_lines" ADD CONSTRAINT "contabilidad_journal_entry_lines_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "contabilidad_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_journal_entry_lines" ADD CONSTRAINT "contabilidad_journal_entry_lines_cost_center_id_fkey" FOREIGN KEY ("cost_center_id") REFERENCES "contabilidad_cost_centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_legal_entities" ADD CONSTRAINT "contabilidad_legal_entities_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_audit_logs" ADD CONSTRAINT "contabilidad_audit_logs_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_audit_logs" ADD CONSTRAINT "contabilidad_audit_logs_legal_entity_id_fkey" FOREIGN KEY ("legal_entity_id") REFERENCES "contabilidad_legal_entities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_periods" ADD CONSTRAINT "contabilidad_periods_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_periods" ADD CONSTRAINT "contabilidad_periods_legal_entity_id_fkey" FOREIGN KEY ("legal_entity_id") REFERENCES "contabilidad_legal_entities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_cost_centers" ADD CONSTRAINT "contabilidad_cost_centers_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_cost_centers" ADD CONSTRAINT "contabilidad_cost_centers_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "contabilidad_cost_centers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_suppliers" ADD CONSTRAINT "contabilidad_suppliers_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_purchase_invoices" ADD CONSTRAINT "contabilidad_purchase_invoices_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_purchase_invoices" ADD CONSTRAINT "contabilidad_purchase_invoices_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "contabilidad_suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_purchase_invoices" ADD CONSTRAINT "contabilidad_purchase_invoices_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "contabilidad_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_purchase_invoices" ADD CONSTRAINT "contabilidad_purchase_invoices_expense_account_id_fkey" FOREIGN KEY ("expense_account_id") REFERENCES "contabilidad_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_purchase_invoices" ADD CONSTRAINT "contabilidad_purchase_invoices_journal_entry_id_fkey" FOREIGN KEY ("journal_entry_id") REFERENCES "contabilidad_journal_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_purchase_credit_notes" ADD CONSTRAINT "contabilidad_purchase_credit_notes_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_purchase_credit_notes" ADD CONSTRAINT "contabilidad_purchase_credit_notes_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "contabilidad_suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_purchase_credit_notes" ADD CONSTRAINT "contabilidad_purchase_credit_notes_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "contabilidad_purchase_invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_purchase_credit_notes" ADD CONSTRAINT "contabilidad_purchase_credit_notes_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "contabilidad_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_purchase_credit_notes" ADD CONSTRAINT "contabilidad_purchase_credit_notes_journal_entry_id_fkey" FOREIGN KEY ("journal_entry_id") REFERENCES "contabilidad_journal_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_purchase_debit_notes" ADD CONSTRAINT "contabilidad_purchase_debit_notes_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_purchase_debit_notes" ADD CONSTRAINT "contabilidad_purchase_debit_notes_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "contabilidad_suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_purchase_debit_notes" ADD CONSTRAINT "contabilidad_purchase_debit_notes_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "contabilidad_purchase_invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_purchase_debit_notes" ADD CONSTRAINT "contabilidad_purchase_debit_notes_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "contabilidad_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_purchase_debit_notes" ADD CONSTRAINT "contabilidad_purchase_debit_notes_journal_entry_id_fkey" FOREIGN KEY ("journal_entry_id") REFERENCES "contabilidad_journal_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_purchase_payments" ADD CONSTRAINT "contabilidad_purchase_payments_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_purchase_payments" ADD CONSTRAINT "contabilidad_purchase_payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "contabilidad_purchase_invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_purchase_payments" ADD CONSTRAINT "contabilidad_purchase_payments_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "contabilidad_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_purchase_payments" ADD CONSTRAINT "contabilidad_purchase_payments_cash_box_id_fkey" FOREIGN KEY ("cash_box_id") REFERENCES "contabilidad_cash_boxes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_purchase_payments" ADD CONSTRAINT "contabilidad_purchase_payments_bank_account_id_fkey" FOREIGN KEY ("bank_account_id") REFERENCES "contabilidad_bank_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_purchase_payments" ADD CONSTRAINT "contabilidad_purchase_payments_treasury_movement_id_fkey" FOREIGN KEY ("treasury_movement_id") REFERENCES "contabilidad_treasury_movements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_customers" ADD CONSTRAINT "contabilidad_customers_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_sales_invoices" ADD CONSTRAINT "contabilidad_sales_invoices_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_sales_invoices" ADD CONSTRAINT "contabilidad_sales_invoices_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "contabilidad_customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_sales_invoices" ADD CONSTRAINT "contabilidad_sales_invoices_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "contabilidad_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_sales_invoices" ADD CONSTRAINT "contabilidad_sales_invoices_income_account_id_fkey" FOREIGN KEY ("income_account_id") REFERENCES "contabilidad_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_sales_invoices" ADD CONSTRAINT "contabilidad_sales_invoices_journal_entry_id_fkey" FOREIGN KEY ("journal_entry_id") REFERENCES "contabilidad_journal_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_sales_invoices" ADD CONSTRAINT "contabilidad_sales_invoices_electronic_log_id_fkey" FOREIGN KEY ("electronic_log_id") REFERENCES "contabilidad_electronic_document_logs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_sales_credit_notes" ADD CONSTRAINT "contabilidad_sales_credit_notes_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_sales_credit_notes" ADD CONSTRAINT "contabilidad_sales_credit_notes_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "contabilidad_customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_sales_credit_notes" ADD CONSTRAINT "contabilidad_sales_credit_notes_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "contabilidad_sales_invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_sales_credit_notes" ADD CONSTRAINT "contabilidad_sales_credit_notes_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "contabilidad_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_sales_credit_notes" ADD CONSTRAINT "contabilidad_sales_credit_notes_journal_entry_id_fkey" FOREIGN KEY ("journal_entry_id") REFERENCES "contabilidad_journal_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_sales_debit_notes" ADD CONSTRAINT "contabilidad_sales_debit_notes_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_sales_debit_notes" ADD CONSTRAINT "contabilidad_sales_debit_notes_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "contabilidad_customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_sales_debit_notes" ADD CONSTRAINT "contabilidad_sales_debit_notes_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "contabilidad_sales_invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_sales_debit_notes" ADD CONSTRAINT "contabilidad_sales_debit_notes_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "contabilidad_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_sales_debit_notes" ADD CONSTRAINT "contabilidad_sales_debit_notes_journal_entry_id_fkey" FOREIGN KEY ("journal_entry_id") REFERENCES "contabilidad_journal_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_sales_collections" ADD CONSTRAINT "contabilidad_sales_collections_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_sales_collections" ADD CONSTRAINT "contabilidad_sales_collections_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "contabilidad_sales_invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_sales_collections" ADD CONSTRAINT "contabilidad_sales_collections_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "contabilidad_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_sales_collections" ADD CONSTRAINT "contabilidad_sales_collections_cash_box_id_fkey" FOREIGN KEY ("cash_box_id") REFERENCES "contabilidad_cash_boxes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_sales_collections" ADD CONSTRAINT "contabilidad_sales_collections_bank_account_id_fkey" FOREIGN KEY ("bank_account_id") REFERENCES "contabilidad_bank_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_sales_collections" ADD CONSTRAINT "contabilidad_sales_collections_treasury_movement_id_fkey" FOREIGN KEY ("treasury_movement_id") REFERENCES "contabilidad_treasury_movements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_sol_credentials" ADD CONSTRAINT "contabilidad_sol_credentials_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_sol_credentials" ADD CONSTRAINT "contabilidad_sol_credentials_legal_entity_id_fkey" FOREIGN KEY ("legal_entity_id") REFERENCES "contabilidad_legal_entities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_sunat_declaration_logs" ADD CONSTRAINT "contabilidad_sunat_declaration_logs_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_sunat_declaration_logs" ADD CONSTRAINT "contabilidad_sunat_declaration_logs_legal_entity_id_fkey" FOREIGN KEY ("legal_entity_id") REFERENCES "contabilidad_legal_entities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_sunat_declaration_logs" ADD CONSTRAINT "contabilidad_sunat_declaration_logs_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "contabilidad_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_detraccion_rates" ADD CONSTRAINT "contabilidad_detraccion_rates_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_detracciones" ADD CONSTRAINT "contabilidad_detracciones_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_detracciones" ADD CONSTRAINT "contabilidad_detracciones_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "contabilidad_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_detracciones" ADD CONSTRAINT "contabilidad_detracciones_purchase_invoice_id_fkey" FOREIGN KEY ("purchase_invoice_id") REFERENCES "contabilidad_purchase_invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_detracciones" ADD CONSTRAINT "contabilidad_detracciones_rate_id_fkey" FOREIGN KEY ("rate_id") REFERENCES "contabilidad_detraccion_rates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_detracciones" ADD CONSTRAINT "contabilidad_detracciones_treasury_movement_id_fkey" FOREIGN KEY ("treasury_movement_id") REFERENCES "contabilidad_treasury_movements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_detracciones" ADD CONSTRAINT "contabilidad_detracciones_journal_entry_id_fkey" FOREIGN KEY ("journal_entry_id") REFERENCES "contabilidad_journal_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_retentions" ADD CONSTRAINT "contabilidad_retentions_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_retentions" ADD CONSTRAINT "contabilidad_retentions_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "contabilidad_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_retentions" ADD CONSTRAINT "contabilidad_retentions_purchase_invoice_id_fkey" FOREIGN KEY ("purchase_invoice_id") REFERENCES "contabilidad_purchase_invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_retentions" ADD CONSTRAINT "contabilidad_retentions_journal_entry_id_fkey" FOREIGN KEY ("journal_entry_id") REFERENCES "contabilidad_journal_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_perceptions" ADD CONSTRAINT "contabilidad_perceptions_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_perceptions" ADD CONSTRAINT "contabilidad_perceptions_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "contabilidad_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_perceptions" ADD CONSTRAINT "contabilidad_perceptions_sales_invoice_id_fkey" FOREIGN KEY ("sales_invoice_id") REFERENCES "contabilidad_sales_invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_perceptions" ADD CONSTRAINT "contabilidad_perceptions_treasury_movement_id_fkey" FOREIGN KEY ("treasury_movement_id") REFERENCES "contabilidad_treasury_movements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_perceptions" ADD CONSTRAINT "contabilidad_perceptions_journal_entry_id_fkey" FOREIGN KEY ("journal_entry_id") REFERENCES "contabilidad_journal_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_cash_boxes" ADD CONSTRAINT "contabilidad_cash_boxes_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_cash_boxes" ADD CONSTRAINT "contabilidad_cash_boxes_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "contabilidad_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_bank_accounts" ADD CONSTRAINT "contabilidad_bank_accounts_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_bank_accounts" ADD CONSTRAINT "contabilidad_bank_accounts_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "contabilidad_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_treasury_movements" ADD CONSTRAINT "contabilidad_treasury_movements_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_treasury_movements" ADD CONSTRAINT "contabilidad_treasury_movements_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "contabilidad_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_treasury_movements" ADD CONSTRAINT "contabilidad_treasury_movements_cash_box_id_fkey" FOREIGN KEY ("cash_box_id") REFERENCES "contabilidad_cash_boxes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_treasury_movements" ADD CONSTRAINT "contabilidad_treasury_movements_bank_account_id_fkey" FOREIGN KEY ("bank_account_id") REFERENCES "contabilidad_bank_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_treasury_movements" ADD CONSTRAINT "contabilidad_treasury_movements_offset_account_id_fkey" FOREIGN KEY ("offset_account_id") REFERENCES "contabilidad_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_treasury_movements" ADD CONSTRAINT "contabilidad_treasury_movements_journal_entry_id_fkey" FOREIGN KEY ("journal_entry_id") REFERENCES "contabilidad_journal_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_treasury_movements" ADD CONSTRAINT "contabilidad_treasury_movements_reconciliation_id_fkey" FOREIGN KEY ("reconciliation_id") REFERENCES "contabilidad_bank_reconciliations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_bank_reconciliations" ADD CONSTRAINT "contabilidad_bank_reconciliations_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_bank_reconciliations" ADD CONSTRAINT "contabilidad_bank_reconciliations_bank_account_id_fkey" FOREIGN KEY ("bank_account_id") REFERENCES "contabilidad_bank_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contabilidad_bank_reconciliations" ADD CONSTRAINT "contabilidad_bank_reconciliations_period_id_fkey" FOREIGN KEY ("period_id") REFERENCES "contabilidad_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gen_archivos" ADD CONSTRAINT "gen_archivos_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provinces" ADD CONSTRAINT "provinces_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "districts" ADD CONSTRAINT "districts_province_id_fkey" FOREIGN KEY ("province_id") REFERENCES "provinces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interior_calendar_events" ADD CONSTRAINT "interior_calendar_events_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interior_calendar_events" ADD CONSTRAINT "interior_calendar_events_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "interior_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interior_calendar_events" ADD CONSTRAINT "interior_calendar_events_assigned_agent_id_fkey" FOREIGN KEY ("assigned_agent_id") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interiorismo_project_stage_configs" ADD CONSTRAINT "interiorismo_project_stage_configs_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interiorismo_numbering_series" ADD CONSTRAINT "interiorismo_numbering_series_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interior_execution_tasks" ADD CONSTRAINT "interior_execution_tasks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "interior_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interior_execution_evidences" ADD CONSTRAINT "interior_execution_evidences_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "interior_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interior_execution_evidences" ADD CONSTRAINT "interior_execution_evidences_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "interior_execution_tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interior_execution_evidences" ADD CONSTRAINT "interior_execution_evidences_archivo_id_fkey" FOREIGN KEY ("archivo_id") REFERENCES "gen_archivos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interior_execution_incidents" ADD CONSTRAINT "interior_execution_incidents_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "interior_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interior_execution_actual_costs" ADD CONSTRAINT "interior_execution_actual_costs_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "interior_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interior_execution_actual_costs" ADD CONSTRAINT "interior_execution_actual_costs_catalog_material_id_fkey" FOREIGN KEY ("catalog_material_id") REFERENCES "interior_catalog_materials"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interior_finance_income_schedules" ADD CONSTRAINT "interior_finance_income_schedules_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "interior_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interior_catalog_materials" ADD CONSTRAINT "interior_catalog_materials_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interior_catalog_material_images" ADD CONSTRAINT "interior_catalog_material_images_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "interior_catalog_materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interior_material_suppliers" ADD CONSTRAINT "interior_material_suppliers_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interior_supplier_catalog_links" ADD CONSTRAINT "interior_supplier_catalog_links_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "interior_material_suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interior_supplier_catalog_links" ADD CONSTRAINT "interior_supplier_catalog_links_catalog_material_id_fkey" FOREIGN KEY ("catalog_material_id") REFERENCES "interior_catalog_materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interior_material_purchases" ADD CONSTRAINT "interior_material_purchases_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "interior_material_suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interior_material_purchases" ADD CONSTRAINT "interior_material_purchases_catalog_material_id_fkey" FOREIGN KEY ("catalog_material_id") REFERENCES "interior_catalog_materials"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interior_project_sections" ADD CONSTRAINT "interior_project_sections_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "interior_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interior_project_line_items" ADD CONSTRAINT "interior_project_line_items_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "interior_project_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interior_project_line_items" ADD CONSTRAINT "interior_project_line_items_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "interior_material_suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interior_line_item_supplier_payments" ADD CONSTRAINT "interior_line_item_supplier_payments_line_item_id_fkey" FOREIGN KEY ("line_item_id") REFERENCES "interior_project_line_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interior_projects" ADD CONSTRAINT "interior_projects_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interior_projects" ADD CONSTRAINT "interior_projects_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interior_projects" ADD CONSTRAINT "interior_projects_designer_agent_id_fkey" FOREIGN KEY ("designer_agent_id") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interior_projects" ADD CONSTRAINT "interior_projects_architect_jr_agent_id_fkey" FOREIGN KEY ("architect_jr_agent_id") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interior_projects" ADD CONSTRAINT "interior_projects_architect_agent_id_fkey" FOREIGN KEY ("architect_agent_id") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interior_projects" ADD CONSTRAINT "interior_projects_supervisor_agent_id_fkey" FOREIGN KEY ("supervisor_agent_id") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interior_projects" ADD CONSTRAINT "interior_projects_commercial_agent_id_fkey" FOREIGN KEY ("commercial_agent_id") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interior_project_materials" ADD CONSTRAINT "interior_project_materials_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "interior_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interior_project_documents" ADD CONSTRAINT "interior_project_documents_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "interior_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interior_project_documents" ADD CONSTRAINT "interior_project_documents_archivo_id_fkey" FOREIGN KEY ("archivo_id") REFERENCES "gen_archivos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interior_project_payments" ADD CONSTRAINT "interior_project_payments_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "interior_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interior_project_payments" ADD CONSTRAINT "interior_project_payments_schedule_item_id_fkey" FOREIGN KEY ("schedule_item_id") REFERENCES "interior_finance_income_schedules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interior_project_activities" ADD CONSTRAINT "interior_project_activities_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "interior_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interior_project_milestones" ADD CONSTRAINT "interior_project_milestones_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "interior_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produccion_app_settings" ADD CONSTRAINT "produccion_app_settings_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produccion_furniture_category_configs" ADD CONSTRAINT "produccion_furniture_category_configs_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produccion_material_category_configs" ADD CONSTRAINT "produccion_material_category_configs_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produccion_production_stage_configs" ADD CONSTRAINT "produccion_production_stage_configs_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produccion_unit_configs" ADD CONSTRAINT "produccion_unit_configs_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produccion_numbering_series" ADD CONSTRAINT "produccion_numbering_series_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produccion_labor_rates" ADD CONSTRAINT "produccion_labor_rates_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produccion_extra_cost_catalog" ADD CONSTRAINT "produccion_extra_cost_catalog_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produccion_furniture_labor_entries" ADD CONSTRAINT "produccion_furniture_labor_entries_furniture_id_fkey" FOREIGN KEY ("furniture_id") REFERENCES "produccion_furniture"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produccion_furniture_labor_entries" ADD CONSTRAINT "produccion_furniture_labor_entries_labor_rate_id_fkey" FOREIGN KEY ("labor_rate_id") REFERENCES "produccion_labor_rates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produccion_furniture_extra_expenses" ADD CONSTRAINT "produccion_furniture_extra_expenses_furniture_id_fkey" FOREIGN KEY ("furniture_id") REFERENCES "produccion_furniture"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produccion_furniture_extra_expenses" ADD CONSTRAINT "produccion_furniture_extra_expenses_catalog_item_id_fkey" FOREIGN KEY ("catalog_item_id") REFERENCES "produccion_extra_cost_catalog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produccion_furniture_cost_snapshots" ADD CONSTRAINT "produccion_furniture_cost_snapshots_furniture_id_fkey" FOREIGN KEY ("furniture_id") REFERENCES "produccion_furniture"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produccion_furniture" ADD CONSTRAINT "produccion_furniture_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produccion_furniture_images" ADD CONSTRAINT "produccion_furniture_images_furniture_id_fkey" FOREIGN KEY ("furniture_id") REFERENCES "produccion_furniture"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produccion_furniture_bom_lines" ADD CONSTRAINT "produccion_furniture_bom_lines_furniture_id_fkey" FOREIGN KEY ("furniture_id") REFERENCES "produccion_furniture"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produccion_materials" ADD CONSTRAINT "produccion_materials_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produccion_stock_movements" ADD CONSTRAINT "produccion_stock_movements_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "produccion_materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produccion_suppliers" ADD CONSTRAINT "produccion_suppliers_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produccion_supplier_material_links" ADD CONSTRAINT "produccion_supplier_material_links_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "produccion_suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produccion_supplier_material_links" ADD CONSTRAINT "produccion_supplier_material_links_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "produccion_materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produccion_purchase_orders" ADD CONSTRAINT "produccion_purchase_orders_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produccion_purchase_orders" ADD CONSTRAINT "produccion_purchase_orders_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "produccion_suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produccion_purchase_order_lines" ADD CONSTRAINT "produccion_purchase_order_lines_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "produccion_purchase_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produccion_purchase_order_lines" ADD CONSTRAINT "produccion_purchase_order_lines_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "produccion_materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produccion_quotations" ADD CONSTRAINT "produccion_quotations_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produccion_quotations" ADD CONSTRAINT "produccion_quotations_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produccion_quotation_lines" ADD CONSTRAINT "produccion_quotation_lines_quotation_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "produccion_quotations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produccion_quotation_lines" ADD CONSTRAINT "produccion_quotation_lines_furniture_id_fkey" FOREIGN KEY ("furniture_id") REFERENCES "produccion_furniture"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produccion_orders" ADD CONSTRAINT "produccion_orders_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produccion_orders" ADD CONSTRAINT "produccion_orders_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produccion_orders" ADD CONSTRAINT "produccion_orders_quotation_id_fkey" FOREIGN KEY ("quotation_id") REFERENCES "produccion_quotations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produccion_orders" ADD CONSTRAINT "produccion_orders_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "produccion_work_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produccion_order_lines" ADD CONSTRAINT "produccion_order_lines_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "produccion_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produccion_order_lines" ADD CONSTRAINT "produccion_order_lines_furniture_id_fkey" FOREIGN KEY ("furniture_id") REFERENCES "produccion_furniture"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produccion_deliveries" ADD CONSTRAINT "produccion_deliveries_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produccion_deliveries" ADD CONSTRAINT "produccion_deliveries_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "produccion_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produccion_work_orders" ADD CONSTRAINT "produccion_work_orders_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produccion_work_orders" ADD CONSTRAINT "produccion_work_orders_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produccion_work_order_lines" ADD CONSTRAINT "produccion_work_order_lines_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "produccion_work_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produccion_work_order_lines" ADD CONSTRAINT "produccion_work_order_lines_furniture_id_fkey" FOREIGN KEY ("furniture_id") REFERENCES "produccion_furniture"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produccion_work_order_stages" ADD CONSTRAINT "produccion_work_order_stages_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "produccion_work_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produccion_work_order_material_consumptions" ADD CONSTRAINT "produccion_work_order_material_consumptions_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "produccion_work_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produccion_work_order_material_consumptions" ADD CONSTRAINT "produccion_work_order_material_consumptions_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "produccion_materials"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_property_type_id_fkey" FOREIGN KEY ("property_type_id") REFERENCES "property_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_district_id_fkey" FOREIGN KEY ("district_id") REFERENCES "districts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_owners" ADD CONSTRAINT "property_owners_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_owners" ADD CONSTRAINT "property_owners_owner_client_id_fkey" FOREIGN KEY ("owner_client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rentals" ADD CONSTRAINT "rentals_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rentals" ADD CONSTRAINT "rentals_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rentals" ADD CONSTRAINT "rentals_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_financial_configs" ADD CONSTRAINT "rental_financial_configs_rental_id_fkey" FOREIGN KEY ("rental_id") REFERENCES "rentals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_financial_configs" ADD CONSTRAINT "rental_financial_configs_external_agent_id_fkey" FOREIGN KEY ("external_agent_id") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_financial_configs" ADD CONSTRAINT "rental_financial_configs_internal_agent_id_fkey" FOREIGN KEY ("internal_agent_id") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_rental_id_fkey" FOREIGN KEY ("rental_id") REFERENCES "rentals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_tenants" ADD CONSTRAINT "rental_tenants_rental_id_fkey" FOREIGN KEY ("rental_id") REFERENCES "rentals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_tenants" ADD CONSTRAINT "rental_tenants_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_attachments" ADD CONSTRAINT "rental_attachments_rental_id_fkey" FOREIGN KEY ("rental_id") REFERENCES "rentals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_attachments" ADD CONSTRAINT "rental_attachments_archivo_id_fkey" FOREIGN KEY ("archivo_id") REFERENCES "gen_archivos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_compliance_checklists" ADD CONSTRAINT "sale_compliance_checklists_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_compliance_checklists" ADD CONSTRAINT "sale_compliance_checklists_payment_evidence_archivo_id_fkey" FOREIGN KEY ("payment_evidence_archivo_id") REFERENCES "gen_archivos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_compliance_documents" ADD CONSTRAINT "sale_compliance_documents_checklist_id_fkey" FOREIGN KEY ("checklist_id") REFERENCES "sale_compliance_checklists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_compliance_documents" ADD CONSTRAINT "sale_compliance_documents_archivo_id_fkey" FOREIGN KEY ("archivo_id") REFERENCES "gen_archivos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas_pipeline_stage_configs" ADD CONSTRAINT "ventas_pipeline_stage_configs_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas_numbering_series" ADD CONSTRAINT "ventas_numbering_series_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_processes" ADD CONSTRAINT "sale_processes_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_processes" ADD CONSTRAINT "sale_processes_buyer_client_id_fkey" FOREIGN KEY ("buyer_client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_processes" ADD CONSTRAINT "sale_processes_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_processes" ADD CONSTRAINT "sale_processes_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_processes" ADD CONSTRAINT "sale_processes_financing_channel_id_fkey" FOREIGN KEY ("financing_channel_id") REFERENCES "sale_financing_channels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_process_buyers" ADD CONSTRAINT "sale_process_buyers_sale_process_id_fkey" FOREIGN KEY ("sale_process_id") REFERENCES "sale_processes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_process_buyers" ADD CONSTRAINT "sale_process_buyers_buyer_client_id_fkey" FOREIGN KEY ("buyer_client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_process_owners" ADD CONSTRAINT "sale_process_owners_sale_process_id_fkey" FOREIGN KEY ("sale_process_id") REFERENCES "sale_processes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_process_owners" ADD CONSTRAINT "sale_process_owners_owner_client_id_fkey" FOREIGN KEY ("owner_client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_process_notes" ADD CONSTRAINT "sale_process_notes_sale_process_id_fkey" FOREIGN KEY ("sale_process_id") REFERENCES "sale_processes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_process_activities" ADD CONSTRAINT "sale_process_activities_sale_process_id_fkey" FOREIGN KEY ("sale_process_id") REFERENCES "sale_processes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_process_reminders" ADD CONSTRAINT "sale_process_reminders_sale_process_id_fkey" FOREIGN KEY ("sale_process_id") REFERENCES "sale_processes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_separations" ADD CONSTRAINT "sale_separations_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_separations" ADD CONSTRAINT "sale_separations_receipt_archivo_id_fkey" FOREIGN KEY ("receipt_archivo_id") REFERENCES "gen_archivos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_separations" ADD CONSTRAINT "sale_separations_sale_process_id_fkey" FOREIGN KEY ("sale_process_id") REFERENCES "sale_processes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_separations" ADD CONSTRAINT "sale_separations_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_separations" ADD CONSTRAINT "sale_separations_buyer_client_id_fkey" FOREIGN KEY ("buyer_client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_closings" ADD CONSTRAINT "sale_closings_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_closings" ADD CONSTRAINT "sale_closings_contract_archivo_id_fkey" FOREIGN KEY ("contract_archivo_id") REFERENCES "gen_archivos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_closings" ADD CONSTRAINT "sale_closings_sale_process_id_fkey" FOREIGN KEY ("sale_process_id") REFERENCES "sale_processes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_closings" ADD CONSTRAINT "sale_closings_sale_separation_id_fkey" FOREIGN KEY ("sale_separation_id") REFERENCES "sale_separations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_closings" ADD CONSTRAINT "sale_closings_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_closings" ADD CONSTRAINT "sale_closings_buyer_client_id_fkey" FOREIGN KEY ("buyer_client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_closings" ADD CONSTRAINT "sale_closings_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_commissions" ADD CONSTRAINT "sale_commissions_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_commissions" ADD CONSTRAINT "sale_commissions_sale_process_id_fkey" FOREIGN KEY ("sale_process_id") REFERENCES "sale_processes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_commissions" ADD CONSTRAINT "sale_commissions_sale_closing_id_fkey" FOREIGN KEY ("sale_closing_id") REFERENCES "sale_closings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_commissions" ADD CONSTRAINT "sale_commissions_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_commission_payment_parts" ADD CONSTRAINT "sale_commission_payment_parts_sale_commission_id_fkey" FOREIGN KEY ("sale_commission_id") REFERENCES "sale_commissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_commission_deductibles" ADD CONSTRAINT "sale_commission_deductibles_sale_commission_id_fkey" FOREIGN KEY ("sale_commission_id") REFERENCES "sale_commissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_buyer_payments" ADD CONSTRAINT "sale_buyer_payments_sale_closing_id_fkey" FOREIGN KEY ("sale_closing_id") REFERENCES "sale_closings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_documentation_costs" ADD CONSTRAINT "sale_documentation_costs_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_documentation_costs" ADD CONSTRAINT "sale_documentation_costs_sale_closing_id_fkey" FOREIGN KEY ("sale_closing_id") REFERENCES "sale_closings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas_agent_commission_profiles" ADD CONSTRAINT "ventas_agent_commission_profiles_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventas_agent_commission_profiles" ADD CONSTRAINT "ventas_agent_commission_profiles_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
