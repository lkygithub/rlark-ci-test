package db

import (
	"context"
	"time"

	"github.com/uptrace/bun"
)

type RevokedCertificateModel struct {
	bun.BaseModel `bun:"table:revoked_certificates,alias:rc"`

	// The type of the revoked certificate. e.g., "x509", "ssh", etc.
	CertType string `bun:"cert_type,notnull,pk"`
	// The serial number of the revoked certificate.
	SerialNumber string `bun:"serial_number,notnull,pk"`
	// The subject key ID of the revoked certificate.
	SubjectKeyID string `bun:"subject_key_id,notnull,pk"`
	// The reason for revocation. e.g., "key compromise", "cessation of operation", etc.
	RevocationReason string `bun:"revocation_reason,notnull"`
	// The time when the certificate was revoked.
	RevokedAt time.Time `bun:"revoked_at,notnull"`
}

type RevokedCertificateStore struct {
	db *bun.DB
}

func NewRevokedCertificateStore(db *bun.DB) *RevokedCertificateStore {
	return &RevokedCertificateStore{db: db}
}

func (s *RevokedCertificateStore) AddRevokedCertificate(ctx context.Context, cert *RevokedCertificateModel) error {
	_, err := s.db.NewInsert().
		Model(cert).
		On("CONFLICT (cert_type, serial_number, subject_key_id) DO NOTHING").
		Exec(ctx)
	return err
}

func (s *RevokedCertificateStore) IsCertificateRevoked(ctx context.Context, certType, serialNumber, subjectKeyID string) (bool, error) {
	count, err := s.db.NewSelect().
		Model((*RevokedCertificateModel)(nil)).
		Where("cert_type = ? AND serial_number = ? AND subject_key_id = ?", certType, serialNumber, subjectKeyID).
		Count(ctx)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}
