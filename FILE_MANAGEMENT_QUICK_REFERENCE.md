# File Management System - Quick Reference

## 🚀 Quick Start

### Access Files
1. Navigate to `http://localhost:3000/files?companyId=1`
2. Enter admin or master password
3. Click "Verify Access"
4. Use drag-and-drop or click to upload

### API Quick Calls

**Upload File (curl)**
```bash
curl -X POST http://localhost:3000/api/companies/1/files/upload \
  -F "file=@myfile.pdf" \
  -F "password=admin123"
```

**List Files (curl)**
```bash
curl "http://localhost:3000/api/companies/1/files?password=admin123"
```

**Delete File (curl)**
```bash
curl -X DELETE http://localhost:3000/api/companies/1/files/1705769234-myfile.pdf \
  -H "Content-Type: application/json" \
  -d '{"password":"admin123"}'
```

## 🔐 Master Password Info

**Location**: `.master-password` file (root directory)
**Generated**: On first server startup
**Hashing**: bcryptjs 12 rounds (extra security)
**Display**: Console output only (one-time during initialization)
**Format**: 32-character hex string

### Getting the Master Password

1. **From Console Output**: Visible during first server startup
2. **From Service**: `FileManagement.getMasterPassword()`
3. **From File**: `.master-password` contains hashed version (cannot read plaintext)

## 📁 File Structure

```
data/company-files/
├── company-1/
│   ├── .company-meta.json         ← Metadata (tracks all files)
│   ├── 1705769234-invoice.pdf     ← Stored files
│   └── 1705769245-training.txt
├── company-2/
│   ├── .company-meta.json
│   └── 1705769300-client.xlsx
└── company-3/
```

**Permissions**:
- Files: `0o600` (owner read/write only)
- Folders: `0o700` (owner access only)
- Metadata: `0o600` (owner read/write only)

## 🗂️ File Operations

| Operation | Endpoint | Method | Auth | Notes |
|-----------|----------|--------|------|-------|
| Upload | `/api/companies/:id/files/upload` | POST | Password | Auto-indexes to RAG |
| List | `/api/companies/:id/files` | GET | Password | Returns file metadata |
| Download | `/api/companies/:id/files/:name` | GET | Password | Streams file content |
| Delete | `/api/companies/:id/files/:name` | DELETE | Password | Cascade removes from RAG |
| Stats | `/api/companies/:id/files/stats` | GET | Password | Folder statistics |
| Verify | `/api/files/verify-access` | POST | Password | Test password access |
| Status | `/api/files/master-status` | GET | None | Check master password set |

## 🔑 Password Types

### Admin Password
- **Scope**: Company-specific
- **Access**: That company's files
- **Hash**: bcryptjs 10 rounds
- **Storage**: Company database (users table)
- **Use Case**: Day-to-day file management

### Master Password
- **Scope**: System-wide
- **Access**: ALL company files
- **Hash**: bcryptjs 12 rounds
- **Storage**: `.master-password` file (mode 0o600)
- **Use Case**: Emergency access / system administration

## 🧠 RAG Integration

**Auto-Indexing**: Files automatically added to RAG on upload
**Content Extraction**:
- Text files: Full content
- JSON: Parsed content
- PDF: Filename placeholder (full extraction requires pdf-parse)
- Others: Mimetype + filename

**Chunking**:
- Size: 500 characters per chunk
- Overlap: 50 characters between chunks
- Storage: `rag_documents` + `rag_chunks` tables

**Cascade Deletion**: When file deleted, RAG entries automatically removed

## 📊 Statistics

```json
{
  "fileCount": 3,
  "totalSize": 5242880,
  "totalSizeFormatted": "5.00 MB",
  "created": "2026-01-20T10:30:45.123Z",
  "lastModified": "2026-01-20T11:45:30.456Z"
}
```

## ⚠️ Security Checklist

- [ ] Master password saved in secure location
- [ ] `.master-password` NOT committed to git
- [ ] File permissions verified (0o600, 0o700)
- [ ] HTTPS enabled for production
- [ ] Admin passwords changed on user departure
- [ ] File size limits enforced (500 MB)
- [ ] Dangerous file types blocked (.exe, .bat, etc.)

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| Master password not visible | Check server.log during startup |
| Can't access files | Verify password for correct company |
| File not in RAG | Check rag_documents table, file extraction may be limited |
| Delete fails | Check metadata file (.company-meta.json) exists |
| Access denied | Try master password, verify admin user in DB |

## 📦 File Limits

- **File Size**: 500 MB per file
- **Folder Size**: Limited by disk space
- **File Count**: No limit per company
- **Blocked Types**: .exe, .bat, .sh, .cmd, .com, .pif, .scr, .vbs

## 🔗 Related Components

- **FileManagementService**: Core service (services/file-management.js)
- **File Routes**: API endpoints (routes/file-routes.js)
- **File UI**: Web interface (files.html)
- **Company DB**: Per-company database (services/company-db.js)

## 📝 Example: Complete File Upload Workflow

```
User navigates to /files?companyId=1
↓
Enters admin password
↓
Clicks "Verify Access"
↓
POST /api/files/verify-access
Response: { authorized: true }
↓
UI unlocks file management
↓
Drags file: "invoice.pdf"
↓
POST /api/companies/1/files/upload (multipart)
↓
Server:
  1. Saves to disk: data/company-files/company-1/1705769234-invoice.pdf
  2. Extracts content
  3. Creates RAG document
  4. Creates RAG chunks
  5. Updates metadata
↓
Response: { 
  id: 42,
  filename: "1705769234-invoice.pdf",
  ragEnabled: true
}
↓
GET /api/companies/1/files (refresh list)
↓
Response: [
  { filename: "...", size: ..., ragDocId: 42, ... }
]
↓
User can now:
  - Download: GET /api/companies/1/files/1705769234-invoice.pdf
  - Delete: DELETE /api/companies/1/files/1705769234-invoice.pdf
  - Query in RAG: "What's in the invoice?"
```

## 🎯 Key Features

✅ Company-specific folder isolation
✅ Password-protected access (admin + master)
✅ Automatic RAG indexing on upload
✅ Cascade deletion (removes from RAG)
✅ File watching with chokidar
✅ Path traversal protection
✅ Secure password hashing (bcryptjs)
✅ File metadata tracking
✅ Statistics and monitoring
✅ Real-time UI with drag-and-drop

## 📞 Getting Help

1. Check FILE_MANAGEMENT_GUIDE.md for detailed documentation
2. Review file-routes.js for endpoint implementation
3. Check FileManagementService for core logic
4. View files.html for UI implementation
5. Check server logs for error messages
