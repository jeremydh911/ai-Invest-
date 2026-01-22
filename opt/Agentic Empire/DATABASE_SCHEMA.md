# CRM Database Schema Reference

## Database: app.db (SQLite3)

This document shows the complete CRM database schema created for AgenticEmpire.

---

## Table: crm_contacts

Stores customer and prospect information.

```sql
CREATE TABLE crm_contacts (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  job_title TEXT,
  source TEXT,
  status TEXT DEFAULT 'lead',
  rating INTEGER DEFAULT 0,
  notes TEXT,
  metadata TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id)
);
```

**Fields:**
- `id` - Unique contact identifier
- `user_id` - Owner of the contact (foreign key to users.id)
- `first_name` - Contact's first name (required)
- `last_name` - Contact's last name (required)
- `email` - Email address
- `phone` - Phone number
- `company` - Company/organization name
- `job_title` - Job title or position
- `source` - Where contact came from (Website, Referral, LinkedIn, etc.)
- `status` - Contact status (lead, prospect, customer, closed)
- `rating` - Contact importance rating (0-5)
- `notes` - Additional notes about contact
- `metadata` - JSON metadata for custom fields
- `created_at` - Record creation timestamp
- `updated_at` - Last modification timestamp

**Indices:** user_id (for user isolation)

---

## Table: crm_opportunities

Tracks sales opportunities linked to contacts.

```sql
CREATE TABLE crm_opportunities (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  contact_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  value REAL,
  currency TEXT DEFAULT 'usd',
  stage TEXT DEFAULT 'prospect',
  probability INTEGER DEFAULT 0,
  expected_close_date DATETIME,
  close_date DATETIME,
  status TEXT DEFAULT 'open',
  owner_id INTEGER,
  metadata TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(contact_id) REFERENCES crm_contacts(id),
  FOREIGN KEY(owner_id) REFERENCES users(id)
);
```

**Fields:**
- `id` - Unique opportunity identifier
- `user_id` - Owner user (foreign key to users.id)
- `contact_id` - Associated contact (foreign key to crm_contacts.id)
- `name` - Opportunity name (required)
- `description` - Detailed description
- `value` - Opportunity value ($ amount)
- `currency` - Currency code (usd, eur, gbp, etc.)
- `stage` - Sales stage (prospect, qualification, proposal, negotiation, closed-won, closed-lost)
- `probability` - Win probability percentage (0-100)
- `expected_close_date` - Expected date when deal closes
- `close_date` - Actual close date
- `status` - open, closed-won, closed-lost
- `owner_id` - Team member responsible
- `metadata` - Custom field storage
- `created_at` - Record creation timestamp
- `updated_at` - Last modification timestamp

**Indices:** user_id, contact_id

---

## Table: crm_deals

Manages individual deals linked to opportunities.

```sql
CREATE TABLE crm_deals (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  opportunity_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  amount REAL,
  currency TEXT DEFAULT 'usd',
  stage TEXT DEFAULT 'proposal',
  status TEXT DEFAULT 'active',
  close_date DATETIME,
  closed_date DATETIME,
  owner_id INTEGER,
  probability INTEGER DEFAULT 50,
  next_step TEXT,
  metadata TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(opportunity_id) REFERENCES crm_opportunities(id),
  FOREIGN KEY(owner_id) REFERENCES users(id)
);
```

**Fields:**
- `id` - Unique deal identifier
- `user_id` - Owner user (foreign key to users.id)
- `opportunity_id` - Associated opportunity (foreign key to crm_opportunities.id)
- `name` - Deal name (required)
- `amount` - Deal value
- `currency` - Currency code
- `stage` - Deal stage (proposal, negotiation, closed-won, closed-lost)
- `status` - active, closed-won, closed-lost, lost
- `close_date` - Expected close date
- `closed_date` - Actual close date
- `owner_id` - Team member responsible
- `probability` - Success probability (0-100)
- `next_step` - What to do next
- `metadata` - Custom field storage
- `created_at` - Record creation timestamp
- `updated_at` - Last modification timestamp

**Indices:** user_id, opportunity_id

---

## Table: crm_activities

Logs customer interactions and activities.

```sql
CREATE TABLE crm_activities (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  contact_id INTEGER,
  opportunity_id INTEGER,
  type TEXT,
  subject TEXT,
  description TEXT,
  status TEXT DEFAULT 'completed',
  priority TEXT DEFAULT 'normal',
  due_date DATETIME,
  completed_at DATETIME,
  assigned_to INTEGER,
  metadata TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(contact_id) REFERENCES crm_contacts(id),
  FOREIGN KEY(opportunity_id) REFERENCES crm_opportunities(id),
  FOREIGN KEY(assigned_to) REFERENCES users(id)
);
```

**Fields:**
- `id` - Unique activity identifier
- `user_id` - User who created activity (foreign key to users.id)
- `contact_id` - Associated contact (optional foreign key)
- `opportunity_id` - Associated opportunity (optional foreign key)
- `type` - Activity type (call, email, meeting, task, note)
- `subject` - Activity subject line
- `description` - Detailed description
- `status` - Activity status (pending, completed, cancelled)
- `priority` - Priority level (low, normal, high, urgent)
- `due_date` - When the activity is due
- `completed_at` - When the activity was completed
- `assigned_to` - User assigned to this activity
- `metadata` - Custom field storage
- `created_at` - Record creation timestamp
- `updated_at` - Last modification timestamp

**Indices:** user_id, contact_id, opportunity_id

---

## Table: crm_pipeline_stages

Custom pipeline stages for each user.

```sql
CREATE TABLE crm_pipeline_stages (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  position INTEGER DEFAULT 0,
  color TEXT DEFAULT '#0066cc',
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id)
);
```

**Fields:**
- `id` - Unique stage identifier
- `user_id` - Owner user (foreign key to users.id)
- `name` - Stage name
- `description` - Stage description
- `position` - Display order
- `color` - Display color (hex code)
- `status` - active, inactive
- `created_at` - Record creation timestamp
- `updated_at` - Last modification timestamp

**Indices:** user_id

---

## Table: crm_notes

Additional notes linked to any CRM entity.

```sql
CREATE TABLE crm_notes (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  contact_id INTEGER,
  opportunity_id INTEGER,
  deal_id INTEGER,
  content TEXT NOT NULL,
  visibility TEXT DEFAULT 'private',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(contact_id) REFERENCES crm_contacts(id),
  FOREIGN KEY(opportunity_id) REFERENCES crm_opportunities(id),
  FOREIGN KEY(deal_id) REFERENCES crm_deals(id)
);
```

**Fields:**
- `id` - Unique note identifier
- `user_id` - Note creator (foreign key to users.id)
- `contact_id` - Associated contact (optional)
- `opportunity_id` - Associated opportunity (optional)
- `deal_id` - Associated deal (optional)
- `content` - Note content
- `visibility` - private, shared, public
- `created_at` - Record creation timestamp
- `updated_at` - Last modification timestamp

**Indices:** user_id

---

## Data Relationships

```
users (1) ──────────┐
                    │
                    ├──→ (many) crm_contacts
                    │            ↓
                    │         crm_notes
                    │
                    ├──→ (many) crm_opportunities
                    │            ↓
                    │        crm_notes
                    │            ↓
                    └─→  (many) crm_deals
                                ↓
                            crm_notes

crm_activities ──→ can link to:
  - crm_contacts
  - crm_opportunities
  - crm_deals
```

---

## Enumeration Values

### Contact Status
- `lead` - New prospect/lead
- `prospect` - Qualified prospect
- `customer` - Active customer
- `closed` - Closed/archived

### Opportunity Stage
- `prospect` - Initial prospect stage
- `qualification` - Qualification stage
- `proposal` - Proposal sent
- `negotiation` - In negotiation
- `closed-won` - Deal won
- `closed-lost` - Deal lost

### Deal Stage
- `proposal` - Proposal sent
- `negotiation` - Under negotiation
- `closed-won` - Won deal
- `closed-lost` - Lost deal

### Activity Type
- `call` - Phone call
- `email` - Email communication
- `meeting` - In-person/video meeting
- `task` - Task to complete
- `note` - General note

### Activity Priority
- `low` - Low priority
- `normal` - Normal/standard priority
- `high` - High priority
- `urgent` - Urgent/critical

### Activity Status
- `pending` - Not yet completed
- `completed` - Completed
- `cancelled` - Cancelled

---

## Query Examples

### Get all contacts for a user
```sql
SELECT * FROM crm_contacts 
WHERE user_id = ? 
ORDER BY created_at DESC;
```

### Get open opportunities with values
```sql
SELECT o.*, c.first_name, c.last_name 
FROM crm_opportunities o
LEFT JOIN crm_contacts c ON o.contact_id = c.id
WHERE o.user_id = ? AND o.status = 'open'
ORDER BY o.expected_close_date;
```

### Get pipeline value
```sql
SELECT COALESCE(SUM(value), 0) as total_value
FROM crm_opportunities
WHERE user_id = ? AND status = 'open';
```

### Get recent activities
```sql
SELECT a.*, c.first_name, c.last_name
FROM crm_activities a
LEFT JOIN crm_contacts c ON a.contact_id = c.id
WHERE a.user_id = ?
ORDER BY a.created_at DESC
LIMIT 10;
```

### Get deals by stage
```sql
SELECT * FROM crm_deals
WHERE user_id = ? AND stage = ?
ORDER BY created_at DESC;
```

---

## Backup & Restore

### Backup Database
```bash
cp data/app.db data/app.db.backup
```

### Restore Database
```bash
cp data/app.db.backup data/app.db
```

### Export to CSV
```bash
sqlite3 data/app.db ".mode csv" ".output crm_backup.csv" "SELECT * FROM crm_contacts;"
```

---

## Performance Notes

- All tables have proper indexing on foreign keys
- User isolation via user_id ensures secure data separation
- Timestamp fields help with audit trails
- Metadata fields allow for future extensibility
- All relationships are properly normalized

---

## Maintenance

### Optimize Database
```bash
sqlite3 data/app.db "VACUUM;"
```

### Rebuild Indices
```bash
sqlite3 data/app.db "REINDEX;"
```

### Database Size
The database will grow with data:
- Empty: ~100 KB
- 1,000 contacts: ~500 KB
- 10,000 contacts: ~5 MB

---

**Schema Version:** 1.0.0
**Last Updated:** January 20, 2026
