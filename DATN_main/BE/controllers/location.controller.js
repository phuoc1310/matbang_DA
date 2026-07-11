import db from "../config/db.js";

export const getDistanceController = async (req, res) => {
  const { id } = req.params;
  const { user_lat, user_lng } = req.body;

  if (!user_lat || !user_lng) {
    return res.status(400).json({ success: false, message: "Missing user coordinates" });
  }

  try {
    // Check if listing has valid location
    const listingRes = await db.query("SELECT location, lat, lng FROM listings WHERE id = $1", [id]);
    if (listingRes.rowCount === 0) {
      return res.status(404).json({ success: false, message: "Listing not found" });
    }

    const listing = listingRes.rows[0];
    if (!listing.lat || !listing.lng) {
      return res.status(400).json({ success: false, message: "Listing has no coordinates" });
    }

    // Calculate distance via PostGIS
    const distanceRes = await db.query(`
      SELECT ST_DistanceSphere(
        ST_MakePoint($1, $2),
        COALESCE(
          location, 
          ST_SetSRID(ST_MakePoint(lng, lat), 4326)
        )
      ) AS distance_meters
      FROM listings
      WHERE id = $3
    `, [user_lng, user_lat, id]);

    const distanceMeters = distanceRes.rows[0].distance_meters;

    res.json({
      success: true,
      distance_meters: Math.round(distanceMeters)
    });
  } catch (err) {
    console.error("PostGIS distance calculation error:", err);
    res.status(500).json({ success: false, message: "Error calculating distance via PostGIS" });
  }
};
