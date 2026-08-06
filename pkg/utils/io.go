package utils

import "io"

// CloseIO: close without checking errors
func CloseIO(c io.Closer) {
	if c != nil {
		_ = c.Close()
	}
}
