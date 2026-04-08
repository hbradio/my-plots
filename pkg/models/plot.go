package models

import (
	"database/sql"
	"fmt"
	"strings"
	"time"
)

type Plot struct {
	ID            string   `json:"id"`
	UserID        string   `json:"user_id"`
	Name          string   `json:"name"`
	YAxisLabel    string   `json:"y_axis_label"`
	YMin          *float64 `json:"y_min"`
	YMax          *float64 `json:"y_max"`
	RefStartDate  *string  `json:"ref_start_date"`
	RefStartValue *float64 `json:"ref_start_value"`
	RefEndDate    *string  `json:"ref_end_date"`
	RefEndValue       *float64 `json:"ref_end_value"`
	RefInterpolation  *string  `json:"ref_interpolation"`
	CreatedAt         string   `json:"created_at"`
	UpdatedAt     string   `json:"updated_at"`
	Points        []Point  `json:"points,omitempty"`
}

func ListPlots(db *sql.DB, userID string) ([]Plot, error) {
	rows, err := db.Query(
		`SELECT id, user_id, name, y_axis_label, y_min, y_max,
		        ref_start_date, ref_start_value, ref_end_date, ref_end_value,
		        ref_interpolation, created_at, updated_at
		 FROM plots WHERE user_id = $1 ORDER BY created_at DESC`, userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var plots []Plot
	for rows.Next() {
		var p Plot
		var refStartDate, refEndDate *time.Time
		var createdAt, updatedAt time.Time
		err := rows.Scan(&p.ID, &p.UserID, &p.Name, &p.YAxisLabel,
			&p.YMin, &p.YMax, &refStartDate, &p.RefStartValue,
			&refEndDate, &p.RefEndValue, &p.RefInterpolation, &createdAt, &updatedAt)
		if err != nil {
			return nil, err
		}
		if refStartDate != nil {
			s := refStartDate.Format("2006-01-02")
			p.RefStartDate = &s
		}
		if refEndDate != nil {
			s := refEndDate.Format("2006-01-02")
			p.RefEndDate = &s
		}
		p.CreatedAt = createdAt.Format(time.RFC3339)
		p.UpdatedAt = updatedAt.Format(time.RFC3339)
		plots = append(plots, p)
	}
	return plots, nil
}

func GetPlot(db *sql.DB, plotID, userID string) (*Plot, error) {
	var p Plot
	var refStartDate, refEndDate *time.Time
	var createdAt, updatedAt time.Time
	err := db.QueryRow(
		`SELECT id, user_id, name, y_axis_label, y_min, y_max,
		        ref_start_date, ref_start_value, ref_end_date, ref_end_value,
		        ref_interpolation, created_at, updated_at
		 FROM plots WHERE id = $1 AND user_id = $2`, plotID, userID,
	).Scan(&p.ID, &p.UserID, &p.Name, &p.YAxisLabel,
		&p.YMin, &p.YMax, &refStartDate, &p.RefStartValue,
		&refEndDate, &p.RefEndValue, &p.RefInterpolation, &createdAt, &updatedAt)
	if err != nil {
		return nil, err
	}
	if refStartDate != nil {
		s := refStartDate.Format("2006-01-02")
		p.RefStartDate = &s
	}
	if refEndDate != nil {
		s := refEndDate.Format("2006-01-02")
		p.RefEndDate = &s
	}
	p.CreatedAt = createdAt.Format(time.RFC3339)
	p.UpdatedAt = updatedAt.Format(time.RFC3339)

	points, err := ListPoints(db, plotID)
	if err != nil {
		return nil, err
	}
	p.Points = points
	return &p, nil
}

func CreatePlot(db *sql.DB, userID, name, yAxisLabel string) (*Plot, error) {
	var p Plot
	var createdAt, updatedAt time.Time
	err := db.QueryRow(
		`INSERT INTO plots (user_id, name, y_axis_label)
		 VALUES ($1, $2, $3)
		 RETURNING id, user_id, name, y_axis_label, y_min, y_max,
		           ref_start_date, ref_start_value, ref_end_date, ref_end_value,
		           ref_interpolation, created_at, updated_at`,
		userID, name, yAxisLabel,
	).Scan(&p.ID, &p.UserID, &p.Name, &p.YAxisLabel,
		&p.YMin, &p.YMax, &p.RefStartDate, &p.RefStartValue,
		&p.RefEndDate, &p.RefEndValue, &p.RefInterpolation, &createdAt, &updatedAt)
	if err != nil {
		return nil, err
	}
	p.CreatedAt = createdAt.Format(time.RFC3339)
	p.UpdatedAt = updatedAt.Format(time.RFC3339)
	return &p, nil
}

type PlotUpdate struct {
	ID            string   `json:"id"`
	Name          *string  `json:"name"`
	YAxisLabel    *string  `json:"y_axis_label"`
	YMin          *float64 `json:"y_min"`
	YMax          *float64 `json:"y_max"`
	ClearYMin     bool     `json:"clear_y_min"`
	ClearYMax     bool     `json:"clear_y_max"`
	RefStartDate  *string  `json:"ref_start_date"`
	RefStartValue *float64 `json:"ref_start_value"`
	RefEndDate    *string  `json:"ref_end_date"`
	RefEndValue   *float64 `json:"ref_end_value"`
	ClearRef         bool    `json:"clear_ref"`
	RefInterpolation *string `json:"ref_interpolation"`
}

func UpdatePlot(db *sql.DB, userID string, update PlotUpdate) (*Plot, error) {
	// Build dynamic update
	sets := []string{"updated_at = now()"}
	args := []interface{}{}
	argIdx := 1

	if update.Name != nil {
		sets = append(sets, fmt.Sprintf("name = $%d", argIdx))
		args = append(args, *update.Name)
		argIdx++
	}
	if update.YAxisLabel != nil {
		sets = append(sets, fmt.Sprintf("y_axis_label = $%d", argIdx))
		args = append(args, *update.YAxisLabel)
		argIdx++
	}
	if update.ClearYMin {
		sets = append(sets, "y_min = NULL")
	} else if update.YMin != nil {
		sets = append(sets, fmt.Sprintf("y_min = $%d", argIdx))
		args = append(args, *update.YMin)
		argIdx++
	}
	if update.ClearYMax {
		sets = append(sets, "y_max = NULL")
	} else if update.YMax != nil {
		sets = append(sets, fmt.Sprintf("y_max = $%d", argIdx))
		args = append(args, *update.YMax)
		argIdx++
	}
	if update.RefInterpolation != nil {
		if *update.RefInterpolation == "" {
			sets = append(sets, "ref_interpolation = NULL")
		} else {
			sets = append(sets, fmt.Sprintf("ref_interpolation = $%d", argIdx))
			args = append(args, *update.RefInterpolation)
			argIdx++
		}
	}
	if update.ClearRef {
		sets = append(sets, "ref_start_date = NULL, ref_start_value = NULL, ref_end_date = NULL, ref_end_value = NULL, ref_interpolation = NULL")
	} else {
		if update.RefStartDate != nil {
			sets = append(sets, fmt.Sprintf("ref_start_date = $%d", argIdx))
			args = append(args, *update.RefStartDate)
			argIdx++
		}
		if update.RefStartValue != nil {
			sets = append(sets, fmt.Sprintf("ref_start_value = $%d", argIdx))
			args = append(args, *update.RefStartValue)
			argIdx++
		}
		if update.RefEndDate != nil {
			sets = append(sets, fmt.Sprintf("ref_end_date = $%d", argIdx))
			args = append(args, *update.RefEndDate)
			argIdx++
		}
		if update.RefEndValue != nil {
			sets = append(sets, fmt.Sprintf("ref_end_value = $%d", argIdx))
			args = append(args, *update.RefEndValue)
			argIdx++
		}
	}

	query := fmt.Sprintf("UPDATE plots SET %s WHERE id = $%d AND user_id = $%d",
		strings.Join(sets, ", "), argIdx, argIdx+1)
	args = append(args, update.ID, userID)

	result, err := db.Exec(query, args...)
	if err != nil {
		return nil, err
	}
	rows, _ := result.RowsAffected()
	if rows == 0 {
		return nil, fmt.Errorf("plot not found")
	}

	return GetPlot(db, update.ID, userID)
}

func DeletePlot(db *sql.DB, plotID, userID string) error {
	result, err := db.Exec(`DELETE FROM plots WHERE id = $1 AND user_id = $2`, plotID, userID)
	if err != nil {
		return err
	}
	rows, _ := result.RowsAffected()
	if rows == 0 {
		return fmt.Errorf("plot not found")
	}
	return nil
}
