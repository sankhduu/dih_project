import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'api_service.dart';

/// Data model for an offline-queued inspection report
class OfflineInspectionReport {
  final String queueId;
  final String traderId;
  final String traderName;
  final String licenseNumber;
  final String inspectionStatus; // 'Under_Review', 'Passed', 'Failed', 'Pending'
  final String gpsCoordinates;
  final String? photoPath;
  final String sealNumber;
  final String notes;
  final String mpeZero;
  final String mpeHalf;
  final String mpeFull;
  final String createdAt;

  OfflineInspectionReport({
    required this.queueId,
    required this.traderId,
    required this.traderName,
    required this.licenseNumber,
    required this.inspectionStatus,
    required this.gpsCoordinates,
    this.photoPath,
    required this.sealNumber,
    required this.notes,
    required this.mpeZero,
    required this.mpeHalf,
    required this.mpeFull,
    required this.createdAt,
  });

  Map<String, dynamic> toJson() {
    return {
      'queue_id': queueId,
      'trader_id': traderId,
      'trader_name': traderName,
      'license_number': licenseNumber,
      'inspection_status': inspectionStatus,
      'gps_coordinates': gpsCoordinates,
      'photo_path': photoPath,
      'seal_number': sealNumber,
      'notes': notes,
      'mpe_zero': mpeZero,
      'mpe_half': mpeHalf,
      'mpe_full': mpeFull,
      'created_at': createdAt,
    };
  }

  factory OfflineInspectionReport.fromJson(Map<String, dynamic> json) {
    return OfflineInspectionReport(
      queueId: json['queue_id'] ?? DateTime.now().millisecondsSinceEpoch.toString(),
      traderId: json['trader_id'] ?? '',
      traderName: json['trader_name'] ?? 'Trader',
      licenseNumber: json['license_number'] ?? '',
      inspectionStatus: json['inspection_status'] ?? 'Under_Review',
      gpsCoordinates: json['gps_coordinates'] ?? '',
      photoPath: json['photo_path'],
      sealNumber: json['seal_number'] ?? '',
      notes: json['notes'] ?? '',
      mpeZero: json['mpe_zero'] ?? '0.0 g',
      mpeHalf: json['mpe_half'] ?? '+0.5 g',
      mpeFull: json['mpe_full'] ?? '+1.0 g',
      createdAt: json['created_at'] ?? DateTime.now().toIso8601String(),
    );
  }
}

/// Offline-First Caching & Background Sync Manager
class OfflineSyncService extends ChangeNotifier {
  static final OfflineSyncService _instance = OfflineSyncService._internal();
  factory OfflineSyncService() => _instance;
  OfflineSyncService._internal();

  static const String _cachedTradersKey = 'LMO_CACHED_TRADERS_V1';
  static const String _offlineQueueKey = 'LMO_OFFLINE_INSPECTIONS_QUEUE_V1';
  static const String _offlineApprovalsKey = 'offline_pending_approvals';

  final Connectivity _connectivity = Connectivity();
  StreamSubscription<List<ConnectivityResult>>? _connectivitySubscription;

  bool _isOnline = true;
  bool _isSyncing = false;
  List<OfflineInspectionReport> _queuedReports = [];
  List<Map<String, dynamic>> _offlineApprovals = [];

  bool get isOnline => _isOnline;
  bool get isSyncing => _isSyncing;
  List<OfflineInspectionReport> get queuedReports => _queuedReports;
  List<Map<String, dynamic>> get offlineApprovals => _offlineApprovals;
  int get pendingCount => _offlineApprovals.length + _queuedReports.length;
  int get pendingApprovalsCount => _offlineApprovals.length;

  /// Initialize connectivity monitoring and load stored offline queue
  Future<void> initialize() async {
    await _loadStoredQueue();
    await loadOfflineApprovals();

    // Check initial connectivity
    try {
      final results = await _connectivity.checkConnectivity();
      _updateConnectionStatus(results);
    } catch (e) {
      debugPrint('Connectivity check note: $e');
    }

    // Listen for real-time connectivity changes
    _connectivitySubscription = _connectivity.onConnectivityChanged.listen((results) {
      _updateConnectionStatus(results);
    });
  }

  void _updateConnectionStatus(List<ConnectivityResult> results) {
    final hasConnection = results.any((r) => r != ConnectivityResult.none);
    final previousStatus = _isOnline;
    _isOnline = hasConnection;
    notifyListeners();

    // If connection was just restored and we have pending approvals/reports, trigger auto-sync
    if (!previousStatus && hasConnection && (_offlineApprovals.isNotEmpty || _queuedReports.isNotEmpty)) {
      debugPrint('🌐 Internet restored! Auto-triggering background sync...');
      syncOfflineQueue();
    }
  }

  // ===========================================================================
  // OFFLINE APPROVALS ENGINE (DIRECT SUPABASE HANDSHAKE)
  // ===========================================================================

  /// Load pending offline approvals from SharedPreferences
  Future<List<Map<String, dynamic>>> loadOfflineApprovals() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final List<String> rawList = prefs.getStringList(_offlineApprovalsKey) ?? [];
      _offlineApprovals = rawList.map((item) {
        try {
          return Map<String, dynamic>.from(jsonDecode(item));
        } catch (_) {
          return <String, dynamic>{};
        }
      }).where((m) => m.isNotEmpty && m['license_number'] != null).toList();
      notifyListeners();
      return _offlineApprovals;
    } catch (e) {
      debugPrint('Error loading offline approvals: $e');
      return [];
    }
  }

  /// Save an inspection approval locally when offline
  Future<void> saveOfflineApproval({
    required String licenseNumber,
    required String traderName,
    required double latitude,
    required double longitude,
    String? photoPath,
  }) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final List<String> current = prefs.getStringList(_offlineApprovalsKey) ?? [];

      final approvalRecord = {
        'license_number': licenseNumber,
        'trader_name': traderName,
        'status': 'Pending_GATC',
        'latitude': latitude,
        'longitude': longitude,
        'photo_path': photoPath,
        'timestamp': DateTime.now().toIso8601String(),
        'idempotency_key': 'INSP-${licenseNumber.replaceAll(RegExp(r'[^a-zA-Z0-9]'), '_')}-${DateTime.now().millisecondsSinceEpoch}',
        'device_id': 'LMO-FLUTTER-FIELD-01',
      };

      // Remove existing entry for same license to prevent duplicates
      current.removeWhere((item) {
        try {
          final dec = jsonDecode(item);
          return dec['license_number'] == licenseNumber;
        } catch (_) {
          return false;
        }
      });

      current.add(jsonEncode(approvalRecord));
      await prefs.setStringList(_offlineApprovalsKey, current);
      await loadOfflineApprovals();
      debugPrint('📦 Stored approval offline for $licenseNumber. Total queued approvals: ${_offlineApprovals.length}');
    } catch (e) {
      debugPrint('Error saving offline approval: $e');
    }
  }

  /// Check if a given trader license has been saved offline
  bool isSavedOffline(String licenseNumber) {
    return _offlineApprovals.any((a) => a['license_number'] == licenseNumber);
  }

  // ===========================================================================
  // TRADERS LOCAL CACHE
  // ===========================================================================

  /// Cache list of assigned traders locally in SharedPreferences
  Future<void> cacheTraders(List<Trader> traders) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final jsonList = traders.map((t) => t.toJson()).toList();
      await prefs.setString(_cachedTradersKey, json.encode(jsonList));
      debugPrint('💾 Cached ${traders.length} traders to local device storage.');
    } catch (e) {
      debugPrint('Error saving cached traders: $e');
    }
  }

  /// Retrieve cached traders from SharedPreferences
  Future<List<Trader>> getCachedTraders() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString(_cachedTradersKey);
      if (raw != null && raw.isNotEmpty) {
        final List list = json.decode(raw);
        return list.map((item) => Trader.fromJson(item)).toList();
      }
    } catch (e) {
      debugPrint('Error reading cached traders: $e');
    }
    return [];
  }

  // ===========================================================================
  // OFFLINE QUEUE MANAGEMENT (LEGACY FORM SUPPORT)
  // ===========================================================================

  Future<void> _loadStoredQueue() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString(_offlineQueueKey);
      if (raw != null && raw.isNotEmpty) {
        final List list = json.decode(raw);
        _queuedReports = list.map((item) => OfflineInspectionReport.fromJson(item)).toList();
        notifyListeners();
      }
    } catch (e) {
      debugPrint('Error loading offline queue: $e');
    }
  }

  Future<void> _saveStoredQueue() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final jsonList = _queuedReports.map((r) => r.toJson()).toList();
      await prefs.setString(_offlineQueueKey, json.encode(jsonList));
      notifyListeners();
    } catch (e) {
      debugPrint('Error saving offline queue: $e');
    }
  }

  /// Enqueue an inspection report when offline or on network failure
  Future<void> enqueueInspection(OfflineInspectionReport report) async {
    _queuedReports.add(report);
    await _saveStoredQueue();
    debugPrint('📦 Enqueued offline inspection report for ${report.licenseNumber}. Total queued: ${_queuedReports.length}');
  }

  // ===========================================================================
  // BACKGROUND SYNC ENGINE (PUSHES PENDING_GATC DIRECTLY TO SUPABASE)
  // ===========================================================================

  /// Synchronize all pending offline approvals & reports with Supabase
  Future<SyncResult> syncOfflineQueue({String? baseUrl}) async {
    if (_isSyncing) {
      return SyncResult(syncedCount: 0, remainingCount: pendingCount, success: false);
    }

    await loadOfflineApprovals();
    if (_offlineApprovals.isEmpty && _queuedReports.isEmpty) {
      return SyncResult(syncedCount: 0, remainingCount: 0, success: true);
    }

    _isSyncing = true;
    notifyListeners();

    int successCount = 0;
    final List<String> successfullySyncedLicenses = [];
    final supabase = Supabase.instance.client;

    // 1. Sync all locally saved approvals to Supabase traders table
    for (final item in List<Map<String, dynamic>>.from(_offlineApprovals)) {
      final lic = item['license_number']?.toString() ?? '';
      if (lic.isEmpty) continue;

      final lat = (item['latitude'] as num?)?.toDouble() ?? 28.8955;
      final lng = (item['longitude'] as num?)?.toDouble() ?? 76.6066;
      final photoPath = item['photo_path']?.toString();
      String? photoUrl;

      try {
        // Upload photo to Supabase storage if photo file exists locally
        if (photoPath != null && File(photoPath).existsSync()) {
          try {
            final fileExt = photoPath.split('.').last;
            final sanitizedLic = lic.replaceAll(RegExp(r'[^a-zA-Z0-9]'), '_');
            final storagePath = 'inspection_${sanitizedLic}_${DateTime.now().millisecondsSinceEpoch}.$fileExt';
            await supabase.storage.from('inspections').upload(
              storagePath,
              File(photoPath),
              fileOptions: const FileOptions(cacheControl: '3600', upsert: true),
            );
            photoUrl = supabase.storage.from('inspections').getPublicUrl(storagePath);
            debugPrint('📸 Queued photo uploaded to Supabase Storage during sync for $lic');
          } catch (storageErr) {
            debugPrint('Note on storage upload during sync: $storageErr');
          }
        }

        // Update Supabase traders row: set inspection_status to 'Passed'
        final traderUpdate = <String, dynamic>{
          'inspection_status': 'Passed',
          'latitude': lat,
          'longitude': lng,
          'inspection_image_url': ?photoUrl,
        };
        await supabase.from('traders').update(traderUpdate).eq('license_number', lic.trim()).select();

        // Also insert into inspections table
        try {
          await supabase.from('inspections').insert({
            'license_number': lic.trim(),
            'inspection_status': 'Passed',
            'gps_coordinates': '$lat,$lng',
            'seal_number': 'SEAL-${DateTime.now().millisecondsSinceEpoch}',
            'notes': 'Offline inspection synced to cloud',
            'photo_url': ?photoUrl,
            'inspected_at': DateTime.now().toIso8601String(),
          });
        } catch (_) {}

        successfullySyncedLicenses.add(lic);
        successCount++;
        debugPrint('✅ Successfully pushed offline approval to Supabase: $lic -> Passed');
      } catch (e) {
        debugPrint('⚠️ Sync failed for $lic (will retry on next connection event): $e');
        // If network is completely unreachable, break out to avoid busy looping
        break;
      }
    }

    // Remove successfully pushed approvals from SharedPreferences
    if (successfullySyncedLicenses.isNotEmpty) {
      try {
        final prefs = await SharedPreferences.getInstance();
        final List<String> current = prefs.getStringList(_offlineApprovalsKey) ?? [];
        current.removeWhere((item) {
          try {
            final dec = jsonDecode(item);
            return successfullySyncedLicenses.contains(dec['license_number']);
          } catch (_) {
            return false;
          }
        });
        await prefs.setStringList(_offlineApprovalsKey, current);
        await loadOfflineApprovals();
      } catch (e) {
        debugPrint('Error clearing synced approvals from cache: $e');
      }
    }

    // 2. Also attempt sync of any legacy OfflineInspectionReports if present
    final targetBaseUrl = baseUrl ?? ApiService.defaultBaseUrl;
    final List<OfflineInspectionReport> successfullySyncedReports = [];

    for (final report in List<OfflineInspectionReport>.from(_queuedReports)) {
      try {
        await supabase.from('traders').update({
          'inspection_status': 'Passed',
        }).eq('license_number', report.licenseNumber.trim()).select();

        successfullySyncedReports.add(report);
        successCount++;
      } catch (_) {
        // Fallback to Express sync endpoint if Supabase direct fails
        try {
          final uri = Uri.parse('$targetBaseUrl/api/inspections/sync');
          final idKey = 'INSP-${report.licenseNumber.replaceAll(RegExp(r'[^a-zA-Z0-9]'), '_')}-${report.queueId}';
          final response = await http.post(
            uri,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer lmo-officer-token-2026',
              'x-api-key': 'emapan-secure-officer-key-2026',
              'idempotency-key': idKey,
            },
            body: json.encode({
              'license_number': report.licenseNumber,
              'inspection_status': 'Pending_GATC',
              'idempotency_key': idKey,
              'device_id': 'LMO-FLUTTER-FIELD-01',
              'gps_coordinates': report.gpsCoordinates,
              'seal_number': report.sealNumber,
              'notes': report.notes,
            }),
          ).timeout(const Duration(seconds: 5));
          if (response.statusCode == 200 || response.statusCode == 201) {
            successfullySyncedReports.add(report);
            successCount++;
          }
        } catch (_) {
          break;
        }
      }
    }

    if (successfullySyncedReports.isNotEmpty) {
      _queuedReports.removeWhere((r) => successfullySyncedReports.any((s) => s.queueId == r.queueId));
      await _saveStoredQueue();
    }

    _isSyncing = false;
    notifyListeners();

    return SyncResult(
      syncedCount: successCount,
      remainingCount: pendingCount,
      success: pendingCount == 0,
    );
  }

  @override
  void dispose() {
    _connectivitySubscription?.cancel();
    super.dispose();
  }
}

class SyncResult {
  final int syncedCount;
  final int remainingCount;
  final bool success;

  SyncResult({
    required this.syncedCount,
    required this.remainingCount,
    required this.success,
  });
}
