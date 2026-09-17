import 'package:flutter_test/flutter_test.dart';
import 'package:lmo_inspector_app/services/geo_verification_service.dart';
import 'package:lmo_inspector_app/services/offline_sync_service.dart';

void main() {
  group('Statutory Geolocation & Anti-Spoofing Tests (Rule 27 / Sec 24)', () {
    test('Sandbox Bypass Mode allows simulation for indoor evaluation', () async {
      GeoVerificationService.isSandboxModeEnabled = true;

      final result = await GeoVerificationService.verifyInspectorPresence(
        traderLatitude: 28.5494,
        traderLongitude: 77.2001,
      );

      expect(result.isSuccess, isTrue);
      expect(result.status, equals(GeoVerificationStatus.verified));
      expect(result.isSandboxBypass, isTrue);
      expect(result.isMocked, isFalse);
      expect(result.position, isNotNull);

      // Reset
      GeoVerificationService.isSandboxModeEnabled = false;
    });

    test('Geofence threshold is strictly bounded to 150 meters', () {
      expect(GeoVerificationService.maxGeofenceRadiusMeters, equals(150.0));
      expect(GeoVerificationService.minAcceptableAccuracyMeters, equals(35.0));
    });
  });

  group('Offline Sync & Idempotency Tests', () {
    test('OfflineInspectionReport serialization retains all statutory parameters', () {
      final report = OfflineInspectionReport(
        queueId: 'Q-1001',
        traderId: 'TR-01',
        traderName: 'Apex Supermarket',
        licenseNumber: 'LMO/2026/10001',
        inspectionStatus: 'Pending_GATC',
        gpsCoordinates: '28.5494° N, 77.2001° E',
        photoPath: '/docs/inspection_seal.jpg',
        sealNumber: 'SEAL-LMO-2026-10001-A',
        notes: 'MPE zero calibrated. Lead seal crimped.',
        mpeZero: '0.0 g',
        mpeHalf: '+0.5 g',
        mpeFull: '+1.0 g',
        createdAt: '2026-09-17T12:00:00.000Z',
      );

      final json = report.toJson();
      expect(json['license_number'], equals('LMO/2026/10001'));
      expect(json['inspection_status'], equals('Pending_GATC'));
      expect(json['seal_number'], equals('SEAL-LMO-2026-10001-A'));

      final reconstructed = OfflineInspectionReport.fromJson(json);
      expect(reconstructed.licenseNumber, equals(report.licenseNumber));
      expect(reconstructed.sealNumber, equals(report.sealNumber));
      expect(reconstructed.queueId, equals(report.queueId));
    });
  });
}
