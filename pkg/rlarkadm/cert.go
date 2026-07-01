package rlarkadm

import (
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"crypto/x509/pkix"
	"fmt"
	"math/big"
	"os"
	"path/filepath"
	"time"

	"github.com/rlinf/rlark/pkg/server/cert"
)

type CertBundle struct {
	CACertPEM []byte
	CAKeyPEM  []byte
	CertPEM   []byte
	KeyPEM    []byte
}

func GenerateCertBundle(cfg *CertConfig) (*CertBundle, error) {
	caData, err := loadOrCreateCA(cfg)
	if err != nil {
		return nil, err
	}

	leafKey, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		return nil, fmt.Errorf("generate leaf key: %w", err)
	}
	serial, _ := rand.Int(rand.Reader, new(big.Int).Lsh(big.NewInt(1), 128))
	template := &x509.Certificate{
		SerialNumber: serial,
		Subject: pkix.Name{
			CommonName:   "rlark-agent",
			Organization: []string{"RLinf"},
		},
		NotBefore:   time.Now().Add(-1 * time.Hour),
		NotAfter:    time.Now().Add(365 * 24 * time.Hour),
		KeyUsage:    x509.KeyUsageDigitalSignature,
		ExtKeyUsage: []x509.ExtKeyUsage{x509.ExtKeyUsageClientAuth, x509.ExtKeyUsageServerAuth},
		PublicKey:   leafKey.Public(),
	}
	certPEM, err := caData.SignX509Certificate(template)
	if err != nil {
		return nil, fmt.Errorf("sign certificate: %w", err)
	}
	keyPEM, err := cert.EncodePrivateKeyToPEM(leafKey)
	if err != nil {
		return nil, fmt.Errorf("encode private key: %w", err)
	}
	return &CertBundle{
		CACertPEM: caData.CertPEM,
		CAKeyPEM:  caData.KeyPEM,
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

func loadOrCreateCA(cfg *CertConfig) (*cert.Data, error) {
	if cfg.CACert != "" && cfg.CAKey != "" {
		caCertPEM, err := os.ReadFile(cfg.CACert)
		if err != nil {
			return nil, fmt.Errorf("read CA cert: %w", err)
		}
		caKeyPEM, err := os.ReadFile(cfg.CAKey)
		if err != nil {
			return nil, fmt.Errorf("read CA key: %w", err)
		}
		return cert.LoadData(caCertPEM, caKeyPEM)
	}
	caData, err := cert.GenerateCA(cert.GenerateTemplateCA())
	if err != nil {
		return nil, fmt.Errorf("generate CA: %w", err)
	}
	return caData, nil
}
