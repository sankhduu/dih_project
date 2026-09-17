import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';

/// Status outcomes of statutory geolocation verification under Rule 27
enum GeoVerificationStatus {
  verified,
  mockDetected,
  geofenceViolation,
  serviceDisabled,
  permissionDenied,
  permissionDeniedForever,
  accuracyTooLow,
  error,
}

/// Result envelope containing coordinates, spoof status, and statutory attestation
class GeoVerificationResult {
  final GeoVerificationStatus status;
  final Position? position;
  final double? distanceMeters;
  final bool isMocked;
  final String message;
  final bool isSandboxBypass;

  const GeoVerificationResult({
    required this.status,
    this.position,
    this.distanceMeters,
    this.isMocked = false,
    required this.message,
    this.isSandboxBypass = false,
  });

  bool get isSuccess => status == GeoVerificationStatus.verified;
}

/// Statutory Geolocation & Anti-Spoofing Verification Service
/// Built to satisfy Rule 27 (Physical Stamping & Sealing) and Section 24 Anti-Proxy Mandate.
class GeoVerificationService {
  static const double maxGeofenceRadiusMeters = 150.0;
  static const double minAcceptableAccuracyMeters = 35.0;

  /// Sandbox mode for indoor conference hall evaluation when GNSS satellite lock is unavailable
  static bool isSandboxModeEnabled = false;

  /// Perform end-to-end anti-spoofing and geofence attestation for a trader establishment
  static Future<GeoVerificationResult> verifyInspectorPresence({
    required double traderLatitude,
    required double traderLongitude,
  }) async {
    // 1. If Sandbox Bypass is enabled for indoor demonstration
    if (isSandboxModeEnabled) {
      return GeoVerificationResult(
        status: GeoVerificationStatus.verified,
        position: Position(
          longitude: traderLongitude,
          latitude: traderLatitude,
          timestamp: DateTime.now(),
          accuracy: 5.0,
          altitude: 215.0,
          altitudeAccuracy: 2.0,
          heading: 0.0,
          headingAccuracy: 0.0,
          speed: 0.0,
          speedAccuracy: 0.0,
          isMocked: false,
        ),
        distanceMeters: 4.2,
        isMocked: false,
        isSandboxBypass: true,
        message: 'Sandbox Demonstration Mode active: Verified presence simulated for evaluation.',
      );
    }

    try {
      // 2. Check if hardware location service is enabled
      final bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        return const GeoVerificationResult(
          status: GeoVerificationStatus.serviceDisabled,
          message: 'Location services are disabled on device. Enable GPS to verify on-site presence under Rule 27.',
        );
      }

      // 3. Inspect and request runtime permissions
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          return const GeoVerificationResult(
            status: GeoVerificationStatus.permissionDenied,
            message: 'Location permission was denied. Statutory verification requires active GPS attestation.',
          );
        }
      }

      if (permission == LocationPermission.deniedForever) {
        return const GeoVerificationResult(
          status: GeoVerificationStatus.permissionDeniedForever,
          message: 'Location permission is permanently denied in system settings. Please enable location permissions.',
        );
      }

      // 4. Fetch high-precision satellite GNSS position fix
      final Position position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.best,
          timeLimit: Duration(seconds: 8),
        ),
      );

      // 5. Anti-Spoofing Check: Inspect native isMocked flag
      if (position.isMocked) {
        return GeoVerificationResult(
          status: GeoVerificationStatus.mockDetected,
          position: position,
          isMocked: true,
          message: '⚠️ ANTI-PROXY TAMPER ALERT: Mock GPS / Location Spoofing Detected! Fake GPS or emulator location provider is active. Geotag rejected under Rule 27.',
        );
      }

      // 6. Accuracy check: Reject weak/unreliable fixes (>35m error)
      if (position.accuracy > minAcceptableAccuracyMeters) {
        return GeoVerificationResult(
          status: GeoVerificationStatus.accuracyTooLow,
          position: position,
          message: 'GPS signal accuracy is too low (±${position.accuracy.toStringAsFixed(1)}m). Move to an open area for a direct satellite fix.',
        );
      }

      // 7. Geofence Boundary Check: Inspector must be within 150m of trader premises
      final double distance = Geolocator.distanceBetween(
        position.latitude,
        position.longitude,
        traderLatitude,
        traderLongitude,
      );

      if (distance > maxGeofenceRadiusMeters) {
        return GeoVerificationResult(
          status: GeoVerificationStatus.geofenceViolation,
          position: position,
          distanceMeters: distance,
          message: 'Geofence Mismatch: Inspector is ${distance.toStringAsFixed(1)}m away from registered establishment. Physical stamping must be performed on-site (within ${maxGeofenceRadiusMeters.toInt()}m).',
        );
      }

      // 8. Attestation successful
      return GeoVerificationResult(
        status: GeoVerificationStatus.verified,
        position: position,
        distanceMeters: distance,
        message: 'On-site physical presence verified (Accuracy: ±${position.accuracy.toStringAsFixed(1)}m, Distance: ${distance.toStringAsFixed(1)}m).',
      );
    } catch (e) {
      return GeoVerificationResult(
        status: GeoVerificationStatus.error,
        message: 'GNSS Satellite acquisition notice: $e',
      );
    }
  }

  /// Show statutory explanation dialog for permission failure
  static void showStatutoryFailureDialog({
    required BuildContext context,
    required GeoVerificationResult result,
    VoidCallback? onRetry,
  }) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: [
            Icon(
              result.isMocked ? Icons.gpp_bad_rounded : Icons.location_off_rounded,
              color: const Color(0xFFE11D48),
              size: 28,
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Text(
                result.isMocked ? 'Anti-Proxy Tamper Alert' : 'Statutory Geotag Required',
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF002B49)),
              ),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              result.message,
              style: const TextStyle(fontSize: 13, height: 1.4, color: Color(0xFF1E293B)),
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xFFCBD5E1)),
              ),
              child: const Text(
                'Legal Notice: Section 24 of the Legal Metrology Act, 2009 and Rule 27 mandate physical on-site presence. Remote desk certification without physical stamping is a statutory violation.',
                style: TextStyle(fontSize: 11, fontStyle: FontStyle.italic, color: Color(0xFF475569)),
              ),
            ),
          ],
        ),
        actions: [
          if (result.status == GeoVerificationStatus.serviceDisabled)
            TextButton(
              onPressed: () {
                Navigator.pop(ctx);
                Geolocator.openLocationSettings();
              },
              child: const Text('Open Location Settings'),
            ),
          if (result.status == GeoVerificationStatus.permissionDeniedForever)
            TextButton(
              onPressed: () {
                Navigator.pop(ctx);
                Geolocator.openAppSettings();
              },
              child: const Text('Open App Settings'),
            ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              if (onRetry != null) onRetry();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF002B49),
              foregroundColor: Colors.white,
            ),
            child: const Text('Retry Verification'),
          ),
        ],
      ),
    );
  }
}
