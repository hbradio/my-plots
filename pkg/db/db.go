package db

import (
	"database/sql"
	"fmt"
	"os"
	"sync"

	_ "github.com/jackc/pgx/v5/stdlib"
)

var (
	pool *sql.DB
	once sync.Once
	initErr error
)

func GetDB() (*sql.DB, error) {
	once.Do(func() {
		dsn := os.Getenv("DATABASE_URL")
		if dsn == "" {
			initErr = fmt.Errorf("DATABASE_URL not set")
			return
		}
		pool, initErr = sql.Open("pgx", dsn)
		if initErr != nil {
			return
		}
		initErr = pool.Ping()
		if initErr != nil {
			return
		}
		initErr = migrate(pool)
	})
	return pool, initErr
}

func migrate(db *sql.DB) error {
	migrations := []string{
		`CREATE TABLE IF NOT EXISTS users (
			id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
			auth0_id TEXT UNIQUE NOT NULL,
			email TEXT,
			created_at TIMESTAMPTZ DEFAULT now()
		)`,
		`CREATE TABLE IF NOT EXISTS plots (
			id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
			user_id UUID REFERENCES users(id) ON DELETE CASCADE,
			name TEXT NOT NULL,
			y_axis_label TEXT NOT NULL DEFAULT '',
			y_min DOUBLE PRECISION,
			y_max DOUBLE PRECISION,
			ref_start_date DATE,
			ref_start_value DOUBLE PRECISION,
			ref_end_date DATE,
			ref_end_value DOUBLE PRECISION,
			created_at TIMESTAMPTZ DEFAULT now(),
			updated_at TIMESTAMPTZ DEFAULT now()
		)`,
		`CREATE TABLE IF NOT EXISTS points (
			id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
			plot_id UUID REFERENCES plots(id) ON DELETE CASCADE,
			date DATE NOT NULL,
			value DOUBLE PRECISION NOT NULL,
			created_at TIMESTAMPTZ DEFAULT now()
		)`,
	}
	for _, m := range migrations {
		if _, err := db.Exec(m); err != nil {
			return fmt.Errorf("migration failed: %w", err)
		}
	}
	return nil
}
