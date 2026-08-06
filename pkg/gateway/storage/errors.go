package storage

import "errors"

var (
	ErrInvalidObjectKey = errors.New("invalid object key")
	ErrFileNotFound     = errors.New("file not found")
	ErrUploadFailed     = errors.New("upload failed")
	ErrDeleteFailed     = errors.New("delete failed")
	ErrListFailed       = errors.New("list failed")
)
