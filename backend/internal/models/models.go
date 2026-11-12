package models

import "time"

type User struct {
	ID           string    `json:"id" db:"id"`
	MobileNumber string    `json:"mobile_number" db:"mobile_number"`
	Email        *string   `json:"email,omitempty" db:"email"`
	PasswordHash string    `json:"-" db:"password_hash"`
	Role         string    `json:"role" db:"role"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
}

type JobCategory struct {
	ID             int    `json:"id" db:"id"`
	Code           string `json:"code" db:"code"`
	Title          string `json:"title" db:"title"`
	ApprovalLimit  int    `json:"approval_limit" db:"approval_limit"`
	ApprovedCount  int    `json:"approved_count" db:"approved_count"`
	IsApprovalOpen bool   `json:"is_approval_open" db:"is_approval_open"`
}

type Application struct {
	ID               string      `json:"id"`
	RegistrationNo   string      `json:"registration_no"`
	UserID           string      `json:"user_id"`
	CategoryID       int         `json:"category_id"`
	FullName         string      `json:"full_name"`
	GuardianName     string      `json:"guardian_name"`
	DOB              string      `json:"dob"`
	Gender           string      `json:"gender"`
	AltMobile        *string     `json:"alt_mobile,omitempty"`
	GovIDType        string      `json:"gov_id_type"`
	GovIDLast4       string      `json:"gov_id_last4"`
	SocialCategory   string      `json:"social_category"`
	AddressFull      string      `json:"address_full"`
	DistrictStatePin string      `json:"district_state_pin"`
	EmergencyContact interface{} `json:"emergency_contact"`
	HighestQual      string      `json:"highest_qual"`
	InstitutionName  *string     `json:"institution_name,omitempty"`
	Occupation       string      `json:"occupation"`
	PrevTraining     *string     `json:"prev_training,omitempty"`
	PriorExperience  interface{} `json:"prior_experience"`
	DisabilityReq    interface{} `json:"disability_req"`
	PreferredCentre  *string     `json:"preferred_centre,omitempty"`
	TrainingMode     string      `json:"training_mode"`
	BankHolderName   *string     `json:"bank_holder_name,omitempty"`
	BankNameBranch   *string     `json:"bank_name_branch,omitempty"`
	AccountNumber    *string     `json:"account_number,omitempty"`
	IFSCCode         *string     `json:"ifsc_code,omitempty"`
	Documents        interface{} `json:"documents"`
	Status           string      `json:"status"`
	RejectionReason  *string     `json:"rejection_reason,omitempty"`
	ReviewedBy       *string     `json:"reviewed_by,omitempty"`
	ReviewedAt       *time.Time  `json:"reviewed_at,omitempty"`
	SubmittedAt      time.Time   `json:"submitted_at"`
}

type Claims struct {
	UserID string `json:"user_id"`
	Role   string `json:"role"`
}
