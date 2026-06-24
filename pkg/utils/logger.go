package utils

import (
	"context"

	"github.com/go-logr/logr"
)

type loggerKey struct{}

func WithLogger(ctx context.Context, l logr.Logger) context.Context {
	return context.WithValue(ctx, loggerKey{}, l)
}

func LoggerFromContext(ctx context.Context) logr.Logger {
	if l, ok := ctx.Value(loggerKey{}).(logr.Logger); ok {
		return l
	}
	return logr.Discard()
}
