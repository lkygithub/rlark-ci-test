package rlarkadm

import (
	"fmt"
	"os"
	"path/filepath"
)

type CertBundle struct {
	CACertPEM []byte
	CAKeyPEM  []byte
	CertPEM   []byte
	KeyPEM    []byte
}

func GenerateCertBundle(cfg *CertConfig) (*CertBundle, error) {
	caCertPEM, err := os.ReadFile(cfg.CACert)
	if err != nil {
		return nil, fmt.Errorf("read CA cert: %w", err)
	}

	certPEM, err := os.ReadFile(cfg.AgentCert)
	if err != nil {
		return nil, fmt.Errorf("read agent cert: %w", err)
	}
	keyPEM, err := os.ReadFile(cfg.AgentKey)
	if err != nil {
		return nil, fmt.Errorf("read agent key: %w", err)
	}

	return &CertBundle{
		CACertPEM: caCertPEM,
		CertPEM:   certPEM,
		KeyPEM:    keyPEM,
	}, nil
}

func (b *CertBundle) WriteToDir(dir string) error {
	if err := os.MkdirAll(dir, 0700); err != nil {
		return fmt.Errorf("create cert dir: %w", err)
	}
	files := map[string][]byte{
		"ca.crt":  b.CACertPEM,
		"ca.key":  b.CAKeyPEM,
		"tls.crt": b.CertPEM,
		"tls.key": b.KeyPEM,
	}
	for name, data := range files {
		if err := os.WriteFile(filepath.Join(dir, name), data, 0600); err != nil {
			return fmt.Errorf("write %s: %w", name, err)
		}
	}
	return nil
}
