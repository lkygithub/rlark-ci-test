package cert

import (
	"crypto/rsa"
	"crypto/x509"
	"fmt"
)

type Data struct {
	CertPEM []byte
	Cert    *x509.Certificate
	KeyPEM  []byte
	Key     *rsa.PrivateKey
}

func LoadData(certPEM, keyPEM []byte) (*Data, error) {
	caCert, err := x509.ParseCertificate(certPEM)
	if err != nil {
		return nil, fmt.Errorf("failed to parse CA certificate: %w", err)
	}
	caKey, err := x509.ParsePKCS1PrivateKey(keyPEM)
	if err != nil {
		return nil, fmt.Errorf("failed to parse CA private key: %w", err)
	}
	return &Data{
		CertPEM: certPEM,
		Cert:    caCert,
		KeyPEM:  keyPEM,
		Key:     caKey,
	}, nil
}
