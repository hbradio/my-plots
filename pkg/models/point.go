package models

import (
	"database/sql"
	"fmt"
	"time"
)

type Point struct {
	ID        string  `json:"id"`
	PlotID    string  `json:"plot_id"`
	Date      string  `json:"date"`
	Value     float64 `json:"value"`
	CreatedAt string  `json:"created_at"`
}

func ListPoints(db *sql.DB, plotID string) ([]Point, error) {
	rows, err := db.Query(
		`SELECT id, plot_id, date, value, created_at
		 FROM points WHERE plot_id = $1 ORDER BY date ASC`, plotID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var points []Point
	for rows.Next() {
		var p Point
		var date time.Time
		var createdAt time.Time
		err := rows.Scan(&p.ID, &p.PlotID, &date, &p.Value, &createdAt)
		if err != nil {
			return nil, err
		}
		p.Date = date.Format("2006-01-02")
		p.CreatedAt = createdAt.Format(time.RFC3339)
		points = append(points, p)
	}
	return points, nil
}

func CreatePoint(db *sql.DB, plotID, date string, value float64) (*Point, error) {
	var p Point
	var d time.Time
	var createdAt time.Time
	err := db.QueryRow(
		`INSERT INTO points (plot_id, date, value) VALUES ($1, $2, $3)
		 RETURNING id, plot_id, date, value, created_at`,
		plotID, date, value,
	).Scan(&p.ID, &p.PlotID, &d, &p.Value, &createdAt)
	if err != nil {
		return nil, err
	}
	p.Date = d.Format("2006-01-02")
	p.CreatedAt = createdAt.Format(time.RFC3339)
	return &p, nil
}

func DeletePoint(db *sql.DB, pointID, userID string) error {
	// Join through plots to verify ownership
	result, err := db.Exec(
		`DELETE FROM points WHERE id = $1 AND plot_id IN (
			SELECT id FROM plots WHERE user_id = $2
		)`, pointID, userID,
	)
	if err != nil {
		return err
	}
	rows, _ := result.RowsAffected()
	if rows == 0 {
		return fmt.Errorf("point not found")
	}
	return nil
}
