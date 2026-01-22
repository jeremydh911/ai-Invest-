# AgenticEmpire CRM System Documentation

## Overview

The CRM (Customer Relationship Management) system in AgenticEmpire is a comprehensive tool for managing customer relationships, sales opportunities, and business activities. It provides a professional, user-friendly interface for tracking contacts, managing deals, and monitoring your sales pipeline.

## Features

### 1. **Contacts Management**
- Create, read, update, and delete contacts
- Track contact information: name, email, phone, company, job title
- Assign contact status: Lead, Prospect, Customer, Closed
- Store source information (Website, Referral, etc.)
- Add notes and ratings (0-5 stars)
- View contact history

**Endpoint:**
- `GET /api/crm/contacts` - List all contacts
- `GET /api/crm/contacts/:id` - Get specific contact
- `POST /api/crm/contacts` - Create new contact
- `PUT /api/crm/contacts/:id` - Update contact
- `DELETE /api/crm/contacts/:id` - Delete contact

### 2. **Opportunities Management**
- Track sales opportunities
- Link opportunities to contacts
- Set opportunity value and currency
- Track probability percentage
- Multiple stages: Prospect, Qualification, Proposal, Negotiation, Closed-Won, Closed-Lost
- Expected close date tracking
- Description and notes

**Endpoint:**
- `GET /api/crm/opportunities` - List opportunities
- `POST /api/crm/opportunities` - Create opportunity
- `PUT /api/crm/opportunities/:id` - Update opportunity
- `DELETE /api/crm/opportunities/:id` - Delete opportunity

### 3. **Deals Management**
- Create and manage individual deals
- Track deal amount and stage
- Set probability percentage
- Link to opportunities
- Store next steps and action items
- Track close dates

**Endpoint:**
- `GET /api/crm/deals` - List all deals
- `POST /api/crm/deals` - Create new deal
- `DELETE /api/crm/deals/:id` - Delete deal

### 4. **Activities Management**
- Log different types of activities: Call, Email, Meeting, Task, Note
- Set priority levels: Low, Normal, High, Urgent
- Track due dates
- Assign activities to team members
- Link activities to contacts or opportunities
- Mark activities as completed

**Endpoint:**
- `GET /api/crm/activities` - List activities
- `GET /api/crm/activities/recent` - Get 5 most recent activities
- `POST /api/crm/activities` - Create activity
- `DELETE /api/crm/activities/:id` - Delete activity

### 5. **Pipeline View**
- Visual representation of deals by stage
- Drag-and-drop interface for stage management (future)
- Real-time deal count per stage
- Quick deal details: name, amount, contact, probability
- Stages: Proposal, Negotiation, Closed-Won, Closed-Lost

**Endpoint:**
- `GET /api/crm/pipeline` - Get pipeline data

### 6. **Dashboard & Analytics**
- Total contacts count
- Open opportunities count
- Pipeline value (total opportunity value)
- Deals closed this month
- Recent activity stream
- Key metrics at a glance

**Endpoint:**
- `GET /api/crm/stats` - Get dashboard statistics

## Database Schema

### crm_contacts
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

### crm_opportunities
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

### crm_deals
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

### crm_activities
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

### crm_notes
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

## UI Components

### Dashboard Tab
- Key metrics cards (contacts, opportunities, pipeline value, closed deals)
- Recent activity stream
- Quick action buttons

### Contacts Tab
- Search and filter functionality
- Sortable table with contact details
- Status badges
- Rating display
- Quick edit/delete actions
- Add contact button

### Opportunities Tab
- List of all sales opportunities
- Stage visualization
- Value tracking
- Probability indicators
- Expected close dates
- Filter by stage

### Deals Tab
- Active deals display
- Deal amount and stage
- Probability tracking
- Close date management
- Status indicators

### Pipeline Tab
- Kanban-style pipeline view
- Deals grouped by stage
- Drag-and-drop support (future)
- Quick deal information cards
- Deal count per stage

### Activities Tab
- Activity log with filtering
- Type indicators (Call, Email, Meeting, etc.)
- Priority levels
- Due date tracking
- Completion status
- Quick actions

## API Response Format

### Success Response
```json
{
  "id": 1,
  "message": "Resource created/updated successfully"
}
```

### List Response
```json
[
  {
    "id": 1,
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    ...
  }
]
```

### Error Response
```json
{
  "error": "Error message describing what went wrong"
}
```

## Authentication

All API endpoints require JWT authentication via the `Authorization: Bearer <token>` header.

## Usage Examples

### Create a Contact
```bash
curl -X POST http://localhost:3000/api/crm/contacts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "company": "Acme Corp",
    "status": "lead"
  }'
```

### Create an Opportunity
```bash
curl -X POST http://localhost:3000/api/crm/opportunities \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "contact_id": 1,
    "name": "Enterprise Deal",
    "value": 100000,
    "stage": "proposal",
    "probability": 75
  }'
```

### Create a Deal
```bash
curl -X POST http://localhost:3000/api/crm/deals \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "opportunity_id": 1,
    "name": "Deal Q1 2026",
    "amount": 100000,
    "stage": "proposal"
  }'
```

### Log an Activity
```bash
curl -X POST http://localhost:3000/api/crm/activities \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "call",
    "subject": "Initial consultation",
    "contact_id": 1,
    "priority": "high"
  }'
```

## Best Practices

1. **Contact Organization**: Keep contact information clean and up-to-date
2. **Status Management**: Regularly update contact and opportunity status
3. **Activity Logging**: Log all customer interactions for historical tracking
4. **Pipeline Management**: Move deals through stages as progress is made
5. **Probability Tracking**: Adjust deal probability based on engagement
6. **Closing Process**: Document next steps and expected close dates

## Future Enhancements

- [ ] Drag-and-drop pipeline management
- [ ] Advanced filtering and search
- [ ] Custom fields per entity
- [ ] Activity reminders and notifications
- [ ] Email integration
- [ ] Calendar integration
- [ ] Deal forecasting
- [ ] Revenue reporting
- [ ] Team collaboration features
- [ ] Export to CSV/PDF
- [ ] Mobile app support

## Troubleshooting

### CRM data not showing?
1. Ensure you're authenticated with a valid JWT token
2. Check that the database tables are created (run setup-database.js)
3. Verify the API endpoints are accessible

### Can't save contact?
1. Ensure all required fields are filled (first_name, last_name)
2. Check for duplicate entries
3. Verify email format if entering email address

### Missing opportunities in pipeline?
1. Ensure opportunities are linked to contacts
2. Check that deal stage is set correctly
4. Verify status is set to "open"

## Support

For issues or feature requests, contact the development team or submit an issue in the project repository.
