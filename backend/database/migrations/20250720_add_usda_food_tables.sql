-- Migration: Add USDA Food Data Tables
-- Date: 2025-07-20

-- Table to track USDA data versions
CREATE TABLE IF NOT EXISTS usda_data_versions (
    id SERIAL PRIMARY KEY,
    version_number VARCHAR(50) NOT NULL,
    import_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    imported_by VARCHAR(100),
    food_count INTEGER,
    is_current BOOLEAN DEFAULT TRUE
);

-- Table for USDA food nutritional data
CREATE TABLE IF NOT EXISTS food_nutritional_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    food_id UUID NOT NULL REFERENCES food_properties(id),
    usda_fdc_id VARCHAR(50),
    data_type VARCHAR(50),
    description TEXT,
    food_category VARCHAR(100),
    publication_date DATE,
    
    -- Serving information
    serving_size NUMERIC,
    serving_unit VARCHAR(50),
    household_serving_fulltext VARCHAR(100),
    
    -- Macronutrients (per 100g unless otherwise specified)
    calories NUMERIC,
    protein_g NUMERIC,
    total_fat_g NUMERIC,
    saturated_fat_g NUMERIC,
    trans_fat_g NUMERIC,
    polyunsaturated_fat_g NUMERIC,
    monounsaturated_fat_g NUMERIC,
    cholesterol_mg NUMERIC,
    carbohydrates_g NUMERIC,
    fiber_g NUMERIC,
    sugars_g NUMERIC,
    added_sugars_g NUMERIC,
    
    -- Minerals
    calcium_mg NUMERIC,
    iron_mg NUMERIC,
    magnesium_mg NUMERIC,
    phosphorus_mg NUMERIC,
    potassium_mg NUMERIC,
    sodium_mg NUMERIC,
    zinc_mg NUMERIC,
    copper_mg NUMERIC,
    selenium_mcg NUMERIC,
    
    -- Vitamins
    vitamin_a_rae_mcg NUMERIC,
    vitamin_b6_mg NUMERIC,
    vitamin_b12_mcg NUMERIC,
    vitamin_c_mg NUMERIC,
    vitamin_d_mcg NUMERIC,
    vitamin_e_mg NUMERIC,
    vitamin_k_mcg NUMERIC,
    thiamin_mg NUMERIC,
    riboflavin_mg NUMERIC,
    niacin_mg NUMERIC,
    folate_mcg NUMERIC,
    choline_mg NUMERIC,
    
    -- Additional nutrients
    alcohol_g NUMERIC,
    caffeine_mg NUMERIC,
    
    -- Metadata
    usda_data_version_id INTEGER REFERENCES usda_data_versions(id),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Create index on USDA FDC ID for faster lookups
    CONSTRAINT unique_usda_fdc_id UNIQUE (usda_fdc_id)
);

-- Create indexes for common query patterns
CREATE INDEX idx_food_nutritional_data_food_id ON food_nutritional_data(food_id);
CREATE INDEX idx_food_nutritional_data_food_category ON food_nutritional_data(food_category);

-- Add a usda_fdc_id column to the existing food_properties table for direct reference
ALTER TABLE food_properties ADD COLUMN IF NOT EXISTS usda_fdc_id VARCHAR(50);
CREATE INDEX idx_food_properties_usda_fdc_id ON food_properties(usda_fdc_id);
