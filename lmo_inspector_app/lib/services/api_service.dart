import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:supabase_flutter/supabase_flutter.dart';
import 'offline_sync_service.dart';
import 'demo_service.dart';

/// Data model representing a Trader registered in the Legal Metrology System
class Trader {
  final String? id;
  final String traderName;
  final String ownerName;
  final String licenseNumber;
  final double? latitude;
  final double? longitude;
  final String instrumentType;
  final String inspectionStatus; // 'Pending', 'Passed', 'Failed'
  final String? assignedOfficer;
  final String? inspectionImageUrl;
  final String? createdAt;
  final String? updatedAt;
  final String district;

  Trader({
    this.id,
    required this.traderName,
    required this.ownerName,
    required this.licenseNumber,
    this.latitude,
    this.longitude,
    required this.instrumentType,
    String? inspectionStatus,
    String? status,
    this.assignedOfficer,
    this.inspectionImageUrl,
    this.createdAt,
    this.updatedAt,
    String? district,
    String? traderEmail,
  })  : inspectionStatus = inspectionStatus ?? status ?? 'Pending',
        district = district ?? 'Hisar';

  // Backward compatibility getters for existing Flutter UI
  String get status => inspectionStatus;
  String get traderEmail => '';
  int get riskScore => 20;
  String get riskTier => 'LOW';
  int get complaintsCount => 0;
  String? get canonicalSealNumber => null;

  factory Trader.fromJson(Map<String, dynamic> json) {
    return Trader(
      id: json['id']?.toString(),
      traderName: (json['trader_name'] ?? json['shop_name'] ?? 'Unknown Trader').toString(),
      ownerName: (json['owner_name'] ?? 'Proprietor').toString(),
      licenseNumber: (json['license_number'] ?? json['id'] ?? 'LMO/2026/00000').toString(),
      latitude: json['latitude'] != null ? double.tryParse(json['latitude'].toString()) : null,
      longitude: json['longitude'] != null ? double.tryParse(json['longitude'].toString()) : null,
      instrumentType: (json['instrument_type'] ?? 'Weighing Scale').toString(),
      inspectionStatus: (json['inspection_status'] ?? json['status'] ?? 'Pending').toString(),
      assignedOfficer: json['assigned_officer']?.toString(),
      inspectionImageUrl: (json['inspection_image_url'] ?? json['photo_url'])?.toString(),
      createdAt: json['created_at']?.toString(),
      updatedAt: json['updated_at']?.toString(),
      district: (json['district'] ?? 'Hisar').toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'trader_name': traderName,
      'shop_name': traderName,
      'owner_name': ownerName,
      'license_number': licenseNumber,
      'latitude': latitude,
      'longitude': longitude,
      'instrument_type': instrumentType,
      'inspection_status': inspectionStatus,
      'status': inspectionStatus,
      'district': district,
      'assigned_officer': assignedOfficer,
      'inspection_image_url': inspectionImageUrl,
      'created_at': createdAt,
      'updated_at': updatedAt,
    };
  }
}

/// Service connecting to the Legal Metrology (LMO) Next.js Backend with Offline Caching
class ApiService {
  static const String defaultBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:3000',
  );
  static const String androidEmulatorBaseUrl = 'http://10.0.2.2:3000';

  static bool get isDemoMode => DemoService.isDemoMode;
  static set isDemoMode(bool value) => DemoService.isDemoMode = value;

  final String baseUrl;
  final OfflineSyncService _syncService = OfflineSyncService();

  ApiService({String? baseUrl}) : baseUrl = baseUrl ?? defaultBaseUrl;

  /// Fetch all traders with 'Pending' inspection status from traders table
  Future<List<Trader>> fetchPendingTraders({String? district}) async {
    // 0. Golden Path Demo Mode: completely bypass Supabase and network
    if (DemoService.isDemoMode) {
      debugPrint('🌟 [Demo Mode] Bypassing Supabase fetchPendingTraders call.');
      return DemoService.dummyTraders;
    }

    // 1. Direct Supabase REST fetch from traders table matching inspection_status = 'Pending'
    try {
      final List<dynamic> sbRes = await Supabase.instance.client
          .from('traders')
          .select()
          .eq('inspection_status', 'Pending');

      if (sbRes.isNotEmpty) {
        final traders = sbRes.map((item) => Trader.fromJson(Map<String, dynamic>.from(item))).toList();
        await _syncService.cacheTraders(traders);
        return traders;
      }
    } catch (sbErr) {
      debugPrint('Direct Supabase fetch note in ApiService: $sbErr');
    }

    // 2. Secondary: Next.js API Server fetch
    try {
      final uri = Uri.parse('$baseUrl/api/traders?inspection_status=Pending');
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
    if (DemoService.isDemoMode) {
      debugPrint('🌟 [Demo Mode] submitInspectionReport bypassed network call.');
      DemoService.markAsPassed(report.licenseNumber);
      return true;
    }

    if (_syncService.isOnline) {
      try {
        String? uploadedUrl;
        // 1. If photo exists locally, upload to Supabase Storage
        if (report.photoPath != null && File(report.photoPath!).existsSync()) {
          uploadedUrl = await uploadInspectionImage(report.licenseNumber, File(report.photoPath!));
        }

        // 2. Normalize inspection status strictly to 'Passed', 'Failed', or 'Pending'
        final raw = report.inspectionStatus.trim();
        final normalizedStatus = (raw == 'Passed' || raw == 'Approved' || raw == 'Verified')
            ? 'Passed'
            : (raw == 'Failed' || raw == 'Rejected')
                ? 'Failed'
                : 'Pending';

        try {
          await Supabase.instance.client
              .from('traders')
              .update({
                'inspection_status': normalizedStatus,
                'inspection_image_url': ?uploadedUrl,
              })
              .eq('license_number', report.licenseNumber.trim())
              .select();
          debugPrint('✅ Direct Supabase traders status updated to $normalizedStatus for ${report.licenseNumber}');
        } catch (sbErr) {
          debugPrint('Direct Supabase status update note: $sbErr');
        }

        // 3. Also record in inspections audit table
        try {
          await Supabase.instance.client.from('inspections').insert({
            'license_number': report.licenseNumber.trim(),
            'inspection_status': normalizedStatus,
            'photo_url': uploadedUrl,
            'inspected_at': DateTime.now().toIso8601String(),
          });
        } catch (inspErr) {
          debugPrint('Inspections table insert note: $inspErr');
        }

        final uri = Uri.parse('$baseUrl/api/inspections/sync');
        final response = await http
            .post(
              uri,
              headers: {'Content-Type': 'application/json'},
              body: json.encode({
                'license_number': report.licenseNumber,
                'inspection_status': normalizedStatus,
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
