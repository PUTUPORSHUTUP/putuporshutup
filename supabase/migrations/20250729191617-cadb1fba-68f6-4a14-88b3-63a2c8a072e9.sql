-- Database performance optimization indexes
CREATE INDEX IF NOT EXISTS idx_game_matrix_trend_score ON game_matrix(trend_score DESC);
CREATE INDEX IF NOT EXISTS idx_game_matrix_automated ON game_matrix(automated_score_detection);
CREATE INDEX IF NOT EXISTS idx_game_matrix_verification ON game_matrix(host_verification_method);

-- Additional helpful indexes for game queries
CREATE INDEX IF NOT EXISTS idx_game_matrix_api_access ON game_matrix(api_access);
CREATE INDEX IF NOT EXISTS idx_game_matrix_platforms ON game_matrix USING GIN(to_tsvector('english', platforms));