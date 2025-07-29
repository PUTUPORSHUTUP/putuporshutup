-- Consider adding indexes for performance
CREATE INDEX IF NOT EXISTS idx_game_matrix_trend_score ON game_matrix(trend_score DESC);
CREATE INDEX IF NOT EXISTS idx_game_matrix_automated ON game_matrix(automated_score_detection);