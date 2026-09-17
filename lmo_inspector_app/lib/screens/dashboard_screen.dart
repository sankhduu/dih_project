import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:supabase_flutter/supabase_flutter.dart';
import '../services/offline_sync_service.dart';
import '../services/mpe_calculator_service.dart';
import 'login_screen.dart';
import 'inspection_screen.dart';

class DashboardScreen extends StatefulWidget {
  final String district;
  final String officerEmail;

  const DashboardScreen({
    super.key,
    this.district = 'All',
    this.officerEmail = '',
  });

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  static const Color primaryNavy = Color(0xFF002B49);
  static const Color accentGold = Color(0xFFD97706);
  static const Color emeraldGreen = Color(0xFF059669);

  late String _selectedDistrict;
  List<Map<String, dynamic>> _liveTraders = [];
  bool _isLoading = true;
  String? _errorMessage;
  StreamSubscription<List<Map<String, dynamic>>>? _streamSubscription;

  @override
  void initState() {
    super.initState();
    _selectedDistrict = widget.district.isNotEmpty ? widget.district : 'All';
    OfflineSyncService().addListener(_onSyncServiceUpdated);
    OfflineSyncService().loadOfflineApprovals();

    // 1. Force live REST fetch on screen load (bypassing any stale offline cache)
    _fetchLiveTraders();

    // 2. Setup Realtime subscription to receive instant updates
    _setupRealtimeSubscription();
  }

  @override
  void dispose() {
    _streamSubscription?.cancel();
    OfflineSyncService().removeListener(_onSyncServiceUpdated);
    super.dispose();
  }

  void _onSyncServiceUpdated() {
    if (mounted) {
      setState(() {});
    }
  }

  /// Force a live REST fetch directly from Supabase traders_list table with status 'Pending_LMO'
  Future<void> _fetchLiveTraders() async {
    if (!mounted) return;
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      // Direct live REST fetch from Supabase traders_list table matching Pending_LMO (or equivalents)
      final List<dynamic> response = await Supabase.instance.client
          .from('traders_list')
          .select()
          .or('status.eq.Pending_LMO,status.eq.Pending_Inspection,status.eq.Pending');

      if (mounted) {
        setState(() {
          _liveTraders = List<Map<String, dynamic>>.from(response);
          _isLoading = false;
        });
        debugPrint('✅ [LMO Dashboard] Live REST fetch loaded ${_liveTraders.length} Pending_LMO applications.');
      }
    } catch (e) {
      debugPrint('⚠️ [LMO Dashboard] Supabase direct REST fetch notice: $e');

      // Fallback: Check local Express/Next.js API server
      try {
        final apiUri = Uri.parse('http://localhost:5000/api/traders?status=Pending_LMO');
        final httpRes = await http.get(apiUri).timeout(const Duration(seconds: 4));
        if (httpRes.statusCode == 200) {
          final body = json.decode(httpRes.body);
          if (body['success'] == true && body['data'] is List) {
            final List list = body['data'];
            if (mounted) {
              setState(() {
                _liveTraders = List<Map<String, dynamic>>.from(list);
                _isLoading = false;
              });
              return;
            }
          }
        }
      } catch (apiErr) {
        debugPrint('⚠️ [LMO Dashboard] API fallback notice: $apiErr');
      }

      if (mounted) {
        setState(() {
          _errorMessage = e.toString();
          _isLoading = false;
        });
      }
    }
  }

  /// Setup Realtime stream to dynamically receive newly inserted applications
  void _setupRealtimeSubscription() {
    try {
      _streamSubscription = Supabase.instance.client
          .from('traders_list')
          .stream(primaryKey: ['license_number'])
          .listen(
        (data) {
          if (mounted) {
            final pending = data.where((item) {
              final s = (item['status'] ?? '').toString().trim().toLowerCase();
              return s == 'pending_lmo' || s == 'pending_inspection' || s == 'pending';
            }).toList();
            setState(() {
              _liveTraders = pending;
              _isLoading = false;
            });
            debugPrint('⚡ [LMO Dashboard] Realtime stream event: ${pending.length} pending rows.');
          }
        },
        onError: (err) {
          debugPrint('⚠️ [LMO Dashboard] Realtime stream notice (REST remains active): $err');
        },
      );
    } catch (e) {
      debugPrint('⚠️ [LMO Dashboard] Realtime setup notice: $e');
    }
  }

  Future<void> _handleLogout() async {
    try {
      await Supabase.instance.client.auth.signOut();
    } catch (e) {
      debugPrint('Sign out error: $e');
    }
    if (mounted) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (context) => const LoginScreen()),
      );
    }
  }

  Future<void> _handleManualSync() async {
    final scaffoldMessenger = ScaffoldMessenger.of(context);
    final result = await OfflineSyncService().syncOfflineQueue();
    await _fetchLiveTraders();

    scaffoldMessenger.showSnackBar(
      SnackBar(
        content: Row(
          children: [
            Icon(
              result.success ? Icons.cloud_done : Icons.warning_amber_rounded,
              color: Colors.white,
              size: 18,
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                result.success
                    ? 'Synced ${result.syncedCount} offline approval(s) to Supabase!'
                    : 'Sync incomplete. ${result.remainingCount} pending in queue.',
              ),
            ),
          ],
        ),
        backgroundColor: result.success ? emeraldGreen : accentGold,
        duration: const Duration(seconds: 3),
      ),
    );
  }

  Widget _buildOfflineBanner() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: const Color(0xFFFEF3C7), // Amber 100
        border: Border(
          bottom: BorderSide(color: Colors.amber.shade300),
        ),
      ),
      child: Row(
        children: [
          const Icon(
            Icons.sync_problem_rounded,
            color: Color(0xFFB45309),
            size: 20,
          ),
          const SizedBox(width: 10),
          const Expanded(
            child: Text(
              'Offline or connection notice. Showing local records.',
              style: TextStyle(
                color: Color(0xFF92400E),
                fontSize: 13,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          if (_isLoading)
            const SizedBox(
              width: 14,
              height: 14,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: Color(0xFFB45309),
              ),
            )
          else
            IconButton(
              icon: const Icon(Icons.refresh, size: 18, color: Color(0xFFB45309)),
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(),
              tooltip: 'Retry live fetch',
              onPressed: _fetchLiveTraders,
            ),
        ],
      ),
    );
  }

  Widget _buildDistrictFilterBar() {
    final districts = [
      'All',
      'Rohtak',
      'Hisar',
      'Gurugram',
      'Faridabad',
      'Ambala',
      'Panipat',
      'Karnal',
      'Sonipat',
    ];

    return Container(
      color: Colors.white,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: [
          const Text(
            'District:',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: Colors.black54,
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: districts.map((district) {
                  final isSelected = _selectedDistrict.toLowerCase() == district.toLowerCase();
                  return Padding(
                    padding: const EdgeInsets.only(right: 6),
                    child: ChoiceChip(
                      label: Text(district),
                      selected: isSelected,
                      selectedColor: primaryNavy,
                      labelStyle: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: isSelected ? Colors.white : Colors.black87,
                      ),
                      backgroundColor: Colors.grey.shade100,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      onSelected: (selected) {
                        if (selected) {
                          setState(() {
                            _selectedDistrict = district;
                          });
                        }
                      },
                    ),
                  );
                }).toList(),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTraderList(List<Map<String, dynamic>> allTraders) {
    // Enrich each trader with SRI risk score and complaints
    for (final t in allTraders) {
      final instrumentType = t['instrument_type']?.toString() ?? 'Weighing Scale';
      final licenseNumber = t['license_number']?.toString() ?? '';
      final sri = MpeCalculatorService.calculateSriScore(
        instrumentType: instrumentType,
        licenseNumber: licenseNumber,
        explicitRiskScore: t['risk_score'] != null ? int.tryParse(t['risk_score'].toString()) : null,
        explicitRiskTier: t['risk_tier']?.toString(),
        explicitComplaints: t['complaints_count'] != null ? int.tryParse(t['complaints_count'].toString()) : null,
      );
      t['risk_score'] = sri['score'];
      t['risk_tier'] = sri['tier'];
      t['complaints_count'] = sri['complaints'];
    }

    final filteredTraders = allTraders.where((t) {
      if (_selectedDistrict.toLowerCase() == 'all') return true;
      final d = (t['district'] ?? '').toString().toLowerCase();
      return d == _selectedDistrict.toLowerCase();
    }).toList();

    // Auto-sort descending by SRI Risk score so high-risk traders appear first!
    filteredTraders.sort((a, b) {
      final sa = (a['risk_score'] ?? 0) as int;
      final sb = (b['risk_score'] ?? 0) as int;
      return sb.compareTo(sa);
    });

    if (filteredTraders.isEmpty) {
      return LayoutBuilder(
        builder: (context, constraints) => SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          child: ConstrainedBox(
            constraints: BoxConstraints(minHeight: constraints.maxHeight),
            child: Center(
              child: Padding(
                padding: const EdgeInsets.all(32),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.inventory_2_outlined, size: 48, color: Colors.grey.shade400),
                    const SizedBox(height: 12),
                    Text(
                      'No pending inspections for $_selectedDistrict.',
                      style: TextStyle(fontSize: 15, color: Colors.grey.shade700, fontWeight: FontWeight.w500),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 6),
                    const Text(
                      'Pull down to refresh or tap "Show All Districts" to view applications across Haryana.',
                      style: TextStyle(fontSize: 12, color: Colors.black45),
                      textAlign: TextAlign.center,
                    ),
                    if (_selectedDistrict.toLowerCase() != 'all') ...[
                      const SizedBox(height: 16),
                      ElevatedButton.icon(
                        onPressed: () {
                          setState(() {
                            _selectedDistrict = 'All';
                          });
                        },
                        icon: const Icon(Icons.public, size: 16),
                        label: const Text('Show All Districts'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: primaryNavy,
                          foregroundColor: Colors.white,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ),
        ),
      );
    }

    return ListView.builder(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
      itemCount: filteredTraders.length,
      itemBuilder: (context, index) {
        final trader = filteredTraders[index];
        final traderName = trader['trader_name']?.toString() ?? trader['shop_name']?.toString() ?? 'Commercial Trader';
        final ownerName = trader['owner_name']?.toString() ?? '';
        final instrumentType = trader['instrument_type']?.toString() ?? 'Weighing Scale';
        final licenseNumber = trader['license_number']?.toString() ?? '';
        final district = trader['district']?.toString() ?? 'Hisar';
        final riskScore = (trader['risk_score'] ?? 20) as int;
        final riskTier = (trader['risk_tier'] ?? 'LOW').toString();
        final complaintsCount = (trader['complaints_count'] ?? 0) as int;

        final bool isSavedOffline = OfflineSyncService().isSavedOffline(licenseNumber);

        return Card(
          elevation: 1.5,
          margin: const EdgeInsets.symmetric(vertical: 6),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
            side: isSavedOffline
                ? BorderSide(color: Colors.amber.shade400, width: 1.5)
                : BorderSide.none,
          ),
          child: InkWell(
            borderRadius: BorderRadius.circular(12),
            onTap: () async {
              final result = await Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => InspectionScreen(
                    traderName: traderName,
                    licenseNumber: licenseNumber,
                    trader: trader,
                    officerEmail: widget.officerEmail,
                  ),
                ),
              );

              if (result == true) {
                await _fetchLiveTraders();
              }
            },
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: isSavedOffline
                              ? Colors.amber.shade50
                              : primaryNavy.withValues(alpha: 0.08),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Icon(
                          isSavedOffline ? Icons.save_rounded : Icons.store_mall_directory_rounded,
                          color: isSavedOffline ? accentGold : primaryNavy,
                          size: 22,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              traderName,
                              style: const TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.bold,
                                color: primaryNavy,
                              ),
                            ),
                            if (ownerName.isNotEmpty)
                              Text(
                                'Prop: $ownerName',
                                style: const TextStyle(fontSize: 12, color: Colors.black54),
                              ),
                          ],
                        ),
                      ),
                      // Status Badge / Saved Offline Chip
                      if (isSavedOffline)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFEF3C7),
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: Colors.amber.shade300),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.save_rounded, size: 12, color: Colors.amber.shade900),
                              const SizedBox(width: 4),
                              Text(
                                'Saved Offline',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.amber.shade900,
                                ),
                              ),
                            ],
                          ),
                        )
                      else
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: Colors.blue.shade50,
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: Colors.blue.shade200),
                          ),
                          child: const Text(
                            'Pending_LMO',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: Color(0xFF1D4ED8),
                            ),
                          ),
                        ),
                    ],
                  ),
                  const Divider(height: 18),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              instrumentType,
                              style: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w500,
                                color: Colors.black87,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 2),
                            Row(
                              children: [
                                Text(
                                  'Lic: $licenseNumber',
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontFamily: 'monospace',
                                    color: Colors.grey.shade600,
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                                  decoration: BoxDecoration(
                                    color: Colors.grey.shade200,
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                  child: Text(
                                    district,
                                    style: const TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.bold,
                                      color: primaryNavy,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      const Icon(Icons.arrow_forward_ios_rounded, size: 14, color: Colors.black38),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: riskTier == 'CRITICAL' || riskScore >= 65
                              ? const Color(0xFFFFF1F2)
                              : riskTier == 'MODERATE' || riskScore >= 40
                                  ? const Color(0xFFFFFBEB)
                                  : const Color(0xFFECFDF5),
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(
                            color: riskTier == 'CRITICAL' || riskScore >= 65
                                ? const Color(0xFFFECDD3)
                                : riskTier == 'MODERATE' || riskScore >= 40
                                    ? const Color(0xFFFDE68A)
                                    : const Color(0xFFA7F3D0),
                          ),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              riskTier == 'CRITICAL' || riskScore >= 65
                                  ? Icons.warning_amber_rounded
                                  : Icons.shield_outlined,
                              size: 11,
                              color: riskTier == 'CRITICAL' || riskScore >= 65
                                  ? const Color(0xFFE11D48)
                                  : riskTier == 'MODERATE' || riskScore >= 40
                                      ? accentGold
                                      : emeraldGreen,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              'SRI: $riskTier ($riskScore/100)',
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w900,
                                color: riskTier == 'CRITICAL' || riskScore >= 65
                                    ? const Color(0xFFE11D48)
                                    : riskTier == 'MODERATE' || riskScore >= 40
                                        ? const Color(0xFF92400E)
                                        : emeraldGreen,
                              ),
                            ),
                          ],
                        ),
                      ),
                      if (complaintsCount > 0) ...[
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFFF1F2),
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: const Color(0xFFFDA4AF)),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.report_problem_rounded, color: Color(0xFFE11D48), size: 11),
                              const SizedBox(width: 4),
                              Text(
                                '⚡ $complaintsCount Complaint${complaintsCount > 1 ? 's' : ''}',
                                style: const TextStyle(
                                  fontSize: 10,
                                  color: Color(0xFF9F1239),
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final pendingCount = OfflineSyncService().pendingApprovalsCount;
    final isSyncing = OfflineSyncService().isSyncing;

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'LMO Inspector Queue',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            Text(
              widget.officerEmail.isNotEmpty
                  ? widget.officerEmail
                  : 'Haryana Legal Metrology Department',
              style: const TextStyle(fontSize: 11, color: Colors.white70),
            ),
          ],
        ),
        actions: [
          // Background Sync / Sync Now Button
          if (isSyncing)
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 12),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  SizedBox(
                    width: 14,
                    height: 14,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.amber),
                  ),
                  SizedBox(width: 6),
                  Text('Syncing...', style: TextStyle(fontSize: 12, color: Colors.amber)),
                ],
              ),
            )
          else if (pendingCount > 0)
            TextButton.icon(
              onPressed: _handleManualSync,
              icon: const Icon(Icons.cloud_upload_rounded, color: Colors.amber, size: 18),
              label: Text(
                'Sync Now ($pendingCount)',
                style: const TextStyle(
                  color: Colors.amber,
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                ),
              ),
            ),

          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'Refresh Queue',
            onPressed: _fetchLiveTraders,
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: 'Sign Out',
            onPressed: _handleLogout,
          ),
        ],
      ),
      body: Column(
        children: [
          if (_errorMessage != null && _liveTraders.isEmpty) _buildOfflineBanner(),
          _buildDistrictFilterBar(),
          Expanded(
            child: RefreshIndicator(
              onRefresh: _fetchLiveTraders,
              color: primaryNavy,
              child: _isLoading && _liveTraders.isEmpty
                  ? const Center(child: CircularProgressIndicator())
                  : _buildTraderList(_liveTraders),
            ),
          ),
        ],
      ),
    );
  }
}
