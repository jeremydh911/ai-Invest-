# File Management System - Complete Guide

## Overview

The File Management System provides secure, company-specific file storage with RAG (Retrieval-Augmented Generation) memory integration. Each company has its own isolated folder structure, access control, and automatic RAG indexing.

## Features

### 1. **Company-Specific File Folders**
- Isolated storage: `data/company-files/company-{id}/`
- File permissions: `0o600` (owner read/write only)
- Folder permissions: `0o700` (owner access only)
- Metadata tracking: `.company-meta.json` per company

### 2. **Secure Access Control**
- **Admin Password**: Company admin password for folder access
- **Master Password**: System-wide backdoor for administrators
- Password verification via bcryptjs with 10+ rounds
- Master password: 12-round hashing (extra security)

### 3. **RAG Memory Integration**
- Files auto-indexed on upload
- Creates `rag_documents` entries in company database
- Automatic chunking with 500-char segments (50-char overlap)
- Files immediately available for RAG queries

### 4. **File Lifecycle Management**
- Upload: Store file + add to RAG
- Download: Verify access + stream file
- Delete: Remove file + cascade delete from RAG
- Company deletion: Auto-delete entire folder

### 5. **Real-Time Monitoring**
- Chokidar file watcher per company
- Monitors additions and deletions
- Logs changes to console
- Extensible for auto-indexing

## API Endpoints

### Upload File
```
POST /api/companies/:companyId/files/upload
Headers: Content-Type: multipart/form-data
Body:
  - file: <binary file>
  - password: <admin or master password>
  - isMaster: true|false (optional, defaults false)

Response:
{
  "message": "File uploaded successfully",
  "file": {
    "id": 42,
    "filename": "1705769234-invoice.pdf",
    "originalName": "invoice.pdf",
    "size": 2097152,
    "mimetype": "application/pdf",
    "uploadedAt": "2026-01-20T...",
    "ragEnabled": true
  }
}
```

### List Company Files
```
GET /api/companies/:companyId/files?password=xxx&isMaster=false

Response:
{
  "files": [
    {
      "filename": "1705769234-invoice.pdf",
      "size": 2097152,
      "ragDocId": 42,
      "uploadedAt": "2026-01-20T..."
    }
  ],
  "stats": {
    "fileCount": 3,
    "totalSize": 5242880,
    "totalSizeFormatted": "5.00 MB",
    "created": "2026-01-20T...",
    "lastModified": "2026-01-20T..."
  }
}
```

### Download File
```
GET /api/companies/:companyId/files/:filename?password=xxx&isMaster=false

Response: Binary file content
Header: Content-Disposition: attachment; filename="original-name"
```

### Delete File
```
DELETE /api/companies/:companyId/files/:filename
Headers: Content-Type: application/json
Body:
{
  "password": "<admin or master password>",
  "isMaster": false
}

Response:
{
  "message": "File deleted and removed from RAG",
  "file": "1705769234-invoice.pdf"
}
```

### Get Folder Statistics
```
GET /api/companies/:companyId/files/stats?password=xxx&isMaster=false

Response:
{
  "fileCount": 3,
  "totalSize": 5242880,
  "totalSizeFormatted": "5.00 MB",
  "created": "2026-01-20T...",
  "lastModified": "2026-01-20T..."
}
```

### Verify Folder Access
```
POST /api/files/verify-access
Headers: Content-Type: application/json
Body:
{
  "companyId": 1,
  "password": "<password>",
  "isMaster": false
}

Response:
{
  "authorized": true,
  "accessType": "admin"
}
```

### Check Master Password Status
```
GET /api/files/master-status

Response:
{
  "masterPasswordSet": true,
  "message": "Master backdoor is secured"
}
```

## User Interface

### File Management Page: `/files.html`

**Features:**
- Password-protected access verification
- Drag-and-drop file upload
- File list with metadata
- Download and delete buttons
- Real-time statistics display
- Master/admin password toggle

**Access Flow:**
1. User navigates to `/files?companyId=1`
2. Enters admin or master password
3. Clicks "Verify Access"
4. File management panel unlocks
5. Can upload, download, delete files
6. Folder statistics displayed

## Security Architecture

### Password Security Levels

#### Admin Password (10 rounds)
```javascript
// Used for company-specific file access
bcrypt.hashSync(password, 10);

// Stored in company database: users table (is_admin=1)
// Verified by comparing user input with stored hash
```

#### Master Password (12 rounds)
```javascript
// Used for system-wide backdoor access
bcrypt.hashSync(masterPassword, 12);

// Stored in: .master-password file (mode 0o600)
// File permissions: Owner read-only
// Generated once during initialization
```

### File Permissions

```
File Permissions: 0o600
  - Owner: read + write
  - Group: none
  - Others: none

Folder Permissions: 0o700
  - Owner: read + write + execute
  - Group: none
  - Others: none

Metadata File: 0o600
  - Only owner can read/write
  - Contains file inventory and RAG references
```

### Path Traversal Protection

All file operations validate paths:

```javascript
// Prevent escaping company folder
if (!filePath.startsWith(this.getCompanyFolderPath(companyId))) {
  throw new Error('Invalid file path');
}
```

## File Storage Structure

### Directory Layout
```
data/company-files/
├── company-1/
│   ├── .company-meta.json        (metadata file, mode 0o600)
│   ├── 1705769234-invoice.pdf    (mode 0o600)
│   ├── 1705769245-training.txt   (mode 0o600)
│   └── 1705769256-guide.docx     (mode 0o600)
├── company-2/
│   ├── .company-meta.json
│   ├── 1705769300-client.xlsx    (mode 0o600)
│   └── 1705769315-procedures.pdf (mode 0o600)
└── company-3/
    └── [files...]
```

### Metadata File (.company-meta.json)
```json
{
  "companyId": 1,
  "companyName": "TechCorp Inc",
  "created": "2026-01-20T10:30:45.123Z",
  "lastModified": "2026-01-20T11:45:30.456Z",
  "fileCount": 3,
  "totalSize": 5242880,
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
    }
  ]
}
```

## RAG Integration Details

### Auto-Indexing Process

1. **File Upload Triggers:**
   - User uploads file via POST `/api/companies/:id/files/upload`
   - File saved to disk
   - Content extracted (text, PDF, JSON)
   - RAG document created

2. **RAG Document Creation:**
   ```sql
   INSERT INTO rag_documents (
     user_id, 
     title, 
     content, 
     file_path
   ) VALUES (?, ?, ?, ?)
   ```
   - Title: Filename
   - Content: Extracted text
   - File path: `company-files/{filename}`

3. **Chunk Creation:**
   - Content split into 500-character chunks
   - 50-character overlap between chunks
   - All chunks indexed under document
   ```sql
   INSERT INTO rag_chunks (
     document_id, 
     chunk_text
   ) VALUES (?, ?)
   ```

4. **Query Integration:**
   - Files immediately searchable via RAG queries
   - Company isolation: Each company's RAG separate
   - User isolation: File source tracked by user_id

### Cascade Deletion

When file deleted:
1. Delete all rag_chunks for document
2. Delete rag_documents entry
3. Delete physical file from disk
4. Update metadata file

## Master Password Management

### Initialization (First Startup)

1. Service constructor runs `initializeMasterPassword()`
2. Checks if `.master-password` exists
3. If not:
   - Generates 32-character cryptographically secure hex
   - Hashes with bcryptjs (12 rounds)
   - Stores hashed version in `.master-password` (mode 0o600)
   - **Displays plaintext to console ONCE** (user responsibility to save)
   - Returns password to caller

### Console Output
```
╔════════════════════════════════════════════════════════════╗
║         🔐 MASTER BACKDOOR PASSWORD - SECURE COPY          ║
╚════════════════════════════════════════════════════════════╝

⚠️  CRITICAL: Save this password in a secure location.

Master Password: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6

This password grants access to all company files.
Do NOT share. Do NOT commit to version control.
═══════════════════════════════════════════════════════════
```

### Verification

- Plaintext: Available via `FileManagement.getMasterPassword()` (for authorized access)
- Verification: `FileManagement.verifyMasterPassword(password)` compares input to bcrypt hash
- File-based: Stored hash in `.master-password` (readable only by owner)

### Usage Recommendations

**For System Administrators:**
1. Capture console output during first startup
2. Store in secure password manager (1Password, Bitwarden, etc.)
3. Never commit to version control
4. Never share via email or chat
5. Use only in emergency situations
6. Consider rotating on company deletion

**For User File Access:**
1. Use admin password (company-specific)
2. Master password is backup only
3. Each company has own admin password
4. Admin password stored in company database

## Implementation Details

### FileManagementService Class

**Key Methods:**

```javascript
// Company Management
createCompanyFolder(companyId, companyName)
deleteCompanyFolder(companyId)

// File Operations
uploadFile(companyId, userId, fileData)
getFile(companyId, filename)
deleteFile(companyId, filename)
listCompanyFiles(companyId)

// RAG Integration
addToRagMemory(companyId, userId, filename, buffer, mimetype)
removeFromRagMemory(companyId, ragDocId)

// Access Control
verifyFolderAccess(companyId, password, isMaster)
verifyMasterPassword(password)
getMasterPassword()

// Monitoring
startFileWatcher(companyId)

// Utilities
getCompanyFolderPath(companyId)
getCompanyFolderStats(companyId)
formatBytes(bytes)
```

### Route Handlers

```javascript
// File Routes (routes/file-routes.js)

POST /api/companies/:companyId/files/upload
GET /api/companies/:companyId/files
GET /api/companies/:companyId/files/:filename
DELETE /api/companies/:companyId/files/:filename
GET /api/companies/:companyId/files/stats
POST /api/files/verify-access
GET /api/files/master-status
```

## Error Handling

### Common Errors

1. **Invalid Password**
   ```
   Status: 403
   Message: "Invalid password"
   ```

2. **File Not Found**
   ```
   Status: 404
   Message: "File not found"
   ```

3. **Path Traversal Attempt**
   ```
   Status: 403
   Message: "Invalid file path"
   ```

4. **Company Folder Missing**
   ```
   Status: 404
   Message: "Company folder not found"
   ```

5. **Insufficient Permissions**
   ```
   Status: 403
   Message: "Access denied"
   ```

## Configuration

### Environment Variables

```
# Port for server
PORT=3000

# Database
DB_PATH=data/

# File Storage
FILE_MAX_SIZE=500MB    # Maximum file size
FILE_CHUNK_SIZE=500    # RAG chunk size (characters)
CHUNK_OVERLAP=50       # RAG chunk overlap (characters)
```

### File Limits

- **File Size**: 500 MB per file
- **Total Folder Size**: No limit (check available disk)
- **File Count**: No limit per folder
- **Dangerous Extensions**: `.exe`, `.bat`, `.sh`, `.cmd`, `.com`, `.pif`, `.scr`, `.vbs` (blocked)

## Testing

### Manual Testing

**1. Upload File**
```bash
curl -X POST http://localhost:3000/api/companies/1/files/upload \
  -F "file=@document.pdf" \
  -F "password=admin123" \
  -F "isMaster=false"
```

**2. List Files**
```bash
curl "http://localhost:3000/api/companies/1/files?password=admin123&isMaster=false"
```

**3. Download File**
```bash
curl -O "http://localhost:3000/api/companies/1/files/1705769234-document.pdf?password=admin123"
```

**4. Delete File**
```bash
curl -X DELETE http://localhost:3000/api/companies/1/files/1705769234-document.pdf \
  -H "Content-Type: application/json" \
  -d '{"password":"admin123","isMaster":false}'
```

**5. Verify Master Password**
```bash
curl -X POST http://localhost:3000/api/files/verify-access \
  -H "Content-Type: application/json" \
  -d '{"companyId":1,"password":"[master-password]","isMaster":true}'
```

## Troubleshooting

### Master Password Not Displaying

**Problem:** Console output not visible during startup

**Solution:**
1. Start server with explicit logging: `node server.js 2>&1 | tee server.log`
2. Check server.log file for password
3. If not found, regenerate: Delete `.master-password` file and restart

### Files Not Indexing to RAG

**Problem:** Uploaded files not appearing in RAG queries

**Solution:**
1. Check company database: `rag_documents` table
2. Verify `addToRagMemory()` executed during upload
3. Check file mimetype support (PDF extraction not implemented)
4. View server logs for RAG indexing errors

### Folder Access Denied

**Problem:** "Invalid password" when using correct password

**Solution:**
1. Verify password is for correct company
2. Confirm admin user created in company database
3. Check password hasn't expired
4. Try master password instead
5. Verify user `is_admin=1` in database

### File Deletion Cascade Issues

**Problem:** File deleted but RAG entry remains

**Solution:**
1. Check metadata file (`.company-meta.json`)
2. Verify ragDocId exists in file entry
3. Manually remove from RAG if corrupted
4. Rebuild metadata: Delete `.company-meta.json` and refresh folder

## Best Practices

1. **Master Password**
   - Store in secure password manager
   - Rotate every 90 days
   - Use only for emergencies
   - Audit access attempts

2. **Admin Passwords**
   - Set strong passwords (12+ chars, mixed case)
   - Share only with authorized admins
   - Change on user departure
   - Track password resets

3. **File Organization**
   - Use consistent naming conventions
   - Archive old files regularly
   - Monitor folder size
   - Clean up obsolete files

4. **RAG Integration**
   - Understand that PDFs extract as "[PDF Document]" for now
   - Monitor chunk overlap for search quality
   - Test RAG queries with uploaded content
   - Consider content extraction library for production

5. **Security**
   - Never commit `.master-password` to version control
   - Use HTTPS for production
   - Implement rate limiting on upload
   - Log all file access attempts
   - Monitor disk space

## Future Enhancements

1. **Advanced File Type Support**
   - PDF text extraction (pdf-parse)
   - Excel/CSV parsing (xlsx, papaparse)
   - Word document extraction (docx)
   - Image OCR (Tesseract)

2. **File Versioning**
   - Keep upload history
   - Restore previous versions
   - Track changes by user

3. **Collaborative Features**
   - File sharing within company
   - Comments and annotations
   - Approval workflows

4. **Advanced Search**
   - Full-text search integration
   - Metadata indexing
   - Tag-based organization

5. **Streaming & Compression**
   - Stream large files
   - Zip download for multiple files
   - Resume broken uploads

## Support

For issues or questions:
1. Check server logs: Check console output during startup
2. Review `.master-password` existence: `ls -la .master-password`
3. Verify metadata: Check `.company-meta.json` in company folder
4. Test connectivity: Use `/api/files/master-status` endpoint
