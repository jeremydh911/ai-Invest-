# Multi-Company File Management Integration

## System Overview

The File Management System is fully integrated with the multi-company architecture, providing company-isolated file storage with individual RAG memory databases.

```
┌─────────────────────────────────────────────────────────┐
│                    LucaExpress System                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌────────────────────────────────────────────────┐   │
│  │    Multi-Company Authentication System         │   │
│  │  (Multi-Company Login, Company Creation)       │   │
│  └────────────────────────────────────────────────┘   │
│                      ↓                                 │
│  ┌────────────────────────────────────────────────┐   │
│  │    Global Company Registry (registry.db)        │   │
│  │  (Companies, Users, Approvals, LLM Sharing)     │   │
│  └────────────────────────────────────────────────┘   │
│                      ↓                                 │
│  ┌────────────────────────────────────────────────┐   │
│  │   Per-Company Databases (app-company-{id}.db)  │   │
│  │  (RAG Memory, Settings, Agents, Industry Data) │   │
│  └────────────────────────────────────────────────┘   │
│                      ↓                                 │
│  ┌────────────────────────────────────────────────┐   │
│  │  File Management System (NEW)                  │   │
│  │  ├─ Company-Specific File Folders              │   │
│  │  ├─ RAG Integration                            │   │
│  │  ├─ Access Control (Admin + Master)            │   │
│  │  └─ File Lifecycle Management                  │   │
│  └────────────────────────────────────────────────┘   │
│                      ↓                                 │
│  ┌────────────────────────────────────────────────┐   │
│  │   File Storage: data/company-files/            │   │
│  │  ├─ company-1/ (TechCorp Inc)                  │   │
│  │  ├─ company-2/ (FinanceHub LLC)                │   │
│  │  └─ company-3/ (HealthCare Plus)               │   │
│  └────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Component Integration

### 1. Company Creation Flow

When company is created via Multi-Company Login:

```
User creates company "TechCorp Inc"
↓
POST /api/auth/company/create
↓
Server:
  1. Creates registry entry (registry.db)
  2. Creates company database (app-company-{id}.db)
  3. Creates admin user in company DB
  4. Creates industry templates
  5. ✨ NEW: Creates company file folder
     └─ FileManagement.createCompanyFolder(companyId, companyName)
        ├─ Creates data/company-files/company-1/ (mode 0o700)
        ├─ Creates .company-meta.json (mode 0o600)
        ├─ Initializes file watcher
        └─ Returns success
↓
Company ready for file uploads
```

### 2. File Upload Integration with RAG

```
User uploads file to company 1
↓
POST /api/companies/1/files/upload
Body: { file, password }
↓
FileManagement.uploadFile()
├─ Verify folder access (admin password)
├─ Save file to disk
│  └─ data/company-files/company-1/{timestamp}-{filename}
├─ Extract file content
└─ FileManagement.addToRagMemory()
   ├─ Create rag_documents entry (app-company-1.db)
   ├─ Create rag_chunks entries
   └─ Return ragDocId
↓
File immediately available in:
├─ Chat RAG queries: "Search my uploaded files"
├─ Fine-tuning: Can use as training data
└─ Agent context: Available for agent memory
```

### 3. Company Deletion Flow

When company is deleted:

```
Admin deletes company 1
↓
DELETE /api/companies/1
↓
Server:
  1. Delete registry entry
  2. Close company database connection
  3. ✨ NEW: Delete company files
     └─ FileManagement.deleteCompanyFolder(1)
        ├─ Close file watcher
        ├─ Recursively delete company-1/
        │  ├─ Delete all files
        │  ├─ Delete .company-meta.json
        │  └─ Cascade RAG cleanup (done via DB transaction)
        └─ Clean file index
  4. Clean up database
↓
All company files removed
```

## Database Integration

### Per-Company Database Schema

Each company has its own database with RAG tables:

```sql
-- app-company-{id}.db

CREATE TABLE rag_documents (
  id INTEGER PRIMARY KEY,
  user_id INTEGER,
  title TEXT,
  content TEXT,
  file_path TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE rag_chunks (
  id INTEGER PRIMARY KEY,
  document_id INTEGER,
  chunk_text TEXT,
  FOREIGN KEY(document_id) REFERENCES rag_documents(id)
);

CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  username TEXT,
  password_hash TEXT,
  is_admin INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Other company-specific tables...
```

### File Metadata Tracking

Stored in `.company-meta.json`:

```json
{
  "companyId": 1,
  "companyName": "TechCorp Inc",
  "created": "2026-01-20T10:30:45.123Z",
  "lastModified": "2026-01-20T11:45:30.456Z",
  "fileCount": 5,
  "totalSize": 10485760,
  "files": [
    {
      "filename": "1705769234-invoice.pdf",
      "size": 2097152,
      "ragDocId": 42,
      "uploadedAt": "2026-01-20T10:35:12.789Z"
    },
    {
      "filename": "1705769245-training.txt",
      "size": 102400,
      "ragDocId": 43,
      "uploadedAt": "2026-01-20T10:40:15.234Z"
    },
    {
      "filename": "1705769256-guide.docx",
      "size": 3042528,
      "ragDocId": 44,
      "uploadedAt": "2026-01-20T10:45:22.567Z"
    },
    {
      "filename": "1705769300-client.xlsx",
      "size": 2097152,
      "ragDocId": 45,
      "uploadedAt": "2026-01-20T11:15:30.234Z"
    },
    {
      "filename": "1705769315-procedures.pdf",
      "size": 3145728,
      "ragDocId": 46,
      "uploadedAt": "2026-01-20T11:45:22.567Z"
    }
  ]
}
```

## Security Integration

### Multi-Level Access Control

```
User Roles (Global Registry)
├─ Admin (system-wide)
├─ Company Admin (company-specific)
├─ Manager
└─ User

File Access (Company-Specific)
├─ Admin Password (company admin only)
├─ Master Password (system backdoor, admin only)
└─ User Isolation (each company separate DB)
```

### Isolation Levels

**1. Company Isolation**
- Each company: separate database
- Each company: separate file folder
- Each company: separate RAG memory
- Cannot access other companies' files

**2. User Isolation**
- Files tracked by user_id in RAG
- Can query own uploaded files
- Admin can query all files in company

**3. File System Isolation**
- Folder permissions: 0o700 (owner only)
- File permissions: 0o600 (owner only)
- Path traversal prevention
- Master password stored securely

## API Integration

### Current Endpoints

```javascript
// File Management Routes
POST   /api/companies/:id/files/upload          // Upload
GET    /api/companies/:id/files                 // List
GET    /api/companies/:id/files/:filename       // Download
DELETE /api/companies/:id/files/:filename       // Delete
GET    /api/companies/:id/files/stats           // Statistics

// Verification
POST   /api/files/verify-access                 // Test access
GET    /api/files/master-status                 // Check master password
```

### Authentication Flow

```
User Login (Multi-Company)
↓
POST /api/auth/login
├─ Username + password verified
├─ Company selected
└─ JWT token returned (includes companyId)
↓
File Management Requests
↓
Every file request:
├─ JWT verified (includes companyId)
├─ File password verified (admin or master)
├─ Operation performed in company context
└─ User isolation maintained
```

## UI Integration

### Navigation

```
Dashboard (Main)
├─ Chat                          [chat.html]
├─ Settings                      [settings.html]
├─ Agents                        [agents.html]
├─ File Management      ✨ NEW   [files.html]
├─ Admin Panel
│  ├─ Company Setup             [company-setup.html]
│  ├─ User Management           [users.html]
│  ├─ Approvals                 [approvals.html]
│  └─ Agents                    [agents.html]
└─ Other Tiles...
```

### File Management UI Features

**Location**: `http://localhost:3000/files?companyId=1`

**Features**:
- Password-protected access (admin + master toggle)
- Drag-and-drop file upload
- File list with metadata
- Download and delete buttons
- Folder statistics (count, size, created date)
- Real-time feedback and error handling

## Data Flow Examples

### Example 1: Upload Training Data

```
User (TechCorp Inc)
↓
Navigates to /files?companyId=1
↓
Enters admin password
↓
Drags "training-data.csv" file
↓
POST /api/companies/1/files/upload
Body:
  file: [CSV binary]
  password: [admin-password]
↓
Server:
  1. Verify admin password for company 1
  2. Save file: data/company-files/company-1/1705769234-training-data.csv
  3. Extract CSV content
  4. Create rag_documents (company-1 DB)
  5. Create rag_chunks (company-1 DB)
  6. Update .company-meta.json
↓
Response:
  {
    "message": "File uploaded successfully",
    "file": {
      "id": 42,
      "filename": "1705769234-training-data.csv",
      "size": 102400,
      "ragEnabled": true
    }
  }
↓
File Available In:
  - Chat: "Analyze the training data I uploaded"
  - RAG: Searchable by content
  - Fine-tuning: Can use as training source
  - Agent: Available in agent memory
```

### Example 2: Cross-Company File Access Denied

```
User (TechCorp Inc, Company 1)
↓
Tries to access Company 2 files
↓
GET /api/companies/2/files?password=... 
Body includes: companyId=2
↓
Server:
  1. Verify JWT includes companyId=1
  2. Request is for companyId=2
  3. MISMATCH - Access Denied
↓
Response: 403 Forbidden
Message: "Cannot access other company's files"
```

### Example 3: Master Password Backup Access

```
System Admin
↓
Company 1 admin password lost
↓
Navigates to /files?companyId=1
↓
Enters master password
↓
Checks isMaster checkbox
↓
POST /api/files/verify-access
Body:
  companyId: 1
  password: [master-password]
  isMaster: true
↓
Server:
  1. Compare password with .master-password (bcrypt)
  2. Master password verified
  3. Return authorized: true
↓
Admin gains full access to company 1 files
```

## Monitoring and Maintenance

### File System Monitoring

```javascript
// Chokidar watcher per company
FileManagement.startFileWatcher(companyId)

// Monitors:
├─ File additions
├─ File deletions
└─ File changes

// Logs to console:
"File added to company 1: invoice.pdf"
"File deleted from company 1: old-doc.txt"
```

### Metadata Integrity

Check `.company-meta.json`:

```bash
# List company file metadata
cat data/company-files/company-1/.company-meta.json

# Verify file count
ls -la data/company-files/company-1/ | grep -v ".company-meta.json" | wc -l

# Should match fileCount in metadata
```

### Storage Usage

```bash
# Total storage used by all companies
du -sh data/company-files/

# Per-company storage
du -sh data/company-files/company-*/

# Largest files
find data/company-files/ -type f -exec ls -lh {} \; | sort -k5 -h | tail -20
```

## Troubleshooting Integration

### Issue: Files not in RAG

**Problem**: Uploaded file doesn't appear in RAG queries

**Check**:
1. File uploaded successfully? Check `/api/companies/1/files`
2. ragDocId assigned? Check .company-meta.json
3. rag_documents table? Query company DB
4. Chunk extraction? For PDF, may show "[PDF Document]" only

**Solution**: 
- For full PDF support, implement pdf-parse extraction
- Verify file_path in rag_documents: `company-files/{filename}`

### Issue: Cannot access master password

**Problem**: Master password not working

**Check**:
1. `.master-password` file exists? `ls -la .master-password`
2. Permissions correct? Should be 0o600
3. Matches hash? Run `FileManagement.verifyMasterPassword(password)`

**Solution**:
1. Delete `.master-password` file
2. Restart server (regenerates and displays)
3. Capture new master password immediately

### Issue: Company deletion incomplete

**Problem**: Company folder still exists after delete

**Check**:
1. File watcher closed? Should stop monitoring
2. Folder permissions? May need elevated permissions to delete
3. Open file handles? Some tool holding files open?

**Solution**:
1. Manually remove folder: `rm -rf data/company-files/company-{id}/`
2. Verify no processes using company DB
3. Check disk permissions

## Performance Considerations

### File Upload
- **Async operation**: Non-blocking
- **Size limit**: 500 MB per file
- **Indexing**: Synchronous (completes before response)
- **Expected time**: < 1s for small files, 5-30s for large

### RAG Chunk Creation
- **Chunk size**: 500 characters
- **Overlap**: 50 characters (for context)
- **Expected chunks**: ~200 for 100KB file
- **Query time**: 50-200ms per search

### File Listing
- **Load time**: Metadata file only (no disk scan)
- **Files per company**: No hard limit
- **Expected time**: < 50ms for 1000 files

### Cascade Deletion
- **File delete**: Delete file + metadata + RAG
- **Company delete**: Delete entire company-{id}/ folder
- **Expected time**: 1-5s per company (depends on file count)

## Future Enhancements

1. **Advanced File Operations**
   - Batch upload/download
   - File versioning
   - Folder structure support
   - Zip/archive creation

2. **Enhanced RAG Support**
   - PDF text extraction (pdf-parse)
   - Excel/CSV parsing
   - Image OCR
   - Custom chunk strategies

3. **Collaboration Features**
   - File sharing between companies
   - Comments and annotations
   - Approval workflows
   - Audit trails

4. **Security Enhancements**
   - File encryption at rest
   - Per-file access control
   - Fine-grained permissions
   - Virus scanning integration

5. **Performance**
   - Caching layer (Redis)
   - Streaming large files
   - Async chunk processing
   - Compression on storage

## Summary

The File Management System is fully integrated with the multi-company architecture:

✅ Company isolation at file system level
✅ Per-company RAG memory (company-specific DB)
✅ Multi-level access control (admin + master)
✅ User isolation (files tracked by user_id)
✅ Secure password management (bcryptjs)
✅ Real-time file monitoring
✅ Cascade deletion on company removal
✅ Metadata integrity tracking
✅ Path traversal protection
✅ Emergency master password for system admin

All components work together to provide a secure, isolated, and scalable file management system for multi-company deployments.
