import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../services/offline_sync_service.dart';
import 'inspection_form.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final ApiService _apiService = ApiService();
  final OfflineSyncService _syncService = OfflineSyncService();

  late Future<List<Trader>> _tradersFuture;
  String _searchQuery = '';
  final TextEditingController _searchController = TextEditingController();

  // Government Brand Color Palette
  static const Color navyBlue = Color(0xFF002B49);
  static const Color accentGold = Color(0xFFD97706);
  static const Color bgLight = Color(0xFFF8FAFC);
  static const Color emeraldGreen = Color(0xFF059669);
  static const Color alertRose = Color(0xFFE11D48);

  @override
  void initState() {
    super.initState();
    _loadTraders();
  }

  void _loadTraders() {
    setState(() {
      _tradersFuture = _apiService.fetchPendingTraders();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _triggerManualSync() async {
    final result = await _syncService.syncOfflineQueue();
    if (!mounted) return;

    if (result.syncedCount > 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('✅ Successfully synced ${result.syncedCount} inspection report(s) to central database!'),
          backgroundColor: emeraldGreen,
        ),
      );
      _loadTraders();
    } else if (!_syncService.isOnline) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('⚠️ Cannot sync while offline. Reports will auto-upload when connection is restored.'),
          backgroundColor: accentGold,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: _syncService,
      builder: (context, _) {
        final isOnline = _syncService.isOnline;
        final pendingCount = _syncService.pendingCount;
        final isSyncing = _syncService.isSyncing;

        return Scaffold(
          backgroundColor: bgLight,
          appBar: PreferredSize(
            preferredSize: const Size.fromHeight(80.0),
            child: AppBar(
              backgroundColor: navyBlue,
              elevation: 2,
              flexibleSpace: Column(
                children: [
                  // Top Tricolor Accent Bar
                  Row(
                    children: [
                      Expanded(child: Container(height: 4, color: const Color(0xFFFF9933))),
                      Expanded(child: Container(height: 4, color: Colors.white)),
                      Expanded(child: Container(height: 4, color: const Color(0xFF138808))),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 2.0),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(6),
                          decoration: BoxDecoration(
                            color: const Color(0x1FFFFFFF),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(Icons.scale_rounded, color: Color(0xFFFBBF24), size: 22),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Row(
                                children: [
                                  const Text(
                                    'e-Māpan',
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.w900,
                                      fontSize: 16,
                                      letterSpacing: -0.2,
                                    ),
                                  ),
                                  const SizedBox(width: 6),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: accentGold.withAlpha(60),
                                      borderRadius: BorderRadius.circular(4),
                                      border: Border.all(color: accentGold.withAlpha(120)),
                                    ),
                                    child: const Text(
                                      'LMO INSPECTOR',
                                      style: TextStyle(
                                        color: Color(0xFFFDE68A),
                                        fontSize: 9,
                                        fontWeight: FontWeight.bold,
                                        letterSpacing: 0.5,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const Text(
                                'Legal Metrology Department • Field App',
                                style: TextStyle(
                                  color: Color(0xFF94A3B8),
                                  fontSize: 11,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                        ),

                        // Network / Sync Status Visual Indicator
                        _buildNetworkSyncIndicator(isOnline, pendingCount, isSyncing),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          body: Column(
            children: [
              // Offline Alert Banner if offline or pending reports exist
              if (!isOnline || pendingCount > 0)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  color: !isOnline ? const Color(0xFFFEF3C7) : const Color(0xFFEFF6FF),
                  child: Row(
                    children: [
                      Icon(
                        !isOnline ? Icons.wifi_off_rounded : Icons.cloud_upload_outlined,
                        size: 16,
                        color: !isOnline ? const Color(0xFF92400E) : const Color(0xFF1E40AF),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          !isOnline
                              ? 'Offline Field Mode • Inspections will queue locally.'
                              : '$pendingCount inspection report(s) queued for auto-sync.',
                          style: TextStyle(
                            fontSize: 11.5,
                            fontWeight: FontWeight.bold,
                            color: !isOnline ? const Color(0xFF92400E) : const Color(0xFF1E40AF),
                          ),
                        ),
                      ),
                      if (pendingCount > 0 && isOnline)
                        GestureDetector(
                          onTap: isSyncing ? null : _triggerManualSync,
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: const Color(0xFF1E40AF),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: isSyncing
                                ? const SizedBox(
                                    width: 12,
                                    height: 12,
                                    child: CircularProgressIndicator(color: Colors.white, strokeWidth: 1.5),
                                  )
                                : const Text(
                                    'Sync Now',
                                    style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                                  ),
                          ),
                        ),
                    ],
                  ),
                ),

              // Search & Filter Header
              Container(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
                color: Colors.white,
                child: TextField(
                  controller: _searchController,
                  onChanged: (val) {
                    setState(() {
                      _searchQuery = val.trim().toLowerCase();
                    });
                  },
                  decoration: InputDecoration(
                    hintText: 'Search trader name, license or scale type...',
                    hintStyle: TextStyle(color: Colors.grey.shade400, fontSize: 13),
                    prefixIcon: const Icon(Icons.search_rounded, color: navyBlue, size: 20),
                    suffixIcon: _searchQuery.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear, size: 18, color: Colors.grey),
                            onPressed: () {
                              _searchController.clear();
                              setState(() {
                                _searchQuery = '';
                              });
                            },
                          )
                        : null,
                    filled: true,
                    fillColor: const Color(0xFFF1F5F9),
                    contentPadding: const EdgeInsets.symmetric(vertical: 0, horizontal: 16),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(color: Colors.grey.shade300),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(color: Colors.grey.shade300),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: navyBlue, width: 1.5),
                    ),
                  ),
                ),
              ),

              // Main List with FutureBuilder
              Expanded(
                child: RefreshIndicator(
                  color: navyBlue,
                  onRefresh: () async {
                    _loadTraders();
                  },
                  child: FutureBuilder<List<Trader>>(
                    future: _tradersFuture,
                    builder: (context, snapshot) {
                      if (snapshot.connectionState == ConnectionState.waiting) {
                        return const Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              CircularProgressIndicator(color: navyBlue),
                              SizedBox(height: 16),
                              Text(
                                'Loading pending field inspections...',
                                style: TextStyle(color: Color(0xFF64748B), fontSize: 13),
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
                                const Icon(Icons.error_outline_rounded, color: alertRose, size: 48),
                                const SizedBox(height: 12),
                                const Text(
                                  'Failed to load inspection list',
                                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  snapshot.error.toString(),
                                  textAlign: TextAlign.center,
                                  style: const TextStyle(color: Colors.grey, fontSize: 12),
                                ),
                                const SizedBox(height: 16),
                                ElevatedButton.icon(
                                  onPressed: _loadTraders,
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: navyBlue,
                                    foregroundColor: Colors.white,
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                  ),
                                  icon: const Icon(Icons.refresh),
                                  label: const Text('Try Again'),
                                ),
                              ],
                            ),
                          ),
                        );
                      }

                      final allTraders = snapshot.data ?? [];
                      final filteredTraders = allTraders.where((t) {
                        if (_searchQuery.isEmpty) return true;
                        return t.traderName.toLowerCase().contains(_searchQuery) ||
                            t.licenseNumber.toLowerCase().contains(_searchQuery) ||
                            t.instrumentType.toLowerCase().contains(_searchQuery) ||
                            t.ownerName.toLowerCase().contains(_searchQuery);
                      }).toList();

                      if (filteredTraders.isEmpty) {
                        return Center(
                          child: Padding(
                            padding: const EdgeInsets.all(32.0),
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.inventory_2_outlined, size: 54, color: Colors.grey.shade400),
                                const SizedBox(height: 14),
                                Text(
                                  _searchQuery.isEmpty
                                      ? 'No Pending Inspections'
                                      : 'No matches found for "$_searchQuery"',
                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                                ),
                                const SizedBox(height: 6),
                                const Text(
                                  'All weighing instruments in this zone are currently inspected and up to date.',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(color: Colors.grey, fontSize: 12),
                                ),
                              ],
                            ),
                          ),
                        );
                      }

                      return ListView.builder(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        itemCount: filteredTraders.length,
                        itemBuilder: (context, index) {
                          final trader = filteredTraders[index];
                          return _buildTraderCard(trader);
                        },
                      );
                    },
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  /// Network & Sync Status Badge
  Widget _buildNetworkSyncIndicator(bool isOnline, int pendingCount, bool isSyncing) {
    if (isSyncing) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: const Color(0x333B82F6),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: const Color(0xFF60A5FA)),
        ),
        child: const Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox(
              width: 10,
              height: 10,
              child: CircularProgressIndicator(color: Colors.white, strokeWidth: 1.5),
            ),
            SizedBox(width: 6),
            Text(
              'Syncing...',
              style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold),
            ),
          ],
        ),
      );
    }

    if (!isOnline) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: const Color(0x33F59E0B),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: const Color(0xFFFBBF24)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.wifi_off_rounded, size: 12, color: Color(0xFFFDE68A)),
            const SizedBox(width: 4),
            Text(
              pendingCount > 0 ? 'Offline ($pendingCount Sync)' : 'Offline Mode',
              style: const TextStyle(color: Color(0xFFFDE68A), fontSize: 10.5, fontWeight: FontWeight.bold),
            ),
          ],
        ),
      );
    }

    if (pendingCount > 0) {
      return GestureDetector(
        onTap: _triggerManualSync,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(
            color: const Color(0x33F59E0B),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: const Color(0xFFF59E0B)),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.sync_rounded, size: 12, color: Color(0xFFFBBF24)),
              const SizedBox(width: 4),
              Text(
                'Sync ($pendingCount Pending)',
                style: const TextStyle(color: Color(0xFFFDE68A), fontSize: 10.5, fontWeight: FontWeight.bold),
              ),
            ],
          ),
        ),
      );
    }

    // Default Online
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: const Color(0x2810B981),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFF34D399)),
      ),
      child: const Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.wifi_rounded, size: 12, color: Color(0xFFA7F3D0)),
          SizedBox(width: 4),
          Text(
            'Online',
            style: TextStyle(color: Color(0xFFA7F3D0), fontSize: 10.5, fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }

  Widget _buildTraderCard(Trader trader) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0A000000),
            blurRadius: 8,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(16),
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => InspectionFormScreen(trader: trader),
              ),
            ).then((_) {
              _loadTraders();
            });
          },
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header row: Trader Name + Status Badge
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Text(
                        trader.traderName,
                        style: const TextStyle(
                          fontWeight: FontWeight.w800,
                          fontSize: 15,
                          color: Color(0xFF0F172A),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    _buildStatusBadge(trader.inspectionStatus),
                  ],
                ),
                const SizedBox(height: 6),

                // Proprietor
                Row(
                  children: [
                    const Icon(Icons.person_outline_rounded, size: 14, color: Color(0xFF64748B)),
                    const SizedBox(width: 4),
                    Text(
                      trader.ownerName,
                      style: const TextStyle(color: Color(0xFF64748B), fontSize: 12, fontWeight: FontWeight.w500),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                const Divider(height: 1, color: Color(0xFFF1F5F9)),
                const SizedBox(height: 10),

                // Specs: License & Instrument Type
                Row(
                  children: [
                    // License Pill
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(color: const Color(0xFFCBD5E1)),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.badge_outlined, size: 12, color: navyBlue),
                          const SizedBox(width: 4),
                          Text(
                            trader.licenseNumber,
                            style: const TextStyle(
                              fontFamily: 'monospace',
                              fontWeight: FontWeight.bold,
                              fontSize: 11,
                              color: navyBlue,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const Spacer(),
                    // Instrument Type
                    Row(
                      children: [
                        const Icon(Icons.precision_manufacturing_outlined, size: 14, color: Color(0xFF475569)),
                        const SizedBox(width: 4),
                        Text(
                          trader.instrumentType,
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF334155),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),

                if (trader.latitude != null && trader.longitude != null) ...[
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const Icon(Icons.location_on_outlined, size: 13, color: Color(0xFF94A3B8)),
                      const SizedBox(width: 4),
                      Text(
                        '${trader.latitude!.toStringAsFixed(4)}° N, ${trader.longitude!.toStringAsFixed(4)}° E (Haryana/NCR)',
                        style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 11),
                      ),
                    ],
                  ),
                ],

                const SizedBox(height: 12),

                // Tap prompt banner
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: const Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Conduct On-Site Stamping Verification',
                        style: TextStyle(
                          color: navyBlue,
                          fontWeight: FontWeight.bold,
                          fontSize: 11,
                        ),
                      ),
                      Icon(Icons.arrow_forward_ios_rounded, size: 11, color: navyBlue),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildStatusBadge(String status) {
    final s = status.toUpperCase();
    Color bgColor = const Color(0xFFFEF3C7); // Amber-100
    Color textColor = const Color(0xFF92400E); // Amber-800
    Color dotColor = const Color(0xFFD97706); // Amber-600

    if (s == 'PASSED') {
      bgColor = const Color(0xFFD1FAE5);
      textColor = const Color(0xFF065F46);
      dotColor = const Color(0xFF059669);
    } else if (s == 'FAILED') {
      bgColor = const Color(0xFFFEE2E2);
      textColor = const Color(0xFF991B1B);
      dotColor = const Color(0xFFDC2626);
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 6,
            height: 6,
            decoration: BoxDecoration(
              color: dotColor,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 4),
          Text(
            status,
            style: TextStyle(
              color: textColor,
              fontWeight: FontWeight.bold,
              fontSize: 10.5,
            ),
          ),
        ],
      ),
    );
  }
}
