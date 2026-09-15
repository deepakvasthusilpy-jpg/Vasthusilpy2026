import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp, boolean } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow()
});

export const estimates = pgTable('estimates', {
  id: text('id').primaryKey(), // e.g. E000001
  clientName: text('client_name').notNull(),
  location: text('location').notNull(),
  phone: text('phone'),
  workType: text('work_type'),
  grandTotal: integer('grand_total').default(0),
  dataJson: text('data_json'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const officeWorks = pgTable('office_works', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  client: text('client'),
  location: text('location'),
  category: text('category'),
  type: text('type').default('pdf'),
  isImportant: boolean('is_important').default(false),
  url: text('url'),
  createdAt: timestamp('created_at').defaultNow()
});

export const googleDocsSheets = pgTable('google_docs_sheets', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  docType: text('doc_type').notNull(), // 'doc' | 'sheet'
  googleId: text('google_id').notNull(),
  webUrl: text('web_url').notNull(),
  createdAt: timestamp('created_at').defaultNow()
});

export const applicationTemplates = pgTable('application_templates', {
  id: text('id').primaryKey(), // template id e.g. tmpl_12345
  name: text('name').notNull(),
  pdfFileUrl: text('pdf_file_url'),
  fieldSchema: text('field_schema').notNull(), // JSON string: { version: number, fields: FormFieldDefinition[] }
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const applicationEntries = pgTable('application_entries', {
  id: text('id').primaryKey(), // entry id e.g. entry_12345
  templateId: text('template_id').notNull(),
  fieldValues: text('field_values').notNull(), // JSON string of field key-values
  status: text('status').default('Draft'), // 'Draft' | 'Completed' | 'Emailed'
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  lastEmailedTo: text('last_emailed_to'),
  lastEmailedAt: timestamp('last_emailed_at')
});

export const applicationTemplatesRelations = relations(applicationTemplates, ({ many }) => ({
  entries: many(applicationEntries)
}));

export const applicationEntriesRelations = relations(applicationEntries, ({ one }) => ({
  template: one(applicationTemplates, {
    fields: [applicationEntries.templateId],
    references: [applicationTemplates.id]
  })
}));

export const usersRelations = relations(users, ({ many }) => ({
}));

