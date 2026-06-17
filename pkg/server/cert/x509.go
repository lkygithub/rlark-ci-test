package cert

import (
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/json"
)

var metaX509OID = []int{1, 3, 6, 1, 4, 1, 99999, 32}

func SetX509CertMeta(template *x509.Certificate, meta map[string]string) {
	if template == nil {
		return
	}
	metaBytes, _ := json.Marshal(meta)
	template.ExtraExtensions = append(template.ExtraExtensions, pkix.Extension{
		Id:       metaX509OID,
		Critical: false,
		Value:    metaBytes,
	})
}

func GetX509CertMeta(cert *x509.Certificate) (map[string]string, bool) {
	if cert == nil {
		return nil, false
	}
	for _, ext := range cert.ExtraExtensions {
		if ext.Id.Equal(metaX509OID) {
			var meta map[string]string
			if err := json.Unmarshal(ext.Value, &meta); err != nil {
				return nil, false
			}
			return meta, true
		}
	}
	return nil, false
}
