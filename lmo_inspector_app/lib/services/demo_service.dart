import 'package:flutter/foundation.dart';
import 'api_service.dart';

/// Service managing the 'Golden Path Demo Mode' for hackathon presentations.
/// When [isDemoMode] is true:
/// - Supabase & HTTP network fetch calls are completely bypassed.
/// - Returns 2 dummy traders: 'Ramesh Kumar' (Pending) and 'Suresh' (Passed).
/// - Submission simulates a 2-second CircularProgressIndicator, shows success,
///   and updates in-memory state to 'Passed'.
class DemoService {
  /// Master Golden Path Demo Mode flag (default: true for hackathon safety)
  static bool isDemoMode = true;

  /// In-memory state of dummy traders for Demo Mode
  static List<Trader> dummyTraders = _createInitialTraders();

  static List<Trader> _createInitialTraders() {
    return [
      Trader(
        id: 'demo-trader-1',
        traderName: 'Ramesh Kumar',
        ownerName: 'Ramesh Kumar',
        licenseNumber: 'HR-LMO-2026-0042',
        instrumentType: 'Electronic Counter Scale (Class III)',
        inspectionStatus: 'Pending',
        latitude: 28.8955,
        longitude: 76.6066,
        district: 'Hisar',
        assignedOfficer: 'LMO Inspector (Hisar)',
        createdAt: '2026-09-15T10:30:00Z',
      ),
      Trader(
        id: 'demo-trader-2',
        traderName: 'Suresh',
        ownerName: 'Suresh Chand',
        licenseNumber: 'HR-LMO-2026-0089',
        instrumentType: 'Platform Weighing Machine (Class III)',
        inspectionStatus: 'Passed',
        latitude: 28.9012,
        longitude: 76.6124,
        district: 'Hisar',
        assignedOfficer: 'LMO Inspector (Hisar)',
        createdAt: '2026-09-14T14:15:00Z',
      ),
    ];
  }

  /// Returns dummy traders formatted as JSON maps for the dashboard list
  static List<Map<String, dynamic>> get dummyTradersMap {
    return dummyTraders.map((t) => t.toJson()).toList();
  }

  /// Mark a dummy trader as 'Passed' by license number or name
  static void markAsPassed(String identifier) {
    final clean = identifier.trim().toLowerCase();
    for (int i = 0; i < dummyTraders.length; i++) {
      final t = dummyTraders[i];
      if (t.licenseNumber.toLowerCase() == clean ||
          (t.id != null && t.id!.toLowerCase() == clean) ||
          t.traderName.toLowerCase() == clean ||
          t.ownerName.toLowerCase() == clean) {
        dummyTraders[i] = Trader(
          id: t.id,
          traderName: t.traderName,
          ownerName: t.ownerName,
          licenseNumber: t.licenseNumber,
          instrumentType: t.instrumentType,
          inspectionStatus: 'Passed',
          latitude: t.latitude,
          longitude: t.longitude,
          district: t.district,
          assignedOfficer: t.assignedOfficer,
          inspectionImageUrl: t.inspectionImageUrl,
          createdAt: t.createdAt,
          updatedAt: DateTime.now().toIso8601String(),
        );
        debugPrint('🌟 [Demo Mode] Trader ${t.traderName} (${t.licenseNumber}) marked as Passed.');
        break;
      }
    }
  }

  /// Reset demo traders back to their initial state
  static void reset() {
    dummyTraders = _createInitialTraders();
    debugPrint('🌟 [Demo Mode] Reset dummy traders to initial state.');
  }

  /// Toggle Demo Mode on or off
  static void toggleDemoMode() {
    isDemoMode = !isDemoMode;
    debugPrint('🌟 [Demo Mode] Toggled: $isDemoMode');
  }
}
