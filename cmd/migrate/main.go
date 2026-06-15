package main

import (
	"context"
	"flag"
	"fmt"
	"os"

	"github.com/rlinf/rlark/pkg/clients/db"
)

func main() {
	var cmd string
	var debug bool
	flag.StringVar(&cmd, "cmd", "migrate", "Command: migrate, rollback, reset, status")
	flag.BoolVar(&debug, "debug", false, "Enable debug query logging")
	flag.Parse()

	cfg := db.DefaultConfig()
	if v := os.Getenv("DB_HOST"); v != "" {
		cfg.Host = v
	}
	if v := os.Getenv("DB_PORT"); v != "" {
		fmt.Sscanf(v, "%d", &cfg.Port)
	}
	if v := os.Getenv("DB_NAME"); v != "" {
		cfg.Database = v
	}
	if v := os.Getenv("DB_USER"); v != "" {
		cfg.User = v
	}
	if v := os.Getenv("DB_PASSWORD"); v != "" {
		cfg.Password = v
	}
	cfg.Debug = debug

	database, err := db.Open(cfg)
	if err != nil {
		fmt.Fprintf(os.Stderr, "connect: %v\n", err)
		os.Exit(1)
	}
	defer database.Close()

	ctx := context.Background()

	switch cmd {
	case "migrate":
		if err := database.Migrate(ctx); err != nil {
			fmt.Fprintf(os.Stderr, "migrate: %v\n", err)
			os.Exit(1)
		}
		fmt.Println("Migrations applied successfully.")
		printStatus(database, ctx)

	case "rollback":
		if err := database.Rollback(ctx); err != nil {
			fmt.Fprintf(os.Stderr, "rollback: %v\n", err)
			os.Exit(1)
		}
		fmt.Println("Last migration rolled back.")
		printStatus(database, ctx)

	case "reset":
		if err := database.Reset(ctx); err != nil {
			fmt.Fprintf(os.Stderr, "reset: %v\n", err)
			os.Exit(1)
		}
		fmt.Println("Database reset and re-migrated.")
		printStatus(database, ctx)

	case "status":
		printStatus(database, ctx)

	default:
		fmt.Fprintf(os.Stderr, "unknown command: %s (use: migrate, rollback, reset, status)\n", cmd)
		os.Exit(2)
	}
}

func printStatus(database *db.DB, ctx context.Context) {
	ms, err := database.MigrationStatus(ctx)
	if err != nil {
		fmt.Fprintf(os.Stderr, "status: %v\n", err)
		return
	}
	fmt.Printf("\n%3s  %-50s  %s\n", "ID", "Migration", "Applied")
	for _, m := range ms {
		applied := "no"
		if m.IsApplied() {
			applied = m.MigratedAt.Format("2006-01-02 15:04:05")
		}
		fmt.Printf("%3d  %-50s  %s\n", m.ID, m.Name, applied)
	}
}