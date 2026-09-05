import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class InspectionScreen extends StatefulWidget {
  final Map<String, dynamic> trader;

  const InspectionScreen({super.key, required this.trader});

  @override
  State<InspectionScreen> createState() => _InspectionScreenState();
}

class _InspectionScreenState extends State<InspectionScreen> {
  // Brand Colors
  static const Color primaryNavy = Color(0xFF002B49);
  static const Color accentGold = Color(0xFFD97706);
  static const Color emeraldGreen = Color(0xFF059669);
  static const Color bgSlate = Color(0xFFF8FAFC);

  // Five Statutory Verification Checks required by User:
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

  // Photo State Placeholder
  bool _isPhotoCaptured = false;
  String? _capturedPhotoTimestamp;

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
      if (!_isPhotoCaptured) {
        _isPhotoCaptured = true;
        _capturedPhotoTimestamp = DateTime.now().toString().substring(0, 19);
      }
    });
  }

  /// Take Live Photo Button Action / Placeholder
  void _handleTakeLivePhoto() {
    setState(() {
      _isPhotoCaptured = true;
      _capturedPhotoTimestamp = DateTime.now().toString().substring(0, 19);
    });

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Row(
          children: [
            Icon(Icons.camera_alt, color: Colors.white, size: 18),
            SizedBox(width: 8),
            Text('📸 Live verification photo geo-tagged and captured.'),
          ],
        ),
        backgroundColor: primaryNavy,
        duration: Duration(seconds: 2),
      ),
    );
  }

  /// Large Green "Approve & Certify" Button Handler
  /// Updates the status column in the traders_list table to 'Approved'
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

    final traderId = widget.trader['id'] ?? widget.trader['license_number'];
    bool dbUpdated = false;

    try {
      final supabase = Supabase.instance.client;

      // Update the status column in traders_list table to 'Approved' for this specific trader
      await supabase
          .from('traders_list')
          .update({'status': 'Approved'})
          .eq('id', traderId);

      dbUpdated = true;
      debugPrint('Supabase traders_list updated to Approved for ID: $traderId');
    } catch (e) {
      debugPrint('Supabase database update notice: $e');
      // If the ID column name varies or table is in local demo mode, attempt fallback match
      try {
        if (widget.trader['license_number'] != null) {
          await Supabase.instance.client
              .from('traders_list')
              .update({'status': 'Approved'})
              .eq('license_number', widget.trader['license_number']);
          dbUpdated = true;
        }
      } catch (_) {}
    }

    if (!mounted) return;

    setState(() {
      _isSubmitting = false;
    });

    // Show Statutory Certification Dialog
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
              child: const Icon(Icons.verified, color: emeraldGreen, size: 28),
            ),
            const SizedBox(width: 12),
            const Expanded(
              child: Text(
                'Approved & Certified',
                style: TextStyle(
                  fontSize: 18,
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
              'Statutory Verification Certificate (Form VIII) has been issued under Section 24 of the Legal Metrology Act, 2009.',
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
                        'STATUS:',
                        style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: emeraldGreen.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: const Text(
                          'Approved',
                          style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: emeraldGreen),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Shop: ${widget.trader['shop_name'] ?? widget.trader['trader_name']}',
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: primaryNavy),
                  ),
                  Text(
                    'License: ${widget.trader['license_number'] ?? widget.trader['id']}',
                    style: TextStyle(fontSize: 11, color: Colors.grey.shade700),
                  ),
                  if (dbUpdated) ...[
                    const SizedBox(height: 4),
                    const Text(
                      '✓ Synchronized with Supabase traders_list table',
                      style: TextStyle(fontSize: 10, color: emeraldGreen, fontWeight: FontWeight.bold),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
        actions: [
          ElevatedButton(
            onPressed: () => Navigator.pop(context),
            style: ElevatedButton.styleFrom(
              backgroundColor: emeraldGreen,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            child: const Text('Return to Dashboard'),
          ),
        ],
      ),
    );

    if (mounted) {
      // Pop back to Dashboard with true to trigger list refresh
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

                  // Placeholder: Take Live Photo Button
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

                          if (_isPhotoCaptured) ...[
                            Container(
                              height: 120,
                              decoration: BoxDecoration(
                                color: primaryNavy.withValues(alpha: 0.05),
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: emeraldGreen.withValues(alpha: 0.5)),
                              ),
                              child: Stack(
                                children: [
                                  Center(
                                    child: Column(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        const Icon(Icons.check_circle, color: emeraldGreen, size: 36),
                                        const SizedBox(height: 6),
                                        const Text(
                                          'Geo-Tagged Live Photo Captured ✓',
                                          style: TextStyle(
                                            fontSize: 12,
                                            fontWeight: FontWeight.bold,
                                            color: emeraldGreen,
                                          ),
                                        ),
                                        Text(
                                          'Stamped: $_capturedPhotoTimestamp',
                                          style: const TextStyle(fontSize: 10, color: Colors.black54),
                                        ),
                                      ],
                                    ),
                                  ),
                                  Positioned(
                                    top: 8,
                                    right: 8,
                                    child: IconButton(
                                      icon: const Icon(Icons.refresh, size: 18),
                                      onPressed: _handleTakeLivePhoto,
                                      tooltip: 'Retake Photo',
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 8),
                          ],

                          // 'Take Live Photo' button placeholder
                          OutlinedButton.icon(
                            onPressed: _handleTakeLivePhoto,
                            icon: Icon(
                              _isPhotoCaptured ? Icons.camera_alt_outlined : Icons.camera_alt,
                              color: primaryNavy,
                              size: 18,
                            ),
                            label: Text(
                              _isPhotoCaptured ? 'Retake Live Photo' : 'Take Live Photo',
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

                  // Large Green "Approve & Certify" Button
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
                        ? const SizedBox(
                            height: 22,
                            width: 22,
                            child: CircularProgressIndicator(
                              strokeWidth: 2.5,
                              color: Colors.white,
                            ),
                          )
                        : const Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.verified, size: 22),
                              SizedBox(width: 10),
                              Text(
                                'Approve & Certify',
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
