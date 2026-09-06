import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'inspection_screen.dart';
import 'login_screen.dart';

class DashboardScreen extends StatefulWidget {
  final String district;
  final String officerEmail;

  const DashboardScreen({
    super.key,
    required this.district,
    required this.officerEmail,
  });

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  // Brand Colors
  static const Color primaryNavy = Color(0xFF002B49);
  static const Color accentGold = Color(0xFFD97706);
  static const Color emeraldGreen = Color(0xFF059669);
  static const Color bgSlate = Color(0xFFF8FAFC);
  static const Color amberPending = Color(0xFFD97706);

  StreamSubscription<List<ConnectivityResult>>? _connectivitySub;

  @override
  void initState() {
    super.initState();
    // Auto-Sync on Dashboard: Check and sync cached offline approvals when loaded
    _checkAndSyncOfflineApprovals();

    // Real-time network listener: Auto-sync queued inspections when internet is restored
    _connectivitySub = Connectivity().onConnectivityChanged.listen((results) {
      final isConnected = results.any((r) => r != ConnectivityResult.none);
      if (isConnected) {
        debugPrint('🌐 Network restored on Dashboard. Auto-syncing pending inspections to GATC server...');
        _checkAndSyncOfflineApprovals();
      }
    });
  }

  @override
  void dispose() {
    _connectivitySub?.cancel();
    super.dispose();
  }

  /// 1. Identify the Officer's District based on logged-in auth email
  String _getOfficerDistrict() {
    final userEmail = Supabase.instance.client.auth.currentUser?.email ?? widget.officerEmail;
    final emailLower = userEmail.toLowerCase();

    if (emailLower.contains('hisar')) {
      return 'Hisar';
    } else if (emailLower.contains('rohtak')) {
      return 'Rohtak';
    }

    if (widget.district.toLowerCase().contains('hisar')) {
      return 'Hisar';
    }
    return 'Rohtak';
  }

  String _getOfficerEmail() {
    return Supabase.instance.client.auth.currentUser?.email ?? widget.officerEmail;
  }

  /// Background check on dashboard load:
  /// If online AND there are cached approvals in SharedPreferences,
  /// loop through them, push updates to Supabase, clear local cache, and notify officer.
  Future<void> _checkAndSyncOfflineApprovals() async {
    try {
      final List<ConnectivityResult> connectivity = await Connectivity().checkConnectivity();
      final bool isConnected = connectivity.any((r) => r != ConnectivityResult.none);
      if (!isConnected) return;

      final SharedPreferences prefs = await SharedPreferences.getInstance();
      final List<String>? offlineQueue = prefs.getStringList('offline_pending_approvals');

      if (offlineQueue != null && offlineQueue.isNotEmpty) {
        debugPrint('🔄 Found ${offlineQueue.length} offline approvals to sync to Supabase...');
        final supabase = Supabase.instance.client;
        int syncedCount = 0;

        for (final raw in List<String>.from(offlineQueue)) {
          try {
            final Map<String, dynamic> item = jsonDecode(raw);
            final String traderId = item['id'].toString();

            await supabase.from('traders_list').update({
              'status': 'Under_Review',
              'latitude': item['latitude'],
              'longitude': item['longitude'],
              'updated_at': DateTime.now().toIso8601String(),
              'photo_url': item['photo_path'] ?? item['photo_url'],
              'checklist_confirmed': true,
              'lmo_id': item['lmo_id'] ?? _getOfficerEmail(),
            }).eq('id', traderId);

            syncedCount++;
          } catch (e) {
            debugPrint('Error syncing single offline trader: $e');
          }
        }

        // Clear local cache once pushed
        await prefs.remove('offline_pending_approvals');
        debugPrint('🧹 Local offline sync cache cleared.');

        if (mounted && syncedCount > 0) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Row(
                children: [
                  Icon(Icons.cloud_done, color: Colors.white, size: 20),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text('Cached inspections synced with GATC server.'),
                  ),
                ],
              ),
              backgroundColor: emeraldGreen,
              duration: Duration(seconds: 4),
            ),
          );
        }
      }
    } catch (e) {
      debugPrint('Offline auto-sync check error: $e');
    }
  }

  Future<void> _handleLogout() async {
    final shouldLogout = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Confirm Logout'),
        content: const Text('Are you sure you want to end your officer inspection session?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: primaryNavy,
              foregroundColor: Colors.white,
            ),
            child: const Text('Logout'),
          ),
        ],
      ),
    );

    if (shouldLogout == true) {
      try {
        await Supabase.instance.client.auth.signOut();
      } catch (e) {
        debugPrint('Signout note: $e');
      }
      if (mounted) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (context) => const LoginScreen()),
        );
      }
    }
  }

  void _openInspectionScreen(Map<String, dynamic> trader, String officerEmail) async {
    final result = await Navigator.push<bool>(
      context,
      MaterialPageRoute(
        builder: (context) => InspectionScreen(
          trader: trader,
          officerEmail: officerEmail,
        ),
      ),
    );

    if (!mounted) return;

    if (result == true) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Inspection forwarded to GATC for "${trader['shop_name'] ?? trader['trader_name'] ?? 'Application #${trader['id']}'}".',
          ),
          backgroundColor: emeraldGreen,
          duration: const Duration(seconds: 3),
        ),
      );
      _checkAndSyncOfflineApprovals();
    }
  }

  @override
  Widget build(BuildContext context) {
    final officerDistrict = _getOfficerDistrict();
    final officerEmail = _getOfficerEmail();

    return Scaffold(
      backgroundColor: bgSlate,
      appBar: AppBar(
        backgroundColor: primaryNavy,
        elevation: 1,
        automaticallyImplyLeading: false,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.shield, color: accentGold, size: 16),
                const SizedBox(width: 6),
                Text(
                  '$officerDistrict LMO Inspection Queue',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
              ],
            ),
            Text(
              'Officer: $officerEmail',
              style: const TextStyle(
                fontSize: 11,
                color: Colors.white70,
                fontWeight: FontWeight.normal,
              ),
            ),
          ],
        ),
        actions: [
          // District Badge
          Container(
            margin: const EdgeInsets.symmetric(vertical: 10, horizontal: 4),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: Colors.white30),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.location_on, color: accentGold, size: 14),
                const SizedBox(width: 4),
                Text(
                  officerDistrict,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
          // Logout Button
          IconButton(
            icon: const Icon(Icons.logout, color: Colors.white70),
            tooltip: 'Sign Out',
            onPressed: _handleLogout,
          ),
        ],
      ),
      body: Column(
        children: [
          // Tricolor Header Border
          Row(
            children: [
              Expanded(child: Container(height: 3, color: const Color(0xFFFF9933))),
              Expanded(child: Container(height: 3, color: Colors.white)),
              Expanded(child: Container(height: 3, color: const Color(0xFF138808))),
            ],
          ),

          // Queue Summary Sub-header
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
            decoration: BoxDecoration(
              color: Colors.white,
              border: Border(bottom: BorderSide(color: Colors.grey.shade200)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: amberPending.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(Icons.pending_actions, color: amberPending, size: 18),
                    ),
                    const SizedBox(width: 10),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Pending Stamping & Verification',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                            color: primaryNavy,
                          ),
                        ),
                        Text(
                          'Rule 14 • Annual / Biennial Mandatory Re-verification',
                          style: TextStyle(fontSize: 10, color: Colors.grey.shade600),
                        ),
                      ],
                    ),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xFFE0F2FE),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFBAE6FD)),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.sync, size: 12, color: Color(0xFF0369A1)),
                      SizedBox(width: 4),
                      Text(
                        'Live Supabase',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF0369A1),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // 2. Fetch Live Data from Supabase with StreamBuilder
          Expanded(
            child: StreamBuilder<List<Map<String, dynamic>>>(
              stream: Supabase.instance.client
                  .from('traders_list')
                  .stream(primaryKey: ['id'])
                  .eq('status', 'Pending_Inspection')
                  .eq('district', officerDistrict),
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        CircularProgressIndicator(color: primaryNavy),
                        SizedBox(height: 12),
                        Text(
                          'Connecting to live Supabase inspection queue...',
                          style: TextStyle(fontSize: 12, color: Colors.grey),
                        ),
                      ],
                    ),
                  );
                }

                if (snapshot.hasError) {
                  return Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24.0),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.error_outline, size: 48, color: Colors.redAccent),
                          const SizedBox(height: 12),
                          Text(
                            'Error loading applications from Supabase:\n${snapshot.error}',
                            textAlign: TextAlign.center,
                            style: const TextStyle(fontSize: 13, color: Colors.black87),
                          ),
                          const SizedBox(height: 16),
                          OutlinedButton.icon(
                            onPressed: () {
                              setState(() {});
                            },
                            icon: const Icon(Icons.refresh, size: 16),
                            label: const Text('Retry Connection'),
                          ),
                        ],
                      ),
                    ),
                  );
                }

                final traders = snapshot.data ?? [];

                if (traders.isEmpty) {
                  return Center(
                    child: Padding(
                      padding: const EdgeInsets.all(32.0),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: Colors.green.shade50,
                              shape: BoxShape.circle,
                            ),
                            child: Icon(Icons.check_circle_outline, size: 48, color: Colors.green.shade600),
                          ),
                          const SizedBox(height: 16),
                          const Text(
                            'All Inspections Complete!',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: primaryNavy,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            'No pending applications found in district "$officerDistrict".\nLive Supabase queue is up to date.',
                            textAlign: TextAlign.center,
                            style: const TextStyle(fontSize: 12, color: Colors.black54),
                          ),
                        ],
                      ),
                    ),
                  );
                }

                return ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: traders.length,
                  separatorBuilder: (context, index) => const SizedBox(height: 12),
                  itemBuilder: (context, index) {
                    final trader = traders[index];
                    return _buildTraderCard(trader, officerDistrict, officerEmail);
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  /// 3. Bind Live Supabase Database Fields to UI Material Cards
  Widget _buildTraderCard(
    Map<String, dynamic> trader,
    String officerDistrict,
    String officerEmail,
  ) {
    // Map actual database fields from traders_list row:
    final shopName = (trader['shop_name'] ?? trader['trader_name'] ?? 'Unknown Commercial Establishment').toString();
    final address = (trader['address'] ?? '$officerDistrict, Haryana').toString();
    final instrument = (trader['instrument'] ?? trader['instrument_type'] ?? 'Weighing Instrument').toString();
    final ownerName = (trader['owner_name'] ?? 'Proprietor').toString();
    final licenseNumber = (trader['license_number'] ?? 'APP-${trader['id']}').toString();
    final status = (trader['status'] ?? 'Pending_Inspection').toString();
    final displayStatus = status.replaceAll('_', ' ');

    return Card(
      elevation: 1.5,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: BorderSide(color: Colors.grey.shade200),
      ),
      color: Colors.white,
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        // Pass specific row's exact 'id' and full row payload to InspectionScreen
        onTap: () => _openInspectionScreen(trader, officerEmail),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Top Row: Shop Name and Status Chip
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          shopName,
                          style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                            color: primaryNavy,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Row(
                          children: [
                            const Icon(Icons.person_outline, size: 13, color: Colors.black54),
                            const SizedBox(width: 4),
                            Text(
                              ownerName,
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w500,
                                color: Colors.grey.shade700,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFEF3C7),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFFDE68A)),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          width: 6,
                          height: 6,
                          decoration: const BoxDecoration(
                            shape: BoxShape.circle,
                            color: Color(0xFFD97706),
                          ),
                        ),
                        const SizedBox(width: 5),
                        Text(
                          displayStatus,
                          style: const TextStyle(
                            color: Color(0xFF92400E),
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              const Divider(height: 1),
              const SizedBox(height: 10),

              // Details Grid: Instrument & Registration
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'INSTRUMENT',
                          style: TextStyle(
                            fontSize: 9,
                            fontWeight: FontWeight.bold,
                            color: Colors.black45,
                            letterSpacing: 0.5,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          instrument,
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: primaryNavy,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'APPLICATION / LIC NO.',
                          style: TextStyle(
                            fontSize: 9,
                            fontWeight: FontWeight.bold,
                            color: Colors.black45,
                            letterSpacing: 0.5,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          licenseNumber,
                          style: TextStyle(
                            fontSize: 11,
                            fontFamily: 'monospace',
                            fontWeight: FontWeight.bold,
                            color: Colors.grey.shade800,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),

              // Address Row
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.store_mall_directory_outlined, size: 14, color: Colors.grey.shade600),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      address,
                      style: TextStyle(fontSize: 11, color: Colors.grey.shade700),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // Bottom Action Button
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 8),
                decoration: BoxDecoration(
                  color: primaryNavy.withValues(alpha: 0.05),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.fact_check_outlined, size: 16, color: primaryNavy),
                    SizedBox(width: 6),
                    Text(
                      'Conduct Physical Verification Checklist',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: primaryNavy,
                      ),
                    ),
                    SizedBox(width: 4),
                    Icon(Icons.arrow_forward, size: 14, color: primaryNavy),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
