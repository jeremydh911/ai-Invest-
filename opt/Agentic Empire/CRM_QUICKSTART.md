# CRM System - Quick Start Guide

## What's New

AgenticEmpire now includes a full-featured CRM (Customer Relationship Management) system integrated directly into the application.

## Accessing the CRM

1. **Login** to your AgenticEmpire account
2. Go to the **Dashboard**
3. Click the **📊 CRM** card in the main grid
4. You'll be taken to the CRM dashboard

## Main Features

### 📋 Dashboard
- **Total Contacts**: All contacts in your CRM
- **Open Opportunities**: Active sales opportunities
- **Pipeline Value**: Total $ value of open deals
- **Closed This Month**: Deals closed in the current month
- **Recent Activity**: Latest CRM actions

### 👥 Contacts Tab
Track all your customer and prospect information:
- Search and filter by status
- Add new contacts with full details
- Track email, phone, company, job title
- Set contact status (Lead, Prospect, Customer, Closed)
- Store source and notes
- Rate contacts 1-5 stars

**Actions:**
- ➕ **Add Contact**: Create new contact record
- ✏️ **Edit**: Modify contact details
- 🗑️ **Delete**: Remove contact

### 💼 Opportunities Tab
Manage potential sales and business opportunities:
- Create opportunities linked to contacts
- Set opportunity value and currency
- Track probability percentage
- Multiple stages (Prospect → Proposal → Negotiation → Closed)
- Expected close date
- Add descriptions and details

**Actions:**
- ➕ **Add Opportunity**: Create new opportunity
- ✏️ **Edit**: Update opportunity details
- 🗑️ **Delete**: Remove opportunity

### 🤝 Deals Tab
Track individual deals and close rates:
- Create deals linked to opportunities
- Monitor deal amount and stage
- Set probability and close dates
- Track next steps
- View deal status

**Actions:**
- ➕ **Add Deal**: Create new deal
- ✏️ **Edit**: Update deal information
- 🗑️ **Delete**: Remove deal

### 📊 Pipeline Tab
Visual pipeline view of your sales:
- See deals grouped by stage
- Kanban-style columns (Proposal → Negotiation → Closed-Won/Lost)
- Quick view of deal amounts and contacts
- Deal count per stage

### 📝 Activities Tab
Log and track all customer interactions:
- Activity types: Call, Email, Meeting, Task, Note
- Priority levels: Low, Normal, High, Urgent
- Due date tracking
- Link to specific contacts
- Mark as completed when done
- Search and filter activities

**Actions:**
- ➕ **Add Activity**: Log new activity
- ✏️ **Edit**: Update activity details
- 🗑️ **Delete**: Remove activity

## Common Workflows

### Lead to Customer
1. **Create Contact** with basic info (Lead status)
2. **Create Opportunity** linked to contact
3. **Log Activities** (calls, emails, meetings)
4. **Create Deal** when ready to close
5. **Update Status** through stages until Closed-Won

### Track Sales Pipeline
1. Go to **Pipeline** tab
2. See all deals by stage
3. Monitor probability and close dates
4. Move deals through stages as they progress
5. Review closed deals monthly

### Quick Follow-up
1. Check **Recent Activity** on dashboard
2. Go to **Activities** tab
3. Filter by **Due Date**
4. Mark activities as **Completed**
5. Log next activity

### Monthly Review
1. Check **Closed This Month** metric
2. Review **Pipeline Value**
3. Analyze **Open Opportunities**
4. Forecast next month's closures

## Tips & Best Practices

### Effective Contact Management
- ✓ Keep email addresses and phone numbers up-to-date
- ✓ Set appropriate status (Lead/Prospect/Customer)
- ✓ Add company and job title for context
- ✓ Use notes field for important context
- ✓ Rate high-value contacts

### Strong Opportunity Tracking
- ✓ Link every opportunity to a contact
- ✓ Set realistic probability percentages
- ✓ Update expected close dates regularly
- ✓ Include detailed descriptions
- ✓ Review and update status monthly

### Effective Deal Management
- ✓ Document next steps
- ✓ Update stage as conversations progress
- ✓ Adjust probability based on engagement
- ✓ Track all interactions via activities
- ✓ Close deals when agreement is reached

### Activity Logging
- ✓ Log every customer interaction
- ✓ Set appropriate priority
- ✓ Include due dates for follow-ups
- ✓ Complete activities when done
- ✓ Add detailed notes in description

## API Integration

All CRM data is available via REST API:

```javascript
// Get all contacts
fetch('/api/crm/contacts', {
  headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
})

// Create new contact
fetch('/api/crm/contacts', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
    company: 'ABC Corp'
  })
})
```

See CRM_DOCUMENTATION.md for full API reference.

## Data Export

Currently, export features include:
- View raw data in tables
- Copy-paste from UI
- API access for programmatic export

Future versions will include:
- CSV export
- PDF reports
- Email reports
- Custom reporting

## Support

- Check **CRM_DOCUMENTATION.md** for detailed API documentation
- Review **test-crm.js** for API testing examples
- Contact support for feature requests

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + K` | Quick search (future) |
| `Ctrl + N` | New contact (future) |
| `Escape` | Close modal |

## Mobile Support

The CRM interface is fully responsive and works on:
- ✓ Desktop browsers (Chrome, Firefox, Safari, Edge)
- ✓ Tablets (iPad, Android tablets)
- ✓ Mobile phones (responsive layout)

## Security

- All data is encrypted in transit (HTTPS in production)
- Authentication required for all API calls
- User isolation: Users only see their own CRM data
- No credit card or sensitive data stored
- Regular security audits recommended

## Getting Help

1. **In-App Help**: Hover over field labels for descriptions
2. **Documentation**: Check CRM_DOCUMENTATION.md
3. **API Tests**: Run `node test-crm.js` to verify setup
4. **Error Messages**: Read and follow error messages

---

**Ready to use your CRM?** Click the 📊 CRM button on the dashboard to get started!
