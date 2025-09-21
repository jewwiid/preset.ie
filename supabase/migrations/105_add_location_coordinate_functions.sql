-- Add functions to extract coordinates from PostGIS location field

-- Function to get latitude and longitude from a gig's location field
CREATE OR REPLACE FUNCTION get_location_coordinates(gig_id UUID)
RETURNS TABLE (
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ST_Y(location::geometry) as latitude,
        ST_X(location::geometry) as longitude
    FROM gigs 
    WHERE id = gig_id 
    AND location IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update gig location from latitude and longitude
CREATE OR REPLACE FUNCTION set_gig_location(
    p_gig_id UUID,
    p_latitude DOUBLE PRECISION,
    p_longitude DOUBLE PRECISION
) RETURNS BOOLEAN AS $$
BEGIN
    -- Validate coordinates
    IF p_latitude < -90 OR p_latitude > 90 THEN
        RAISE EXCEPTION 'Invalid latitude: must be between -90 and 90';
    END IF;
    
    IF p_longitude < -180 OR p_longitude > 180 THEN
        RAISE EXCEPTION 'Invalid longitude: must be between -180 and 180';
    END IF;
    
    -- Update the location
    UPDATE gigs 
    SET location = ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography
    WHERE id = p_gig_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to get gigs within a radius of a location
CREATE OR REPLACE FUNCTION get_gigs_near_location(
    p_latitude DOUBLE PRECISION,
    p_longitude DOUBLE PRECISION,
    p_radius_meters INTEGER DEFAULT 50000, -- 50km default
    p_limit INTEGER DEFAULT 20
) RETURNS TABLE (
    gig_id UUID,
    title VARCHAR(255),
    location_text VARCHAR(255),
    distance_meters DOUBLE PRECISION
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        g.id as gig_id,
        g.title,
        g.location_text,
        ST_Distance(
            g.location,
            ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography
        ) as distance_meters
    FROM gigs g
    WHERE g.status = 'PUBLISHED'
    AND g.location IS NOT NULL
    AND ST_DWithin(
        g.location,
        ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography,
        p_radius_meters
    )
    ORDER BY distance_meters ASC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Add comments
COMMENT ON FUNCTION get_location_coordinates IS 'Extracts latitude and longitude from a gig location field';
COMMENT ON FUNCTION set_gig_location IS 'Updates a gig location field from latitude and longitude coordinates';
COMMENT ON FUNCTION get_gigs_near_location IS 'Finds gigs within a specified radius of a location';
