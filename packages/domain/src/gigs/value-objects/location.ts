export class Location {
  constructor(
    public readonly text: string,
    public readonly latitude?: number,
    public readonly longitude?: number,
    public readonly radiusMeters?: number
  ) {
    if (!text || text.trim().length === 0) {
      throw new Error('Location text is required');
    }

    if (latitude !== undefined && (latitude < -90 || latitude > 90)) {
      throw new Error('Invalid latitude');
    }

    if (longitude !== undefined && (longitude < -180 || longitude > 180)) {
      throw new Error('Invalid longitude');
    }

    if (radiusMeters !== undefined && radiusMeters < 0) {
      throw new Error('Radius cannot be negative');
    }
  }

  hasCoordinates(): boolean {
    return this.latitude !== undefined && this.longitude !== undefined;
  }

  distanceTo(other: Location): number | undefined {
    if (!this.hasCoordinates() || !other.hasCoordinates()) {
      return undefined;
    }

    const R = 6371e3; // Earth's radius in meters
    const φ1 = (this.latitude! * Math.PI) / 180;
    const φ2 = (other.latitude! * Math.PI) / 180;
    const Δφ = ((other.latitude! - this.latitude!) * Math.PI) / 180;
    const Δλ = ((other.longitude! - this.longitude!) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }
}