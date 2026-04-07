package models

import "database/sql"

type User struct {
	ID      string `json:"id"`
	Auth0ID string `json:"auth0_id"`
	Email   string `json:"email"`
}

func GetOrCreateUser(db *sql.DB, auth0ID, email string) (*User, error) {
	var u User
	err := db.QueryRow(
		`SELECT id, auth0_id, email FROM users WHERE auth0_id = $1`, auth0ID,
	).Scan(&u.ID, &u.Auth0ID, &u.Email)
	if err == sql.ErrNoRows {
		err = db.QueryRow(
			`INSERT INTO users (auth0_id, email) VALUES ($1, $2) RETURNING id, auth0_id, email`,
			auth0ID, email,
		).Scan(&u.ID, &u.Auth0ID, &u.Email)
	}
	if err != nil {
		return nil, err
	}
	return &u, nil
}
