import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:supabase_flutter/supabase_flutter.dart';
import 'offline_sync_service.dart';

/// Data model representing a Trader registered in the Legal Metrology System
class Trader {
  final String traderName;
  final String ownerName;
  final String licenseNumber;
  final double? latitude;
  final double? longitude;
  final String instrumentType;
  final String status; // 'Pending_LMO', 'Pending_GATC', 'Verified', 'Rejected'
  final String district;
  final String traderEmail;

  Trader({
    required this.traderName,
    required this.ownerName,
    required this.licenseNumber,
    this.latitude,
    this.longitude,
    required this.instrumentType,
    required this.status,
    this.district = 'Hisar',
    this.traderEmail = '',
  });

  // Backward compatibility getters
  String get id => licenseNumber;
  String get inspectionStatus => status;

  factory Trader.fromJson(Map<String, dynamic> json) {
    return Trader(
      traderName: (json['trader_name'] ?? json['shop_name'] ?? 'Unknown Trader').toString(),
      ownerName: (json['owner_name'] ?? 'Proprietor').toString(),
      licenseNumber: (json['license_number'] ?? json['id'] ?? 'LMO/2026/00000').toString(),
      latitude: json['latitude'] != null ? double.tryParse(json['latitude'].toString()) : null,
      longitude: json['longitude'] != null ? double.tryParse(json['longitude'].toString()) : null,
      instrumentType: (json['instrument_type'] ?? 'Weighing Scale').toString(),
      status: (json['status'] ?? json['inspection_status'] ?? 'Pending_LMO').toString(),
      district: (json['district'] ?? 'Hisar').toString(),
      traderEmail: (json['trader_email'] ?? '').toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'trader_name': traderName,
      'owner_name': ownerName,
      'license_number': licenseNumber,
      'latitude': latitude,
      'longitude': longitude,
      'instrument_type': instrumentType,
      'status': status,
      'district': district,
      'trader_email': traderEmail,
    };
  }
}

/// Service connecting to the Legal Metrology (LMO) Express API Backend with Offline Caching
class ApiService {
  static const String defaultBaseUrl = 'http://localhost:5000';
  static const String androidEmulatorBaseUrl = 'http://10.0.2.2:5000';

  final String baseUrl;
  final OfflineSyncService _syncService = OfflineSyncService();

  ApiService({String? baseUrl}) : baseUrl = baseUrl ?? defaultBaseUrl;

  /// Fetch all traders with 'Pending_LMO' inspection status with offline-first cache
  Future<List<Trader>> fetchPendingTraders({String? district}) async {
    // 1. Direct Supabase REST fetch from traders_list matching Pending_LMO
    try {
      var query = Supabase.instance.client
          .from('traders_list')
          .select()
          .or('status.eq.Pending_LMO,status.eq.Pending_Inspection,status.eq.Pending');

      if (district != null && district.isNotEmpty && district.toLowerCase() != 'all') {
        query = query.ilike('district', '%$district%');
      }

      final List<dynamic> sbRes = await query;
      if (sbRes.isNotEmpty) {
        final traders = sbRes.map((item) => Trader.fromJson(Map<String, dynamic>.from(item))).toList();
        await _syncService.cacheTraders(traders);
        return traders;
      }
    } catch (sbErr) {
      debugPrint('Direct Supabase fetch note in ApiService: $sbErr');
    }

    // 2. Secondary: API Server fetch
    try {
      final distParam = district != null && district.isNotEmpty && district.toLowerCase() != 'all'
          ? '&district=${Uri.encodeComponent(district)}'
          : '';
      final uri = Uri.parse('$baseUrl/api/traders?status=Pending_LMO$distParam');
      final response = await http.get(uri).timeout(const Duration(seconds: 4));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['success'] == true && data['data'] is List) {
          final List list = data['data'];
          if (list.isNotEmpty) {
            final traders = list.map((item) => Trader.fromJson(item)).toList();
            await _syncService.cacheTraders(traders);
            return traders;
          }
        }
      }
    } catch (e) {
      debugPrint('Live API fetch skipped/offline: $e');
    }

    // 3. If offline or error, load cached traders from local storage
    final cached = await _syncService.getCachedTraders();
    if (cached.isNotEmpty) {
      debugPrint('📦 Serving ${cached.length} assigned traders from offline local cache.');
      return cached;
    }

    // 4. Return realistic sample pending traders if cache is not yet populated
    final sample = _getFallbackPendingTraders();
    await _syncService.cacheTraders(sample);
    return sample;
  }

  /// Submit an inspection report (handles online immediate upload or offline queuing)
  Future<bool> submitInspectionReport(OfflineInspectionReport report) async {
    if (_syncService.isOnline) {
      try {
        // 1. If photo exists locally, upload to Supabase Storage
        if (report.photoPath != null && File(report.photoPath!).existsSync()) {
          await uploadInspectionImage(report.licenseNumber, File(report.photoPath!));
        }

        // 2. Direct Supabase update on traders_list to Pending_GATC
        final targetStatus = report.inspectionStatus.trim().isEmpty || report.inspectionStatus == 'Under_Review'
            ? 'Pending_GATC'
            : report.inspectionStatus;
        try {
          await Supabase.instance.client
              .from('traders_list')
              .update({'status': targetStatus})
              .eq('license_number', report.licenseNumber.trim())
              .select();
          debugPrint('✅ Direct Supabase status updated to $targetStatus for ${report.licenseNumber}');
        } catch (sbErr) {
          debugPrint('Direct Supabase status update note: $sbErr');
        }

        final uri = Uri.parse('$baseUrl/api/inspections/sync');
        final response = await http
            .post(
              uri,
              headers: {'Content-Type': 'application/json'},
              body: json.encode({
                'license_number': report.licenseNumber,
                'inspection_status': targetStatus,
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
            .timeout(const Duration(seconds: 5));

        if (response.statusCode == 200 || response.statusCode == 201) {
          debugPrint('✅ Online inspection submission successful for ${report.licenseNumber}');
          return true;
        }
      } catch (e) {
        debugPrint('⚠️ Online submission failed, falling back to offline queue: $e');
      }
    }

    // Fallback or Offline: Enqueue to local storage queue
    await _syncService.enqueueInspection(report);
    return false; // Indicating queued offline
  }

  /// Upload on-site inspection photograph to Supabase Storage endpoint
  Future<String?> uploadInspectionImage(String licenseNumber, File imageFile) async {
    try {
      final uri = Uri.parse('$baseUrl/api/inspections/${Uri.encodeComponent(licenseNumber)}/upload');
      final request = http.MultipartRequest('POST', uri);
      request.files.add(await http.MultipartFile.fromPath('image', imageFile.path));

      final streamedResponse = await request.send().timeout(const Duration(seconds: 8));
      final response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        if (data['success'] == true && data['inspection_image_url'] != null) {
          debugPrint('📸 Photo uploaded to Supabase Storage: ${data['inspection_image_url']}');
          return data['inspection_image_url'];
        }
      }
    } catch (e) {
      debugPrint('⚠️ Photo upload notice: $e');
    }
    return null;
  }

  /// Fallback Pending Traders (Haryana & Delhi NCR Zone)
  List<Trader> _getFallbackPendingTraders() {
    return [
      Trader(
        traderName: 'Rohtak Sweets & Confectionery',
        ownerName: 'Rahul Sharma',
        licenseNumber: 'LMO-ROH-001',
        latitude: 28.8955,
        longitude: 76.5833,
        status: 'Pending_LMO',
        instrumentType: 'Class III Electronic Weighing Scale',
        district: 'Rohtak',
        traderEmail: 'rohtak.sweets@demo.com',
      ),
      Trader(
        traderName: 'Mohan Kirana Store',
        ownerName: 'Mohan Lal',
        licenseNumber: 'LMO-HIS-001',
        latitude: 29.1539,
        longitude: 75.7114,
        status: 'Pending_LMO',
        instrumentType: 'Class III Electronic Table Top Scale',
        district: 'Hisar',
        traderEmail: 'trader@demo.com',
      ),
      Trader(
        traderName: 'Haryana Agro Flour Mill & Grain Depot',
        ownerName: 'Haskell Hahn',
        licenseNumber: 'LMO/2026/10003',
        latitude: 29.391101,
        longitude: 77.227515,
        status: 'Pending_LMO',
        instrumentType: 'Platform Scale',
        district: 'Panipat',
      ),
      Trader(
        traderName: 'Gurugram Cold Storage & Dairy',
        ownerName: 'Mrs. Alysa Bahringer',
        licenseNumber: 'LMO/2026/10006',
        latitude: 28.902579,
        longitude: 76.686301,
        status: 'Pending_LMO',
        instrumentType: 'Electronic Weighing Scale',
        district: 'Gurugram',
      ),
      Trader(
        traderName: 'Runolfsson and Sons Pharma Labs',
        ownerName: 'Vera Leuschke DVM',
        licenseNumber: 'LMO/2026/10009',
        latitude: 29.475476,
        longitude: 76.773539,
        status: 'Pending_LMO',
        instrumentType: 'Analytical Precision Balance',
        district: 'Karnal',
      ),
    ];
  }
}
