package audit

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Standardized Audit Action Constants
const (
	// Authentication & Session
	ActionLoginSuccess     = "LOGIN_SUCCESS"
	ActionLoginFailed      = "LOGIN_FAILED"
	ActionAdminLoginSuccess = "ADMIN_LOGIN_SUCCESS"
	ActionAdminLoginFailed  = "ADMIN_LOGIN_FAILED"
	ActionLogout           = "LOGOUT"
	ActionAdminLogout      = "ADMIN_LOGOUT"
	ActionSessionExpired   = "SESSION_EXPIRED"
	ActionSessionRevoked   = "SESSION_REVOKED"
	ActionSessionRefreshed = "SESSION_REFRESHED"
	ActionRateLimited      = "RATE_LIMITED"
	ActionAccessDenied     = "ACCESS_DENIED"

	// Candidate & Public Actions
	ActionUserRegistered    = "USER_REGISTERED"
	ActionApplicationSubmit = "APPLICATION_SUBMITTED"
	ActionDocumentUploaded  = "DOCUMENT_UPLOADED"

	// Administrative Review & Moderation
	ActionApplicationApprove        = "APPLICATION_APPROVED"
	ActionApplicationReject         = "APPLICATION_REJECTED"
	ActionApplicationInspected      = "APPLICATION_INSPECTED"
	ActionApplicationDossierUpdated = "APPLICATION_DOSSIER_UPDATED"
	ActionApplicationsViewed        = "APPLICATIONS_LIST_VIEWED"
	ActionCandidatesViewed          = "CANDIDATES_LIST_VIEWED"
	ActionDataExported              = "DATA_EXPORTED"

	// Super Admin Category Management
	ActionCategoryCreated = "CATEGORY_CREATED"
	ActionCategoryUpdated = "CATEGORY_UPDATED"
	ActionCategoryToggled = "CATEGORY_TOGGLED"
	ActionCategoryDeleted = "CATEGORY_DELETED"
	ActionQuotaUpdated    = "CATEGORY_QUOTA_UPDATED"

	// Super Admin User & RBAC Management
	ActionUserRoleUpdated = "USER_ROLE_UPDATED"
	ActionUsersListViewed = "USERS_LIST_VIEWED"
	ActionAuditLogsViewed = "AUDIT_LOGS_VIEWED"
)

// AuditEntry represents a structured, immutable audit log entry.
type AuditEntry struct {
	ID           string    `json:"id"`
	Timestamp    time.Time `json:"timestamp"`
	ActorID      *string   `json:"actor_id,omitempty"`
	ActorRole    string    `json:"actor_role"`
	Action       string    `json:"action"`
	TargetID     *string   `json:"target_id,omitempty"`
	ResourceType string    `json:"resource_type,omitempty"`
	IPAddress    string    `json:"ip_address,omitempty"`
	UserAgent    string    `json:"user_agent,omitempty"`
	BeforeState  any       `json:"before_state,omitempty"`
	AfterState   any       `json:"after_state,omitempty"`
	Details      any       `json:"details,omitempty"`
	Status       string    `json:"status"`
	Checksum     string    `json:"checksum"`
}

// AuditFileManager manages persistent date-organized append-only audit files.
type AuditFileManager struct {
	mu      sync.Mutex
	baseDir string
}

var defaultFileManager *AuditFileManager

// Init initializes the persistent audit log file manager with a target directory.
func Init(logDir string) {
	if logDir == "" {
		logDir = "./logs/audit"
	}

	if err := os.MkdirAll(logDir, 0755); err != nil {
		log.Printf("[AUDIT CRITICAL] Failed to create audit log directory %s: %v", logDir, err)
	}

	defaultFileManager = &AuditFileManager{
		baseDir: logDir,
	}
	log.Printf("[AUDIT SYSTEM] Initialized persistent date-partitioned file logger at: %s", logDir)
}

func getFileManager() *AuditFileManager {
	if defaultFileManager == nil {
		Init("./logs/audit")
	}
	return defaultFileManager
}

// sensitiveKeys defines patterns of attributes that must never be recorded in audit logs.
var sensitiveKeys = []string{
	"password", "passwd", "secret", "token", "auth", "jwt",
	"credential", "bearer", "cookie", "csrf", "hash", "salt",
	"account_number", "bank_account", "card_number", "cvv", "pin",
	"ifsc", "aadhaar", "private_key", "passbook",
}

func isSensitiveKey(key string) bool {
	lower := strings.ToLower(key)
	for _, k := range sensitiveKeys {
		if strings.Contains(lower, k) {
			return true
		}
	}
	return false
}

// Redact recursively masks sensitive credentials, tokens, and payment secrets.
func Redact(data any) any {
	if data == nil {
		return nil
	}

	switch v := data.(type) {
	case string, int, int8, int16, int32, int64, uint, uint8, uint16, uint32, uint64, float32, float64, bool:
		return v

	case map[string]any:
		cleaned := make(map[string]any, len(v))
		for k, val := range v {
			if isSensitiveKey(k) {
				cleaned[k] = "[REDACTED]"
			} else {
				cleaned[k] = Redact(val)
			}
		}
		return cleaned

	case map[string]string:
		cleaned := make(map[string]string, len(v))
		for k, val := range v {
			if isSensitiveKey(k) {
				cleaned[k] = "[REDACTED]"
			} else {
				cleaned[k] = val
			}
		}
		return cleaned

	case []any:
		cleaned := make([]any, len(v))
		for i, val := range v {
			cleaned[i] = Redact(val)
		}
		return cleaned

	default:
		// Attempt JSON round-trip for structs or custom types
		rawBytes, err := json.Marshal(data)
		if err != nil {
			return data
		}
		var generic any
		if err := json.Unmarshal(rawBytes, &generic); err == nil {
			if _, isMap := generic.(map[string]any); isMap {
				return Redact(generic)
			}
			if _, isSlice := generic.([]any); isSlice {
				return Redact(generic)
			}
			return generic
		}
		return data
	}
}

// computeChecksum creates a SHA-256 integrity hash of the entry content.
func computeChecksum(entry *AuditEntry) string {
	raw := fmt.Sprintf("%s|%s|%s|%s|%s|%s",
		entry.ID,
		entry.Timestamp.Format(time.RFC3339Nano),
		entry.ActorRole,
		entry.Action,
		entry.Status,
		entry.IPAddress,
	)
	hash := sha256.Sum256([]byte(raw))
	return "sha256:" + hex.EncodeToString(hash[:])
}

// AppendToFile writes the audit entry to the daily persistent log file.
func (m *AuditFileManager) AppendToFile(entry *AuditEntry) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	// Determine file by date: audit-YYYY-MM-DD.log
	dateStr := entry.Timestamp.Format("2006-01-02")
	fileName := fmt.Sprintf("audit-%s.log", dateStr)
	filePath := filepath.Join(m.baseDir, fileName)

	// Ensure directory exists
	if err := os.MkdirAll(m.baseDir, 0755); err != nil {
		return fmt.Errorf("failed to ensure audit directory: %w", err)
	}

	// Open in append-only mode (O_APPEND | O_CREATE | O_WRONLY)
	file, err := os.OpenFile(filePath, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0600)
	if err != nil {
		return fmt.Errorf("failed to open audit file: %w", err)
	}
	defer file.Close()

	lineBytes, err := json.Marshal(entry)
	if err != nil {
		return fmt.Errorf("failed to serialize audit entry: %w", err)
	}

	// Append entry with newline
	lineBytes = append(lineBytes, '\n')
	if _, err := file.Write(lineBytes); err != nil {
		return fmt.Errorf("failed to write audit entry to file: %w", err)
	}

	return nil
}

// Log records an audit event to both the date-partitioned server log file AND PostgreSQL.
func Log(
	ctx context.Context,
	pool *pgxpool.Pool,
	actorID *string,
	actorRole string,
	action string,
	targetID *string,
	ipAddress string,
	beforeState any,
	afterState any,
	details map[string]any,
	status string,
) {
	LogDetailed(ctx, pool, actorID, actorRole, action, targetID, "", ipAddress, "", beforeState, afterState, details, status)
}

// LogDetailed records an audit event with full metadata including ResourceType and UserAgent.
func LogDetailed(
	ctx context.Context,
	pool *pgxpool.Pool,
	actorID *string,
	actorRole string,
	action string,
	targetID *string,
	resourceType string,
	ipAddress string,
	userAgent string,
	beforeState any,
	afterState any,
	details map[string]any,
	status string,
) {
	if status == "" {
		status = "SUCCESS"
	}
	if actorRole == "" {
		actorRole = "ANONYMOUS"
	}

	now := time.Now().UTC()
	entryID := uuid.New().String()

	// Redact sensitive data from all states and details
	cleanBefore := Redact(beforeState)
	cleanAfter := Redact(afterState)
	cleanDetails := Redact(details)

	entry := &AuditEntry{
		ID:           entryID,
		Timestamp:    now,
		ActorID:      actorID,
		ActorRole:    actorRole,
		Action:       action,
		TargetID:     targetID,
		ResourceType: resourceType,
		IPAddress:    ipAddress,
		UserAgent:    userAgent,
		BeforeState:  cleanBefore,
		AfterState:   cleanAfter,
		Details:      cleanDetails,
		Status:       status,
	}
	entry.Checksum = computeChecksum(entry)

	// 1. Persistent Append-Only Date-Partitioned File Storage
	fm := getFileManager()
	if err := fm.AppendToFile(entry); err != nil {
		log.Printf("[AUDIT ERROR] Failed to append entry to daily audit file: %v", err)
	}

	// 2. PostgreSQL Persistent Database Storage
	if pool != nil {
		var beforeJSON, afterJSON, detailsJSON []byte
		if cleanBefore != nil {
			beforeJSON, _ = json.Marshal(cleanBefore)
		}
		if cleanAfter != nil {
			afterJSON, _ = json.Marshal(cleanAfter)
		}
		if cleanDetails != nil {
			detailsJSON, _ = json.Marshal(cleanDetails)
		} else {
			detailsJSON = []byte("{}")
		}

		var adminID *string
		if actorRole == "SUPER_ADMIN" || actorRole == "REVIEWER_ADMIN" {
			adminID = actorID
		}

		// Non-blocking database insert (trigger enforces immutability against UPDATE/DELETE)
		go func() {
			bgCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
			defer cancel()

			_, err := pool.Exec(bgCtx, `
				INSERT INTO audit_log (
					admin_id, actor_id, actor_role, action, target_id,
					resource_type, ip_address, user_agent,
					before_state, after_state, details, status, created_at
				) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
			`, adminID, actorID, actorRole, action, targetID,
				resourceType, ipAddress, userAgent,
				beforeJSON, afterJSON, detailsJSON, status, now)

			if err != nil {
				log.Printf("[AUDIT ERROR] Failed to record audit log to database for %s: %v", action, err)
			}
		}()
	}
}

// AuditLogFilter specifies parameters for querying historical audit logs.
type AuditLogFilter struct {
	Page         int
	PageSize     int
	Action       string
	ActorRole    string
	Search       string
	ResourceType string
	StartDate    string
	EndDate      string
}

// AuditLogResult represents paginated audit log entries.
type AuditLogResult struct {
	Total   int               `json:"total"`
	Page    int               `json:"page"`
	Size    int               `json:"page_size"`
	Entries []AuditLogRowItem `json:"entries"`
}

type AuditLogRowItem struct {
	ID           int64           `json:"id"`
	ActorID      *string         `json:"actor_id,omitempty"`
	ActorRole    string          `json:"actor_role"`
	Action       string          `json:"action"`
	TargetID     *string         `json:"target_id,omitempty"`
	ResourceType *string         `json:"resource_type,omitempty"`
	IPAddress    *string         `json:"ip_address,omitempty"`
	UserAgent    *string         `json:"user_agent,omitempty"`
	BeforeState  json.RawMessage `json:"before_state,omitempty"`
	AfterState   json.RawMessage `json:"after_state,omitempty"`
	Details      json.RawMessage `json:"details,omitempty"`
	Status       string          `json:"status"`
	CreatedAt    time.Time       `json:"created_at"`
}

// ListLogs retrieves audit records from the tamper-resistant database.
func ListLogs(ctx context.Context, pool *pgxpool.Pool, filter AuditLogFilter) (*AuditLogResult, error) {
	if filter.Page < 1 {
		filter.Page = 1
	}
	if filter.PageSize < 1 || filter.PageSize > 100 {
		filter.PageSize = 25
	}
	offset := (filter.Page - 1) * filter.PageSize

	whereParts := []string{"1=1"}
	args := []any{}
	argIdx := 1

	if filter.Action != "" {
		whereParts = append(whereParts, fmt.Sprintf("action = $%d", argIdx))
		args = append(args, filter.Action)
		argIdx++
	}

	if filter.ActorRole != "" {
		whereParts = append(whereParts, fmt.Sprintf("actor_role = $%d", argIdx))
		args = append(args, filter.ActorRole)
		argIdx++
	}

	if filter.ResourceType != "" {
		whereParts = append(whereParts, fmt.Sprintf("resource_type = $%d", argIdx))
		args = append(args, filter.ResourceType)
		argIdx++
	}

	if filter.Search != "" {
		searchTerm := "%" + strings.ToLower(filter.Search) + "%"
		whereParts = append(whereParts, fmt.Sprintf("(LOWER(action) LIKE $%d OR LOWER(COALESCE(resource_type, '')) LIKE $%d OR LOWER(COALESCE(ip_address, '')) LIKE $%d)", argIdx, argIdx, argIdx))
		args = append(args, searchTerm)
		argIdx++
	}

	if filter.StartDate != "" {
		whereParts = append(whereParts, fmt.Sprintf("created_at >= $%d::timestamptz", argIdx))
		args = append(args, filter.StartDate)
		argIdx++
	}

	if filter.EndDate != "" {
		whereParts = append(whereParts, fmt.Sprintf("created_at <= $%d::timestamptz", argIdx))
		args = append(args, filter.EndDate+" 23:59:59.999Z")
		argIdx++
	}

	whereClause := strings.Join(whereParts, " AND ")

	// Count total matching records
	var total int
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM audit_log WHERE %s", whereClause)
	if err := pool.QueryRow(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, fmt.Errorf("failed to count audit logs: %w", err)
	}

	// Fetch rows
	args = append(args, filter.PageSize, offset)
	dataQuery := fmt.Sprintf(`
		SELECT id, actor_id, actor_role, action, target_id, resource_type,
		       ip_address, user_agent, before_state, after_state, details, status, created_at
		FROM audit_log
		WHERE %s
		ORDER BY id DESC
		LIMIT $%d OFFSET $%d
	`, whereClause, argIdx, argIdx+1)

	rows, err := pool.Query(ctx, dataQuery, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to query audit logs: %w", err)
	}
	defer rows.Close()

	var entries []AuditLogRowItem
	for rows.Next() {
		var row AuditLogRowItem
		if err := rows.Scan(
			&row.ID, &row.ActorID, &row.ActorRole, &row.Action, &row.TargetID,
			&row.ResourceType, &row.IPAddress, &row.UserAgent,
			&row.BeforeState, &row.AfterState, &row.Details, &row.Status, &row.CreatedAt,
		); err != nil {
			continue
		}
		entries = append(entries, row)
	}
	if entries == nil {
		entries = []AuditLogRowItem{}
	}

	return &AuditLogResult{
		Total:   total,
		Page:    filter.Page,
		Size:    filter.PageSize,
		Entries: entries,
	}, nil
}

// AuditFileInfo summarizes a daily audit log file stored on disk.
type AuditFileInfo struct {
	Date         string `json:"date"`
	FileName     string `json:"filename"`
	SizeBytes    int64  `json:"size_bytes"`
	LastModified string `json:"last_modified"`
}

// ListLogFiles returns the inventory of date-organized audit log files on disk.
func ListLogFiles() ([]AuditFileInfo, error) {
	fm := getFileManager()
	fm.mu.Lock()
	defer fm.mu.Unlock()

	entries, err := os.ReadDir(fm.baseDir)
	if err != nil {
		return nil, err
	}

	var files []AuditFileInfo
	for _, entry := range entries {
		if entry.IsDir() || !strings.HasPrefix(entry.Name(), "audit-") || !strings.HasSuffix(entry.Name(), ".log") {
			continue
		}
		info, err := entry.Info()
		if err != nil {
			continue
		}
		datePart := strings.TrimSuffix(strings.TrimPrefix(entry.Name(), "audit-"), ".log")
		files = append(files, AuditFileInfo{
			Date:         datePart,
			FileName:     entry.Name(),
			SizeBytes:    info.Size(),
			LastModified: info.ModTime().Format(time.RFC3339),
		})
	}

	if files == nil {
		files = []AuditFileInfo{}
	}
	return files, nil
}
