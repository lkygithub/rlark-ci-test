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
	cert, err := DecodeCertificateFromPEM(certPEM)
	if err != nil {
		return nil, fmt.Errorf("failed to parse certificate: %w", err)
	}
	key, err := DecodePrivateKeyFromPEM(keyPEM)
	if err != nil {
		return nil, fmt.Errorf("failed to parse private key: %w", err)
	}
	return &Data{
		CertPEM: certPEM,
		Cert:    cert,
		KeyPEM:  keyPEM,
		Key:     key,
	}, nil
}
