import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
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

  final Connectivity _connectivity = Connectivity();
  StreamSubscription<List<ConnectivityResult>>? _connectivitySubscription;

  bool _isOnline = true;
  bool _isSyncing = false;
  List<OfflineInspectionReport> _queuedReports = [];

  bool get isOnline => _isOnline;
  bool get isSyncing => _isSyncing;
  List<OfflineInspectionReport> get queuedReports => _queuedReports;
  int get pendingCount => _queuedReports.length;

  /// Initialize connectivity monitoring and load stored offline queue
  Future<void> initialize() async {
    await _loadStoredQueue();

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

    // If connection was just restored and we have pending reports, trigger auto-sync
    if (!previousStatus && hasConnection && _queuedReports.isNotEmpty) {
      debugPrint('🌐 Internet restored! Auto-triggering background sync for ${_queuedReports.length} queued inspections...');
      syncOfflineQueue();
    }
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
  // OFFLINE QUEUE MANAGEMENT
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
  // BACKGROUND SYNC LISTENER & UPLOADER (WITH MULTIPART PHOTO UPLOAD)
  // ===========================================================================

  /// Synchronize all pending offline reports with the backend API
  Future<SyncResult> syncOfflineQueue({String? baseUrl}) async {
    if (_isSyncing) return SyncResult(syncedCount: 0, remainingCount: _queuedReports.length, success: false);
    if (_queuedReports.isEmpty) return SyncResult(syncedCount: 0, remainingCount: 0, success: true);

    _isSyncing = true;
    notifyListeners();

    final targetBaseUrl = baseUrl ?? ApiService.defaultBaseUrl;
    final List<OfflineInspectionReport> successfullySynced = [];
    int successCount = 0;

    for (final report in List<OfflineInspectionReport>.from(_queuedReports)) {
      try {
        // 1. Upload cached inspection photo via MultipartRequest if present
        if (report.photoPath != null && File(report.photoPath!).existsSync()) {
          try {
            final uploadUri = Uri.parse('$targetBaseUrl/api/inspections/${Uri.encodeComponent(report.licenseNumber)}/upload');
            final uploadReq = http.MultipartRequest('POST', uploadUri);
            uploadReq.files.add(await http.MultipartFile.fromPath('image', report.photoPath!));
            final streamed = await uploadReq.send().timeout(const Duration(seconds: 8));
            final uploadRes = await http.Response.fromStream(streamed);
            if (uploadRes.statusCode == 200) {
              debugPrint('📸 Queued photo uploaded successfully during sync for ${report.licenseNumber}');
            }
          } catch (pErr) {
            debugPrint('⚠️ Note uploading photo during sync: $pErr');
          }
        }

        // 2. Upload inspection report JSON payload
        final uri = Uri.parse('$targetBaseUrl/api/inspections/sync');
        final response = await http
            .post(
              uri,
              headers: {'Content-Type': 'application/json'},
              body: json.encode({
                'license_number': report.licenseNumber,
                'inspection_status': report.inspectionStatus,
                'gps_coordinates': report.gpsCoordinates,
                'photo_path': report.photoPath,
                'seal_number': report.sealNumber,
                'notes': report.notes,
                'mpe_zero': report.mpeZero,
                'mpe_half': report.mpeHalf,
                'mpe_full': report.mpeFull,
                'timestamp': report.createdAt,
              }),
            )
            .timeout(const Duration(seconds: 6));

        if (response.statusCode == 200 || response.statusCode == 201) {
          successfullySynced.add(report);
          successCount++;
          debugPrint('✅ Successfully synced offline report for ${report.licenseNumber}');
        } else {
          debugPrint('⚠️ Sync server response ${response.statusCode} for ${report.licenseNumber}');
        }
      } catch (e) {
        debugPrint('⚠️ Sync attempt failed for ${report.licenseNumber}: $e');
        break;
      }
    }

    // Remove successfully synced reports from local queue
    if (successfullySynced.isNotEmpty) {
      _queuedReports.removeWhere((r) => successfullySynced.any((s) => s.queueId == r.queueId));
      await _saveStoredQueue();
    }

    _isSyncing = false;
    notifyListeners();

    return SyncResult(
      syncedCount: successCount,
      remainingCount: _queuedReports.length,
      success: _queuedReports.isEmpty,
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
