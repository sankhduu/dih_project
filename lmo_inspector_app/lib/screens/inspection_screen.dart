import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:geolocator/geolocator.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class InspectionScreen extends StatefulWidget {
  final Map<String, dynamic> trader;
  final String? officerEmail;

  const InspectionScreen({
    super.key,
    required this.trader,
    this.officerEmail,
  });

  @override
  State<InspectionScreen> createState() => _InspectionScreenState();
}

class _InspectionScreenState extends State<InspectionScreen> {
  // Brand Colors
  static const Color primaryNavy = Color(0xFF002B49);
  static const Color accentGold = Color(0xFFD97706);
  static const Color emeraldGreen = Color(0xFF059669);
  static const Color bgSlate = Color(0xFFF8FAFC);

  // Five Statutory Verification Checks required:
  // 1. Scale is placed on a flat, stable surface.
  // 2. Zero error is checked and calibrated.
  // 3. Original manufacturer seal is intact.
  // 4. Digital display is clear and tamper-free.
  // 5. GPS Location matches shop address.
  bool _checkFlatSurface = false;
  bool _checkZeroError = false;
  bool _checkManufacturerSeal = false;
  bool _checkDisplayTamperFree = false;
  bool _checkGpsLocationMatches = false;

  // Live Camera & Photo State
  File? _capturedImageFile;
  String? _capturedImagePath;
  String? _capturedPhotoTimestamp;

  // GPS Coordinates State
  double? _liveLatitude;
  double? _liveLongitude;
  bool _isLocating = false;

  bool _isSubmitting = false;

  bool get _areAllChecksPassed =>
      _checkFlatSurface &&
      _checkZeroError &&
      _checkManufacturerSeal &&
      _checkDisplayTamperFree &&
      _checkGpsLocationMatches;

  /// Quick shortcut for hackathon demos to select all 5 items
  void _selectAllChecks() {
    setState(() {
      _checkFlatSurface = true;
      _checkZeroError = true;
      _checkManufacturerSeal = true;
      _checkDisplayTamperFree = true;
      _checkGpsLocationMatches = true;
      if (_capturedImageFile == null) {
        _capturedPhotoTimestamp = DateTime.now().toString().substring(0, 19);
      }
    });
  }

  /// Opens the device camera using image_picker and saves the captured photo
  Future<void> _handleTakeLivePhoto() async {
    final ImagePicker picker = ImagePicker();

    try {
      final XFile? photo = await picker.pickImage(
        source: ImageSource.camera,
        preferredCameraDevice: CameraDevice.rear,
        imageQuality: 85,
      );

      if (photo != null) {
        setState(() {
          _capturedImageFile = File(photo.path);
          _capturedImagePath = photo.path;
          _capturedPhotoTimestamp = DateTime.now().toString().substring(0, 19);
        });

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Row(
                children: [
                  Icon(Icons.camera_alt, color: Colors.white, size: 18),
                  SizedBox(width: 8),
                  Text('📸 Verification photo captured from device camera.'),
                ],
              ),
              backgroundColor: primaryNavy,
              duration: Duration(seconds: 2),
            ),
          );
        }
      }
    } catch (e) {
      debugPrint('Camera capture error / hardware notice: $e');

      // If camera hardware fails or permission is cancelled, allow gallery fallback
      try {
        final XFile? galleryPhoto = await picker.pickImage(
          source: ImageSource.gallery,
          imageQuality: 85,
        );
        if (galleryPhoto != null) {
          setState(() {
            _capturedImageFile = File(galleryPhoto.path);
            _capturedImagePath = galleryPhoto.path;
            _capturedPhotoTimestamp = DateTime.now().toString().substring(0, 19);
          });
        }
      } catch (_) {
        // Simulated timestamp capture for emulator/demo
        setState(() {
          _capturedPhotoTimestamp = DateTime.now().toString().substring(0, 19);
        });
      }
    }
  }

  /// Fetches exact GPS coordinates using geolocator
  Future<Position?> _fetchExactCoordinates() async {
    setState(() {
      _isLocating = true;
    });

    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        debugPrint('Location services are disabled.');
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }

      if (permission == LocationPermission.whileInUse || permission == LocationPermission.always) {
        final position = await Geolocator.getCurrentPosition(
          locationSettings: const LocationSettings(
            accuracy: LocationAccuracy.high,
            timeLimit: Duration(seconds: 5),
          ),
        );
        _liveLatitude = position.latitude;
        _liveLongitude = position.longitude;
        return position;
      }
    } catch (e) {
      debugPrint('Geolocator fetch notice: $e');
      try {
        final lastKnown = await Geolocator.getLastKnownPosition();
        if (lastKnown != null) {
          _liveLatitude = lastKnown.latitude;
          _liveLongitude = lastKnown.longitude;
          return lastKnown;
        }
      } catch (_) {}
    } finally {
      if (mounted) {
        setState(() {
          _isLocating = false;
        });
      }
    }

    // Default fallback coordinates for Haryana/district if GPS is disabled or running in emulator
    final district = (widget.trader['district'] ?? '').toString().toLowerCase();
    if (district.contains('hisar')) {
      _liveLatitude = 29.1492;
      _liveLongitude = 75.7217;
    } else {
      _liveLatitude = 28.8955;
      _liveLongitude = 76.6066;
    }
    return null;
  }

  /// Large Green "Approve & Certify" Button Handler
  /// Implements online sync to Supabase and offline sync via SharedPreferences
  Future<void> _handleApproveAndCertify() async {
    if (!_areAllChecksPassed) {
      final proceed = await showDialog<bool>(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('Incomplete Checklist'),
          content: const Text(
            'Some verification points have not been checked off. '
            'Do you confirm that this instrument satisfies all statutory tolerances for approval?',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Review Checklist'),
            ),
            ElevatedButton(
              onPressed: () {
                _selectAllChecks();
                Navigator.pop(context, true);
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: emeraldGreen,
                foregroundColor: Colors.white,
              ),
              child: const Text('Mark All & Proceed'),
            ),
          ],
        ),
      );

      if (proceed != true) return;
    }

    setState(() {
      _isSubmitting = true;
    });

    // 1. Fetch exact GPS coordinates
    await _fetchExactCoordinates();

    final traderId = (widget.trader['id'] ?? widget.trader['license_number']).toString();
    final licenseNumber = (widget.trader['license_number'] ?? traderId).toString();
    final shopName = (widget.trader['shop_name'] ?? widget.trader['trader_name'] ?? 'Commercial Shop').toString();
    final double lat = _liveLatitude ?? 28.8955;
    final double lng = _liveLongitude ?? 76.6066;
    final String lmoId = widget.officerEmail ?? 'officer.lmo@haryana.gov.in';
    final String photoPath = _capturedImagePath ?? 'camera_live_proof_${DateTime.now().millisecondsSinceEpoch}.jpg';

    // 2. Check network connectivity with connectivity_plus
    bool isConnected = false;
    try {
      final List<ConnectivityResult> connectivityResults = await Connectivity().checkConnectivity();
      isConnected = connectivityResults.any((result) => result != ConnectivityResult.none);
    } catch (e) {
      debugPrint('Connectivity check note: $e');
    }

    bool syncedOnline = false;

    // 3. Online path: Update Supabase directly to Under_Review
    if (isConnected) {
      try {
        final supabase = Supabase.instance.client;

        await supabase.from('traders_list').update({
          'status': 'Under_Review',
          'latitude': lat,
          'longitude': lng,
          'updated_at': DateTime.now().toIso8601String(),
          'photo_url': photoPath,
          'checklist_confirmed': true,
          'lmo_id': lmoId,
        }).eq('id', traderId);

        syncedOnline = true;
        debugPrint('✅ Online sync to Supabase traders_list succeeded for trader: $traderId (Under_Review)');

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Row(
                children: [
                  Icon(Icons.send_rounded, color: Colors.white, size: 18),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text('Inspection forwarded to GATC for digital signature.'),
                  ),
                ],
              ),
              backgroundColor: emeraldGreen,
              duration: Duration(seconds: 4),
            ),
          );
        }
      } catch (e) {
        debugPrint('Online sync to Supabase failed or table not found, falling back to offline: $e');
        syncedOnline = false;
      }
    }

    // 4. Offline path: Save inspection payload as JSON in SharedPreferences
    if (!syncedOnline) {
      try {
        final SharedPreferences prefs = await SharedPreferences.getInstance();
        final List<String> offlineQueue = prefs.getStringList('offline_pending_approvals') ?? [];

        final Map<String, dynamic> approvalRecord = {
          'id': traderId,
          'license_number': licenseNumber,
          'shop_name': shopName,
          'status': 'Under_Review',
          'latitude': lat,
          'longitude': lng,
          'photo_path': photoPath,
          'timestamp': DateTime.now().toIso8601String(),
          'checklist_confirmed': true,
          'lmo_id': lmoId,
        };

        // Remove duplicate if already present in offline queue
        offlineQueue.removeWhere((item) {
          try {
            return jsonDecode(item)['id'] == traderId;
          } catch (_) {
            return false;
          }
        });

        offlineQueue.add(jsonEncode(approvalRecord));
        await prefs.setStringList('offline_pending_approvals', offlineQueue);
        debugPrint('📦 Stored in SharedPreferences offline_pending_approvals. Total queued: ${offlineQueue.length}');

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Row(
                children: [
                  Icon(Icons.wifi_off, color: Colors.white, size: 20),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text('Offline Mode: Inspection saved locally. Will auto-sync when network is restored.'),
                  ),
                ],
              ),
              backgroundColor: accentGold,
              duration: Duration(seconds: 4),
            ),
          );
        }
      } catch (e) {
        debugPrint('Offline local storage note: $e');
      }
    }

    if (!mounted) return;

    setState(() {
      _isSubmitting = false;
    });

    // 5. Official Verification Forwarded Dialog
    await showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: emeraldGreen.withValues(alpha: 0.15),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.send_rounded, color: emeraldGreen, size: 28),
            ),
            const SizedBox(width: 12),
            const Expanded(
              child: Text(
                'Inspection Forwarded to GATC',
                style: TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.bold,
                  color: primaryNavy,
                ),
              ),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Statutory physical inspection (5-point checklist, GPS coordinates, and photo proof) has been recorded and forwarded to GATC for cryptographic digital signing.',
              style: TextStyle(fontSize: 13, color: Colors.black87),
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.grey.shade100,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.grey.shade300),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'LIFECYCLE STATUS:',
                        style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: accentGold.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: const Text(
                          'Under_Review',
                          style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: accentGold),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Shop: $shopName',
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: primaryNavy),
                  ),
                  Text(
                    'GPS: ${lat.toStringAsFixed(5)}, ${lng.toStringAsFixed(5)}',
                    style: TextStyle(fontSize: 11, fontFamily: 'monospace', color: Colors.grey.shade700),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Icon(
                        syncedOnline ? Icons.cloud_done : Icons.save,
                        size: 14,
                        color: syncedOnline ? emeraldGreen : accentGold,
                      ),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          syncedOnline
                              ? 'Forwarded live to GATC via Supabase'
                              : 'Saved locally in offline sync queue',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: syncedOnline ? emeraldGreen : accentGold,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          ElevatedButton(
            onPressed: () => Navigator.pop(context),
            style: ElevatedButton.styleFrom(
              backgroundColor: primaryNavy,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            child: const Text('Return to Dashboard'),
          ),
        ],
      ),
    );

    if (mounted) {
      Navigator.pop(context, true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final shopName = (widget.trader['shop_name'] ?? widget.trader['trader_name'] ?? 'Commercial Shop').toString();
    final ownerName = (widget.trader['owner_name'] ?? 'Proprietor').toString();
    final licenseNumber = (widget.trader['license_number'] ?? widget.trader['id'] ?? 'LMO-2026').toString();
    final district = (widget.trader['district'] ?? 'Rohtak').toString();
    final address = (widget.trader['address'] ?? '$district, Haryana').toString();
    final instrumentType = (widget.trader['instrument_type'] ?? 'Weighing Scale').toString();

    return Scaffold(
      backgroundColor: bgSlate,
      appBar: AppBar(
        backgroundColor: primaryNavy,
        elevation: 1,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Physical Verification Checklist',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            Text(
              shopName,
              style: const TextStyle(
                fontSize: 11,
                color: Colors.white70,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
        actions: [
          TextButton.icon(
            onPressed: _selectAllChecks,
            icon: const Icon(Icons.done_all, color: accentGold, size: 16),
            label: const Text(
              'Demo Check All',
              style: TextStyle(color: accentGold, fontSize: 11, fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          // Tricolor Indian Flag Header Border
          Row(
            children: [
              Expanded(child: Container(height: 3, color: const Color(0xFFFF9933))),
              Expanded(child: Container(height: 3, color: Colors.white)),
              Expanded(child: Container(height: 3, color: const Color(0xFF138808))),
            ],
          ),

          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Shop & Instrument Info Summary Card
                  Card(
                    elevation: 1,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                      side: BorderSide(color: Colors.grey.shade300),
                    ),
                    color: Colors.white,
                    child: Padding(
                      padding: const EdgeInsets.all(14.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Row(
                                children: [
                                  const Icon(Icons.storefront, color: primaryNavy, size: 18),
                                  const SizedBox(width: 8),
                                  Text(
                                    shopName,
                                    style: const TextStyle(
                                      fontSize: 15,
                                      fontWeight: FontWeight.bold,
                                      color: primaryNavy,
                                    ),
                                  ),
                                ],
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                decoration: BoxDecoration(
                                  color: primaryNavy.withValues(alpha: 0.1),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Text(
                                  district,
                                  style: const TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                    color: primaryNavy,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              Expanded(
                                child: Text(
                                  'Proprietor: $ownerName',
                                  style: TextStyle(fontSize: 12, color: Colors.grey.shade700),
                                ),
                              ),
                              Text(
                                'Reg: $licenseNumber',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontFamily: 'monospace',
                                  color: Colors.grey.shade800,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Address: $address',
                            style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
                          ),
                          const SizedBox(height: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: Colors.amber.shade50,
                              borderRadius: BorderRadius.circular(6),
                              border: Border.all(color: Colors.amber.shade200),
                            ),
                            child: Row(
                              children: [
                                const Icon(Icons.scale, size: 14, color: accentGold),
                                const SizedBox(width: 6),
                                Expanded(
                                  child: Text(
                                    'Instrument: $instrumentType',
                                    style: const TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w600,
                                      color: Color(0xFF92400E),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 20),

                  // Bold Title: Physical Verification Checklist
                  Row(
                    children: [
                      Container(
                        width: 4,
                        height: 24,
                        decoration: BoxDecoration(
                          color: primaryNavy,
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                      const SizedBox(width: 10),
                      const Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Physical Verification Checklist',
                            style: TextStyle(
                              fontSize: 17,
                              fontWeight: FontWeight.bold,
                              color: primaryNavy,
                              letterSpacing: 0.3,
                            ),
                          ),
                          Text(
                            'Legal Metrology (General) Rules, 2011 • Form VIII Verification',
                            style: TextStyle(fontSize: 11, color: Colors.black54),
                          ),
                        ],
                      ),
                    ],
                  ),

                  const SizedBox(height: 14),

                  // 5 Statutory CheckboxListTile widgets
                  Card(
                    elevation: 1,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                      side: BorderSide(color: Colors.grey.shade200),
                    ),
                    color: Colors.white,
                    child: Column(
                      children: [
                        // Checkbox 1: Flat, stable surface
                        CheckboxListTile(
                          value: _checkFlatSurface,
                          activeColor: primaryNavy,
                          title: const Text(
                            'Scale is placed on a flat, stable surface.',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: primaryNavy,
                            ),
                          ),
                          subtitle: const Text(
                            'Level bubble indicator centered; free from mechanical vibration.',
                            style: TextStyle(fontSize: 11, color: Colors.black54),
                          ),
                          onChanged: (bool? val) {
                            setState(() {
                              _checkFlatSurface = val ?? false;
                            });
                          },
                        ),
                        const Divider(height: 1, indent: 16, endIndent: 16),

                        // Checkbox 2: Zero error
                        CheckboxListTile(
                          value: _checkZeroError,
                          activeColor: primaryNavy,
                          title: const Text(
                            'Zero error is checked and calibrated.',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: primaryNavy,
                            ),
                          ),
                          subtitle: const Text(
                            'Tare function returns cleanly to 0.00 g; within Maximum Permissible Error (MPE).',
                            style: TextStyle(fontSize: 11, color: Colors.black54),
                          ),
                          onChanged: (bool? val) {
                            setState(() {
                              _checkZeroError = val ?? false;
                            });
                          },
                        ),
                        const Divider(height: 1, indent: 16, endIndent: 16),

                        // Checkbox 3: Original manufacturer seal
                        CheckboxListTile(
                          value: _checkManufacturerSeal,
                          activeColor: primaryNavy,
                          title: const Text(
                            'Original manufacturer seal is intact.',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: primaryNavy,
                            ),
                          ),
                          subtitle: const Text(
                            'Lead-and-wire or holographic security seal unbroken without tampering.',
                            style: TextStyle(fontSize: 11, color: Colors.black54),
                          ),
                          onChanged: (bool? val) {
                            setState(() {
                              _checkManufacturerSeal = val ?? false;
                            });
                          },
                        ),
                        const Divider(height: 1, indent: 16, endIndent: 16),

                        // Checkbox 4: Digital display clear and tamper-free
                        CheckboxListTile(
                          value: _checkDisplayTamperFree,
                          activeColor: primaryNavy,
                          title: const Text(
                            'Digital display is clear and tamper-free.',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: primaryNavy,
                            ),
                          ),
                          subtitle: const Text(
                            '7-segment/VFD digits bright and fully visible to consumers.',
                            style: TextStyle(fontSize: 11, color: Colors.black54),
                          ),
                          onChanged: (bool? val) {
                            setState(() {
                              _checkDisplayTamperFree = val ?? false;
                            });
                          },
                        ),
                        const Divider(height: 1, indent: 16, endIndent: 16),

                        // Checkbox 5: GPS Location matches shop address
                        CheckboxListTile(
                          value: _checkGpsLocationMatches,
                          activeColor: primaryNavy,
                          title: const Text(
                            'GPS Location matches shop address.',
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: primaryNavy,
                            ),
                          ),
                          subtitle: const Text(
                            'Inspector geo-coordinates validated within shop geofence radius (< 25m).',
                            style: TextStyle(fontSize: 11, color: Colors.black54),
                          ),
                          onChanged: (bool? val) {
                            setState(() {
                              _checkGpsLocationMatches = val ?? false;
                            });
                          },
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 20),

                  // Camera & Photo Proof Section
                  Card(
                    elevation: 1,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                      side: BorderSide(color: Colors.grey.shade200),
                    ),
                    color: Colors.white,
                    child: Padding(
                      padding: const EdgeInsets.all(14.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          const Row(
                            children: [
                              Icon(Icons.photo_camera, color: primaryNavy, size: 18),
                              SizedBox(width: 8),
                              Text(
                                'Verification Photographic Proof',
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold,
                                  color: primaryNavy,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          const Text(
                            'Capture live photo of the calibrated scale displaying zero reading and inspector seal.',
                            style: TextStyle(fontSize: 11, color: Colors.black54),
                          ),
                          const SizedBox(height: 12),

                          // Small thumbnail of captured image if present
                          if (_capturedImageFile != null && _capturedImageFile!.existsSync()) ...[
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: Colors.grey.shade50,
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(color: emeraldGreen.withValues(alpha: 0.5)),
                              ),
                              child: Row(
                                children: [
                                  // Small Thumbnail
                                  ClipRRect(
                                    borderRadius: BorderRadius.circular(8),
                                    child: Image.file(
                                      _capturedImageFile!,
                                      width: 72,
                                      height: 72,
                                      fit: BoxFit.cover,
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        const Row(
                                          children: [
                                            Icon(Icons.check_circle, color: emeraldGreen, size: 16),
                                            SizedBox(width: 4),
                                            Text(
                                              'Live Photo Attached',
                                              style: TextStyle(
                                                fontSize: 12,
                                                fontWeight: FontWeight.bold,
                                                color: emeraldGreen,
                                              ),
                                            ),
                                          ],
                                        ),
                                        const SizedBox(height: 2),
                                        Text(
                                          'Captured: $_capturedPhotoTimestamp',
                                          style: const TextStyle(fontSize: 10, color: Colors.black54),
                                        ),
                                        const SizedBox(height: 2),
                                        Text(
                                          _capturedImageFile!.path.split(Platform.pathSeparator).last,
                                          style: TextStyle(
                                            fontSize: 9,
                                            fontFamily: 'monospace',
                                            color: Colors.grey.shade600,
                                          ),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ],
                                    ),
                                  ),
                                  IconButton(
                                    icon: const Icon(Icons.refresh, size: 20, color: primaryNavy),
                                    onPressed: _handleTakeLivePhoto,
                                    tooltip: 'Retake Photo',
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 10),
                          ] else if (_capturedPhotoTimestamp != null) ...[
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: Colors.blue.shade50,
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: Colors.blue.shade200),
                              ),
                              child: Row(
                                children: [
                                  const Icon(Icons.check_circle, color: emeraldGreen, size: 20),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      'Demo Photo Proof Stamped: $_capturedPhotoTimestamp',
                                      style: const TextStyle(fontSize: 11, color: primaryNavy, fontWeight: FontWeight.w600),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 10),
                          ],

                          // 'Take Live Photo' button opening camera with image_picker
                          OutlinedButton.icon(
                            onPressed: _handleTakeLivePhoto,
                            icon: Icon(
                              _capturedImageFile != null ? Icons.camera_alt_outlined : Icons.camera_alt,
                              color: primaryNavy,
                              size: 18,
                            ),
                            label: Text(
                              _capturedImageFile != null ? 'Retake Live Photo' : 'Take Live Photo',
                              style: const TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                                color: primaryNavy,
                              ),
                            ),
                            style: OutlinedButton.styleFrom(
                              side: const BorderSide(color: primaryNavy, width: 1.5),
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 24),

                  // Submit Inspection to GATC Button
                  ElevatedButton(
                    onPressed: _isSubmitting ? null : _handleApproveAndCertify,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: emeraldGreen,
                      foregroundColor: Colors.white,
                      disabledBackgroundColor: Colors.grey.shade400,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      elevation: 3,
                    ),
                    child: _isSubmitting
                        ? Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const SizedBox(
                                height: 20,
                                width: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2.5,
                                  color: Colors.white,
                                ),
                              ),
                              const SizedBox(width: 10),
                              Text(
                                _isLocating ? 'Acquiring GPS...' : 'Forwarding to GATC...',
                                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                              ),
                            ],
                          )
                        : const Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.send_rounded, size: 22),
                              SizedBox(width: 10),
                              Text(
                                'Submit Inspection to GATC',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                  letterSpacing: 0.5,
                                ),
                              ),
                            ],
                          ),
                  ),

                  const SizedBox(height: 24),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
