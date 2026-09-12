import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../services/offline_sync_service.dart';
import 'login_screen.dart';
import 'inspection_screen.dart';

class DashboardScreen extends StatefulWidget {
  final String district;
  final String officerEmail;

  const DashboardScreen({
    super.key,
    this.district = 'Hisar',
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
  List<Map<String, dynamic>>? _fallbackTraders;
  bool _isLoadingFallback = false;
  bool _hasTriggeredFallback = false;

  @override
  void initState() {
    super.initState();
    _selectedDistrict = widget.district.isNotEmpty ? widget.district : 'Hisar';
    OfflineSyncService().addListener(_onSyncServiceUpdated);
    OfflineSyncService().loadOfflineApprovals();
    _fetchFallbackData();
  }

  @override
  void dispose() {
    OfflineSyncService().removeListener(_onSyncServiceUpdated);
    super.dispose();
  }

  void _onSyncServiceUpdated() {
    if (mounted) {
      setState(() {});
    }
  }

  Future<void> _fetchFallbackData() async {
    if (!mounted) return;
    setState(() {
      _isLoadingFallback = true;
    });

    try {
      // Fetch traders where status is 'Pending_LMO'
      final List<dynamic> response = await Supabase.instance.client
          .from('traders_list')
          .select()
          .eq('status', 'Pending_LMO');

      if (mounted) {
        setState(() {
          _fallbackTraders = List<Map<String, dynamic>>.from(response);
          _isLoadingFallback = false;
        });
      }
    } catch (e) {
      debugPrint('Fallback select error: $e');
      if (mounted) {
        setState(() {
          _fallbackTraders ??= [];
          _isLoadingFallback = false;
        });
      }
    }
  }

  void _triggerFallbackIfNeeded() {
    if (!_hasTriggeredFallback && !_isLoadingFallback) {
      _hasTriggeredFallback = true;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) {
          _fetchFallbackData();
        }
      });
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
    await _fetchFallbackData();

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
              'Live stream offline. Showing cached / REST data...',
              style: TextStyle(
                color: Color(0xFF92400E),
                fontSize: 13,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          if (_isLoadingFallback)
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
              tooltip: 'Retry fetch',
              onPressed: _fetchFallbackData,
            ),
        ],
      ),
    );
  }

  Widget _buildDistrictFilterBar() {
    final districts = ['Hisar', 'Rohtak', 'All'];
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
    final filteredTraders = allTraders.where((t) {
      if (_selectedDistrict.toLowerCase() == 'all') return true;
      final d = (t['district'] ?? '').toString().toLowerCase();
      return d == _selectedDistrict.toLowerCase();
    }).toList();

    if (filteredTraders.isEmpty) {
      return Center(
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
                'All commercial instruments in this jurisdiction have been processed or forwarded to GATC.',
                style: TextStyle(fontSize: 12, color: Colors.black45),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
      itemCount: filteredTraders.length,
      itemBuilder: (context, index) {
        final trader = filteredTraders[index];
        final traderName = trader['trader_name']?.toString() ?? 'Commercial Trader';
        final ownerName = trader['owner_name']?.toString() ?? '';
        final instrumentType = trader['instrument_type']?.toString() ?? 'Weighing Scale';
        final licenseNumber = trader['license_number']?.toString() ?? '';
        final district = trader['district']?.toString() ?? '';

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
                await _fetchFallbackData();
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
                            Text(
                              'Lic: $licenseNumber • District: $district',
                              style: TextStyle(
                                fontSize: 11,
                                fontFamily: 'monospace',
                                color: Colors.grey.shade600,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const Icon(Icons.arrow_forward_ios_rounded, size: 14, color: Colors.black38),
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
            onPressed: _fetchFallbackData,
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
          _buildDistrictFilterBar(),
          Expanded(
            child: RefreshIndicator(
              onRefresh: _fetchFallbackData,
              child: StreamBuilder<List<Map<String, dynamic>>>(
                stream: Supabase.instance.client
                    .from('traders_list')
                    .stream(primaryKey: ['license_number'])
                    .eq('status', 'Pending_LMO'),
                builder: (context, snapshot) {
                  // 1. Error handling fallback
                  if (snapshot.hasError) {
                    _triggerFallbackIfNeeded();

                    return Column(
                      children: [
                        _buildOfflineBanner(),
                        Expanded(
                          child: _isLoadingFallback && _fallbackTraders == null
                              ? const Center(child: CircularProgressIndicator())
                              : _buildTraderList(_fallbackTraders ?? []),
                        ),
                      ],
                    );
                  }

                  // 2. Initial loading state before stream emits and without cached data
                  if (snapshot.connectionState == ConnectionState.waiting && _fallbackTraders == null) {
                    return const Center(
                      child: CircularProgressIndicator(),
                    );
                  }

                  // 3. Live stream data state: update cached copy
                  if (snapshot.hasData && snapshot.data != null) {
                    _fallbackTraders = snapshot.data;
                    _hasTriggeredFallback = false;
                  }

                  final traders = snapshot.data ?? _fallbackTraders ?? [];
                  return _buildTraderList(traders);
                },
              ),
            ),
          ),
        ],
      ),
    );
  }
}
