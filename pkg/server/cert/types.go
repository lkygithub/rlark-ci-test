package cert

import (
	"crypto/rsa"
	"crypto/x509"
	"fmt"

	gossh "golang.org/x/crypto/ssh"
)

type Data struct {
	CertPEM []byte
	Cert    *x509.Certificate
	SSHCert *gossh.Certificate
	KeyPEM  []byte
	Key     *rsa.PrivateKey
}

func LoadData(certPEM, keyPEM []byte) (*Data, error) {
	data := &Data{
		CertPEM: certPEM,
		KeyPEM:  keyPEM,
	}
	data.Cert, _ = DecodeCertificateFromPEM(certPEM)
	data.SSHCert, _ = DecodeSSHCertificateFromPEM(certPEM)
	if data.Cert == nil && data.SSHCert == nil {
		return nil, fmt.Errorf("failed to parse certificate")
	}
	var err error
	data.Key, err = DecodePrivateKeyFromPEM(keyPEM)
	if err != nil {
		return nil, fmt.Errorf("failed to parse private key: %w", err)
	}
	return data, nil
}
